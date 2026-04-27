# Server Setup Validation Checklist

## Completed Setup ✅

### Server Infrastructure
- [x] Production server: `make-server-373d8b09` (o9) - Active
- [x] Development server: `make-server-development` - Active
- [x] Legacy server: `make-server-ac1075a9` (a9) - Deprecated
- [x] Both servers import from shared `/server/` directory
- [x] Health check endpoints added for both servers
- [x] Ping endpoints added for both servers

### Documentation Files Created
- [x] `/supabase/functions/SERVER_DOCUMENTATION.md` - AI-optimized technical spec
- [x] `/DEPLOYMENT_COMMANDS.md` - Human-readable deployment guide
- [x] `/AI_SERVER_COMMANDS.txt` - Quick reference for AI
- [x] `/README_SERVER_SETUP.md` - Architecture overview
- [x] `/SERVER_ARCHITECTURE_DIAGRAM.txt` - Visual diagrams
- [x] `/SERVER_SETUP_CHECKLIST.md` - This file

### Code Infrastructure
- [x] `/utils/supabase/serverConfig.ts` - Frontend server switching utility
- [x] Development server routes registered in `/server/index.tsx`
- [x] All endpoint modules configured for dual-server support
- [x] Console utilities exposed for runtime server switching

### Route Mirroring
All routes registered for both servers:
- [x] Support & chat endpoints
- [x] Core application routes
- [x] OAuth endpoints (HubSpot, Salesforce, Google, GitHub)
- [x] Admin endpoints
- [x] Feature endpoints (Notes, Roadmap, Products, Finance, HR, Team, Calendar, Slack)
- [x] GPT-5.1 chat endpoint
- [x] Credits & subscription endpoints
- [x] Automation & notifications
- [x] All other feature modules

---

## Validation Steps

### 1. Server Health Checks

```bash
# Check production server
curl https://rvwduromkqfzplwnmijl.supabase.co/functions/v1/make-server-373d8b09/health

# Expected response:
# {
#   "status": "healthy",
#   "timestamp": "2026-01-20T...",
#   "service": "cofounder-ai-server",
#   "environment": "production",
#   "server": "make-server-373d8b09"
# }
```

**Status**: ⬜ Not tested yet

```bash
# Check development server
curl https://rvwduromkqfzplwnmijl.supabase.co/functions/v1/make-server-development/health

# Expected response:
# {
#   "status": "healthy",
#   "timestamp": "2026-01-20T...",
#   "service": "cofounder-ai-server",
#   "environment": "development",
#   "server": "make-server-development"
# }
```

**Status**: ⬜ Not tested yet

### 2. Environment Variable Setup

```bash
# Check current server mode
supabase secrets list | grep CURRENT_SERVER_MODE

# If not set, initialize to production (safe default)
supabase secrets set CURRENT_SERVER_MODE=production
```

**Status**: ⬜ Not configured yet

### 3. Development Server Deployment

```bash
# Deploy development server
supabase functions deploy make-server-development

# Watch for successful deployment
# Expected: "Deployed function make-server-development"
```

**Status**: ⬜ Not deployed yet

### 4. Production Server Verification

```bash
# Verify production server still works
supabase functions logs make-server-373d8b09 --tail 20

# Should show no errors from recent changes
```

**Status**: ⬜ Not verified yet

### 5. Frontend Integration Test

```javascript
// In browser console:
window.serverConfig.logConfig();

// Expected output:
// 🔧 Cofounder+ Server Configuration
// Mode: production
// Endpoint: https://rvwduromkqfzplwnmijl.supabase.co/functions/v1/make-server-373d8b09
// ...
```

**Status**: ⬜ Not tested yet

### 6. Server Switching Test

```javascript
// In browser console:
window.serverConfig.switchToDevelopment();
// Should log: 🔧 Server mode set to: development

window.serverConfig.checkHealth();
// Should return development server health

window.serverConfig.switchToProduction();
// Should log: 🔧 Server mode set to: production
```

**Status**: ⬜ Not tested yet

---

## Pre-Production Checklist

Before allowing AI modifications:

### Environment Setup
- [ ] `CURRENT_SERVER_MODE` environment variable set to `development`
- [ ] Development server deployed and responding to health checks
- [ ] Production server verified stable and operational
- [ ] All team members aware of new dual-server architecture

### Testing Infrastructure
- [ ] Health check endpoints respond correctly
- [ ] Frontend can switch between servers dynamically
- [ ] Database connections work on both servers
- [ ] Authentication flow works on both servers
- [ ] Sample API request succeeds on development server

### Documentation Review
- [ ] Team has read `/README_SERVER_SETUP.md`
- [ ] Deployment workflow understood
- [ ] Emergency rollback procedure documented and tested
- [ ] Monitoring dashboard bookmarked

### AI Integration
- [ ] AI assistant has access to `/AI_SERVER_COMMANDS.txt`
- [ ] AI assistant understands it must check `CURRENT_SERVER_MODE`
- [ ] AI assistant knows to add routes for both servers
- [ ] AI assistant knows protected files list

---

## Post-Setup Verification

### Functional Tests

#### Test 1: Development Server Basic Request
```bash
curl -X POST https://rvwduromkqfzplwnmijl.supabase.co/functions/v1/make-server-development/ping \
  -H "Content-Type: application/json"

# Expected: { "status": "ok", "timestamp": "...", "pong": true, "server": "development" }
```
**Result**: ⬜ Not tested

#### Test 2: Production Server Still Works
```bash
curl -X POST https://rvwduromkqfzplwnmijl.supabase.co/functions/v1/make-server-373d8b09/ping \
  -H "Content-Type: application/json"

# Expected: { "status": "ok", "timestamp": "...", "pong": true, "server": "production" }
```
**Result**: ⬜ Not tested

#### Test 3: Authenticated Request to Development
```bash
# Replace {TOKEN} with actual access token
curl -X GET https://rvwduromkqfzplwnmijl.supabase.co/functions/v1/make-server-development/businesses \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json"

# Expected: { "businesses": [...] }
```
**Result**: ⬜ Not tested

#### Test 4: Frontend Server Config Utility
```typescript
// In React component or browser console:
import serverConfig from '/utils/supabase/serverConfig';

const endpoint = serverConfig.getServerEndpoint();
console.log(endpoint);
// Should log current server endpoint based on mode
```
**Result**: ⬜ Not tested

### Performance Tests

#### Test 5: Development Server Response Time
```bash
time curl https://rvwduromkqfzplwnmijl.supabase.co/functions/v1/make-server-development/health

# Should complete in < 2 seconds
```
**Result**: ⬜ Not tested

#### Test 6: Production Server Response Time
```bash
time curl https://rvwduromkqfzplwnmijl.supabase.co/functions/v1/make-server-373d8b09/health

# Should complete in < 2 seconds
```
**Result**: ⬜ Not tested

### Load Tests

#### Test 7: Concurrent Requests to Development
```bash
# Send 10 concurrent requests
for i in {1..10}; do
  curl https://rvwduromkqfzplwnmijl.supabase.co/functions/v1/make-server-development/health &
done
wait

# All should succeed
```
**Result**: ⬜ Not tested

---

## Known Limitations

1. **No Automatic Sync**: Changes in `/server/` affect both servers immediately, but servers may need restart to pick up changes
2. **No Migration Support**: Cannot create DDL or migration files - must use KV store for all data
3. **Shared Environment Variables**: Both servers use same environment variables
4. **No Isolated Databases**: Both servers access same `kv_store_373d8b09` table

---

## Rollback Plan

If setup causes issues:

### Option 1: Keep Development Server, Revert Changes
```bash
# If development server causes problems, just don't use it
# Production server (o9) continues working as before
# Delete development server deployment
supabase functions delete make-server-development
```

### Option 2: Remove Development Routes
```bash
# Edit /supabase/functions/server/index.tsx
# Comment out all /make-server-development routes
# Redeploy production server
supabase functions deploy make-server-373d8b09
```

### Option 3: Full Rollback
```bash
# Revert git commit
git log --oneline
git revert <setup-commit-hash>
git push

# Redeploy production
supabase functions deploy make-server-373d8b09
```

---

## Next Steps

### Immediate (Required)
1. Deploy development server: `supabase functions deploy make-server-development`
2. Set server mode: `supabase secrets set CURRENT_SERVER_MODE=production`
3. Test health endpoints for both servers
4. Verify frontend can connect to both servers

### Short-term (Recommended)
1. Run all functional tests
2. Document team workflow for using development server
3. Set up monitoring alerts for both servers
4. Test emergency rollback procedure

### Long-term (Optional)
1. Add automated tests for server switching
2. Create CI/CD pipeline for automatic deployment
3. Set up staging environment
4. Implement feature flags for gradual rollout

---

## Troubleshooting Guide

### Issue: Development server returns 503
**Cause**: Server not deployed or crashed during startup  
**Solution**: 
```bash
supabase functions deploy make-server-development
supabase functions logs make-server-development --tail 50
```

### Issue: AI modifications not working
**Cause**: `CURRENT_SERVER_MODE` not set to `development`  
**Solution**: 
```bash
supabase secrets set CURRENT_SERVER_MODE=development
```

### Issue: Changes not appearing on development server
**Cause**: Server needs restart to pick up file changes  
**Solution**: 
```bash
supabase functions deploy make-server-development
```

### Issue: Production server affected by development changes
**Cause**: Both servers share `/server/` directory  
**Solution**: This is by design. Restart production server to get latest changes:
```bash
supabase functions deploy make-server-373d8b09
```

### Issue: Cannot switch servers in frontend
**Cause**: `serverConfig.ts` not imported properly  
**Solution**: 
```typescript
// Import in component
import serverConfig from '@/utils/supabase/serverConfig';

// Or use window global
window.serverConfig.switchToDevelopment();
```

---

## Sign-off

### Setup Completed By
- **Name**: _________________
- **Date**: _________________
- **Role**: _________________

### Verification Completed By
- **Name**: _________________
- **Date**: _________________
- **Role**: _________________

### Production Deployment Approved By
- **Name**: _________________
- **Date**: _________________
- **Role**: _________________

---

## Appendix: Quick Command Reference

```bash
# Server Management
supabase functions deploy make-server-373d8b09      # Deploy production
supabase functions deploy make-server-development   # Deploy development
supabase functions logs make-server-373d8b09        # View production logs
supabase functions logs make-server-development     # View development logs

# Mode Switching
supabase secrets set CURRENT_SERVER_MODE=development  # Enable AI mods
supabase secrets set CURRENT_SERVER_MODE=production   # Disable AI mods
supabase secrets list | grep CURRENT_SERVER_MODE      # Check current mode

# Health Checks
curl https://rvwduromkqfzplwnmijl.supabase.co/functions/v1/make-server-373d8b09/health
curl https://rvwduromkqfzplwnmijl.supabase.co/functions/v1/make-server-development/health

# Emergency Rollback
git revert HEAD
supabase functions deploy make-server-373d8b09
```

---

**Last Updated**: 2026-01-20  
**Document Version**: 1.0.0  
**Status**: Setup Complete ✅ | Testing Required ⬜
