import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Checkbox } from './ui/checkbox';
import { 
  Check,
  AlertTriangle,
  CheckCircle,
  RotateCcw,
  Monitor,
  Home,
  TrendingUp,
  CreditCard,
  Package,
  Megaphone,
  Users,
  StickyNote,
  Calendar
} from 'lucide-react';

interface NavOption {
  id: string;
  label: string;
  icon: any;
  path?: string;
}

// All available desktop nav options - NEW STRUCTURE (removed Business OS)
const desktopNavOptions: NavOption[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/dashboard' },
  { id: 'sales', label: 'Sales', icon: TrendingUp, path: '/operations/sales' },
  { id: 'finance', label: 'Finance', icon: CreditCard, path: '/operations/finance' },
  { id: 'marketing', label: 'Marketing', icon: Megaphone, path: '/operations/marketing' },
  { id: 'product', label: 'Product', icon: Package, path: '/operations/product' },
  { id: 'hr', label: 'HR', icon: Users, path: '/operations/hr' },
  { id: 'notes', label: 'Notes', icon: StickyNote, path: '/notes' },
  { id: 'calendar', label: 'Calendar', icon: Calendar, path: '/calendar' }
];

// Default selected options for desktop
const defaultDesktopOptions = ['dashboard', 'sales', 'finance', 'marketing', 'product', 'hr', 'notes', 'calendar'];

interface DesktopNavCustomizationProps {
  user: any;
}

export function DesktopNavCustomization({ user }: DesktopNavCustomizationProps) {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09`;

  useEffect(() => {
    loadPreferences();
  }, [user?.id]);

  const loadPreferences = async () => {
    setLoading(true);
    setError(null);

    try {
      const accessToken = (await supabase.auth.getSession()).data.session?.access_token;

      const response = await fetch(`${serverUrl}/nav-customize/get-desktop`, {
        headers: {
          'Authorization': `Bearer ${accessToken || publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.navOptions && Array.isArray(data.navOptions)) {
          setSelectedOptions(data.navOptions);
        } else {
          setSelectedOptions(defaultDesktopOptions);
        }
      } else {
        setSelectedOptions(defaultDesktopOptions);
      }
    } catch (err: any) {
      console.error('Error loading preferences:', err);
      setSelectedOptions(defaultDesktopOptions);
    } finally {
      setLoading(false);
    }
  };

  const saveConfiguration = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const accessToken = (await supabase.auth.getSession()).data.session?.access_token;

      const response = await fetch(`${serverUrl}/nav-customize/save-desktop`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken || publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          navOptions: selectedOptions
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSuccess('Configuration saved successfully!');
        } else {
          setError(data.error || 'Failed to save configuration');
        }
      } else {
        setError('Failed to save configuration');
      }
    } catch (err: any) {
      setError(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const resetToDefault = async () => {
    setError(null);
    setSuccess(null);

    try {
      const accessToken = (await supabase.auth.getSession()).data.session?.access_token;

      const response = await fetch(`${serverUrl}/nav-customize/reset-desktop`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken || publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.navOptions) {
          setSelectedOptions(data.navOptions);
          setSuccess('Reset complete!');
        } else {
          setError('Failed to reset');
        }
      } else {
        setError('Failed to reset');
      }
    } catch (err: any) {
      setError(`Error: ${err.message}`);
    }
  };

  const toggleOption = (optionId: string) => {
    setSelectedOptions(prev => {
      if (prev.includes(optionId)) {
        return prev.filter(id => id !== optionId);
      } else {
        return [...prev, optionId];
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: 'var(--primary)' }}></div>
          <p style={{ color: 'var(--muted-foreground)' }}>Loading customization...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <Card style={{ borderColor: 'var(--primary)', backgroundColor: 'var(--muted)' }}>
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <Monitor className="h-5 w-5 shrink-0 mt-0.5" style={{ color: 'var(--primary)' }} />
            <div className="text-sm">
              <p style={{ fontWeight: 'var(--font-weight-medium)', marginBottom: 'var(--spacing-1)' }}>
                Desktop Customization
              </p>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                Customize your desktop navigation. Select pages to show in the main navigation.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Options */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-sm mb-4" style={{ fontWeight: 'var(--font-weight-medium)' }}>
            Select Navigation Pages
          </h3>
          <div className="space-y-3">
            {desktopNavOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = selectedOptions.includes(option.id);
              
              return (
                <label
                  key={option.id}
                  className="flex items-center gap-3 p-3 rounded cursor-pointer transition-colors"
                  style={{
                    backgroundColor: isSelected ? 'var(--muted)' : 'transparent',
                    border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                  }}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleOption(option.id)}
                  />
                  <Icon className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
                  <span className="text-sm" style={{ fontWeight: 'var(--font-weight-normal)' }}>
                    {option.label}
                  </span>
                </label>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={saveConfiguration}
          disabled={saving}
          className="flex-1"
          style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 mr-2" style={{ borderColor: 'currentColor' }}></div>
              Saving...
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              Save Configuration
            </>
          )}
        </Button>

        <Button
          onClick={resetToDefault}
          variant="outline"
          disabled={saving}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset
        </Button>
      </div>

      {/* Status Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert style={{ borderColor: 'var(--success)', backgroundColor: 'rgba(108, 255, 108, 0.1)' }}>
          <CheckCircle className="h-4 w-4" style={{ color: 'var(--success)' }} />
          <AlertDescription className="text-sm" style={{ color: 'var(--foreground)' }}>
            {success}
          </AlertDescription>
        </Alert>
      )}

      {/* Info Text */}
      <div className="text-center text-xs" style={{ color: 'var(--muted-foreground)' }}>
        <p>Fixed items (always shown): Integrations • Settings • Support • Sign Out</p>
      </div>
    </div>
  );
}

export default DesktopNavCustomization;
