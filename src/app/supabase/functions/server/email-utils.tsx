/**
 * Email utilities for Founder Call bookings and notifications
 * Uses SendGrid API for email delivery
 */

const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY');

// Make FROM_EMAIL and FROM_NAME configurable
const FROM_EMAIL = Deno.env.get('SENDGRID_FROM_EMAIL') || 'noreply@yourdomain.com';
const FROM_NAME = Deno.env.get('SENDGRID_FROM_NAME') || 'Cofounder+';

console.log('📧 Email configuration loaded:');
console.log(`   FROM_EMAIL: ${FROM_EMAIL}`);
console.log(`   FROM_NAME: ${FROM_NAME}`);
console.log(`   SENDGRID_API_KEY: ${SENDGRID_API_KEY ? '✅ Set' : '❌ Not set'}`);

interface EmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    content: string;
    filename: string;
    type: string;
    disposition: string;
  }>;
}

/**
 * Send email via SendGrid
 */
export async function sendEmail(params: EmailParams): Promise<{ success: boolean; error?: string; details?: any }> {
  try {
    if (!SENDGRID_API_KEY) {
      const errorMsg = 'SendGrid API key not configured';
      console.error('❌', errorMsg);
      console.error('💡 Add SENDGRID_API_KEY to your environment variables');
      console.error('💡 Get your API key from: https://app.sendgrid.com/settings/api_keys');
      return { success: false, error: errorMsg, details: 'Missing SENDGRID_API_KEY environment variable' };
    }

    console.log(`📧 Sending email to ${params.to}...`);
    console.log(`📧 Subject: ${params.subject}`);
    console.log(`📧 From: ${FROM_EMAIL}`);

    // Build the request body
    const requestBody: any = {
      personalizations: [
        {
          to: [{ email: params.to }],
          subject: params.subject,
        },
      ],
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME,
      },
      content: [
        {
          type: 'text/plain',
          value: params.text || params.html.replace(/<[^>]*>/g, ''),
        },
        {
          type: 'text/html',
          value: params.html,
        },
      ],
    };

    // Only include attachments if there are any
    if (params.attachments && params.attachments.length > 0) {
      requestBody.attachments = params.attachments;
    }

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ SendGrid API Error:', response.status, response.statusText);
      console.error('❌ Error details:', errorText);
      
      // Parse and log specific errors
      let errorDetails: any = { statusCode: response.status, statusText: response.statusText };
      try {
        const errorJson = JSON.parse(errorText);
        errorDetails = errorJson;
        if (errorJson.errors) {
          console.error('❌ SendGrid errors:', JSON.stringify(errorJson.errors, null, 2));
          
          // Extract the most useful error message
          const firstError = errorJson.errors[0];
          if (firstError) {
            errorDetails.mainError = firstError.message || firstError;
          }
        }
      } catch (e) {
        // Error is not JSON, use text as-is
        errorDetails.raw = errorText;
      }
      
      return { 
        success: false, 
        error: `SendGrid API error (${response.status}): ${response.statusText}`,
        details: errorDetails
      };
    }

    console.log(`✅ Email sent successfully to ${params.to}`);
    console.log(`✅ Subject: ${params.subject}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    if (error instanceof Error) {
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
      return { 
        success: false, 
        error: error.message,
        details: error.stack
      };
    }
    return { 
      success: false, 
      error: 'Unknown error occurred',
      details: String(error)
    };
  }
}

import { format } from 'npm:date-fns@2.30.0';
import { toDate, formatInTimeZone } from 'npm:date-fns-tz@2.0.0';

/**
 * Generate ICS calendar file content
 */
export function generateCalendarInvite(params: {
  date: string; // Admin Date (CST)
  time: string; // Admin Time (CST)
  name: string;
  email: string;
  zoomLink?: string;
  bookingType?: 'founder_call' | 'task_automation';
}): string {
  const { date, time, name, email, zoomLink, bookingType = 'founder_call' } = params;

  // Configuration based on booking type
  const config = {
    founder_call: {
      productName: 'Founder Setup Call',
    },
    task_automation: {
      productName: 'Task Automation Setup',
    }
  }[bookingType];

  // Combine Date and Time
  // "2023-10-27" + " " + "9:00 AM"
  const dateTimeStr = `${date} ${time}`;
  
  // We know this time is in America/Chicago
  // We need to create a Date object representing this exact instant
  const adminTimeZone = 'America/Chicago';
  
  // Manual parsing because date-fns `parse` creates local time
  // We'll create an ISO string and let date-fns-tz handle it if possible, 
  // or just use a robust constructor.
  
  // Simple parse for "YYYY-MM-DD h:mm a"
  const [y, m, d] = date.split('-').map(Number);
  const [timePart, meridiem] = time.split(' ');
  let [h, min] = timePart.split(':').map(Number);
  
  if (meridiem === 'PM' && h !== 12) h += 12;
  if (meridiem === 'AM' && h === 12) h = 0;
  
  // Construct an ISO string for Chicago time: "2023-10-27T09:00:00" (no Z)
  const isoLocal = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}T${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}:00`;
  
  // Convert "Chicago Time" to "UTC Date Object"
  const utcDate = toDate(isoLocal, { timeZone: adminTimeZone });
  const endDate = new Date(utcDate.getTime() + 60 * 60 * 1000); // 60 mins later

  // Format dates for ICS (YYYYMMDDTHHMMSSZ) in UTC
  const formatICSDate = (d: Date) => {
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const dtstart = formatICSDate(utcDate);
  const dtend = formatICSDate(endDate);
  const dtstamp = formatICSDate(new Date());

  const location = zoomLink || 'Microsoft Teams link will be sent 24 hours before the call';
  const description = zoomLink 
    ? `Join the Microsoft Teams call: ${zoomLink}\\n\\nThis is your $99 Founder Setup Call with Cofounder+. We'll work together on your business for a full hour.`
    : 'Your Microsoft Teams link will be sent 24 hours before the call.\\n\\nThis is your $99 Founder Setup Call with Cofounder+. We\'ll work together on your business for a full hour.';

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//Cofounder+//${config.productName}//EN`,
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${bookingType}-${date}-${time.replace(/[:\s]/g, '-')}@cofounderplus.com`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${config.productName} - Cofounder+`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    `ORGANIZER;CN=Cofounder+:mailto:${FROM_EMAIL}`,
    `ATTENDEE;CN=${name};RSVP=TRUE:mailto:${email}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'BEGIN:VALARM',
    'TRIGGER:-PT24H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder: ${config.productName} tomorrow',
    'END:VALARM',
    'BEGIN:VALARM',
    'TRIGGER:-PT1H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder: ${config.productName} in 1 hour',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  return icsContent;
}

/**
 * Send booking confirmation email with calendar invite
 */
export async function sendBookingConfirmation(params: {
  name: string;
  email: string;
  date: string;
  time: string;
  userDate?: string;
  userTime?: string;
  userTimezone?: string;
  bookingId: string;
  zoomLink?: string;
  bookingType?: 'founder_call' | 'task_automation';
  hostName?: string;
  isReschedule?: boolean;
}): Promise<boolean> {
  const { name, email, date, time, userDate, userTime, userTimezone, bookingId, zoomLink, bookingType = 'founder_call', hostName, isReschedule } = params;

  // Configuration based on booking type
  const config = {
    founder_call: {
      subject: isReschedule ? '✅ Your Founder Setup Call is Rescheduled' : '✅ Your Founder Setup Call is Confirmed',
      title: isReschedule ? '✅ Rescheduled: Founder Setup Call' : '✅ Your Founder Call is Confirmed!',
      productName: 'Founder Setup Call',
      description: 'We\'ll work together on your business for a full hour.'
    },
    task_automation: {
      subject: isReschedule ? '✅ Your Automation Setup is Rescheduled' : '✅ Your Automation Setup is Confirmed',
      title: isReschedule ? '✅ Rescheduled: Automation Setup' : '✅ Your Automation Setup is Confirmed!',
      productName: 'Task Automation Setup',
      description: 'We\'ll work together to automate your repetitive tasks.'
    }
  }[bookingType];

  // Use user's local time if available, otherwise fall back to Admin/CST time
  const displayDate = userDate || date;
  const displayTime = userTime || time;
  const displayTimezone = userTimezone || 'CST';

  // Format date nicely
  const formattedDate = new Date(displayDate).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Generate calendar invite (always uses Admin CST time to generate correct UTC ICS)
  const icsContent = generateCalendarInvite({ date, time, name, email, zoomLink, bookingType });
  const icsBase64 = btoa(icsContent);

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #2b7fff 0%, #6c5ce7 100%);
      padding: 40px 20px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .content {
      padding: 40px 30px;
    }
    .confirmation-box {
      background: linear-gradient(135deg, rgba(43, 127, 255, 0.05) 0%, rgba(108, 92, 231, 0.05) 100%);
      border: 2px solid rgba(43, 127, 255, 0.2);
      border-radius: 12px;
      padding: 24px;
      margin: 24px 0;
    }
    .detail-row {
      display: flex;
      align-items: center;
      margin: 16px 0;
      font-size: 16px;
    }
    .detail-row strong {
      min-width: 80px;
      color: #2b7fff;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #2b7fff 0%, #1e5dd9 100%);
      color: #ffffff;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
      text-align: center;
    }
    .steps {
      background-color: #f9fafb;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .step {
      display: flex;
      align-items: start;
      margin: 12px 0;
    }
    .step-number {
      background: #10b981;
      color: white;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      margin-right: 12px;
      flex-shrink: 0;
    }
    .footer {
      background-color: #f9fafb;
      padding: 30px;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
    }
    .zoom-link {
      background-color: #10b981;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      text-align: center;
      margin: 20px 0;
    }
    .zoom-link a {
      color: white;
      text-decoration: none;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${config.title}</h1>
    </div>
    
    <div class="content">
      <p style="font-size: 18px; margin-bottom: 8px;">Hi ${name},</p>
      
      <p>${isReschedule ? 'Your booking has been successfully rescheduled.' : 'Great news! Your booking is confirmed.'} ${config.description}</p>
      
      <div class="confirmation-box">
        <h2 style="margin-top: 0; color: #1f2937; font-size: 20px;">📅 Booking Details</h2>
        <div class="detail-row">
          <strong>Date:</strong>
          <span>${formattedDate}</span>
        </div>
        <div class="detail-row">
          <strong>Time:</strong>
          <span>${displayTime} (${displayTimezone})</span>
        </div>
        <div class="detail-row">
          <strong>Duration:</strong>
          <span>60 minutes</span>
        </div>
        <div class="detail-row">
          <strong>Format:</strong>
          <span>Live working session via Microsoft Teams${hostName ? ` with ${hostName}` : ''}</span>
        </div>
      </div>

      ${zoomLink ? `
      <div class="zoom-link">
        <p style="margin: 0 0 8px 0;">🎥 <strong>Join Microsoft Teams Call</strong></p>
        <a href="${zoomLink}" target="_blank">${zoomLink}</a>
      </div>
      ` : `
      <p style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; border-radius: 4px;">
        <strong>📧 Microsoft Teams Link:</strong> A specific link has not been assigned yet. We will send you the direct link via email 24 hours before your call.
      </p>
      `}

      <div class="steps">
        <h3 style="margin-top: 0; color: #1f2937;">What's Next?</h3>
        
        <div class="step">
          <div class="step-number">✓</div>
          <div>
            <strong>Add to Calendar:</strong> The updated calendar invite is attached to this email. Click to add it to your calendar.
          </div>
        </div>
        
        <div class="step">
          <div class="step-number">✓</div>
          <div>
            <strong>Download the App:</strong> Install Cofounder+ on your devices before the call so we can set it up together.
          </div>
        </div>
        
        <div class="step">
          <div class="step-number">✓</div>
          <div>
            <strong>Prepare Questions:</strong> Think about your biggest business challenges. We'll tackle them live.
          </div>
        </div>
        
        <div class="step">
          <div class="step-number">✓</div>
          <div>
            <strong>Be Ready to Work:</strong> Bring your laptop and be in a quiet space. This is a hands-on working session.
          </div>
        </div>
      </div>

      <center>
        <a href="https://cofounderplus.com/dashboard" class="button">Go to Dashboard</a>
      </center>

      <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
        <strong>Need to reschedule?</strong> You can <a href="https://cofounderplus.com/booking-confirmation/${bookingId}" style="color: #2b7fff;">manage your booking here</a> or email us at support@cofounderplus.com at least 24 hours in advance.
      </p>
    </div>
    
    <div class="footer">
      <p><strong>Cofounder+</strong></p>
      <p>Your business tool for founders</p>
      <p style="margin-top: 16px;">
        Questions? Reply to this email or contact us at 
        <a href="mailto:support@cofounderplus.com" style="color: #2b7fff;">support@cofounderplus.com</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;

  const textContent = `
${config.title}

Hi ${name},

${isReschedule ? 'Your booking has been successfully rescheduled.' : 'Great news! Your booking is confirmed.'}

Booking Details:
- Date: ${formattedDate}
- Time: ${displayTime} (${displayTimezone})
- Duration: 60 minutes
- Format: Live working session via Microsoft Teams

${zoomLink ? `Microsoft Teams Link: ${zoomLink}` : 'Microsoft Teams Link: Will be sent 24 hours before your call'}

What's Next?
✓ Add to Calendar: The calendar invite is attached to this email
✓ Download the App: Install Cofounder+ before the call
✓ Prepare Questions: Think about your biggest business challenges
✓ Be Ready to Work: Bring your laptop and be in a quiet space

Need to reschedule? Manage your booking at https://cofounderplus.com/booking-confirmation/${bookingId} or email us at support@cofounderplus.com at least 24 hours in advance.

--
Cofounder+
Your business tool for founders
support@cofounderplus.com
  `;

  return (await sendEmail({
    to: email,
    subject: config.subject,
    html: htmlContent,
    text: textContent,
    attachments: [
      {
        content: icsBase64,
        filename: 'booking-invite.ics',
        type: 'text/calendar',
        disposition: 'attachment',
      },
    ],
  })).success;
}

/**
 * Send reminder email 24 hours before the call
 */
export async function sendCallReminder(params: {
  name: string;
  email: string;
  date: string;
  time: string;
  zoomLink: string;
}): Promise<boolean> {
  const { name, email, date, time, zoomLink } = params;

  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      padding: 40px 20px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .content {
      padding: 40px 30px;
    }
    .zoom-box {
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%);
      border: 2px solid #10b981;
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      margin: 24px 0;
    }
    .zoom-button {
      display: inline-block;
      background: #10b981;
      color: #ffffff;
      text-decoration: none;
      padding: 16px 40px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 18px;
      margin: 12px 0;
    }
    .reminder-box {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 16px;
      border-radius: 4px;
      margin: 20px 0;
    }
    .checklist {
      background-color: #f9fafb;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .check-item {
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .check-item:last-child {
      border-bottom: none;
    }
    .footer {
      background-color: #f9fafb;
      padding: 30px;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⏰ Your Call is Tomorrow!</h1>
    </div>
    
    <div class="content">
      <p style="font-size: 18px;">Hi ${name},</p>
      
      <p>This is a friendly reminder that your Founder Setup Call is scheduled for <strong>tomorrow</strong>!</p>
      
      <div class="reminder-box">
        <p style="margin: 0;"><strong>📅 ${formattedDate} at ${time}</strong></p>
      </div>

      <div class="zoom-box">
        <p style="font-size: 20px; margin: 0 0 16px 0;">🎥 <strong>Join via Microsoft Teams</strong></p>
        <a href="${zoomLink}" class="zoom-button" target="_blank">Click to Join Call</a>
        <p style="margin: 16px 0 0 0; font-size: 14px; color: #6b7280;">Or copy this link: ${zoomLink}</p>
      </div>

      <div class="checklist">
        <h3 style="margin-top: 0; color: #1f2937;">Pre-Call Checklist:</h3>
        
        <div class="check-item">
          ✓ <strong>Test your Microsoft Teams setup</strong> - Camera, microphone, and internet connection
        </div>
        
        <div class="check-item">
          ✓ <strong>Download Cofounder+</strong> - Have the app ready on your devices
        </div>
        
        <div class="check-item">
          ✓ <strong>Prepare your laptop</strong> - We'll be working together live
        </div>
        
        <div class="check-item">
          ✓ <strong>Find a quiet space</strong> - Minimize distractions for the full hour
        </div>
        
        <div class="check-item">
          ✓ <strong>List your questions</strong> - What are your biggest business challenges?
        </div>
      </div>

      <p style="background: #dbeafe; border-left: 4px solid #2b7fff; padding: 12px; border-radius: 4px;">
        <strong>💡 Pro Tip:</strong> Join 5 minutes early to ensure everything is working smoothly. This is a working session, so have any relevant documents or data ready to share.
      </p>

      <p style="margin-top: 30px; color: #6b7280;">
        <strong>Can't make it?</strong> Email us immediately at support@cofounderplus.com
      </p>
    </div>
    
    <div class="footer">
      <p><strong>Cofounder+</strong></p>
      <p>See you tomorrow! 🚀</p>
      <p style="margin-top: 16px;">
        <a href="mailto:support@cofounderplus.com" style="color: #2b7fff;">support@cofounderplus.com</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;

  const textContent = `
⏰ Your Call is Tomorrow!

Hi ${name},

This is a friendly reminder that your Founder Setup Call is scheduled for tomorrow!

📅 ${formattedDate} at ${time}

🎥 Microsoft Teams Link: ${zoomLink}

Pre-Call Checklist:
✓ Test your Microsoft Teams setup - Camera, microphone, and internet connection
✓ Download Cofounder+ - Have the app ready on your devices
✓ Prepare your laptop - We'll be working together live
✓ Find a quiet space - Minimize distractions for the full hour
✓ List your questions - What are your biggest business challenges?

💡 Pro Tip: Join 5 minutes early to ensure everything is working smoothly.

Can't make it? Email us immediately at support@cofounderplus.com

--
Cofounder+
See you tomorrow! 🚀
  `;

  return (await sendEmail({
    to: email,
    subject: '⏰ Reminder: Your Founder Call is Tomorrow',
    html: htmlContent,
    text: textContent,
  })).success;
}

/**
 * Send pre-checkout email (when user is about to pay)
 */
export async function sendPreCheckoutEmail(params: {
  name: string;
  email: string;
  date: string;
  time: string;
  bookingId: string;
}): Promise<boolean> {
  const { name, email, date, time, bookingId } = params;

  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #2b7fff 0%, #6c5ce7 100%);
      padding: 40px 20px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .content {
      padding: 40px 30px;
    }
    .booking-box {
      background: linear-gradient(135deg, rgba(43, 127, 255, 0.05) 0%, rgba(108, 92, 231, 0.05) 100%);
      border: 2px solid rgba(43, 127, 255, 0.2);
      border-radius: 12px;
      padding: 24px;
      margin: 24px 0;
    }
    .detail-row {
      display: flex;
      align-items: center;
      margin: 12px 0;
      font-size: 16px;
    }
    .detail-row strong {
      min-width: 100px;
      color: #2b7fff;
    }
    .highlight-box {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 16px;
      border-radius: 4px;
      margin: 20px 0;
    }
    .footer {
      background-color: #f9fafb;
      padding: 30px;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎯 Almost There!</h1>
    </div>
    
    <div class="content">
      <p style="font-size: 18px; margin-bottom: 8px;">Hi ${name},</p>
      
      <p>You're one step away from securing your Founder Setup Call. We're holding this slot for you:</p>
      
      <div class="booking-box">
        <h2 style="margin-top: 0; color: #1f2937; font-size: 20px;">📅 Your Reserved Slot</h2>
        <div class="detail-row">
          <strong>Date:</strong>
          <span>${formattedDate}</span>
        </div>
        <div class="detail-row">
          <strong>Time:</strong>
          <span>${time}</span>
        </div>
        <div class="detail-row">
          <strong>Duration:</strong>
          <span>60 minutes</span>
        </div>
        <div class="detail-row">
          <strong>Investment:</strong>
          <span>$99</span>
        </div>
      </div>

      <div class="highlight-box">
        <p style="margin: 0;"><strong>⚠️ Important:</strong> This time slot is temporarily reserved for you, but it won't be confirmed until payment is complete. Please complete checkout to secure your booking.</p>
      </div>

      <p style="margin-top: 24px;">If you didn't request this booking or have any questions, please contact us at <a href="mailto:support@cofounderplus.com" style="color: #2b7fff;">support@cofounderplus.com</a></p>
    </div>
    
    <div class="footer">
      <p><strong>Cofounder+</strong></p>
      <p>Your business tool for founders</p>
      <p style="margin-top: 16px;">
        Questions? <a href="mailto:support@cofounderplus.com" style="color: #2b7fff;">support@cofounderplus.com</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;

  const textContent = `
Almost There!

Hi ${name},

You're one step away from securing your Founder Setup Call.

Your Reserved Slot:
- Date: ${formattedDate}
- Time: ${time}
- Duration: 60 minutes
- Investment: $99

⚠️ Important: This time slot is temporarily reserved for you, but it won't be confirmed until payment is complete.

If you didn't request this booking or have questions, contact us at support@cofounderplus.com

--
Cofounder+
Your business tool for founders
  `;

  return (await sendEmail({
    to: email,
    subject: '🎯 Complete Your Founder Call Booking',
    html: htmlContent,
    text: textContent,
  })).success;
}

/**
 * Send payment cancelled email
 */
export async function sendPaymentCancelledEmail(params: {
  name: string;
  email: string;
  date: string;
  time: string;
  bookingId: string;
}): Promise<boolean> {
  const { name, email, date, time, bookingId } = params;

  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      padding: 40px 20px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .content {
      padding: 40px 30px;
    }
    .booking-box {
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(217, 119, 6, 0.05) 100%);
      border: 2px solid rgba(245, 158, 11, 0.2);
      border-radius: 12px;
      padding: 24px;
      margin: 24px 0;
    }
    .detail-row {
      display: flex;
      align-items: center;
      margin: 12px 0;
      font-size: 16px;
    }
    .detail-row strong {
      min-width: 100px;
      color: #f59e0b;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #2b7fff 0%, #1e5dd9 100%);
      color: #ffffff;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
    }
    .info-box {
      background-color: #dbeafe;
      border-left: 4px solid #2b7fff;
      padding: 16px;
      border-radius: 4px;
      margin: 20px 0;
    }
    .footer {
      background-color: #f9fafb;
      padding: 30px;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📋 Booking Not Completed</h1>
    </div>
    
    <div class="content">
      <p style="font-size: 18px; margin-bottom: 8px;">Hi ${name},</p>
      
      <p>We noticed you didn't complete the checkout for your Founder Setup Call. No worries—your time slot is still available if you'd like to book it:</p>
      
      <div class="booking-box">
        <h2 style="margin-top: 0; color: #1f2937; font-size: 20px;">📅 Available Slot</h2>
        <div class="detail-row">
          <strong>Date:</strong>
          <span>${formattedDate}</span>
        </div>
        <div class="detail-row">
          <strong>Time:</strong>
          <span>${time}</span>
        </div>
        <div class="detail-row">
          <strong>Duration:</strong>
          <span>60 minutes</span>
        </div>
        <div class="detail-row">
          <strong>Investment:</strong>
          <span>$99</span>
        </div>
      </div>

      <center>
        <a href="https://cofounderplus.com/founder-setup-call" class="button">Book Your Call Now</a>
      </center>

      <div class="info-box">
        <p style="margin: 0;"><strong>💡 Why book a Founder Setup Call?</strong></p>
        <p style="margin: 8px 0 0 0;">Get personalized guidance, set up your business systems, and create an actionable roadmap in just 60 minutes with a founder who's been there.</p>
      </div>

      <p style="margin-top: 24px;">Have questions? We're here to help at <a href="mailto:support@cofounderplus.com" style="color: #2b7fff;">support@cofounderplus.com</a></p>
    </div>
    
    <div class="footer">
      <p><strong>Cofounder+</strong></p>
      <p>Your business tool for founders</p>
      <p style="margin-top: 16px;">
        <a href="mailto:support@cofounderplus.com" style="color: #2b7fff;">support@cofounderplus.com</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;

  const textContent = `
Booking Not Completed

Hi ${name},

We noticed you didn't complete the checkout for your Founder Setup Call. No worries—your time slot is still available if you'd like to book it:

Available Slot:
- Date: ${formattedDate}
- Time: ${time}
- Duration: 60 minutes
- Investment: $99

💡 Why book a Founder Setup Call?
Get personalized guidance, set up your business systems, and create an actionable roadmap in just 60 minutes with a founder who's been there.

Book now: https://cofounderplus.com/founder-setup-call

Have questions? We're here to help at support@cofounderplus.com

--
Cofounder+
Your business tool for founders
  `;

  return (await sendEmail({
    to: email,
    subject: '📋 Your Founder Call Slot Is Still Available',
    html: htmlContent,
    text: textContent,
  })).success;
}

/**
 * Send notification to admin about new booking
 */
export async function sendNewBookingNotification(params: {
  name: string;
  email: string;
  date: string;
  time: string;
  bookingType: string;
  bookingId: string;
}): Promise<boolean> {
  const { name, email, date, time, bookingType, bookingId } = params;
  
  const subject = `🚀 New Booking: ${name} (${bookingType})`;
  
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2563eb; color: white; padding: 15px; border-radius: 8px 8px 0 0; }
    .content { border: 1px solid #e5e7eb; border-top: none; padding: 20px; border-radius: 0 0 8px 8px; }
    .field { margin-bottom: 10px; }
    .label { font-weight: bold; color: #6b7280; }
    .button { display: inline-block; background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin:0">🚀 New Booking Received!</h2>
    </div>
    <div class="content">
      <div class="field">
        <div class="label">Customer Name</div>
        <div>${name}</div>
      </div>
      <div class="field">
        <div class="label">Email Address</div>
        <div>${email}</div>
      </div>
      <div class="field">
        <div class="label">Booking Type</div>
        <div>${bookingType}</div>
      </div>
      <div class="field">
        <div class="label">Date & Time</div>
        <div>${date} at ${time}</div>
      </div>
      <div class="field">
        <div class="label">Booking ID</div>
        <div style="font-family: monospace; font-size: 12px;">${bookingId}</div>
      </div>
      
      <a href="https://cofounderplus.com/admin" class="button">View in Admin Portal</a>
    </div>
  </div>
</body>
</html>
  `;

  return (await sendEmail({
    to: 'tylerg@cofounderplus.com',
    subject: subject,
    html: htmlContent,
  })).success;
}

/**
 * Send test email for debugging
 */
export async function sendTestEmail(params: {
  to: string;
  testType?: 'simple' | 'confirmation' | 'cancelled' | 'reminder';
}): Promise<boolean> {
  const { to, testType = 'simple' } = params;

  // Simple test email
  if (testType === 'simple') {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      padding: 40px 20px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .content {
      padding: 40px 30px;
    }
    .test-box {
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%);
      border: 2px solid #10b981;
      border-radius: 12px;
      padding: 24px;
      margin: 24px 0;
    }
    .footer {
      background-color: #f9fafb;
      padding: 30px;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Test Email Successful!</h1>
    </div>
    
    <div class="content">
      <p style="font-size: 18px;">Hi there,</p>
      
      <p>This is a test email from Cofounder+ to verify that email delivery is working correctly.</p>
      
      <div class="test-box">
        <h2 style="margin-top: 0; color: #1f2937; font-size: 20px;">✓ Email System Status</h2>
        <p style="margin: 8px 0;"><strong>Status:</strong> ✅ Working</p>
        <p style="margin: 8px 0;"><strong>Provider:</strong> SendGrid</p>
        <p style="margin: 8px 0;"><strong>Sent:</strong> ${new Date().toLocaleString()}</p>
        <p style="margin: 8px 0;"><strong>To:</strong> ${to}</p>
      </div>

      <p>If you received this email, your email delivery system is configured correctly!</p>
    </div>
    
    <div class="footer">
      <p><strong>Cofounder+</strong></p>
      <p>Email Delivery Test</p>
      <p style="margin-top: 16px;">
        <a href="mailto:support@cofounderplus.com" style="color: #2b7fff;">support@cofounderplus.com</a>
      </p>
    </div>
  </div>
</body>
</html>
    `;

    const textContent = `
✅ Test Email Successful!

Hi there,

This is a test email from Cofounder+ to verify that email delivery is working correctly.

Email System Status:
- Status: ✅ Working
- Provider: SendGrid
- Sent: ${new Date().toLocaleString()}
- To: ${to}

If you received this email, your email delivery system is configured correctly!

--
Cofounder+
Email Delivery Test
support@cofounderplus.com
    `;

    return (await sendEmail({
      to: to,
      subject: '✅ Test Email from Cofounder+',
      html: htmlContent,
      text: textContent,
    })).success;
  }

  // Use real email templates for other test types
  if (testType === 'confirmation') {
    return await sendBookingConfirmation({
      name: 'Test User',
      email: to,
      date: '2025-12-31',
      time: '2:00 PM',
      bookingId: 'test_booking_123',
      zoomLink: 'https://zoom.us/j/test123456',
    });
  }

  if (testType === 'cancelled') {
    return await sendPaymentCancelledEmail({
      name: 'Test User',
      email: to,
      date: '2025-12-31',
      time: '2:00 PM',
      bookingId: 'test_booking_123',
    });
  }

  if (testType === 'reminder') {
    return await sendCallReminder({
      name: 'Test User',
      email: to,
      date: '2025-12-31',
      time: '2:00 PM',
      zoomLink: 'https://zoom.us/j/test123456',
    });
  }

  return false;
}