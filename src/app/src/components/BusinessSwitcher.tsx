import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Building, Plus, ChevronDown, Check, RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { useBusiness } from './BusinessContext';
import { motion } from 'motion/react';
import { fetchUserBusinesses } from '../utils/businessApi';
import { MesmerizingLoader } from './MesmerizingLoader';
import { toast } from 'sonner@2.0.3';

export const BusinessSwitcher: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedBusiness, userBusinesses, setSelectedBusiness, switchBusiness, isLoading, refreshBusinesses } = useBusiness();
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRefreshBusinesses = async () => {
    console.log('BusinessSwitcher: Manually refreshing businesses');
    setRefreshing(true);
    setError(null);
    
    try {
      // Use the refreshBusinesses function from BusinessContext if available
      if (refreshBusinesses) {
        await refreshBusinesses();
        toast.success('Businesses refreshed');
      } else {
        // Fallback: manually fetch businesses
        console.log('BusinessSwitcher: No refreshBusinesses function, fetching directly');
        const businesses = await fetchUserBusinesses();
        console.log(`BusinessSwitcher: Fetched ${businesses.length} businesses directly`);
        
        if (businesses.length === 0) {
          setError('No businesses found. You may need to create your first business.');
        } else {
          toast.success('Businesses refreshed');
        }
      }
    } catch (err: any) {
      console.error('BusinessSwitcher: Error refreshing businesses:', err);
      
      if (err.message?.includes('timeout')) {
        setError('Request timed out. Please check your connection and try again.');
      } else if (err.message?.includes('auth') || err.message?.includes('401')) {
        setError('Authentication error. Please try signing out and back in.');
      } else if (err.message?.includes('network') || err.message?.includes('fetch')) {
        setError('Network error. Please check your internet connection.');
      } else {
        setError(`Failed to refresh businesses: ${err.message || 'Unknown error'}`);
      }
      toast.error('Failed to refresh businesses');
    } finally {
      setRefreshing(false);
    }
  };

  const handleSwitchBusiness = (business: any) => {
    console.log('BusinessSwitcher: Switching to business:', business.name);
    
    try {
      // Don't switch if already selected
      if (selectedBusiness?.id === business.id) {
        console.log('BusinessSwitcher: Already on this business');
        return;
      }

      // Use setSelectedBusiness directly (it saves to localStorage)
      setSelectedBusiness(business);
      
      // Show success toast
      toast.success(`Switched to ${business.name}`, {
        description: 'Loading data for this business...',
        duration: 2000,
      });

      // ✅ FIX: Don't navigate to dashboard - stay on current page
      // The current page will automatically reload its data when selectedBusiness changes via useEffect
      console.log('BusinessSwitcher: Business switched, staying on current page:', location.pathname);
      
    } catch (err: any) {
      console.error('BusinessSwitcher: Error switching business:', err);
      toast.error('Failed to switch business');
    }
  };

  // Show loading state in the button when businesses are loading
  if (isLoading) {
    return (
      <div className="p-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-200/50 dark:border-blue-800/50">
        <MesmerizingLoader message="Syncing your empire..." compact />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">

      {/* Show error message if there's one from refreshing */}
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm flex items-start gap-2"
        >
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-medium mb-1">Business Loading Error</div>
            <div>{error}</div>
            <button 
              onClick={() => setError(null)}
              className="mt-2 text-xs underline hover:no-underline"
            >
              Dismiss
            </button>
          </div>
        </motion.div>
      )}

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2 w-full justify-between">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="truncate">
                  {selectedBusiness?.name || 'No Business Selected'}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 opacity-50 flex-shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[280px]">
            {userBusinesses.length === 0 ? (
              <div key="empty-state" className="px-3 py-4 text-center">
                <div className="flex flex-col items-center gap-2 text-gray-500">
                  <Building className="w-8 h-8 opacity-50" />
                  <div className="text-sm">
                    <div>No businesses found</div>
                    <div className="text-xs mt-1">Go to Business Management to create your first business</div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {userBusinesses.map((business) => (
                  <DropdownMenuItem
                    key={business.id}
                    onClick={() => handleSwitchBusiness(business)}
                    className="flex items-center justify-between"
                  >
                    <span className="truncate flex-1">{business.name}</span>
                    {selectedBusiness?.id === business.id && (
                      <Check className="w-4 h-4 text-blue-600 flex-shrink-0 ml-2" />
                    )}
                  </DropdownMenuItem>
                ))}
              </>
            )}
            
            {userBusinesses.length > 0 && <DropdownMenuSeparator key="separator-1" />}
            
            {refreshing ? (
              <div key="refreshing" className="px-2 py-3">
                <MesmerizingLoader message="Refreshing..." compact />
              </div>
            ) : (
              <DropdownMenuItem key="refresh-action" onClick={handleRefreshBusinesses}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Businesses
              </DropdownMenuItem>
            )}
            
            <DropdownMenuSeparator key="separator-2" />
            
            <DropdownMenuItem key="manage-action" onClick={() => navigate('/business-management')}>
              <Plus className="w-4 h-4 mr-2" />
              Manage Businesses
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>


    </div>
  );
};