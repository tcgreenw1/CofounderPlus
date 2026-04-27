import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Cloud, Users, DollarSign, RefreshCw, CheckCircle, 
  AlertCircle, ExternalLink, Mail, Phone, MapPin, Briefcase,
  Link as LinkIcon, LogOut
} from 'lucide-react';
import { supabase } from '../../utils/supabase/client';
import { projectId } from '../../utils/supabase/info';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { toast } from 'sonner@2.0.3';
import { useBusiness } from '../BusinessContext';

interface SalesforceContact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  accountName: string;
  title: string;
  createdAt: string;
  salesforceUrl?: string;
}

interface SalesforceAccount {
  id: string;
  name: string;
  website: string;
  industry: string;
  phone: string;
  billingCity: string;
  billingState: string;
  billingCountry: string;
  numberOfEmployees: number;
  annualRevenue: number;
  createdAt: string;
  salesforceUrl?: string;
}

interface SalesforceOpportunity {
  id: string;
  name: string;
  amount: number;
  stage: string;
  probability: number;
  closeDate: string;
  createdAt: string;
  salesforceUrl?: string;
}

export default function SalesforceOAuthIntegration() {
  const { selectedBusiness } = useBusiness();
  const [connected, setConnected] = useState<boolean | null>(null);
  const [instanceUrl, setInstanceUrl] = useState<string | null>(null);
  const [contacts, setContacts] = useState<SalesforceContact[]>([]);
  const [accounts, setAccounts] = useState<SalesforceAccount[]>([]);
  const [opportunities, setOpportunities] = useState<SalesforceOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Get current user ID
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
      }
    };
    getCurrentUser();
  }, []);

  // Check connection status on mount
  useEffect(() => {
    if (userId) {
      checkConnection();
    }
  }, [userId]);

  const checkConnection = async () => {
    if (!userId) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        setConnected(false);
        setLoading(false);
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/salesforce/status?userId=${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      const data = await response.json();

      if (response.ok && data.connected) {
        setConnected(true);
        setInstanceUrl(data.instanceUrl);
        // Load cached data
        loadCachedData();
      } else {
        setConnected(false);
      }
    } catch (error) {
      console.error('Connection check error:', error);
      setConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const connectSalesforce = async () => {
    if (!userId) {
      toast.error('Please sign in first');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        toast.error('Please sign in first');
        return;
      }

      // Get authorization URL
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/salesforce/auth-url?userId=${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      console.log('🔍 Salesforce auth-url response status:', response.status);
      console.log('🔍 Salesforce auth-url response ok:', response.ok);

      const data = await response.json();
      console.log('🔍 Salesforce auth-url response data:', data);

      if (response.ok && data.authUrl) {
        // Log redirect URI for debugging
        console.log('🔍 Salesforce OAuth Debug:');
        console.log('   Redirect URI from backend:', data.redirectUri);
        console.log('   Auth URL:', data.authUrl);

        // Open Salesforce authorization in popup
        const width = 600;
        const height = 700;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;

        const popup = window.open(
          data.authUrl,
          'Salesforce Authorization',
          `width=${width},height=${height},left=${left},top=${top}`
        );

        // Listen for callback
        const messageHandler = async (event: MessageEvent) => {
          if (event.data?.type === 'salesforce-oauth-success') {
            window.removeEventListener('message', messageHandler);
            popup?.close();
            toast.success('Salesforce connected successfully!');
            await checkConnection();
          } else if (event.data?.type === 'salesforce-oauth-error') {
            window.removeEventListener('message', messageHandler);
            popup?.close();
            toast.error('Failed to connect Salesforce');
          }
        };

        window.addEventListener('message', messageHandler);

        // Fallback: check connection after popup closes
        const checkPopup = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkPopup);
            window.removeEventListener('message', messageHandler);
            setTimeout(() => checkConnection(), 1000);
          }
        }, 500);

      } else {
        toast.error(data.error || 'Failed to get authorization URL');
      }
    } catch (error: any) {
      console.error('Connect error:', error);
      toast.error('Failed to connect to Salesforce');
    }
  };

  const disconnectSalesforce = async () => {
    if (!userId) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) return;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/salesforce/disconnect`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ userId })
        }
      );

      if (response.ok) {
        setConnected(false);
        setInstanceUrl(null);
        setContacts([]);
        setAccounts([]);
        setOpportunities([]);
        setLastSync(null);
        toast.success('Salesforce disconnected');
      } else {
        toast.error('Failed to disconnect');
      }
    } catch (error) {
      console.error('Disconnect error:', error);
      toast.error('Failed to disconnect');
    }
  };

  const loadCachedData = async () => {
    if (!userId) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) return;

      const businessParam = selectedBusiness ? `&businessId=${selectedBusiness.id}` : '';
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/salesforce/cached?userId=${userId}${businessParam}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      const data = await response.json();

      if (response.ok) {
        setContacts(data.contacts || []);
        setAccounts(data.accounts || []);
        setOpportunities(data.opportunities || []);
        setLastSync(data.lastSync);
      }
    } catch (error) {
      console.error('Load cached data error:', error);
    }
  };

  const handleSync = async () => {
    if (!userId) {
      toast.error('Please sign in first');
      return;
    }

    setSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        toast.error('Please sign in first');
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/salesforce/sync`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId,
            businessId: selectedBusiness?.id
          })
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success(`Synced ${data.synced.contacts} contacts, ${data.synced.accounts} accounts, ${data.synced.opportunities} opportunities`);
        setLastSync(data.lastSync);
        await loadCachedData();
      } else {
        if (data.error?.includes('not connected')) {
          toast.error('Please connect your Salesforce account first');
          setConnected(false);
        } else if (data.error?.includes('expired')) {
          toast.error('Your Salesforce connection expired. Please reconnect.');
          setConnected(false);
        } else {
          toast.error(data.error || 'Failed to sync Salesforce data');
        }
      }
    } catch (error: any) {
      console.error('Sync error:', error);
      toast.error('Failed to sync Salesforce data');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-[#00BFFF]" />
          <p className="text-gray-600">Loading Salesforce integration...</p>
        </div>
      </div>
    );
  }

  // Not connected - show connect UI
  if (!connected) {
    return (
      <div className="space-y-6">
        <Card className="border-2 border-[#00BFFF]">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-[#00BFFF] rounded-full flex items-center justify-center">
              <LinkIcon className="w-8 h-8 text-white" />
            </div>
            <CardTitle>Connect Your Salesforce Account</CardTitle>
            <CardDescription>
              Sync your contacts, accounts, and opportunities from Salesforce to manage your sales pipeline
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">What you'll get:</h4>
              <ul className="space-y-1 text-sm text-blue-800">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Access to all your Salesforce contacts
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Account information and insights
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Opportunity tracking and pipeline visibility
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Secure OAuth connection (read-only access)
                </li>
              </ul>
            </div>

            <Button
              onClick={connectSalesforce}
              className="w-full bg-[#00BFFF] hover:bg-[#00BFFF]/80 text-white"
              size="lg"
            >
              <LinkIcon className="w-5 h-5 mr-2" />
              Connect Salesforce Account
            </Button>

            <p className="text-xs text-center text-gray-500">
              You'll be redirected to Salesforce to authorize Cofounder. We only request read access to your CRM data.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Connected - show data
  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle>Salesforce CRM</CardTitle>
              <Badge variant="default" className="bg-green-500">
                <CheckCircle className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={disconnectSalesforce}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <LogOut className="w-4 h-4" />
                Disconnect
              </Button>
              <Button
                onClick={handleSync}
                disabled={syncing}
                size="sm"
                className="bg-[#00BFFF] hover:bg-[#00BFFF]/80 text-white"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync Now'}
              </Button>
            </div>
          </div>
          {lastSync && (
            <CardDescription>
              Last synced: {new Date(lastSync).toLocaleString()}
            </CardDescription>
          )}
        </CardHeader>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="w-5 h-5 text-[#00E0FF]" />
              Contacts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{contacts.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Briefcase className="w-5 h-5 text-[#4B00FF]" />
              Accounts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{accounts.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="w-5 h-5 text-[#6CFF6C]" />
              Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{opportunities.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Data Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>CRM Data</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="contacts">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="contacts">Contacts ({contacts.length})</TabsTrigger>
              <TabsTrigger value="accounts">Accounts ({accounts.length})</TabsTrigger>
              <TabsTrigger value="opportunities">Opportunities ({opportunities.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="contacts" className="space-y-4 mt-4">
              {contacts.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No contacts found. Click "Sync Now" to fetch your data.</p>
              ) : (
                <div className="space-y-2">
                  {contacts.map((contact) => (
                    <motion.div
                      key={contact.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border rounded-lg p-4 hover:border-[#00E0FF] transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold">
                            {contact.firstName} {contact.lastName}
                          </h4>
                          {contact.title && contact.accountName && (
                            <p className="text-sm text-gray-600">
                              {contact.title} at {contact.accountName}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                            {contact.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {contact.email}
                              </span>
                            )}
                            {contact.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {contact.phone}
                              </span>
                            )}
                          </div>
                        </div>
                        {contact.salesforceUrl && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(contact.salesforceUrl, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="accounts" className="space-y-4 mt-4">
              {accounts.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No accounts found. Click "Sync Now" to fetch your data.</p>
              ) : (
                <div className="space-y-2">
                  {accounts.map((account) => (
                    <motion.div
                      key={account.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border rounded-lg p-4 hover:border-[#4B00FF] transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold">{account.name}</h4>
                          {account.website && (
                            <p className="text-sm text-gray-600">{account.website}</p>
                          )}
                          <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                            {account.industry && (
                              <span className="flex items-center gap-1">
                                <Briefcase className="w-3 h-3" />
                                {account.industry}
                              </span>
                            )}
                            {(account.billingCity || account.billingState || account.billingCountry) && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {[account.billingCity, account.billingState, account.billingCountry].filter(Boolean).join(', ')}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2 mt-2">
                            {account.numberOfEmployees && (
                              <Badge variant="outline">{account.numberOfEmployees} employees</Badge>
                            )}
                            {account.annualRevenue && (
                              <Badge variant="outline">${account.annualRevenue.toLocaleString()} revenue</Badge>
                            )}
                          </div>
                        </div>
                        {account.salesforceUrl && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(account.salesforceUrl, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="opportunities" className="space-y-4 mt-4">
              {opportunities.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No opportunities found. Click "Sync Now" to fetch your data.</p>
              ) : (
                <div className="space-y-2">
                  {opportunities.map((opportunity) => (
                    <motion.div
                      key={opportunity.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border rounded-lg p-4 hover:border-[#6CFF6C] transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold">{opportunity.name}</h4>
                          <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              ${opportunity.amount.toLocaleString()}
                            </span>
                            {opportunity.closeDate && (
                              <span>Close: {new Date(opportunity.closeDate).toLocaleDateString()}</span>
                            )}
                          </div>
                          <div className="flex gap-2 mt-2">
                            {opportunity.stage && <Badge variant="outline">{opportunity.stage}</Badge>}
                            {opportunity.probability && <Badge variant="secondary">{opportunity.probability}% probability</Badge>}
                          </div>
                        </div>
                        {opportunity.salesforceUrl && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(opportunity.salesforceUrl, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}