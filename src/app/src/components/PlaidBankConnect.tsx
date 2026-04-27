import React, { useState, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Loader2, Building2, CheckCircle2, AlertCircle, RefreshCw, Unlink, Crown, Sparkles, Tag, Clock, Download } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';
import { usePlaidLink } from 'react-plaid-link';
import { useCloudSubscription } from './CloudSubscriptionContext';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';

interface PlaidBankConnectProps {
  user: any;
  businessId: string;
  onTransactionsImported?: () => void;
}

interface ConnectedAccount {
  id: string;
  item_id: string;
  institution_name: string;
  account_name?: string;
  account_mask?: string;
  account_type?: string;
  account_subtype?: string;
  status: 'active' | 'disconnected' | 'error';
  last_synced?: string;
  created_at: string;
  is_demo?: boolean;
  environment?: 'sandbox' | 'production';
  tax_label?: 'personal' | 'business'; // User-defined label for tax purposes
}

export function PlaidBankConnect({ user, businessId, onTransactionsImported }: PlaidBankConnectProps) {
  const navigate = useNavigate();
  const { subscriptionData } = useCloudSubscription();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncingAll, setSyncingAll] = useState(false);
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [hasOpened, setHasOpened] = useState(false);
  const [mode, setMode] = useState<'production' | 'demo'>('production'); // Track which mode button was clicked
  const [plaidIsOpen, setPlaidIsOpen] = useState(false);
  const [currentDemoMode, setCurrentDemoMode] = useState<boolean>(false); // Track current demo mode for callbacks
  
  // Check if user is on a paid plan (creator = Launch, builder = Grow, studio = Scale)
  const isPaidUser = subscriptionData?.status === 'subscribed' && 
    ['creator', 'builder', 'studio'].includes(subscriptionData?.plan?.toLowerCase() || '');
  
  const isFreeUser = !isPaidUser;

  // Helper function to get relative time (e.g., "2 hours ago")
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

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
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/plaid-bank/connected-accounts/${businessId}`,
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

  // Create Link Token when user clicks connect
  const createLinkToken = async (demoMode: boolean = false) => {
    try {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Please sign in to connect your bank');
        setLoading(false);
        return;
      }

      // Detect if running on native mobile platform
      const isMobile = Capacitor.isNativePlatform();
      const platform = Capacitor.getPlatform();

      console.log(`🏦 Creating Plaid Link Token (${demoMode ? 'Demo' : 'Production'} Mode)...`);
      console.log(`🏦 Platform: ${platform}, Native: ${isMobile}`);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/plaid-bank/create-link-token`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            businessId,
            demoMode, // Pass demo mode flag to backend
            isMobile  // Pass mobile platform flag to use correct redirect URI
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create link token');
      }

      const data = await response.json();

      console.log('🏦 Link Token created successfully');

      if (!data.link_token) {
        throw new Error('No link token received from server');
      }

      setLinkToken(data.link_token);

    } catch (error: any) {
      console.error('🏦 Error creating link token:', error);
      toast.error(error.message || 'Failed to create link token');
      setLoading(false);
    }
  };

  // Handle successful Plaid Link connection
  const onSuccess = useCallback(async (public_token: string, metadata: any) => {
    try {
      console.log('🏦 Plaid Link successful!', {
        institution: metadata.institution?.name,
        accounts: metadata.accounts?.length
      });

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Please sign in to complete bank connection');
        return;
      }

      // Exchange public token for access token
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/plaid-bank/exchange-public-token`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            publicToken: public_token,
            businessId,
            metadata
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to connect bank account');
      }

      const data = await response.json();

      console.log('🏦 Bank account connected successfully:', data.item_id);
      toast.success(`Successfully connected ${metadata.institution?.name}!`);

      // Reload connected accounts
      await loadConnectedAccounts();

    } catch (error: any) {
      console.error('🏦 Error exchanging public token:', error);
      toast.error(error.message || 'Failed to connect bank account');
    } finally {
      setLoading(false);
      setLinkToken(null);
      setHasOpened(false);
    }
  }, [businessId, user.id]);

  // Handle Plaid Link exit
  const onExit = useCallback((error: any, metadata: any) => {
    console.log('🏦 Plaid Link exited', { error, metadata });
    setLoading(false);
    setLinkToken(null);
    setHasOpened(false);
    setPlaidIsOpen(false);
    
    if (error) {
      toast.error('Bank connection cancelled');
    }
  }, []);

  // Plaid Link hook
  // For mobile platforms, we need to handle OAuth redirects properly
  const isMobilePlatform = Capacitor.isNativePlatform();
  
  const config = {
    token: linkToken,
    onSuccess,
    onExit,
  };
  
  // For iOS, we need to properly handle OAuth redirects
  // When banks require OAuth (like Chase, Bank of America, etc.), Plaid will open Safari
  // After OAuth completion, Safari redirects to our redirect_uri with OAuth params
  // We need to tell Plaid Link that we received the OAuth redirect
  if (isMobilePlatform) {
    // Check if we're returning from an OAuth redirect
    const urlParams = new URLSearchParams(window.location.search);
    const oauth_state_id = urlParams.get('oauth_state_id');
    
    if (oauth_state_id) {
      // We're returning from OAuth - tell Plaid Link about it
      console.log('🏦 OAuth redirect detected! State ID:', oauth_state_id);
      config.receivedRedirectUri = window.location.href;
    } else {
      // Normal flow - set up for potential OAuth redirect
      // Use the same redirect URI that was configured in the backend
      config.receivedRedirectUri = null; // Let Plaid handle it automatically
    }
    
    console.log('🏦 Plaid Link Config (Mobile):', {
      hasToken: !!linkToken,
      receivedRedirectUri: config.receivedRedirectUri,
      isOAuthReturn: !!oauth_state_id
    });
  }
  
  const { open, ready } = usePlaidLink(config);

  // Auto-open Plaid Link when token is ready (only once)
  useEffect(() => {
    if (linkToken && ready && !hasOpened) {
      console.log('🏦 Opening Plaid Link...');
      console.log('🏦 Ready state:', ready);
      console.log('🏦 Link token exists:', !!linkToken);
      console.log('🏦 Has opened before:', hasOpened);
      console.log('🏦 Is mobile platform:', isMobilePlatform);
      console.log('🏦 Capacitor platform:', Capacitor.getPlatform());
      console.log('🏦 Window width:', window.innerWidth);
      
      setHasOpened(true);
      setPlaidIsOpen(true);
      
      try {
        open();
        console.log('🏦 ✅ Plaid Link opened successfully');
        
        // MOBILE OPTIMIZATION: Detect if we should use mobile layout
        // Use mobile layout if on native platform OR if screen width is small
        const shouldUseMobileLayout = isMobilePlatform || window.innerWidth < 768;
        console.log('🏦 Should use mobile layout:', shouldUseMobileLayout);
        
        // MOBILE OPTIMIZATION: Continuously monitor and fix Plaid modal positioning
        let attemptCount = 0;
        const maxAttempts = 30;
        
        const applyMobileStyles = () => {
          attemptCount++;
          console.log(`🏦 ========== Attempt ${attemptCount} to apply mobile styles ==========`);
          
          // Find ALL iframes - try multiple selectors
          const iframeSelectors = [
            'iframe[src*="plaid"]',
            'iframe[id*="plaid"]',
            'iframe[name*="plaid"]',
            'iframe[title*="plaid"]',
            'iframe[title*="Plaid"]',
            '#plaid-link-iframe-1',
            'iframe'
          ];
          
          let foundIframes: HTMLIFrameElement[] = [];
          iframeSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
              if (el instanceof HTMLIFrameElement && !foundIframes.includes(el)) {
                foundIframes.push(el);
              }
            });
          });
          
          console.log(`🏦 Found ${foundIframes.length} total iframes`);
          foundIframes.forEach((iframe, index) => {
            console.log(`🏦 Iframe ${index + 1}:`, {
              src: iframe.src?.substring(0, 50),
              id: iframe.id,
              name: iframe.name,
              title: iframe.title
            });
          });
          
          if (foundIframes.length > 0) {
            foundIframes.forEach((iframe, index) => {
              const iframeElement = iframe as HTMLElement;
              
              if (shouldUseMobileLayout) {
                console.log(`🏦 Applying MOBILE styles to iframe ${index + 1}`);
                // Mobile: Fit between header and footer with proper spacing
                iframeElement.style.setProperty('position', 'fixed', 'important');
                iframeElement.style.setProperty('top', '80px', 'important');
                iframeElement.style.setProperty('left', '0', 'important');
                iframeElement.style.setProperty('right', '0', 'important');
                iframeElement.style.setProperty('bottom', '80px', 'important');
                iframeElement.style.setProperty('width', '100%', 'important');
                iframeElement.style.setProperty('height', 'calc(100vh - 160px)', 'important');
                iframeElement.style.setProperty('max-height', 'calc(100vh - 160px)', 'important');
                iframeElement.style.setProperty('z-index', '999999', 'important');
                iframeElement.style.setProperty('pointer-events', 'auto', 'important');
                console.log(`🏦 ✅ Applied mobile positioning to iframe ${index + 1}`);
              } else {
                console.log(`🏦 Applying DESKTOP styles to iframe ${index + 1}`);
                // Desktop: Keep default but ensure high z-index
                iframeElement.style.setProperty('z-index', '999999999', 'important');
                iframeElement.style.setProperty('pointer-events', 'auto', 'important');
              }
              
              // Log the actual applied styles
              const computed = window.getComputedStyle(iframeElement);
              console.log(`🏦 Iframe ${index + 1} computed styles:`, {
                position: computed.position,
                top: computed.top,
                bottom: computed.bottom,
                height: computed.height,
                zIndex: computed.zIndex
              });
            });
          } else {
            console.log('🏦 ⚠️ No iframes found yet');
          }
          
          // Also check for any container divs created by Plaid
          const containerSelectors = [
            '[id*="plaid-link"]',
            '[class*="plaid"]',
            '[data-testid*="plaid"]'
          ];
          
          let foundContainers: HTMLElement[] = [];
          containerSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
              if (el instanceof HTMLElement && el.tagName !== 'IFRAME' && !foundContainers.includes(el)) {
                foundContainers.push(el);
              }
            });
          });
          
          console.log(`🏦 Found ${foundContainers.length} Plaid containers`);
          
          if (foundContainers.length > 0) {
            foundContainers.forEach((container, index) => {
              if (shouldUseMobileLayout) {
                // Mobile: Ensure container fits properly
                const computedStyle = window.getComputedStyle(container);
                console.log(`🏦 Container ${index + 1} position:`, computedStyle.position);
                
                if (computedStyle.position === 'fixed') {
                  console.log(`🏦 Applying mobile container styles to container ${index + 1}`);
                  container.style.setProperty('top', '80px', 'important');
                  container.style.setProperty('bottom', '80px', 'important');
                  container.style.setProperty('height', 'calc(100vh - 160px)', 'important');
                  container.style.setProperty('max-height', 'calc(100vh - 160px)', 'important');
                }
              }
              container.style.setProperty('z-index', '999999', 'important');
              container.style.setProperty('pointer-events', 'auto', 'important');
            });
          }
        };
        
        // Apply immediately
        setTimeout(() => applyMobileStyles(), 50);
        
        // Apply multiple times to catch dynamic iframe creation
        const intervals = [100, 200, 300, 500, 750, 1000, 1500, 2000, 3000];
        intervals.forEach(delay => {
          setTimeout(() => applyMobileStyles(), delay);
        });
        
        // Set up MutationObserver to catch any new iframes or style changes
        const observer = new MutationObserver((mutations) => {
          if (attemptCount < maxAttempts) {
            applyMobileStyles();
          }
        });
        
        observer.observe(document.body, { 
          childList: true, 
          subtree: true,
          attributes: true,
          attributeFilter: ['style', 'class']
        });
        
        // Add demo credentials helper overlay for demo mode
        if (mode === 'demo') {
          setTimeout(() => addDemoCredentialsHelper(), 200);
        }
        
        // Cleanup observer after 10 seconds
        setTimeout(() => {
          observer.disconnect();
          console.log('🏦 Stopped monitoring Plaid iframe');
        }, 10000);
        
      } catch (error) {
        console.error('🏦 ❌ Error opening Plaid Link:', error);
        toast.error('Failed to open bank connection dialog. Please try again.');
        setLoading(false);
        setLinkToken(null);
        setHasOpened(false);
        setPlaidIsOpen(false);
      }
    }
  }, [linkToken, ready, hasOpened, open, isMobilePlatform, mode]);
  
  // Helper function to add demo credentials overlay
  const addDemoCredentialsHelper = () => {
    // Remove any existing helper
    const existingHelper = document.getElementById('plaid-demo-helper');
    if (existingHelper) {
      existingHelper.remove();
    }
    
    // Create demo credentials helper
    const helper = document.createElement('div');
    helper.id = 'plaid-demo-helper';
    helper.style.cssText = `
      position: fixed;
      top: ${isMobilePlatform ? '85px' : '20px'};
      left: 50%;
      transform: translateX(-50%);
      background: var(--energy);
      color: var(--energy-foreground);
      padding: var(--spacing-3) var(--spacing-4);
      border-radius: var(--radius-lg);
      z-index: 9999999;
      font-weight: var(--font-weight-semibold);
      font-size: var(--text-sm);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      border: 2px solid var(--accent);
      pointer-events: auto;
      max-width: calc(100vw - 40px);
      text-align: center;
    `;
    helper.innerHTML = `
      🎭 Demo Mode: Use <strong>user_good</strong> / <strong>pass_good</strong>
    `;
    document.body.appendChild(helper);
    
    // Remove helper when Plaid closes
    const cleanup = () => {
      const helperEl = document.getElementById('plaid-demo-helper');
      if (helperEl) {
        helperEl.remove();
      }
    };
    
    // Listen for Plaid close
    setTimeout(() => {
      const observer = new MutationObserver((mutations) => {
        const plaidIframe = document.querySelector('iframe[src*="plaid"]');
        if (!plaidIframe) {
          cleanup();
          observer.disconnect();
        }
      });
      
      observer.observe(document.body, { childList: true, subtree: true });
    }, 500);
  };

  const handleConnectBank = (demoMode: boolean = false) => {
    // Check if user is trying to connect production and is not a paid user
    if (!demoMode && isFreeUser) {
      toast.error('Production bank connection requires a paid plan', {
        description: 'Upgrade to Launch, Grow, or Scale to connect real bank accounts'
      });
      return;
    }
    
    setMode(demoMode ? 'demo' : 'production');
    setCurrentDemoMode(demoMode);
    createLinkToken(demoMode);
  };

  const handleSyncTransactions = async (itemId: string, forceWithCredits: boolean = false) => {
    try {
      setSyncing(true);
      
      // Show loading toast
      toast.loading('Syncing transactions from your bank...', { id: 'sync-transactions' });

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.dismiss('sync-transactions');
        toast.error('Please sign in to sync transactions');
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/plaid-bank/sync-transactions`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            businessId,
            itemId,
            forceWithCredits
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        // Check if it's a rate limit with credit option
        if (response.status === 429 && data.requiresCredits) {
          toast.dismiss('sync-transactions');
          
          // Show credit cost dialog
          const confirmed = window.confirm(
            `${data.error}\n\nWould you like to use 10 credits to sync now?`
          );
          
          if (confirmed) {
            setSyncing(false);
            // Retry with credits
            return handleSyncTransactions(itemId, true);
          } else {
            setSyncing(false);
            return;
          }
        }
        
        // Check for insufficient credits
        if (response.status === 402) {
          toast.dismiss('sync-transactions');
          toast.error(data.error || 'Insufficient credits');
          setSyncing(false);
          
          // Redirect to buy credits
          if (window.confirm('Insufficient credits. Would you like to purchase more credits?')) {
            navigate('/settings?tab=credits');
          }
          return;
        }
        
        throw new Error(data.error || 'Failed to sync transactions');
      }

      toast.dismiss('sync-transactions');
      
      if (data.creditsCharged > 0) {
        toast.success(`Successfully imported ${data.transactionsImported || 0} transactions (${data.creditsCharged} credits used)`);
      } else {
        toast.success(`Successfully imported ${data.transactionsImported || 0} transactions`);
      }

      // Reload accounts to update last_synced
      await loadConnectedAccounts();

      // Notify parent component to refresh transactions
      if (onTransactionsImported) {
        onTransactionsImported();
      }

    } catch (error: any) {
      console.error('🔄 Error syncing transactions:', error);
      toast.dismiss('sync-transactions');
      toast.error(error.message || 'Failed to sync transactions');
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncAllTransactions = async () => {
    try {
      setSyncingAll(true);
      
      // Show loading toast
      toast.loading('Syncing transactions from all bank accounts...', { id: 'sync-all-transactions' });

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.dismiss('sync-all-transactions');
        toast.error('Please sign in to sync transactions');
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/plaid-bank/sync-all-transactions`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            businessId
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to sync transactions');
      }

      const data = await response.json();

      toast.dismiss('sync-all-transactions');
      toast.success(`Successfully imported ${data.transactionsImported || 0} transactions`);

      // Reload accounts to update last_synced
      await loadConnectedAccounts();

      // Notify parent component to refresh transactions
      if (onTransactionsImported) {
        onTransactionsImported();
      }

    } catch (error: any) {
      console.error('🔄 Error syncing transactions:', error);
      toast.dismiss('sync-all-transactions');
      toast.error(error.message || 'Failed to sync transactions');
    } finally {
      setSyncingAll(false);
    }
  };

  const handleRefreshBalance = async (itemId: string) => {
    try {
      setLoading(true);
      
      // Show loading toast
      toast.loading('Refreshing bank balance...', { id: 'refresh-balance' });

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.dismiss('refresh-balance');
        toast.error('Please sign in to refresh balance');
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/plaid-bank/get-balance`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            businessId,
            itemId
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        // Check if it's a rate limit
        if (response.status === 429 && data.hoursRemaining) {
          toast.dismiss('refresh-balance');
          toast.error(data.error || `Please wait ${data.hoursRemaining} hours before refreshing balance again.`);
          return;
        }
        
        throw new Error(data.error || 'Failed to refresh balance');
      }

      toast.dismiss('refresh-balance');
      toast.success('Bank balance updated successfully!');

      // Reload accounts to update balance
      await loadConnectedAccounts();

    } catch (error: any) {
      console.error('🔄 Error refreshing balance:', error);
      toast.dismiss('refresh-balance');
      toast.error(error.message || 'Failed to refresh balance');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnectAccount = async (itemId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/plaid-bank/disconnect/${itemId}`,
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

  const handleUpdateTaxLabel = async (itemId: string, taxLabel: 'personal' | 'business') => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/plaid-bank/update-tax-label`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            businessId,
            itemId,
            taxLabel
          })
        }
      );

      if (response.ok) {
        toast.success(`Updated account label to ${taxLabel === 'business' ? 'Business' : 'Personal'}`);
        await loadConnectedAccounts();
      } else {
        throw new Error('Failed to update tax label');
      }
    } catch (error: any) {
      console.error('Error updating tax label:', error);
      toast.error(error.message || 'Failed to update tax label');
    }
  };

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
              Automatically import transactions from your bank account using Plaid's secure connection
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Paid Users - Production Only */}
            {isPaidUser && (
              <Button 
                onClick={() => handleConnectBank(false)} 
                disabled={loading}
                className="w-full bg-success hover:bg-success/90 text-success-foreground shadow-sm transition-all hover:shadow-md"
                size="lg"
              >
                {loading && mode === 'production' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Building2 className="w-4 h-4 mr-2" />
                    Connect Real Bank Account
                  </>
                )}
              </Button>
            )}
            
            {/* Free Users - Demo Only with Upgrade CTA */}
            {isFreeUser && (
              <>
                <div className="p-4 rounded-lg border-2 bg-white dark:bg-gray-900" style={{
                  borderColor: 'var(--energy)',
                  boxShadow: '0 4px 12px rgba(255, 207, 0, 0.2)'
                }}>
                  <div className="flex items-start gap-3 mb-3">
                    <Crown className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--energy)' }} />
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                        Production Bank Connection Requires Upgrade
                      </h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                        Connect your real bank accounts with a Launch, Grow, or Scale plan
                      </p>
                      <Button 
                        onClick={() => navigate('/pricing')}
                        size="sm"
                        className="font-bold"
                        style={{
                          backgroundColor: 'var(--energy)',
                          color: 'var(--energy-foreground)',
                          border: 'none'
                        }}
                      >
                        <Crown className="w-4 h-4 mr-2" />
                        View Plans
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t-2 border-gray-300 dark:border-gray-600" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-3 py-1 bg-white dark:bg-gray-950 text-gray-700 dark:text-gray-300 font-semibold">
                      Try Demo Mode
                    </span>
                  </div>
                </div>
                
                <Button 
                  onClick={() => handleConnectBank(true)} 
                  disabled={loading}
                  variant="outline"
                  className="w-full border-2 font-semibold bg-white dark:bg-gray-900 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
                  size="lg"
                  style={{
                    borderColor: 'var(--accent)'
                  }}
                >
                  {loading && mode === 'demo' ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connecting Demo...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" style={{ color: 'var(--accent)' }} />
                      Try Demo Bank Connection
                    </>
                  )}
                </Button>
                
                <p className="text-sm text-center text-gray-600 dark:text-gray-400 font-medium">
                  Demo mode uses test data to show how bank connections work
                </p>
              </>
            )}
            
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-900 dark:text-blue-200">
                <strong>Secure & Private:</strong> Your bank credentials are never shared with us. 
                Plaid uses bank-level encryption to securely connect your account.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Connected Accounts */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Connected Bank Accounts
                </CardTitle>
                <div className="flex items-center gap-2">
                  {connectedAccounts.length > 1 && (
                    <Button
                      onClick={handleSyncAllTransactions}
                      disabled={syncingAll || syncing}
                      style={{
                        backgroundColor: 'var(--success)',
                        color: 'var(--success-foreground)'
                      }}
                      size="sm"
                    >
                      {syncingAll ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Syncing All...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Sync All ({connectedAccounts.length})
                        </>
                      )}
                    </Button>
                  )}
                  {isPaidUser && (
                    <Button 
                      onClick={() => handleConnectBank(false)} 
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
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {connectedAccounts.map((account) => (
                <div 
                  key={account.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors space-y-3"
                >
                  {/* Account Header Row */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Building2 className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium">{account.institution_name}</p>
                            {/* Demo Badge */}
                            {(account.is_demo || account.environment === 'sandbox') && (
                              <Badge variant="outline" className="bg-[hsl(var(--chart-5)/0.1)] text-[hsl(var(--chart-5))] border-[hsl(var(--chart-5)/0.2)]">
                                <Sparkles className="w-3 h-3 mr-1" />
                                Demo
                              </Badge>
                            )}
                          </div>
                          {account.account_name && (
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm text-muted-foreground">
                                {account.account_name}
                                {account.account_mask && ` ••••${account.account_mask}`}
                              </p>
                              {account.account_subtype && (
                                <Badge variant="outline" className="text-xs">
                                  {account.account_subtype}
                                </Badge>
                              )}
                            </div>
                          )}
                          {account.last_synced && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Last synced: {getRelativeTime(account.last_synced)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons - Stacked Vertically */}
                    <div className="flex flex-col gap-2">
                      {/* Status Badge */}
                      {account.status === 'active' ? (
                        <Badge variant="outline" className="bg-success-soft text-success border-success/20 justify-center">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Connected
                        </Badge>
                      ) : account.status === 'error' ? (
                        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 justify-center">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Error
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-muted text-muted-foreground border-border justify-center">
                          Disconnected
                        </Badge>
                      )}

                      {/* Refresh Balance Button */}
                      <Button
                        onClick={() => handleRefreshBalance(account.item_id)}
                        disabled={loading || account.status !== 'active'}
                        variant="outline"
                        style={{
                          borderRadius: 'var(--radius-md)',
                          padding: 'var(--spacing-2) var(--spacing-3)',
                          fontWeight: 'var(--font-weight-medium)',
                          borderColor: 'var(--color-border)',
                          color: 'var(--color-foreground)'
                        }}
                        className="w-full hover:bg-muted transition-colors"
                        size="sm"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Refreshing...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh Balance
                          </>
                        )}
                      </Button>

                      {/* Load Transactions Button */}
                      <Button
                        onClick={() => handleSyncTransactions(account.item_id)}
                        disabled={syncing || account.status !== 'active'}
                        style={{
                          backgroundColor: 'var(--color-primary)',
                          color: 'var(--color-primary-foreground)',
                          borderRadius: 'var(--radius-md)',
                          padding: 'var(--spacing-2) var(--spacing-3)',
                          fontWeight: 'var(--font-weight-medium)',
                          border: 'none'
                        }}
                        className="w-full hover:opacity-90 transition-opacity"
                        size="sm"
                      >
                        {syncing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4 mr-2" />
                            Load Transactions
                          </>
                        )}
                      </Button>

                      {/* Disconnect Button */}
                      <Button
                        onClick={() => handleDisconnectAccount(account.item_id)}
                        variant="outline"
                        size="sm"
                        className="w-full border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Unlink className="w-4 h-4 mr-2" />
                        Disconnect
                      </Button>
                    </div>
                  </div>
                  
                  {/* Tax Label Selector Row */}
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Tag className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tax Classification:</span>
                    <Select
                      value={account.tax_label || 'business'}
                      onValueChange={(value) => handleUpdateTaxLabel(account.item_id, value as 'personal' | 'business')}
                    >
                      <SelectTrigger className="w-[140px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="business">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-3 h-3" />
                            <span>Business</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="personal">
                          <div className="flex items-center gap-2">
                            <span>Personal</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      (For accurate tax reporting)
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Sync Instructions */}
          <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <CardContent className="py-4 space-y-3">
              <p className="text-sm text-blue-900 dark:text-blue-200">
                <strong>💡 Tip:</strong> Click "Sync Transactions" to import the latest transactions from your bank.
              </p>
              
              {/* Migration Button - Only show if there might be old transactions */}
              <details className="text-sm">
                <summary className="cursor-pointer font-medium text-blue-900 dark:text-blue-100 hover:underline">
                  Transactions not showing? Click here to fix
                </summary>
                <div className="mt-2 space-y-2">
                  <p className="text-blue-800 dark:text-blue-300">
                    If you synced transactions earlier but they're not appearing, click this button to fix the database:
                  </p>
                  <Button
                    onClick={async () => {
                      try {
                        toast.loading('Migrating transactions...', { id: 'migrate' });
                        const { data: { session } } = await supabase.auth.getSession();
                        const response = await fetch(
                          `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/plaid-bank/migrate-transaction-keys`,
                          {
                            method: 'POST',
                            headers: {
                              'Authorization': `Bearer ${session?.access_token}`,
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ businessId })
                          }
                        );
                        const data = await response.json();
                        toast.dismiss('migrate');
                        if (data.success) {
                          toast.success(`Migrated ${data.migrated} transactions! Refresh the page.`);
                          if (onTransactionsImported) onTransactionsImported();
                        } else {
                          toast.error(data.error || 'Migration failed');
                        }
                      } catch (error: any) {
                        toast.dismiss('migrate');
                        toast.error('Migration failed');
                      }
                    }}
                    size="sm"
                    variant="outline"
                    className="border-blue-300 text-blue-900 dark:text-blue-100 hover:bg-blue-100 dark:hover:bg-blue-900"
                  >
                    Fix Missing Transactions
                  </Button>
                </div>
              </details>
            </CardContent>
          </Card>
        </>
      )}

      {/* Floating Exit Button for Mobile when Plaid is Open */}
      {plaidIsOpen && isMobilePlatform && (
        <div className="fixed top-4 left-4 z-[9999]">
          <Button
            onClick={() => {
              // Trigger the exit callback manually
              onExit(null, null);
              toast.info('Plaid connection cancelled');
            }}
            className="bg-red-600 hover:bg-red-700 text-white shadow-lg rounded-full px-6 py-3 flex items-center gap-2"
            size="lg"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Exit Bank Connection
          </Button>
        </div>
      )}
    </div>
  );
}