import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Building, Users, DollarSign, RefreshCw, CheckCircle, 
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

interface HubSpotContact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  jobTitle: string;
  lifecycleStage: string;
  createdAt: string;
  updatedAt: string;
  hubspotUrl?: string;
}

interface HubSpotCompany {
  id: string;
  name: string;
  domain: string;
  industry: string;
  phone: string;
  city: string;
  state: string;
  country: string;
  numberOfEmployees: string;
  annualRevenue: string;
  createdAt: string;
  updatedAt: string;
  hubspotUrl?: string;
}

interface HubSpotDeal {
  id: string;
  name: string;
  amount: string;
  stage: string;
  pipeline: string;
  closeDate: string;
  createdAt: string;
  updatedAt: string;
  hubspotUrl?: string;
}

export default function HubSpotOAuthIntegration() {
  const { selectedBusiness } = useBusiness();
  const [connected, setConnected] = useState<boolean | null>(null);
  const [hubId, setHubId] = useState<string | null>(null);
  const [contacts, setContacts] = useState<HubSpotContact[]>([]);
  const [companies, setCompanies] = useState<HubSpotCompany[]>([]);
  const [deals, setDeals] = useState<HubSpotDeal[]>([]);
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
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/hubspot/status?userId=${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      const data = await response.json();

      if (response.ok && data.connected) {
        setConnected(true);
        setHubId(data.hubId);
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

  const connectHubSpot = async () => {
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
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/hubspot/auth-url?userId=${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      const data = await response.json();

      if (response.ok && data.authUrl) {
        // Log redirect URI for debugging
        console.log('🔍 HubSpot OAuth Debug:');
        console.log('   Redirect URI from backend:', data.redirectUri);
        console.log('   Auth URL:', data.authUrl);

        // Open HubSpot authorization in popup
        const width = 600;
        const height = 700;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;

        const popup = window.open(
          data.authUrl,
          'HubSpot Authorization',
          `width=${width},height=${height},left=${left},top=${top}`
        );

        // Listen for callback
        const messageHandler = async (event: MessageEvent) => {
          if (event.data?.type === 'hubspot-oauth-success') {
            window.removeEventListener('message', messageHandler);
            popup?.close();
            toast.success('HubSpot connected successfully!');
            await checkConnection();
          } else if (event.data?.type === 'hubspot-oauth-error') {
            window.removeEventListener('message', messageHandler);
            popup?.close();
            toast.error('Failed to connect HubSpot');
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
      toast.error('Failed to connect to HubSpot');
    }
  };

  const disconnectHubSpot = async () => {
    if (!userId) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) return;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/hubspot/disconnect`,
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
        setHubId(null);
        setContacts([]);
        setCompanies([]);
        setDeals([]);
        setLastSync(null);
        toast.success('HubSpot disconnected');
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
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/hubspot/cached?userId=${userId}${businessParam}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      const data = await response.json();

      if (response.ok) {
        setContacts(data.contacts || []);
        setCompanies(data.companies || []);
        setDeals(data.deals || []);
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
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/hubspot/sync`,
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
        toast.success(`Synced ${data.synced.contacts} contacts, ${data.synced.companies} companies, ${data.synced.deals} deals`);
        setLastSync(data.lastSync);
        await loadCachedData();
      } else {
        if (data.error?.includes('not connected')) {
          toast.error('Please connect your HubSpot account first');
          setConnected(false);
        } else if (data.error?.includes('expired')) {
          toast.error('Your HubSpot connection expired. Please reconnect.');
          setConnected(false);
        } else {
          toast.error(data.error || 'Failed to sync HubSpot data');
        }
      }
    } catch (error: any) {
      console.error('Sync error:', error);
      toast.error('Failed to sync HubSpot data');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 sm:p-12">
        <div className="text-center">
          <RefreshCw className="w-6 h-6 sm:w-8 sm:h-8 animate-spin mx-auto mb-3 sm:mb-4 text-[#FF7A59]" />
          <p className="text-sm sm:text-base text-gray-600">Loading HubSpot integration...</p>
        </div>
      </div>
    );
  }

  // Not connected - show connect UI
  if (!connected) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <Card className="border-2 border-[#FF7A59]">
          <CardHeader className="text-center px-4 sm:px-6">
            <div className="mx-auto mb-3 sm:mb-4 w-12 h-12 sm:w-16 sm:h-16 bg-[#FF7A59] rounded-full flex items-center justify-center">
              <LinkIcon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <CardTitle className="text-lg sm:text-xl">Connect Your HubSpot Account</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Sync your contacts, companies, and deals from HubSpot to manage your sales pipeline
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-4 sm:px-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
              <h4 className="font-semibold text-sm sm:text-base text-blue-900 mb-2">What you'll get:</h4>
              <ul className="space-y-1 sm:space-y-1.5 text-xs sm:text-sm text-blue-800">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  Access to all your HubSpot contacts
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  Company information and insights
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  Deal tracking and pipeline visibility
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  Secure OAuth connection (read-only access)
                </li>
              </ul>
            </div>

            <Button
              onClick={connectHubSpot}
              className="w-full bg-[#FF7A59] hover:bg-[#FF7A59]/80 text-white text-sm sm:text-base h-10 sm:h-11"
              size="lg"
            >
              <LinkIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Connect HubSpot Account
            </Button>

            <p className="text-[10px] sm:text-xs text-center text-gray-500">
              You'll be redirected to HubSpot to authorize Cofounder. We only request read access to your CRM data.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Connected - show data
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader className="px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base sm:text-lg">HubSpot CRM</CardTitle>
              <Badge variant="default" className="bg-green-500 text-xs">
                <CheckCircle className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={disconnectHubSpot}
                variant="outline"
                size="sm"
                className="gap-1.5 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
              >
                <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Disconnect</span>
                <span className="sm:hidden">Disc.</span>
              </Button>
              <Button
                onClick={handleSync}
                disabled={syncing}
                size="sm"
                className="bg-[#FF7A59] hover:bg-[#FF7A59]/80 text-white gap-1.5 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
              >
                <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync Now'}
              </Button>
            </div>
          </div>
          {lastSync && (
            <CardDescription className="text-xs sm:text-sm mt-2">
              Last synced: {new Date(lastSync).toLocaleString()}
            </CardDescription>
          )}
        </CardHeader>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Card>
          <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
            <CardTitle className="flex items-center gap-1 sm:gap-2 text-xs sm:text-base md:text-lg">
              <Users className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-[#00E0FF]" />
              <span className="hidden sm:inline">Contacts</span>
              <span className="sm:hidden">Cont.</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <p className="text-xl sm:text-2xl md:text-3xl font-bold">{contacts.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
            <CardTitle className="flex items-center gap-1 sm:gap-2 text-xs sm:text-base md:text-lg">
              <Building className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-[#4B00FF]" />
              <span className="hidden sm:inline">Companies</span>
              <span className="sm:hidden">Comp.</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <p className="text-xl sm:text-2xl md:text-3xl font-bold">{companies.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
            <CardTitle className="flex items-center gap-1 sm:gap-2 text-xs sm:text-base md:text-lg">
              <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-[#6CFF6C]" />
              Deals
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <p className="text-xl sm:text-2xl md:text-3xl font-bold">{deals.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Data Tabs */}
      <Card>
        <CardHeader className="px-4 sm:px-6 py-4 sm:py-6">
          <CardTitle className="text-base sm:text-lg">CRM Data</CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <Tabs defaultValue="contacts">
            <TabsList className="grid grid-cols-3 w-full h-auto">
              <TabsTrigger value="contacts" className="text-xs sm:text-sm py-2">
                <span className="hidden sm:inline">Contacts ({contacts.length})</span>
                <span className="sm:hidden">Cont. ({contacts.length})</span>
              </TabsTrigger>
              <TabsTrigger value="companies" className="text-xs sm:text-sm py-2">
                <span className="hidden sm:inline">Companies ({companies.length})</span>
                <span className="sm:hidden">Comp. ({companies.length})</span>
              </TabsTrigger>
              <TabsTrigger value="deals" className="text-xs sm:text-sm py-2">
                Deals ({deals.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="contacts" className="space-y-2 sm:space-y-4 mt-4">
              {contacts.length === 0 ? (
                <p className="text-center text-xs sm:text-sm text-gray-500 py-6 sm:py-8">No contacts found. Click "Sync Now" to fetch your data.</p>
              ) : (
                <div className="space-y-2">
                  {contacts.map((contact) => (
                    <motion.div
                      key={contact.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border rounded-lg p-3 sm:p-4 hover:border-[#00E0FF] transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm sm:text-base truncate">
                            {contact.firstName} {contact.lastName}
                          </h4>
                          {contact.jobTitle && contact.company && (
                            <p className="text-xs sm:text-sm text-gray-600 truncate">
                              {contact.jobTitle} at {contact.company}
                            </p>
                          )}
                          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-1 sm:gap-4 mt-2 text-xs sm:text-sm text-gray-500">
                            {contact.email && (
                              <span className="flex items-center gap-1 truncate">
                                <Mail className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{contact.email}</span>
                              </span>
                            )}
                            {contact.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3 flex-shrink-0" />
                                {contact.phone}
                              </span>
                            )}
                          </div>
                          {contact.lifecycleStage && (
                            <Badge variant="outline" className="mt-2 text-xs">
                              {contact.lifecycleStage}
                            </Badge>
                          )}
                        </div>
                        {contact.hubspotUrl && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(contact.hubspotUrl, '_blank')}
                            className="h-8 w-8 p-0 flex-shrink-0"
                          >
                            <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="companies" className="space-y-2 sm:space-y-4 mt-4">
              {companies.length === 0 ? (
                <p className="text-center text-xs sm:text-sm text-gray-500 py-6 sm:py-8">No companies found. Click "Sync Now" to fetch your data.</p>
              ) : (
                <div className="space-y-2">
                  {companies.map((company) => (
                    <motion.div
                      key={company.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border rounded-lg p-3 sm:p-4 hover:border-[#4B00FF] transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm sm:text-base truncate">{company.name}</h4>
                          {company.domain && (
                            <p className="text-xs sm:text-sm text-gray-600 truncate">{company.domain}</p>
                          )}
                          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-1 sm:gap-4 mt-2 text-xs sm:text-sm text-gray-500">
                            {company.industry && (
                              <span className="flex items-center gap-1 truncate">
                                <Briefcase className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{company.industry}</span>
                              </span>
                            )}
                            {(company.city || company.state || company.country) && (
                              <span className="flex items-center gap-1 truncate">
                                <MapPin className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{[company.city, company.state, company.country].filter(Boolean).join(', ')}</span>
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {company.numberOfEmployees && (
                              <Badge variant="outline" className="text-xs">{company.numberOfEmployees} employees</Badge>
                            )}
                            {company.annualRevenue && (
                              <Badge variant="outline" className="text-xs">${parseFloat(company.annualRevenue).toLocaleString()} revenue</Badge>
                            )}
                          </div>
                        </div>
                        {company.hubspotUrl && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(company.hubspotUrl, '_blank')}
                            className="h-8 w-8 p-0 flex-shrink-0"
                          >
                            <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="deals" className="space-y-2 sm:space-y-4 mt-4">
              {deals.length === 0 ? (
                <p className="text-center text-xs sm:text-sm text-gray-500 py-6 sm:py-8">No deals found. Click "Sync Now" to fetch your data.</p>
              ) : (
                <div className="space-y-2">
                  {deals.map((deal) => (
                    <motion.div
                      key={deal.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border rounded-lg p-3 sm:p-4 hover:border-[#6CFF6C] transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm sm:text-base truncate">{deal.name}</h4>
                          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-1 sm:gap-4 mt-2 text-xs sm:text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              ${parseFloat(deal.amount).toLocaleString()}
                            </span>
                            {deal.closeDate && (
                              <span>Close: {new Date(deal.closeDate).toLocaleDateString()}</span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {deal.stage && <Badge variant="outline" className="text-xs">{deal.stage}</Badge>}
                            {deal.pipeline && <Badge variant="secondary" className="text-xs">{deal.pipeline}</Badge>}
                          </div>
                        </div>
                        {deal.hubspotUrl && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(deal.hubspotUrl, '_blank')}
                            className="h-8 w-8 p-0 flex-shrink-0"
                          >
                            <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
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