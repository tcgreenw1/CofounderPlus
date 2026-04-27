import { createClient } from 'jsr:@supabase/supabase-js@2.49.8';
import * as kv from './kv_store.tsx';

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
  console.log('🔧 Adding team management endpoints...');

  // Get team members (new endpoint for notes assignment)
  app.get('/make-server-373d8b09/team/members', async (c: any) => {
    console.log('Team: Get members for assignment endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);

      // Get team members for this user (owner)
      const teamUsersRaw = await kv.getByPrefix(`team_member:${user.id}:`) || [];
      const teamUsers = Array.isArray(teamUsersRaw) ? teamUsersRaw : [];
      
      // Format members for assignment UI
      const members = teamUsers.map((member: any) => ({
        id: member.userId || member.id,
        email: member.email,
        name: member.name || member.email,
        role: member.role || 'member',
        status: member.status || 'active',
      }));
      
      console.log(`Team: Formatted ${members.length} members for assignment`);
      return c.json({ members });

    } catch (error: any) {
      console.error('Team get members for assignment error:', error);
      return c.json({ error: `Error getting team members: ${error.message}` }, 500);
    }
  });

  // Get team members
  app.get('/make-server-ac1075a9/users/team', async (c) => {
    console.log('Team: Get team members endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);

      // Get team members for this user (owner)
      const teamUsersRaw = await kv.getByPrefix(`team_member:${user.id}:`) || [];
      // Ensure teamUsers is always an array (KV store returns parsed JSONB values)
      const teamUsers = Array.isArray(teamUsersRaw) ? teamUsersRaw : [];
      
      console.log(`Team: Found ${teamUsers.length} team members for user ${user.id}`);
      return c.json({ teamUsers });

    } catch (error) {
      console.error('Team get members error:', error);
      return c.json({ error: `Error getting team members: ${error.message}` }, 500);
    }
  });

  // Get subscription details with user limits
  app.get('/make-server-ac1075a9/users/subscription-details', async (c) => {
    console.log('Team: Get subscription details endpoint called');
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

      console.log('Team: Subscription details:', details);
      return c.json(details);

    } catch (error) {
      console.error('Team get subscription details error:', error);
      return c.json({ error: `Error getting subscription details: ${error.message}` }, 500);
    }
  });

  // Invite team member
  app.post('/make-server-ac1075a9/users/invite', async (c) => {
    console.log('Team: Invite user endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      const { email, name, role = 'member' } = await c.req.json();

      if (!email || !name) {
        return c.json({ error: 'Email and name are required' }, 400);
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

      // Generate invite token and create invitation
      const inviteToken = `invite-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const inviteId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const invitation = {
        id: inviteId,
        email,
        name,
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
      const baseUrl = 'https://www.cofounderplus.com';
      const inviteLink = `${baseUrl}/invite/${inviteToken}`;

      // Check if the invitee is an existing user
      let existingUser = null;
      try {
        const { data: users, error: userError } = await supabase.auth.admin.listUsers();
        if (!userError && users?.users) {
          existingUser = users.users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
        }
      } catch (err) {
        console.log('Could not check for existing user:', err);
      }

      // If existing user, create in-app notification
      if (existingUser) {
        console.log('📬 Creating in-app notification for existing user:', existingUser.id);
        const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const inviterName = user.user_metadata?.name || user.email?.split('@')[0] || 'A team member';
        
        const notification = {
          id: notificationId,
          type: 'team_invitation',
          fromUserId: user.id,
          fromUserEmail: user.email,
          fromUserName: inviterName,
          organizationId: user.id,
          invitationToken: inviteToken,
          status: 'pending',
          createdAt: new Date().toISOString(),
          expiresAt: invitation.expires_at,
          email: email,
          title: `Team Invitation from ${inviterName}`,
          message: `${inviterName} has invited you to join their team on Cofounder`,
          actionUrl: inviteLink
        };

        // Store notification for the existing user
        const notificationsKey = `user_notifications:${existingUser.id}`;
        const existingNotifications = await kv.get(notificationsKey) || [];
        let notifications = [];
        
        if (typeof existingNotifications === 'string') {
          notifications = JSON.parse(existingNotifications);
        } else if (Array.isArray(existingNotifications)) {
          notifications = existingNotifications;
        }
        
        await kv.set(notificationsKey, [...notifications, notification]);
        console.log('✅ In-app notification created for existing user:', existingUser.id);
      }

      // Send invitation email
      try {
        const { sendEmail } = await import('./email-service.tsx');
        const { getTeamInvitationEmail } = await import('./email-templates.tsx');
        
        const inviterName = user.user_metadata?.name || user.email?.split('@')[0] || 'A team member';
        
        const emailContent = getTeamInvitationEmail({
          inviteeName: name,
          inviterName,
          inviterEmail: user.email,
          inviteLink,
          expiresAt: invitation.expires_at
        });

        const emailResult = await sendEmail({
          to: email,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text
        });

        if (!emailResult.success) {
          console.warn('Failed to send invitation email:', emailResult.error);
          // Don't fail the invitation if email fails, just log it
        } else {
          console.log(`✅ Invitation email sent to ${email}`);
        }
      } catch (emailError: any) {
        console.error('Error sending invitation email:', emailError);
        // Don't fail the invitation if email fails
      }

      console.log(`Team: Invitation created for ${email} by ${user.email}`);
      return c.json({ 
        success: true, 
        invitation,
        inviteLink,
        message: `Invitation sent to ${email}`,
        hasNotification: !!existingUser
      });

    } catch (error) {
      console.error('Team invite user error:', error);
      return c.json({ error: `Error inviting user: ${error.message}` }, 500);
    }
  });

  // Remove team member
  app.delete('/make-server-ac1075a9/users/team/:memberId', async (c) => {
    console.log('Team: Remove member endpoint called');
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

      console.log(`Team: Member ${memberId} removed by ${user.email}`);
      return c.json({ 
        success: true, 
        message: `${teamMember.name} has been removed from your team` 
      });

    } catch (error) {
      console.error('Team remove member error:', error);
      return c.json({ error: `Error removing team member: ${error.message}` }, 500);
    }
  });

  // Purchase additional seats
  app.post('/make-server-ac1075a9/users/purchase-seats', async (c) => {
    console.log('Team: Purchase seats endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      const { additionalSeats } = await c.req.json();

      if (!additionalSeats || additionalSeats < 1 || additionalSeats > 10) {
        return c.json({ error: 'Additional seats must be between 1 and 10' }, 400);
      }

      const STRIPE_SECRET_KEY = STRIPE_CONFIG.getSecretKey();
      if (!STRIPE_SECRET_KEY) {
        return c.json({ error: 'Stripe not configured' }, 500);
      }

      // Get or create Stripe customer
      let stripeCustomerId;
      const existingCustomer = await kv.get(`stripe_customer:${user.id}`);
      
      if (existingCustomer) {
        const customerExists = await validateCustomerExists(existingCustomer.stripe_customer_id, STRIPE_SECRET_KEY);
        if (customerExists) {
          stripeCustomerId = existingCustomer.stripe_customer_id;
        }
      }

      if (!stripeCustomerId) {
        // Create new Stripe customer
        const customerResponse = await fetch('https://api.stripe.com/v1/customers', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            email: user.email,
            name: user.user_metadata?.name || '',
            'metadata[userId]': user.id,
            'metadata[createdAt]': new Date().toISOString()
          }).toString()
        });

        if (!customerResponse.ok) {
          const errorText = await customerResponse.text();
          console.error('Stripe customer creation error:', errorText);
          return c.json({ error: 'Failed to create Stripe customer' }, 500);
        }

        const customer = await customerResponse.json();
        stripeCustomerId = customer.id;

        // Store customer mapping
        await kv.set(`stripe_customer:${user.id}`, {
          stripe_customer_id: stripeCustomerId,
          user_id: user.id,
          email: user.email,
          created_at: new Date().toISOString()
        });
      }

      // Create Stripe product for additional seats
      const productName = `Additional Team Seats (${additionalSeats} seat${additionalSeats > 1 ? 's' : ''})`;
      
      const productResponse = await fetch('https://api.stripe.com/v1/products', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          name: productName,
          'metadata[userId]': user.id,
          'metadata[seats]': additionalSeats.toString(),
          'metadata[type]': 'additional_seats'
        }).toString()
      });

      if (!productResponse.ok) {
        const errorText = await productResponse.text();
        console.error('Stripe product creation error:', errorText);
        return c.json({ error: 'Failed to create product' }, 500);
      }

      const product = await productResponse.json();

      // Create price for the product
      const totalPrice = additionalSeats * SEAT_PRICE_PER_MONTH * 100; // Convert to cents
      
      const priceResponse = await fetch('https://api.stripe.com/v1/prices', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          unit_amount: totalPrice.toString(),
          currency: 'usd',
          'recurring[interval]': 'month',
          product: product.id
        }).toString()
      });

      if (!priceResponse.ok) {
        const errorText = await priceResponse.text();
        console.error('Stripe price creation error:', errorText);
        return c.json({ error: 'Failed to create price' }, 500);
      }

      const price = await priceResponse.json();

      // Create test payment method if in test mode
      let testPaymentMethodId = null;
      if (STRIPE_CONFIG.testMode) {
        const testPaymentMethodResponse = await fetch('https://api.stripe.com/v1/payment_methods', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            type: 'card',
            'card[number]': '4242424242424242',
            'card[exp_month]': '12',
            'card[exp_year]': '2030',
            'card[cvc]': '123'
          }).toString()
        });

        if (testPaymentMethodResponse.ok) {
          const testPaymentMethod = await testPaymentMethodResponse.json();
          testPaymentMethodId = testPaymentMethod.id;

          // Attach to customer
          await fetch(`https://api.stripe.com/v1/payment_methods/${testPaymentMethodId}/attach`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              customer: stripeCustomerId
            }).toString()
          });
        }
      }

      // Create subscription for additional seats
      const subscriptionParams = new URLSearchParams({
        customer: stripeCustomerId,
        'items[0][price]': price.id,
        'items[0][quantity]': '1',
        'metadata[userId]': user.id,
        'metadata[type]': 'additional_seats',
        'metadata[seats]': additionalSeats.toString(),
        'metadata[createdAt]': new Date().toISOString()
      });

      if (testPaymentMethodId) {
        subscriptionParams.append('default_payment_method', testPaymentMethodId);
      }

      if (STRIPE_CONFIG.testMode) {
        subscriptionParams.append('payment_behavior', 'default_incomplete');
        subscriptionParams.append('expand[]', 'latest_invoice.payment_intent');
      }

      const subscriptionResponse = await fetch('https://api.stripe.com/v1/subscriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: subscriptionParams.toString()
      });

      if (!subscriptionResponse.ok) {
        const errorText = await subscriptionResponse.text();
        console.error('Stripe subscription creation error:', errorText);
        return c.json({ error: 'Failed to create subscription' }, 500);
      }

      const subscription = await subscriptionResponse.json();

      // Update user's add-on seats record
      const existingAddOnSeats = await kv.get(`addon_seats:${user.id}`) || { seats: 0, monthlyCost: 0 };
      const updatedAddOnSeats = {
        seats: existingAddOnSeats.seats + additionalSeats,
        monthlyCost: existingAddOnSeats.monthlyCost + (additionalSeats * SEAT_PRICE_PER_MONTH),
        subscriptions: [
          ...(existingAddOnSeats.subscriptions || []),
          {
            id: subscription.id,
            seats: additionalSeats,
            monthlyCost: additionalSeats * SEAT_PRICE_PER_MONTH,
            created_at: new Date().toISOString(),
            status: subscription.status
          }
        ],
        updated_at: new Date().toISOString()
      };

      await kv.set(`addon_seats:${user.id}`, updatedAddOnSeats);

      console.log(`Team: ${additionalSeats} additional seats purchased by ${user.email}`);
      return c.json({
        success: true,
        subscription,
        addOnSeats: updatedAddOnSeats,
        message: `${additionalSeats} additional seat${additionalSeats > 1 ? 's' : ''} purchased successfully`
      });

    } catch (error) {
      console.error('Team purchase seats error:', error);
      return c.json({ error: `Error purchasing additional seats: ${error.message}` }, 500);
    }
  });

  // Accept invitation endpoint
  app.post('/make-server-ac1075a9/users/accept-invite', async (c) => {
    console.log('Team: Accept invite endpoint called');
    try {
      const { token } = await c.req.json();

      if (!token) {
        return c.json({ error: 'Invite token is required' }, 400);
      }

      // Get invitation details
      const inviteData = await kv.get(`invite_token:${token}`);
      if (!inviteData) {
        return c.json({ error: 'Invalid or expired invitation' }, 404);
      }

      // Check if invitation has expired
      const expiresAt = new Date(inviteData.expires_at);
      if (new Date() > expiresAt) {
        return c.json({ error: 'Invitation has expired' }, 400);
      }

      // Get the full invitation details
      const invitation = await kv.get(`team_member:${inviteData.owner_id}:${inviteData.invite_id}`);
      if (!invitation) {
        return c.json({ error: 'Invitation not found' }, 404);
      }

      // Return invitation details for the frontend to complete the signup process
      return c.json({
        success: true,
        invitation: {
          email: invitation.email,
          name: invitation.name,
          role: invitation.role,
          owner_email: invitation.owner_email,
          token
        }
      });

    } catch (error) {
      console.error('Team accept invite error:', error);
      return c.json({ error: `Error accepting invitation: ${error.message}` }, 500);
    }
  });

  // Validate invitation endpoint (for viewing invitation details before accepting)
  app.get('/make-server-ac1075a9/users/validate-invite', async (c) => {
    console.log('Team: Validate invite endpoint called');
    try {
      const token = c.req.query('token');

      if (!token) {
        return c.json({ error: 'Invite token is required' }, 400);
      }

      // Get invitation details
      const inviteData = await kv.get(`invite_token:${token}`);
      if (!inviteData) {
        return c.json({ error: 'Invalid or expired invitation' }, 404);
      }

      // Check if invitation has expired
      const expiresAt = new Date(inviteData.expires_at);
      if (new Date() > expiresAt) {
        return c.json({ error: 'Invitation has expired' }, 410);
      }

      // Get the full invitation details
      const invitation = await kv.get(`team_member:${inviteData.owner_id}:${inviteData.invite_id}`);
      if (!invitation) {
        return c.json({ error: 'Invitation not found' }, 404);
      }

      // Get organizer info
      const organizerData = await kv.get(`user_profile:${invitation.owner_id}`) || {};
      
      // Return invitation details
      return c.json({
        teamUser: {
          id: invitation.id,
          email: invitation.email,
          name: invitation.name,
          role: invitation.role,
          invited_by: invitation.owner_email,
          invited_at: invitation.invited_at,
          expires_at: invitation.expires_at
        },
        organizer: {
          name: organizerData.name || invitation.owner_email?.split('@')[0] || 'Team Administrator',
          email: invitation.owner_email
        }
      });

    } catch (error) {
      console.error('Team validate invite error:', error);
      return c.json({ error: `Error validating invitation: ${error.message}` }, 500);
    }
  });

  // Complete invitation after user signup
  app.post('/make-server-ac1075a9/users/complete-invite', async (c) => {
    console.log('Team: Complete invite endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      const { token } = await c.req.json();

      if (!token) {
        return c.json({ error: 'Invite token is required' }, 400);
      }

      // Get invitation details
      const inviteData = await kv.get(`invite_token:${token}`);
      if (!inviteData) {
        return c.json({ error: 'Invalid or expired invitation' }, 404);
      }

      // Verify the user's email matches the invitation
      if (user.email !== inviteData.email) {
        return c.json({ error: 'Email mismatch with invitation' }, 400);
      }

      // Get the full invitation details
      const invitation = await kv.get(`team_member:${inviteData.owner_id}:${inviteData.invite_id}`);
      if (!invitation) {
        return c.json({ error: 'Invitation not found' }, 404);
      }

      // Update invitation status to active
      const activeMember = {
        ...invitation,
        status: 'active',
        user_id: user.id,
        joined_at: new Date().toISOString()
      };

      await kv.set(`team_member:${inviteData.owner_id}:${inviteData.invite_id}`, activeMember);

      // IMPORTANT: Grant the invited user access to ALL of the owner's businesses
      console.log(`Team: Granting business access to ${user.email} for all businesses owned by ${inviteData.owner_id}`);
      
      // Get all businesses owned by the inviter
      const ownerBusinesses = await kv.getByPrefix(`business:${inviteData.owner_id}:`) || [];
      console.log(`Team: Found ${ownerBusinesses.length} businesses owned by inviter`);
      
      // Create business membership records for each business
      const memberships = [];
      for (const business of ownerBusinesses) {
        const membershipKey = `business_member:${business.id}:${user.id}`;
        const membership = {
          business_id: business.id,
          business_name: business.name,
          user_id: user.id,
          user_email: user.email,
          owner_id: inviteData.owner_id,
          role: invitation.role || 'member',
          status: 'active',
          joined_at: new Date().toISOString()
        };
        
        await kv.set(membershipKey, membership);
        memberships.push(membership);
        console.log(`Team: Created membership for business ${business.name} (${business.id})`);
      }

      // Also store a reverse index for easy lookup of all businesses a user is a member of
      const userMembershipsKey = `user_business_memberships:${user.id}`;
      await kv.set(userMembershipsKey, memberships);
      console.log(`Team: Stored ${memberships.length} business memberships for user ${user.email}`);

      // Clean up the invite token
      await kv.del(`invite_token:${token}`);

      console.log(`Team: Invitation completed for ${user.email} with access to ${memberships.length} businesses`);
      return c.json({
        success: true,
        member: activeMember,
        businessesGranted: memberships.length,
        message: `Successfully joined the team with access to ${memberships.length} business${memberships.length !== 1 ? 'es' : ''}`
      });

    } catch (error) {
      console.error('Team complete invite error:', error);
      return c.json({ error: `Error completing invitation: ${error.message}` }, 500);
    }
  });

  console.log('✅ Team management endpoints added successfully');
}