import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { 
  Users, 
  RefreshCw, 
  Check, 
  AlertTriangle,
  User,
  CreditCard,
  Calendar
} from 'lucide-react';
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

interface SeatSyncButtonProps {
  user?: any;
  className?: string;
}

export const SeatSyncButton: React.FC<SeatSyncButtonProps> = ({ 
  user, 
  className = '' 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [seatData, setSeatData] = useState<any>(null);

  const syncSeatSubscription = async () => {
    if (!user?.id) {
      toast.error('You must be logged in to sync seat data');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);
    setSeatData(null);

    try {
      console.log('🪑 SEAT SYNC: Starting seat subscription sync for user:', user.email);
      
      // Get current session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No valid session found');
      }

      // Call the dedicated seat sync endpoint
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ac1075a9/sync-seat-subscription`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId: user.id,
            userEmail: user.email
          })
        }
      );

      console.log('🪑 SEAT SYNC: Server response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🪑 SEAT SYNC: Server error:', errorText);
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('🪑 SEAT SYNC: Server response:', result);

      if (result.success) {
        if (result.seatSubscription) {
          setSeatData(result.seatSubscription);
          setSuccess(`✅ Found seat subscription: ${result.seatSubscription.seatCount} seats at $${result.seatSubscription.pricePerSeat}/month each`);
          toast.success(`Seat subscription synced: ${result.seatSubscription.seatCount} seats`);
        } else {
          setSuccess('✅ No seat subscriptions found');
          toast.success('No seat subscriptions found');
        }
        
        // Emit event to notify other components
        const seatSyncEvent = new CustomEvent('seat-sync-completed', {
          detail: { 
            seatData: result.seatSubscription,
            user: user,
            timestamp: Date.now()
          }
        });
        window.dispatchEvent(seatSyncEvent);
      } else {
        throw new Error(result.error || 'Failed to sync seat subscription');
      }

    } catch (error: any) {
      console.error('🪑 SEAT SYNC: Sync failed:', error);
      setError(error.message || 'Failed to sync seat subscription');
      toast.error('Seat sync failed: ' + (error.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={`bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-800 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Seat Subscription Sync
                <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                  Team Seats
                </Badge>
              </CardTitle>
              <CardDescription>
                Sync your team seat subscription from Stripe
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Check for additional team seat subscriptions
            </div>
            <Button
              onClick={syncSeatSubscription}
              disabled={isLoading}
              variant="default"
              size="sm"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Sync Seats
                </>
              )}
            </Button>
          </div>

          {/* Current Seat Data Display */}
          {seatData && (
            <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <h4 className="font-medium text-purple-800 dark:text-purple-200 mb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Active Seat Subscription
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 mb-1">
                    <User className="w-3 h-3" />
                    Total Seats
                  </div>
                  <div className="font-semibold text-purple-700 dark:text-purple-300">
                    {seatData.seatCount} seats
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 mb-1">
                    <CreditCard className="w-3 h-3" />
                    Price per Seat
                  </div>
                  <div className="font-semibold text-purple-700 dark:text-purple-300">
                    ${seatData.pricePerSeat}/month
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 mb-1">
                    <Calendar className="w-3 h-3" />
                    Billing Period
                  </div>
                  <div className="font-semibold text-purple-700 dark:text-purple-300">
                    {seatData.billingPeriod === 'annual' ? 'Annual' : 'Monthly'}
                  </div>
                </div>
              </div>
              <div className="mt-3 text-xs text-purple-600 dark:text-purple-400">
                Subscription ID: {seatData.subscriptionId}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Message */}
          {success && (
            <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
              <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-700 dark:text-green-300">
                {success}
              </AlertDescription>
            </Alert>
          )}

          <div className="text-xs text-gray-500 dark:text-gray-400">
            This will search your Stripe account for active seat subscriptions and sync the data to your profile.
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SeatSyncButton;