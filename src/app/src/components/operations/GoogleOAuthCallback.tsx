import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { supabase } from '../../utils/supabase/client';
import { projectId } from '../../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

/**
 * Google OAuth Callback Handler
 * Handles the OAuth redirect from Google after user authorizes
 */
export function GoogleOAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      // Get the authorization code from URL
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      const state = searchParams.get('state'); // userId passed as state

      // Check for errors from Google
      if (error) {
        setStatus('error');
        setErrorMessage(`Google authorization error: ${error}`);
        toast.error(`Authorization failed: ${error}`);
        return;
      }

      if (!code) {
        setStatus('error');
        setErrorMessage('No authorization code received from Google');
        toast.error('Authorization failed: No code received');
        return;
      }

      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setStatus('error');
        setErrorMessage('No active session. Please sign in again.');
        toast.error('Please sign in to continue');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      // Exchange code for tokens via backend
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/google/callback`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            code,
            userId: session.user.id
          })
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setStatus('error');
        setErrorMessage(data.error || 'Failed to complete Google authorization');
        toast.error(data.error || 'Authorization failed');
        return;
      }

      // Success!
      setStatus('success');
      toast.success('Successfully connected to Google Workspace!');

      // Redirect back to sales page after short delay
      setTimeout(() => {
        navigate('/operations/sales');
      }, 2000);

    } catch (error: any) {
      console.error('OAuth callback error:', error);
      setStatus('error');
      setErrorMessage(error.message || 'An unexpected error occurred');
      toast.error('Failed to complete authorization');
    }
  };

  return (
    <div 
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: 'var(--spacing-4)',
        background: 'var(--background)',
      }}
    >
      <Card 
        style={{
          width: '100%',
          maxWidth: '500px',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border)',
        }}
      >
        <CardHeader 
          style={{
            padding: 'var(--spacing-6)',
            textAlign: 'center',
          }}
        >
          <div 
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: 'var(--spacing-4)',
            }}
          >
            {status === 'loading' && (
              <div
                style={{
                  padding: 'var(--spacing-4)',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--muted)',
                }}
              >
                <Loader2 
                  className="w-8 h-8 animate-spin" 
                  style={{ color: 'var(--primary)' }} 
                />
              </div>
            )}
            {status === 'success' && (
              <div
                style={{
                  padding: 'var(--spacing-4)',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(34, 197, 94, 0.1)',
                }}
              >
                <CheckCircle2 
                  className="w-8 h-8" 
                  style={{ color: '#22c55e' }} 
                />
              </div>
            )}
            {status === 'error' && (
              <div
                style={{
                  padding: 'var(--spacing-4)',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(239, 68, 68, 0.1)',
                }}
              >
                <XCircle 
                  className="w-8 h-8" 
                  style={{ color: '#ef4444' }} 
                />
              </div>
            )}
          </div>

          <CardTitle style={{ fontSize: '1.5rem', marginBottom: 'var(--spacing-2)' }}>
            {status === 'loading' && 'Connecting to Google...'}
            {status === 'success' && 'Successfully Connected!'}
            {status === 'error' && 'Connection Failed'}
          </CardTitle>
        </CardHeader>

        <CardContent 
          style={{
            padding: 'var(--spacing-6)',
            paddingTop: '0',
            textAlign: 'center',
          }}
        >
          {status === 'loading' && (
            <p style={{ color: 'var(--muted-foreground)' }}>
              Please wait while we complete the authorization process...
            </p>
          )}

          {status === 'success' && (
            <>
              <p style={{ color: 'var(--muted-foreground)', marginBottom: 'var(--spacing-4)' }}>
                Your Google Workspace account has been successfully connected.
                Redirecting you back to Cofounder Sales...
              </p>
              <div 
                style={{
                  padding: 'var(--spacing-2)',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--muted)',
                  fontSize: '0.875rem',
                }}
              >
                You now have access to Gmail, Calendar, Drive, Contacts, and more!
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <p style={{ color: 'var(--muted-foreground)', marginBottom: 'var(--spacing-4)' }}>
                {errorMessage}
              </p>
              <Button
                onClick={() => navigate('/operations/sales')}
                style={{
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--primary)',
                  color: 'var(--primary-foreground)',
                }}
              >
                Back to Sales
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default GoogleOAuthCallback;