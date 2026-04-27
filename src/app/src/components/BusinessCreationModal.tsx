import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Building, Plus, ArrowRight, Sparkles, Target, TrendingUp, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { useBusiness } from './BusinessContext';
import { useCloudSubscription } from './CloudSubscriptionContext';
import { BusinessLimitPaywall } from './BusinessLimitPaywall';
import { canCreateMoreBusinesses } from '../utils/subscriptionLimits';

interface BusinessCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBusinessCreated?: (business: any) => void;
}

export const BusinessCreationModal: React.FC<BusinessCreationModalProps> = ({ 
  isOpen, 
  onClose,
  onBusinessCreated 
}) => {
  const navigate = useNavigate();
  const { createNewBusiness, userBusinesses } = useBusiness();
  const { subscriptionData } = useCloudSubscription();
  const [businessForm, setBusinessForm] = useState({
    name: '',
    description: ''
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);

  // Check if user can create more businesses
  const currentBusinessCount = userBusinesses.length;
  const subscriptionTier = (subscriptionData?.plan || 'free').toLowerCase().trim();
  const canCreate = canCreateMoreBusinesses(currentBusinessCount, subscriptionTier);

  const handleCreateBusiness = async () => {
    // Check business limit first
    if (!canCreate) {
      setShowPaywall(true);
      return;
    }

    if (!businessForm.name.trim()) {
      setError('Please enter a business name');
      return;
    }

    setCreating(true);
    setError(null);
    
    try {
      console.log('BusinessCreationModal: Creating business with data:', businessForm);
      const business = await createNewBusiness({
        ...businessForm,
        industry: 'Other'
      });
      
      if (business) {
        console.log('BusinessCreationModal: Business created successfully:', business);
        // Reset form and close modal
        setBusinessForm({ name: '', description: '' });
        onBusinessCreated?.(business);
        onClose();
      } else {
        setError('Failed to create business. Please try again.');
      }
    } catch (err) {
      console.error('BusinessCreationModal: Error creating business:', err);
      setError('Failed to create business. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleQuickStart = async () => {
    // Check business limit first
    if (!canCreate) {
      setShowPaywall(true);
      return;
    }

    // Create a default business to get user started quickly
    setCreating(true);
    setError(null);
    
    try {
      const defaultBusiness = {
        name: 'My Business',
        industry: 'dropshipping-ecommerce', // Use industry ID for proper roadmap matching
        description: 'A new business venture'
      };
      
      console.log('BusinessCreationModal: Creating quick start business');
      const business = await createNewBusiness(defaultBusiness);
      if (business) {
        console.log('BusinessCreationModal: Quick start business created successfully');
        setBusinessForm({ name: '', description: '' });
        onBusinessCreated?.(business);
        onClose();
      } else {
        setError('Failed to create business. Please try again.');
      }
    } catch (err) {
      console.error('BusinessCreationModal: Error creating quick start business:', err);
      setError('Failed to create business. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    if (!creating) {
      setBusinessForm({ name: '', description: '' });
      setError(null);
      onClose();
    }
  };

  const handleUpgrade = (tier: string) => {
    console.log('BusinessCreationModal: Navigating to subscription test for tier:', tier);
    setShowPaywall(false);
    onClose(); // Close the business creation modal first
    
    // Navigate to pricing page with target plan
    navigate('/pricing', { 
      state: { 
        targetPlan: tier,
        returnTo: '/business-management', // Return to business management after upgrade
        upgradeReason: 'business_limit'
      }
    });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50 shadow-xl max-w-xl max-h-[85vh] landscape:max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0 landscape:py-2">
            <DialogTitle className="flex items-center gap-2 landscape:text-base">
              <div className="w-7 h-7 landscape:w-6 landscape:h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Building className="w-4 h-4 landscape:w-3 landscape:h-3 text-white" />
              </div>
              Create New Business
            </DialogTitle>
            <DialogDescription className="text-sm landscape:text-xs landscape:mb-0">
              Set up your business with personalized roadmaps and tracking.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 landscape:space-y-2 overflow-y-auto flex-1 pr-2 -mr-2 landscape:pr-1 landscape:-mr-1">
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-3 py-2 rounded-lg text-sm flex-shrink-0"
              >
                {error}
              </motion.div>
            )}

            <div className="space-y-3 landscape:space-y-2 landscape:grid landscape:grid-cols-2 landscape:gap-3">
              <div className="landscape:col-span-2">
                <Label htmlFor="business-name" className="text-sm landscape:text-xs font-medium">
                  Business Name *
                </Label>
                <Input
                  id="business-name"
                  value={businessForm.name}
                  onChange={(e) => setBusinessForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., My Amazing Startup"
                  className="mt-1.5 landscape:mt-1 landscape:h-9"
                  disabled={creating}
                  autoFocus
                />
              </div>

              <div className="landscape:col-span-2">
                <Label htmlFor="business-description" className="text-sm landscape:text-xs font-medium">
                  Description (optional)
                </Label>
                <Textarea
                  id="business-description"
                  value={businessForm.description}
                  onChange={(e) => setBusinessForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of your business..."
                  className="mt-1.5 landscape:mt-1 landscape:h-16 landscape:text-sm"
                  rows={2}
                  disabled={creating}
                />
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-2.5 landscape:p-1.5 landscape:col-span-2 flex-shrink-0">
              <div className="flex items-center justify-center flex-wrap gap-3 landscape:gap-2 text-xs landscape:text-[10px] text-blue-700 dark:text-blue-300">
                <div className="flex items-center gap-1.5 landscape:gap-1">
                  <Target className="w-3.5 h-3.5 landscape:w-3 landscape:h-3" />
                  <span>Roadmap</span>
                </div>
                <div className="flex items-center gap-1.5 landscape:gap-1">
                  <TrendingUp className="w-3.5 h-3.5 landscape:w-3 landscape:h-3" />
                  <span>Tracking</span>
                </div>
                <div className="flex items-center gap-1.5 landscape:gap-1">
                  <Sparkles className="w-3.5 h-3.5 landscape:w-3 landscape:h-3" />
                  <span>Gamification</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 space-y-3 landscape:space-y-2 pt-3 landscape:pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row landscape:flex-row gap-2 landscape:gap-1.5">
              <Button
                onClick={handleQuickStart}
                variant="outline"
                className="flex-1 landscape:h-9 landscape:text-sm"
                disabled={creating}
              >
                {creating ? 'Creating...' : 'Quick Start'}
              </Button>
              
              <Button 
                onClick={handleCreateBusiness}
                className="flex-1 landscape:h-9 landscape:text-sm bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                disabled={!businessForm.name.trim() || creating}
              >
                {creating ? (
                  <div className="flex items-center gap-2 landscape:gap-1.5">
                    <div className="animate-spin rounded-full h-4 w-4 landscape:h-3 landscape:w-3 border-b-2 border-white"></div>
                    <span className="landscape:text-xs">Creating...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 landscape:gap-1.5">
                    <span>Create Business</span>
                    <ArrowRight className="w-4 h-4 landscape:w-3 landscape:h-3" />
                  </div>
                )}
              </Button>
            </div>

            <p className="text-center text-xs landscape:text-[10px] landscape:mt-1 text-gray-500 dark:text-gray-400">
              Manage multiple businesses and switch anytime
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Business Limit Paywall */}
      <BusinessLimitPaywall
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        currentBusinessCount={currentBusinessCount}
        currentTier={subscriptionTier}
        onUpgrade={handleUpgrade}
      />
    </>
  );
};