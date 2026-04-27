import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { 
  Users, 
  UserCheck, 
  Mail, 
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  Crown,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

interface InvitationAcceptanceProps {
  user?: any;
}

interface InvitationDetails {
  id: string;
  email: string;
  ownerEmail: string;
  ownerName: string;
  invitedAt: string;
  expiresAt: string;
  status: string;
  isExpired: boolean;
}

export const InvitationAcceptance: React.FC<InvitationAcceptanceProps> = ({ user }) => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load invitation details
  const loadInvitationDetails = async () => {
    if (!token) {
      setError('Invalid invitation link');
      setIsLoading(false);
      return;
    }

    try {
      console.log('🧑‍🤝‍🧑 ACCEPT PAGE: Loading invitation details for token:', token);
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ac1075a9/invitation/${token}`
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to load invitation: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('🧑‍🤝‍🧑 ACCEPT PAGE: Invitation details:', result);

      if (result.success) {
        setInvitation(result.invitation);
      } else {
        throw new Error(result.error || 'Failed to load invitation');
      }

    } catch (error: any) {
      console.error('🧑‍🤝‍🧑 ACCEPT PAGE: Error loading invitation:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Accept invitation
  const acceptInvitation = async () => {
    if (!token || !user?.id) {
      setError('You must be logged in to accept invitations');
      return;
    }

    if (!invitation) {
      setError('Invitation details not loaded');
      return;
    }

    if (invitation.isExpired) {
      setError('This invitation has expired');
      return;
    }

    if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      setError(`This invitation is for ${invitation.email}, but you're signed in as ${user.email}`);
      return;
    }

    setIsAccepting(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('🧑‍🤝‍🧑 ACCEPT PAGE: Accepting invitation:', token);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No valid session found');
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ac1075a9/accept-invitation/${token}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to accept invitation: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('🧑‍🤝‍🧑 ACCEPT PAGE: Acceptance result:', result);

      if (result.success) {
        setSuccess(`✅ Successfully joined ${result.owner.name || result.owner.email}'s team!`);
        toast.success(`Welcome to ${result.owner.name || result.owner.email}'s team!`);
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      } else {
        throw new Error(result.error || 'Failed to accept invitation');
      }

    } catch (error: any) {
      console.error('🧑‍🤝‍🧑 ACCEPT PAGE: Error accepting invitation:', error);
      setError(error.message);
      toast.error('Failed to accept invitation: ' + error.message);
    } finally {
      setIsAccepting(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  // Load invitation on mount
  useEffect(() => {
    loadInvitationDetails();
  }, [token]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background starry-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <RefreshCw className="w-6 h-6 mr-3 animate-spin" />
              <span className="text-lg">Loading invitation...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-background starry-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle>Invalid Invitation</CardTitle>
                <CardDescription>This invitation link is not valid</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="mt-4">
              <Button 
                onClick={() => navigate('/dashboard')}
                className="w-full"
              >
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-background starry-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle>Welcome to the Team!</CardTitle>
                <CardDescription>You've successfully joined the team</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950 mb-4">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-700 dark:text-green-300">
                {success}
              </AlertDescription>
            </Alert>
            <div className="text-center text-sm text-gray-600 dark:text-gray-400 mb-4">
              Redirecting to dashboard in a few seconds...
            </div>
            <Button 
              onClick={() => navigate('/dashboard')}
              className="w-full"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Go to Dashboard Now
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main invitation acceptance UI
  return (
    <div className="min-h-screen bg-background starry-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle>Team Invitation</CardTitle>
              <CardDescription>You've been invited to join a team</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {invitation && (
            <div className="space-y-4">
              {/* Invitation Details */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-3 mb-3">
                  <Crown className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <div>
                    <div className="font-medium">{invitation.ownerName}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{invitation.ownerEmail}</div>
                  </div>
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  wants you to join their team on Cofounder
                </div>
              </div>

              {/* Invitation Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Mail className="w-5 h-5 mx-auto mb-1 text-gray-600 dark:text-gray-400" />
                  <div className="text-xs text-gray-600 dark:text-gray-400">Invited Email</div>
                  <div className="text-sm font-medium">{invitation.email}</div>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Calendar className="w-5 h-5 mx-auto mb-1 text-gray-600 dark:text-gray-400" />
                  <div className="text-xs text-gray-600 dark:text-gray-400">Invited On</div>
                  <div className="text-sm font-medium">{formatDate(invitation.invitedAt)}</div>
                </div>
              </div>

              {/* Expiration Warning */}
              {invitation.isExpired ? (
                <Alert variant="destructive">
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    This invitation expired on {formatDate(invitation.expiresAt)}
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    This invitation expires on {formatDate(invitation.expiresAt)}
                  </AlertDescription>
                </Alert>
              )}

              {/* User Status Check */}
              {!user ? (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    You need to sign in to accept this invitation.
                  </AlertDescription>
                </Alert>
              ) : user.email.toLowerCase() !== invitation.email.toLowerCase() ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    This invitation is for {invitation.email}, but you're signed in as {user.email}.
                    Please sign in with the correct account.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                  <UserCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertDescription className="text-green-700 dark:text-green-300">
                    Ready to accept! You're signed in as {user.email}.
                  </AlertDescription>
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="space-y-2">
                {!user ? (
                  <Button 
                    onClick={() => navigate('/auth')}
                    className="w-full"
                  >
                    Sign In to Accept Invitation
                  </Button>
                ) : user.email.toLowerCase() !== invitation.email.toLowerCase() ? (
                  <Button 
                    onClick={() => navigate('/auth')}
                    className="w-full"
                  >
                    Sign In with Correct Account
                  </Button>
                ) : invitation.isExpired ? (
                  <Button 
                    disabled
                    className="w-full"
                  >
                    Invitation Expired
                  </Button>
                ) : (
                  <Button 
                    onClick={acceptInvitation}
                    disabled={isAccepting}
                    className="w-full"
                  >
                    {isAccepting ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Accepting Invitation...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Accept Invitation
                      </>
                    )}
                  </Button>
                )}

                <Button 
                  onClick={() => navigate('/dashboard')}
                  variant="outline"
                  className="w-full"
                >
                  Go to Dashboard
                </Button>
              </div>

              {/* Error Display */}
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InvitationAcceptance;