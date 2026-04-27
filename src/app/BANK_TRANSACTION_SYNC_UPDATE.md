# Bank Transaction Sync - 24-Hour Window & Credit Cost Implementation

## Summary
Implemented smart transaction loading with 24-hour sync window, credit cost for early syncs, and proper API usage tracking to minimize Plaid costs.

## Changes Made

### 1. Backend: `/supabase/functions/server/plaid-bank-endpoints.tsx`

#### Updated `/sync-transactions` Endpoint (Lines 564-674)
**Key Changes:**
- **24-Hour Rate Limit**: Tracks last transaction sync per bank account with key `plaid_transaction_sync_limit:${itemId}`
- **Credit Cost Logic**: If synced within 24 hours, requires 10 credits or user waits
- **New Parameter**: Added `forceWithCredits` boolean to request body
- **Extended History**: Changed from 90 days to 2 years of transaction history (Plaid max)
- **Credit Deduction**: Automatically deducts 10 credits from user's balance if `forceWithCredits: true`

**Error Responses:**
```javascript
// Within 24 hours without forceWithCredits
Status: 429
{
  success: false,
  error: "You can sync transactions for free in X hours. To sync now, it will cost 10 credits.",
  rateLimited: true,
  hoursRemaining: 12,
  creditCost: 10,
  requiresCredits: true
}

// Insufficient credits
Status: 402
{
  success: false,
  error: "Insufficient credits. You need 10 credits to sync now.",
  requiresCredits: true,
  currentBalance: 5,
  requiredAmount: 10
}
```

**Success Response:**
```javascript
{
  success: true,
  transactionsImported: 45,
  totalTransactions: 45,
  lastSynced: "2026-03-05T...",
  creditsCharged: 10 // or 0 if free
}
```

---

### 2. Frontend: `/src/components/PlaidBankConnect.tsx`

#### New Icon Import (Line 6)
```typescript
import { ..., Download } from 'lucide-react';
```

#### Updated `handleSyncTransactions` Function (Lines 525-616)
**Key Changes:**
- Added `forceWithCredits` parameter (default: false)
- Handles 429 rate limit response with credit cost dialog
- Shows confirmation: "You can sync for free in X hours. Use 10 credits now?"
- Handles 402 insufficient credits → offers to buy credits
- Success message shows credits used: "Imported 45 transactions (10 credits used)"

#### New `handleRefreshBalance` Function (Lines 672-725)
- Separate function for balance refresh (24-hour window, no credit cost)
- Uses `/plaid-bank/get-balance` endpoint
- Handles rate limit gracefully

#### Updated UI Structure (Lines 1021-1098)
**Per Bank Account:**
1. **Status Badge** - Connection status
2. **Refresh Balance Button** (NEW)
   - Icon: `RefreshCw`
   - Label: "Refresh Balance"
   - Style: Outline with design system variables
   - 24-hour rate limit (no credit cost)
3. **Load Transactions Button** (UPDATED)
   - Icon: `Download` (was `RefreshCw`)
   - Label: "Load Transactions" (was "Sync Transactions")
   - Style: Primary with design system variables
   - 24-hour rate limit with 10 credit option
4. **Disconnect Button**

---

### 3. Design System Compliance

All buttons now use CSS variables from `/src/styles/globals.css`:

**Refresh Balance Button:**
```tsx
style={{
  borderRadius: 'var(--radius-md)',
  padding: 'var(--spacing-2) var(--spacing-3)',
  fontWeight: 'var(--font-weight-medium)',
  borderColor: 'var(--color-border)',
  color: 'var(--color-foreground)'
}}
```

**Load Transactions Button:**
```tsx
style={{
  backgroundColor: 'var(--color-primary)',
  color: 'var(--color-primary-foreground)',
  borderRadius: 'var(--radius-md)',
  padding: 'var(--spacing-2) var(--spacing-3)',
  fontWeight: 'var(--font-weight-medium)',
  border: 'none'
}}
```

**Available Design System Variables:**
- Colors: `--color-primary`, `--color-foreground`, `--color-border`
- Spacing: `--spacing-1` through `--spacing-8`
- Radius: `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`
- Fonts: `--font-weight-normal`, `--font-weight-medium`, `--font-weight-semibold`, `--font-weight-bold`

---

## User Flow

### Scenario 1: Free Sync (>24 hours since last sync)
1. User clicks "Load Transactions"
2. Backend checks: `hoursSinceSync >= 24` ✅
3. Transactions load immediately
4. Toast: "Successfully imported 45 transactions"

### Scenario 2: Early Sync with Credits
1. User clicks "Load Transactions"
2. Backend checks: `hoursSinceSync < 24` ❌
3. Frontend shows confirm dialog: "You can sync for free in 12 hours. Use 10 credits now?"
4. User clicks OK
5. Backend deducts 10 credits
6. Transactions load
7. Toast: "Successfully imported 45 transactions (10 credits used)"

### Scenario 3: Early Sync, Insufficient Credits
1. User clicks "Load Transactions"
2. Backend checks credits: `balance < 10` ❌
3. Frontend shows dialog: "Insufficient credits. Purchase more?"
4. User clicks OK → Redirects to `/settings?tab=credits`

### Scenario 4: Balance Refresh
1. User clicks "Refresh Balance"
2. Backend checks: `hoursSinceRefresh >= 24` ✅
3. Balance updates (included free with Plaid)
4. Toast: "Bank balance updated successfully!"

---

## Testing Locations

1. **Finance Page** → "Overview" tab → Click bank card → "Connect Bank Account" button
2. **Settings Page** (if you have bank connection settings there)
3. Any component that renders `<PlaidBankConnect />` 

The component is used in:
- `/src/components/operations/FinanceOperationsNew.tsx` (Line 2053)

---

## Next Steps (Not Implemented Yet)

1. **Auto-Sync Every 24 Hours**: Would require a cron job or scheduled Supabase function to automatically call `/sync-transactions` for all accounts every 24 hours
2. **Visual Indicator**: Badge/chip showing "Free sync available" vs "Costs 10 credits"
3. **Transaction History Viewer**: Show which transactions have been synced and when
4. **Webhook Integration**: Use Plaid webhooks to automatically sync when new transactions are available (no polling needed)

---

## Cost Optimization

✅ **Smart Tracking**: Each bank account tracks last sync separately
✅ **2-Year History**: Gets maximum available history from Plaid in one call
✅ **Duplicate Prevention**: Checks existing transactions by `plaid_transaction_id`
✅ **Free Balance Updates**: Balance is included free with transaction syncs
✅ **Credit Gate**: Prevents excessive API calls while giving users emergency option
