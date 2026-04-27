import React, { useState, useEffect, useRef } from 'react';
import { Building2, Check, ChevronDown, Users, Crown } from 'lucide-react';
import { Button } from './ui/button';
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

interface Organization {
  organizationId: string;
  role: 'owner' | 'member';
  joinedAt: string;
  ownerEmail: string;
  ownerName: string;
  memberCount?: number;
  businessCount?: number;
}

interface AccountSwitcherProps {
  user: any;
  onOrganizationChanged?: () => void;
}

export function AccountSwitcher({ user, onOrganizationChanged }: AccountSwitcherProps) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrgId, setCurrentOrgId] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      loadOrganizations();
      loadCurrentOrganization();
    }
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadOrganizations = async () => {
    if (!user) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/organizations/list`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setOrganizations(data.organizations || []);
        }
      }
    } catch (error: any) {
      // Network errors are expected when server is not reachable
      // Silently fall back - organizations feature may not be set up yet
      if (error?.name !== 'TypeError' || !error?.message?.includes('Failed to fetch')) {
        console.error('Failed to load organizations:', error);
      }
      setOrganizations([]);
    }
  };

  const loadCurrentOrganization = async () => {
    if (!user) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/organizations/current`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCurrentOrgId(data.organizationId || user.id);
        }
      } else {
        // Silently fall back to user ID if endpoint doesn't exist
        setCurrentOrgId(user.id);
      }
    } catch (error) {
      // Silently fall back to user ID on error (endpoint may not exist yet)
      setCurrentOrgId(user.id);
    }
  };

  const handleSwitchOrganization = async (organizationId: string) => {
    if (organizationId === currentOrgId) {
      setIsOpen(false);
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Please sign in to continue');
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/organizations/switch`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ organizationId })
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setCurrentOrgId(organizationId);
        setIsOpen(false);
        toast.success('Switched organization successfully');
        
        // Notify parent to refresh data
        if (onOrganizationChanged) {
          onOrganizationChanged();
        }

        // Reload the page to refresh all data in new organization context
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        toast.error(data.error || 'Failed to switch organization');
      }
    } catch (error) {
      console.error('Error switching organization:', error);
      toast.error('An error occurred while switching organizations');
    } finally {
      setLoading(false);
    }
  };

  const currentOrg = organizations.find(org => org.organizationId === currentOrgId);
  const isOwner = currentOrg?.role === 'owner';

  if (organizations.length <= 1) {
    // Don't show switcher if user only has one organization
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Current Organization Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 hover:opacity-80 min-w-[200px]"
        style={{
          backgroundColor: 'var(--color-muted)',
          border: '1px solid var(--color-border)',
        }}
      >
        <div
          className="p-1.5 rounded"
          style={{
            backgroundColor: isOwner ? 'var(--color-primary-soft)' : 'var(--color-muted)',
          }}
        >
          {isOwner ? (
            <Crown className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
          ) : (
            <Building2 className="w-4 h-4" style={{ color: 'var(--color-muted-foreground)' }} />
          )}
        </div>
        
        <div className="flex-1 text-left min-w-0">
          <div className="text-sm truncate">
            {isOwner ? 'My Organization' : currentOrg?.ownerName || 'Organization'}
          </div>
          <div className="text-xs truncate" style={{ color: 'var(--color-muted-foreground)' }}>
            {isOwner ? 'Owner' : 'Member'}
          </div>
        </div>

        <ChevronDown 
          className="w-4 h-4 flex-shrink-0 transition-transform"
          style={{ 
            color: 'var(--color-muted-foreground)',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
          }}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute top-full left-0 right-0 mt-2 rounded-lg shadow-lg z-50 overflow-hidden min-w-[280px]"
          style={{
            backgroundColor: 'var(--color-card)',
            border: '1px solid var(--color-border)',
          }}
        >
          {/* Header */}
          <div
            className="px-4 py-3"
            style={{
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            <h3 className="font-semibold text-sm">Switch Organization</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted-foreground)' }}>
              {organizations.length} {organizations.length === 1 ? 'organization' : 'organizations'}
            </p>
          </div>

          {/* Organizations List */}
          <div className="py-2 max-h-80 overflow-y-auto">
            {organizations.map((org) => {
              const isCurrentOrg = org.organizationId === currentOrgId;
              const isOrgOwner = org.role === 'owner';

              return (
                <button
                  key={org.organizationId}
                  onClick={() => handleSwitchOrganization(org.organizationId)}
                  disabled={loading}
                  className="w-full px-4 py-3 flex items-center gap-3 transition-colors hover:opacity-90"
                  style={{
                    backgroundColor: isCurrentOrg ? 'var(--color-muted)' : 'transparent',
                  }}
                >
                  {/* Icon */}
                  <div
                    className="p-2 rounded-lg flex-shrink-0"
                    style={{
                      backgroundColor: isOrgOwner 
                        ? 'var(--color-primary-soft)' 
                        : 'var(--color-muted)',
                    }}
                  >
                    {isOrgOwner ? (
                      <Crown className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
                    ) : (
                      <Building2 className="w-4 h-4" style={{ color: 'var(--color-muted-foreground)' }} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-sm font-medium truncate">
                      {isOrgOwner ? 'My Organization' : org.ownerName}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs truncate" style={{ color: 'var(--color-muted-foreground)' }}>
                        {isOrgOwner ? 'Owner' : `Member of ${org.ownerEmail}`}
                      </span>
                    </div>
                  </div>

                  {/* Check Mark */}
                  {isCurrentOrg && (
                    <Check 
                      className="w-5 h-5 flex-shrink-0" 
                      style={{ color: 'var(--color-primary)' }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer Info */}
          <div
            className="px-4 py-3 text-xs"
            style={{
              backgroundColor: 'var(--color-muted)',
              color: 'var(--color-muted-foreground)',
              borderTop: '1px solid var(--color-border)',
            }}
          >
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>Each organization has separate businesses and credits</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}