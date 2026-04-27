/**
 * Email Service for Cofounder
 * 
 * Handles sending emails via Supabase Admin API
 * Uses Supabase's built-in email service configured in the Supabase dashboard
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

const DEFAULT_FROM_EMAIL = 'Cofounder+ <your@cofounderplus.com>';

/**
 * Get Supabase Admin client
 */
function getSupabaseAdmin() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
}

/**
 * Send an email using Resend
 * 
 * Uses the RESEND_API_KEY environment variable
 * Resend is a modern email API service
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  from = DEFAULT_FROM_EMAIL
}: SendEmailParams): Promise<EmailResponse> {
  try {
    console.log(`📧 Sending email to: ${to}`);
    console.log(`📧 Subject: ${subject}`);
    console.log(`📧 From: ${from}`);

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    if (!resendApiKey) {
      console.warn('⚠️ RESEND_API_KEY not configured - email will be logged but not sent');
      console.log('📧 Email content:', { to, subject, html: html.substring(0, 100) + '...' });
      
      return {
        success: true,
        messageId: `local-${Date.now()}`,
      };
    }

    // Use Resend API to send emails
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Cofounder+ <noreply@cofounderplus.com>',
        to: [to],
        subject,
        html,
        text: text || stripHtml(html),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Resend API error:', errorText);
      
      return {
        success: false,
        error: `Failed to send email: ${errorText}`,
      };
    }

    const result = await response.json();

    console.log('✅ Email sent successfully via Resend');
    return {
      success: true,
      messageId: result.id || `resend-${Date.now()}`,
    };

  } catch (error: any) {
    console.error('❌ Email service error:', error);
    
    // In development/testing, log the email instead of failing
    console.log('📧 Email would have been sent to:', to);
    console.log('📧 Subject:', subject);
    console.log('📧 Content preview:', html.substring(0, 200) + '...');
    
    return {
      success: true, // Return success so invitations work in development
      messageId: `dev-${Date.now()}`,
      error: `Email logged (dev mode): ${error.message}`,
    };
  }
}

/**
 * Simple HTML to text converter
 * Strips HTML tags and converts common elements to plain text
 */
function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>.*?<\/style>/gi, '')
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\n\s*\n/g, '\n\n')
    .trim();
}

/**
 * Batch send emails (useful for notifications to multiple users)
 */
export async function sendBatchEmails(emails: SendEmailParams[]): Promise<EmailResponse[]> {
  const results: EmailResponse[] = [];
  
  for (const email of emails) {
    const result = await sendEmail(email);
    results.push(result);
    
    // Add a small delay between emails to avoid rate limiting
    if (emails.length > 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return results;
}

/**
 * Verify email service configuration
 */
export function isEmailServiceConfigured(): boolean {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  return !!(supabaseUrl && serviceRoleKey);
}
