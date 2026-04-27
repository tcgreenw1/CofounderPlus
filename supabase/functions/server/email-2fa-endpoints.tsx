/**
 * Email-based 2FA endpoints using Supabase Auth native email OTP
 * 
 * This uses Supabase's built-in email verification system instead of external email services.
 * Supabase handles:
 * - Sending OTP codes via email (configured in Supabase Dashboard > Authentication > Email Templates)
 * - Code expiration
 * - Rate limiting
 * - Email delivery
 */
import { Hono } from 'npm:hono';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const email2FARoutes = new Hono();

/**
 * POST /email-2fa/enable
 * Enable email-based 2FA for a user
 */
email2FARoutes.post('/email-2fa/enable', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ success: false, error: 'Authorization token required' }, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    // Enable email 2FA for this user in user metadata
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { 
        user_metadata: { 
          ...user.user_metadata,
          email_2fa_enabled: true,
          email_2fa_enabled_at: new Date().toISOString()
        } 
      }
    );

    if (updateError) {
      throw updateError;
    }

    console.log(`✅ Email 2FA enabled for user ${user.id}`);

    return c.json({ 
      success: true,
      message: 'Email 2FA enabled successfully'
    });

  } catch (error: any) {
    console.error('❌ Enable email 2FA error:', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to enable email 2FA'
    }, 500);
  }
});

/**
 * POST /email-2fa/disable
 * Disable email-based 2FA for a user
 */
email2FARoutes.post('/email-2fa/disable', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ success: false, error: 'Authorization token required' }, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    // Disable email 2FA for this user
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { 
        user_metadata: { 
          ...user.user_metadata,
          email_2fa_enabled: false,
          email_2fa_disabled_at: new Date().toISOString()
        } 
      }
    );

    if (updateError) {
      throw updateError;
    }

    console.log(`✅ Email 2FA disabled for user ${user.id}`);

    return c.json({ 
      success: true,
      message: 'Email 2FA disabled successfully'
    });

  } catch (error: any) {
    console.error('❌ Disable email 2FA error:', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to disable email 2FA'
    }, 500);
  }
});

/**
 * GET /email-2fa/status
 * Check if email 2FA is enabled for a user
 */
email2FARoutes.get('/email-2fa/status', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ success: false, error: 'Authorization token required' }, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    // Check if email 2FA is enabled from user metadata
    const enabled = user.user_metadata?.email_2fa_enabled === true;

    console.log(`✅ Email 2FA status for user ${user.id}: ${enabled}`);

    return c.json({ 
      success: true,
      enabled: enabled,
      email: user.email
    });

  } catch (error: any) {
    console.error('❌ Get email 2FA status error:', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to get email 2FA status'
    }, 500);
  }
});

/**
 * POST /email-2fa/check-enabled
 * Check if email 2FA is enabled for a user by email (pre-login check)
 * This doesn't require authentication since it's checked before login
 */
email2FARoutes.post('/email-2fa/check-enabled', async (c) => {
  try {
    const body = await c.req.json();
    const { email } = body;

    if (!email) {
      return c.json({ success: false, error: 'Email is required' }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user by email
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    const user = users?.users.find(u => u.email === email);

    if (!user) {
      // Don't reveal that user doesn't exist for security
      return c.json({ success: true, enabled: false });
    }

    // Check if email 2FA is enabled for this user from user metadata
    const enabled = user.user_metadata?.email_2fa_enabled === true;

    console.log(`✅ Email 2FA check for ${email}: ${enabled}`);

    return c.json({ 
      success: true,
      enabled: enabled
    });

  } catch (error: any) {
    console.error('❌ Check email 2FA enabled error:', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to check email 2FA status'
    }, 500);
  }
});

/**
 * POST /email-2fa/send-code
 * Send a 2FA code to user's email using Supabase Auth OTP
 */
email2FARoutes.post('/email-2fa/send-code', async (c) => {
  try {
    const body = await c.req.json();
    const { email } = body;

    if (!email) {
      return c.json({ success: false, error: 'Email is required' }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Use Supabase's built-in OTP system
    const { data, error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        shouldCreateUser: false, // Don't create user if they don't exist
      }
    });

    if (error) {
      console.error(`❌ Failed to send OTP to ${email}:`, error);
      console.error(`❌ Error details:`, JSON.stringify(error, null, 2));
      
      // Provide more helpful error messages
      let errorMessage = error.message || 'Failed to send verification code';
      
      if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Please verify your email address first before enabling 2FA';
      } else if (error.message?.includes('rate limit')) {
        errorMessage = 'Too many attempts. Please wait a few minutes and try again';
      } else if (error.message?.includes('SMTP')) {
        errorMessage = 'Email service is not configured. Please contact support or disable 2FA';
      }
      
      return c.json({ 
        success: false, 
        error: errorMessage,
        details: error.message
      }, 400);
    }

    console.log(`✅ Supabase OTP sent to ${email}`);

    return c.json({ 
      success: true,
      message: 'Verification code sent to your email',
      expiresIn: 3600 // Supabase OTPs expire in 1 hour by default
    });

  } catch (error: any) {
    console.error('❌ Send email 2FA code error:', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to send verification code'
    }, 500);
  }
});

/**
 * POST /email-2fa/verify-code
 * Verify a 2FA code using Supabase Auth OTP verification
 */
email2FARoutes.post('/email-2fa/verify-code', async (c) => {
  try {
    const body = await c.req.json();
    const { email, code } = body;

    if (!email || !code) {
      return c.json({ success: false, error: 'Email and code are required' }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Verify the OTP code with Supabase
    const { data, error } = await supabase.auth.verifyOtp({
      email: email,
      token: code,
      type: 'email'
    });

    if (error) {
      console.error(`❌ Failed to verify OTP for ${email}:`, error);
      return c.json({ 
        success: false, 
        error: 'Invalid or expired code' 
      }, 400);
    }

    if (!data.user) {
      return c.json({ 
        success: false, 
        error: 'Verification failed' 
      }, 400);
    }

    console.log(`✅ OTP verified for user ${data.user.id}`);

    // Return the session token that can be used for authentication
    return c.json({ 
      success: true,
      message: 'Verification successful',
      tempToken: data.session?.access_token || '',
      userId: data.user.id
    });

  } catch (error: any) {
    console.error('❌ Verify email 2FA code error:', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to verify code'
    }, 500);
  }
});

/**
 * POST /email-2fa/complete-login
 * Complete login after 2FA verification using the temp token
 * With Supabase OTP, the verification step already creates a session,
 * so this endpoint mainly validates the flow completed successfully
 */
email2FARoutes.post('/email-2fa/complete-login', async (c) => {
  try {
    const body = await c.req.json();
    const { email, tempToken } = body;

    if (!email || !tempToken) {
      return c.json({ success: false, error: 'Email and temp token are required' }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Validate the token by trying to get the user
    const { data: { user }, error } = await supabase.auth.getUser(tempToken);

    if (error || !user) {
      return c.json({ 
        success: false, 
        error: 'Invalid or expired verification token' 
      }, 401);
    }

    // Check if email matches
    if (user.email !== email) {
      return c.json({ success: false, error: 'Invalid verification token' }, 401);
    }

    console.log(`✅ 2FA login completed for ${email}`);

    return c.json({ 
      success: true,
      message: 'Login authorized',
      userId: user.id
    });

  } catch (error: any) {
    console.error('❌ Complete login error:', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to complete login'
    }, 500);
  }
});

export default email2FARoutes;