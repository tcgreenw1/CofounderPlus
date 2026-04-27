import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, Database, Zap } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface PersistentSubscriptionOverrideProps {
  user: any;
  isSigningOut?: boolean;
}

export const PersistentSubscriptionOverride: React.FC<PersistentSubscriptionOverrideProps> = ({ 
  user, 
  isSigningOut = false 
}) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [overrideData, setOverrideData] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>('studio');
  const [selectedBilling, setSelectedBilling] = useState<string>('annual');
  const [persistentMode, setPersistentMode] = useState(false);
  const [debugMode, setDebugMode] = useState(true);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 9)]);
    console.log(`🔧 PersistentOverride: ${message}`);
  };

  // Check current subscription status
  const checkCurrentStatus = async () => {
    if (!user || isSigningOut) return;
    
    setLoading(true);
    addLog('Checking current subscription status...');
    
    try {
      // Check localStorage override first
      const localOverride = localStorage.getItem(`subscription_override_${user.id}`);
      if (localOverride) {
        const parsed = JSON.parse(localOverride);
        setOverrideData(parsed);
        addLog(`Found localStorage override: ${parsed.plan}/${parsed.billing}`);
      }

      // Get current subscription from API
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/subscription/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
          'x-user-id': user.id
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentSubscription(data);
        addLog(`API subscription: ${data.plan}/${data.billing} (Active: ${data.isActive})`);
        
        if (data.stripeCustomerId) {
          addLog(`Stripe Customer: ${data.stripeCustomerId}`);
        }
        if (data.stripeSubscriptionId) {
          addLog(`Stripe Subscription: ${data.stripeSubscriptionId}`);
        }
      } else {
        const errorText = await response.text();
        addLog(`API Error: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      addLog(`Error checking status: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Apply persistent override
  const applyPersistentOverride = async () => {
    if (!user || isSigningOut) return;
    
    setLoading(true);
    addLog(`Applying persistent override: ${selectedPlan}/${selectedBilling}`);
    
    try {
      const overridePayload = {
        userId: user.id,
        plan: selectedPlan,
        billing: selectedBilling,
        isActive: true,
        persistent: persistentMode,
        timestamp: new Date().toISOString()
      };

      // Save to localStorage for immediate effect
      localStorage.setItem(`subscription_override_${user.id}`, JSON.stringify(overridePayload));
      addLog('Saved override to localStorage');

      if (persistentMode) {
        // Also save to backend for persistence across sessions
        const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/subscription/override`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(overridePayload)
        });

        if (response.ok) {
          const result = await response.json();
          addLog(`Backend override saved: ${result.success ? 'SUCCESS' : 'FAILED'}`);
          if (result.details) {
            addLog(`Details: ${result.details}`);
          }
        } else {
          const errorText = await response.text();
          addLog(`Backend override failed: ${response.status} - ${errorText}`);
        }
      }

      setOverrideData(overridePayload);
      setStatus('Override applied successfully!');
      
      // Trigger subscription context refresh
      window.dispatchEvent(new CustomEvent('subscription-override-applied', { 
        detail: overridePayload 
      }));
      
      addLog('Override complete - triggered context refresh');
      
    } catch (error) {
      addLog(`Override error: ${error.message}`);
      setStatus(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Clear override
  const clearOverride = async () => {
    if (!user || isSigningOut) return;
    
    setLoading(true);
    addLog('Clearing subscription override...');
    
    try {
      // Clear localStorage
      localStorage.removeItem(`subscription_override_${user.id}`);
      addLog('Cleared localStorage override');

      // Clear backend override if it exists
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/subscription/override`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: user.id })
      });

      if (response.ok) {
        addLog('Cleared backend override');
      } else {
        addLog(`Backend clear failed: ${response.status}`);
      }

      setOverrideData(null);
      setStatus('Override cleared');
      
      // Trigger subscription context refresh
      window.dispatchEvent(new CustomEvent('subscription-override-cleared'));
      addLog('Clear complete - triggered context refresh');
      
    } catch (error) {
      addLog(`Clear error: ${error.message}`);
      setStatus(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Force refresh subscription context
  const forceRefresh = () => {
    addLog('Forcing subscription context refresh...');
    window.dispatchEvent(new CustomEvent('force-subscription-refresh'));
    setTimeout(checkCurrentStatus, 1000);
  };

  useEffect(() => {
    if (user && !isSigningOut) {
      checkCurrentStatus();
    }
  }, [user, isSigningOut]);

  if (!user || isSigningOut) {
    return null;
  }

  return (
    <Card className="w-full max-w-4xl glass-morphism">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          Persistent Subscription Override
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Current API Status</Label>
            <div className="flex items-center gap-2">
              {currentSubscription ? (
                <>
                  <Badge variant="outline">
                    {currentSubscription.plan}/{currentSubscription.billing}
                  </Badge>
                  {currentSubscription.isActive ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                </>
              ) : (
                <Badge variant="secondary">Loading...</Badge>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium">Override Status</Label>
            <div className="flex items-center gap-2">
              {overrideData ? (
                <>
                  <Badge variant="default">
                    {overrideData.plan}/{overrideData.billing}
                  </Badge>
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                </>
              ) : (
                <Badge variant="outline">None</Badge>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Override Controls */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Plan</Label>
              <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free (Starter)</SelectItem>
                  <SelectItem value="creator">Creator</SelectItem>
                  <SelectItem value="builder">Builder</SelectItem>
                  <SelectItem value="studio">Studio</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Billing</Label>
              <Select value={selectedBilling} onValueChange={setSelectedBilling}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Options</Label>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="persistent" 
                  checked={persistentMode} 
                  onCheckedChange={setPersistentMode} 
                />
                <Label htmlFor="persistent" className="text-sm">
                  Backend Persistent
                </Label>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={applyPersistentOverride} 
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
              Apply Override
            </Button>
            
            <Button 
              variant="outline" 
              onClick={clearOverride} 
              disabled={loading}
            >
              Clear Override
            </Button>
            
            <Button 
              variant="secondary" 
              onClick={forceRefresh} 
              disabled={loading}
            >
              Force Refresh
            </Button>
            
            <Button 
              variant="ghost" 
              onClick={checkCurrentStatus} 
              disabled={loading}
            >
              Check Status
            </Button>
          </div>
        </div>

        {status && (
          <div className="p-3 rounded-lg bg-muted">
            <p className="text-sm">{status}</p>
          </div>
        )}

        <Separator />

        {/* Debug Logs */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Debug Logs</Label>
            <div className="flex items-center space-x-2">
              <Switch 
                id="debug" 
                checked={debugMode} 
                onCheckedChange={setDebugMode} 
              />
              <Label htmlFor="debug" className="text-sm">Debug Mode</Label>
            </div>
          </div>
          
          {debugMode && (
            <div className="bg-black/90 text-green-400 p-3 rounded-lg max-h-48 overflow-y-auto font-mono text-xs">
              {logs.length > 0 ? (
                logs.map((log, index) => (
                  <div key={index}>{log}</div>
                ))
              ) : (
                <div className="text-gray-500">No logs yet...</div>
              )}
            </div>
          )}
        </div>

        {/* Current Subscription Details */}
        {currentSubscription && debugMode && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Current Subscription Details</Label>
            <div className="bg-muted p-3 rounded-lg">
              <pre className="text-xs overflow-x-auto">
                {JSON.stringify(currentSubscription, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};