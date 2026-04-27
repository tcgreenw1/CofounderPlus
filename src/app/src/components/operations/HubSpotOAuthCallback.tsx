import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { supabase } from '../../utils/supabase/client';
import { projectId } from '../../utils/supabase/info';

export default function HubSpotOAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Connecting to HubSpot...');

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      const code = searchParams.get('code');
      const state = searchParams.get('state'); // userId
      const error = searchParams.get('error');

      if (error) {
        setStatus('error');
        setMessage(`Authorization failed: ${error}`);
        
        // Notify parent window if in popup
        if (window.opener) {
          window.opener.postMessage({ type: 'hubspot-oauth-error', error }, '*');
        }
        
        setTimeout(() => {
          if (window.opener) {
            window.close();
          } else {
            navigate('/operations/sales');
          }
        }, 3000);
        return;
      }

      if (!code || !state) {
        setStatus('error');
        setMessage('Missing authorization parameters');
        return;
      }

      // Exchange code for tokens via our backend
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        setStatus('error');
        setMessage('Please sign in first');
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/hubspot/callback?code=${code}&state=${state}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setStatus('success');
        setMessage('HubSpot connected successfully!');
        
        // Notify parent window if in popup
        if (window.opener) {
          window.opener.postMessage({ type: 'hubspot-oauth-success', hubId: data.hubId }, '*');
        }
        
        setTimeout(() => {
          if (window.opener) {
            window.close();
          } else {
            navigate('/operations/sales');
          }
        }, 2000);
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to connect HubSpot');
      }

    } catch (error: any) {
      console.error('Callback error:', error);
      setStatus('error');
      setMessage('An error occurred while connecting to HubSpot');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {status === 'processing' && (
              <RefreshCw className="w-12 h-12 text-[#FF7A59] animate-spin" />
            )}
            {status === 'success' && (
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            )}
            {status === 'error' && (
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            )}
          </div>
          <CardTitle>
            {status === 'processing' && 'Connecting HubSpot...'}
            {status === 'success' && 'Success!'}
            {status === 'error' && 'Connection Failed'}
          </CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent className="text-center text-sm text-gray-500">
          {status === 'processing' && 'Please wait while we complete the connection...'}
          {status === 'success' && 'Redirecting you back...'}
          {status === 'error' && 'You can close this window and try again.'}
        </CardContent>
      </Card>
    </div>
  );
}
