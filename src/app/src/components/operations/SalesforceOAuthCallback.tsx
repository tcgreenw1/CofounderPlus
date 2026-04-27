import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../utils/supabase/client';
import { projectId } from '../../utils/supabase/info';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

interface SalesforceOAuthCallbackProps {
  user: any;
}

export default function SalesforceOAuthCallback({ user }: SalesforceOAuthCallbackProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing Salesforce authorization...');

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      // Get the authorization code from URL
      const params = new URLSearchParams(location.search);
      const code = params.get('code');
      const error = params.get('error');
      const errorDescription = params.get('error_description');

      console.log('🔍 Salesforce Callback Debug:');
      console.log('   Code:', code ? 'present' : 'missing');
      console.log('   Error:', error);
      console.log('   Error Description:', errorDescription);
      console.log('   Full URL:', window.location.href);

      if (error) {
        console.error('❌ Salesforce OAuth error:', error, errorDescription);
        setStatus('error');
        setMessage(errorDescription || error);
        
        // Send error message to parent window
        if (window.opener) {
          window.opener.postMessage({ 
            type: 'salesforce-oauth-error',
            error: errorDescription || error
          }, '*');
        }
        
        setTimeout(() => {
          window.close();
        }, 3000);
        return;
      }

      if (!code) {
        console.error('❌ No authorization code found in callback URL');
        setStatus('error');
        setMessage('No authorization code received from Salesforce');
        
        if (window.opener) {
          window.opener.postMessage({ 
            type: 'salesforce-oauth-error',
            error: 'No authorization code'
          }, '*');
        }
        
        setTimeout(() => {
          window.close();
        }, 3000);
        return;
      }

      // Get user session
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken || !user?.id) {
        console.error('❌ No access token or user ID');
        setStatus('error');
        setMessage('Authentication required');
        
        if (window.opener) {
          window.opener.postMessage({ 
            type: 'salesforce-oauth-error',
            error: 'Authentication required'
          }, '*');
        }
        
        setTimeout(() => {
          window.close();
        }, 3000);
        return;
      }

      console.log('✅ Exchanging code for Salesforce tokens...');
      
      // Exchange code for tokens
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/salesforce/callback`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            code,
            userId: user.id
          })
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        console.log('✅ Salesforce connected successfully!');
        setStatus('success');
        setMessage('Salesforce connected successfully!');
        
        // Send success message to parent window
        if (window.opener) {
          window.opener.postMessage({ 
            type: 'salesforce-oauth-success',
            instanceUrl: data.instanceUrl
          }, '*');
          
          // Close popup after short delay
          setTimeout(() => {
            window.close();
          }, 1500);
        } else {
          // If not in popup, redirect to Salesforce page
          setTimeout(() => {
            navigate('/operations/sales/salesforce');
          }, 1500);
        }
      } else {
        console.error('❌ Salesforce callback error:', data.error);
        setStatus('error');
        setMessage(data.error || 'Failed to connect Salesforce');
        
        if (window.opener) {
          window.opener.postMessage({ 
            type: 'salesforce-oauth-error',
            error: data.error
          }, '*');
        }
        
        setTimeout(() => {
          if (window.opener) {
            window.close();
          } else {
            navigate('/operations/sales/salesforce');
          }
        }, 3000);
      }
    } catch (error: any) {
      console.error('❌ Callback error:', error);
      setStatus('error');
      setMessage('An unexpected error occurred');
      
      if (window.opener) {
        window.opener.postMessage({ 
          type: 'salesforce-oauth-error',
          error: error.message
        }, '*');
      }
      
      setTimeout(() => {
        if (window.opener) {
          window.close();
        } else {
          navigate('/operations/sales/salesforce');
        }
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-auto p-8">
        {status === 'processing' && (
          <>
            <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-500" />
            <h2 className="text-xl font-semibold mb-2">Connecting Salesforce...</h2>
            <p className="text-gray-600">{message}</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
            <h2 className="text-xl font-semibold mb-2 text-green-700">Success!</h2>
            <p className="text-gray-600">{message}</p>
            <p className="text-sm text-gray-500 mt-2">This window will close automatically...</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold mb-2 text-red-700">Error</h2>
            <p className="text-gray-600">{message}</p>
            <p className="text-sm text-gray-500 mt-2">This window will close automatically...</p>
          </>
        )}
      </div>
    </div>
  );
}
