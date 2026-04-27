import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  AlertCircle, CheckCircle, Copy, ExternalLink, 
  Key, RefreshCw, Settings, Shield 
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { toast } from 'sonner@2.0.3';
import { supabase } from '../../utils/supabase/client';
import { projectId } from '../../utils/supabase/info';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { copyToClipboard as copyText } from '../../utils/clipboard';

export default function HubSpotSetupGuide() {
  const [apiKey, setApiKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    portalId?: string;
  } | null>(null);

  const testApiKey = async () => {
    if (!apiKey.trim()) {
      toast.error('Please enter an API key');
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        toast.error('Please sign in');
        setTesting(false);
        return;
      }

      // Detect key type and test accordingly
      const isDeveloperKey = !apiKey.startsWith('pat-');
      let response;

      if (isDeveloperKey) {
        // Developer API key - use query parameter
        response = await fetch(`https://api.hubapi.com/account-info/v3/details?hapikey=${apiKey}`, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
      } else {
        // Private App token - use Bearer auth
        response = await fetch('https://api.hubapi.com/account-info/v3/details', {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        });
      }

      if (response.ok) {
        const data = await response.json();
        setTestResult({
          success: true,
          message: `✅ Success! Connected to HubSpot Portal: ${data.portalId}`,
          portalId: data.portalId
        });
        toast.success('API key is valid!');
      } else {
        const errorText = await response.text();
        let errorMessage = 'Invalid API key';
        
        if (response.status === 401) {
          errorMessage = 'Invalid or expired API key. Please generate a new one.';
        } else if (response.status === 403) {
          errorMessage = 'API key doesn\'t have required permissions. Add "crm.objects.contacts.read", "crm.objects.companies.read", and "crm.objects.deals.read" scopes.';
        }

        setTestResult({
          success: false,
          message: `❌ ${errorMessage}`
        });
        console.error('HubSpot API error:', errorText);
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        message: `❌ Connection error: ${error.message}`
      });
      console.error('Test error:', error);
    } finally {
      setTesting(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    const success = await copyText(text);
    if (success) {
      toast.success('Copied to clipboard!');
    }
  };

  return (
    <div className="space-y-6">
      {/* Setup Instructions */}
      <Card className="border-2 border-[#FF7A59]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#FF7A59]" />
            HubSpot API Setup Guide
          </CardTitle>
          <CardDescription>
            Follow these steps to get your HubSpot Private App Access Token
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="steps">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="steps">Step-by-Step</TabsTrigger>
              <TabsTrigger value="test">Test API Key</TabsTrigger>
            </TabsList>

            <TabsContent value="steps" className="space-y-4 mt-4">
              {/* API Key Type Notice */}
              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="w-4 h-4 text-blue-600" />
                <AlertDescription className="text-sm text-blue-800">
                  <strong>Two options available:</strong> You can use either a <strong>Private App Access Token</strong> (starts with <code className="bg-blue-100 px-1 rounded">pat-</code>) 
                  or a <strong>Developer API Key</strong> (format: <code className="bg-blue-100 px-1 rounded">xx-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx</code>).
                  Both work the same way!
                </AlertDescription>
              </Alert>

              {/* Step 1 */}
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#00E0FF] text-black flex items-center justify-center font-bold">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Go to HubSpot Settings</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Click the settings icon (⚙️) in the top navigation bar of your HubSpot account
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open('https://app.hubspot.com/settings', '_blank')}
                    className="gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open HubSpot Settings
                  </Button>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#4B00FF] text-white flex items-center justify-center font-bold">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Navigate to Integrations</h3>
                  <p className="text-sm text-gray-600">
                    In the left sidebar, go to: <strong>Integrations → Private Apps</strong>
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#6CFF6C] text-black flex items-center justify-center font-bold">
                  3
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Create a Private App</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Click "Create a private app" button
                  </p>
                  <Alert className="bg-blue-50 border-blue-200">
                    <AlertCircle className="w-4 h-4 text-blue-600" />
                    <AlertDescription className="text-sm text-blue-800">
                      If you already have a private app, you can use that one instead
                    </AlertDescription>
                  </Alert>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#FFCF00] text-black flex items-center justify-center font-bold">
                  4
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Configure the App</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p><strong>Name:</strong> "Cofounder Integration" (or any name you like)</p>
                    <p><strong>Description:</strong> Optional</p>
                  </div>
                </div>
              </div>

              {/* Step 5 */}
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#FF4F4F] text-white flex items-center justify-center font-bold">
                  5
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#FF4F4F]" />
                    Add Required Scopes
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Click the "Scopes" tab and search for these permissions:
                  </p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="outline">crm.objects.contacts.read</Badge>
                      <span className="text-gray-500">Read contacts</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="outline">crm.objects.companies.read</Badge>
                      <span className="text-gray-500">Read companies</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="outline">crm.objects.deals.read</Badge>
                      <span className="text-gray-500">Read deals</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 6 */}
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-[#00E0FF] to-[#4B00FF] text-white flex items-center justify-center font-bold">
                  6
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Key className="w-4 h-4 text-[#FF7A59]" />
                    Get Your Access Token
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Click "Create app" or "Show token" to reveal your access token
                  </p>
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <AlertDescription className="text-sm text-green-800">
                      <strong>Important:</strong> The token should start with <code className="bg-green-100 px-1 rounded">pat-</code> and be very long (100+ characters)
                    </AlertDescription>
                  </Alert>
                </div>
              </div>

              {/* Step 7 */}
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold">
                  7
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Update Environment Variable</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Copy the token and update your Supabase environment variable:
                  </p>
                  <div className="bg-gray-100 p-3 rounded-lg border">
                    <div className="flex items-center justify-between mb-1">
                      <code className="text-sm">HUBSPOT_API_KEY</code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard('HUBSPOT_API_KEY')}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Set this in Supabase Dashboard → Edge Functions → Environment Variables
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open('https://supabase.com/dashboard/project/_/settings/functions', '_blank')}
                    className="gap-2 mt-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open Supabase Settings
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="test" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="test-api-key">Test Your API Key</Label>
                  <p className="text-xs text-gray-500 mb-2">
                    Enter your HubSpot Private App Access Token to test if it works
                  </p>
                  <div className="flex gap-2">
                    <Input
                      id="test-api-key"
                      type="password"
                      placeholder="pat-na1-..."
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="font-mono text-sm"
                    />
                    <Button
                      onClick={testApiKey}
                      disabled={testing || !apiKey}
                      className="bg-[#FF7A59] hover:bg-[#FF7A59]/80"
                    >
                      {testing ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        <>
                          <Key className="w-4 h-4 mr-2" />
                          Test Key
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {testResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Alert className={testResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
                      {testResult.success ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-600" />
                      )}
                      <AlertDescription className={testResult.success ? 'text-green-800' : 'text-red-800'}>
                        {testResult.message}
                      </AlertDescription>
                    </Alert>

                    {testResult.success && (
                      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-semibold text-blue-900 mb-2">✅ Success! Next Steps:</h4>
                        <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                          <li>Copy this API key</li>
                          <li>Go to Supabase Dashboard → Edge Functions → Environment Variables</li>
                          <li>Set <code className="bg-blue-100 px-1 rounded">HUBSPOT_API_KEY</code> to your token</li>
                          <li>Redeploy your Edge Functions</li>
                          <li>Come back and try the HubSpot integration!</li>
                        </ol>
                      </div>
                    )}
                  </motion.div>
                )}

                <Alert>
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription className="text-sm">
                    <strong>Security Note:</strong> This test calls HubSpot directly from your browser. 
                    Your API key is not sent to our servers during this test.
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Quick Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Reference</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h4 className="font-semibold text-sm mb-1">Valid API Key Formats:</h4>
            <div className="space-y-2">
              <div>
                <p className="text-xs font-medium text-gray-700 mb-1">Private App Token:</p>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded block">
                  pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
                </code>
                <p className="text-xs text-gray-500 mt-1">
                  (Very long, 100+ characters)
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-700 mb-1">Developer API Key:</p>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded block">
                  na2-54c5-0379-46c7-ab82-974ec09c29b0
                </code>
                <p className="text-xs text-gray-500 mt-1">
                  (Format: region-uuid)
                </p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-1">Required Permissions:</h4>
            <div className="flex flex-wrap gap-1">
              <Badge variant="secondary" className="text-xs">crm.objects.contacts.read</Badge>
              <Badge variant="secondary" className="text-xs">crm.objects.companies.read</Badge>
              <Badge variant="secondary" className="text-xs">crm.objects.deals.read</Badge>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-1">Helpful Links:</h4>
            <div className="space-y-1">
              <a
                href="https://developers.hubspot.com/docs/api/private-apps"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#FF7A59] hover:underline flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                HubSpot Private Apps Documentation
              </a>
              <a
                href="https://app.hubspot.com/settings/integrations/private-apps"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#FF7A59] hover:underline flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                Your HubSpot Private Apps
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}