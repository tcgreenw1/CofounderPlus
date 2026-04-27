# Cofounder+ Server Architecture Documentation

## Overview

This document describes the complete server architecture for the Cofounder+ application, including production, development, and legacy servers.

## Server Configuration

### Active Servers

| Server ID | Alias | Status | Purpose | AI Modifications |
|-----------|-------|--------|---------|------------------|
| `make-server-373d8b09` | o9 | **PRODUCTION** | Live user traffic | ❌ Forbidden |
| `make-server-development` | dev | **ACTIVE** | Development & testing | ✅ Permitted (when `CURRENT_SERVER_MODE=development`) |
| `make-server-ac1075a9` | a9 | **DEPRECATED** | Legacy (discontinued) | ❌ Forbidden |

### Directory Structure

```
/supabase/functions/
├── make-server-373d8b09/        # Production entry point
│   └── index.ts                 # Imports from /server/
├── make-server-development/     # Development entry point
│   └── index.ts                 # Imports from /server/
├── make-server-ac1075a9/        # Legacy (do not use)
│   └── index.ts
└── server/                      # Shared source code (AI target)
    ├── index.tsx                # Main server application
    ├── kv_cache.tsx             # Database wrapper (REQUIRED)
    ├── kv_store.tsx             # Low-level KV (PROTECTED)
    ├── *-endpoints.tsx          # Feature modules
    └── ...
```

## Key Concepts

### Shared Codebase Architecture

Both production and development servers import from the same `/server/` directory. This means:

- ✅ **Single source of truth**: Changes to `/server/` affect both servers
- ✅ **No duplication**: Write once, deploy to both environments
- ✅ **Isolated testing**: Development server provides safe testing environment
- ✅ **Zero-downtime development**: Production remains stable during development

### Server Mode Control

The `CURRENT_SERVER_MODE` environment variable controls AI behavior:

**Development Mode** (`CURRENT_SERVER_MODE=development`)
- AI can modify files in `/server/` directory
- Changes immediately affect development endpoint
- Production server continues using current code
- Safe for experimentation and testing

**Production Mode** (`CURRENT_SERVER_MODE=production`)
- AI cannot modify server files (safety lock)
- Both servers use current `/server/` code
- Use this mode when validating or deploying

## Quick Start Commands

### For Developers

```bash
# Switch to development mode
supabase secrets set CURRENT_SERVER_MODE=development

# Make changes to /server/ files (or let AI do it)
# Test at: https://{projectId}.supabase.co/functions/v1/make-server-development/*

# When ready to deploy
supabase secrets set CURRENT_SERVER_MODE=production
supabase functions deploy make-server-373d8b09

# Monitor production
supabase functions logs make-server-373d8b09 --follow
```

### For AI Assistant

See `/AI_SERVER_COMMANDS.txt` for machine-optimized protocol.

## Documentation Files

This setup includes four comprehensive documentation files:

### 1. `/supabase/functions/SERVER_DOCUMENTATION.md`
- **Audience**: AI systems (optimized for machine processing)
- **Content**: Complete technical specification, decision trees, semantic codes
- **Purpose**: Enable AI to safely modify server code

### 2. `/DEPLOYMENT_COMMANDS.md`
- **Audience**: Human developers
- **Content**: Step-by-step deployment workflows, troubleshooting
- **Purpose**: Guide manual deployment and operations

### 3. `/AI_SERVER_COMMANDS.txt`
- **Audience**: AI systems (quick reference format)
- **Content**: Condensed protocol, patterns, validation rules
- **Purpose**: Fast AI decision-making during modifications

### 4. `/README_SERVER_SETUP.md` (this file)
- **Audience**: Human developers and AI systems
- **Content**: Architecture overview, key concepts
- **Purpose**: Understand the complete setup

## Frontend Integration

### Using the Server Config Utility

```typescript
import serverConfig from '/utils/supabase/serverConfig';

// Get current server endpoint
const endpoint = serverConfig.getServerEndpoint();
// Returns: https://{projectId}.supabase.co/functions/v1/make-server-373d8b09
// (or make-server-development if in dev mode)

// Make API request
const result = await serverConfig.makeApiRequest('/gpt-5-1/chat', {
  method: 'POST',
  body: { message: 'Hello' },
  accessToken: userToken
});

// Check server health
const health = await serverConfig.checkServerHealth();
console.log(health.environment); // "production" or "development"
```

### Runtime Server Switching (Developer Console)

```javascript
// Switch to development server (in browser console)
window.serverConfig.switchToDevelopment();

// Switch back to production
window.serverConfig.switchToProduction();

// Check current configuration
window.serverConfig.logConfig();
```

### Environment Variables

```bash
# .env.development
VITE_SERVER_MODE=development

# .env.production
VITE_SERVER_MODE=production
```

## Design System Integration

**CRITICAL**: All UI components must use CSS variables from `/styles/globals.css`

### Required Patterns

```typescript
// ✅ CORRECT - Uses design system variables
<div className="bg-[var(--color-primary)] text-[var(--color-text-primary)] p-[var(--spacing-md)]">

// ❌ WRONG - Hardcoded values
<div className="bg-blue-500 text-white p-4">
```

### Available CSS Variables

- **Colors**: `--color-primary`, `--color-secondary`, `--color-background`, etc.
- **Spacing**: `--spacing-xs`, `--spacing-sm`, `--spacing-md`, `--spacing-lg`, etc.
- **Typography**: `font-sans`, `font-mono`, `font-display` (only these font families)
- **Borders**: `--border-width`, `--border-radius`
- **Shadows**: `--shadow-sm`, `--shadow-md`, `--shadow-lg`

## Database Operations

**CRITICAL**: Always use the KV cache wrapper

```typescript
// ✅ CORRECT
import * as kv from './kv_cache.tsx';
const value = await kv.get(key);

// ❌ WRONG - Direct access forbidden
import * as kv from './kv_store.tsx'; // DO NOT DO THIS
```

### Available Operations

```typescript
// Single operations
await kv.get(key)           // Retrieve value
await kv.set(key, value)    // Store value
await kv.del(key)           // Delete value

// Batch operations
await kv.mget([key1, key2]) // Get multiple values
await kv.mset({ key1: v1 }) // Set multiple values
await kv.mdel([key1, key2]) // Delete multiple values

// Query operations
await kv.getByPrefix(prefix) // Get all keys with prefix

// Cache warming (automatic)
kv.prewarmUserCache(userId)  // Warm cache in background
kv.isCacheWarmed(userId)     // Check if warmed
```

## Health Monitoring

### Production Server
```bash
curl https://rvwduromkqfzplwnmijl.supabase.co/functions/v1/make-server-373d8b09/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-20T...",
  "service": "cofounder-ai-server",
  "environment": "production",
  "server": "make-server-373d8b09"
}
```

### Development Server
```bash
curl https://rvwduromkqfzplwnmijl.supabase.co/functions/v1/make-server-development/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-20T...",
  "service": "cofounder-ai-server",
  "environment": "development",
  "server": "make-server-development"
}
```

## Common Workflows

### 1. Feature Development Workflow

```bash
# Step 1: Enable development mode
supabase secrets set CURRENT_SERVER_MODE=development

# Step 2: Create feature endpoint
# File: /supabase/functions/server/my-feature-endpoints.tsx
# Add routes for both servers:
#   /make-server-373d8b09/my-feature/*
#   /make-server-development/my-feature/*

# Step 3: Register in main server
# File: /supabase/functions/server/index.tsx
# Add before Deno.serve():
#   import { myFeatureApp } from './my-feature-endpoints.tsx';
#   app.route('/make-server-373d8b09', myFeatureApp);
#   app.route('/make-server-development', myFeatureApp);

# Step 4: Test on development server
curl https://rvwduromkqfzplwnmijl.supabase.co/functions/v1/make-server-development/my-feature/test

# Step 5: Deploy to production
supabase secrets set CURRENT_SERVER_MODE=production
supabase functions deploy make-server-373d8b09

# Step 6: Monitor
supabase functions logs make-server-373d8b09 --follow
```

### 2. Emergency Rollback Workflow

```bash
# Immediate revert
git log --oneline  # Find commit before changes
git revert <commit-hash>
git push

# Redeploy production
supabase functions deploy make-server-373d8b09

# Verify rollback
curl https://rvwduromkqfzplwnmijl.supabase.co/functions/v1/make-server-373d8b09/health
```

### 3. AI Modification Workflow

```bash
# Step 1: Ensure development mode
supabase secrets set CURRENT_SERVER_MODE=development

# Step 2: AI makes changes to /server/ files
# AI checks CURRENT_SERVER_MODE before modifying
# AI only modifies files in /supabase/functions/server/
# AI adds routes for both production and development

# Step 3: Test changes
# Development endpoint: make-server-development
# Production endpoint: make-server-373d8b09 (unchanged)

# Step 4: When ready, freeze and deploy
supabase secrets set CURRENT_SERVER_MODE=production
supabase functions deploy make-server-373d8b09
```

## Protected Files

These files must **NEVER** be modified:

- ❌ `/supabase/functions/server/kv_store.tsx` (system-managed)
- ❌ `/utils/supabase/info.tsx` (auto-generated)
- ❌ `/supabase/functions/make-server-373d8b09/index.ts` (entry point)
- ❌ `/supabase/functions/make-server-ac1075a9/index.ts` (entry point)
- ❌ `/supabase/functions/make-server-development/index.ts` (entry point)

## Forbidden Operations

- ❌ Creating migration files or DDL statements
- ❌ Modifying server entry points directly
- ❌ Using npm:@supabase/supabase-js (use jsr:@supabase/supabase-js@2)
- ❌ Importing from kv_store.tsx directly (use kv_cache.tsx)
- ❌ Adding routes for only one server (must add for both)
- ❌ Using hardcoded styles (use CSS variables from globals.css)

## Troubleshooting

### "503 Service Unavailable"
```bash
# Redeploy the server
supabase functions deploy make-server-373d8b09

# Check logs
supabase functions logs make-server-373d8b09 --tail 50
```

### "AI Modifications Not Working"
```bash
# Check mode setting
supabase secrets list | grep CURRENT_SERVER_MODE

# Should be: development
# If not, set it:
supabase secrets set CURRENT_SERVER_MODE=development
```

### "Changes Not Appearing"
```bash
# Restart development server
supabase functions deploy make-server-development

# Clear browser cache (hard refresh)
# Mac: Cmd+Shift+R
# Windows: Ctrl+Shift+R
```

## Support Resources

- **Supabase Dashboard**: https://supabase.com/dashboard/project/rvwduromkqfzplwnmijl
- **Function Logs**: Functions > make-server-373d8b09 or make-server-development
- **Database**: Table Editor > kv_store_373d8b09
- **Environment Variables**: Settings > API

## Technical Specifications

- **Architecture**: Three-tier (Frontend → Server → Database)
- **Runtime**: Deno (Supabase Edge Functions)
- **Framework**: Hono (Web framework for Deno)
- **Database**: PostgreSQL with KV abstraction layer
- **Authentication**: Supabase Auth with JWT
- **Retry Logic**: Exponential backoff for auth requests
- **Cache**: User-scoped pre-warming for performance

## Version History

- **2026-01-20**: Initial three-server architecture setup
  - Production server: make-server-373d8b09
  - Development server: make-server-development
  - Legacy server: make-server-ac1075a9 (deprecated)
  - Complete documentation suite
  - Frontend server config utility
  - Health check endpoints

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────┐
│ COFOUNDER+ SERVER QUICK REFERENCE                           │
├─────────────────────────────────────────────────────────────┤
│ PRODUCTION SERVER                                           │
│ • Name: make-server-373d8b09 (o9)                          │
│ • URL: .../functions/v1/make-server-373d8b09/*             │
│ • AI Modifications: FORBIDDEN                               │
│                                                             │
│ DEVELOPMENT SERVER                                          │
│ • Name: make-server-development (dev)                       │
│ • URL: .../functions/v1/make-server-development/*          │
│ • AI Modifications: ALLOWED (when mode=development)         │
│                                                             │
│ ENABLE DEVELOPMENT                                          │
│ $ supabase secrets set CURRENT_SERVER_MODE=development      │
│                                                             │
│ DEPLOY TO PRODUCTION                                        │
│ $ supabase secrets set CURRENT_SERVER_MODE=production       │
│ $ supabase functions deploy make-server-373d8b09            │
│                                                             │
│ CHECK HEALTH                                                │
│ $ curl .../make-server-373d8b09/health                      │
│ $ curl .../make-server-development/health                   │
│                                                             │
│ VIEW LOGS                                                   │
│ $ supabase functions logs make-server-373d8b09 --follow     │
│                                                             │
│ EMERGENCY ROLLBACK                                          │
│ $ git revert HEAD && supabase functions deploy ...          │
└─────────────────────────────────────────────────────────────┘
```

---

**Last Updated**: 2026-01-20  
**Document Version**: 1.0.0  
**Maintained By**: Cofounder+ Development Team
