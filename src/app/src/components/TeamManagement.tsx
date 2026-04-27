import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { useIsMobile } from './ui/use-mobile';
import { 
  Users,
  Mail,
  UserPlus,
  Send,
  Loader,
  RefreshCw,
  Crown,
  Trash2,
  Clock,
  CheckCircle2,
  Sparkles,
  Building2
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: string;
  status: 'invited' | 'active';
  invited_at?: string;
  joined_at?: string;
}

interface TeamManagementProps {
  user: any;
}

export function TeamManagement({ user }: TeamManagementProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [stats, setStats] = useState({
    activeMembers: 0,
    pendingInvites: 0,
    totalSlots: 10,
    usedSlots: 0,
    availableSlots: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Invite form state
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviting, setInviting] = useState(false);

  const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09`;

  useEffect(() => {
    if (user?.id) {
      loadTeamData();
    }
  }, [user?.id]);

  const loadTeamData = async () => {
    setLoading(true);
    setError(null);

    try {
      const accessToken = (await supabase.auth.getSession()).data.session?.access_token;
      if (!accessToken) {
        throw new Error('No access token available');
      }

      console.log('🔄 Loading team data from V3 API...');

      // First, test if the server is reachable at all
      const testUrl = `${serverUrl}/bookkeeping/test`;
      console.log('🧪 Testing server connectivity:', testUrl);
      
      try {
        const testResponse = await fetch(testUrl);
        console.log('✅ Test endpoint status:', testResponse.status);
      } catch (testError) {
        console.error('❌ Test endpoint failed:', testError);
      }

      const url = `${serverUrl}/team-v3/data`;
      console.log('📡 Full URL:', url);
      console.log('🔑 Server URL base:', serverUrl);
      console.log('🔑 Has access token:', !!accessToken);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
      });

      console.log('📥 Response status:', response.status, response.statusText);
      console.log('📥 Response URL:', response.url);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Team data loaded:', data);
        
        if (data.success) {
          setTeamMembers(data.teamMembers || []);
          setStats(data.stats || {
            activeMembers: 0,
            pendingInvites: 0,
            totalSlots: 10,
            usedSlots: 0,
            availableSlots: 0,
          });
          setSuccess(null); // Clear any previous errors
          setError(null);
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to load team data:', errorText);
        console.error('❌ Status:', response.status);
        console.error('❌ URL that failed:', response.url);
        
        setError(`Team management system needs to be deployed. The code has been updated but requires redeployment to Supabase. Status: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error loading team data:', error);
      setError('Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteUser = async () => {
    if (!inviteEmail || !inviteName) {
      setError('Email and name are required');
      return;
    }

    setInviting(true);
    setError(null);
    setSuccess(null);

    try {
      const accessToken = (await supabase.auth.getSession()).data.session?.access_token;
      
      if (!accessToken) {
        throw new Error('Not authenticated');
      }

      console.log('🚀 Sending invitation via V3 API...');

      const response = await fetch(`${serverUrl}/team-v3/invite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inviteEmail: inviteEmail.trim(),
          inviteName: inviteName.trim(),
          ownerName: user?.user_metadata?.name || user?.email,
        })
      });

      const data = await response.json();
      
      console.log('📥 Invitation response:', data);

      if (response.ok && data.success) {
        // Determine success message based on user existence
        if (data.userExists) {
          // User exists - notification sent
          toast.success('User found! 🎉', {
            description: `${inviteEmail} is an existing user. They'll receive an in-app notification to join your team.`,
            duration: 6000
          });
          
          setSuccess(
            `✅ ${inviteEmail} is an existing user!\n` +
            `📬 An in-app notification has been sent to them.`
          );
        } else {
          // User doesn't exist - email sent
          toast.success('Invitation email sent! 📧', {
            description: `We're sending an invitation email to ${inviteEmail}. They'll be able to create an account and join your team.`,
            duration: 6000
          });
          
          setSuccess(
            `📧 Sending invitation email to ${inviteEmail}...\n` +
            `This user will need to create an account to join your team.`
          );
        }
        
        setShowInviteDialog(false);
        setInviteEmail('');
        setInviteName('');
        
        await loadTeamData();
      } else {
        console.error('❌ Invitation failed:', data);
        const errorMessage = data.error || 'Failed to send invitation';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (error: any) {
      console.error('❌ Error inviting user:', error);
      const errorMessage = error.message || 'Failed to send invitation';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const accessToken = (await supabase.auth.getSession()).data.session?.access_token;
      
      if (!accessToken) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${serverUrl}/team-v3/remove`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ memberId })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Removed successfully');
        await loadTeamData();
      } else {
        toast.error(data.error || 'Failed to remove');
      }
    } catch (error: any) {
      console.error('Error removing member:', error);
      toast.error(error.message || 'Failed to remove');
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
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading your team...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Modern Header with Liquid Glass */}
      <div className="relative overflow-hidden rounded-xl liquid-glass-card p-8">
        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl liquid-glass backdrop-blur-md flex items-center justify-center border border-primary/20">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-3xl text-foreground">Team Management</h2>
                  <p className="text-muted-foreground text-sm">Collaborate with your team</p>
                </div>
              </div>
            </div>
            <Button
              onClick={loadTeamData}
              variant="secondary"
              size="sm"
              className="liquid-glass-nav"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="liquid-glass rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg liquid-glass-info flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-2xl text-foreground">{stats.usedSlots}</div>
                  <div className="text-xs text-muted-foreground">Team Members</div>
                </div>
              </div>
            </div>

            <div className="liquid-glass rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg liquid-glass-success flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-success" />
                </div>
                <div>
                  <div className="text-2xl text-foreground">{stats.availableSlots}</div>
                  <div className="text-xs text-muted-foreground">Available Slots</div>
                </div>
              </div>
            </div>

            <div className="liquid-glass rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg liquid-glass-warning flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-energy" />
                </div>
                <div>
                  <div className="text-2xl text-foreground">{stats.totalSlots}</div>
                  <div className="text-xs text-muted-foreground">Max Capacity</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Background decoration with liquid glass effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-success/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive" className="liquid-glass-error">
          <AlertDescription className="text-action dark:text-action">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="liquid-glass-success">
          <CheckCircle2 className="h-4 w-4 text-success" />
          <AlertDescription className="text-success dark:text-success">{success}</AlertDescription>
        </Alert>
      )}

      {/* Invite Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Your Team</h3>
          <p className="text-sm text-muted-foreground">
            {teamMembers.length === 0 ? 'No team members yet' : `${teamMembers.length} team member${teamMembers.length > 1 ? 's' : ''}`}
          </p>
        </div>
        
        {stats.availableSlots > 0 ? (
          <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
            <DialogTrigger asChild>
              <Button className="liquid-glass-btn-primary">
                <UserPlus className="w-4 h-4 mr-2" />
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md liquid-glass-card">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-primary" />
                  Invite Team Member
                </DialogTitle>
                <DialogDescription>
                  Send an invitation to join your Cofounder team
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="invite-email" className="text-sm">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="invite-email"
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="colleague@company.com"
                      className="pl-10 liquid-glass-input"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite-name" className="text-sm">
                    Full Name
                  </Label>
                  <Input
                    id="invite-name"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="John Doe"
                    className="liquid-glass-input"
                  />
                </div>

                <div className="liquid-glass-info p-3 rounded-lg">
                  <p className="text-xs text-primary">
                    💡 They'll receive a beautiful email invitation with a link to join your team
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowInviteDialog(false)}
                  className="flex-1 liquid-glass-nav"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleInviteUser}
                  disabled={inviting || !inviteEmail || !inviteName}
                  className="flex-1 liquid-glass-btn-primary"
                >
                  {inviting ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Invite
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        ) : (
          <Button 
            onClick={() => navigate('/support')}
            className="liquid-glass-btn-primary bg-gradient-to-r from-action to-energy hover:from-action/90 hover:to-energy/90"
          >
            Contact for Enterprise
          </Button>
        )}
      </div>

      {/* Team Members List */}
      <div className="space-y-3">
        {/* Owner Card */}
        <Card className="liquid-glass-card border-2 border-energy/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Avatar className="w-14 h-14 border-2 border-energy">
                <AvatarFallback className="bg-gradient-to-br from-energy to-action text-white">
                  {getInitials(user?.user_metadata?.name || user?.email || 'You')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-lg">{user?.user_metadata?.name || 'You'}</h4>
                  <Badge className="liquid-glass-warning border-0">
                    <Crown className="w-3 h-3 mr-1" />
                    Owner
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
              <CheckCircle2 className="w-6 h-6 text-success" />
            </div>
          </CardContent>
        </Card>

        {/* Team Members */}
        {teamMembers.map((member) => (
          <Card key={member.id} className="liquid-glass-card hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Avatar className="w-12 h-12">
                  <AvatarFallback className="bg-gradient-to-br from-primary/70 to-primary text-white">
                    {getInitials(member.name || member.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4>{member.name || member.email}</h4>
                    {member.status === 'invited' && (
                      <Badge variant="outline" className="liquid-glass-warning border-energy/30">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                    {member.status === 'active' && (
                      <Badge variant="outline" className="liquid-glass-success border-success/30">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{member.email}</p>
                  {member.joined_at && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Joined {formatDate(member.joined_at)}
                    </p>
                  )}
                  {member.invited_at && !member.joined_at && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Invited {formatDate(member.invited_at)}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveMember(member.id)}
                  className="text-action hover:text-action/80 hover:bg-action/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Empty State */}
        {teamMembers.length === 0 && (
          <Card className="liquid-glass-card border-dashed border-2">
            <CardContent className="p-12">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full liquid-glass-info flex items-center justify-center mx-auto">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg mb-1">No team members yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Invite colleagues to start collaborating on your business
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Info Card */}
      <Card className="liquid-glass-info">
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-lg liquid-glass-btn-primary flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="space-y-2">
              <h4 className="text-primary">Team Collaboration</h4>
              <ul className="text-sm text-foreground/80 space-y-1">
                <li>✓ Share access to your business dashboard</li>
                <li>✓ Collaborate on roadmaps and tasks</li>
                <li>✓ Up to 10 team members included</li>
                <li>✓ Real-time updates and notifications</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}