/**
 * Email templates for Cofounder app
 * These are HTML email templates used for various notifications
 */

interface TeamInvitationEmailParams {
  inviteeName: string;
  inviterName: string;
  inviterEmail: string;
  inviteLink: string;
  expiresAt: string;
}

export function getTeamInvitationEmail({
  inviteeName,
  inviterName,
  inviterEmail,
  inviteLink,
  expiresAt
}: TeamInvitationEmailParams): { subject: string; html: string; text: string } {
  const expiryDate = new Date(expiresAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const subject = `${inviterName} invited you to join their team on Cofounder`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Team Invitation - Cofounder</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%); padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: #00E0FF; font-size: 32px; font-weight: bold;">Cofounder</h1>
              <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px; opacity: 0.9;">Business Growth Platform</p>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px 0; color: #000000; font-size: 24px; font-weight: 600;">You're Invited! 🎉</h2>
              
              <p style="margin: 0 0 16px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                Hi ${inviteeName},
              </p>
              
              <p style="margin: 0 0 16px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                <strong>${inviterName}</strong> (${inviterEmail}) has invited you to join their team on <strong>Cofounder</strong>.
              </p>
              
              <p style="margin: 0 0 24px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                Cofounder is an AI-powered business growth platform that helps entrepreneurs and teams build, manage, and scale their businesses with cutting-edge tools and insights.
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="${inviteLink}" style="display: inline-block; padding: 16px 40px; background-color: #00E0FF; color: #000000; text-decoration: none; border-radius: 12px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(0, 224, 255, 0.3);">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Features Box -->
              <div style="background-color: #f8f9fa; border-radius: 12px; padding: 24px; margin: 32px 0;">
                <h3 style="margin: 0 0 16px 0; color: #000000; font-size: 18px; font-weight: 600;">What you'll get access to:</h3>
                <ul style="margin: 0; padding: 0 0 0 20px; color: #333333; font-size: 15px; line-height: 1.8;">
                  <li>AI-powered business assistant</li>
                  <li>Collaborative roadmap planning</li>
                  <li>Team task management</li>
                  <li>Business analytics and insights</li>
                  <li>Operations management tools</li>
                  <li>And much more!</li>
                </ul>
              </div>
              
              <!-- Expiry Notice -->
              <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 16px; border-radius: 8px; margin: 24px 0;">
                <p style="margin: 0; color: #856404; font-size: 14px;">
                  <strong>⏰ This invitation expires on ${expiryDate}</strong>
                </p>
              </div>
              
              <!-- Link Fallback -->
              <p style="margin: 24px 0 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin: 8px 0 0 0; padding: 12px; background-color: #f8f9fa; border-radius: 8px; word-break: break-all; font-size: 13px; color: #00E0FF;">
                ${inviteLink}
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 32px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0 0 8px 0; color: #666666; font-size: 14px;">
                Questions? Contact us at <a href="mailto:support@cofounderplus.com" style="color: #00E0FF; text-decoration: none;">support@cofounderplus.com</a>
              </p>
              <p style="margin: 8px 0 0 0; color: #999999; font-size: 12px;">
                © ${new Date().getFullYear()} Cofounder. All rights reserved.
              </p>
              <p style="margin: 8px 0 0 0; color: #999999; font-size: 12px;">
                <a href="https://www.cofounderplus.com" style="color: #00E0FF; text-decoration: none;">Visit our website</a> • 
                <a href="https://www.cofounderplus.com/privacy-policy" style="color: #00E0FF; text-decoration: none;">Privacy Policy</a>
              </p>
            </td>
          </tr>
        </table>
        
        <!-- Unsubscribe -->
        <table width="600" cellpadding="0" cellspacing="0" style="margin-top: 20px;">
          <tr>
            <td align="center" style="color: #999999; font-size: 12px;">
              You received this email because ${inviterName} invited you to join their team on Cofounder.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `
You're Invited to Join ${inviterName}'s Team on Cofounder!

Hi ${inviteeName},

${inviterName} (${inviterEmail}) has invited you to join their team on Cofounder.

Cofounder is an AI-powered business growth platform that helps entrepreneurs and teams build, manage, and scale their businesses.

Accept your invitation by visiting this link:
${inviteLink}

What you'll get access to:
• AI-powered business assistant
• Collaborative roadmap planning
• Team task management
• Business analytics and insights
• Operations management tools
• And much more!

⏰ This invitation expires on ${expiryDate}

Questions? Contact us at support@cofounderplus.com

© ${new Date().getFullYear()} Cofounder. All rights reserved.
Visit our website: https://www.cofounderplus.com
  `.trim();

  return { subject, html, text };
}

interface PasswordResetEmailParams {
  userName: string;
  resetLink: string;
  expiresInMinutes?: number;
}

export function getPasswordResetEmail({
  userName,
  resetLink,
  expiresInMinutes = 60
}: PasswordResetEmailParams): { subject: string; html: string; text: string } {
  const subject = 'Reset Your Cofounder Password';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Password - Cofounder</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%); padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: #00E0FF; font-size: 32px; font-weight: bold;">Cofounder</h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px 0; color: #000000; font-size: 24px; font-weight: 600;">Reset Your Password</h2>
              
              <p style="margin: 0 0 16px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                Hi ${userName},
              </p>
              
              <p style="margin: 0 0 16px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                We received a request to reset your password for your Cofounder account. Click the button below to create a new password.
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="${resetLink}" style="display: inline-block; padding: 16px 40px; background-color: #00E0FF; color: #000000; text-decoration: none; border-radius: 12px; font-size: 16px; font-weight: 600;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Security Notice -->
              <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 16px; border-radius: 8px; margin: 24px 0;">
                <p style="margin: 0; color: #856404; font-size: 14px;">
                  <strong>⏰ This link expires in ${expiresInMinutes} minutes</strong>
                </p>
              </div>
              
              <div style="background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 16px; border-radius: 8px; margin: 24px 0;">
                <p style="margin: 0 0 8px 0; color: #721c24; font-size: 14px; font-weight: 600;">
                  Security Notice
                </p>
                <p style="margin: 0; color: #721c24; font-size: 14px; line-height: 1.5;">
                  If you didn't request a password reset, please ignore this email and your password will remain unchanged. Someone may have entered your email address by mistake.
                </p>
              </div>
              
              <!-- Link Fallback -->
              <p style="margin: 24px 0 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin: 8px 0 0 0; padding: 12px; background-color: #f8f9fa; border-radius: 8px; word-break: break-all; font-size: 13px; color: #00E0FF;">
                ${resetLink}
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 32px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0 0 8px 0; color: #666666; font-size: 14px;">
                Questions? Contact us at <a href="mailto:support@cofounderplus.com" style="color: #00E0FF; text-decoration: none;">support@cofounderplus.com</a>
              </p>
              <p style="margin: 8px 0 0 0; color: #999999; font-size: 12px;">
                © ${new Date().getFullYear()} Cofounder. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `
Reset Your Cofounder Password

Hi ${userName},

We received a request to reset your password for your Cofounder account.

Reset your password by visiting this link:
${resetLink}

⏰ This link expires in ${expiresInMinutes} minutes

SECURITY NOTICE: If you didn't request a password reset, please ignore this email and your password will remain unchanged.

Questions? Contact us at support@cofounderplus.com

© ${new Date().getFullYear()} Cofounder. All rights reserved.
  `.trim();

  return { subject, html, text };
}

interface WelcomeEmailParams {
  userName: string;
  userEmail: string;
  verificationLink?: string;
}

export function getWelcomeEmail({
  userName,
  userEmail,
  verificationLink
}: WelcomeEmailParams): { subject: string; html: string; text: string } {
  const subject = 'Welcome to Cofounder! 🚀';

  const verificationSection = verificationLink ? `
    <div style="background-color: #d1ecf1; border-left: 4px solid #0c5460; padding: 16px; border-radius: 8px; margin: 24px 0;">
      <p style="margin: 0 0 8px 0; color: #0c5460; font-size: 14px; font-weight: 600;">
        Please verify your email
      </p>
      <p style="margin: 0 0 12px 0; color: #0c5460; font-size: 14px; line-height: 1.5;">
        Click the button below to verify your email address and activate your account.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center">
            <a href="${verificationLink}" style="display: inline-block; padding: 12px 32px; background-color: #00E0FF; color: #000000; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 600;">
              Verify Email Address
            </a>
          </td>
        </tr>
      </table>
    </div>
  ` : '';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Cofounder</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%); padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: #00E0FF; font-size: 32px; font-weight: bold;">Cofounder</h1>
              <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 18px;">Welcome to Your Business Growth Platform! 🚀</p>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px 0; color: #000000; font-size: 24px; font-weight: 600;">Welcome, ${userName}!</h2>
              
              <p style="margin: 0 0 16px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                We're thrilled to have you join Cofounder! You've just unlocked a powerful suite of AI-driven tools designed to help you build, manage, and scale your business.
              </p>
              
              ${verificationSection}
              
              <!-- Features Box -->
              <div style="background-color: #f8f9fa; border-radius: 12px; padding: 24px; margin: 24px 0;">
                <h3 style="margin: 0 0 16px 0; color: #000000; font-size: 18px; font-weight: 600;">What's inside:</h3>
                <ul style="margin: 0; padding: 0 0 0 20px; color: #333333; font-size: 15px; line-height: 1.8;">
                  <li><strong>AI Business Assistant:</strong> Get instant answers and strategic advice</li>
                  <li><strong>Roadmap Planning:</strong> Chart your business journey</li>
                  <li><strong>Team Collaboration:</strong> Invite and manage team members</li>
                  <li><strong>Business OS:</strong> Product, Marketing, Sales, Finance & HR tools</li>
                  <li><strong>University:</strong> Learn and grow with expert tutorials</li>
                </ul>
              </div>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="https://www.cofounderplus.com/dashboard" style="display: inline-block; padding: 16px 40px; background-color: #00E0FF; color: #000000; text-decoration: none; border-radius: 12px; font-size: 16px; font-weight: 600;">
                      Go to Dashboard
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 24px 0 0 0; color: #666666; font-size: 14px; line-height: 1.6; text-align: center;">
                Need help getting started? Check out our <a href="https://www.cofounderplus.com/university" style="color: #00E0FF; text-decoration: none;">University</a> or contact our support team.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 32px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0 0 8px 0; color: #666666; font-size: 14px;">
                Questions? Contact us at <a href="mailto:support@cofounderplus.com" style="color: #00E0FF; text-decoration: none;">support@cofounderplus.com</a>
              </p>
              <p style="margin: 8px 0 0 0; color: #999999; font-size: 12px;">
                © ${new Date().getFullYear()} Cofounder. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `
Welcome to Cofounder, ${userName}!

We're thrilled to have you join Cofounder! You've just unlocked a powerful suite of AI-driven tools designed to help you build, manage, and scale your business.

What's inside:
• AI Business Assistant: Get instant answers and strategic advice
• Roadmap Planning: Chart your business journey
• Team Collaboration: Invite and manage team members
• Business OS: Product, Marketing, Sales, Finance & HR tools
• University: Learn and grow with expert tutorials

Get started: https://www.cofounderplus.com/dashboard

Need help? Check out our University or contact support@cofounderplus.com

© ${new Date().getFullYear()} Cofounder. All rights reserved.
  `.trim();

  return { subject, html, text };
}
