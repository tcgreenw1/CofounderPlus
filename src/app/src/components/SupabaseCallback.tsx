/**
 * Supabase OAuth Callback Handler
 * 
 * Handles the OAuth redirect from Supabase
 * Route: /cofounder-make/supabase
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Database, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

export default function SupabaseCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing Supabase connection...');

  useEffect(() => {
    const processCallback = async () => {
      try {
        // For now, since we're using manual setup, just redirect back
        // In the future, this could handle actual OAuth flow
        setStatus('success');
        setMessage('Please use the Supabase connection dialog in Cofounder Make to connect your project.');
        
        setTimeout(() => {
          navigate('/cofounder-make');
        }, 2000);
      } catch (error: any) {
        console.error('Error processing Supabase callback:', error);
        setStatus('error');
        setMessage(error.message || 'Failed to process Supabase connection');
      }
    };

    processCallback();
  }, [navigate]);

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ 
        background: 'var(--background)',
      }}
    >
      <Card 
        className="w-full max-w-md"
        style={{
          borderColor: 'var(--border)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <CardHeader className="text-center">
          <div 
            className="mx-auto mb-4 size-12 rounded-full flex items-center justify-center"
            style={{
              background: status === 'error' 
                ? 'var(--destructive-alpha-10)'
                : status === 'success'
                ? 'var(--success-alpha-10)'
                : 'var(--primary-alpha-10)',
            }}
          >
            {status === 'loading' && (
              <Loader2 className="size-6 animate-spin" style={{ color: 'var(--primary)' }} />
            )}
            {status === 'success' && (
              <CheckCircle2 className="size-6" style={{ color: 'var(--success)' }} />
            )}
            {status === 'error' && (
              <AlertCircle className="size-6" style={{ color: 'var(--destructive)' }} />
            )}
          </div>
          <CardTitle>
            {status === 'loading' && 'Processing...'}
            {status === 'success' && 'Supabase Connection'}
            {status === 'error' && 'Connection Failed'}
          </CardTitle>
          {status === 'loading' && (
            <CardDescription>
              Setting up your Supabase integration...
            </CardDescription>
          )}
          {status === 'success' && (
            <CardDescription>
              Redirecting you back to Cofounder Make...
            </CardDescription>
          )}
          {status === 'error' && (
            <CardDescription style={{ color: 'var(--destructive)' }}>
              {message}
            </CardDescription>
          )}
        </CardHeader>

        {(status === 'success' || status === 'error') && (
          <CardContent>
            <Button
              onClick={() => navigate('/cofounder-make')}
              className="w-full"
              variant={status === 'error' ? 'outline' : 'default'}
              style={
                status === 'success' 
                  ? { 
                      background: 'var(--primary)',
                      color: 'var(--primary-foreground)',
                    }
                  : undefined
              }
            >
              {status === 'success' ? 'Go to Cofounder Make' : 'Return to Cofounder Make'}
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
