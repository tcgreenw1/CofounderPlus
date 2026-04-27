import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Loader2, Building2, CheckCircle2, AlertCircle, RefreshCw, Unlink } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';
import { getStripePublishableKey } from '../utils/stripe/config';

// We'll load Stripe.js from CDN dynamically
declare global {
  interface Window {
    Stripe?: any;
  }
}

interface StripeBankConnectProps {
  user: any;
  businessId: string;
  onTransactionsImported?: () => void;
}

interface ConnectedAccount {
  id: string;
  account_id: string;
  institution_name: string;
  account_name?: string;
  account_mask?: string;
  account_type?: string;
  status: 'active' | 'disconnected' | 'error';
  last_synced?: string;
  created_at: string;
}

export function StripeBankConnect({ user, businessId, onTransactionsImported }: StripeBankConnectProps) {
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [stripeLoaded, setStripeLoaded] = useState(false);

  // Load Stripe.js script
  useEffect(() => {
    // Check if Stripe.js is already loaded
    if (window.Stripe) {
      setStripeLoaded(true);
      return;
    }

    // Check if script is already in the DOM
    const existingScript = document.querySelector('script[src="https://js.stripe.com/v3/"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => setStripeLoaded(true));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/';
    script.async = true;
    script.onload = () => setStripeLoaded(true);
    document.head.appendChild(script);
    
    // Don't remove the script on cleanup - keep it for the whole session
  }, []);

  // Load connected accounts
  useEffect(() => {
    loadConnectedAccounts();
  }, [businessId]);

  const loadConnectedAccounts = async () => {
    try {
      setLoadingAccounts(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/stripe-bank/connected-accounts/${businessId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setConnectedAccounts(data.accounts || []);
      }
    } catch (error) {
      console.error('Error loading connected accounts:', error);
    } finally {
      setLoadingAccounts(false);
    }
  };

  const handleConnectBank = async () => {
    try {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Please sign in to connect your bank');
        setLoading(false);
        return;
      }

      // Verify backend Stripe configuration first
      const configResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/stripe-bank/verify-config`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          }
        }
      );
      
      if (configResponse.ok) {
        const configData = await configResponse.json();
        console.log('🏦 Backend Stripe configuration:', configData);
        
        if (!configData.configured) {
          toast.error('Stripe is not configured on the server');
          setLoading(false);
          return;
        }
      }

      // Check if Stripe.js is loaded
      if (!window.Stripe || !stripeLoaded) {
        toast.error('Stripe is still loading, please try again in a moment');
        setLoading(false);
        return;
      }

      const publishableKey = getStripePublishableKey();
      const accountIdFromPubKey = publishableKey.split('_')[2]; // Extract account ID
      console.log('🏦 Using publishable key for account:', accountIdFromPubKey?.substring(0, 12) + '...');
      console.log('🏦 Full publishable key prefix:', publishableKey.substring(0, 20) + '...');
      
      const stripe = window.Stripe(publishableKey);
      if (!stripe) {
        throw new Error('Failed to initialize Stripe');
      }

      // Create Financial Connections session
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/stripe-bank/create-session`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            businessId,
            successUrl: `${window.location.origin}/operations/finance?bank_connected=true`,
            cancelUrl: `${window.location.origin}/operations/finance`
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('🏦 Backend session creation failed:', errorData);
        
        if (errorData.hint) {
          console.error('🏦 Hint:', errorData.hint);
        }
        
        throw new Error(errorData.error || 'Failed to create bank connection session');
      }

      const data = await response.json();

      console.log('🏦 Server response:', data);

      if (!data.clientSecret) {
        console.error('🏦 No clientSecret in response:', data);
        throw new Error('No client secret received from server');
      }

      console.log('🏦 Starting Stripe Financial Connections flow with client_secret:', data.clientSecret.substring(0, 30) + '...');
      
      // Use Stripe.js to collect bank account
      const { financialConnectionsSession, error } = await stripe.collectFinancialConnectionsAccounts({
        clientSecret: data.clientSecret,
      });

      if (error) {
        console.error('🏦 Stripe Financial Connections error:', error);
        throw new Error(error.message || 'Failed to connect bank account');
      }

      if (financialConnectionsSession) {
        console.log('🏦 Bank connected successfully:', financialConnectionsSession);
        toast.success('Bank account connected successfully!');
        
        // Store the connected account info
        if (financialConnectionsSession.accounts && financialConnectionsSession.accounts.length > 0) {
          for (const account of financialConnectionsSession.accounts) {
            const connectionData = {
              id: `conn_${Date.now()}`,
              business_id: businessId,
              account_id: account.id,
              institution_name: account.institution_name,
              account_name: account.display_name,
              account_mask: account.last4,
              account_type: account.subcategory,
              status: 'active',
              created_at: new Date().toISOString()
            };
            
            // Save to KV store via backend
            await fetch(
              `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/stripe-bank/save-connection`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${session.access_token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(connectionData)
              }
            );
          }
        }
        
        // Reload connected accounts
        await loadConnectedAccounts();
      }

    } catch (error: any) {
      console.error('🏦 Error connecting bank:', error);
      toast.error(error.message || 'Failed to connect bank account');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncTransactions = async (accountId: string) => {
    try {
      setSyncing(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Please sign in to sync transactions');
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/stripe-bank/sync-transactions`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            businessId,
            accountId
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to sync transactions');
      }

      const data = await response.json();

      toast.success(`Successfully imported ${data.transactionsImported || 0} transactions`);
      
      // Reload accounts to update last_synced
      await loadConnectedAccounts();
      
      // Notify parent component to refresh transactions
      if (onTransactionsImported) {
        onTransactionsImported();
      }

    } catch (error: any) {
      console.error('🔄 Error syncing transactions:', error);
      toast.error(error.message || 'Failed to sync transactions');
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnectAccount = async (accountId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/stripe-bank/disconnect/${accountId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          }
        }
      );

      if (response.ok) {
        toast.success('Bank account disconnected');
        await loadConnectedAccounts();
      } else {
        throw new Error('Failed to disconnect account');
      }
    } catch (error: any) {
      console.error('Error disconnecting account:', error);
      toast.error(error.message || 'Failed to disconnect account');
    }
  };

  // Check for successful connection on page load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('bank_connected') === 'true') {
      toast.success('Bank account connected successfully!');
      loadConnectedAccounts();
      
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  if (loadingAccounts) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading bank connections...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Connect Bank Button */}
      {connectedAccounts.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Connect Your Bank
            </CardTitle>
            <CardDescription>
              Automatically import transactions from your bank account using Stripe's secure connection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleConnectBank} 
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Building2 className="w-4 h-4 mr-2" />
                  Connect Bank Account
                </>
              )}
            </Button>
            
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-900 dark:text-blue-200">
                <strong>Secure & Private:</strong> Your bank credentials are never shared with us. 
                Stripe uses bank-level encryption to securely connect your account.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Connected Accounts */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Connected Bank Accounts
                </CardTitle>
                <Button 
                  onClick={handleConnectBank} 
                  disabled={loading}
                  variant="outline"
                  size="sm"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Building2 className="w-4 h-4 mr-2" />
                      Add Another
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {connectedAccounts.map((account) => (
                <div 
                  key={account.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <Building2 className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="font-medium">{account.institution_name}</p>
                        {account.account_name && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {account.account_name}
                            {account.account_mask && ` ••••${account.account_mask}`}
                          </p>
                        )}
                        {account.last_synced && (
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            Last synced: {new Date(account.last_synced).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {account.status === 'active' ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Connected
                      </Badge>
                    ) : account.status === 'error' ? (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Error
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                        Disconnected
                      </Badge>
                    )}

                    <Button
                      onClick={() => handleSyncTransactions(account.account_id)}
                      disabled={syncing || account.status !== 'active'}
                      variant="outline"
                      size="sm"
                    >
                      {syncing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                    </Button>

                    <Button
                      onClick={() => handleDisconnectAccount(account.account_id)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Unlink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Sync Instructions */}
          <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <CardContent className="py-4">
              <p className="text-sm text-blue-900 dark:text-blue-200">
                <strong>💡 Tip:</strong> Click the refresh icon to sync new transactions from your bank. 
                Transactions are typically available within a few hours of posting.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
