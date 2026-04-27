import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Building2, 
  Crown, 
  Zap, 
  Star, 
  ArrowRight, 
  Check,
  X,
  Sparkles,
  ExternalLink,
  CreditCard
} from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { useIsMobile } from './ui/use-mobile';
import { isIOS, isWeb } from '../utils/platformDetection';
import { 
  getSubscriptionTierInfo, 
  getNextTierForBusinesses, 
  getBusinessLimitMessage,
  SUBSCRIPTION_TIER_NAMES,
  SUBSCRIPTION_TIER_PRICES,
  SUBSCRIPTION_LIMITS
} from '../utils/subscriptionLimits';

interface BusinessLimitPaywallProps {
  isOpen: boolean;
  onClose: () => void;
  currentBusinessCount: number;
  currentTier: string;
  onUpgrade: (tier: string) => void;
}

export const BusinessLimitPaywall: React.FC<BusinessLimitPaywallProps> = ({
  isOpen,
  onClose,
  currentBusinessCount,
  currentTier,
  onUpgrade
}) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const currentTierInfo = getSubscriptionTierInfo(currentTier);
  const nextTier = getNextTierForBusinesses(currentBusinessCount, currentTier);
  const limitMessage = getBusinessLimitMessage(currentBusinessCount, currentTier);
  
  const isIOSApp = isIOS();
  const isWebBrowser = isWeb();

  const handleUpgradeClick = () => {
    console.log('🏢 BusinessLimitPaywall: Upgrade button clicked');
    console.log('🏢 Platform - isIOS:', isIOSApp, 'isWeb:', isWebBrowser);
    
    // Close the modal first
    onClose();
    
    // Small delay to ensure modal is closed before navigation
    setTimeout(() => {
      // Navigate to settings page with plan tab
      console.log('🏢 BusinessLimitPaywall: Navigating to /settings?tab=plan');
      navigate('/settings?tab=plan');
    }, 100);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={`${isMobile ? 'max-w-[95vw] max-h-[95vh]' : 'max-w-3xl max-h-[90vh]'} overflow-y-auto`}
        style={{
          backgroundColor: 'var(--card)',
          color: 'var(--card-foreground)',
          borderColor: 'var(--border)',
        }}
      >
        <DialogHeader>
          <DialogTitle 
            className="flex items-center gap-2"
            style={{
              color: 'var(--foreground)',
              fontWeight: 'var(--font-weight-semibold)',
            }}
          >
            <Building2 
              className="w-6 h-6"
              style={{ color: 'var(--primary)' }}
            />
            Business Limit Reached
          </DialogTitle>
          <DialogDescription
            style={{ color: 'var(--muted-foreground)' }}
          >
            You've reached the maximum number of businesses for your current plan
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6"
          style={{
            gap: 'var(--spacing-6)',
          }}
        >
          {/* Current Status Alert */}
          <div 
            className="p-4 rounded-lg"
            style={{
              padding: 'var(--spacing-4)',
              backgroundColor: 'rgba(212, 24, 61, 0.1)',
              borderColor: 'var(--destructive)',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderRadius: 'var(--radius)',
            }}
          >
            <div className="flex items-start gap-3">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  backgroundColor: 'var(--destructive)',
                  color: 'var(--destructive-foreground)',
                }}
              >
                <Building2 className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 
                  className="mb-1"
                  style={{
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--foreground)',
                  }}
                >
                  Business Limit Reached
                </h3>
                <p 
                  className="text-sm"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  You've reached the maximum number of businesses for your current plan. 
                  Upgrade now to create more businesses and unlock premium features!
                </p>
              </div>
            </div>
          </div>

          {/* Upgrade CTA */}
          <Card 
            style={{
              backgroundColor: 'var(--accent)',
              borderColor: 'var(--primary)',
              borderWidth: '1px',
              borderStyle: 'solid',
            }}
          >
            <CardContent 
              className="p-8 text-center"
              style={{ padding: 'var(--spacing-8)' }}
            >
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{
                  backgroundColor: 'var(--primary)',
                  color: 'var(--primary-foreground)',
                  marginBottom: 'var(--spacing-4)',
                }}
              >
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 
                className="mb-2"
                style={{
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--foreground)',
                  marginBottom: 'var(--spacing-2)',
                }}
              >
                Unlock More Businesses
              </h3>
              <p 
                className="mb-6"
                style={{ 
                  color: 'var(--muted-foreground)',
                  marginBottom: 'var(--spacing-6)',
                }}
              >
                Get access to more businesses, premium features, and priority support
              </p>
              
              {/* Platform-Specific Button */}
              {isIOSApp ? (
                // iOS Mobile - Show "Upgrade Your Plan" button
                <Button 
                  size="lg"
                  className="bouncy-button w-full sm:w-auto px-8"
                  onClick={handleUpgradeClick}
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: 'var(--primary-foreground)',
                    fontWeight: 'var(--font-weight-semibold)',
                  }}
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Upgrade Your Plan
                </Button>
              ) : (
                // Web/Browser - Show "View Plans & Pricing" button
                <Button 
                  size="lg"
                  className="bouncy-button w-full sm:w-auto px-8"
                  onClick={handleUpgradeClick}
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: 'var(--primary-foreground)',
                    fontWeight: 'var(--font-weight-semibold)',
                  }}
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  View Plans & Pricing
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              )}
              
              <p 
                className="text-xs mt-4"
                style={{ 
                  color: 'var(--muted-foreground)',
                  marginTop: 'var(--spacing-4)',
                }}
              >
                {isIOSApp 
                  ? 'You\'ll be directed to upgrade options'
                  : 'You\'ll be redirected to our pricing page'
                }
              </p>
            </CardContent>
          </Card>

          {/* Benefits */}
          <Card 
            style={{
              backgroundColor: 'var(--card)',
              borderColor: 'var(--border)',
            }}
          >
            <CardHeader>
              <CardTitle 
                className="flex items-center gap-2"
                style={{
                  color: 'var(--foreground)',
                  fontWeight: 'var(--font-weight-semibold)',
                }}
              >
                <Star 
                  className="w-5 h-5"
                  style={{ color: 'var(--primary)' }}
                />
                What You Get With an Upgrade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3"
                style={{ gap: 'var(--spacing-3)' }}
              >
                {[
                  'Create up to 25+ businesses',
                  'Full Business OS access',
                  'Advanced AI features',
                  'Priority customer support',
                  'Export and reporting tools',
                  'Team collaboration features'
                ].map((benefit, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div 
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: 'var(--accent)',
                        color: 'var(--primary)',
                      }}
                    >
                      <Check className="w-3 h-3" />
                    </div>
                    <span style={{ color: 'var(--foreground)' }}>
                      {benefit}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Footer */}
          <div 
            className="flex justify-center items-center pt-4 border-t"
            style={{
              paddingTop: 'var(--spacing-4)',
              borderColor: 'var(--border)',
            }}
          >
            <Button 
              variant="ghost" 
              onClick={onClose}
              style={{
                color: 'var(--muted-foreground)',
              }}
            >
              <X className="w-4 h-4 mr-2" />
              Maybe Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BusinessLimitPaywall;