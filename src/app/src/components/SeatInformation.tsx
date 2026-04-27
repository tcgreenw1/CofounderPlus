import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Users, 
  User, 
  CreditCard, 
  Calendar,
  RefreshCw,
  Plus,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

interface SeatInformationProps {
  user?: any;
  className?: string;
}

export const SeatInformation: React.FC<SeatInformationProps> = ({ 
  user, 
  className = '' 
}) => {
  const [seatData, setSeatData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load seat data on component mount
  useEffect(() => {
    loadSeatData();
  }, [user]);

  // Listen for seat sync events
  useEffect(() => {
    const handleSeatSync = (event: any) => {
      console.log('🪑 SEAT INFO: Received seat sync event:', event.detail);
      if (event.detail?.seatData) {
        setSeatData(event.detail.seatData);
      } else {
        // If no seat data, reload from server
        loadSeatData();
      }
    };

    window.addEventListener('seat-sync-completed', handleSeatSync);
    return () => {
      window.removeEventListener('seat-sync-completed', handleSeatSync);
    };
  }, []);

  const loadSeatData = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log('🪑 SEAT INFO: Loading seat data for user:', user.id);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No valid session found');
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ac1075a9/seat-data/${user.id}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to load seat data: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('🪑 SEAT INFO: Loaded seat data:', result);

      if (result.success) {
        setSeatData(result.seatData);
      } else {
        throw new Error(result.error || 'Failed to load seat data');
      }

    } catch (error: any) {
      console.error('🪑 SEAT INFO: Error loading seat data:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) {
      return 'Not available';
    }
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.warn('🪑 SEAT INFO: Date formatting error:', error, 'for date:', dateString);
      return 'Invalid date';
    }
  };

  const calculateTeamCapacity = () => {
    if (!seatData) return { current: 1, max: 1, additional: 0 };
    
    const current = 1; // Base user
    const additional = seatData.seatCount || 0;
    const max = current + additional;
    
    return { current, max, additional };
  };

  const teamCapacity = calculateTeamCapacity();

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Loading seat information...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Team Seats
                {seatData && (
                  <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                    Active
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {seatData ? 'Manage your team member seats' : 'No additional seats purchased'}
              </CardDescription>
            </div>
          </div>
          <Button
            onClick={loadSeatData}
            variant="ghost"
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Team Capacity Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {teamCapacity.current}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Current Members
              </div>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {teamCapacity.max}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total Capacity
              </div>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {teamCapacity.additional}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Additional Seats
              </div>
            </div>
          </div>

          {/* Seat Subscription Details */}
          {seatData ? (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Active Seat Subscription
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600 dark:text-gray-400 mb-1">Seats Purchased</div>
                    <div className="font-semibold text-blue-700 dark:text-blue-300">
                      {seatData.seatCount} seats
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600 dark:text-gray-400 mb-1">Price per Seat</div>
                    <div className="font-semibold text-blue-700 dark:text-blue-300">
                      ${seatData.pricePerSeat}/{seatData.billingPeriod === 'annual' ? 'year' : 'month'}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600 dark:text-gray-400 mb-1">Total Cost</div>
                    <div className="font-semibold text-blue-700 dark:text-blue-300">
                      ${(seatData.seatCount * seatData.pricePerSeat)}/{seatData.billingPeriod === 'annual' ? 'year' : 'month'}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600 dark:text-gray-400 mb-1">Status</div>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      <span className="font-semibold text-green-700 dark:text-green-300 capitalize">
                        {seatData.status}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Billing Information */}
                {seatData.current_period_end && (
                  <div className="mt-4 pt-3 border-t border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Calendar className="w-3 h-3" />
                        Next billing date
                      </div>
                      <div className="font-medium text-blue-700 dark:text-blue-300">
                        {formatDate(seatData.current_period_end)}
                      </div>
                    </div>
                    {seatData.created_at && (
                      <div className="flex items-center justify-between text-sm mt-2">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Clock className="w-3 h-3" />
                          Subscription started
                        </div>
                        <div className="font-medium text-blue-700 dark:text-blue-300">
                          {formatDate(seatData.created_at)}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Available Team Actions */}
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">Available Actions</h4>
                <div className="text-sm text-green-700 dark:text-green-300 mb-3">
                  You can now invite {teamCapacity.additional} additional team member{teamCapacity.additional !== 1 ? 's' : ''} to your account.
                </div>
                <Button 
                  size="sm" 
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => {
                    // Navigate to team management or show invite modal
                    toast.info('Team invitation feature coming soon!');
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Invite Team Members
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">
                No Additional Seats
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                You currently have 1 seat (yourself).
              </p>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SeatInformation;