import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Bell, 
  BellOff,
  UserPlus, 
  Bot, 
  ListTodo,
  Clock,
  Megaphone,
  DollarSign,
  ShoppingCart,
  Briefcase,
  Check,
  Smartphone,
  Volume2,
  VolumeX,
  Send,
  Wrench
} from 'lucide-react';
import { toast } from 'sonner';
import { projectId } from '../utils/supabase/info';
import { getSupabaseClient } from '../utils/supabase/client';
import { useNotifications } from '../contexts/NotificationContext';
import { checkPushNotificationStatus, requestPushPermissionAgain } from '../utils/pushNotifications';

interface NotificationPreferences {
  enabled: boolean;
  teamInvitations: boolean;
  cofounderUpdates: boolean;
  automationResults: boolean;
  taskReminders: boolean;
  deadlineAlerts: boolean;
  marketingInsights: boolean;
  financeAlerts: boolean;
  salesUpdates: boolean;
  operationsNotifications: boolean;
  supportTicketUpdates: boolean;
  soundEnabled: boolean;
  badgeEnabled: boolean;
  alertStyle: 'banner' | 'alert' | 'none';
}

export function NotificationSettings() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    enabled: true,
    teamInvitations: true,
    cofounderUpdates: true,
    automationResults: true,
    taskReminders: true,
    deadlineAlerts: true,
    marketingInsights: true,
    financeAlerts: true,
    salesUpdates: true,
    operationsNotifications: true,
    supportTicketUpdates: true,
    soundEnabled: true,
    badgeEnabled: true,
    alertStyle: 'banner'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deviceRegistered, setDeviceRegistered] = useState(false);
  const [testingNotifications, setTestingNotifications] = useState<Set<string>>(new Set());
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const [diagnosticData, setDiagnosticData] = useState<any>(null);
  const [loadingDiagnostic, setLoadingDiagnostic] = useState(false);
  const { addNotification } = useNotifications();

  useEffect(() => {
    loadPreferences();
    checkDeviceRegistration();
  }, []);

  const loadPreferences = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await getSupabaseClient().auth.getSession();
      if (!session?.access_token) {
        console.error('No session found');
        setLoading(false);
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/push/preferences`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          }
        }
      );

      const data = await response.json();
      
      if (response.ok && data.success) {
        setPreferences(data.preferences);
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkDeviceRegistration = () => {
    // Check if running in Capacitor (iOS app)
    if (typeof (window as any).Capacitor !== 'undefined') {
      setDeviceRegistered(true);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      const { data: { session } } = await getSupabaseClient().auth.getSession();
      if (!session?.access_token) {
        toast.error('Please sign in to update preferences');
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/push/preferences`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(preferences)
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Notification preferences saved');
      } else {
        toast.error(data.error || 'Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('An error occurred while saving preferences');
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const toggleAll = () => {
    const newEnabled = !preferences.enabled;
    setPreferences(prev => ({
      ...prev,
      enabled: newEnabled
    }));
  };

  const testNotification = async (category: any) => {
    setTestingNotifications(prev => new Set(prev).add(category.id));
    
    try {
      // Create test messages for each category
      const testMessages: Record<string, { title: string; message: string; type: 'success' | 'info' | 'warning' | 'error'; category?: string }> = {
        teamInvitations: {
          title: 'Team Invitation',
          message: 'Sarah Johnson invited you to join the "Marketing Team" workspace',
          type: 'info',
          category: 'system'
        },
        cofounderUpdates: {
          title: 'Cofounder Insight',
          message: 'Your Q4 revenue projections look strong! Consider expanding your sales team.',
          type: 'success',
          category: 'system'
        },
        automationResults: {
          title: 'Automation Complete',
          message: 'Product roadmap refresh completed successfully. 15 new insights generated.',
          type: 'success',
          category: 'operations'
        },
        taskReminders: {
          title: 'Task Due Soon',
          message: 'Reminder: "Review Q4 Budget Proposal" is due tomorrow at 3:00 PM',
          type: 'info',
          category: 'operations'
        },
        deadlineAlerts: {
          title: 'Deadline Alert',
          message: 'Project "Mobile App Launch" milestone is due in 2 days',
          type: 'warning',
          category: 'operations'
        },
        marketingInsights: {
          title: 'Campaign Performance',
          message: 'Your email campaign "Summer Sale 2024" achieved a 45% open rate!',
          type: 'success',
          category: 'marketing'
        },
        financeAlerts: {
          title: 'Budget Update',
          message: 'Q4 spending is at 75% of allocated budget with 3 weeks remaining',
          type: 'info',
          category: 'finance'
        },
        salesUpdates: {
          title: 'New Lead',
          message: 'High-value lead "Acme Corp" just requested a demo ($250K opportunity)',
          type: 'success',
          category: 'sales'
        },
        operationsNotifications: {
          title: 'Process Update',
          message: 'Inventory sync completed. 5 products need reordering this week.',
          type: 'info',
          category: 'operations'
        },
        supportTicketUpdates: {
          title: 'Support Ticket Update',
          message: 'A new support ticket has been assigned to you.',
          type: 'info',
          category: 'support'
        }
      };

      const testData = testMessages[category.id as keyof typeof testMessages];
      
      // Add to in-app notifications
      addNotification(testData);
      
      // Try to send push notification to backend
      try {
        const { data: { session } } = await getSupabaseClient().auth.getSession();
        if (session?.access_token) {
          // Map category ID to backend category format
          const categoryMap: Record<string, string> = {
            teamInvitations: 'team_invitation',
            cofounderUpdates: 'cofounder_notification',
            automationResults: 'automation_completed',
            taskReminders: 'task',
            deadlineAlerts: 'deadline',
            marketingInsights: 'marketing',
            financeAlerts: 'finance',
            salesUpdates: 'sales',
            operationsNotifications: 'operations',
            supportTicketUpdates: 'support'
          };

          await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notifications/test`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                title: testData.title,
                message: testData.message,
                category: categoryMap[category.id] || 'system',
                icon: category.label,
                color: category.color
              })
            }
          );
        }
      } catch (pushError) {
        console.log('Push notification not sent:', pushError);
        // Don't show error to user - in-app notification still works
      }
      
      toast.success('Test notification sent!', {
        description: `Check your notifications to see how "${category.label}" will appear`
      });
      
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast.error('Failed to send test notification');
    } finally {
      setTimeout(() => {
        setTestingNotifications(prev => {
          const newSet = new Set(prev);
          newSet.delete(category.id);
          return newSet;
        });
      }, 1000);
    }
  };

  if (loading) {
    return (
      <Card style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
        <CardContent style={{ padding: 'var(--spacing-6)' }}>
          <p style={{ color: 'var(--muted-foreground)', textAlign: 'center' }}>
            Loading notification settings...
          </p>
        </CardContent>
      </Card>
    );
  }

  const notificationCategories = [
    {
      id: 'teamInvitations',
      label: 'Team Invitations',
      description: 'Get notified when someone invites you to join their team',
      icon: UserPlus,
      color: '#2b7fff'
    },
    {
      id: 'cofounderUpdates',
      label: 'Cofounder Updates',
      description: 'Important insights and recommendations from your Cofounder',
      icon: Bot,
      color: '#6c5ce7'
    },
    {
      id: 'automationResults',
      label: 'Automation Results',
      description: 'Updates when automations complete',
      icon: Bot,
      color: '#00a73d'
    },
    {
      id: 'taskReminders',
      label: 'Task Reminders',
      description: 'Reminders for upcoming tasks and to-dos',
      icon: ListTodo,
      color: '#2b7fff'
    },
    {
      id: 'deadlineAlerts',
      label: 'Deadline Alerts',
      description: 'Alerts for approaching or missed deadlines',
      icon: Clock,
      color: '#ffe020'
    },
    {
      id: 'marketingInsights',
      label: 'Marketing Insights',
      description: 'Marketing campaign updates and insights',
      icon: Megaphone,
      color: '#6CFF6C'
    },
    {
      id: 'financeAlerts',
      label: 'Finance Alerts',
      description: 'Financial updates and budget notifications',
      icon: DollarSign,
      color: '#00E0FF'
    },
    {
      id: 'salesUpdates',
      label: 'Sales Updates',
      description: 'New leads, deals, and sales opportunities',
      icon: ShoppingCart,
      color: '#FFCF00'
    },
    {
      id: 'operationsNotifications',
      label: 'Operations',
      description: 'Operational updates and process notifications',
      icon: Briefcase,
      color: '#9333EA'
    },
    {
      id: 'supportTicketUpdates',
      label: 'Support Tickets',
      description: 'Updates on support tickets assigned to you',
      icon: Wrench,
      color: '#FF6347'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card style={{ 
        backgroundColor: 'var(--card)', 
        borderColor: 'var(--border)',
        borderRadius: 'var(--radius)'
      }}>
        <CardContent style={{ padding: 'var(--spacing-6)' }}>
          <div className="flex items-start justify-between" style={{ gap: 'var(--spacing-4)' }}>
            <div className="flex items-start" style={{ gap: 'var(--spacing-4)' }}>
              <div
                className="p-3 rounded-xl"
                style={{
                  backgroundColor: preferences.enabled ? 'var(--success-soft)' : 'var(--muted)',
                }}
              >
                {preferences.enabled ? (
                  <Bell className="w-6 h-6" style={{ color: 'var(--success)' }} />
                ) : (
                  <BellOff className="w-6 h-6" style={{ color: 'var(--muted-foreground)' }} />
                )}
              </div>
              
              <div>
                <h3 style={{ 
                  fontWeight: 'var(--font-weight-semibold)',
                  marginBottom: 'var(--spacing-1)'
                }}>
                  Push Notifications
                </h3>
                <p style={{ 
                  color: 'var(--muted-foreground)',
                  fontSize: '0.875rem',
                  marginBottom: 'var(--spacing-2)'
                }}>
                  Manage how you receive notifications on your iOS device
                </p>
                
                {deviceRegistered && (
                  <Badge 
                    style={{
                      backgroundColor: 'var(--success-soft)',
                      color: 'var(--success)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-2)'
                    }}
                  >
                    <Smartphone className="w-3 h-3" />
                    Device Connected
                  </Badge>
                )}
              </div>
            </div>

            <Button
              onClick={toggleAll}
              style={{
                backgroundColor: preferences.enabled ? 'var(--muted)' : 'var(--primary)',
                color: preferences.enabled ? 'var(--foreground)' : 'var(--primary-foreground)',
              }}
              className="hover:opacity-90 transition-opacity"
            >
              {preferences.enabled ? 'Disable All' : 'Enable All'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notification Categories */}
      <Card style={{ 
        backgroundColor: 'var(--card)', 
        borderColor: 'var(--border)',
        borderRadius: 'var(--radius)'
      }}>
        <CardContent style={{ padding: 'var(--spacing-6)' }}>
          <h4 style={{ 
            fontWeight: 'var(--font-weight-semibold)',
            marginBottom: 'var(--spacing-4)'
          }}>
            Notification Types
          </h4>

          <div className="space-y-4">
            {notificationCategories.map((category) => {
              const Icon = category.icon;
              const isEnabled = preferences[category.id as keyof NotificationPreferences] as boolean;
              const isTesting = testingNotifications.has(category.id);
              
              return (
                <div
                  key={category.id}
                  style={{ 
                    padding: 'var(--spacing-4)',
                    borderRadius: 'var(--radius)',
                    backgroundColor: isEnabled ? 'transparent' : 'var(--muted)',
                    border: `1px solid ${isEnabled ? category.color + '40' : 'var(--border)'}`,
                    opacity: preferences.enabled && isEnabled ? 1 : 0.6,
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div className="flex items-center justify-between" style={{ marginBottom: 'var(--spacing-3)' }}>
                    <div className="flex items-start" style={{ gap: 'var(--spacing-3)', flex: 1 }}>
                      <div
                        className="p-2 rounded-lg"
                        style={{
                          background: `linear-gradient(135deg, ${category.color}20, ${category.color}10)`,
                          border: `1px solid ${category.color}40`,
                        }}
                      >
                        <Icon className="w-5 h-5" style={{ color: category.color }} />
                      </div>
                      
                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          fontWeight: 'var(--font-weight-medium)',
                          marginBottom: 'var(--spacing-1)'
                        }}>
                          {category.label}
                        </div>
                        <div style={{ 
                          fontSize: '0.8125rem',
                          color: 'var(--muted-foreground)'
                        }}>
                          {category.description}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => updatePreference(category.id as keyof NotificationPreferences, !isEnabled)}
                      disabled={!preferences.enabled}
                      style={{
                        width: '48px',
                        height: '28px',
                        borderRadius: '14px',
                        backgroundColor: isEnabled && preferences.enabled ? category.color : 'var(--switch-background)',
                        border: 'none',
                        position: 'relative',
                        cursor: preferences.enabled ? 'pointer' : 'not-allowed',
                        transition: 'background-color 0.2s ease',
                        flexShrink: 0
                      }}
                    >
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '12px',
                          backgroundColor: 'white',
                          position: 'absolute',
                          top: '2px',
                          left: isEnabled && preferences.enabled ? '22px' : '2px',
                          transition: 'left 0.2s ease',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {isEnabled && preferences.enabled && (
                          <Check className="w-3 h-3" style={{ color: category.color }} />
                        )}
                      </div>
                    </button>
                  </div>
                  
                  {/* Test Button - Hidden */}
                  {/* 
                  <Button
                    onClick={() => testNotification(category)}
                    disabled={isTesting}
                    size="sm"
                    style={{
                      width: '100%',
                      backgroundColor: 'transparent',
                      color: category.color,
                      border: `1px solid ${category.color}40`,
                      height: '32px',
                      fontSize: '0.8125rem'
                    }}
                    className="hover:opacity-80 transition-opacity"
                  >
                    {isTesting ? (
                      <>
                        <div 
                          className="animate-spin mr-2" 
                          style={{ 
                            width: '12px', 
                            height: '12px',
                            border: `2px solid ${category.color}40`,
                            borderTopColor: category.color,
                            borderRadius: '50%'
                          }}
                        />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-3 h-3 mr-2" />
                        Test Notification
                      </>
                    )}
                  </Button>
                  */}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Sound & Badge Settings */}
      <Card style={{ 
        backgroundColor: 'var(--card)', 
        borderColor: 'var(--border)',
        borderRadius: 'var(--radius)'
      }}>
        <CardContent style={{ padding: 'var(--spacing-6)' }}>
          <h4 style={{ 
            fontWeight: 'var(--font-weight-semibold)',
            marginBottom: 'var(--spacing-4)'
          }}>
            Alert Options
          </h4>

          <div className="space-y-4">
            {/* Sound */}
            <div
              className="flex items-center justify-between"
              style={{ 
                padding: 'var(--spacing-4)',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                opacity: preferences.enabled ? 1 : 0.6
              }}
            >
              <div className="flex items-center" style={{ gap: 'var(--spacing-3)' }}>
                {preferences.soundEnabled ? (
                  <Volume2 className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                ) : (
                  <VolumeX className="w-5 h-5" style={{ color: 'var(--muted-foreground)' }} />
                )}
                <div>
                  <div style={{ fontWeight: 'var(--font-weight-medium)' }}>
                    Sound
                  </div>
                  <div style={{ 
                    fontSize: '0.8125rem',
                    color: 'var(--muted-foreground)'
                  }}>
                    Play a sound with notifications
                  </div>
                </div>
              </div>

              <button
                onClick={() => updatePreference('soundEnabled', !preferences.soundEnabled)}
                disabled={!preferences.enabled}
                style={{
                  width: '48px',
                  height: '28px',
                  borderRadius: '14px',
                  backgroundColor: preferences.soundEnabled && preferences.enabled ? 'var(--primary)' : 'var(--switch-background)',
                  border: 'none',
                  position: 'relative',
                  cursor: preferences.enabled ? 'pointer' : 'not-allowed',
                  transition: 'background-color 0.2s ease'
                }}
              >
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '12px',
                    backgroundColor: 'white',
                    position: 'absolute',
                    top: '2px',
                    left: preferences.soundEnabled && preferences.enabled ? '22px' : '2px',
                    transition: 'left 0.2s ease',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </button>
            </div>

            {/* Badge */}
            <div
              className="flex items-center justify-between"
              style={{ 
                padding: 'var(--spacing-4)',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                opacity: preferences.enabled ? 1 : 0.6
              }}
            >
              <div className="flex items-center" style={{ gap: 'var(--spacing-3)' }}>
                <Bell className="w-5 h-5" style={{ color: preferences.badgeEnabled ? 'var(--primary)' : 'var(--muted-foreground)' }} />
                <div>
                  <div style={{ fontWeight: 'var(--font-weight-medium)' }}>
                    Badge App Icon
                  </div>
                  <div style={{ 
                    fontSize: '0.8125rem',
                    color: 'var(--muted-foreground)'
                  }}>
                    Show notification count on app icon
                  </div>
                </div>
              </div>

              <button
                onClick={() => updatePreference('badgeEnabled', !preferences.badgeEnabled)}
                disabled={!preferences.enabled}
                style={{
                  width: '48px',
                  height: '28px',
                  borderRadius: '14px',
                  backgroundColor: preferences.badgeEnabled && preferences.enabled ? 'var(--primary)' : 'var(--switch-background)',
                  border: 'none',
                  position: 'relative',
                  cursor: preferences.enabled ? 'pointer' : 'not-allowed',
                  transition: 'background-color 0.2s ease'
                }}
              >
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '12px',
                    backgroundColor: 'white',
                    position: 'absolute',
                    top: '2px',
                    left: preferences.badgeEnabled && preferences.enabled ? '22px' : '2px',
                    transition: 'left 0.2s ease',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end" style={{ gap: 'var(--spacing-3)' }}>
        <Button
          variant="outline"
          onClick={loadPreferences}
          disabled={saving}
          style={{
            borderColor: 'var(--border)',
            color: 'var(--foreground)',
          }}
        >
          Reset
        </Button>
        <Button
          onClick={savePreferences}
          disabled={saving}
          style={{
            backgroundColor: 'var(--primary)',
            color: 'var(--primary-foreground)',
          }}
          className="hover:opacity-90 transition-opacity"
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>

      {/* Apple Compliance Note */}
      <Card style={{ 
        backgroundColor: 'var(--muted)', 
        borderColor: 'var(--border)',
        borderRadius: 'var(--radius)'
      }}>
        <CardContent style={{ padding: 'var(--spacing-4)' }}>
          <p style={{ 
            fontSize: '0.8125rem',
            color: 'var(--muted-foreground)',
            lineHeight: '1.5'
          }}>
            <strong>Note:</strong> Notifications can also be managed in your device's Settings app under Cofounder+. 
            Changes made there will override these preferences.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}