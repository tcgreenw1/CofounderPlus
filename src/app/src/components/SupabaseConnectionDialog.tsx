/**
 * Supabase Connection Dialog for Cofounder Make
 * 
 * Allows users to connect their own Supabase project
 */

import React, { useState } from 'react';
import { X, Database, ExternalLink, Info } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner@2.0.3';
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';

interface SupabaseConnectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: () => void;
  isConnected?: boolean;
  userProjectId?: string;
  onDisconnect?: () => void;
}

export function SupabaseConnectionDialog({ 
  isOpen, 
  onClose, 
  onConnect,
  isConnected = false,
  userProjectId = '',
  onDisconnect
}: SupabaseConnectionDialogProps) {
  const [projectUrl, setProjectUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [serviceRoleKey, setServiceRoleKey] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  if (!isOpen) return null;

  const handleConnect = async () => {
    if (!projectUrl.trim() || !anonKey.trim()) {
      toast.error('Project URL and Anon Key are required');
      return;
    }

    setIsConnecting(true);

    try {
      console.log('🔐 Getting Supabase session...');
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      console.log('🔐 Session retrieved:', session ? '✅ Found' : '❌ Not found');
      console.log('🔐 Token:', token ? '✅ Present' : '❌ Missing');
      
      if (!token) {
        console.error('❌ No access token found. User may not be logged in.');
        toast.error('You must be logged in to connect Supabase');
        setIsConnecting(false);
        return;
      }

      console.log('📡 Sending connection request to server...');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/supabase-oauth/connect-manual`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            projectUrl: projectUrl.trim(),
            anonKey: anonKey.trim(),
            serviceRoleKey: serviceRoleKey.trim() || undefined,
          }),
        }
      );

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
      
      const data = await response.json();
      console.log('📡 Response data:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to connect Supabase');
      }

      toast.success('Supabase connected successfully!');
      onConnect();
      onClose();

      // Reset form
      setProjectUrl('');
      setAnonKey('');
      setServiceRoleKey('');

    } catch (error: any) {
      console.error('❌ Error connecting Supabase:', error);
      toast.error(error.message || 'Failed to connect Supabase');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        toast.error('You must be logged in to disconnect Supabase');
        setIsDisconnecting(false);
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/supabase-oauth/disconnect`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to disconnect Supabase');
      }

      toast.success('Supabase disconnected successfully');
      if (onDisconnect) {
        onDisconnect();
      }
      onClose();

    } catch (error: any) {
      console.error('❌ Error disconnecting Supabase:', error);
      toast.error(error.message || 'Failed to disconnect Supabase');
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--spacing-6)',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: 'var(--spacing-6)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
            <Database 
              className="size-6" 
              style={{ color: 'var(--primary)' }}
            />
            <h2 style={{ 
              margin: 0,
              fontWeight: 'var(--font-weight-bold)',
            }}>
              {isConnected ? 'Supabase Project' : 'Connect Your Supabase Project'}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 'var(--spacing-2)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-secondary)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--surface-secondary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Connected Status or Info Banner */}
        {isConnected ? (
          <div style={{
            backgroundColor: 'var(--success-alpha-10)',
            border: '1px solid var(--success-alpha-20)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--spacing-4)',
            marginBottom: 'var(--spacing-6)',
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 'var(--spacing-3)',
              marginBottom: 'var(--spacing-3)',
            }}>
              <Database className="size-5" style={{ color: 'var(--success)' }} />
              <div>
                <p style={{ 
                  margin: 0,
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--success)',
                }}>
                  Supabase Connected
                </p>
                <p style={{ 
                  margin: 0,
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                  marginTop: 'var(--spacing-1)',
                }}>
                  Project ID: <code style={{ fontFamily: 'var(--font-mono)' }}>{userProjectId}</code>
                </p>
              </div>
            </div>
            <p style={{ 
              margin: 0,
              fontSize: '14px',
              lineHeight: 1.5,
            }}>
              Your apps built with Cofounder Make will use this Supabase project for backend features.
            </p>
          </div>
        ) : (
          <div style={{
            backgroundColor: 'var(--primary-alpha-10)',
            border: '1px solid var(--primary-alpha-20)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--spacing-4)',
            marginBottom: 'var(--spacing-6)',
            display: 'flex',
            gap: 'var(--spacing-3)',
          }}>
            <Info className="size-5" style={{ 
              color: 'var(--primary)',
              flexShrink: 0,
              marginTop: '2px',
            }} />
            <div style={{ fontSize: '14px', lineHeight: 1.5 }}>
              <p style={{ margin: 0, marginBottom: 'var(--spacing-2)' }}>
                Connect your Supabase project to enable backend features for your apps built with Cofounder Make.
              </p>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                Your credentials are securely stored and only used for your projects.
              </p>
            </div>
          </div>
        )}

        {/* Form - Only show if not connected */}
        {!isConnected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-5)' }}>
          {/* Project URL */}
          <div>
            <Label htmlFor="projectUrl" style={{ 
              display: 'block',
              marginBottom: 'var(--spacing-2)',
              fontWeight: 'var(--font-weight-medium)',
            }}>
              Project URL *
            </Label>
            <Input
              id="projectUrl"
              type="url"
              placeholder="https://your-project.supabase.co"
              value={projectUrl}
              onChange={(e) => setProjectUrl(e.target.value)}
              disabled={isConnecting}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '14px',
              }}
            />
            <p style={{ 
              margin: 0,
              marginTop: 'var(--spacing-2)',
              fontSize: '13px',
              color: 'var(--text-secondary)',
            }}>
              Find this in your Supabase project settings
            </p>
          </div>

          {/* Anon Key */}
          <div>
            <Label htmlFor="anonKey" style={{ 
              display: 'block',
              marginBottom: 'var(--spacing-2)',
              fontWeight: 'var(--font-weight-medium)',
            }}>
              Anon Key *
            </Label>
            <Input
              id="anonKey"
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              disabled={isConnecting}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
              }}
            />
            <p style={{ 
              margin: 0,
              marginTop: 'var(--spacing-2)',
              fontSize: '13px',
              color: 'var(--text-secondary)',
            }}>
              Your public anon key (safe to use in frontend code)
            </p>
          </div>

          {/* Service Role Key (Optional) */}
          <div>
            <Label htmlFor="serviceRoleKey" style={{ 
              display: 'block',
              marginBottom: 'var(--spacing-2)',
              fontWeight: 'var(--font-weight-medium)',
            }}>
              Service Role Key <span style={{ 
                color: 'var(--text-secondary)',
                fontWeight: 'normal',
              }}>(Optional)</span>
            </Label>
            <Input
              id="serviceRoleKey"
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={serviceRoleKey}
              onChange={(e) => setServiceRoleKey(e.target.value)}
              disabled={isConnecting}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
              }}
            />
            <p style={{ 
              margin: 0,
              marginTop: 'var(--spacing-2)',
              fontSize: '13px',
              color: 'var(--text-secondary)',
            }}>
              Required for server-side features and admin operations
            </p>
          </div>

          {/* Help Link */}
          <a
            href="https://supabase.com/dashboard/project/_/settings/api"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-2)',
              color: 'var(--primary)',
              textDecoration: 'none',
              fontSize: '14px',
              padding: 'var(--spacing-3)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--primary-alpha-5)',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--primary-alpha-10)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--primary-alpha-5)';
            }}
          >
            <ExternalLink className="size-4" />
            <span>Find your API credentials in Supabase Dashboard</span>
          </a>
        </div>
        )}

        {/* Actions */}
        <div style={{
          display: 'flex',
          gap: 'var(--spacing-3)',
          marginTop: 'var(--spacing-6)',
          justifyContent: 'flex-end',
        }}>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isConnecting || isDisconnecting}
          >
            {isConnected ? 'Close' : 'Cancel'}
          </Button>
          {isConnected ? (
            <Button
              variant="outline"
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              style={{
                borderColor: 'var(--destructive)',
                color: 'var(--destructive)',
              }}
            >
              {isDisconnecting ? (
                <>
                  <div 
                    className="size-4 border-2 border-current/20 border-t-current rounded-full"
                    style={{ animation: 'spin 1s linear infinite' }}
                  />
                  Disconnecting...
                </>
              ) : (
                <>
                  <X className="size-4" />
                  Disconnect
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleConnect}
              disabled={isConnecting || !projectUrl || !anonKey}
              style={{
                background: 'var(--primary)',
                color: 'white',
              }}
            >
              {isConnecting ? (
                <>
                  <div 
                    className="size-4 border-2 border-white/20 border-t-white rounded-full"
                    style={{ animation: 'spin 1s linear infinite' }}
                  />
                  Connecting...
                </>
              ) : (
                <>
                  <Database className="size-4" />
                  Connect Supabase
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}