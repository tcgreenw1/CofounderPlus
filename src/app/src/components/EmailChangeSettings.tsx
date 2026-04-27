import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Mail, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { supabase } from '../utils/supabase/client';

interface EmailChangeSettingsProps {
  user: any;
}

export function EmailChangeSettings({ user }: EmailChangeSettingsProps) {
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleEmailChange = async () => {
    if (!newEmail || newEmail === user?.email) {
      toast.error('Please enter a different email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);
    
    try {
      console.log('📧 Changing email from', user?.email, 'to', newEmail);
      
      // First, verify we have an active session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData?.session) {
        console.error('❌ No active session:', sessionError);
        toast.error('Session expired. Please log in again.');
        setLoading(false);
        return;
      }
      
      console.log('✅ Active session found, proceeding with email change');
      
      // Supabase will automatically send verification emails to BOTH old and new email addresses
      // The user needs to confirm BOTH emails for the change to take effect
      const { data, error } = await supabase.auth.updateUser({
        email: newEmail
      });

      if (error) {
        console.error('❌ Email change error:', error);
        throw error;
      }

      console.log('✅ Email change initiated:', data);
      
      // Show success message
      setShowConfirmation(true);
      setNewEmail('');
      
      toast.success('Verification emails sent!', {
        description: 'Check both your current and new email addresses',
        duration: 6000
      });
      
    } catch (error: any) {
      console.error('❌ Email change exception:', error);
      
      let errorMessage = error.message || 'Failed to change email';
      
      // Handle specific Supabase errors
      if (errorMessage.toLowerCase().includes('session') || errorMessage.toLowerCase().includes('auth')) {
        errorMessage = 'Your session has expired. Please refresh the page and log in again.';
      } else if (errorMessage.includes('Email rate limit exceeded')) {
        errorMessage = 'Too many requests. Please wait a few minutes before trying again.';
      } else if (errorMessage.includes('already registered')) {
        errorMessage = 'This email is already registered. Please use a different email.';
      } else if (errorMessage.includes('same email')) {
        errorMessage = 'The new email must be different from your current email.';
      }
      
      toast.error(errorMessage, {
        description: 'If this issue persists, try logging out and back in.',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" style={{ color: 'var(--color-primary)' }} />
          Change Email Address
        </CardTitle>
        <CardDescription>
          Update your email address for account authentication
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Email */}
        <div className="space-y-2">
          <Label>Current Email</Label>
          <Input
            value={user?.email || ''}
            disabled
            className="bg-muted"
          />
        </div>

        {/* New Email Input */}
        <div className="space-y-2">
          <Label htmlFor="new-email">New Email Address</Label>
          <Input
            id="new-email"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="Enter your new email"
            disabled={loading}
          />
        </div>

        {/* Info Alert */}
        <Alert 
          style={{
            borderColor: 'var(--color-primary)',
            backgroundColor: 'var(--color-primary-soft)',
          }}
        >
          <Info className="h-4 w-4" style={{ color: 'var(--color-primary)' }} />
          <AlertDescription>
            <strong>How it works:</strong> We'll send verification emails to both your current and new email addresses. You must confirm both to complete the email change.
          </AlertDescription>
        </Alert>

        {/* Confirmation Message */}
        {showConfirmation && (
          <Alert 
            style={{
              borderColor: 'var(--color-success)',
              backgroundColor: 'var(--color-success-soft)',
            }}
          >
            <CheckCircle className="h-4 w-4" style={{ color: 'var(--color-success)' }} />
            <AlertDescription>
              <strong>Verification emails sent!</strong>
              <ul className="mt-2 space-y-1">
                <li>• Check <strong>{user?.email}</strong> and confirm the email change</li>
                <li>• Check your new email and verify your new address</li>
                <li>• Both confirmations are required for the change to take effect</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Change Email Button */}
        <Button
          onClick={handleEmailChange}
          disabled={loading || !newEmail}
          className="w-full"
        >
          {loading ? 'Sending Verification Emails...' : 'Change Email Address'}
        </Button>

        {/* Additional Info */}
        <div className="space-y-1 pt-2" style={{ fontSize: '0.75rem', color: 'var(--color-muted-foreground)' }}>
          <p>⚠️ You'll be logged out after confirming the email change</p>
          <p>⚠️ Make sure you have access to both email accounts</p>
          <p>⚠️ Verification links expire after 24 hours</p>
        </div>
      </CardContent>
    </Card>
  );
}
