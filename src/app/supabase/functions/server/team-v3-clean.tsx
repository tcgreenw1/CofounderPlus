/**
 * TEAM INVITATION SYSTEM V3 - COMPLETE REBUILD
 * Created fresh - no legacy dependencies
 * Simple 10-member flat limit across all plans
 */

import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { createClient } from 'npm:@supabase/supabase-js';
import * as kv from './kv_store.tsx';

export const teamV3Router = new Hono();

// Add CORS middleware
teamV3Router.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600,
  credentials: true,
}));

// Config
const MAX_TEAM_SIZE = 10;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Test endpoint to verify router is loaded
teamV3Router.get('/team-v3/test', (c) => {
  return c.json({
    success: true,
    message: 'Team V3 router is loaded and working!',
    timestamp: new Date().toISOString(),
  });
});

// Helper function to get Supabase client
function getSupabaseClient() {
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  return createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
}

// Helper: Verify user
async function verifyUser(authHeader: string | undefined) {
  if (!authHeader) throw new Error('No auth header');
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await getSupabaseClient().auth.getUser(token);
  if (error || !user) throw new Error('Auth failed');
  return user;
}

// Helper: Generate token
function genToken(): string {
  return Array.from({ length: 32 }, () => 
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
      .charAt(Math.floor(Math.random() * 62))
  ).join('');
}

// Helper: Send email via Resend (same approach as 2FA emails)
async function sendEmail(to: string, toName: string, ownerName: string, ownerEmail: string, link: string) {
  try {
    console.log('📧 Sending team invitation email via Resend API...');
    
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY not found in environment');
      return { ok: false, error: 'Email service not configured' };
    }
    
    // Import email template (same way as other endpoints)
    const { getTeamInvitationEmail } = await import('./email-templates.tsx');
    
    // Calculate expiry (7 days from now)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    
    const emailContent = getTeamInvitationEmail({
      inviteeName: toName,
      inviterName: ownerName,
      inviterEmail: ownerEmail,
      inviteLink: link,
      expiresAt: expiresAt
    });
    
    // Send via Resend API (same as 2FA)
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Use Resend's verified sandbox domain for development/testing
        // Change to 'Cofounder <notifications@cofounderplus.com>' once domain is verified
        from: 'Cofounder+ <onboarding@resend.dev>',
        to: [to],
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Resend API error:', errorData);
      return { ok: false, error: errorData.message || 'Failed to send email' };
    }
    
    const result = await response.json();
    console.log('✅ Team invitation email sent successfully via Resend:', result);
    return { ok: true, data: result };
    
  } catch (err: any) {
    console.error('❌ Email sending error:', err);
    return { ok: false, error: err.message };
  }
}

/**
 * GET /team-v3/data
 * Get all team data for current user
 */
teamV3Router.get('/team-v3/data', async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    
    // Get data with NEW clean keys
    const membersKey = `team_v3_members:${user.id}`;
    const invitesKey = `team_v3_invites:${user.id}`;
    
    const members = await kv.get(membersKey) || [];
    const invites = await kv.get(invitesKey) || [];
    
    console.log(`📊 Team V3 Data for ${user.email}:`);
    console.log(`   Members: ${JSON.stringify(members)}`);
    console.log(`   Invites: ${JSON.stringify(invites)}`);
    
    // Build team members array
    const teamMembers = [];
    
    // Add active members
    if (Array.isArray(members)) {
      for (const m of members) {
        teamMembers.push({
          id: m.id,
          email: m.email,
          name: m.name,
          role: m.role || 'member',
          status: 'active',
          joined_at: m.joinedAt,
        });
      }
    }
    
    // Add pending invites
    if (Array.isArray(invites)) {
      const now = Date.now();
      for (const inv of invites) {
        // Skip expired invites
        if (inv.expiresAt && new Date(inv.expiresAt).getTime() < now) continue;
        
        teamMembers.push({
          id: inv.id,
          email: inv.email,
          name: inv.name,
          role: 'member',
          status: 'invited',
          invited_at: inv.invitedAt,
        });
      }
    }
    
    return c.json({
      success: true,
      teamMembers,
      stats: {
        activeMembers: Array.isArray(members) ? members.length : 0,
        pendingInvites: Array.isArray(invites) ? invites.length : 0,
        totalSlots: MAX_TEAM_SIZE,
        usedSlots: 1 + teamMembers.length, // 1 for owner
        availableSlots: MAX_TEAM_SIZE - (1 + teamMembers.length),
      }
    });
    
  } catch (err: any) {
    console.error('❌ Get team data error:', err);
    return c.json({ success: false, error: err.message }, 500);
  }
});

/**
 * POST /team-v3/invite
 * Send a team invitation
 */
teamV3Router.post('/team-v3/invite', async (c) => {
  try {
    console.log('🚀 Team V3 Invite - Starting');
    
    const user = await verifyUser(c.req.header('Authorization'));
    const body = await c.req.json();
    const { inviteEmail, inviteName, ownerName } = body;
    
    // Validate
    if (!inviteEmail?.trim()) {
      return c.json({ success: false, error: 'Email required' }, 400);
    }
    
    const email = inviteEmail.trim().toLowerCase();
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return c.json({ success: false, error: 'Invalid email' }, 400);
    }
    
    if (email === user.email.toLowerCase()) {
      return c.json({ success: false, error: 'Cannot invite yourself' }, 400);
    }
    
    console.log('✅ Email validated:', email);
    
    // Check team size with NEW clean keys
    const membersKey = `team_v3_members:${user.id}`;
    const invitesKey = `team_v3_invites:${user.id}`;
    
    const members = await kv.get(membersKey) || [];
    const invites = await kv.get(invitesKey) || [];
    
    console.log('📊 Current team state:');
    console.log('   Members:', members);
    console.log('   Invites:', invites);
    
    const memberCount = Array.isArray(members) ? members.length : 0;
    const inviteCount = Array.isArray(invites) ? invites.length : 0;
    const totalCount = 1 + memberCount + inviteCount; // 1 = owner
    
    console.log(`   Total: ${totalCount} / ${MAX_TEAM_SIZE}`);
    
    if (totalCount >= MAX_TEAM_SIZE) {
      console.error(`❌ Limit reached: ${totalCount} >= ${MAX_TEAM_SIZE}`);
      return c.json({ 
        success: false, 
        error: `Team limit reached (${MAX_TEAM_SIZE} max). Contact support for enterprise.` 
      }, 400);
    }
    
    // Check duplicates
    if (Array.isArray(members) && members.some((m: any) => m.email === email)) {
      return c.json({ success: false, error: 'Already a team member' }, 400);
    }
    
    if (Array.isArray(invites) && invites.some((i: any) => i.email === email && i.status === 'pending')) {
      return c.json({ success: false, error: 'Invitation already pending' }, 400);
    }
    
    // Check if user exists in Supabase
    console.log('🔍 Checking if user exists in Supabase...');
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find((u: any) => u.email?.toLowerCase() === email);
    const userExists = !!existingUser;
    
    console.log(`   User exists: ${userExists}`, existingUser ? `(ID: ${existingUser.id})` : '');
    
    // Create invitation
    const token = genToken();
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days
    
    const invitation = {
      id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email,
      name: inviteName?.trim() || null,
      ownerId: user.id,
      ownerEmail: user.email,
      ownerName: ownerName || user.user_metadata?.name || user.email,
      token,
      status: 'pending',
      invitedAt: now,
      expiresAt,
      userExists, // Track if user existed at invitation time
      existingUserId: existingUser?.id || null,
    };
    
    // Store invitation
    const updatedInvites = Array.isArray(invites) ? [...invites, invitation] : [invitation];
    await kv.set(invitesKey, updatedInvites);
    await kv.set(`team_v3_token:${token}`, invitation);
    
    console.log('✅ Invitation stored');
    
    let notificationCreated = false;
    let emailSent = false;
    
    if (userExists && existingUser) {
      // User exists: Create in-app notification
      console.log('📬 Creating in-app notification for existing user...');
      
      const notification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'team_invitation',
        fromUserId: user.id,
        fromUserEmail: user.email,
        fromUserName: invitation.ownerName,
        organizationId: user.id, // Use owner's user ID as the organization identifier
        status: 'pending',
        createdAt: now,
        expiresAt,
        email: invitation.email,
        title: 'Team Invitation',
        message: `${invitation.ownerName} has invited you to join their team`,
        data: {
          invitationId: invitation.id,
          token: invitation.token,
          ownerName: invitation.ownerName,
          ownerEmail: invitation.ownerEmail,
          inviteLink: `https://www.cofounderplus.com/invite/${token}`,
        },
      };
      
      // Store notification in KV with the correct key format
      const notificationsKey = `user_notifications:${existingUser.id}`;
      const existingNotificationsRaw = await kv.get(notificationsKey);
      
      let existingNotifications = [];
      if (existingNotificationsRaw && typeof existingNotificationsRaw === 'string') {
        existingNotifications = JSON.parse(existingNotificationsRaw);
      } else if (Array.isArray(existingNotificationsRaw)) {
        existingNotifications = existingNotificationsRaw;
      }
      
      const updatedNotifications = [notification, ...existingNotifications];
      await kv.set(notificationsKey, JSON.stringify(updatedNotifications));
      
      notificationCreated = true;
      console.log('✅ In-app notification created');
    } else {
      // User doesn't exist: Send email invitation
      console.log('📧 Sending email invitation to new user...');
      const link = `https://www.cofounderplus.com/invite/${token}`;
      const emailResult = await sendEmail(email, inviteName, invitation.ownerName, user.email || '', link);
      emailSent = emailResult.ok;
      console.log(emailSent ? '✅ Email sent' : '⚠️ Email failed');
    }
    
    return c.json({
      success: true,
      message: userExists 
        ? `In-app notification sent to existing user ${email}`
        : `Email invitation sent to ${email}`,
      userExists,
      notificationCreated,
      emailSent,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        invitedAt: invitation.invitedAt,
      },
    });
    
  } catch (err: any) {
    console.error('❌ Invite error:', err);
    return c.json({ success: false, error: err.message }, 500);
  }
});

/**
 * GET /team-v3/invitation/:token
 * Get invitation details
 */
teamV3Router.get('/team-v3/invitation/:token', async (c) => {
  try {
    const token = c.req.param('token');
    const invitation = await kv.get(`team_v3_token:${token}`);
    
    if (!invitation) {
      return c.json({ success: false, error: 'Invitation not found' }, 404);
    }
    
    const isExpired = new Date(invitation.expiresAt) <= new Date();
    
    return c.json({
      success: true,
      invitation: {
        email: invitation.email,
        ownerName: invitation.ownerName,
        ownerEmail: invitation.ownerEmail,
        status: isExpired ? 'expired' : invitation.status,
        isExpired,
      }
    });
    
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

/**
 * POST /team-v3/accept/:token
 * Accept an invitation
 */
teamV3Router.post('/team-v3/accept/:token', async (c) => {
  try {
    const token = c.req.param('token');
    const user = await verifyUser(c.req.header('Authorization'));
    
    const invitation = await kv.get(`team_v3_token:${token}`);
    
    if (!invitation) {
      return c.json({ success: false, error: 'Invitation not found' }, 404);
    }
    
    if (new Date(invitation.expiresAt) <= new Date()) {
      return c.json({ success: false, error: 'Invitation expired' }, 400);
    }
    
    if (invitation.status !== 'pending') {
      return c.json({ success: false, error: 'Invitation not valid' }, 400);
    }
    
    if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      return c.json({ success: false, error: 'Wrong email address' }, 400);
    }
    
    // Add to team members
    const membersKey = `team_v3_members:${invitation.ownerId}`;
    const members = await kv.get(membersKey) || [];
    
    const newMember = {
      id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      email: user.email,
      name: user.user_metadata?.name || invitation.name,
      role: 'member',
      joinedAt: new Date().toISOString(),
    };
    
    const updatedMembers = Array.isArray(members) ? [...members, newMember] : [newMember];
    await kv.set(membersKey, updatedMembers);
    
    // Remove from invites
    const invitesKey = `team_v3_invites:${invitation.ownerId}`;
    const invites = await kv.get(invitesKey) || [];
    const updatedInvites = Array.isArray(invites) 
      ? invites.filter((i: any) => i.id !== invitation.id)
      : [];
    await kv.set(invitesKey, updatedInvites);
    
    // Delete token
    await kv.del(`team_v3_token:${token}`);
    
    console.log('✅ Invitation accepted');
    
    return c.json({
      success: true,
      message: 'Joined team successfully',
      owner: {
        email: invitation.ownerEmail,
        name: invitation.ownerName,
      }
    });
    
  } catch (err: any) {
    console.error('❌ Accept error:', err);
    return c.json({ success: false, error: err.message }, 500);
  }
});

/**
 * POST /team-v3/remove
 * Remove a team member or cancel invitation
 */
teamV3Router.post('/team-v3/remove', async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    const { memberId } = await c.req.json();
    
    if (!memberId) {
      return c.json({ success: false, error: 'Member ID required' }, 400);
    }
    
    // Try members first
    const membersKey = `team_v3_members:${user.id}`;
    const members = await kv.get(membersKey) || [];
    
    if (Array.isArray(members)) {
      const member = members.find((m: any) => m.id === memberId);
      if (member) {
        const updated = members.filter((m: any) => m.id !== memberId);
        await kv.set(membersKey, updated);
        return c.json({ success: true, message: 'Member removed' });
      }
    }
    
    // Try invites
    const invitesKey = `team_v3_invites:${user.id}`;
    const invites = await kv.get(invitesKey) || [];
    
    if (Array.isArray(invites)) {
      const invite = invites.find((i: any) => i.id === memberId);
      if (invite) {
        const updated = invites.filter((i: any) => i.id !== memberId);
        await kv.set(invitesKey, updated);
        if (invite.token) {
          await kv.del(`team_v3_token:${invite.token}`);
        }
        return c.json({ success: true, message: 'Invitation cancelled' });
      }
    }
    
    return c.json({ success: false, error: 'Not found' }, 404);
    
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

export default teamV3Router;