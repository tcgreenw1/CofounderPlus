import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Github, Copy, CheckCircle2, AlertCircle, ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface GitHubOAuthSetupProps {
  userId?: string;
  onConnected?: () => void;
}

export function GitHubOAuthSetup({ userId, onConnected }: GitHubOAuthSetupProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [configStatus, setConfigStatus] = useState<any>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [copiedCallback, setCopiedCallback] = useState(false);
  const [copiedHomepage, setCopiedHomepage] = useState(false);

  // The callback URL that needs to be configured in GitHub OAuth App
  const callbackUrl = 'https://www.cofounderplus.com/cofounder-make/github-callback';
  const homepageUrl = 'https://www.cofounderplus.com';

  useEffect(() => {
    checkConfigAndStatus();
  }, [userId]);

  const checkConfigAndStatus = async () => {
    try {
      // Check config
      const configRes = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/github/config-test`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );
      const config = await configRes.json();
      setConfigStatus(config);

      // Check connection status if we have a userId
      if (userId) {
        const statusRes = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/github/status?userId=${userId}`,
          {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`
            }
          }
        );
        
        if (!statusRes.ok) {
          console.debug('GitHub status check returned non-OK status:', statusRes.status);
        } else {
          const status = await statusRes.json();
          
          if (status.connected) {
            setIsConnected(true);
            setUserInfo(status);
          }
        }
      }
    } catch (error) {
      console.debug('Error checking GitHub OAuth status (this is normal if not configured):', error);
    }
  };

  const copyToClipboard = async (text: string, type: 'callback' | 'homepage') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'callback') {
        setCopiedCallback(true);
        setTimeout(() => setCopiedCallback(false), 2000);
      } else {
        setCopiedHomepage(true);
        setTimeout(() => setCopiedHomepage(false), 2000);
      }
      toast.success('Copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const connectGitHub = async () => {
    if (!userId) {
      toast.error('User ID is required to connect GitHub');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/github/auth-url?userId=${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );

      const data = await response.json();

      if (data.success && data.authUrl) {
        // Open GitHub OAuth in popup or redirect
        window.location.href = data.authUrl;
      } else {
        toast.error(data.error || 'Failed to get GitHub authorization URL');
      }
    } catch (error: any) {
      console.error('Error connecting to GitHub:', error);
      toast.error(error.message || 'Failed to connect to GitHub');
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectGitHub = async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/github/disconnect`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ userId })
        }
      );

      const data = await response.json();

      if (data.success) {
        setIsConnected(false);
        setUserInfo(null);
        toast.success('GitHub disconnected successfully');
      } else {
        toast.error(data.error || 'Failed to disconnect GitHub');
      }
    } catch (error: any) {
      console.error('Error disconnecting from GitHub:', error);
      toast.error(error.message || 'Failed to disconnect from GitHub');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Configuration Status */}
      <Card style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github className="size-5" />
            GitHub OAuth Configuration
          </CardTitle>
          <CardDescription>
            Connect your GitHub account to access repositories and automation features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Config Status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span style={{ color: 'var(--muted-foreground)' }}>Configuration Status</span>
              {configStatus?.configured?.hasClientId && configStatus?.configured?.hasClientSecret ? (
                <Badge 
                  style={{ 
                    background: 'var(--success-soft)', 
                    color: 'var(--success)',
                    borderColor: 'var(--success)'
                  }}
                  className="flex items-center gap-1"
                >
                  <CheckCircle2 className="size-3" />
                  Configured
                </Badge>
              ) : (
                <Badge 
                  variant="destructive"
                  className="flex items-center gap-1"
                >
                  <AlertCircle className="size-3" />
                  Not Configured
                </Badge>
              )}
            </div>

            {configStatus?.message && (
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                {configStatus.message}
              </p>
            )}
          </div>

          {/* Connection Status */}
          {userId && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span style={{ color: 'var(--muted-foreground)' }}>Connection Status</span>
                {isConnected ? (
                  <Badge 
                    style={{ 
                      background: 'var(--success-soft)', 
                      color: 'var(--success)',
                      borderColor: 'var(--success)'
                    }}
                    className="flex items-center gap-1"
                  >
                    <CheckCircle2 className="size-3" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="outline">Not Connected</Badge>
                )}
              </div>

              {isConnected && userInfo && (
                <div 
                  className="p-3 rounded-lg space-y-2"
                  style={{ background: 'var(--muted)' }}
                >
                  <div className="flex items-center gap-3">
                    {userInfo.avatarUrl && (
                      <img 
                        src={userInfo.avatarUrl} 
                        alt={userInfo.username}
                        className="size-10 rounded-full"
                      />
                    )}
                    <div className="flex-1">
                      <p>{userInfo.name || userInfo.username}</p>
                      <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                        @{userInfo.username}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(userInfo.profileUrl, '_blank')}
                    >
                      <ExternalLink className="size-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Connect/Disconnect Button */}
          {userId && (
            <div className="pt-2">
              {isConnected ? (
                <Button
                  variant="outline"
                  onClick={disconnectGitHub}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading && <Loader2 className="size-4 mr-2 animate-spin" />}
                  Disconnect GitHub
                </Button>
              ) : (
                <Button
                  onClick={connectGitHub}
                  disabled={isLoading || !configStatus?.configured?.hasClientId}
                  className="w-full"
                >
                  {isLoading && <Loader2 className="size-4 mr-2 animate-spin" />}
                  <Github className="size-4 mr-2" />
                  Connect GitHub Account
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Setup Instructions */}
      <Card style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
          <CardDescription>
            Configure your GitHub OAuth App with these settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <p className="text-sm" style={{ color: 'var(--foreground)' }}>
              <strong>Step 1:</strong> Go to{' '}
              <a 
                href="https://github.com/settings/developers" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1"
                style={{ color: 'var(--primary)' }}
              >
                GitHub Developer Settings
                <ExternalLink className="size-3" />
              </a>
            </p>

            <p className="text-sm" style={{ color: 'var(--foreground)' }}>
              <strong>Step 2:</strong> Click "New OAuth App" (or edit existing app)
            </p>

            <p className="text-sm" style={{ color: 'var(--foreground)' }}>
              <strong>Step 3:</strong> Configure the following URLs:
            </p>

            {/* Homepage URL */}
            <div className="space-y-2">
              <label className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                Homepage URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={homepageUrl}
                  readOnly
                  className="flex-1 px-3 py-2 rounded-lg text-sm"
                  style={{
                    background: 'var(--input-background)',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: 'var(--border)',
                    color: 'var(--foreground)'
                  }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(homepageUrl, 'homepage')}
                >
                  {copiedHomepage ? (
                    <CheckCircle2 className="size-4" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Callback URL */}
            <div className="space-y-2">
              <label className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                Authorization Callback URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={callbackUrl}
                  readOnly
                  className="flex-1 px-3 py-2 rounded-lg text-sm"
                  style={{
                    background: 'var(--input-background)',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: 'var(--border)',
                    color: 'var(--foreground)'
                  }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(callbackUrl, 'callback')}
                >
                  {copiedCallback ? (
                    <CheckCircle2 className="size-4" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </Button>
              </div>
            </div>

            <p className="text-sm" style={{ color: 'var(--foreground)' }}>
              <strong>Step 4:</strong> After creating the OAuth App, copy the <strong>Client ID</strong> and <strong>Client Secret</strong>
            </p>

            <p className="text-sm" style={{ color: 'var(--foreground)' }}>
              <strong>Step 5:</strong> Add these credentials to your Supabase environment variables:
              <br />
              • <code style={{ background: 'var(--muted)', padding: '2px 6px', borderRadius: '4px' }}>
                GITHUB_CLIENT_ID
              </code>
              <br />
              • <code style={{ background: 'var(--muted)', padding: '2px 6px', borderRadius: '4px' }}>
                GITHUB_CLIENT_SECRET
              </code>
            </p>

            <div 
              className="p-3 rounded-lg text-sm space-y-1"
              style={{ 
                background: 'var(--primary-soft)',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'var(--border)'
              }}
            >
              <p style={{ color: 'var(--foreground)' }}>
                <strong>Note:</strong> The OAuth App will request the following scopes:
              </p>
              <ul className="list-disc list-inside ml-2" style={{ color: 'var(--muted-foreground)' }}>
                <li>repo - Access to repositories</li>
                <li>read:user - Read user profile</li>
                <li>user:email - Access email addresses</li>
                <li>read:org - Read organization info</li>
                <li>workflow - Manage GitHub Actions</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
