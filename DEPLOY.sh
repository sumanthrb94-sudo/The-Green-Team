#!/bin/bash
# Security Deployment Guide - Step-by-Step

set -e  # Exit on any error

echo "================================================"
echo "Security Fixes Deployment Guide"
echo "================================================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if in correct directory
if [ ! -f "free-claude-code/api/app.py" ]; then
    echo -e "${RED}❌ Error: Not in The-Green-Team root directory${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 1: Verify Git Status${NC}"
echo "Current branch: $(git branch --show-current)"
echo "Uncommitted changes:"
git status --short | head -5 || echo "  (no changes)"
echo ""

echo -e "${YELLOW}Step 2: Check .env File${NC}"
if [ -f "free-claude-code/.env" ]; then
    echo -e "${RED}⚠️  WARNING: .env file exists (should not be committed)${NC}"
    echo "   Location: free-claude-code/.env"
    echo "   This file MUST be in .gitignore"
else
    echo -e "${GREEN}✓ .env file not present (good)${NC}"
fi
echo ""

echo -e "${YELLOW}Step 3: Verify .gitignore${NC}"
if grep -q "^\.env$" "free-claude-code/.gitignore"; then
    echo -e "${GREEN}✓ .env is in .gitignore${NC}"
else
    echo -e "${RED}❌ .env is NOT in .gitignore${NC}"
    echo "   Adding now..."
    echo ".env" >> "free-claude-code/.gitignore"
fi
echo ""

echo -e "${YELLOW}Step 4: Create Production Environment File${NC}"
if [ ! -f ".env.production" ]; then
    echo "Creating .env.production from template..."
    cp "free-claude-code/.env.production.example" ".env.production"
    echo ""
    echo -e "${YELLOW}📝 EDIT .env.production with your production secrets:${NC}"
    echo "   - ANTHROPIC_AUTH_TOKEN (required - min 32 chars)"
    echo "   - NVIDIA_NIM_API_KEY"
    echo "   - OPENROUTER_API_KEY"
    echo "   - TELEGRAM_BOT_TOKEN (if using Telegram)"
    echo "   - DISCORD_BOT_TOKEN (if using Discord)"
    echo ""
    echo "   Then run: source .env.production"
else
    echo -e "${GREEN}✓ .env.production already exists${NC}"
fi
echo ""

echo -e "${YELLOW}Step 5: Verify Code Changes${NC}"
echo "Checking modified files..."
echo ""

# Check for timing-attack resistant comparison
if grep -q "compare_digest" "free-claude-code/api/dependencies.py"; then
    echo -e "${GREEN}✓ Authentication uses compare_digest (timing-attack resistant)${NC}"
else
    echo -e "${RED}❌ compare_digest not found in dependencies.py${NC}"
fi

# Check for CORS middleware
if grep -q "CORSMiddleware" "free-claude-code/api/app.py"; then
    echo -e "${GREEN}✓ CORS middleware added${NC}"
else
    echo -e "${RED}❌ CORS middleware not found in app.py${NC}"
fi

# Check for security headers
if grep -q "SecurityHeadersMiddleware" "free-claude-code/api/app.py"; then
    echo -e "${GREEN}✓ Security headers middleware added${NC}"
else
    echo -e "${RED}❌ Security headers not found in app.py${NC}"
fi

# Check that FULL_PAYLOAD is removed
if ! grep -q 'logger.debug.*"FULL_PAYLOAD' "free-claude-code/api/routes.py"; then
    echo -e "${GREEN}✓ FULL_PAYLOAD logging removed${NC}"
else
    echo -e "${RED}❌ FULL_PAYLOAD logging still present${NC}"
fi

# Check for input validation
if grep -q "@field_validator.*messages" "free-claude-code/api/models/anthropic.py"; then
    echo -e "${GREEN}✓ Input validation added for messages${NC}"
else
    echo -e "${RED}❌ Input validation not found${NC}"
fi

# Check rate limit reduction
if grep -q 'default=10.*PROVIDER_RATE_LIMIT' "free-claude-code/config/settings.py"; then
    echo -e "${GREEN}✓ Rate limits reduced to 10/min${NC}"
else
    echo -e "${RED}❌ Rate limits not updated${NC}"
fi

# Check host binding default
if grep -q 'default="127.0.0.1"' "free-claude-code/config/settings.py"; then
    echo -e "${GREEN}✓ Default host changed to localhost${NC}"
else
    echo -e "${RED}❌ Default host not updated${NC}"
fi

echo ""
echo -e "${YELLOW}Step 6: Pre-deployment Checklist${NC}"
echo ""
echo "Before deploying to production, verify:"
echo "  [ ] All API keys have been revoked (old keys)"
echo "  [ ] New API keys generated:"
echo "      [ ] NVIDIA NIM: https://build.nvidia.com/settings/api-keys"
echo "      [ ] OpenRouter: https://openrouter.ai/keys"
echo "      [ ] Telegram: @BotFather /token command"
echo "      [ ] Discord: Developer Portal regenerate"
echo "  [ ] .env.production updated with new keys"
echo "  [ ] ANTHROPIC_AUTH_TOKEN set (min 32 characters)"
echo "  [ ] ENVIRONMENT set to 'production'"
echo "  [ ] All tests passing"
echo "  [ ] No secrets in git history"
echo ""

echo -e "${YELLOW}Step 7: Running Tests${NC}"
echo ""
echo "Running Python syntax checks..."
if python3 -m py_compile free-claude-code/api/dependencies.py 2>/dev/null; then
    echo -e "${GREEN}✓ dependencies.py - syntax OK${NC}"
else
    echo -e "${RED}❌ dependencies.py - syntax error${NC}"
fi

if python3 -m py_compile free-claude-code/api/app.py 2>/dev/null; then
    echo -e "${GREEN}✓ app.py - syntax OK${NC}"
else
    echo -e "${RED}❌ app.py - syntax error${NC}"
fi

if python3 -m py_compile free-claude-code/config/settings.py 2>/dev/null; then
    echo -e "${GREEN}✓ settings.py - syntax OK${NC}"
else
    echo -e "${RED}❌ settings.py - syntax error${NC}"
fi

if python3 -m py_compile free-claude-code/api/models/anthropic.py 2>/dev/null; then
    echo -e "${GREEN}✓ anthropic.py - syntax OK${NC}"
else
    echo -e "${RED}❌ anthropic.py - syntax error${NC}"
fi

echo ""
echo -e "${YELLOW}Step 8: Git Cleanup${NC}"
echo ""
echo -e "${RED}⚠️  WARNING: This step requires force-push${NC}"
echo "If .env was previously committed, clean history:"
echo ""
echo "  git filter-branch --tree-filter 'rm -f free-claude-code/.env' HEAD"
echo "  git push --force origin main"
echo ""
echo "⚠️  Coordinate with team before force-pushing!"
echo ""

echo -e "${YELLOW}Step 9: Deployment${NC}"
echo ""
echo "Local testing:"
echo "  source .env.production"
echo "  cd free-claude-code"
echo "  uvicorn api.app:app --host 127.0.0.1 --port 8082"
echo ""
echo "Production deployment:"
echo "  Set environment variables from secrets manager"
echo "  Restart server with ENVIRONMENT=production"
echo ""

echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}Deployment guide complete!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo "For more details, see:"
echo "  - IMPLEMENTATION_SUMMARY.md"
echo "  - SECURITY_CHECKLIST.md"
echo "  - SECURITY_REMEDIATION_GUIDE.md"
echo ""
