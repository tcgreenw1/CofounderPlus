# GPT-5.1 Implementation Guide for Cofounder+

**Last Updated:** December 6, 2025  
**Status:** ✅ WORKING - Function calling successfully tested with 42 CRUD functions

## Critical Differences: GPT-5.1 vs GPT-4o

### 1. API Endpoint
- **GPT-4o:** Uses `/v1/responses` endpoint
- **GPT-5.1:** Uses `/v1/chat/completions` endpoint (standard Chat API)

### 2. Tools Format
```typescript
// ❌ WRONG (GPT-4o format)
{
  type: "function",
  function: {
    name: "createSalesLead",
    description: "...",
    parameters: { ... }
  }
}

// ✅ CORRECT (GPT-5.1 format)
{
  type: "function",
  function: {
    name: "createSalesLead",
    description: "...",
    parameters: {
      type: "object",
      properties: { ... },
      required: [...],
      additionalProperties: false  // REQUIRED for strict mode
    },
    strict: true  // REQUIRED - enables strict JSON schema validation
  }
}
```

### 3. Response Format
```typescript
// GPT-4o returns:
message.function_call

// GPT-5.1 returns:
message.tool_calls[]  // Array of tool calls
```

### 4. Token Limits
- **GPT-4o:** Uses `max_tokens`
- **GPT-5.1:** Uses `max_completion_tokens`

### 5. Tool Choice
- Both support `tool_choice: 'auto'` to let AI decide when to call functions

---

## 🚨 CRITICAL: Database Storage Pattern

### ✅ CORRECT Pattern: Store as Arrays
**All data MUST be stored as arrays under a single key per entity type.**

```typescript
// ✅ CORRECT - Store as array
export async function createSalesDeal(params) {
  const dealId = `deal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const deal = { id: dealId, ...params, created_at: new Date().toISOString() };
  
  // Get existing array
  const key = `business:${params.userId}:${params.businessId}:sales_deals`;
  let deals = await kv.get(key) || [];
  if (!Array.isArray(deals)) deals = [];
  
  // Push new item to array
  deals.push(deal);
  
  // Save entire array back
  await kv.set(key, deals);
  
  return { success: true, data: deal };
}
```

### ❌ WRONG Pattern: Individual Keys
**DO NOT create individual keys for each item - this breaks frontend retrieval**

```typescript
// ❌ WRONG - Creates individual keys
export async function createSalesDeal(params) {
  const dealId = `deal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const deal = { id: dealId, ...params };
  
  // This creates: sales_deal:userId:businessId:dealId
  // Frontend expects: business:userId:businessId:sales_deals (array)
  await kv.set(`sales_deal:${params.userId}:${params.businessId}:${dealId}`, deal);
  
  return { success: true, data: deal };
}
```

### Update Operations
```typescript
export async function updateSalesDeal(params) {
  const key = `business:${params.userId}:${params.businessId}:sales_deals`;
  let deals = await kv.get(key) || [];
  if (!Array.isArray(deals)) deals = [];
  
  const dealIndex = deals.findIndex(d => d.id === params.dealId);
  if (dealIndex === -1) return { success: false, error: 'Deal not found' };
  
  const deal = deals[dealIndex];
  if (params.title) deal.title = params.title;
  if (params.value) deal.value = params.value;
  deal.updated_at = new Date().toISOString();
  
  await kv.set(key, deals);
  return { success: true, data: deal };
}
```

### Delete Operations
```typescript
export async function deleteSalesDeal(params) {
  const key = `business:${params.userId}:${params.businessId}:sales_deals`;
  let deals = await kv.get(key) || [];
  if (!Array.isArray(deals)) deals = [];
  
  const dealIndex = deals.findIndex(d => d.id === params.dealId);
  if (dealIndex === -1) return { success: false, error: 'Deal not found' };
  
  deals.splice(dealIndex, 1);
  await kv.set(key, deals);
  return { success: true };
}
```

### Standard Key Format
All business data uses this pattern:
```
business:${userId}:${businessId}:${entityType}
```

Examples:
- `business:user123:biz456:products`
- `business:user123:biz456:sales_leads`
- `business:user123:biz456:sales_deals`
- `business:user123:biz456:sales_customers`
- `business:user123:biz456:sales_email_sequences`
- `business:user123:biz456:marketing_leads`
- `business:user123:biz456:employee_benefits`
- `business:user123:biz456:employee_performance`
- `business:user123:biz456:contractors`
- `business:user123:biz456:handbooks`
- `business:user123:biz456:onboarding_plans`

**Exception:** User profiles use `user_profile:${userId}` (not business-scoped)

---

## Current Working Implementation

### File Structure
```
/supabase/functions/server/
├── gpt-5-1-chat-endpoint.tsx          # Main GPT-5.1 endpoint
├── gpt-5-1-function-definitions.ts    # ALL_FUNCTIONS_GPT51 array (42 functions)
├── function-handlers.ts               # executeFunctionCall() logic
├── chat-system-message.tsx            # System message builder
├── chat-memory-helpers.tsx            # Unified memory loader
└── kv_store.tsx                       # Database operations
```

### Request Body
```typescript
{
  message: string,
  sessionId: string,
  conversationHistory: Array<{role: string, content: string}>,
  businessContext: {
    id: string,        // e.g., "biz-1762102016472-gxk7b3f99"
    name: string,      // e.g., "Cofounder+"
    industry: string
  }
}
```

### Critical Bug Fix: Business ID Injection
**Problem:** GPT-5.1 was using business name ("Cofounder+") instead of business ID ("biz-1762102016472-gxk7b3f99") in function calls.

**Solution:** Server-side automatic injection in `/supabase/functions/server/gpt-5-1-chat-endpoint.tsx`:
```typescript
// CRITICAL FIX: Override businessId with the correct ID from businessContext
if (businessContext?.id && !functionArgs.businessId) {
  functionArgs.businessId = businessContext.id;
  console.log(`💡 Auto-injected businessId: ${businessContext.id}`);
} else if (businessContext?.id && functionArgs.businessId !== businessContext.id) {
  console.log(`⚠️ Correcting businessId from "${functionArgs.businessId}" to "${businessContext.id}"`);
  functionArgs.businessId = businessContext.id;
}
```

---

## Complete Function List (42 Functions)

### Finance (4 functions)
- `createTransaction`, `updateTransaction`, `deleteTransaction`
- `createBudget`

### Roadmap (3 functions)
- `createRoadmapTask`, `updateRoadmapTaskStatus`, `deleteRoadmapTask`

### HR (14 functions)
- `addTeamMember`, `updateTeamMember`
- `createHandbook`, `updateHandbook`, `deleteHandbook`
- `createOnboardingPlan`, `updateOnboardingPlan`, `deleteOnboardingPlan`
- `createEmployeeBenefit`, `updateEmployeeBenefit`, `deleteEmployeeBenefit`
- `createEmployeePerformance`, `updateEmployeePerformance`, `deleteEmployeePerformance`
- `updateUserProfile`

### Product (3 functions)
- `createProduct`, `updateProduct`
- `getProducts` (READ operation - 2 credits)

### Sales (11 functions)
- `createSalesLead`, `updateSalesLead`
- `createSalesDeal`, `updateSalesDeal`, `deleteSalesDeal`
- `createSalesCustomer`, `updateSalesCustomer`, `deleteSalesCustomer`
- `createSalesEmailSequence`, `updateSalesEmailSequence`, `deleteSalesEmailSequence`

### Marketing (4 functions)
- `createMarketingCampaign`, `updateMarketingCampaign`
- `createMarketingLead`, `updateMarketingLead`, `deleteMarketingLead`

### Contractors (3 functions)
- `createContractor`, `updateContractor`, `deleteContractor`

### Notes (1 function)
- `createNote`

---

## Credits System

### Credit Costs per Function
```typescript
const READ_FUNCTIONS = ['getProducts']; // 2 credits
const WRITE_FUNCTIONS = [
  'createTransaction', 'updateTransaction', 'deleteTransaction', 'createBudget',
  'createRoadmapTask', 'updateRoadmapTaskStatus', 'deleteRoadmapTask',
  'addTeamMember', 'updateTeamMember', 'createProduct', 'updateProduct',
  'createSalesLead', 'updateSalesLead', 
  'createSalesDeal', 'updateSalesDeal', 'deleteSalesDeal',
  'createSalesCustomer', 'updateSalesCustomer', 'deleteSalesCustomer',
  'createSalesEmailSequence', 'updateSalesEmailSequence', 'deleteSalesEmailSequence',
  'createMarketingCampaign', 'updateMarketingCampaign',
  'createMarketingLead', 'updateMarketingLead', 'deleteMarketingLead',
  'createNote', 'createHandbook', 'updateHandbook', 'deleteHandbook',
  'createOnboardingPlan', 'updateOnboardingPlan', 'deleteOnboardingPlan',
  'createEmployeeBenefit', 'updateEmployeeBenefit', 'deleteEmployeeBenefit',
  'createEmployeePerformance', 'updateEmployeePerformance', 'deleteEmployeePerformance',
  'createContractor', 'updateContractor', 'deleteContractor',
  'updateUserProfile'
]; // 10 credits each
```

### Credit Calculation
```typescript
let totalCredits = 1; // Base credit for chat message
for (const func of functionsExecuted) {
  totalCredits += getCreditCost(func.name);
}
await deductUserCredits(user.id, totalCredits, 'Cofounder Chat Message (GPT-5.1)');
```

If credits fail, return 402 status with `needsUpgrade: true`

---

## Function Definition Format

### Example: createSalesDeal
```typescript
{
  type: "function",
  function: {
    name: "createSalesDeal",
    description: "Create a new sales deal or opportunity. Use when user wants to track a specific sales opportunity through the pipeline.",
    parameters: {
      type: "object",
      properties: {
        businessId: {
          type: "string",
          description: "The ID of the business (auto-injected by server)"
        },
        title: {
          type: "string",
          description: "Deal title or opportunity name"
        },
        customerId: {
          type: "string",
          description: "ID of the customer associated with this deal"
        },
        value: {
          type: "number",
          description: "Deal value in dollars"
        },
        stage: {
          type: "string",
          enum: ["lead", "qualified", "proposal", "negotiation", "closed-won", "closed-lost"],
          description: "Current stage in the sales pipeline"
        },
        probability: {
          type: "number",
          description: "Win probability percentage (0-100)"
        },
        expectedCloseDate: {
          type: "string",
          description: "Expected close date in ISO format"
        },
        notes: {
          type: "string",
          description: "Notes about the deal"
        }
      },
      required: ["businessId", "title", "value", "stage"],
      additionalProperties: false
    },
    strict: true
  }
}
```

---

## Unified Memory System

All chats (Product, Marketing, Sales, Finance, HR, Cofounder AI) share ONE unified memory loaded from:
- `insights:product:${businessId}:*`
- `insights:marketing:${businessId}:*`
- `insights:sales:${businessId}:*`
- `insights:finance:${businessId}:*`
- `insights:hr:${businessId}:*`

**Location:** `/supabase/functions/server/chat-memory-helpers.tsx`

### How Memory Works
1. Quick Actions on operation pages (Marketing, Sales, Finance, HR, Product) save insights
2. Insights are stored with department-specific prefixes
3. When ANY chat loads, it pulls ALL insights from ALL departments
4. Result: Every chat knows everything (like Jarvis from Iron Man)

---

## Adding New Functions - Complete Checklist

When adding new functions to the GPT-5.1 system, follow these steps:

### 1. Add Function Definition (`gpt-5-1-function-definitions.ts`)
```typescript
export const SALES_FUNCTIONS_GPT51 = [
  {
    type: "function",
    function: {
      name: "createNewEntity",
      description: "Clear description of what this function does",
      parameters: {
        type: "object",
        properties: {
          businessId: { type: "string", description: "Business ID" },
          // ... other properties
        },
        required: ["businessId", /* other required fields */],
        additionalProperties: false
      },
      strict: true
    }
  }
];

// Add to ALL_FUNCTIONS_GPT51 array
export const ALL_FUNCTIONS_GPT51 = [
  ...FINANCE_FUNCTIONS_GPT51,
  ...ROADMAP_FUNCTIONS_GPT51,
  ...HR_FUNCTIONS_GPT51,
  ...PRODUCT_FUNCTIONS_GPT51,
  ...SALES_FUNCTIONS_GPT51,
  ...MARKETING_FUNCTIONS_GPT51,
  ...NOTES_FUNCTIONS_GPT51,
];
```

### 2. Add Handler Function (`function-handlers.ts`)
```typescript
export async function createNewEntity(params: { businessId: string; userId: string; /* ... */ }) {
  try {
    const entityId = `entity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const entity = { 
      id: entityId, 
      business_id: params.businessId, 
      user_id: params.userId, 
      /* ... other fields */
      created_at: new Date().toISOString(), 
      updated_at: new Date().toISOString() 
    };
    
    // ✅ CRITICAL: Use array pattern
    const key = `business:${params.userId}:${params.businessId}:entities`;
    let entities = await kv.get(key) || [];
    if (!Array.isArray(entities)) entities = [];
    entities.push(entity);
    await kv.set(key, entities);
    
    console.log(`✅ Entity created: ${entityId}`);
    return { success: true, data: entity };
  } catch (error: any) {
    console.error('createNewEntity error:', error);
    return { success: false, error: error.message };
  }
}
```

### 3. Add to WRITE_FUNCTIONS array (`gpt-5-1-chat-endpoint.tsx`)
```typescript
const WRITE_FUNCTIONS = [
  'createTransaction', 
  // ... existing functions
  'createNewEntity',  // ← Add here
];
```

### 4. Add to Function Map (`function-handlers.ts`)
```typescript
const functionMap: Record<string, Function> = {
  createTransaction,
  // ... existing functions
  createNewEntity,  // ← Add here
};
```

### 5. Test the Function
```
User: "Create a new entity called Test Entity"
Expected: Function executes and data appears in database
```

---

## Testing Function Calls

### Current Test Interface
Location: `/cofounder-ai` page

### Test Examples That Work
1. **Create Lead:** "Add a new lead named Jennifer from TechCorp"
2. **Create Transaction:** "Log a $500 expense for office supplies purchased today"
3. **Add Team Member:** "Add Michael as Senior Developer"
4. **Create Budget:** "Set a monthly marketing budget of $3000 starting today"
5. **Create Task:** "Create a product task to design the landing page, high priority"
6. **Create Campaign:** "Launch a social media campaign called Summer Sale with $2000 budget"
7. **Create Deal:** "Create a new deal worth $50k for Enterprise Software, currently in proposal stage"
8. **Create Customer:** "Add TechCorp as a customer, they're in the SaaS industry"
9. **Create Email Sequence:** "Create an onboarding email sequence for new trial users"
10. **Create Marketing Lead:** "Add a marketing lead Sarah from Acme Inc from our website"
11. **Create Benefit:** "Add health insurance as an employee benefit, costs $500/month"
12. **Create Performance Review:** "Create a performance review for employee emp_123, rating 4/5"
13. **Create Contractor:** "Add John Smith as a contractor, specialty in graphic design, $75/hour"

### Verification
All test data correctly appears on respective pages (Sales, Finance, HR, Product, Marketing)

---

## DO NOT Break These (They Use GPT-4o)

Keep these on GPT-4o - they are working perfectly:
- Marketing Quick Actions (`/supabase/functions/server/marketing-endpoints.tsx`)
- Sales Quick Actions
- Finance Quick Actions
- HR Quick Actions
- Product Quick Actions
- All Insights generation

**Only the CHAT systems** should use GPT-5.1.

---

## Common Mistakes to Avoid

1. **❌ Using individual keys instead of arrays** - Frontend expects arrays under single keys
2. **❌ Using GPT-4o function format** - Will fail with GPT-5.1
3. **❌ Forgetting `strict: true`** - GPT-5.1 requires strict mode
4. **❌ Forgetting `additionalProperties: false`** - Required for strict schema
5. **❌ Using `max_tokens`** - Use `max_completion_tokens` instead
6. **❌ Checking `function_call`** - Use `tool_calls[]` array instead
7. **❌ Not injecting businessId** - Always inject server-side, don't trust GPT
8. **❌ Hardcoding business ID in system message only** - Must inject in function args too
9. **❌ Using `JSON.stringify()` inconsistently** - Some old functions use it, new functions don't need it
10. **❌ Forgetting to add function to ALL locations** - Must update 4 files (definitions, handlers, WRITE_FUNCTIONS, functionMap)

---

## Success Indicators

✅ GPT responds to chat messages  
✅ GPT calls functions when appropriate  
✅ Functions write to database with correct businessId  
✅ Data stored as arrays under single keys  
✅ Data appears on operation pages  
✅ Credits are deducted correctly  
✅ Unified memory is loaded from all departments  
✅ Conversation history is maintained  
✅ Update and delete operations work on array items  

---

## File Locations Reference

### Working GPT-5.1 Files (DO NOT DELETE)
- `/supabase/functions/server/gpt-5-1-chat-endpoint.tsx`
- `/supabase/functions/server/gpt-5-1-function-definitions.ts`
- `/supabase/functions/server/function-handlers.ts`
- `/supabase/functions/server/chat-system-message.tsx`
- `/supabase/functions/server/chat-memory-helpers.tsx`

### Files to Keep (GPT-4o Quick Actions)
- `/supabase/functions/server/marketing-endpoints.tsx`
- `/supabase/functions/server/finance-endpoints.tsx`
- `/supabase/functions/server/sales-endpoints.tsx`
- `/supabase/functions/server/hr-endpoints.tsx`
- `/supabase/functions/server/product-endpoints.tsx`

### Frontend Chat Pages
- `/components/ProductChat.tsx`
- `/components/MarketingChat.tsx`
- `/components/SalesChat.tsx`
- `/components/FinanceChat.tsx`
- `/components/HRChat.tsx`
- `/app-cofounder-ai.tsx` (main Cofounder AI chat)

---

## Debugging Checklist

If new functions aren't working:

1. **Check logs for function execution:**
   ```
   ⚙️ Executing: createSalesDeal
   ✅ Sales deal created: deal_123
   ```

2. **Verify data is stored as array:**
   ```typescript
   const key = `business:userId:businessId:sales_deals`;
   const data = await kv.get(key);
   console.log(Array.isArray(data)); // Should be true
   ```

3. **Verify key format matches existing working functions:**
   - ✅ `business:userId:businessId:entityType`
   - ❌ `entityType:userId:businessId:entityId`

4. **Check if function is in all 4 required locations:**
   - Function definition in `gpt-5-1-function-definitions.ts`
   - Handler implementation in `function-handlers.ts`
   - Name in `WRITE_FUNCTIONS` array in `gpt-5-1-chat-endpoint.tsx`
   - Name in `functionMap` in `function-handlers.ts`

5. **Verify businessId injection is working:**
   ```
   💡 Auto-injected businessId: biz-1762102016472-gxk7b3f99
   ```

6. **Test with simple prompt:**
   ```
   "Create a test [entity] called Sample"
   ```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Chat UI                         │
│  (ProductChat, SalesChat, MarketingChat, etc.)              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ POST /make-server-373d8b09/gpt-5-1-chat
                         │ { message, sessionId, conversationHistory, businessContext }
                         ↓
┌─────────────────────────────────────────────────────────────┐
│            gpt-5-1-chat-endpoint.tsx                        │
│  • Verify user auth                                          │
│  • Load unified memory from all departments                  │
│  • Build system message with business context                │
│  • Send to OpenAI GPT-5.1 with ALL_FUNCTIONS_GPT51          │
│  • Inject correct businessId into function arguments         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Functions called?
                         ↓
┌─────────────────────────────────────────────────────────────┐
│            function-handlers.ts                             │
│  • executeFunctionCall() routes to correct handler          │
│  • Each handler stores data as ARRAY under single key       │
│  • Returns { success: true/false, data, error }             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                   kv_store.tsx                              │
│  • get(key) - Retrieves array                                │
│  • set(key, array) - Saves entire array                     │
│  • getByPrefix(prefix) - Gets all matching keys             │
└─────────────────────────────────────────────────────────────┘
```

---

**Remember:** Always store data as arrays under single keys. This is the #1 most important pattern for the system to work correctly.
