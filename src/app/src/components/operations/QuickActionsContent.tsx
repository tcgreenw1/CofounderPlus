import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Zap,
  FileText,
  Calendar,
  Users,
  ClipboardCheck,
  CheckSquare,
  Clock,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';

export function QuickActionsContent() {
  const quickActions = [
    {
      id: 'schedule-meeting',
      title: 'Schedule Team Meeting',
      description: 'Quickly set up a team meeting with automatic calendar invites',
      icon: Calendar,
      color: 'var(--primary)',
      category: 'Planning',
      estimatedTime: '2 min'
    },
    {
      id: 'create-checklist',
      title: 'Create Daily Checklist',
      description: 'Generate operational checklists for daily, weekly, or monthly tasks',
      icon: ClipboardCheck,
      color: '#10b981',
      category: 'Tasks',
      estimatedTime: '1 min'
    },
    {
      id: 'generate-report',
      title: 'Generate Operations Report',
      description: 'Create comprehensive operational performance reports',
      icon: FileText,
      color: '#8b5cf6',
      category: 'Reporting',
      estimatedTime: '5 min'
    },
    {
      id: 'assign-tasks',
      title: 'Assign Team Tasks',
      description: 'Distribute tasks across team members with deadlines',
      icon: Users,
      color: '#f59e0b',
      category: 'Team',
      estimatedTime: '3 min'
    },
    {
      id: 'audit-workflow',
      title: 'Audit Current Workflows',
      description: 'Review and optimize existing operational workflows',
      icon: CheckSquare,
      color: '#06b6d4',
      category: 'Optimization',
      estimatedTime: '10 min'
    },
    {
      id: 'track-time',
      title: 'Time Tracking Setup',
      description: 'Configure time tracking for projects and team members',
      icon: Clock,
      color: '#ec4899',
      category: 'Productivity',
      estimatedTime: '4 min'
    },
    {
      id: 'incident-report',
      title: 'Log Incident Report',
      description: 'Document and track operational incidents or issues',
      icon: AlertTriangle,
      color: '#ef4444',
      category: 'Safety',
      estimatedTime: '3 min'
    },
    {
      id: 'kpi-dashboard',
      title: 'View KPI Dashboard',
      description: 'Monitor key operational performance indicators',
      icon: TrendingUp,
      color: '#10b981',
      category: 'Analytics',
      estimatedTime: '1 min'
    }
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-4)'
      }}
    >
      {/* Header Card */}
      <Card
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)'
        }}
      >
        <CardHeader style={{ padding: 'var(--spacing-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--primary-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Zap style={{ width: '24px', height: '24px', color: 'var(--primary)' }} />
            </div>
            <div style={{ flex: 1 }}>
              <CardTitle
                style={{
                  fontSize: '20px',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--foreground)',
                  marginBottom: 'var(--spacing-1)'
                }}
              >
                Quick Actions
              </CardTitle>
              <p
                style={{
                  fontSize: '14px',
                  fontWeight: 'var(--font-weight-normal)',
                  color: 'var(--muted-foreground)',
                  margin: 0
                }}
              >
                Streamline common operational tasks with one-click actions
              </p>
            </div>
            <Badge
              style={{
                background: 'var(--primary-soft)',
                color: 'var(--primary)',
                fontSize: '12px',
                fontWeight: 'var(--font-weight-semibold)',
                padding: 'var(--spacing-1) var(--spacing-2)',
                borderRadius: 'var(--radius-md)'
              }}
            >
              {quickActions.length} Actions
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Actions Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 'var(--spacing-4)'
        }}
      >
        {quickActions.map((action) => {
          const ActionIcon = action.icon;
          return (
            <Card
              key={action.id}
              className="transition-all hover:shadow-lg cursor-pointer"
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden'
              }}
            >
              <CardContent style={{ padding: 'var(--spacing-4)' }}>
                {/* Icon and Category */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 'var(--spacing-3)'
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: 'var(--radius-md)',
                      background: `${action.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <ActionIcon style={{ width: '20px', height: '20px', color: action.color }} />
                  </div>
                  <Badge
                    variant="secondary"
                    style={{
                      fontSize: '10px',
                      fontWeight: 'var(--font-weight-medium)',
                      padding: '2px var(--spacing-2)',
                      borderRadius: 'var(--radius-full)',
                      textTransform: 'uppercase'
                    }}
                  >
                    {action.category}
                  </Badge>
                </div>

                {/* Title */}
                <h4
                  style={{
                    fontSize: '16px',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--foreground)',
                    marginBottom: 'var(--spacing-2)'
                  }}
                >
                  {action.title}
                </h4>

                {/* Description */}
                <p
                  style={{
                    fontSize: '13px',
                    fontWeight: 'var(--font-weight-normal)',
                    color: 'var(--muted-foreground)',
                    lineHeight: '1.5',
                    marginBottom: 'var(--spacing-3)'
                  }}
                >
                  {action.description}
                </p>

                {/* Footer */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'var(--muted-foreground)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-1)'
                    }}
                  >
                    <Clock style={{ width: '14px', height: '14px' }} />
                    {action.estimatedTime}
                  </span>
                  <Button
                    size="sm"
                    style={{
                      fontSize: '13px',
                      fontWeight: 'var(--font-weight-medium)',
                      padding: 'var(--spacing-1) var(--spacing-3)',
                      borderRadius: 'var(--radius-md)'
                    }}
                  >
                    Start
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Bottom Stats Card */}
      <Card
        style={{
          background: 'var(--muted)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)'
        }}
      >
        <CardContent
          style={{
            padding: 'var(--spacing-4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            flexWrap: 'wrap',
            gap: 'var(--spacing-4)'
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: '24px',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--foreground)'
              }}
            >
              127
            </div>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--muted-foreground)'
              }}
            >
              Actions Completed
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: '24px',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--foreground)'
              }}
            >
              4.2h
            </div>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--muted-foreground)'
              }}
            >
              Time Saved
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: '24px',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--foreground)'
              }}
            >
              98%
            </div>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--muted-foreground)'
              }}
            >
              Success Rate
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
