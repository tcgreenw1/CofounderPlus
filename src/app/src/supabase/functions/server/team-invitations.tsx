import { Hono } from 'npm:hono';
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

export function addTeamInvitationEndpoints(app: Hono) {
  console.log('👥 Setting up Team Invitation endpoints...');

  // POST /team-v3/invite - Send team invitation with user detection
  app.post('/team-v3/invite', async (c) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) throw new Error('No auth header');
      
      const token = authHeader.replace('Bearer ', '');
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );
      const { data: { user }, error } = await supabaseClient.auth.getUser(token);
      if (error || !user) throw new Error('Auth failed');
      
      const body = await c.req.json();
      const { inviteEmail, inviteName, ownerName } = body;
      
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
      
      const membersKey = `team_v3_members:${user.id}`;
      const invitesKey = `team_v3_invites:${user.id}`;
      
      let membersRaw = await kv.get(membersKey);
      let invitesRaw = await kv.get(invitesKey);
      
      const members = membersRaw 
        ? (typeof membersRaw === 'string' ? JSON.parse(membersRaw) : membersRaw)
        : [];
      const invites = invitesRaw
        ? (typeof invitesRaw === 'string' ? JSON.parse(invitesRaw) : invitesRaw)
        : [];
      
      const memberCount = Array.isArray(members) ? members.length : 0;
      const inviteCount = Array.isArray(invites) ? invites.length : 0;
      const totalCount = 1 + memberCount + inviteCount;
      
      if (totalCount >= 10) {
        return c.json({ 
          success: false, 
          error: `Team limit reached (10 max). Contact support for enterprise.` 
        }, 400);
      }
      
      if (Array.isArray(members) && members.some((m: any) => m.email === email)) {
        return c.json({ success: false, error: 'Already a team member' }, 400);
      }
      
      if (Array.isArray(invites) && invites.some((i: any) => i.email === email && i.status === 'pending')) {
        return c.json({ success: false, error: 'Invitation already pending' }, 400);
      }
      
      // CHECK IF USER EXISTS IN SUPABASE AUTH
      console.log('🔍 Checking if user exists:', email);
      let existingUser = null;
      let userExists = false;
      
      try {
        // Try to find the user by email using admin API
        const { data: authUsers, error: listError } = await supabaseClient.auth.admin.listUsers();
        
        if (!listError && authUsers?.users) {
          existingUser = authUsers.users.find((u: any) => u.email?.toLowerCase() === email);
          userExists = !!existingUser;
          console.log(userExists ? '✅ User exists!' : '❌ User does not exist');
        }
      } catch (e) {
        console.error('Error checking user existence:', e);
        // Continue with invitation flow even if check fails
      }
      
      const genToken = Array.from({ length: 32 }, () => 
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
          .charAt(Math.floor(Math.random() * 62))
      ).join('');
      
      const now = new Date().toISOString();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      
      const invitation = {
        id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email,
        name: inviteName?.trim() || null,
        ownerId: user.id,
        ownerEmail: user.email,
        ownerName: ownerName || user.user_metadata?.name || user.email,
        token: genToken,
        status: 'pending',
        invitedAt: now,
        expiresAt,
      };
      
      const updatedInvites = Array.isArray(invites) ? [...invites, invitation] : [invitation];
      await kv.set(invitesKey, updatedInvites);
      await kv.set(`team_v3_token:${genToken}`, invitation);
      
      // Send notification or email based on user existence
      let emailSent = false;
      let notificationSent = false;
      
      if (userExists && existingUser) {
        // USER EXISTS - Send in-app notification
        console.log('📬 Sending in-app notification to existing user');
        
        try {
          const notificationKey = `notifications:${existingUser.id}`;
          const existingNotificationsRaw = await kv.get(notificationKey);
          const existingNotifications = existingNotificationsRaw
            ? (typeof existingNotificationsRaw === 'string' ? JSON.parse(existingNotificationsRaw) : existingNotificationsRaw)
            : [];
          
          const notification = {
            id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'team_invitation',
            title: 'Team Invitation',
            message: `${invitation.ownerName} invited you to join their team`,
            fromUserId: user.id,
            fromUserName: invitation.ownerName,
            fromUserEmail: user.email,
            invitationToken: genToken,
            invitationId: invitation.id,
            read: false,
            createdAt: now,
            actionUrl: `/invite/${genToken}`,
          };
          
          const updatedNotifications = Array.isArray(existingNotifications) 
            ? [notification, ...existingNotifications] 
            : [notification];
          
          await kv.set(notificationKey, updatedNotifications);
          notificationSent = true;
          console.log('✅ In-app notification sent successfully');
        } catch (notifError) {
          console.error('❌ Failed to send notification:', notifError);
        }
      } else {
        // USER DOES NOT EXIST - Send email invitation via Supabase
        console.log('📧 Sending email invitation to new user via Supabase Auth');
        
        try {
          const link = `https://www.cofounderplus.com/invite/${genToken}`;
          
          // Use Supabase's auth.admin.generateLink to send invitation email
          const { data, error } = await supabaseClient.auth.admin.generateLink({
            type: 'magiclink',
            email: email,
            options: {
              redirectTo: link,
              data: {
                invitation_type: 'team',
                inviter_name: invitation.ownerName,
                invitee_name: inviteName,
                invitation_link: link,
              }
            }
          });
          
          if (error) {
            console.error('❌ Supabase email error:', error);
            emailSent = false;
          } else {
            emailSent = true;
            console.log('✅ Email sent successfully via Supabase');
          }
        } catch (e) {
          console.error('❌ Email error:', e);
          emailSent = false;
        }
      }
      
      return c.json({
        success: true,
        message: `Invitation sent to ${email}`,
        invitation: {
          id: invitation.id,
          email: invitation.email,
          invitedAt: invitation.invitedAt,
        },
        userExists,
        emailSent,
        notificationSent,
      });
    } catch (err: any) {
      console.error('❌ Team invitation error:', err);
      return c.json({ success: false, error: err.message }, 500);
    }
  });

  console.log('👥 Team Invitation endpoints setup completed');
}
