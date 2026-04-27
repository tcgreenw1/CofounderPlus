import { Hono } from 'npm:hono';
import { createClient } from 'npm:@supabase/supabase-js';
import * as kv from './kv_store.tsx';

// REMOVED: Module-level Supabase client creation (causes JSON contamination)
// Now creating clients inside route handlers

export const betaRouter = new Hono();

// Change user's subscription plan (BETA testing only)
// Note: When mounted at /make-server-ac1075a9, this becomes /make-server-ac1075a9/beta/change-plan
betaRouter.post('/beta/change-plan', async (c) => {
  try {
    console.log('🧪 BETA: Change plan request received');
    
    // Get authorization header
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ success: false, error: 'No authorization header' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Create Supabase client inside route handler to avoid module-level initialization
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return c.json({ success: false, error: 'Authentication failed' }, 401);
    }

    // Parse request body
    const body = await c.req.json();
    const { userId, plan } = body;

    if (!userId || !plan) {
      return c.json({ success: false, error: 'userId and plan are required' }, 400);
    }

    // Verify the user is changing their own plan
    if (userId !== user.id) {
      return c.json({ success: false, error: 'You can only change your own plan' }, 403);
    }

    // Validate plan
    const validPlans = ['free', 'creator', 'builder', 'studio'];
    if (!validPlans.includes(plan)) {
      return c.json({ success: false, error: 'Invalid plan' }, 400);
    }

    console.log(`🧪 BETA: Changing user ${userId} to plan: ${plan}`);

    // Create a unique subscription ID for beta testing
    const subscriptionId = `beta_sub_${userId}_${plan}`;
    const now = Date.now();
    
    // Create subscription object in the format expected by the system
    const subscription = {
      id: subscriptionId,
      userId: userId,
      status: plan === 'free' ? 'canceled' : 'active',
      plan: plan,
      customer: `beta_cus_${userId}`,
      current_period_start: Math.floor(now / 1000),
      current_period_end: Math.floor((now + 30 * 24 * 60 * 60 * 1000) / 1000),
      items: [
        {
          id: `item_${plan}`,
          plan: {
            id: plan,
            product: plan,
            interval: 'month',
            amount: 0
          }
        }
      ],
      metadata: {
        source: 'beta_testing',
        plan_name: plan
      },
      savedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      type: 'main' as const
    };

    // Save the subscription
    await kv.set(`subscription:${subscriptionId}`, subscription);
    
    // Update user's subscription list
    const userSubscriptions = [subscriptionId]; // Replace with just this subscription
    await kv.set(`user:${userId}:subscriptions`, userSubscriptions);
    
    // Create legacy format for backward compatibility
    const legacyData = {
      status: plan === 'free' ? 'free' : 'subscribed',
      plan: plan,
      trial: null,
      subscription: {
        id: subscriptionId,
        status: plan === 'free' ? 'canceled' : 'active',
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        plan_id: plan,
        source: 'beta_testing',
        created_at: new Date().toISOString()
      },
      stripeCustomerId: `beta_cus_${userId}`,
      lastUpdated: new Date().toISOString()
    };
    
    // Also store legacy keys for compatibility
    await kv.set(`subscription:${userId}`, legacyData);
    await kv.set(`cloud_subscription:${userId}`, legacyData);

    console.log(`🧪 BETA: ✅ Successfully changed plan to ${plan} for user ${userId}`);

    return c.json({
      success: true,
      message: `Plan changed to ${plan}`,
      subscriptionData: {
        status: legacyData.status,
        plan: legacyData.plan,
        source: 'beta_testing'
      }
    });

  } catch (error: any) {
    console.error('🧪 BETA: Error changing plan:', error);
    
    return c.json({
      success: false,
      error: error.message || 'Failed to change plan'
    }, 500);
  }
});

// Get current BETA status
betaRouter.get('/beta/status/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    
    console.log('🧪 BETA: Getting status for user:', userId);

    // Get authorization header
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ success: false, error: 'No authorization header' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Create Supabase client inside route handler to avoid module-level initialization
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user || user.id !== userId) {
      return c.json({ success: false, error: 'Authentication failed' }, 401);
    }

    // Get subscription data
    const subscriptionKey = `subscription:${userId}`;
    const subscriptionData = await kv.get(subscriptionKey);

    return c.json({
      success: true,
      subscriptionData: subscriptionData || { status: 'free', plan: 'free' },
      isBeta: subscriptionData?.subscription?.source === 'beta_testing'
    });

  } catch (error: any) {
    console.error('🧪 BETA: Error getting status:', error);
    
    return c.json({
      success: false,
      error: error.message || 'Failed to get status'
    }, 500);
  }
});

// Reset to free plan
betaRouter.post('/beta/reset/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    
    console.log('🧪 BETA: Resetting user to free plan:', userId);

    // Get authorization header
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ success: false, error: 'No authorization header' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Create Supabase client inside route handler to avoid module-level initialization
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user || user.id !== userId) {
      return c.json({ success: false, error: 'Authentication failed' }, 401);
    }

    // Get all user subscriptions and delete them
    const userSubscriptions = await kv.get(`user:${userId}:subscriptions`) || [];
    
    // Delete each subscription
    for (const subId of userSubscriptions) {
      await kv.del(`subscription:${subId}`);
    }
    
    // Clear the subscription list
    await kv.del(`user:${userId}:subscriptions`);
    
    // Also clear legacy keys
    await kv.del(`subscription:${userId}`);
    await kv.del(`cloud_subscription:${userId}`);

    console.log(`🧪 BETA: ✅ Reset user ${userId} to free plan (deleted ${userSubscriptions.length} subscriptions)`);

    return c.json({
      success: true,
      message: 'Reset to free plan'
    });

  } catch (error: any) {
    console.error('🧪 BETA: Error resetting plan:', error);
    
    return c.json({
      success: false,
      error: error.message || 'Failed to reset plan'
    }, 500);
  }
});

// Test invitation email (BETA testing only)
// Sends invitation email to tcgreenw@gmail.com without checking if user exists
betaRouter.post('/beta/test-invitation', async (c) => {
  try {
    console.log('🧪 BETA: Test invitation request received');
    
    // Get authorization header
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ success: false, error: 'No authorization header' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Create Supabase client inside route handler
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return c.json({ success: false, error: 'Authentication failed' }, 401);
    }

    // Parse request body
    const body = await c.req.json();
    const { email, name } = body;

    if (!email) {
      return c.json({ success: false, error: 'Email is required' }, 400);
    }

    console.log(`🧪 BETA: Sending test invitation to: ${email}`);

    // Generate invite token and create invitation
    const inviteToken = `invite-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const inviteId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const invitation = {
      id: inviteId,
      email,
      name: name || 'Test User',
      role: 'member',
      status: 'invited',
      owner_id: user.id,
      owner_email: user.email,
      invite_token: inviteToken,
      invited_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
    };

    // Store the invitation (for testing purposes, won't actually check this)
    await kv.set(`team_member:${user.id}:${inviteId}`, invitation);
    await kv.set(`invite_token:${inviteToken}`, {
      owner_id: user.id,
      invite_id: inviteId,
      email,
      expires_at: invitation.expires_at
    });

    // Create invite link
    const inviteLink = `https://www.cofounderplus.com/invite?token=${inviteToken}`;

    // Send invitation email using SendGrid email service
    try {
      // Import email service
      const { sendEmail } = await import('./email-utils.tsx');
      
      // Get business name if available
      const businessNameData = await kv.get(`user_business_name:${user.id}`);
      const businessName = businessNameData?.name || `${user.email}'s team`;
      
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; border-radius: 10px 10px 0 0; text-align: center; }
            .content { background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .info-box { background: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .footer { text-align: center; margin-top: 30px; color: #6c757d; font-size: 14px; }
            .test-badge { background: #ffeb3b; color: #000; padding: 8px 16px; border-radius: 4px; font-weight: bold; margin-bottom: 20px; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="test-badge">🧪 TEST EMAIL</div>
              <h1 style="margin: 0; font-size: 28px;">🎉 You're Invited!</h1>
            </div>
            <div class="content">
              <p>Hi ${name || 'Test User'},</p>
              <p><strong>${user.email}</strong> has invited you to join their team on <strong>Cofounder</strong>!</p>
              
              <div class="info-box">
                <p style="margin: 0;"><strong>📋 Business:</strong> ${businessName}</p>
                <p style="margin: 5px 0 0 0;"><strong>👤 Role:</strong> Member</p>
              </div>
              
              <p>Click the button below to accept the invitation and join the team:</p>
              
              <div style="text-align: center;">
                <a href="${inviteLink}" class="button" style="color: white;">
                  Accept Invitation
                </a>
              </div>
              
              <p style="font-size: 14px; color: #6c757d; margin-top: 30px;">
                Or copy and paste this link into your browser:<br>
                <a href="${inviteLink}" style="color: #667eea; word-break: break-all;">${inviteLink}</a>
              </p>
              
              <p style="font-size: 14px; color: #6c757d;">
                ⏰ This invitation expires in 7 days (${new Date(invitation.expires_at).toLocaleDateString()})
              </p>
              
              <p>Welcome to the team! 🚀</p>
              <p>— The Cofounder Team</p>
            </div>
            <div class="footer">
              <p>This is a <strong>TEST EMAIL</strong> sent to ${email}</p>
              <p>This invitation was sent from the BETA testing environment.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const emailResult = await sendEmail({
        to: email,
        subject: `🧪 TEST: You're invited to join ${businessName} on Cofounder! 🎉`,
        html: emailHtml,
      });

      if (!emailResult.success) {
        console.error('🧪 BETA: Failed to send test invitation email:', emailResult.error);
        return c.json({ 
          success: false, 
          error: `Failed to send email: ${emailResult.error}` 
        }, 500);
      }

      console.log(`🧪 BETA: ✅ Test invitation email sent to ${email}`);

      return c.json({ 
        success: true, 
        invitation,
        inviteLink,
        message: `Test invitation email sent to ${email}` 
      });

    } catch (emailError: any) {
      console.error('🧪 BETA: Error sending test invitation email:', emailError);
      return c.json({ 
        success: false, 
        error: `Email error: ${emailError.message}` 
      }, 500);
    }

  } catch (error: any) {
    console.error('🧪 BETA: Error in test invitation:', error);
    
    return c.json({
      success: false,
      error: error.message || 'Failed to send test invitation'
    }, 500);
  }
});

export default betaRouter;