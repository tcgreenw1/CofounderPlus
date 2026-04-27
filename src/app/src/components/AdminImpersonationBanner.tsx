import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Shield, ArrowLeft, AlertTriangle } from 'lucide-react';
import { supabase } from '../utils/supabase/client';
import { toast } from 'sonner@2.0.3';

export function AdminImpersonationBanner() {
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonatedEmail, setImpersonatedEmail] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    // Check if we're in impersonation mode
    const impersonationActive = localStorage.getItem('admin_impersonation_active') === 'true';
    const adminBackup = localStorage.getItem('admin_session_backup');
    
    if (impersonationActive && adminBackup) {
      setIsImpersonating(true);
      
      // Get current session (impersonated user)
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user?.email) {
          setImpersonatedEmail(session.user.email);
        }
      });
      
      // Get admin email from backup
      try {
        const backup = JSON.parse(adminBackup);
        setAdminEmail(backup.user_email || 'Admin');
      } catch (e) {
        console.error('Failed to parse admin backup:', e);
      }
    }
  }, []);

  const handleExitImpersonation = async () => {
    if (exiting) return;
    
    setExiting(true);
    toast.loading('Returning to admin account...');

    try {
      // Get the backed up admin session
      const adminBackup = localStorage.getItem('admin_session_backup');
      
      if (!adminBackup) {
        throw new Error('Admin session backup not found');
      }

      const backup = JSON.parse(adminBackup);
      
      // Sign out current user
      await supabase.auth.signOut();
      
      // Sign back in as admin using the refresh token
      const { data, error } = await supabase.auth.setSession({
        access_token: backup.access_token,
        refresh_token: backup.refresh_token,
      });

      if (error) {
        throw error;
      }

      // Clear impersonation flags
      localStorage.removeItem('admin_impersonation_active');
      localStorage.removeItem('admin_session_backup');

      toast.success(`Returned to ${adminEmail} account`);
      
      // Navigate back to admin portal
      setTimeout(() => {
        window.location.href = '/admin';
      }, 500);

    } catch (error) {
      console.error('Error exiting impersonation:', error);
      toast.error('Failed to return to admin account. Please sign in again.');
      
      // Clear everything and force logout
      localStorage.clear();
      await supabase.auth.signOut();
      
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } finally {
      setExiting(false);
    }
  };

  if (!isImpersonating) {
    return null;
  }

  return (
    <div 
      className="fixed top-0 left-0 right-0 z-[9999] backdrop-blur-md border-b shadow-lg"
      style={{
        backgroundColor: 'rgba(239, 68, 68, 0.95)',
        borderBottomColor: 'rgba(220, 38, 38, 0.5)',
        padding: 'var(--spacing-3) var(--spacing-4)',
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center rounded-full bg-white/20 p-2">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span 
                className="text-white"
                style={{ 
                  fontWeight: 'var(--font-weight-bold)',
                  fontSize: '0.875rem',
                }}
              >
                Admin View Mode
              </span>
              <AlertTriangle className="w-4 h-4 text-white animate-pulse" />
            </div>
            <span 
              className="text-white/90 text-xs"
            >
              Viewing as: <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>{impersonatedEmail}</span>
            </span>
          </div>
        </div>

        <Button
          onClick={handleExitImpersonation}
          disabled={exiting}
          className="flex items-center gap-2 bg-white hover:bg-gray-100 text-red-600 border-0 shadow-lg"
          style={{
            padding: 'var(--spacing-2) var(--spacing-4)',
            borderRadius: 'var(--radius-lg)',
            fontWeight: 'var(--font-weight-semibold)',
            fontSize: '0.875rem',
          }}
        >
          <ArrowLeft className="w-4 h-4" />
          Exit & Return to Admin
        </Button>
      </div>
    </div>
  );
}
