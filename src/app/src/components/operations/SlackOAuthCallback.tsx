import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../utils/supabase/client';
import { projectId } from '../../utils/supabase/info';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '../ui/button';

const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09`;

export default function SlackOAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Connecting to Slack...');

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        setStatus('error');
        setMessage(`Slack authorization failed: ${error}`);
        return;
      }

      if (!code) {
        setStatus('error');
        setMessage('No authorization code received from Slack');
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        setStatus('error');
        setMessage('User not authenticated');
        return;
      }

      // Exchange code for access token
      const response = await fetch(`${serverUrl}/slack/auth/callback`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to connect to Slack');
      }

      const data = await response.json();
      
      setStatus('success');
      setMessage('Successfully connected to Slack!');

      // Redirect to Slack page after 2 seconds
      setTimeout(() => {
        navigate('/operations/hr/slack');
      }, 2000);

    } catch (error: any) {
      console.error('Error handling Slack callback:', error);
      setStatus('error');
      setMessage(error.message || 'Failed to connect to Slack');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/80 backdrop-blur-sm rounded-lg shadow-lg p-8 text-center border border-purple-200">
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 animate-spin text-purple-600 mx-auto mb-4" />
            <h2 className="text-black mb-2">Connecting to Slack</h2>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-black mb-2">Success!</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <p className="text-sm text-gray-500">Redirecting to Slack page...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-black mb-2">Connection Failed</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <Button
              onClick={() => navigate('/operations/hr/slack')}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Return to Slack Page
            </Button>
          </>
        )}
      </div>
    </div>
  );
}