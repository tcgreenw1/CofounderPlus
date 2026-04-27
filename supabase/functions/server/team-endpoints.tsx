import { createClient } from 'npm:@supabase/supabase-js@2.47.10';
import * as kv from './kv_store.tsx';
import { sendPushNotification } from './push-notification-helper.tsx';

// Import Stripe configuration
const STRIPE_CONFIG = {
  testMode: true,
  
  getSecretKey: () => {
    if (STRIPE_CONFIG.testMode) {
      return 'REMOVED51RvhDFGOnlWNZwGeFEgAneD3Y2U6LKL1UNlVpMxCP49xnjdIvPrkhEBi3rf2MPFq1SFKMvoEbYV6UtoQZNBdrKz100bi9hcShb';
    } else {
      return Deno.env.get('STRIPE_SECRET_KEY') || '';
    }
  }
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

let supabase: any = null;
if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

// Plan limits configuration
const PLAN_LIMITS = {
  'free': { users: 10, name: 'Starter' },
  'creator': { users: 1, name: 'Creator' },
  'builder': { users: 2, name: 'Builder' },
  'studio': { users: 3, name: 'Studio' }
};

const SEAT_PRICE_PER_MONTH = 12; // $12 per month per additional seat

// Helper function to validate customer exists in Stripe
async function validateCustomerExists(customerId: string, stripeSecretKey: string): Promise<boolean> {
  try {
    const response = await fetch(`https://api.stripe.com/v1/customers/${customerId}`, {
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
      }
    });
    return response.ok;
  } catch (error) {
    console.error(`Error validating customer ${customerId}:`, error);
    return false;
  }
}

export function addTeamEndpoints(app: any, verifyUserAccess: Function) {
  // Remove team member
  app.delete('/make-server-ac1075a9/users/team/:memberId', async (c) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      const memberId = c.req.param('memberId');

      // Get the team member
      const teamMember = await kv.get(`team_member:${user.id}:${memberId}`);
      if (!teamMember) {
        return c.json({ error: 'Team member not found' }, 404);
      }

      // Remove the team member
      await kv.del(`team_member:${user.id}:${memberId}`);
      
      // If they have an invite token, remove that too
      if (teamMember.invite_token) {
        await kv.del(`invite_token:${teamMember.invite_token}`);
      }

      return c.json({ 
        success: true, 
        message: `${teamMember.name} has been removed from your team` 
      });

    } catch (error) {
      return c.json({ error: `Error removing team member: ${error.message}` }, 500);
    }
  });

  // ============================================================================
  // NEW ENDPOINTS WITH UPDATED PREFIX: make-server-373d8b09
  // ============================================================================

  // Get team members
  app.get('/make-server-373d8b09/users/team', async (c) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);

      // Get team members for this user (owner)
      const teamUsersRaw = await kv.getByPrefix(`team_member:${user.id}:`) || [];
      // Ensure teamUsers is always an array (KV store returns parsed JSONB values)
      const teamUsers = Array.isArray(teamUsersRaw) ? teamUsersRaw : [];
      
      return c.json({ teamUsers });

    } catch (error) {
      return c.json({ error: `Error getting team members: ${error.message}` }, 500);
    }
  });

  // Get subscription details with user limits
  app.get('/make-server-373d8b09/users/subscription-details', async (c) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);

      // Get user's subscription
      const subscriptionData = await kv.get(`subscription:${user.id}`);
      const trialData = await kv.get(`trial:${user.id}`);
      
      // Get user's add-on seats
      const addOnSeats = await kv.get(`addon_seats:${user.id}`) || { seats: 0, monthlyCost: 0 };
      
      // Get team members count
      const teamMembersRaw = await kv.getByPrefix(`team_member:${user.id}:`) || [];
      const teamMembers = Array.isArray(teamMembersRaw) ? teamMembersRaw : [];
      const currentUserCount = teamMembers.length + 1; // +1 for the owner

      // Determine current plan
      let currentPlan = 'free';
      if (subscriptionData && ['active', 'trialing'].includes(subscriptionData.status)) {
        currentPlan = subscriptionData.plan;
      } else if (trialData && trialData.status === 'active') {
        const trialEnd = new Date(trialData.trial_end);
        if (new Date() < trialEnd) {
          currentPlan = trialData.plan;
        }
      }

      // Calculate limits
      const basePlanLimit = PLAN_LIMITS[currentPlan]?.users || 1;
      const maxUsers = basePlanLimit + addOnSeats.seats;
      const canAddUsers = currentUserCount < maxUsers;

      const details = {
        currentUserCount,
        maxUsers,
        addOnSeats: addOnSeats.seats,
        addOnMonthlyCost: addOnSeats.monthlyCost,
        canAddUsers,
        subscription: subscriptionData,
        trial: trialData,
        plan: currentPlan
      };

      return c.json(details);

    } catch (error) {
      return c.json({ error: `Error getting subscription details: ${error.message}` }, 500);
    }
  });

  // Invite team member
  app.post('/make-server-373d8b09/users/invite', async (c) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      const { email, name, role = 'member' } = await c.req.json();

      if (!email) {
        return c.json({ error: 'Email is required' }, 400);
      }

      // Check if user has capacity for more team members
      const teamMembersRaw = await kv.getByPrefix(`team_member:${user.id}:`) || [];
      // Ensure teamMembers is an array of objects (KV store returns parsed JSONB)
      const teamMembers = Array.isArray(teamMembersRaw) ? teamMembersRaw : [];
      
      // NEW LIMIT: 10 total team members (owner + 9 invites) for all plans
      const maxTeamMembers = 10;
      const currentUserCount = teamMembers.length + 1; // +1 for owner

      if (currentUserCount >= maxTeamMembers) {
        return c.json({ 
          success: false,
          error: 'You have reached the maximum of 10 team members. Please contact us for an enterprise account.',
          currentUserCount,
          maxUsers: maxTeamMembers,
          needsUpgrade: false
        }, 400);
      }

      // Check if email is already invited or is the owner
      if (email === user.email) {
        return c.json({ error: 'Cannot invite yourself' }, 400);
      }

      const existingInvite = teamMembers.find(member => member && member.email === email);
      if (existingInvite) {
        return c.json({ error: 'User already invited or is a team member' }, 400);
      }

      // Check if the invited email belongs to an existing user
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
      
      const isExistingUser = !!existingUser;
      const inviteeName = name || (existingUser?.user_metadata?.name) || email.split('@')[0];

      // Generate invite token and create invitation
      const inviteToken = `invite-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const inviteId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const invitation = {
        id: inviteId,
        email,
        name: inviteeName,
        role,
        status: 'invited',
        owner_id: user.id,
        owner_email: user.email,
        invite_token: inviteToken,
        invited_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      };

      // Store the invitation
      await kv.set(`team_member:${user.id}:${inviteId}`, invitation);
      await kv.set(`invite_token:${inviteToken}`, {
        owner_id: user.id,
        invite_id: inviteId,
        email,
        expires_at: invitation.expires_at
      });

      // Create invite link
      const inviteLink = `https://www.cofounderplus.com/invite?token=${inviteToken}`;

      // Send invitation email via Supabase Auth (only for NEW users who don't have an account yet)
      if (!isExistingUser) {
        try {
          console.log('📧 Sending invitation email to new user via Supabase Auth...');
          
          // Use Supabase's auth.admin.inviteUserByEmail - the correct method for team invitations
          const { data, error: emailError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
            redirectTo: inviteLink,
            data: {
              invitation_type: 'team',
              inviter_email: user.email,
              inviter_name: user.user_metadata?.name || user.email,
              invitee_name: inviteeName,
              role: role,
              invitation_link: inviteLink,
              invitation_token: inviteToken,
            }
          });

          if (emailError) {
            console.error('❌ Failed to send invitation email:', emailError);
            // Don't fail the whole request if email fails - just log it
          } else {
            console.log(`✅ Invitation email sent to ${email} via Supabase`);
          }
        } catch (emailError) {
          console.error('❌ Error sending invitation email:', emailError);
          // Don't fail the whole request if email fails
        }
      } else {
        console.log('ℹ️ User already exists - skipping email, will use in-app notification instead');
      }

      // If the user exists, create an in-app notification for them
      if (isExistingUser && existingUser) {
        try {
          const notificationId = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days from now
          
          const notification = {
            id: notificationId,
            type: 'team_invitation',
            fromUserId: user.id,
            fromUserEmail: user.email,
            fromUserName: user.user_metadata?.name || user.email,
            organizationId: user.id,
            invitationToken: inviteToken,
            status: 'pending',
            createdAt: new Date().toISOString(),
            expiresAt: expiresAt,
            email: email
          };
          
          // Store notification in the user_notifications array
          const notificationsKey = `user_notifications:${existingUser.id}`;
          const existingNotifications = await kv.get(notificationsKey) || [];
          const notifications = Array.isArray(existingNotifications) ? existingNotifications : [];
          await kv.set(notificationsKey, JSON.stringify([...notifications, notification]));
          
          console.log(`✅ In-app notification created for existing user ${existingUser.id}`);
          
          // Send push notification
          await sendPushNotification({
            userId: existingUser.id,
            title: 'Team Invitation',
            message: `${notification.fromUserName} invited you to join their team`,
            category: 'team_invitation',
            data: { notificationId, organizationId: user.id }
          });
        } catch (notifError) {
          console.error('Error creating in-app notification:', notifError);
          // Don't fail the whole request if notification fails
        }
      }

      // Create different messages for existing vs new users
      const userStatusMessage = isExistingUser 
        ? `✅ ${inviteeName} is an existing user. They will receive an in-app notification to join your team.`
        : `📧 Sending invitation email to ${email}. They will need to create an account to join your team.`;

      return c.json({ 
        success: true, 
        invitation,
        inviteLink,
        isExistingUser,
        userStatusMessage,
        message: `Invitation sent to ${email}` 
      });

    } catch (error) {
      return c.json({ error: `Error inviting user: ${error.message}` }, 500);
    }
  });

  // Remove team member
  app.delete('/make-server-373d8b09/users/team/:memberId', async (c) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      const memberId = c.req.param('memberId');

      // Get the team member
      const teamMember = await kv.get(`team_member:${user.id}:${memberId}`);
      if (!teamMember) {
        return c.json({ error: 'Team member not found' }, 404);
      }

      // Remove the team member
      await kv.del(`team_member:${user.id}:${memberId}`);
      
      // If they have an invite token, remove that too
      if (teamMember.invite_token) {
        await kv.del(`invite_token:${teamMember.invite_token}`);
      }

      return c.json({ 
        success: true, 
        message: `${teamMember.name} has been removed from your team` 
      });

    } catch (error) {
      return c.json({ error: `Error removing team member: ${error.message}` }, 500);
    }
  });
}