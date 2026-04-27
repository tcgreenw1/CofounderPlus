# SERVER CONFIGURATION DOCUMENTATION
## AI-OPTIMIZED PROCESSING GUIDE

### CRITICAL RULES FOR AI MODIFICATIONS
1. **DEVELOPMENT-ONLY MODIFICATIONS**: AI tool must ONLY modify `/supabase/functions/server/` files when operating in DEVELOPMENT mode
2. **PRODUCTION PROTECTION**: AI tool must NEVER modify production server during development cycles
3. **DEPLOYMENT PROTOCOL**: Changes propagate from development → production via explicit deployment command
4. **ZERO-DOWNTIME REQUIREMENT**: Production server remains operational during all development activities

---

## SERVER ARCHITECTURE OVERVIEW

### THREE-SERVER SYSTEM
```
/supabase/functions/
├── make-server-373d8b09/        # PRODUCTION SERVER (o9) - PROTECTED
│   └── index.ts                 # Entry point → imports from /server/
├── make-server-ac1075a9/        # DEPRECATED - DO NOT USE
│   └── index.ts                 # Legacy server - no longer active
├── make-server-development/     # DEVELOPMENT SERVER - AI MODIFICATION TARGET
│   └── index.ts                 # Entry point → imports from /server/
└── server/                      # SHARED SOURCE CODE
    ├── index.tsx                # Main application logic
    ├── kv_cache.tsx             # Database wrapper (REQUIRED)
    ├── *-endpoints.tsx          # Feature modules
    └── ...                      # Additional modules
```

### SERVER DESIGNATION MATRIX
| Server ID                | Alias       | Status      | Purpose                    | AI Modification |
|--------------------------|-------------|-------------|----------------------------|-----------------|
| make-server-373d8b09     | o9          | PRODUCTION  | Live user traffic          | FORBIDDEN       |
| make-server-ac1075a9     | a9          | DEPRECATED  | Discontinued               | FORBIDDEN       |
| make-server-development  | development | ACTIVE      | Development/testing        | PERMITTED       |

---

## ENVIRONMENT VARIABLE CONFIGURATION

### CURRENT_SERVER_MODE
**Location**: Environment variables
**Values**: `production` | `development`
**Purpose**: Controls which server processes AI modifications

```typescript
// AI tool checks this before modifications
const SERVER_MODE = Deno.env.get('CURRENT_SERVER_MODE') || 'production';

if (SERVER_MODE !== 'development') {
  throw new Error('AI modifications forbidden in production mode');
}
```

### Switching Server Modes
```bash
# Switch to development mode (AI can modify server)
supabase secrets set CURRENT_SERVER_MODE=development

# Switch to production mode (AI modifications blocked)
supabase secrets set CURRENT_SERVER_MODE=production
```

---

## WORKFLOW PROTOCOLS

### DEVELOPMENT CYCLE
```
1. SET MODE TO DEVELOPMENT
   Command: supabase secrets set CURRENT_SERVER_MODE=development
   Effect: Enables AI modifications to /server/ files
   
2. AI MAKES CHANGES
   Target: /supabase/functions/server/*.tsx files
   Validation: All changes tested on development endpoint
   Endpoint: https://${projectId}.supabase.co/functions/v1/make-server-development/*
   
3. TESTING PHASE
   Users: Test features on development server
   Production: Remains unchanged and operational
   Rollback: Simply discard changes in /server/ if needed
```

### DEPLOYMENT PROTOCOL
```
1. VERIFY DEVELOPMENT SERVER
   Confirm: All features tested and validated
   Check: No errors in development endpoint logs
   
2. FREEZE DEVELOPMENT
   Command: supabase secrets set CURRENT_SERVER_MODE=production
   Effect: Prevents further AI modifications
   
3. SYNC TO PRODUCTION
   Action: Copy /server/ changes (already live for both servers)
   Note: Both servers import from same /server/ directory
   Restart: Production server picks up new code automatically
   
4. VALIDATION
   Test: Production endpoints respond correctly
   Monitor: Error logs for 5 minutes post-deployment
   
5. RESUME DEVELOPMENT (if needed)
   Command: supabase secrets set CURRENT_SERVER_MODE=development
```

### EMERGENCY ROLLBACK
```
1. IMMEDIATE REVERT
   Action: Git revert changes in /server/ directory
   Effect: Both development and production revert instantly
   
2. ALTERNATIVE: PRODUCTION-ONLY PROTECTION
   Create: /server/index.production.tsx (frozen copy)
   Modify: /supabase/functions/make-server-373d8b09/index.ts
   Change: import app from '../server/index.production.tsx'
   Effect: Production uses frozen code, development continues
```

---

## AI MODIFICATION RULES

### PERMITTED ACTIONS (Development Mode Only)
- ✅ Modify any file in `/supabase/functions/server/`
- ✅ Create new endpoint files: `/supabase/functions/server/*-endpoints.tsx`
- ✅ Update business logic in existing modules
- ✅ Add new routes to main server
- ✅ Test changes via development endpoint

### FORBIDDEN ACTIONS (All Modes)
- ❌ Modify `/supabase/functions/make-server-373d8b09/index.ts` directly
- ❌ Modify `/supabase/functions/make-server-ac1075a9/*` (deprecated)
- ❌ Change production endpoint URLs in frontend during development
- ❌ Bypass CURRENT_SERVER_MODE check
- ❌ Create migration files or DDL statements

### PROTECTED FILES (Never Modify)
- ❌ `/supabase/functions/server/kv_store.tsx` (system-managed)
- ❌ `/utils/supabase/info.tsx` (auto-generated)

---

## ENDPOINT URL PATTERNS

### Frontend API Calls
```typescript
// Base URL construction
const baseUrl = `https://${projectId}.supabase.co/functions/v1`;
const serverPath = Deno.env.get('CURRENT_SERVER_MODE') === 'development' 
  ? '/make-server-development'
  : '/make-server-373d8b09';

// Example: Chat endpoint
const chatUrl = `${baseUrl}${serverPath}/gpt-5-1/chat`;

// Authorization header (always required)
headers: {
  'Authorization': `Bearer ${accessToken}`
}
```

### Server Route Prefixes
```typescript
// All routes must include server prefix
app.post('/make-server-373d8b09/gpt-5-1/chat', handler);      // Production
app.post('/make-server-development/gpt-5-1/chat', handler);   // Development

// Legacy routes (deprecated)
app.post('/make-server-ac1075a9/*', handler);                 // DO NOT USE
```

---

## DATABASE INTEGRATION

### KV Store Wrapper (REQUIRED)
```typescript
// ALWAYS import from kv_cache.tsx
import * as kv from './kv_cache.tsx';

// Available operations
await kv.get(key);                    // Single value retrieval
await kv.set(key, value);             // Single value storage
await kv.del(key);                    // Single value deletion
await kv.mget([key1, key2]);          // Multiple value retrieval
await kv.mset({ key1: val1, ... });   // Multiple value storage
await kv.mdel([key1, key2]);          // Multiple value deletion
await kv.getByPrefix(prefix);         // Prefix-based query

// Cache warming (automatic)
kv.prewarmUserCache(userId);          // Background cache population
kv.isCacheWarmed(userId);             // Check cache status
```

### Supabase Client Import (REQUIRED)
```typescript
// ALWAYS use JSR import for Supabase
import { createClient } from 'jsr:@supabase/supabase-js@2';

// Client creation
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);
```

---

## TESTING CHECKLIST

### Before AI Modifications
- [ ] Verify CURRENT_SERVER_MODE=development
- [ ] Confirm target files in /server/ directory
- [ ] Check no production routes being modified directly

### After AI Modifications
- [ ] Test new endpoints via development URL
- [ ] Verify production server still responds
- [ ] Check error logs for both servers
- [ ] Validate database operations complete successfully
- [ ] Confirm authentication flow works

### Pre-Deployment
- [ ] All development tests pass
- [ ] No breaking changes to existing APIs
- [ ] Database migrations completed (if any)
- [ ] Frontend updated to handle new responses (if applicable)
- [ ] Set CURRENT_SERVER_MODE=production

---

## COMMON OPERATIONS

### Creating New Endpoint Module
```typescript
// File: /supabase/functions/server/my-feature-endpoints.tsx
import { Hono } from 'npm:hono';
import * as kv from './kv_cache.tsx';
import { createClient } from 'jsr:@supabase/supabase-js@2';

export const myFeatureApp = new Hono();

myFeatureApp.post('/make-server-373d8b09/my-feature/action', async (c) => {
  // Implementation
});

myFeatureApp.post('/make-server-development/my-feature/action', async (c) => {
  // Same implementation (code reuse)
});
```

### Registering New Routes
```typescript
// File: /supabase/functions/server/index.tsx
import { myFeatureApp } from './my-feature-endpoints.tsx';

// Add to main app
app.route('/make-server-373d8b09', myFeatureApp);
app.route('/make-server-development', myFeatureApp);
```

---

## ERROR HANDLING REQUIREMENTS

### Retry Logic for Auth
```typescript
// ALWAYS wrap auth calls with retry
async function retryAuthRequest<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 500
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      await new Promise(resolve => 
        setTimeout(resolve, initialDelay * Math.pow(2, attempt))
      );
    }
  }
}
```

### Error Response Format
```typescript
// ALWAYS return detailed error context
return c.json({ 
  error: `Detailed context: ${specificOperation} failed: ${error.message}`,
  timestamp: new Date().toISOString(),
  requestId: c.req.header('x-request-id')
}, statusCode);
```

---

## DEPLOYMENT COMMANDS SUMMARY

```bash
# DEVELOPMENT MODE (AI can modify)
supabase secrets set CURRENT_SERVER_MODE=development

# PRODUCTION MODE (AI modifications blocked)
supabase secrets set CURRENT_SERVER_MODE=production

# VIEW CURRENT MODE
supabase secrets list | grep CURRENT_SERVER_MODE

# DEPLOY TO PRODUCTION (automatic - both servers share /server/)
# Changes in /server/ are immediately reflected in both endpoints
# No manual deployment step required

# RESTART SERVERS (if needed)
supabase functions deploy make-server-373d8b09
supabase functions deploy make-server-development
```

---

## SEMANTIC REFERENCE CODES FOR AI

### Server Identification
- `SERVER_PROD_O9`: make-server-373d8b09 (production)
- `SERVER_DEV`: make-server-development (development target)
- `SERVER_DEPRECATED_A9`: make-server-ac1075a9 (ignore)

### Operation Modes
- `MODE_DEVELOPMENT`: AI modifications enabled
- `MODE_PRODUCTION`: AI modifications disabled, production traffic active

### File Categories
- `CATEGORY_MUTABLE`: /server/*.tsx (AI can modify in development mode)
- `CATEGORY_IMMUTABLE`: /make-server-*/index.ts (never modify)
- `CATEGORY_PROTECTED`: kv_store.tsx, info.tsx (system-managed)

### Deployment States
- `STATE_DEVELOPING`: Changes in progress, development server active
- `STATE_TESTING`: Changes complete, validation in progress
- `STATE_DEPLOYING`: Freezing development, preparing production sync
- `STATE_LIVE`: Production updated, monitoring active
- `STATE_ROLLBACK`: Emergency revert in progress

---

## AI DECISION TREE

```
User requests server modification
│
├─ Check: CURRENT_SERVER_MODE
│  ├─ development → PROCEED
│  └─ production → ABORT with message:
│     "Server in production mode. Run: supabase secrets set CURRENT_SERVER_MODE=development"
│
├─ Check: Target file location
│  ├─ /server/*.tsx → PERMITTED
│  ├─ /make-server-*/index.ts → FORBIDDEN
│  └─ kv_store.tsx or info.tsx → FORBIDDEN
│
├─ Check: Operation type
│  ├─ CRUD endpoint → Modify with kv_cache.tsx wrapper
│  ├─ Auth endpoint → Include retry logic
│  ├─ New feature → Create *-endpoints.tsx + register in index.tsx
│  └─ Schema change → ABORT (no migrations allowed)
│
└─ Execute modification
   ├─ Add routes for both servers (/make-server-373d8b09 and /make-server-development)
   ├─ Use design system variables from /styles/globals.css
   ├─ Test via development endpoint
   └─ Confirm zero impact to production endpoint
```

---

## VERSION CONTROL INTEGRATION

### Git Workflow
```bash
# Development branch
git checkout -b feature/new-endpoint

# Make changes to /server/ files (AI or manual)
git add supabase/functions/server/

# Commit with descriptive message
git commit -m "feat: Add new endpoint for X feature"

# Test on development server
# Verify production unaffected

# Merge to main when ready
git checkout main
git merge feature/new-endpoint

# Production automatically picks up changes from /server/
```

---

## MONITORING AND OBSERVABILITY

### Log Patterns to Monitor
```typescript
// Development server logs
console.log('🔧 [DEV] Feature X processing...');

// Production server logs  
console.log('✅ [PROD] Request completed successfully');

// Error tracking
console.error('❌ [ERROR] Operation failed:', {
  server: 'development',
  endpoint: '/make-server-development/feature',
  error: error.message,
  timestamp: new Date().toISOString()
});
```

### Health Check Endpoints
```typescript
// Production health check
GET /make-server-373d8b09/health
Response: { status: 'healthy', server: 'production', uptime: 12345 }

// Development health check
GET /make-server-development/health
Response: { status: 'healthy', server: 'development', uptime: 678 }
```

---

## FINAL REMINDERS FOR AI

1. **ALWAYS** verify CURRENT_SERVER_MODE before modifications
2. **NEVER** modify production server entry points directly
3. **ALWAYS** use kv_cache.tsx for database operations
4. **ALWAYS** import Supabase from jsr:@supabase/supabase-js@2
5. **ALWAYS** add routes for BOTH servers in new endpoint files
6. **ALWAYS** test on development endpoint first
7. **NEVER** create migration files or DDL statements
8. **ALWAYS** use design system variables from /styles/globals.css
9. **ALWAYS** include detailed error context in responses
10. **ALWAYS** implement retry logic for authentication calls

---

## END OF DOCUMENTATION
Last Updated: 2026-01-20
Document Version: 1.0.0
AI Optimization Level: MAXIMUM
