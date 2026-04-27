# Endpoint Implementation Plan
**Created**: 2026-04-26
**Total Unique Endpoints Found**: 532
**Top-Level Categories**: 77

## Priority Levels

### 🔴 CRITICAL (Causing active 404 errors)
- [ ] `/businesses` - User business management
- [ ] `/number-one-goal` - Primary user goal tracking  
- [ ] `/organizations/list` - Organization list
- [ ] `/organizations/current` - Current organization
- [ ] `/support/user-tickets` - Support tickets
- [ ] `/credits/balance` - Credit balance
- [ ] `/email-2fa/check-enabled` - 2FA status check
- [ ] `/team-v3/data` - Team data v3
- [ ] `/bookkeeping/test` - Bookkeeping service health

### 🟠 HIGH PRIORITY (Core app functionality)
- [ ] `/dashboard/widgets` - Dashboard widgets (already added)
- [ ] `/notifications/list` - Notifications (already added)
- [ ] `/nav-customize/get-desktop` - Navigation customization (already added)
- [ ] `/users/team` - Team users (already added)
- [ ] `/user-data-context` - User context (already added)
- [ ] `/subscriptions/user-subscriptions` - Subscriptions (already added)

### 🟡 MEDIUM PRIORITY (Important features)
- [ ] `/finance/*` - Financial management (46 endpoints)
- [ ] `/ai/*` - AI chat and sessions (14 endpoints)
- [ ] `/roadmap/*` - Roadmap management
- [ ] `/notes/*` - Notes system
- [ ] `/todos/*` - Todo management
- [ ] `/calendar/*` - Calendar integration
- [ ] `/files/*` - File management

### 🟢 LOW PRIORITY (Admin, integrations, special features)
- [ ] `/admin/*` - Admin panel (29 endpoints)
- [ ] `/github/*` - GitHub integration (18 endpoints)
- [ ] `/google/*` - Google integration (12 endpoints)
- [ ] `/stripe/*` - Payment processing
- [ ] `/slack/*` - Slack integration
- [ ] `/plaid-bank/*` - Banking integration

---

## Implementation Progress by Category

### ✅ COMPLETED
- [x] `/health` - Health check endpoint
- [x] `/test` - Test endpoint  
- [x] `/dashboard/widgets` - Dashboard widgets
- [x] `/notifications/list` - Notifications list
- [x] `/nav-customize/get-desktop` - Navigation customization
- [x] `/users/team` - Team users list
- [x] `/user-data-context` - POST user context
- [x] `/subscriptions/user-subscriptions` - User subscriptions
- [x] `/businesses` - GET businesses list (added)
- [x] `/businesses` - POST create business (added)
- [x] `/number-one-goal` - GET/POST user goal (added)
- [x] `/organizations/list` - GET organizations (added)
- [x] `/organizations/current` - GET current org (added)
- [x] `/support/user-tickets` - GET support tickets (added)
- [x] `/credits/balance` - GET credit balance (added)
- [x] `/email-2fa/check-enabled` - GET 2FA status (added)
- [x] `/bookkeeping/test` - GET bookkeeping health (added)
- [x] `/team-v3/data` - GET team v3 data (added)

### 🚧 IN PROGRESS
- [ ] (None currently)

### ⏳ PENDING - Category: Admin (29 endpoints)
- [ ] GET `/admin/users` - List all users
- [ ] GET `/admin/users/:userId` - Get specific user
- [ ] PUT `/admin/users/:userId` - Update user
- [ ] DELETE `/admin/users/:userId` - Delete user
- [ ] PUT `/admin/users/:userId/status` - Update user status
- [ ] POST `/admin/users/bulk-activate` - Bulk activate users
- [ ] POST `/admin/users/bulk-deactivate` - Bulk deactivate users
- [ ] POST `/admin/users/bulk-delete` - Bulk delete users
- [ ] POST `/admin/users/bulk-role-update` - Bulk role update
- [ ] POST `/admin/impersonate/:userId` - Impersonate user
- [ ] POST `/admin/reset-password` - Reset user password
- [ ] GET `/admin/subscriptions` - List subscriptions
- [ ] GET `/admin/notifications` - Admin notifications
- [ ] POST `/admin/seed/notification` - Seed notification
- [ ] POST `/admin/test-email` - Test email system
- [ ] GET `/admin/email-system-status` - Email system status
- [ ] GET `/admin/employees` - List employees
- [ ] POST `/admin/employees` - Create employee
- [ ] PUT `/admin/employees/:id` - Update employee
- [ ] DELETE `/admin/employees/:id` - Delete employee
- [ ] GET `/admin/businesses/clear-industries` - Clear business industries
- [ ] GET `/admin/founder-calls/bookings` - List all bookings
- [ ] GET `/admin/founder-calls/booking/:bookingId` - Get booking
- [ ] PUT `/admin/founder-calls/booking/:bookingId` - Update booking
- [ ] DELETE `/admin/founder-calls/booking/:bookingId` - Delete booking
- [ ] POST `/admin/founder-calls/booking/:bookingId/send-confirmation` - Send confirmation
- [ ] POST `/admin/founder-calls/booking/:bookingId/send-reminder` - Send reminder
- [ ] GET `/admin/founder-calls/availability` - Get availability
- [ ] PUT `/admin/founder-calls/availability-settings` - Update availability settings

### ⏳ PENDING - Category: AI & Chat (20+ endpoints)
- [ ] POST `/ai/chat` - AI chat endpoint
- [ ] POST `/ai/chat-enhanced` - Enhanced AI chat
- [ ] GET `/ai/chat-history` - Chat history
- [ ] GET `/ai/chat-sessions` - List chat sessions
- [ ] GET `/ai/chat-sessions/:sessionId` - Get specific session
- [ ] DELETE `/ai/chat-sessions/:sessionId` - Delete session
- [ ] GET `/ai/debug-sessions/:userId` - Debug user sessions
- [ ] GET `/ai/ai-usage/:businessId` - AI usage stats
- [ ] POST `/ai/business-context` - Update business context
- [ ] GET `/ai/test-connection` - Test AI connection
- [ ] POST `/ai/test-business-update` - Test business update
- [ ] POST `/agi/generate-roadmap` - Generate roadmap with AGI
- [ ] POST `/agi/onboarding-chat` - AGI onboarding chat
- [ ] POST `/cofounder/chat` - Cofounder chat
- [ ] POST `/chat/cpa-assistant` - CPA assistant chat
- [ ] POST `/chatkit/chat` - ChatKit integration
- [ ] POST `/simple-ai-chat` - Simple AI chat
- [ ] POST `/gpt-5-1/chat` - GPT-5.1 chat
- [ ] POST `/gpt-5-1-chat` - GPT-5.1 chat (alt path)

### ⏳ PENDING - Category: Finance (46 endpoints)
- [ ] GET `/finance/:businessId/summary` - Financial summary
- [ ] GET `/finance/data` - Financial data
- [ ] GET `/finance/overview` - Financial overview
- [ ] GET `/finance/context` - Financial context
- [ ] POST `/finance/add-income` - Add income transaction
- [ ] POST `/finance/add-expense` - Add expense transaction
- [ ] GET `/finance/transactions` - List transactions
- [ ] POST `/finance/transactions` - Create transaction
- [ ] GET `/finance/transactions/:id` - Get transaction
- [ ] PUT `/finance/transactions/:id` - Update transaction
- [ ] DELETE `/finance/transactions/:id` - Delete transaction
- [ ] POST `/finance/bulk-import` - Bulk import transactions
- [ ] GET `/finance/invoices` - List invoices
- [ ] POST `/finance/invoices` - Create invoice
- [ ] GET `/finance/invoices/:id` - Get invoice
- [ ] PUT `/finance/invoices/:id` - Update invoice
- [ ] DELETE `/finance/invoices/:id` - Delete invoice
- [ ] GET `/finance/receipts` - List receipts
- [ ] POST `/finance/receipts` - Create receipt
- [ ] GET `/finance/receipts/:receiptId` - Get receipt
- [ ] DELETE `/finance/receipts/:receiptId` - Delete receipt
- [ ] POST `/finance/upload-receipt` - Upload receipt image
- [ ] POST `/finance/process-receipt` - Process receipt with OCR
- [ ] GET `/finance/budgets` - List budgets
- [ ] POST `/finance/create-budget` - Create budget
- [ ] PUT `/finance/budgets/:id` - Update budget
- [ ] DELETE `/finance/budgets/:id` - Delete budget
- [ ] GET `/finance/reports` - List financial reports
- [ ] POST `/finance/generate-report` - Generate report
- [ ] GET `/finance/reports/:reportId` - Get report
- [ ] DELETE `/finance/reports/:reportId` - Delete report
- [ ] GET `/finance/projections` - Financial projections
- [ ] GET `/finance/bank-balance` - Get bank balance
- [ ] POST `/finance/set-bank-balance` - Set bank balance
- [ ] POST `/finance/categorize-with-agi` - Categorize with AGI
- [ ] POST `/finance/categorize-with-cofounder` - Categorize with Cofounder
- [ ] POST `/finance/process-scheduled` - Process scheduled transactions

### ⏳ PENDING - Category: Businesses (10+ endpoints)
- [x] GET `/businesses` - List businesses (COMPLETED)
- [x] POST `/businesses` - Create business (COMPLETED)
- [ ] GET `/businesses/:id` - Get specific business
- [ ] PUT `/businesses/:id` - Update business
- [ ] DELETE `/businesses/:id` - Delete business
- [ ] PUT `/businesses/:id/description` - Update description
- [ ] GET `/business-health/:businessId` - Business health metrics
- [ ] GET `/business-memory/:businessId` - Business memory/context
- [ ] POST `/business-memory/extract` - Extract business insights

### ⏳ PENDING - Category: Roadmap & Planning (15+ endpoints)
- [ ] GET `/roadmap` - Get roadmap
- [ ] POST `/roadmap` - Create roadmap
- [ ] PUT `/roadmap` - Update roadmap
- [ ] GET `/roadmap/milestones` - List milestones
- [ ] POST `/roadmap/milestones` - Create milestone
- [ ] PUT `/roadmap/milestones/:id` - Update milestone
- [ ] DELETE `/roadmap/milestones/:id` - Delete milestone
- [ ] GET `/roadmap/phases` - List phases
- [ ] POST `/roadmap/phases` - Create phase
- [ ] PUT `/roadmap/phases/:id` - Update phase
- [ ] DELETE `/roadmap/phases/:id` - Delete phase

### ⏳ PENDING - Category: Notes (10+ endpoints)
- [ ] GET `/notes` - List notes
- [ ] POST `/notes` - Create note
- [ ] GET `/notes/:id` - Get specific note
- [ ] PUT `/notes/:id` - Update note
- [ ] DELETE `/notes/:id` - Delete note
- [ ] POST `/notes/search` - Search notes
- [ ] GET `/notes/recent` - Recent notes
- [ ] POST `/notes/share` - Share note

### ⏳ PENDING - Category: Todos (8+ endpoints)
- [ ] GET `/todos` - List todos
- [ ] POST `/todos` - Create todo
- [ ] GET `/todos/:id` - Get specific todo
- [ ] PUT `/todos/:id` - Update todo
- [ ] DELETE `/todos/:id` - Delete todo
- [ ] PUT `/todos/:id/complete` - Mark complete
- [ ] GET `/todos/today` - Today's todos

### ⏳ PENDING - Category: Calendar (6 endpoints)
- [ ] GET `/calendar/events` - List calendar events
- [ ] POST `/calendar/events` - Create event
- [ ] GET `/calendar/events/:eventId` - Get event
- [ ] PUT `/calendar/events/:eventId` - Update event
- [ ] DELETE `/calendar/events/:eventId` - Delete event
- [ ] POST `/calendar/events/sync` - Sync calendar

### ⏳ PENDING - Category: Files (4 endpoints)
- [ ] GET `/files` - List files
- [ ] POST `/files/upload` - Upload file
- [ ] GET `/files/:fileId` - Get file
- [ ] DELETE `/files/:fileId` - Delete file

### ⏳ PENDING - Category: Credits System (15 endpoints)
- [x] GET `/credits/balance` - Get credit balance (COMPLETED)
- [ ] POST `/credits/add` - Add credits
- [ ] POST `/credits/deduct` - Deduct credits
- [ ] POST `/credits/track` - Track credit usage
- [ ] GET `/credits/history` - Credit history
- [ ] GET `/credits/summary` - Credit summary
- [ ] GET `/credits/diagnostic` - Credit diagnostic
- [ ] POST `/credits/reset` - Reset credits
- [ ] POST `/credits/restore` - Restore credits
- [ ] POST `/credits-10x-migration` - 10x migration
- [ ] GET `/credits/renewal/status` - Renewal status
- [ ] POST `/credits/renewal/trigger` - Trigger renewal
- [ ] POST `/credits/renewal/process-all` - Process all renewals

### ⏳ PENDING - Category: Team Management (8 endpoints)
- [x] GET `/users/team` - List team members (COMPLETED)
- [x] GET `/team-v3/data` - Team v3 data (COMPLETED)
- [ ] POST `/team` - Add team member
- [ ] PUT `/team/:id` - Update team member
- [ ] DELETE `/team/:id` - Remove team member
- [ ] GET `/team/roles` - List roles
- [ ] POST `/team/invite` - Invite team member

### ⏳ PENDING - Category: GitHub Integration (18 endpoints)
- [ ] GET `/github/auth-url` - Get OAuth URL
- [ ] GET `/github/callback` - OAuth callback
- [ ] GET `/github/status` - Connection status
- [ ] POST `/github/disconnect` - Disconnect GitHub
- [ ] GET `/github/user` - Get GitHub user
- [ ] GET `/github/repos` - List repositories
- [ ] GET `/github/repos/:owner/:repo` - Get repository
- [ ] GET `/github/repos/:owner/:repo/branches` - List branches
- [ ] GET `/github/repos/:owner/:repo/commits` - List commits
- [ ] GET `/github/repos/:owner/:repo/contents` - Browse contents
- [ ] GET `/github/repos/:owner/:repo/all-files` - List all files
- [ ] GET `/github/settings` - GitHub settings
- [ ] GET `/github/config-test` - Test configuration

### ⏳ PENDING - Category: Google Integration (12 endpoints)
- [ ] GET `/google/auth-url` - Get OAuth URL
- [ ] GET `/google/callback` - OAuth callback
- [ ] GET `/google/status` - Connection status
- [ ] POST `/google/disconnect` - Disconnect Google
- [ ] GET `/google/calendar/list` - List calendars
- [ ] GET `/google/calendar/events` - List events
- [ ] GET `/google/contacts` - List contacts
- [ ] GET `/google/drive/files` - List Drive files
- [ ] GET `/google/gmail/messages` - List emails
- [ ] GET `/google/gmail/message/:id` - Get email
- [ ] POST `/google/gmail/send` - Send email
- [ ] GET `/google/config-test` - Test configuration

### ⏳ PENDING - Category: Stripe/Payments (20+ endpoints)
- [ ] POST `/stripe/create-checkout-session` - Create checkout
- [ ] POST `/stripe/create-portal-session` - Customer portal
- [ ] POST `/stripe/webhook` - Stripe webhook
- [ ] GET `/stripe/subscription` - Get subscription
- [ ] POST `/stripe/cancel-subscription` - Cancel subscription
- [ ] POST `/stripe/update-payment-method` - Update payment
- [ ] GET `/stripe/invoices` - List invoices
- [ ] GET `/stripe-setup/status` - Setup status
- [ ] POST `/stripe-migration` - Migrate to Stripe
- [ ] GET `/stripe-bank/balance` - Bank balance

### ⏳ PENDING - Category: Support (8 endpoints)
- [x] GET `/support/user-tickets` - User tickets (COMPLETED)
- [ ] POST `/support/create` - Create ticket
- [ ] GET `/support/ticket/:id` - Get ticket
- [ ] PUT `/support/ticket/:id` - Update ticket
- [ ] POST `/support/ticket/:id/reply` - Reply to ticket
- [ ] POST `/support/ticket/:id/close` - Close ticket
- [ ] GET `/support/categories` - Ticket categories

### ⏳ PENDING - Category: User Settings (12 endpoints)
- [ ] GET `/settings` - Get user settings
- [ ] PUT `/settings` - Update settings
- [ ] GET `/user-preferences` - User preferences
- [ ] PUT `/user-preferences` - Update preferences
- [ ] GET `/customization/preferences` - Customization prefs
- [ ] POST `/customization/save` - Save customization
- [ ] GET `/user` - Get current user
- [ ] PUT `/user` - Update current user
- [ ] DELETE `/user` - Delete account
- [ ] GET `/user-evidence` - User evidence data
- [ ] GET `/user-research` - User research data

### ⏳ PENDING - Category: Checklist (4 endpoints)
- [ ] GET `/checklist` - Get checklist
- [ ] GET `/checklist/status` - Checklist status
- [ ] POST `/checklist/toggle` - Toggle item
- [ ] POST `/checklist/reset` - Reset checklist

### ⏳ PENDING - Category: Dreams/Goals (6 endpoints)
- [ ] GET `/dreams` - List dreams
- [ ] POST `/dreams` - Create dream
- [ ] GET `/dreams/:dreamId` - Get dream
- [ ] PUT `/dreams/:dreamId` - Update dream
- [ ] DELETE `/dreams/:dreamId` - Delete dream
- [ ] GET `/dream-board/dreams` - Dream board

### ⏳ PENDING - Category: Founder Calls (12 endpoints)
- [ ] GET `/founder-calls/availability` - Get availability
- [ ] POST `/founder-calls/book` - Book call
- [ ] GET `/founder-calls/booking/:bookingId` - Get booking
- [ ] PUT `/founder-calls/booking/:bookingId/reschedule` - Reschedule
- [ ] POST `/founder-calls/booking/:bookingId/payment` - Process payment
- [ ] POST `/founder-calls/booking/:bookingId/payment-cancelled` - Payment cancelled
- [ ] POST `/founder-calls/create-checkout` - Create checkout session

### ⏳ PENDING - Category: E-commerce (6 endpoints)
- [ ] GET `/ecommerce-products` - List products
- [ ] POST `/ecommerce-products` - Create product
- [ ] GET `/ecommerce-products/:id` - Get product
- [ ] PUT `/ecommerce-products/:id` - Update product
- [ ] DELETE `/ecommerce-products/:id` - Delete product

### ⏳ PENDING - Category: HR Management (20+ endpoints)
- [ ] GET `/hr/contractors` - List contractors
- [ ] POST `/hr/contractors` - Create contractor
- [ ] PUT `/hr/contractors/:id` - Update contractor
- [ ] DELETE `/hr/contractors/:id` - Delete contractor
- [ ] GET `/hr/benefits` - List benefits
- [ ] POST `/hr/benefits` - Create benefit
- [ ] PUT `/hr/benefits/:id` - Update benefit
- [ ] DELETE `/hr/benefits/:id` - Delete benefit

### ⏳ PENDING - Category: Other Integrations & Features
- [ ] Slack integration (multiple endpoints)
- [ ] Plaid banking (multiple endpoints)
- [ ] Salesforce integration (multiple endpoints)
- [ ] HubSpot integration (multiple endpoints)
- [ ] Squarespace integration (multiple endpoints)
- [ ] Apple IAP (In-App Purchase) endpoints
- [ ] Push notifications endpoints
- [ ] Voice endpoints
- [ ] Product automation endpoints
- [ ] Marketing automation endpoints
- [ ] Sales pipeline endpoints
- [ ] Job applications tracking
- [ ] Industry benchmarks
- [ ] University/learning endpoints
- [ ] Mastery/gamification endpoints
- [ ] Build preview/code generation

### ⏳ PENDING - Category: Diagnostics & Utilities
- [ ] GET `/health` - Health check (COMPLETED)
- [ ] GET `/test` - Test endpoint (COMPLETED)
- [ ] GET `/ping` - Ping endpoint
- [ ] GET `/debug` - Debug info
- [ ] GET `/database-diagnostic` - Database diagnostic
- [ ] GET `/kv-diagnostic` - KV store diagnostic
- [ ] GET `/kv` - KV operations
- [ ] POST `/verify-assistant-config` - Verify config
- [ ] POST `/update-assistant` - Update assistant
- [ ] POST `/update-assistant-complete` - Complete update
- [ ] POST `/sync-assistant-functions` - Sync functions
- [ ] GET `/operations-usage` - Operations usage stats

---

## Implementation Strategy

### Phase 1: Critical Fixes (IN PROGRESS)
Focus on endpoints causing active 404 errors:
1. ✅ Businesses endpoints
2. ✅ Number one goal
3. ✅ Organizations
4. ✅ Support tickets
5. ✅ Credits balance
6. ✅ Email 2FA
7. ✅ Team v3 data
8. ✅ Bookkeeping test

### Phase 2: Core Features (NEXT)
1. Finance management (46 endpoints)
2. AI/Chat system (20 endpoints)
3. Roadmap & planning (15 endpoints)
4. Notes system (10 endpoints)
5. Todos management (8 endpoints)

### Phase 3: User Features
1. Calendar integration
2. File management
3. User settings & preferences
4. Checklist system
5. Dreams/goals tracking

### Phase 4: Integrations
1. GitHub integration
2. Google workspace
3. Stripe payments
4. Slack, Plaid, Salesforce, etc.

### Phase 5: Admin & Advanced
1. Admin panel (29 endpoints)
2. HR management
3. E-commerce products
4. Analytics & reporting

---

## Notes

- **Total endpoints to implement**: ~500+
- **Already completed**: 19 endpoints
- **Remaining**: ~480+ endpoints
- **Estimated time**: This will require systematic implementation over multiple sessions
- **Architecture**: All endpoints should be implemented in `/supabase/functions/server/` following the pattern in SERVER_ARCHITECTURE_DIAGRAM.txt

## Next Steps

1. Review and approve this plan
2. Begin Phase 2: Core Features
3. Implement finance endpoints first (highest business value)
4. Then AI/chat system
5. Continue through phases systematically
