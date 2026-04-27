# DEPLOYMENT COMMANDS REFERENCE
## Quick Command Guide for Server Management

---

## SWITCH TO DEVELOPMENT MODE
**Use this when actively developing features**

```bash
# Enable AI modifications to server code
supabase secrets set CURRENT_SERVER_MODE=development
```

**What this does:**
- AI tool can modify `/supabase/functions/server/` files
- Changes immediately affect development endpoint
- Production server remains unchanged
- Testing happens on: `https://${projectId}.supabase.co/functions/v1/make-server-development/*`

---

## SWITCH TO PRODUCTION MODE
**Use this to protect production during testing or when ready to deploy**

```bash
# Disable AI modifications (production safety)
supabase secrets set CURRENT_SERVER_MODE=production
```

**What this does:**
- AI tool cannot modify server files
- Both servers use current `/server/` code
- Changes already in `/server/` are live on both endpoints
- Use this when validating before deployment

---

## VIEW CURRENT MODE

```bash
# Check which mode is active
supabase secrets list | grep CURRENT_SERVER_MODE
```

---

## DEPLOY TO PRODUCTION PROCESS

### Step 1: Complete Development & Testing
```bash
# Ensure you're in development mode
supabase secrets set CURRENT_SERVER_MODE=development

# Test all changes on development endpoint
# Endpoint: https://${projectId}.supabase.co/functions/v1/make-server-development/*
```

### Step 2: Freeze Development
```bash
# Switch to production mode to prevent further AI changes
supabase secrets set CURRENT_SERVER_MODE=production
```

### Step 3: Deploy (Changes Automatically Propagate)
```bash
# Both servers share /server/ directory, so changes are already live
# Simply restart the production function to ensure clean state
supabase functions deploy make-server-373d8b09

# Verify production endpoint
curl https://rvwduromkqfzplwnmijl.supabase.co/functions/v1/make-server-373d8b09/health
```

### Step 4: Monitor Production
```bash
# Watch logs for 5 minutes
supabase functions logs make-server-373d8b09 --follow

# If issues arise, perform emergency rollback (see below)
```

### Step 5: Resume Development (Optional)
```bash
# Re-enable AI modifications for next development cycle
supabase secrets set CURRENT_SERVER_MODE=development
```

---

## EMERGENCY ROLLBACK

### Option 1: Git Revert (Immediate)
```bash
# Revert to previous commit
git log --oneline  # Find commit hash before changes
git revert <commit-hash>
git push

# Redeploy both servers
supabase functions deploy make-server-373d8b09
supabase functions deploy make-server-development
```

### Option 2: Production-Only Freeze (Isolate Production)
```bash
# Create frozen production copy
cp supabase/functions/server/index.tsx supabase/functions/server/index.production.tsx

# Update production entry point
# Edit: /supabase/functions/make-server-373d8b09/index.ts
# Change: import app from '../server/index.production.tsx';

# Redeploy production only
supabase functions deploy make-server-373d8b09

# Now development can continue without affecting production
```

---

## RESTART SERVERS

```bash
# Restart production server
supabase functions deploy make-server-373d8b09

# Restart development server
supabase functions deploy make-server-development

# Restart both servers
supabase functions deploy make-server-373d8b09 && supabase functions deploy make-server-development
```

---

## VIEW SERVER LOGS

```bash
# Production logs
supabase functions logs make-server-373d8b09 --follow

# Development logs
supabase functions logs make-server-development --follow

# Filter for errors only
supabase functions logs make-server-373d8b09 | grep ERROR

# View recent logs (last 100 lines)
supabase functions logs make-server-373d8b09 --tail 100
```

---

## HEALTH CHECK ENDPOINTS

```bash
# Production health check (add this endpoint to server if not exists)
curl https://rvwduromkqfzplwnmijl.supabase.co/functions/v1/make-server-373d8b09/health

# Development health check
curl https://rvwduromkqfzplwnmijl.supabase.co/functions/v1/make-server-development/health

# Legacy server (a9) - deprecated, should return 404 or old data
curl https://rvwduromkqfzplwnmijl.supabase.co/functions/v1/make-server-ac1075a9/ping
```

---

## DATABASE OPERATIONS

```bash
# View KV store entries (via Supabase dashboard)
# Navigate to: Table Editor > kv_store_373d8b09

# Query specific keys
# Use SQL editor:
SELECT * FROM kv_store_373d8b09 WHERE key LIKE 'business:%' LIMIT 10;

# Count all entries
SELECT COUNT(*) FROM kv_store_373d8b09;

# NEVER create migration files - use KV store for all data
```

---

## FRONTEND CONFIGURATION

### Update Frontend to Use Development Server
```typescript
// File: /utils/supabase/serverConfig.ts (create if needed)
export const getServerEndpoint = () => {
  const mode = import.meta.env.VITE_SERVER_MODE || 'production';
  const projectId = 'rvwduromkqfzplwnmijl';
  
  if (mode === 'development') {
    return `https://${projectId}.supabase.co/functions/v1/make-server-development`;
  }
  
  return `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09`;
};

// Usage in API calls:
const response = await fetch(`${getServerEndpoint()}/gpt-5-1/chat`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(payload)
});
```

### Environment Variable Setup
```bash
# .env.development
VITE_SERVER_MODE=development

# .env.production
VITE_SERVER_MODE=production
```

---

## TROUBLESHOOTING

### "503 Service Unavailable"
```bash
# Check server status
supabase functions logs make-server-373d8b09 --tail 50

# Common causes:
# 1. Server crashed during startup
# 2. Database connection timeout
# 3. Missing environment variables

# Solution: Redeploy
supabase functions deploy make-server-373d8b09
```

### "AI Modifications Not Working"
```bash
# Verify mode is set to development
supabase secrets list | grep CURRENT_SERVER_MODE

# Should show: CURRENT_SERVER_MODE=development
# If not, set it:
supabase secrets set CURRENT_SERVER_MODE=development

# Clear AI context and retry
```

### "Changes Not Appearing"
```bash
# Both servers share /server/ directory
# Changes are immediate, but may need server restart

# Restart development server
supabase functions deploy make-server-development

# Clear browser cache if frontend changes
# Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
```

### "Database Timeout Errors"
```bash
# Increase timeout in database connection
# File: /supabase/functions/server/kv_cache.tsx
# (This file is protected - contact admin if issues persist)

# Temporary workaround: Use retry logic (already implemented)
```

---

## MONITORING DASHBOARD

### Supabase Dashboard
```
https://supabase.com/dashboard/project/rvwduromkqfzplwnmijl

Key sections:
- Functions > make-server-373d8b09 (Production logs)
- Functions > make-server-development (Development logs)
- Table Editor > kv_store_373d8b09 (Database)
- Settings > API (Environment variables)
```

### Key Metrics to Watch
- Request success rate (should be >99%)
- Average response time (should be <2s)
- Error count (should be <1% of requests)
- Database query time (should be <500ms)

---

## CHEAT SHEET

```bash
# Development workflow (most common)
supabase secrets set CURRENT_SERVER_MODE=development    # Start development
# ... AI makes changes to /server/ files ...
# ... Test on make-server-development endpoint ...
supabase secrets set CURRENT_SERVER_MODE=production     # Freeze changes
supabase functions deploy make-server-373d8b09          # Deploy to production
supabase functions logs make-server-373d8b09 --follow   # Monitor

# Emergency rollback
git revert HEAD
supabase functions deploy make-server-373d8b09

# View current state
supabase secrets list | grep CURRENT_SERVER_MODE
supabase functions logs make-server-373d8b09 --tail 20
```

---

## NOTES FOR AI PROCESSING

- **ALWAYS** check CURRENT_SERVER_MODE before modifying server files
- **NEVER** modify `/make-server-373d8b09/index.ts` or `/make-server-ac1075a9/index.ts`
- **ALWAYS** modify files in `/server/` directory only
- **ALWAYS** test changes on development endpoint first
- **ALWAYS** add routes for BOTH servers when creating new endpoints
- **NEVER** create migration files or DDL statements
- **ALWAYS** use kv_cache.tsx wrapper for database operations
- **ALWAYS** use design system variables from /styles/globals.css

---

Last Updated: 2026-01-20
Document Version: 1.0.0
