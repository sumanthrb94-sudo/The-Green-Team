# Security Audit Checklist - Quick Reference

## 🚨 CRITICAL - Do First (24 hours)

### 1. API Keys Exposure
- [ ] Identify all exposed API keys in `.env`
- [ ] Revoke keys at: NVIDIA Build, OpenRouter, Telegram, Discord
- [ ] Generate new replacement keys
- [ ] Update `.env` with new keys (don't commit)
- [ ] Clean git history: `git filter-branch --tree-filter 'rm -f .env' HEAD`
- [ ] Force push to remote: `git push --force origin main`
- [ ] Verify `.gitignore` contains `.env`
- [ ] Document which keys were exposed in incident log

### 2. Authentication Enforcement
- [ ] Update `require_api_key()` in `free-claude-code/api/dependencies.py`
- [ ] Implement `compare_digest()` for timing-attack resistance
- [ ] Add production validation for `ANTHROPIC_AUTH_TOKEN`
- [ ] Test without auth header → should get 401
- [ ] Test with invalid auth → should get 401
- [ ] Test with valid auth → should proceed
- [ ] Set `ANTHROPIC_AUTH_TOKEN` in production environment

### 3. Stack Trace Exposure
- [ ] Remove `logger.debug("FULL_PAYLOAD"...)` from `routes.py` line ~50
- [ ] Update error handlers to return generic messages
- [ ] Ensure traceback only logged server-side
- [ ] Test error endpoint → verify no stack trace in response
- [ ] Verify sensitive data not in error message

### 4. Log Cleanup  
- [ ] Search for exposed secrets in logs
- [ ] Mask sensitive fields in log output
- [ ] Set appropriate log levels (INFO for prod, DEBUG for dev)
- [ ] Ensure logs stored securely with restricted access

---

## HIGH - Do This Week

### 5. CORS Middleware
- [ ] Add `CORSMiddleware` to `create_app()` in `api/app.py`
- [ ] Configure `allow_origins` to explicit list only
- [ ] Set restrictive `allow_methods` (POST, GET only)
- [ ] Set explicit `allow_headers`
- [ ] Set `max_age` to 600 seconds
- [ ] Test CORS preflight with OPTIONS request

### 6. Security Headers
- [ ] Add `SecurityHeadersMiddleware` class to `api/app.py`
- [ ] Set X-Content-Type-Options: nosniff
- [ ] Set X-Frame-Options: DENY
- [ ] Set X-XSS-Protection: 1; mode=block
- [ ] Set Strict-Transport-Security (if HTTPS)
- [ ] Set Content-Security-Policy
- [ ] Test with `curl -I` → verify headers present
- [ ] Test with browser DevTools → verify headers in response

### 7. Input Validation
- [ ] Add `@field_validator` for `messages` in `MessagesRequest`
- [ ] Add `@field_validator` for `system` prompt length
- [ ] Add `@field_validator` for `max_tokens` range
- [ ] Test with empty messages → should get 400
- [ ] Test with oversized prompt → should get 400
- [ ] Test with invalid token count → should get 400

### 8. Rate Limiting
- [ ] Reduce default `PROVIDER_RATE_LIMIT` from 40 to 10
- [ ] Adjust `PROVIDER_RATE_WINDOW` if needed
- [ ] Test rate limiting with loop script
- [ ] Verify 429 response after limit exceeded
- [ ] Add logging for rate limit events

### 9. Host Binding
- [ ] Change default `host` from "0.0.0.0" to "127.0.0.1"
- [ ] Allow override via `HOST` environment variable
- [ ] Test server startup with new default
- [ ] Verify only accessible on localhost (or specified interface)

### 10. Firebase Rules Review
- [ ] Check Firestore security rules
- [ ] Ensure `allow read, write: if request.auth != null;`
- [ ] Test with unauthenticated access → should fail
- [ ] Test with authenticated access → should succeed
- [ ] Document Firebase configuration

---

## MEDIUM - Do Next Month

### 11. Session Encryption
- [ ] Install `cryptography` package
- [ ] Create `EncryptedSessionStore` class
- [ ] Encrypt `sessions.json` at rest
- [ ] Set file permissions to 600
- [ ] Test encryption/decryption cycle

### 12. Audit Logging
- [ ] Create `log_audit_event()` function
- [ ] Log failed authentication attempts
- [ ] Log API key usage events
- [ ] Log rate limit breaches
- [ ] Create audit log queries for compliance
- [ ] Set up alerting for suspicious patterns

### 13. API Key Rotation
- [ ] Create `/admin/rotate-api-key` endpoint
- [ ] Require current valid auth to rotate
- [ ] Validate new key format (min 32 chars)
- [ ] Store in secure backend (Vault, KMS)
- [ ] Log rotation events

### 14. Dependency Scanning
- [ ] Add `safety` to dev dependencies
- [ ] Add `bandit` to dev dependencies
- [ ] Run `safety check` in CI
- [ ] Run `bandit -r free-claude-code/` in CI
- [ ] Review and fix reported issues
- [ ] Set up automated scanning

### 15. CSP Header (Frontend)
- [ ] Add CSP header to `vercel.json` (if not already present)
- [ ] Restrict `script-src` to 'self'
- [ ] Restrict `style-src` to 'self' and 'unsafe-inline' if needed
- [ ] Add report-uri for CSP violations
- [ ] Monitor CSP violation reports

---

## File-by-File Checklist

### `free-claude-code/api/dependencies.py`
- [ ] Update `require_api_key()` function
- [ ] Use `compare_digest()` for token comparison
- [ ] Add auth token validation

### `free-claude-code/api/routes.py`
- [ ] Remove `FULL_PAYLOAD` debug log
- [ ] Update error handling messages
- [ ] Add audit logging for API calls
- [ ] Add input validation tests

### `free-claude-code/api/app.py`
- [ ] Add `CORSMiddleware`
- [ ] Add `SecurityHeadersMiddleware`
- [ ] Update exception handlers
- [ ] Verify lifespan management

### `free-claude-code/config/settings.py`
- [ ] Add production validation
- [ ] Change default rate limits
- [ ] Change default host to localhost
- [ ] Add security documentation

### `free-claude-code/api/models/anthropic.py`
- [ ] Add field validators
- [ ] Add max length constraints
- [ ] Document validation rules

### `.env`
- [ ] Remove from version control
- [ ] Update git history
- [ ] Create `.env.example` template
- [ ] Document all required variables

### `.gitignore`
- [ ] Verify `.env` is included
- [ ] Add other sensitive patterns

### `vercel.json`
- [ ] Verify security headers present
- [ ] Add CSP if missing
- [ ] Add HSTS if using HTTPS

### `src/lib/firebase.ts`
- [ ] Verify Firebase rules are restrictive
- [ ] Test auth enforcement
- [ ] Document security assumptions

---

## Testing Checklist

### Authentication Testing
- [ ] No auth header → 401 ❌
- [ ] Invalid auth → 401 ❌
- [ ] Valid auth → proceeds ✅
- [ ] Bearer token format works ✅
- [ ] API key format works ✅

### Rate Limiting Testing
- [ ] 1st-10th request → 200 ✅
- [ ] 11th+ request → 429 ❌
- [ ] After window passes → resets ✅

### Input Validation Testing
- [ ] Empty messages → 400 ❌
- [ ] 10,000+ messages → 400 ❌
- [ ] Valid messages → proceeds ✅
- [ ] Oversized system → 400 ❌
- [ ] Invalid max_tokens → 400 ❌

### Security Headers Testing
- [ ] X-Content-Type-Options present ✅
- [ ] X-Frame-Options: DENY ✅
- [ ] X-XSS-Protection present ✅
- [ ] Strict-Transport-Security present ✅
- [ ] CSP header present ✅

### CORS Testing
- [ ] Allowed origin → success ✅
- [ ] Disallowed origin → blocked ❌
- [ ] Preflight OPTIONS → 200 ✅
- [ ] Credentials included → works ✅

### Error Handling Testing
- [ ] No stack traces in response ✅
- [ ] Generic error message shown ✅
- [ ] Sensitive data not leaked ✅
- [ ] Server-side logging detailed ✅

### Logging Testing
- [ ] No full payloads logged ✅
- [ ] No API keys in logs ✅
- [ ] Request IDs tracked ✅
- [ ] Audit events recorded ✅

---

## Code Review Checklist

### Security Review (Before Merge)
- [ ] No hardcoded secrets
- [ ] No `eval()` or `exec()` usage
- [ ] No SQL/NoSQL injection patterns
- [ ] No XSS vulnerabilities (React auto-escapes)
- [ ] Input validation on all API endpoints
- [ ] Authentication required where needed
- [ ] Error messages don't leak info
- [ ] Dependencies checked for vulnerabilities

### Performance Review
- [ ] No N+1 query patterns
- [ ] Appropriate caching headers
- [ ] Rate limiting configured
- [ ] Timeouts set on external calls

### Compliance Review
- [ ] GDPR compliance (if EU users)
- [ ] Data retention policies followed
- [ ] Audit logging present
- [ ] Encryption where required

---

## Pre-Deployment Checklist (Before Prod)

- [ ] All critical issues fixed
- [ ] All tests passing
- [ ] Security headers verified
- [ ] Authentication enforced
- [ ] Rate limiting tested
- [ ] Error messages generic
- [ ] Logs reviewed (no secrets)
- [ ] Dependencies scanned
- [ ] .env not in repo
- [ ] CORS configured correctly
- [ ] HTTPS enforced (if web)
- [ ] Database backups working
- [ ] Monitoring/alerting configured
- [ ] Incident response plan ready
- [ ] Team trained on changes

---

## Ongoing Maintenance

### Weekly
- [ ] Review security logs
- [ ] Check for failed auth attempts
- [ ] Monitor rate limit events

### Monthly
- [ ] Scan dependencies for vulnerabilities
- [ ] Review access logs for anomalies
- [ ] Test disaster recovery

### Quarterly
- [ ] Security audit
- [ ] Penetration testing
- [ ] Compliance review

### Annually
- [ ] Full security review
- [ ] Update security policies
- [ ] Team security training

---

## Contact & Escalation

**If you find a critical vulnerability:**
1. STOP development
2. Notify security lead
3. Do NOT commit or push
4. Document the issue
5. Follow incident response plan

**For questions about these items:**
- See SECURITY_AUDIT_REPORT.md for detailed explanations
- See SECURITY_REMEDIATION_GUIDE.md for code examples
- See SECURITY_EXECUTIVE_SUMMARY.md for business context

