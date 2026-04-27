import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  CheckCircle,
  FileCheck,
  UserCheck,
  BadgeCheck,
  AlertTriangle,
  Clock,
  CheckSquare,
  XCircle,
  Eye
} from 'lucide-react';

export function VerificationsContent() {
  const verificationQueue = [
    {
      id: 'VER-001',
      type: 'Identity Verification',
      requester: 'Sarah Johnson',
      department: 'HR',
      priority: 'high',
      status: 'pending',
      submittedDate: '2026-03-04',
      dueDate: '2026-03-06',
      description: 'New employee background check and identity verification'
    },
    {
      id: 'VER-002',
      type: 'Document Verification',
      requester: 'Michael Chen',
      department: 'Finance',
      priority: 'medium',
      status: 'in-review',
      submittedDate: '2026-03-03',
      dueDate: '2026-03-07',
      description: 'Vendor contract compliance verification'
    },
    {
      id: 'VER-003',
      type: 'Compliance Check',
      requester: 'Emily Davis',
      department: 'Operations',
      priority: 'low',
      status: 'pending',
      submittedDate: '2026-03-02',
      dueDate: '2026-03-10',
      description: 'Monthly safety compliance audit'
    },
    {
      id: 'VER-004',
      type: 'License Verification',
      requester: 'David Martinez',
      department: 'Legal',
      priority: 'high',
      status: 'pending',
      submittedDate: '2026-03-04',
      dueDate: '2026-03-05',
      description: 'Professional license renewal verification'
    }
  ];

  const recentVerifications = [
    {
      id: 'VER-097',
      type: 'Identity Verification',
      status: 'approved',
      completedBy: 'You',
      completedDate: '2026-03-03'
    },
    {
      id: 'VER-098',
      type: 'Document Verification',
      status: 'approved',
      completedBy: 'You',
      completedDate: '2026-03-03'
    },
    {
      id: 'VER-099',
      type: 'Compliance Check',
      status: 'rejected',
      completedBy: 'You',
      completedDate: '2026-03-02'
    }
  ];

  const stats = {
    pending: 3,
    inReview: 1,
    completed: 45,
    avgTime: '1.5 days'
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#f59e0b';
      case 'in-review':
        return 'var(--primary)';
      case 'approved':
        return '#10b981';
      case 'rejected':
        return '#ef4444';
      default:
        return 'var(--muted-foreground)';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#10b981';
      default:
        return 'var(--muted-foreground)';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return CheckCircle;
      case 'rejected':
        return XCircle;
      case 'in-review':
        return Eye;
      default:
        return Clock;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
      {/* Header Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--spacing-4)'
        }}
      >
        <Card style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
          <CardContent style={{ padding: 'var(--spacing-4)', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 'var(--font-weight-bold)', color: '#f59e0b', marginBottom: 'var(--spacing-1)' }}>
              {stats.pending}
            </div>
            <div style={{ fontSize: '13px', fontWeight: 'var(--font-weight-medium)', color: 'var(--muted-foreground)' }}>
              Pending Review
            </div>
          </CardContent>
        </Card>

        <Card style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
          <CardContent style={{ padding: 'var(--spacing-4)', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 'var(--font-weight-bold)', color: 'var(--primary)', marginBottom: 'var(--spacing-1)' }}>
              {stats.inReview}
            </div>
            <div style={{ fontSize: '13px', fontWeight: 'var(--font-weight-medium)', color: 'var(--muted-foreground)' }}>
              In Review
            </div>
          </CardContent>
        </Card>

        <Card style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
          <CardContent style={{ padding: 'var(--spacing-4)', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 'var(--font-weight-bold)', color: '#10b981', marginBottom: 'var(--spacing-1)' }}>
              {stats.completed}
            </div>
            <div style={{ fontSize: '13px', fontWeight: 'var(--font-weight-medium)', color: 'var(--muted-foreground)' }}>
              Completed
            </div>
          </CardContent>
        </Card>

        <Card style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
          <CardContent style={{ padding: 'var(--spacing-4)', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 'var(--font-weight-bold)', color: 'var(--foreground)', marginBottom: 'var(--spacing-1)' }}>
              {stats.avgTime}
            </div>
            <div style={{ fontSize: '13px', fontWeight: 'var(--font-weight-medium)', color: 'var(--muted-foreground)' }}>
              Avg. Time
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Verification Queue */}
      <Card style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
        <CardHeader style={{ padding: 'var(--spacing-4)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <CardTitle style={{ fontSize: '18px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)' }}>
              Verification Queue
            </CardTitle>
            <Button size="sm" style={{ fontSize: '13px', fontWeight: 'var(--font-weight-medium)' }}>
              New Request
            </Button>
          </div>
        </CardHeader>
        <CardContent style={{ padding: 0 }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--muted)' }}>
                  <th style={{ padding: 'var(--spacing-3)', textAlign: 'left', fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>ID</th>
                  <th style={{ padding: 'var(--spacing-3)', textAlign: 'left', fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Type</th>
                  <th style={{ padding: 'var(--spacing-3)', textAlign: 'left', fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Requester</th>
                  <th style={{ padding: 'var(--spacing-3)', textAlign: 'left', fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Priority</th>
                  <th style={{ padding: 'var(--spacing-3)', textAlign: 'left', fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: 'var(--spacing-3)', textAlign: 'left', fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Due Date</th>
                  <th style={{ padding: 'var(--spacing-3)', textAlign: 'left', fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {verificationQueue.map((item, index) => (
                  <tr key={item.id} style={{ borderBottom: index < verificationQueue.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <td style={{ padding: 'var(--spacing-3)', fontSize: '13px', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)' }}>
                      {item.id}
                    </td>
                    <td style={{ padding: 'var(--spacing-3)', fontSize: '13px', fontWeight: 'var(--font-weight-normal)', color: 'var(--foreground)' }}>
                      {item.type}
                    </td>
                    <td style={{ padding: 'var(--spacing-3)', fontSize: '13px', fontWeight: 'var(--font-weight-normal)', color: 'var(--foreground)' }}>
                      <div>{item.requester}</div>
                      <div style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>{item.department}</div>
                    </td>
                    <td style={{ padding: 'var(--spacing-3)' }}>
                      <Badge style={{
                        background: `${getPriorityColor(item.priority)}15`,
                        color: getPriorityColor(item.priority),
                        fontSize: '11px',
                        fontWeight: 'var(--font-weight-semibold)',
                        padding: '2px var(--spacing-2)',
                        borderRadius: 'var(--radius-full)',
                        textTransform: 'capitalize'
                      }}>
                        {item.priority}
                      </Badge>
                    </td>
                    <td style={{ padding: 'var(--spacing-3)' }}>
                      <Badge style={{
                        background: `${getStatusColor(item.status)}15`,
                        color: getStatusColor(item.status),
                        fontSize: '11px',
                        fontWeight: 'var(--font-weight-semibold)',
                        padding: '2px var(--spacing-2)',
                        borderRadius: 'var(--radius-full)',
                        textTransform: 'capitalize'
                      }}>
                        {item.status.replace('-', ' ')}
                      </Badge>
                    </td>
                    <td style={{ padding: 'var(--spacing-3)', fontSize: '13px', fontWeight: 'var(--font-weight-normal)', color: 'var(--muted-foreground)' }}>
                      {new Date(item.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>
                    <td style={{ padding: 'var(--spacing-3)' }}>
                      <Button size="sm" variant="outline" style={{ fontSize: '12px', padding: 'var(--spacing-1) var(--spacing-2)' }}>
                        Review
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
        <CardHeader style={{ padding: 'var(--spacing-4)', borderBottom: '1px solid var(--border)' }}>
          <CardTitle style={{ fontSize: '18px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)' }}>
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent style={{ padding: 'var(--spacing-4)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
            {recentVerifications.map((item) => {
              const StatusIcon = getStatusIcon(item.status);
              return (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-3)',
                    padding: 'var(--spacing-3)',
                    background: 'var(--muted)',
                    borderRadius: 'var(--radius-md)'
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: 'var(--radius-md)',
                      background: `${getStatusColor(item.status)}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <StatusIcon style={{ width: '18px', height: '18px', color: getStatusColor(item.status) }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)' }}>
                      {item.id} - {item.type}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>
                      Completed by {item.completedBy} on {new Date(item.completedDate).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge style={{
                    background: `${getStatusColor(item.status)}15`,
                    color: getStatusColor(item.status),
                    fontSize: '11px',
                    fontWeight: 'var(--font-weight-semibold)',
                    padding: '2px var(--spacing-2)',
                    borderRadius: 'var(--radius-full)',
                    textTransform: 'capitalize'
                  }}>
                    {item.status}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
