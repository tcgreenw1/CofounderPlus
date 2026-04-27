# Subscription Lifecycle & Notifications Setup Guide

## Overview

Your subscription system now includes comprehensive lifecycle notifications and proper renewal tracking. This document explains what was implemented and how to complete the setup.

---

## 🎯 What Was Implemented

### 1. **Subscription Lifecycle Notifications System**
   - **File**: `/supabase/functions/server/subscription-lifecycle-notifications.tsx`
   - Sends notifications for:
     - ✅ Renewal reminders (7 days, 3 days, 1 day before renewal)
     - ✅ Successful renewals
     - ✅ Payment failures
     - ✅ Subscription cancellations
     - ✅ Monthly credit replenishment
     - ✅ Credit rollovers
   - Notifications appear both as:
     - 📱 Push notifications (if device token registered)
     - 🔔 In-app notifications (Notifications page)

### 2. **Stripe Webhook Handler**
   - **File**: `/supabase/functions/server/subscription-webhook-handler.tsx`
   - Handles Stripe events:
     - `invoice.payment_succeeded` - Processes renewals, adds credits, sends success notifications
     - `invoice.payment_failed` - Sends payment failed notifications with retry dates
     - `customer.subscription.updated` - Syncs subscription data and renewal dates
     - `customer.subscription.deleted` - Sends cancellation notifications
     - `customer.subscription.trial_will_end` - Sends trial ending reminders

### 3. **Automated Schedulers**
   - **Credit Renewal Scheduler**: Runs hourly, processes monthly credit allocations
   - **Renewal Reminder Scheduler**: Runs daily, sends 7/3/1-day reminders
   - Both start automatically when server boots

### 4. **Frontend Integration**
   - **NotificationsPage** updated to display subscription notifications
   - Notifications show with proper icons, colors, and timestamps
   - Automatically loads from backend

---

## 🚨 **The Issue You Discovered**

Your subscription shows:
- Start Date: December 8, 2025
- Renewal Date: January 7, 2026
- Current Date: March 4, 2026
- **Status: Still active (no renewal occurred)**

### Root Cause:
The credit renewal scheduler was independent of Stripe's actual subscription billing cycle. It used a simple "30 days from initialization" logic, not tied to your actual subscription renewal dates from Stripe.

### The Fix:
Now, subscription renewals are **triggered by Stripe webhooks** when payments actually succeed, ensuring credits sync with your real billing cycle.

---

## 📋 **Required Setup Steps**

### Step 1: Configure Stripe Webhook Endpoint

1. **Go to Stripe Dashboard** → [Webhooks](https://dashboard.stripe.com/webhooks)

2. **Click "Add endpoint"**

3. **Enter your endpoint URL**:
   ```
   https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-373d8b09/subscription-webhook
   ```
   Replace `YOUR_PROJECT_ID` with your actual Supabase project ID

4. **Select events to listen to**:
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `customer.subscription.trial_will_end`

5. **Add endpoint**

6. **Copy the Signing Secret**
   - You'll see something like `whsec_...`
   - This is already configured in your environment as `STRIPE_WEBHOOK_SECRET`
   - If not, add it to Supabase Edge Function secrets

### Step 2: Test the Webhook

1. In Stripe Dashboard → Webhooks → Click your new endpoint
2. Click **"Send test webhook"**
3. Select `invoice.payment_succeeded`
4. Send it
5. Check the response - should see `{ "received": true, "type": "invoice.payment_succeeded" }`

### Step 3: Verify Notification Settings

1. **Push Notifications**: 
   - Users must enable push notifications in your app
   - Device tokens are stored in KV store as `push_token:${userId}`
   - Already integrated with Apple Push Notification Service (APNS)

2. **In-App Notifications**:
   - Automatically enabled
   - Users can see them in `/notifications` page

### Step 4: Monitor Logs

After webhook is configured:

1. Check server logs for:
   ```
   📬 Subscription Notification: Sending renewal_reminder to user ...
   ✅ Subscription Notification: Push notification sent to user ...
   💳 Processing subscription renewal for user ...
   ✅ Processed subscription renewal for user ...
   ```

2. Check Stripe Dashboard → Webhooks → Your endpoint → Recent events
   - Should show successful deliveries

---

## 📅 **Notification Schedule**

### Renewal Reminders
- **7 days before**: "Subscription Renewal in 7 Days"
- **3 days before**: "Subscription Renewal in 3 Days"
- **1 day before**: "Subscription Renewal in 1 Day" (high priority)

### On Successful Renewal
- "✅ Subscription Renewed Successfully"
- Shows credits added and new balance
- If credits rolled over, separate notification explains rollover

### On Payment Failure
- "⚠️ Payment Failed"
- Includes retry date if Stripe will retry
- Prompts user to update payment method

### On Cancellation
- Explains reason (voluntary vs. non-payment)
- Shows access-until date if applicable

---

## 🔧 **Testing the System**

### Test Renewal Notifications:

1. **Trigger Manual Renewal** (for testing):
   ```bash
   curl -X POST \
     https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-373d8b09/credits/renewal/trigger \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
   ```

2. **Check Renewal Status**:
   ```bash
   curl https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-373d8b09/credits/renewal/status \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
   ```

3. **Expected Response**:
   ```json
   {
     "success": true,
     "userId": "...",
     "currentCredits": 20000,
     "plan": "builder",
     "renewalDate": "2026-04-04T...",
     "daysUntilRenewal": 31,
     "isOverdue": false,
     "lastRenewal": {
       "timestamp": "2026-03-04T...",
       "previousBalance": 15000,
       "monthlyAllocation": 20000,
       "rolledOver": 0,
       "newBalance": 20000
     }
   }
   ```

### Test Stripe Webhook Locally:

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Forward events to local server:
   ```bash
   stripe listen --forward-to localhost:54321/functions/v1/make-server-373d8b09/subscription-webhook
   ```
3. Trigger test event:
   ```bash
   stripe trigger invoice.payment_succeeded
   ```

---

## 📊 **Credit Rollover Rules**

Implemented per your requirements:

| Plan    | Monthly Credits | Max Rollover (Cap) |
|---------|----------------|-------------------|
| Free    | 500           | 1,000             |
| Launch  | 5,000         | 10,000            |
| Grow    | 20,000        | 40,000            |
| Scale   | 150,000       | 300,000           |

**How it works**:
1. When subscription renews, unused credits roll over
2. Monthly allocation is added
3. If total exceeds cap, it's capped
4. User receives notification explaining rollover + new balance

---

## 🚀 **What Happens Now**

### For Your Account (Grow Plan):

1. **Current State**: 
   - Your renewal date is January 7, 2026 (past due)
   - No renewal occurred because webhook wasn't configured

2. **After Webhook Setup**:
   - Next time Stripe charges you (likely your next billing date)
   - Webhook will fire → `invoice.payment_succeeded`
   - System will:
     - Add 20,000 credits
     - Calculate any rollover
     - Send you renewal success notification
     - Update renewal date to next month

3. **Going Forward**:
   - 7 days before renewal: Reminder notification
   - 3 days before renewal: Another reminder
   - 1 day before renewal: Final reminder
   - On renewal day: Stripe charges → Webhook fires → Credits added → Notification sent

### For All Users:

- Free plan users: Still get monthly 500 credits via hourly scheduler
- Paid plan users: Credits sync with actual Stripe billing cycle via webhooks
- Everyone gets proper notifications at each lifecycle stage

---

## 🛠️ **Troubleshooting**

### Webhook Not Receiving Events

1. Check Stripe Dashboard → Webhooks → Your endpoint
2. Look for failed attempts
3. Common issues:
   - Incorrect URL
   - Missing event types
   - Signature verification failing

### Notifications Not Appearing

1. Check server logs for:
   ```
   📬 Subscription Notification: Sending ...
   ```
2. Verify user has notifications enabled
3. Check KV store:
   ```
   user_notifications:${userId}
   ```

### Credits Not Adding on Renewal

1. Check if webhook received payment_succeeded event
2. Look for logs:
   ```
   💳 Processing subscription renewal for user ...
   ```
3. Verify subscription data in KV store

---

## 📝 **Additional Notes**

### iOS In-App Purchases
- The webhook handler works for both Stripe (web) and IAP (iOS)
- For IAP, Apple's server sends purchase notifications
- Same notification system applies

### Notification Categories
- All subscription notifications tagged with `category: 'subscription'`
- Shows with credit card icon (🔔 + 💳)
- Uses primary color from design system

### Data Storage
- All notifications stored in KV: `user_notifications:${userId}`
- Logs stored with timestamps for audit trail
- Automatic cleanup: Only keeps last 50 notifications per user

---

## ✅ **Success Checklist**

- [ ] Stripe webhook endpoint configured
- [ ] Test webhook sent successfully
- [ ] Server logs show webhook events being received
- [ ] Test renewal triggered manually (for immediate verification)
- [ ] Notification appears in Notifications page
- [ ] Push notification received (if enabled)
- [ ] Credits added correctly after test renewal
- [ ] Renewal date updated to next period

---

## 🎉 **You're All Set!**

Once you configure the Stripe webhook endpoint, your subscription lifecycle will be fully automated with proper notifications at every stage. Users will always know when renewals are coming, if payments fail, and when credits are added.

**Need Help?** Check server logs or Stripe webhook dashboard for detailed event information.

---

Last Updated: March 4, 2026
