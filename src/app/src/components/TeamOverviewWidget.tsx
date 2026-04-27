import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Users, Plus, Crown, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';

interface TeamMember {
  id: string;
  email: string;
  name?: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
}

interface TeamOverviewWidgetProps {
  businessId: string;
  userId: string;
}

export const TeamOverviewWidget: React.FC<TeamOverviewWidgetProps> = ({ 
  businessId,
  userId 
}) => {
  const navigate = useNavigate();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTeamMembers = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token || !businessId) return;

        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/team/${businessId}/members`,
          {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          setTeamMembers(data.members || []);
        }
      } catch (error) {
        console.error('Error loading team members:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTeamMembers();
  }, [businessId]);

  const getInitials = (member: TeamMember) => {
    if (member.name) {
      return member.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return member.email.slice(0, 2).toUpperCase();
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'var(--energy)';
      case 'admin':
        return 'var(--primary)';
      default:
        return 'var(--muted-foreground)';
    }
  };

  return (
    <Card
      style={{
        backgroundColor: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden'
      }}
    >
      <CardHeader>
        <CardTitle 
          className="flex items-center justify-between"
          style={{ color: 'var(--foreground)' }}
        >
          <div className="flex items-center gap-2">
            <Users 
              className="w-5 h-5"
              style={{ color: 'var(--accent)' }}
            />
            Team Overview
          </div>
          {teamMembers.length > 0 && (
            <span 
              className="text-sm font-normal"
              style={{ color: 'var(--muted-foreground)' }}
            >
              {teamMembers.length} {teamMembers.length === 1 ? 'member' : 'members'}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div 
            className="text-center py-4"
            style={{ color: 'var(--muted-foreground)' }}
          >
            Loading team...
          </div>
        ) : teamMembers.length === 0 ? (
          <div 
            className="text-center py-4"
            style={{ color: 'var(--muted-foreground)' }}
          >
            <p className="mb-3">No team members yet.</p>
            <Button
              size="sm"
              onClick={() => navigate('/settings?tab=team')}
              className="gap-2"
              style={{
                backgroundColor: 'var(--primary)',
                color: 'var(--primary-foreground)'
              }}
            >
              <Plus className="w-4 h-4" />
              Invite Team
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {teamMembers.slice(0, 4).map((member, index) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-3 p-2 rounded-lg"
                  style={{
                    backgroundColor: member.id === userId ? 'var(--muted)' : 'transparent',
                    border: member.id === userId ? '1px solid var(--border)' : 'none'
                  }}
                >
                  <Avatar className="w-10 h-10">
                    <AvatarFallback
                      style={{
                        backgroundColor: 'var(--primary)',
                        color: 'var(--primary-foreground)'
                      }}
                    >
                      {getInitials(member)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div 
                      className="font-medium truncate flex items-center gap-2"
                      style={{ 
                        color: 'var(--foreground)',
                        fontSize: '0.875rem'
                      }}
                    >
                      {member.name || member.email}
                      {member.id === userId && (
                        <span 
                          className="text-xs px-1.5 py-0.5 rounded"
                          style={{
                            backgroundColor: 'var(--primary)',
                            color: 'var(--primary-foreground)'
                          }}
                        >
                          You
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        style={{ 
                          color: 'var(--muted-foreground)',
                          fontSize: '0.75rem'
                        }}
                      >
                        {!member.name && member.email}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {member.role === 'owner' && (
                      <Crown 
                        className="w-4 h-4"
                        style={{ color: 'var(--energy)' }}
                      />
                    )}
                    {member.role === 'admin' && (
                      <User 
                        className="w-4 h-4"
                        style={{ color: 'var(--primary)' }}
                      />
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
            {teamMembers.length > 4 && (
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-4"
                onClick={() => navigate('/settings?tab=team')}
                style={{
                  borderColor: 'var(--border)',
                  color: 'var(--foreground)'
                }}
              >
                View All Members ({teamMembers.length})
              </Button>
            )}
            {teamMembers.length <= 4 && (
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-4 gap-2"
                onClick={() => navigate('/settings?tab=team')}
                style={{
                  borderColor: 'var(--border)',
                  color: 'var(--foreground)'
                }}
              >
                <Plus className="w-4 h-4" />
                Invite Team Member
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
