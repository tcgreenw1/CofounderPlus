import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Users, 
  UserPlus, 
  Mail, 
  Check,
  X,
  Clock,
  Trash2,
  RefreshCw,
  Send,
  Copy,
  AlertTriangle,
  Crown,
  Shield
} from 'lucide-react';
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';
import { copyToClipboard } from '../utils/clipboard';

interface TeamInvitationProps {
  user?: any;
  seatData?: any;
  className?: string;
}

interface TeamMember {
  id: string;
  email: string;
  name?: string;
  role: 'owner' | 'member';
  status: 'active' | 'invited' | 'pending';
  invitedAt?: string;
  joinedAt?: string;
  invitationToken?: string;
}

interface PendingInvitation {
  id: string;
  email: string;
  invitedAt: string;
  expiresAt: string;
  status: 'pending' | 'expired' | 'accepted' | 'cancelled';
  invitationToken: string;
}

export const TeamInvitation: React.FC<TeamInvitationProps> = ({ 
  user, 
  seatData,
  className = '' 
}) => {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Calculate team capacity
  const getTeamCapacity = () => {
    // NEW LIMIT: 10 total team members (owner + 9 invites) for all plans
    const maxTeamMembers = 10;
    const usedSeats = teamMembers.filter(m => m.status === 'active').length + 1; // +1 for owner
    const pendingSeats = pendingInvitations.filter(i => i.status === 'pending').length;
    const totalUsed = usedSeats + pendingSeats;
    const availableSeats = Math.max(0, maxTeamMembers - totalUsed);
    
    return {
      total: maxTeamMembers,
      used: usedSeats,
      available: availableSeats,
      pending: pendingSeats,
      additionalPurchased: 0 // No longer relevant with flat 10 member limit
    };
  };

  const capacity = getTeamCapacity();

  // Load team data
  const loadTeamData = async () => {
    if (!user?.id) return;

    setLoadingData(true);
    setError(null);

    try {
      console.log('🧑‍🤝‍🧑 TEAM: Loading team data for user:', user.id);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No valid session found');
      }

      // Use the correct endpoint from team-endpoints.tsx
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ac1075a9/users/team`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to load team data: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('🧑‍🤝‍🧑 TEAM: Loaded team data:', result);

      // The endpoint returns { teamUsers: [...] }
      const teamUsers = result.teamUsers || [];
      
      // Separate active members and pending invitations based on status
      const activeMembers = teamUsers.filter((u: any) => u.status === 'active').map((u: any) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role || 'member',
        status: 'active',
        joinedAt: u.joined_at,
      }));
      
      const pendingInvites = teamUsers.filter((u: any) => u.status === 'invited' || u.status === 'pending').map((u: any) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        invitedAt: u.invited_at,
        expiresAt: u.expires_at,
        status: u.status,
        invitationToken: u.invite_token,
      }));
      
      console.log(`🧑‍🤝‍🧑 TEAM: Found ${activeMembers.length} active members and ${pendingInvites.length} pending invitations`);
      setTeamMembers(activeMembers);
      setPendingInvitations(pendingInvites);

    } catch (error: any) {
      console.error('🧑‍🤝‍🧑 TEAM: Error loading team data:', error);
      setError(error.message);
    } finally {
      setLoadingData(false);
    }
  };

  // Send team invitation
  const sendInvitation = async () => {
    if (!inviteEmail.trim()) {
      setError('Email address is required');
      return;
    }

    if (!user?.id) {
      setError('You must be logged in to send invitations');
      return;
    }

    if (capacity.available <= 0) {
      setError('You have reached the maximum of 10 team members. Please contact us for an enterprise account.');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    // Check if email is already invited or a member
    const existingMember = teamMembers.find(m => 
      m.email.toLowerCase() === inviteEmail.toLowerCase()
    );
    if (existingMember) {
      setError('This email is already a team member');
      return;
    }

    const existingInvitation = pendingInvitations.find(i => 
      i.email.toLowerCase() === inviteEmail.toLowerCase() && i.status === 'pending'
    );
    if (existingInvitation) {
      setError('An invitation has already been sent to this email');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('🧑‍🤝‍🧑 TEAM: Sending invitation to:', inviteEmail);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No valid session found');
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ac1075a9/users/invite`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: inviteEmail.trim(),
            name: inviteName.trim(),
            role: 'member'
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to send invitation: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('🧑‍🤝‍🧑 TEAM: Invitation result:', result);

      if (result.success) {
        // Show different messages based on whether the user exists
        const displayMessage = result.userStatusMessage || `✅ Invitation sent to ${inviteEmail}`;
        setSuccess(displayMessage);
        setInviteEmail('');
        setInviteName('');
        
        // Show appropriate toast message
        if (result.isExistingUser) {
          toast.success(`✅ ${inviteEmail} will receive an in-app notification!`, {
            description: 'They can accept the invitation from their notifications.'
          });
        } else {
          toast.success(`📧 Invitation email sent to ${inviteEmail}!`, {
            description: 'They will receive an email to create an account and join your team.'
          });
        }
        
        // Reload team data to show the new pending invitation
        await loadTeamData();
      } else {
        throw new Error(result.error || 'Failed to send invitation');
      }

    } catch (error: any) {
      console.error('🧑‍🤝‍🧑 TEAM: Error sending invitation:', error);
      setError(error.message);
      toast.error('Failed to send invitation: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel invitation
  const cancelInvitation = async (invitationId: string, email: string) => {
    if (!user?.id) return;

    try {
      console.log('🧑‍🤝‍🧑 TEAM: Cancelling invitation:', invitationId);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No valid session found');
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ac1075a9/cancel-team-invitation`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            invitationId
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to cancel invitation`);
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success(`Invitation to ${email} cancelled`);
        await loadTeamData();
      } else {
        throw new Error(result.error || 'Failed to cancel invitation');
      }

    } catch (error: any) {
      console.error('🧑‍🤝‍🧑 TEAM: Error cancelling invitation:', error);
      toast.error('Failed to cancel invitation: ' + error.message);
    }
  };

  // Remove team member
  const removeMember = async (memberId: string, email: string) => {
    if (!user?.id) return;

    try {
      console.log('🧑‍🤝‍🧑 TEAM: Removing member:', memberId);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No valid session found');
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ac1075a9/remove-team-member`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            memberId
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to remove team member`);
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success(`${email} removed from team`);
        await loadTeamData();
      } else {
        throw new Error(result.error || 'Failed to remove team member');
      }

    } catch (error: any) {
      console.error('🧑‍🤝‍🧑 TEAM: Error removing member:', error);
      toast.error('Failed to remove team member: ' + error.message);
    }
  };

  // Copy invitation link
  const copyInvitationLink = async (invitation: PendingInvitation) => {
    const inviteUrl = `${window.location.origin}/invite/${invitation.invitationToken}`;
    
    try {
      const success = await copyToClipboard(inviteUrl);
      if (success) {
        toast.success('Invitation link copied to clipboard');
      } else {
        toast.error('Failed to copy invitation link');
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast.error('Failed to copy invitation link');
    }
  };

  // Load team data on mount
  useEffect(() => {
    loadTeamData();
  }, [user, seatData]);

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Team Members
                <Badge variant="secondary" className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                  {capacity.used}/{capacity.total} seats
                </Badge>
              </CardTitle>
              <CardDescription>
                Invite team members to collaborate on your projects
              </CardDescription>
            </div>
          </div>
          <Button
            onClick={loadTeamData}
            variant="ghost"
            size="sm"
            disabled={loadingData}
          >
            <RefreshCw className={`w-4 h-4 ${loadingData ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Team Capacity Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                {capacity.total}
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400">
                Total Seats
              </div>
            </div>
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-xl font-bold text-green-600 dark:text-green-400">
                {capacity.used}
              </div>
              <div className="text-xs text-green-600 dark:text-green-400">
                Active Members
              </div>
            </div>
            <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="text-xl font-bold text-orange-600 dark:text-orange-400">
                {capacity.pending}
              </div>
              <div className="text-xs text-orange-600 dark:text-orange-400">
                Pending Invites
              </div>
            </div>
            <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                {capacity.available}
              </div>
              <div className="text-xs text-purple-600 dark:text-purple-400">
                Available Seats
              </div>
            </div>
          </div>

          {/* Invite New Member */}
          {capacity.available > 0 && (
            <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-800">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Invite Team Member
                </CardTitle>
                <CardDescription>
                  Send an invitation to join your team ({capacity.available} seats available)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="inviteEmail">Email Address *</Label>
                      <Input
                        id="inviteEmail"
                        type="email"
                        placeholder="teammate@example.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                    <div>
                      <Label htmlFor="inviteName">Name (Optional)</Label>
                      <Input
                        id="inviteName"
                        type="text"
                        placeholder="John Doe"
                        value={inviteName}
                        onChange={(e) => setInviteName(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  
                  <Button
                    onClick={sendInvitation}
                    disabled={isLoading || !inviteEmail.trim()}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Sending Invitation...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Invitation
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* No seats available */}
          {capacity.available <= 0 && capacity.additionalPurchased > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                All {capacity.total} seats are currently in use. Remove a team member or purchase additional seats to invite more people.
              </AlertDescription>
            </Alert>
          )}

          {/* Current Team Members */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Current Team ({teamMembers.length + 1})
            </h4>
            <div className="space-y-2">
              {/* Owner (current user) */}
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <Crown className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="font-medium">{user?.user_metadata?.name || 'You'}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{user?.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                    Owner
                  </Badge>
                </div>
              </div>

              {/* Team Members */}
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
                      <Shield className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="font-medium">{member.name || member.email}</div>
                      {member.name && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">{member.email}</div>
                      )}
                      <div className="text-xs text-gray-500 dark:text-gray-500">
                        Joined {formatDate(member.joinedAt)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      Member
                    </Badge>
                    <Button
                      onClick={() => removeMember(member.id, member.email)}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Invitations */}
          {pendingInvitations.length > 0 && (
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Pending Invitations ({pendingInvitations.length})
              </h4>
              <div className="space-y-2">
                {pendingInvitations.map((invitation) => (
                  <div key={invitation.id} className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-400 rounded-full flex items-center justify-center">
                        <Clock className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="font-medium">{invitation.email}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Invited {formatDate(invitation.invitedAt)}
                        </div>
                        <div className="text-xs text-orange-600 dark:text-orange-400">
                          Expires {formatDate(invitation.expiresAt)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => copyInvitationLink(invitation)}
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => cancelInvitation(invitation.id, invitation.email)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error and Success Messages */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
              <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-700 dark:text-green-300">
                {success}
              </AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {loadingData && (
            <div className="text-center py-4">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-400" />
              <div className="text-sm text-gray-600 dark:text-gray-400">Loading team data...</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamInvitation;