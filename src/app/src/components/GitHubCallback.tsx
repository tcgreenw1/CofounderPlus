import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Github, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export default function GitHubCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [errorDetails, setErrorDetails] = useState('');

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      const code = searchParams.get('code');
      const state = searchParams.get('state'); // userId
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      if (error) {
        setStatus('error');
        setMessage('GitHub Authorization Failed');
        setErrorDetails(errorDescription || error);
        toast.error(`GitHub authorization failed: ${errorDescription || error}`);
        return;
      }

      if (!code || !state) {
        setStatus('error');
        setMessage('Invalid Callback Parameters');
        setErrorDetails('Missing authorization code or state parameter');
        toast.error('Invalid callback parameters');
        return;
      }

      // Call backend to exchange code for access token
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/github/callback?code=${code}&state=${state}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );

      const data = await response.json();

      if (data.success) {
        setStatus('success');
        setMessage('GitHub Connected Successfully!');
        toast.success('GitHub account connected successfully!');
        
        // Redirect back to Cofounder Make after a short delay
        setTimeout(() => {
          navigate('/cofounder-make');
        }, 2000);
      } else {
        setStatus('error');
        setMessage('Connection Failed');
        setErrorDetails(data.error || 'Failed to connect GitHub account');
        toast.error(data.error || 'Failed to connect GitHub account');
      }
    } catch (error: any) {
      console.error('Callback error:', error);
      setStatus('error');
      setMessage('Connection Error');
      setErrorDetails(error.message || 'An unexpected error occurred');
      toast.error(error.message || 'Failed to process GitHub callback');
    }
  };

  const goBack = () => {
    navigate('/cofounder-make');
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--background)' }}
    >
      <Card 
        className="w-full max-w-md"
        style={{ 
          background: 'var(--card)',
          borderColor: 'var(--border)'
        }}
      >
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {status === 'loading' && (
              <div 
                className="size-16 rounded-full flex items-center justify-center"
                style={{ background: 'var(--primary-soft)' }}
              >
                <Loader2 
                  className="size-8 animate-spin" 
                  style={{ color: 'var(--primary)' }}
                />
              </div>
            )}
            {status === 'success' && (
              <div 
                className="size-16 rounded-full flex items-center justify-center"
                style={{ background: 'var(--success-soft)' }}
              >
                <CheckCircle2 
                  className="size-8" 
                  style={{ color: 'var(--success)' }}
                />
              </div>
            )}
            {status === 'error' && (
              <div 
                className="size-16 rounded-full flex items-center justify-center"
                style={{ 
                  background: 'var(--destructive)',
                  opacity: 0.1
                }}
              >
                <AlertCircle 
                  className="size-8" 
                  style={{ color: 'var(--destructive)' }}
                />
              </div>
            )}
          </div>

          <CardTitle className="flex items-center justify-center gap-2">
            <Github className="size-5" />
            {status === 'loading' && 'Connecting to GitHub...'}
            {status === 'success' && message}
            {status === 'error' && message}
          </CardTitle>

          {status === 'loading' && (
            <CardDescription>
              Processing your GitHub authorization...
            </CardDescription>
          )}
          {status === 'success' && (
            <CardDescription>
              Redirecting you back to Cofounder Make...
            </CardDescription>
          )}
          {status === 'error' && (
            <CardDescription style={{ color: 'var(--destructive)' }}>
              {errorDetails}
            </CardDescription>
          )}
        </CardHeader>

        {(status === 'success' || status === 'error') && (
          <CardContent>
            <Button
              onClick={goBack}
              className="w-full"
              variant={status === 'error' ? 'outline' : 'default'}
            >
              {status === 'success' ? 'Go to Cofounder Make' : 'Return to Cofounder Make'}
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
