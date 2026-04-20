# Security Audit - Remediation Guide

Quick reference for fixing the critical security issues identified in the security audit.

## 🚨 IMMEDIATE ACTIONS (Do Now!)

### 1. Revoke All Exposed API Keys

**Status:** CRITICAL - Compromised in git history

```bash
# Step 1: Identify all exposed tokens (already visible in .env file)
# Step 2: Revoke immediately:

# NVIDIA Build:
# Go to https://build.nvidia.com/settings/api-keys and delete the exposed key
# Generate a new one and save securely

# OpenRouter:
# Go to https://openrouter.ai/keys and regenerate API key

# Telegram:
# Message @BotFather on Telegram and use /token command to regenerate

# Discord:
# Go to Discord Developer Portal, select your bot, regenerate token

# Step 3: Clean git history (⚠️ FORCE PUSH - coordinate with team)
git filter-branch --tree-filter 'rm -f .env' HEAD
git push --force origin main
```

### 2. Fix Critical Authentication Vulnerability

**File:** `free-claude-code/api/dependencies.py`

Replace the `require_api_key` function:

```python
from secrets import compare_digest
from fastapi import Depends, HTTPException, Request, status
from config.settings import Settings

def require_api_key(
    request: Request, settings: Settings = Depends(get_settings)
) -> None:
    """Require a server API key with timing-attack resistance.
    
    CRITICAL: When ANTHROPIC_AUTH_TOKEN is set, ALL endpoints require valid auth.
    """
    anthropic_auth_token = settings.anthropic_auth_token
    
    # In production, auth token is MANDATORY
    if not anthropic_auth_token:
        import os
        if os.environ.get("ENVIRONMENT", "").lower() == "production":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="API authentication not configured"
            )
        # Development: optionally allow
        return

    # Extract token from headers (multiple formats supported)
    header = (
        request.headers.get("x-api-key")
        or request.headers.get("authorization")
        or request.headers.get("anthropic-auth-token")
    )
    
    if not header:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing API key"
        )

    # Support Bearer token format
    token = header
    if header.lower().startswith("bearer "):
        token = header.split(" ", 1)[1]

    # Strip appended model names (: suffix)
    if token and ":" in token:
        token = token.split(":", 1)[0]

    # ✅ Use constant-time comparison to prevent timing attacks
    if not compare_digest(token, anthropic_auth_token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key"
        )
```

### 3. Add Production Environment Validation

**File:** `free-claude-code/config/settings.py`

Add this validator to the Settings class:

```python
@model_validator(mode="after")
def _validate_production_config(self) -> Settings:
    """Enforce security requirements for production deployments."""
    import os
    
    is_production = os.environ.get("ENVIRONMENT", "").lower() == "production"
    
    if is_production:
        # Auth token is mandatory in production
        if not self.anthropic_auth_token or not self.anthropic_auth_token.strip():
            raise ValueError(
                "ANTHROPIC_AUTH_TOKEN is required in production mode. "
                "Set environment variable: ANTHROPIC_AUTH_TOKEN=your-secure-token"
            )
        
        # Don't expose on all interfaces in production
        if self.host == "0.0.0.0":
            raise ValueError(
                "host=0.0.0.0 is not secure in production. "
                "Use a specific interface or set HOSTS=127.0.0.1"
            )
        
        # Require HTTPS
        if not os.environ.get("HTTPS_ONLY", "").lower() == "true":
            logger.warning(
                "HTTPS_ONLY not set to true in production. "
                "Set: HTTPS_ONLY=true"
            )
    
    return self
```

### 4. Fix Sensitive Data Leakage in Logs

**File:** `free-claude-code/api/routes.py`

Remove the FULL_PAYLOAD debug log (line ~50):

```python
# ❌ REMOVE THIS:
# logger.debug("FULL_PAYLOAD [{}]: {}", request_id, request_data.model_dump())

# ✅ REPLACE WITH THIS (metadata only):
logger.info(
    "API_REQUEST: request_id={} model={} messages={} tokens={}",
    request_id,
    request_data.model,
    len(request_data.messages),
    input_tokens,
)
```

Also fix the error handler in `free-claude-code/api/app.py`:

```python
@app.exception_handler(Exception)
async def general_error_handler(request: Request, exc: Exception):
    """Handle general errors - never expose details to clients."""
    
    # ✅ Log details server-side only
    logger.error(f"Unexpected error: {exc!s}", exc_info=True)
    
    # ✅ Return generic message to client
    return JSONResponse(
        status_code=500,
        content={
            "type": "error",
            "error": {
                "type": "api_error",
                "message": "An unexpected error occurred. Please try again later.",
                # Never include: exc_info, traceback, or system details
            },
        },
    )
```

---

## 🔧 SHORT-TERM FIXES (This Week)

### 5. Add CORS Middleware

**File:** `free-claude-code/api/app.py`

Add after FastAPI app creation:

```python
from fastapi.middleware.cors import CORSMiddleware

def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title="Claude Code Proxy",
        version="2.0.0",
        lifespan=lifespan,
    )

    # ✅ ADD CORS MIDDLEWARE
    allowed_origins = os.environ.get(
        "ALLOWED_ORIGINS",
        "http://localhost:3000,https://thegreenteam.in"
    ).split(",")
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST"],
        allow_headers=[
            "Content-Type",
            "x-api-key",
            "Authorization",
            "anthropic-auth-token"
        ],
        expose_headers=["Content-Length", "X-Request-Id"],
        max_age=600,  # 10 minutes
    )

    # ... rest of app creation
```

### 6. Add Security Headers Middleware

**File:** `free-claude-code/api/app.py`

Add new middleware class:

```python
from starlette.middleware.base import BaseHTTPMiddleware

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to all responses."""
    
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        
        # Prevent MIME type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"
        
        # Prevent clickjacking
        response.headers["X-Frame-Options"] = "DENY"
        
        # Enable XSS protection
        response.headers["X-XSS-Protection"] = "1; mode=block"
        
        # Enforce HTTPS (if available)
        response.headers["Strict-Transport-Security"] = (
            "max-age=31536000; includeSubDomains; preload"
        )
        
        # Basic CSP (customize as needed)
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self'; "
            "connect-src 'self' https:;"
        )
        
        return response

# Add to app in create_app():
app.add_middleware(SecurityHeadersMiddleware)
```

### 7. Reduce Default Rate Limits

**File:** `free-claude-code/config/settings.py`

```python
# Change from:
provider_rate_limit: int = Field(default=40, validation_alias="PROVIDER_RATE_LIMIT")
provider_rate_window: int = Field(default=60, validation_alias="PROVIDER_RATE_WINDOW")

# To:
provider_rate_limit: int = Field(default=10, validation_alias="PROVIDER_RATE_LIMIT")
provider_rate_window: int = Field(default=60, validation_alias="PROVIDER_RATE_WINDOW")
```

### 8. Add Input Validation

**File:** `free-claude-code/api/models/anthropic.py`

```python
from pydantic import BaseModel, field_validator

class MessagesRequest(BaseModel):
    model: str
    max_tokens: int | None = None
    messages: list[Message]
    system: str | list[SystemContent] | None = None
    # ... other fields

    @field_validator("messages")
    @classmethod
    def validate_messages(cls, v):
        """Validate message count and structure."""
        if not v:
            raise ValueError("messages cannot be empty")
        if len(v) > 10000:
            raise ValueError("messages cannot exceed 10000 items")
        return v

    @field_validator("system")
    @classmethod
    def validate_system(cls, v):
        """Validate system prompt length."""
        if v is None:
            return v
        
        total_len = 0
        if isinstance(v, str):
            total_len = len(v)
        elif isinstance(v, list):
            for item in v:
                if isinstance(item, dict):
                    if "text" in item:
                        total_len += len(str(item["text"]))
        
        if total_len > 50000:
            raise ValueError("system prompt cannot exceed 50000 characters")
        return v

    @field_validator("max_tokens")
    @classmethod
    def validate_max_tokens(cls, v):
        """Validate max_tokens is reasonable."""
        if v is not None:
            if v < 1 or v > 4096:
                raise ValueError("max_tokens must be between 1 and 4096")
        return v
```

### 9. Update .gitignore and Remove Secrets

**File:** `.gitignore`

```bash
# Verify .env is already here, add if missing:
.env
.env.local
.env.*.local
*.pem
*.key
*.crt
.venv/
__pycache__/
dist/
build/
*.egg-info/
```

Then remove .env from tracking:

```bash
git rm --cached free-claude-code/.env
git add .gitignore
git commit -m "Remove .env from version control"
git push
```

### 10. Fix Host Binding

**File:** `free-claude-code/config/settings.py`

```python
# Change from:
host: str = "0.0.0.0"

# To:
host: str = Field(
    default="127.0.0.1",  # Bind to localhost by default
    validation_alias="HOST",
    description="Server host binding"
)
```

---

## 🛡️ MEDIUM-TERM FIXES (Next Month)

### 11. Encrypt Session Storage

**File:** `free-claude-code/messaging/session.py`

```python
from cryptography.fernet import Fernet
from pathlib import Path
import json

class EncryptedSessionStore:
    """Session store with encryption at rest."""
    
    def __init__(self, storage_path: str, encryption_key: str | None = None):
        self.path = Path(storage_path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        
        # Use provided key or generate one
        if encryption_key:
            self.cipher = Fernet(encryption_key.encode())
        else:
            # In production, load key from secure storage (AWS KMS, Vault, etc.)
            self.cipher = Fernet(Fernet.generate_key())
        
        # Set restrictive permissions
        self.path.chmod(0o600)
    
    def save(self, data: dict) -> None:
        """Save encrypted data."""
        json_data = json.dumps(data)
        encrypted = self.cipher.encrypt(json_data.encode())
        self.path.write_bytes(encrypted)
        self.path.chmod(0o600)
    
    def load(self) -> dict:
        """Load and decrypt data."""
        if not self.path.exists():
            return {}
        
        encrypted = self.path.read_bytes()
        decrypted = self.cipher.decrypt(encrypted)
        return json.loads(decrypted.decode())
```

### 12. Add Audit Logging

**File:** `free-claude-code/api/routes.py`

```python
from datetime import datetime
from typing import Optional

async def log_audit_event(
    event_type: str,
    resource: str,
    action: str,
    result: str,
    user_id: Optional[str] = None,
    details: dict = None
):
    """Log security-relevant events."""
    audit_log = {
        "timestamp": datetime.utcnow().isoformat(),
        "event_type": event_type,
        "resource": resource,
        "action": action,
        "result": result,
        "user_id": user_id or "anonymous",
        "details": details or {},
    }
    
    logger.info(f"AUDIT: {event_type} - {action} on {resource}: {result}")
    # In production, also send to centralized logging (ELK, Datadog, etc.)

# Use in routes:
@router.post("/v1/messages")
async def create_message(
    request_data: MessagesRequest,
    raw_request: Request,
    settings: Settings = Depends(get_settings),
    _auth=Depends(require_api_key),
):
    try:
        # ... existing code ...
        await log_audit_event(
            event_type="API_CALL",
            resource=f"/v1/messages",
            action="create_message",
            result="success",
            details={"model": request_data.model}
        )
    except Exception as e:
        await log_audit_event(
            event_type="API_CALL",
            resource="/v1/messages",
            action="create_message",
            result="error",
            details={"error": str(e)[:100]}  # Truncate
        )
        raise
```

### 13. Implement API Key Rotation

**File:** `free-claude-code/api/routes.py`

```python
from datetime import datetime, timedelta

@router.post("/admin/rotate-api-key")
async def rotate_api_key(
    new_key: str,
    request: Request,
    _auth=Depends(require_api_key)  # Requires current valid key
):
    """Rotate API key (requires current valid auth)."""
    
    # Validate new key format
    if len(new_key) < 32:
        raise HTTPException(
            status_code=400,
            detail="API key must be at least 32 characters"
        )
    
    # In production, store in secure backend:
    # - AWS Secrets Manager
    # - HashiCorp Vault
    # - Azure Key Vault
    
    # For now, requires restart but is still better than nothing
    import os
    os.environ["ANTHROPIC_AUTH_TOKEN"] = new_key
    
    await log_audit_event(
        event_type="SECURITY",
        resource="API_KEY",
        action="rotate",
        result="success"
    )
    
    return {"status": "success", "message": "API key rotated"}
```

---

## 🔍 Testing the Fixes

### Test Authentication

```bash
# Test 1: Request without auth should fail
curl -X POST http://localhost:8082/v1/messages \
  -H "Content-Type: application/json" \
  -d '{"messages": [], "model": "test"}' \
  # Expected: 401 Unauthorized

# Test 2: Request with invalid auth should fail  
curl -X POST http://localhost:8082/v1/messages \
  -H "x-api-key: invalid-key" \
  -H "Content-Type: application/json" \
  -d '{"messages": [], "model": "test"}' \
  # Expected: 401 Unauthorized

# Test 3: Request with valid auth should proceed (or fail on validation, not auth)
curl -X POST http://localhost:8082/v1/messages \
  -H "x-api-key: ${ANTHROPIC_AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"messages": [], "model": "test"}' \
  # Expected: 400 (empty messages) not 401
```

### Test Security Headers

```bash
curl -I http://localhost:8082/

# Check for presence of:
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# Strict-Transport-Security: max-age=31536000
# Content-Security-Policy: default-src 'self'
```

### Test Rate Limiting

```bash
# Send 15 requests in quick succession (should rate limit after 10)
for i in {1..15}; do
  echo "Request $i"
  curl -X GET http://localhost:8082/health \
    -H "x-api-key: ${ANTHROPIC_AUTH_TOKEN}"
  sleep 0.1
done

# Should get 429 Too Many Requests after limit exceeded
```

---

## 📋 Verification Checklist

After implementing these fixes, verify:

- [ ] All API keys rotated and `.env` never committed again
- [ ] Authentication required by default (no open endpoints)
- [ ] Timing-attack resistant token comparison implemented
- [ ] Sensitive data not logged or exposed in errors
- [ ] CORS configured to specific origins only
- [ ] Security headers present in all responses
- [ ] Input validation prevents buffer overflow/injection
- [ ] Rate limiting enforced at 10 req/min or better
- [ ] Host binding to localhost (or specific IP) in production
- [ ] HTTPS enforcement enabled
- [ ] Session storage encrypted
- [ ] Audit logging records all security events
- [ ] Dependencies scanned for vulnerabilities
- [ ] No secrets in git history (history cleaned)

---

## 📞 Support & Questions

Reference the main `SECURITY_AUDIT_REPORT.md` for detailed explanations of each issue.

