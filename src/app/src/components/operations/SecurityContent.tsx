import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Shield,
  Lock,
  Key,
  AlertTriangle,
  Eye,
  ShieldCheck,
  UserCheck,
  FileText,
  Activity,
  Bell
} from 'lucide-react';

export function SecurityContent() {
  const securityAlerts = [
    {
      id: 'SEC-001',
      title: 'Failed Login Attempts',
      description: '5 failed login attempts detected from IP 192.168.1.105',
      severity: 'high',
      timestamp: '2026-03-04 14:23',
      status: 'active',
      category: 'Authentication'
    },
    {
      id: 'SEC-002',
      title: 'Unusual Access Pattern',
      description: 'User accessed system at unusual time (3:42 AM)',
      severity: 'medium',
      timestamp: '2026-03-04 03:42',
      status: 'reviewing',
      category: 'Access Control'
    },
    {
      id: 'SEC-003',
      title: 'Permission Change',
      description: 'Admin permissions granted to new user account',
      severity: 'low',
      timestamp: '2026-03-03 16:15',
      status: 'resolved',
      category: 'Permissions'
    }
  ];

  const accessLogs = [
    {
      user: 'Sarah Johnson',
      action: 'Accessed Financial Records',
      timestamp: '2026-03-04 14:45',
      location: 'Office - Building A',
      status: 'success'
    },
    {
      user: 'Michael Chen',
      action: 'Modified Security Settings',
      timestamp: '2026-03-04 13:22',
      location: 'Remote - VPN',
      status: 'success'
    },
    {
      user: 'Unknown User',
      action: 'Attempted Admin Access',
      timestamp: '2026-03-04 12:18',
      location: 'External IP',
      status: 'blocked'
    },
    {
      user: 'Emily Davis',
      action: 'Downloaded Sensitive Data',
      timestamp: '2026-03-04 11:05',
      location: 'Office - Building B',
      status: 'flagged'
    }
  ];

  const securityMetrics = {
    threatLevel: 'Low',
    activeAlerts: 2,
    resolvedToday: 8,
    complianceScore: 94
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return '#10b981';
      case 'blocked':
        return '#ef4444';
      case 'flagged':
        return '#f59e0b';
      case 'active':
        return '#ef4444';
      case 'reviewing':
        return '#f59e0b';
      case 'resolved':
        return '#10b981';
      default:
        return 'var(--muted-foreground)';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
      {/* Security Overview */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--spacing-4)'
        }}
      >
        <Card style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
          <CardContent style={{ padding: 'var(--spacing-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-2)' }}>
              <Shield style={{ width: '20px', height: '20px', color: '#10b981' }} />
              <span style={{ fontSize: '13px', fontWeight: 'var(--font-weight-medium)', color: 'var(--muted-foreground)' }}>
                Threat Level
              </span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 'var(--font-weight-bold)', color: '#10b981' }}>
              {securityMetrics.threatLevel}
            </div>
          </CardContent>
        </Card>

        <Card style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
          <CardContent style={{ padding: 'var(--spacing-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-2)' }}>
              <AlertTriangle style={{ width: '20px', height: '20px', color: '#ef4444' }} />
              <span style={{ fontSize: '13px', fontWeight: 'var(--font-weight-medium)', color: 'var(--muted-foreground)' }}>
                Active Alerts
              </span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 'var(--font-weight-bold)', color: '#ef4444' }}>
              {securityMetrics.activeAlerts}
            </div>
          </CardContent>
        </Card>

        <Card style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
          <CardContent style={{ padding: 'var(--spacing-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-2)' }}>
              <ShieldCheck style={{ width: '20px', height: '20px', color: '#10b981' }} />
              <span style={{ fontSize: '13px', fontWeight: 'var(--font-weight-medium)', color: 'var(--muted-foreground)' }}>
                Resolved Today
              </span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 'var(--font-weight-bold)', color: '#10b981' }}>
              {securityMetrics.resolvedToday}
            </div>
          </CardContent>
        </Card>

        <Card style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
          <CardContent style={{ padding: 'var(--spacing-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-2)' }}>
              <Activity style={{ width: '20px', height: '20px', color: 'var(--primary)' }} />
              <span style={{ fontSize: '13px', fontWeight: 'var(--font-weight-medium)', color: 'var(--muted-foreground)' }}>
                Compliance Score
              </span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 'var(--font-weight-bold)', color: 'var(--primary)' }}>
              {securityMetrics.complianceScore}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Alerts */}
      <Card style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
        <CardHeader style={{ padding: 'var(--spacing-4)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
              <Bell style={{ width: '20px', height: '20px', color: 'var(--primary)' }} />
              <CardTitle style={{ fontSize: '18px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)' }}>
                Security Alerts
              </CardTitle>
            </div>
            <Badge style={{
              background: '#ef444415',
              color: '#ef4444',
              fontSize: '11px',
              fontWeight: 'var(--font-weight-semibold)',
              padding: '2px var(--spacing-2)',
              borderRadius: 'var(--radius-full)'
            }}>
              {securityAlerts.filter(a => a.status === 'active').length} Active
            </Badge>
          </div>
        </CardHeader>
        <CardContent style={{ padding: 'var(--spacing-4)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
            {securityAlerts.map((alert) => (
              <div
                key={alert.id}
                style={{
                  padding: 'var(--spacing-4)',
                  background: 'var(--muted)',
                  borderRadius: 'var(--radius-lg)',
                  border: `1px solid ${getSeverityColor(alert.severity)}30`
                }}
              >
                <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: 'var(--spacing-2)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-1)' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', margin: 0 }}>
                        {alert.title}
                      </h4>
                      <Badge style={{
                        background: `${getSeverityColor(alert.severity)}15`,
                        color: getSeverityColor(alert.severity),
                        fontSize: '10px',
                        fontWeight: 'var(--font-weight-semibold)',
                        padding: '2px var(--spacing-2)',
                        borderRadius: 'var(--radius-full)',
                        textTransform: 'uppercase'
                      }}>
                        {alert.severity}
                      </Badge>
                    </div>
                    <p style={{ fontSize: '13px', fontWeight: 'var(--font-weight-normal)', color: 'var(--muted-foreground)', margin: 0, marginBottom: 'var(--spacing-2)' }}>
                      {alert.description}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', fontSize: '12px', color: 'var(--muted-foreground)' }}>
                      <span>{alert.id}</span>
                      <span>•</span>
                      <span>{alert.category}</span>
                      <span>•</span>
                      <span>{alert.timestamp}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--spacing-2)', marginLeft: 'var(--spacing-3)' }}>
                    <Button size="sm" variant="outline" style={{ fontSize: '12px', padding: 'var(--spacing-1) var(--spacing-2)' }}>
                      Investigate
                    </Button>
                    <Button size="sm" style={{ fontSize: '12px', padding: 'var(--spacing-1) var(--spacing-2)' }}>
                      Resolve
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Access Logs */}
      <Card style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
        <CardHeader style={{ padding: 'var(--spacing-4)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
            <Eye style={{ width: '20px', height: '20px', color: 'var(--primary)' }} />
            <CardTitle style={{ fontSize: '18px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)' }}>
              Recent Access Logs
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent style={{ padding: 0 }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--muted)' }}>
                  <th style={{ padding: 'var(--spacing-3)', textAlign: 'left', fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>User</th>
                  <th style={{ padding: 'var(--spacing-3)', textAlign: 'left', fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Action</th>
                  <th style={{ padding: 'var(--spacing-3)', textAlign: 'left', fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Location</th>
                  <th style={{ padding: 'var(--spacing-3)', textAlign: 'left', fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Time</th>
                  <th style={{ padding: 'var(--spacing-3)', textAlign: 'left', fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {accessLogs.map((log, index) => (
                  <tr key={index} style={{ borderBottom: index < accessLogs.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <td style={{ padding: 'var(--spacing-3)', fontSize: '13px', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)' }}>
                      {log.user}
                    </td>
                    <td style={{ padding: 'var(--spacing-3)', fontSize: '13px', fontWeight: 'var(--font-weight-normal)', color: 'var(--foreground)' }}>
                      {log.action}
                    </td>
                    <td style={{ padding: 'var(--spacing-3)', fontSize: '13px', fontWeight: 'var(--font-weight-normal)', color: 'var(--muted-foreground)' }}>
                      {log.location}
                    </td>
                    <td style={{ padding: 'var(--spacing-3)', fontSize: '13px', fontWeight: 'var(--font-weight-normal)', color: 'var(--muted-foreground)' }}>
                      {log.timestamp}
                    </td>
                    <td style={{ padding: 'var(--spacing-3)' }}>
                      <Badge style={{
                        background: `${getStatusColor(log.status)}15`,
                        color: getStatusColor(log.status),
                        fontSize: '11px',
                        fontWeight: 'var(--font-weight-semibold)',
                        padding: '2px var(--spacing-2)',
                        borderRadius: 'var(--radius-full)',
                        textTransform: 'capitalize'
                      }}>
                        {log.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
