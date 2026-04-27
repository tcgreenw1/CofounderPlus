/**
 * TEAM MEMBER SELECTOR COMPONENT
 * Allows assigning team members (including Cofounder AI) to boards, lists, and cards
 * Uses design system CSS variables for consistent theming
 */

import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Bot, X, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
import { Checkbox } from './ui/checkbox';
import { Separator } from './ui/separator';
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';

export interface AssignedMember {
  id: string;
  name: string;
  email?: string;
  type: 'user' | 'cofounder';
}

interface TeamMemberSelectorProps {
  currentAssignments?: AssignedMember[];
  onChange: (members: AssignedMember[]) => void;
  businessId?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const TeamMemberSelector: React.FC<TeamMemberSelectorProps> = ({
  currentAssignments = [],
  onChange,
  businessId,
  size = 'sm',
  showLabel = true,
}) => {
  const [teamMembers, setTeamMembers] = useState<AssignedMember[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Always include Cofounder as the first option
  const COFOUNDER_MEMBER: AssignedMember = {
    id: 'cofounder-ai',
    name: 'Cofounder',
    type: 'cofounder',
  };

  useEffect(() => {
    if (isOpen) {
      loadTeamMembers();
    }
  }, [isOpen, businessId]);

  const loadTeamMembers = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      // Load team members from backend
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/team/members`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const members: AssignedMember[] = data.members?.map((m: any) => ({
          id: m.id,
          name: m.name || m.email,
          email: m.email,
          type: 'user' as const,
        })) || [];

        setTeamMembers(members);
      }
    } catch (error) {
      console.error('Error loading team members:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const allAvailableMembers = [COFOUNDER_MEMBER, ...teamMembers];

  const isAssigned = (memberId: string) => {
    return currentAssignments.some(m => m.id === memberId);
  };

  const toggleAssignment = (member: AssignedMember) => {
    if (isAssigned(member.id)) {
      onChange(currentAssignments.filter(m => m.id !== member.id));
    } else {
      onChange([...currentAssignments, member]);
    }
  };

  const removeAssignment = (memberId: string) => {
    onChange(currentAssignments.filter(m => m.id !== memberId));
  };

  // Member avatar styling
  const getMemberAvatar = (member: AssignedMember) => {
    if (member.type === 'cofounder') {
      return (
        <div
          style={{
            width: size === 'sm' ? '24px' : size === 'md' ? '28px' : '32px',
            height: size === 'sm' ? '24px' : size === 'md' ? '28px' : '32px',
            borderRadius: 'var(--radius-full)',
            background: 'linear-gradient(135deg, #4B00FF, #7C3AED)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid',
            borderColor: 'var(--background)',
          }}
        >
          <Bot 
            className={size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-3.5 h-3.5' : 'w-4 h-4'}
            style={{ color: '#ffffff' }}
          />
        </div>
      );
    }

    // User avatar with initials
    const initials = member.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    return (
      <div
        style={{
          width: size === 'sm' ? '24px' : size === 'md' ? '28px' : '32px',
          height: size === 'sm' ? '24px' : size === 'md' ? '28px' : '32px',
          borderRadius: 'var(--radius-full)',
          background: 'var(--primary-soft)',
          border: '2px solid',
          borderColor: 'var(--background)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size === 'sm' ? '10px' : size === 'md' ? '11px' : '12px',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--primary)',
        }}
      >
        {initials}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
      {/* Display assigned members */}
      {currentAssignments.length > 0 && (
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: '2px',
            marginRight: 'var(--spacing-1)',
          }}
        >
          {currentAssignments.slice(0, 3).map((member) => (
            <div
              key={member.id}
              style={{ position: 'relative' }}
              title={member.name}
            >
              {getMemberAvatar(member)}
            </div>
          ))}
          {currentAssignments.length > 3 && (
            <div
              style={{
                width: size === 'sm' ? '24px' : size === 'md' ? '28px' : '32px',
                height: size === 'sm' ? '24px' : size === 'md' ? '28px' : '32px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--muted)',
                border: '2px solid',
                borderColor: 'var(--background)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: size === 'sm' ? '10px' : size === 'md' ? '11px' : '12px',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--muted-foreground)',
              }}
            >
              +{currentAssignments.length - 3}
            </div>
          )}
        </div>
      )}

      {/* Assignment popover */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size={size}
            style={{
              padding: size === 'sm' ? 'var(--spacing-1)' : 'var(--spacing-2)',
              height: 'auto',
            }}
          >
            <UserPlus 
              className={size === 'sm' ? 'w-3.5 h-3.5' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'}
              style={{ color: 'var(--muted-foreground)' }}
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          style={{
            width: '280px',
            padding: 'var(--spacing-3)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            background: 'var(--popover)',
          }}
        >
          <div style={{ marginBottom: 'var(--spacing-3)' }}>
            <h4 
              style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-2)',
                marginBottom: 'var(--spacing-1)',
              }}
            >
              <Users className="w-4 h-4" style={{ color: 'var(--foreground)' }} />
              Assign Members
            </h4>
            <p 
              className="text-sm"
              style={{ color: 'var(--muted-foreground)' }}
            >
              Add team members or Cofounder to collaborate
            </p>
          </div>

          <Separator style={{ marginBottom: 'var(--spacing-3)' }} />

          {/* Member list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
            {allAvailableMembers.map((member) => (
              <div
                key={member.id}
                onClick={() => toggleAssignment(member)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-3)',
                  padding: 'var(--spacing-2)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  background: isAssigned(member.id) ? 'var(--primary-soft)' : 'transparent',
                  transition: 'background 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isAssigned(member.id)) {
                    e.currentTarget.style.background = 'var(--muted)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isAssigned(member.id)) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <Checkbox
                  checked={isAssigned(member.id)}
                  onCheckedChange={() => toggleAssignment(member)}
                />

                {getMemberAvatar(member)}

                <div style={{ flex: 1 }}>
                  <div 
                    style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-2)',
                    }}
                  >
                    <span 
                      className="text-sm"
                      style={{ fontWeight: 'var(--font-weight-medium)' }}
                    >
                      {member.name}
                    </span>
                    {member.type === 'cofounder' && (
                      <Badge
                        variant="outline"
                        style={{
                          fontSize: '10px',
                          padding: '2px 6px',
                          background: 'linear-gradient(135deg, #4B00FF20, #7C3AED10)',
                          borderColor: '#4B00FF40',
                          color: '#4B00FF',
                        }}
                      >
                        AI
                      </Badge>
                    )}
                  </div>
                  {member.email && (
                    <p 
                      className="text-xs"
                      style={{ color: 'var(--muted-foreground)' }}
                    >
                      {member.email}
                    </p>
                  )}
                </div>

                {isAssigned(member.id) && (
                  <Check className="w-4 h-4" style={{ color: 'var(--success)' }} />
                )}
              </div>
            ))}

            {allAvailableMembers.length === 1 && (
              <p 
                className="text-sm text-center"
                style={{ 
                  color: 'var(--muted-foreground)',
                  padding: 'var(--spacing-4)',
                }}
              >
                No team members yet. Invite team members from Settings.
              </p>
            )}
          </div>

          {/* Selected members preview */}
          {currentAssignments.length > 0 && (
            <>
              <Separator style={{ marginTop: 'var(--spacing-3)', marginBottom: 'var(--spacing-3)' }} />
              <div>
                <p 
                  className="text-xs"
                  style={{ 
                    color: 'var(--muted-foreground)',
                    marginBottom: 'var(--spacing-2)',
                  }}
                >
                  Assigned ({currentAssignments.length})
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-1)' }}>
                  {currentAssignments.map((member) => (
                    <Badge
                      key={member.id}
                      variant="outline"
                      style={{
                        padding: 'var(--spacing-1) var(--spacing-2)',
                        borderRadius: 'var(--radius-full)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-1)',
                        background: member.type === 'cofounder' 
                          ? 'linear-gradient(135deg, #4B00FF20, #7C3AED10)' 
                          : 'var(--background)',
                      }}
                    >
                      <span className="text-xs">{member.name}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeAssignment(member.id);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <X className="w-3 h-3" style={{ color: 'var(--muted-foreground)' }} />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
};
