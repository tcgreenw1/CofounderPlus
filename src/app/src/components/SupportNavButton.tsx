import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useSupportTicketNotifications } from '../hooks/useSupportTicketNotifications';

interface SupportNavButtonProps {
  user?: any;
  variant?: 'ghost' | 'default' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showLabel?: boolean;
}

/**
 * Support navigation button with notification counter
 * Shows a badge when there are unread admin replies or status changes
 */
export function SupportNavButton({ 
  user, 
  variant = 'ghost', 
  size = 'default',
  className = '',
  showLabel = true
}: SupportNavButtonProps) {
  const navigate = useNavigate();
  const { unreadCount, hasUnread } = useSupportTicketNotifications(user?.id);

  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => navigate('/support')}
      className={`relative ${className}`}
      style={{
        color: 'var(--foreground)',
        gap: 'var(--spacing-2)'
      }}
    >
      <MessageSquare className="w-4 h-4 flex-shrink-0" />
      {showLabel && <span>Support</span>}
      
      {/* Notification Badge */}
      {hasUnread && unreadCount > 0 && (
        <Badge 
          className="absolute -top-1 -right-1 px-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px]"
          style={{
            backgroundColor: 'var(--destructive)',
            color: 'var(--destructive-foreground)',
            borderRadius: 'var(--radius-full)',
            padding: '0 4px'
          }}
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </Badge>
      )}
    </Button>
  );
}
