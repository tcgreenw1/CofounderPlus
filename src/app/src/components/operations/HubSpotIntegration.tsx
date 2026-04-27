import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Building, Users, DollarSign, RefreshCw, CheckCircle, 
  AlertCircle, ExternalLink, Mail, Phone, MapPin, Briefcase, Settings
} from 'lucide-react';
import { supabase } from '../../utils/supabase/client';
import { projectId } from '../../utils/supabase/info';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { toast } from 'sonner@2.0.3';
import { useBusiness } from '../BusinessContext';
import HubSpotSetupGuide from './HubSpotSetupGuide';

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
}

export default function HubSpotIntegration() {
  const { selectedBusiness } = useBusiness();
  const [connected, setConnected] = useState<boolean | null>(null);
  const [contacts, setContacts] = useState<HubSpotContact[]>([]);
  const [companies, setCompanies] = useState<HubSpotCompany[]>([]);
  const [deals, setDeals] = useState<HubSpotDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [showSetupGuide, setShowSetupGuide] = useState(false);

  // Test HubSpot connection on load
  useEffect(() => {
    testConnection();
    loadCachedData();
  }, [selectedBusiness]);

  const testConnection = async () => {
    if (!selectedBusiness) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        toast.error('Please sign in to connect to HubSpot');
        setConnected(false);
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/hubspot/test`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      const result = await response.json();
      console.log('HubSpot connection test result:', result);

      if (result.connected) {
        setConnected(true);
        toast.success(`✅ HubSpot connected! Portal: ${result.portalId || 'Connected'}`);
      } else {
        setConnected(false);
        const errorMsg = result.error || result.details || 'HubSpot connection failed';
        toast.error(errorMsg, { 
          duration: 6000,
          description: result.details ? 'Check browser console for details' : undefined
        });
        console.error('HubSpot error details:', result);
      }
    } catch (error: any) {
      console.error('HubSpot connection test error:', error);
      setConnected(false);
      toast.error(`Connection error: ${error.message || 'Unknown error'}`, {
        duration: 6000
      });
    }
  };

  const loadCachedData = async () => {
    if (!selectedBusiness) return;

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) return;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/hubspot/cached?businessId=${selectedBusiness.id}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setContacts(data.contacts || []);
        setCompanies(data.companies || []);
        setDeals(data.deals || []);
        setLastSync(data.lastSync);
      }
    } catch (error) {
      console.error('Error loading cached data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!selectedBusiness) return;

    setSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        toast.error('Please sign in to sync');
        return;
      }

      toast.info('🔄 Syncing HubSpot data...');

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/hubspot/sync?businessId=${selectedBusiness.id}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        toast.success(`✨ Synced ${result.synced.contacts} contacts, ${result.synced.companies} companies, and ${result.synced.deals} deals!`);
        setLastSync(result.lastSync);
        // Reload data
        await loadCachedData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Sync failed');
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Failed to sync HubSpot data');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-[#4B00FF]" />
          <p className="text-gray-600">Loading HubSpot data...</p>
        </CardContent>
      </Card>
    );
  }

  // Show setup guide if connection failed or user requests it
  if (showSetupGuide || connected === false) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-[#FF7A59]" />
                  HubSpot Setup Required
                </CardTitle>
                <CardDescription>
                  Follow the guide below to connect your HubSpot account
                </CardDescription>
              </div>
              {connected === false && (
                <Button
                  onClick={testConnection}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry Connection
                </Button>
              )}
            </div>
          </CardHeader>
        </Card>
        <HubSpotSetupGuide />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5 text-[#FF7A59]" />
                HubSpot CRM Integration
              </CardTitle>
              <CardDescription>
                Sync your contacts, companies, and deals from HubSpot
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              {connected === true && (
                <Badge className="bg-[#6CFF6C] text-black">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Connected
                </Badge>
              )}
              {connected === false && (
                <Badge variant="destructive">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Disconnected
                </Badge>
              )}
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setShowSetupGuide(true)}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Setup Guide
                </Button>
                <Button
                  onClick={handleSync}
                  disabled={syncing || connected === false}
                  size="sm"
                  className="bg-[#FF7A59] hover:bg-[#FF7A59]/80 text-white"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? 'Syncing...' : 'Sync Now'}
                </Button>
              </div>
            </div>
          </div>
          {lastSync && (
            <p className="text-xs text-gray-500 mt-2">
              Last synced: {new Date(lastSync).toLocaleString()}
            </p>
          )}
        </CardHeader>
      </Card>

      {/* Data Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Contacts</p>
                <p className="text-3xl font-bold text-[#00E0FF]">{contacts.length}</p>
              </div>
              <Users className="w-10 h-10 text-[#00E0FF] opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Companies</p>
                <p className="text-3xl font-bold text-[#4B00FF]">{companies.length}</p>
              </div>
              <Building className="w-10 h-10 text-[#4B00FF] opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Deals</p>
                <p className="text-3xl font-bold text-[#6CFF6C]">{deals.length}</p>
              </div>
              <DollarSign className="w-10 h-10 text-[#6CFF6C] opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Tabs */}
      <Card>
        <Tabs defaultValue="contacts">
          <CardHeader>
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="contacts">Contacts</TabsTrigger>
              <TabsTrigger value="companies">Companies</TabsTrigger>
              <TabsTrigger value="deals">Deals</TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent>
            <TabsContent value="contacts" className="space-y-4">
              {contacts.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">No contacts found</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Click "Sync Now" to import contacts from HubSpot
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {contacts.map((contact) => (
                    <motion.div
                      key={contact.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 border rounded-lg hover:border-[#00E0FF] transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">
                              {contact.firstName} {contact.lastName}
                            </h4>
                            {contact.lifecycleStage && (
                              <Badge variant="outline" className="text-xs">
                                {contact.lifecycleStage}
                              </Badge>
                            )}
                          </div>
                          {contact.jobTitle && contact.company && (
                            <p className="text-sm text-gray-600 mt-1">
                              {contact.jobTitle} at {contact.company}
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
                        <a
                          href={`https://app.hubspot.com/contacts/${contact.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#FF7A59] hover:text-[#FF7A59]/80"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="companies" className="space-y-4">
              {companies.length === 0 ? (
                <div className="text-center py-12">
                  <Building className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">No companies found</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Click "Sync Now" to import companies from HubSpot
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {companies.map((company) => (
                    <motion.div
                      key={company.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 border rounded-lg hover:border-[#4B00FF] transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">{company.name}</h4>
                          {company.industry && (
                            <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                              <Briefcase className="w-3 h-3" />
                              {company.industry}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                            {company.domain && (
                              <span className="flex items-center gap-1">
                                <ExternalLink className="w-3 h-3" />
                                {company.domain}
                              </span>
                            )}
                            {company.city && company.state && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {company.city}, {company.state}
                              </span>
                            )}
                            {company.numberOfEmployees && (
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {company.numberOfEmployees} employees
                              </span>
                            )}
                          </div>
                        </div>
                        <a
                          href={`https://app.hubspot.com/contacts/${company.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#FF7A59] hover:text-[#FF7A59]/80"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="deals" className="space-y-4">
              {deals.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">No deals found</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Click "Sync Now" to import deals from HubSpot
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {deals.map((deal) => (
                    <motion.div
                      key={deal.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 border rounded-lg hover:border-[#6CFF6C] transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{deal.name}</h4>
                            <Badge className="bg-[#6CFF6C] text-black">
                              ${parseFloat(deal.amount).toLocaleString()}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                            {deal.stage && (
                              <span className="flex items-center gap-1">
                                Stage: {deal.stage}
                              </span>
                            )}
                            {deal.closeDate && (
                              <span className="flex items-center gap-1">
                                Close: {new Date(deal.closeDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <a
                          href={`https://app.hubspot.com/contacts/${deal.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#FF7A59] hover:text-[#FF7A59]/80"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}
