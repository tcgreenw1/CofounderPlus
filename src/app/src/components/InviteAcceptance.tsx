import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { 
  Users,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Mail,
  Key,
  UserCheck,
  Building,
  ArrowRight,
  Loader,
  Shield,
  Clock
} from 'lucide-react';

interface InviteAcceptanceProps {
  token: string;
  onAccepted?: () => void;
}

interface InviteData {
  teamUser: {
    id: string;
    email: string;
    name: string;
    role: string;
    invited_by: string;
    invited_at: string;
    expires_at: string;
  };
  organizer: {
    name: string;
    email: string;
  };
  businessName?: string;
}

export function InviteAcceptance({ token, onAccepted }: InviteAcceptanceProps) {
  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form data
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09`;

  useEffect(() => {
    if (token) {
      validateInvite();
    }
  }, [token]);

  const validateInvite = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${serverUrl}/users/validate-invite?token=${token}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setInviteData(data);
      } else if (response.status === 404) {
        setError('This invitation link is invalid or has expired.');
      } else if (response.status === 410) {
        setError('This invitation has expired. Please ask your team administrator to send a new invitation.');
      } else {
        setError('Failed to validate invitation. Please try again.');
      }
    } catch (error) {
      console.error('Error validating invite:', error);
      setError('Failed to validate invitation. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvite = async () => {
    if (!password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setAccepting(true);
    setError(null);

    try {
      const response = await fetch(`${serverUrl}/users/accept-invite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token,
          password
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('Welcome to the team! You can now sign in with your credentials.');
        
        // Optionally redirect or call onAccepted callback
        setTimeout(() => {
          if (onAccepted) {
            onAccepted();
          } else {
            // Redirect to login page
            window.location.href = '/auth/signin';
          }
        }, 2000);
      } else {
        setError(data.message || 'Failed to accept invitation');
      }
    } catch (error) {
      console.error('Error accepting invite:', error);
      setError('Failed to accept invitation. Please try again.');
    } finally {
      setAccepting(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isExpired = inviteData && new Date() > new Date(inviteData.teamUser.expires_at);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Loader className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Validating invitation...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !inviteData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-950/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle>Invalid Invitation</CardTitle>
            <CardDescription>
              This invitation link is no longer valid
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                If you believe this is an error, please contact the person who invited you for a new invitation link.
              </p>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/'}
                className="w-full"
              >
                Return to Homepage
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-950/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
            <CardTitle>Invitation Expired</CardTitle>
            <CardDescription>
              This invitation has expired and is no longer valid
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Team invitations expire after 7 days for security reasons. Please ask {inviteData?.organizer.name} to send you a new invitation.
              </p>
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg mb-4">
                <p className="text-sm">
                  <strong>Contact:</strong> {inviteData?.organizer.email}
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/'}
                className="w-full"
              >
                Return to Homepage
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-950/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle>Welcome to the Team!</CardTitle>
            <CardDescription>
              Your account has been created successfully
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950 mb-4">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-700 dark:text-green-300">
                {success}
              </AlertDescription>
            </Alert>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                You'll be redirected to the sign-in page shortly to access your new account.
              </p>
              <Button 
                onClick={() => window.location.href = '/auth/signin'}
                className="w-full"
              >
                Continue to Sign In
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-950/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserCheck className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle>Join the Team</CardTitle>
          <CardDescription>
            Complete your account setup to join {inviteData?.businessName || 'the team'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Invitation Details */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <Avatar>
                <AvatarFallback>
                  {getInitials(inviteData?.organizer.name || 'Admin')}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold">{inviteData?.organizer.name}</div>
                <div className="text-sm text-muted-foreground">{inviteData?.organizer.email}</div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Invited you to join as a <Badge className="mx-1">{inviteData?.teamUser.role}</Badge>
            </p>
            {inviteData?.businessName && (
              <div className="flex items-center gap-2 mt-2">
                <Building className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">{inviteData.businessName}</span>
              </div>
            )}
          </div>

          {/* Account Setup Form */}
          <div className="space-y-4">
            <div>
              <Label>Email Address</Label>
              <div className="flex items-center gap-2 mt-1">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">{inviteData?.teamUser.email}</span>
              </div>
            </div>

            <div>
              <Label>Full Name</Label>
              <div className="flex items-center gap-2 mt-1">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">{inviteData?.teamUser.name}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Create Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter a secure password"
                required
                minLength={8}
              />
              <p className="text-xs text-muted-foreground">
                Password must be at least 8 characters long
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
              />
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Invitation Details */}
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex items-center justify-between">
              <span>Invited:</span>
              <span>{formatDate(inviteData?.teamUser.invited_at || '')}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Expires:</span>
              <span>{formatDate(inviteData?.teamUser.expires_at || '')}</span>
            </div>
          </div>

          {/* Accept Button */}
          <Button
            onClick={handleAcceptInvite}
            disabled={accepting || !password || !confirmPassword}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
          >
            {accepting ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Setting up your account...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 mr-2" />
                Accept Invitation & Create Account
              </>
            )}
          </Button>

          {/* Security Notice */}
          <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Secure Account Setup</p>
                <p>Your account will be created with enterprise-grade security. You'll have access to all team features based on your assigned role.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}