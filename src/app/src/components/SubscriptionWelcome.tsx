import React, { useEffect } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Gift, TrendingUp } from 'lucide-react';

interface SubscriptionWelcomeProps {
  user: any;
  showWelcome?: boolean;
}

export function SubscriptionWelcome({ user, showWelcome = true }: SubscriptionWelcomeProps) {
  const navigate = useNavigate();

  useEffect(() => {
    if (showWelcome && user) {
      // Show a welcome notification about subscription features
      const timer = setTimeout(() => {
        toast.success(
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-blue-500" />
            <div>
              <div className="font-semibold">Your subscription cards are back!</div>
              <div className="text-sm text-muted-foreground">
                Click here to manage your subscription
              </div>
            </div>
          </div>,
          {
            duration: 5000,
            action: {
              label: "View Dashboard",
              onClick: () => navigate('/subscription-dashboard')
            }
          }
        );
      }, 2000); // Show after 2 seconds

      return () => clearTimeout(timer);
    }
  }, [user, showWelcome, navigate]);

  return null; // This component only shows notifications
}