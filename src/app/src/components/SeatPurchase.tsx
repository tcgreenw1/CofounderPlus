import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { 
  Users, 
  Plus, 
  CreditCard, 
  Check, 
  AlertTriangle,
  LoaderIcon,
  DollarSign,
  Calculator,
  Zap
} from 'lucide-react';
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

interface SeatPurchaseProps {
  user?: any;
  currentSeats?: number;
  className?: string;
}

export const SeatPurchase: React.FC<SeatPurchaseProps> = ({ 
  user, 
  currentSeats = 1, 
  className = '' 
}) => {
  const [additionalSeats, setAdditionalSeats] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const SEAT_PRICE_MONTHLY = 12; // $12 per seat per month

  const totalCost = additionalSeats * SEAT_PRICE_MONTHLY;
  const newTotalSeats = currentSeats + additionalSeats;

  const handleSeatCountChange = (value: string) => {
    const num = parseInt(value);
    if (!isNaN(num) && num >= 1 && num <= 50) {
      setAdditionalSeats(num);
      setError(null);
    }
  };

  const handlePurchaseSeats = async () => {
    if (!user?.id) {
      toast.error('You must be logged in to purchase seats');
      return;
    }

    if (additionalSeats < 1) {
      setError('Please select at least 1 additional seat');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🪑 SeatPurchase: Starting seat purchase process');
      console.log('🪑 SeatPurchase: User ID:', user.id);
      console.log('🪑 SeatPurchase: Additional seats:', additionalSeats);
      console.log('🪑 SeatPurchase: Total cost:', totalCost);

      // Get current session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No valid session found');
      }

      // Call the seat purchase endpoint
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ac1075a9/purchase-seats`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            additionalSeats,
            seatPriceMonthly: SEAT_PRICE_MONTHLY,
            totalCost,
            userId: user.id,
            userEmail: user.email
          })
        }
      );

      console.log('🪑 SeatPurchase: Server response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🪑 SeatPurchase: Server error:', errorText);
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      // Try to parse as JSON, with error handling
      let result;
      try {
        const responseText = await response.text();
        console.log('🪑 SeatPurchase: Raw response:', responseText);
        result = JSON.parse(responseText);
      } catch (parseError: any) {
        console.error('🪑 SeatPurchase: JSON parse error:', parseError);
        console.error('🪑 SeatPurchase: Response was not valid JSON');
        throw new Error('Server returned invalid response. Please try again.');
      }
      
      console.log('🪑 SeatPurchase: Server response:', result);

      if (result.success && result.checkoutUrl) {
        console.log('🪑 SeatPurchase: Redirecting to Stripe checkout:', result.checkoutUrl);
        toast.success('Redirecting to payment...');
        
        // Redirect to Stripe checkout
        window.location.href = result.checkoutUrl;
      } else {
        throw new Error(result.error || 'Failed to create checkout session');
      }

    } catch (error: any) {
      console.error('🪑 SeatPurchase: Purchase failed:', error);
      setError(error.message || 'Failed to start purchase process');
      toast.error('Purchase failed: ' + (error.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={`bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Add Team Members
                <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                  ${SEAT_PRICE_MONTHLY}/month per seat
                </Badge>
              </CardTitle>
              <CardDescription>
                Expand your team with additional user seats
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Current Status */}
          <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              <span className="font-medium">Current Seats</span>
            </div>
            <Badge variant="outline">
              {currentSeats} seat{currentSeats !== 1 ? 's' : ''}
            </Badge>
          </div>

          <Separator />

          {/* Seat Selection */}
          <div className="space-y-4">
            <Label htmlFor="additional-seats" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Additional Seats to Purchase
            </Label>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSeatCountChange(String(Math.max(1, additionalSeats - 1)))}
                  disabled={additionalSeats <= 1}
                >
                  -
                </Button>
                <Input
                  id="additional-seats"
                  type="number"
                  min="1"
                  max="50"
                  value={additionalSeats}
                  onChange={(e) => handleSeatCountChange(e.target.value)}
                  className="w-20 text-center"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSeatCountChange(String(Math.min(50, additionalSeats + 1)))}
                  disabled={additionalSeats >= 50}
                >
                  +
                </Button>
              </div>
              
              <div className="flex-1 text-sm text-gray-600 dark:text-gray-400">
                ${SEAT_PRICE_MONTHLY} per seat per month
              </div>
            </div>

            {/* Quick select buttons */}
            <div className="flex gap-2">
              {[1, 3, 5, 10].map((count) => (
                <Button
                  key={count}
                  variant={additionalSeats === count ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSeatCountChange(String(count))}
                  className="flex items-center gap-1"
                >
                  {count} seat{count !== 1 ? 's' : ''}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Cost Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-medium">
              <Calculator className="w-4 h-4 text-green-500" />
              Cost Breakdown
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Additional seats ({additionalSeats}x)</span>
                <span>${totalCost}/month</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Current seats ({currentSeats}x)</span>
                <span>Already included</span>
              </div>
              <Separator />
              <div className="flex justify-between font-medium">
                <span>Total monthly cost</span>
                <span>${totalCost}/month</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>New total seats</span>
                <span>{newTotalSeats} seats</span>
              </div>
            </div>
          </div>

          {/* Features included */}
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Check className="w-4 h-4 text-green-600" />
              <span className="font-medium text-green-800 dark:text-green-200">
                Each seat includes:
              </span>
            </div>
            <div className="space-y-1 text-sm text-green-700 dark:text-green-300">
              <div>• Full access to all business operations</div>
              <div>• Team collaboration features</div>
              <div>• Individual user profiles and permissions</div>
              <div>• Shared business data and insights</div>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700 dark:text-red-300">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Purchase Button */}
          <Button 
            onClick={handlePurchaseSeats}
            disabled={isLoading || additionalSeats < 1}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white flex items-center gap-2"
            size="lg"
          >
            {isLoading ? (
              <>
                <LoaderIcon className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                Purchase {additionalSeats} Seat{additionalSeats !== 1 ? 's' : ''} - ${totalCost}/month
                <Zap className="w-4 h-4" />
              </>
            )}
          </Button>

          <div className="text-xs text-gray-500 text-center">
            Secure payment powered by Stripe. Cancel anytime.
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SeatPurchase;