import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from './ThemeProvider';
import { useBusiness } from './BusinessContext';
import { useCloudSubscription } from './CloudSubscriptionContext';
import { BusinessSwitcher } from './BusinessSwitcher';
import { BusinessCreationModal } from './BusinessCreationModal';
import { BusinessLimitPaywall } from './BusinessLimitPaywall';
import { BusinessMemoryDisplay } from './BusinessMemoryDisplay';
import IndustrySelector from './IndustrySelector';
import { EnhancedIndustryListSelector } from './EnhancedIndustryListSelector';
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';
import { canCreateMoreBusinesses } from '../utils/subscriptionLimits';
import { 
  ArrowLeft, Plus, Edit3, Trash2, Building2, Calendar, MapPin,
  Users, DollarSign, TrendingUp, BarChart3, Settings, Star,
  CheckCircle, AlertCircle, Clock, Globe, Mail, Phone,
  MessageSquare, FileText, Search, Filter, SortAsc
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { toast } from 'sonner@2.0.3';
import { isIOS } from '../utils/platformDetection';

interface BusinessManagementPageProps {
  user: any;
}

const BusinessManagementPage: React.FC<BusinessManagementPageProps> = ({ user }) => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { userBusinesses, selectedBusiness, setSelectedBusiness, retryBusinessLoad, refreshBusinesses } = useBusiness();
  const { subscriptionData } = useCloudSubscription();
  const [loading, setLoading] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  // PERFORMANCE FIX: Load businesses ONCE in background without blocking UI
  useEffect(() => {
    if (!hasLoadedOnce && userBusinesses.length === 0) {
      setHasLoadedOnce(true);
      // Load in background - no loading screen
      refreshBusinesses().catch(() => {
        // Silent fail - user can use Retry button if needed
      });
    }
  }, [hasLoadedOnce, userBusinesses.length, refreshBusinesses]);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'industry'>('created');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBusinessForEdit, setSelectedBusinessForEdit] = useState<any>(null);
  const [selectedBusinessForDelete, setSelectedBusinessForDelete] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    industry: '',
    description: ''
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleEditBusiness = (business: any) => {
    console.log('🔧 Business Management: Edit clicked for business:', business.name);
    setSelectedBusinessForEdit(business);
    setEditForm({
      name: business.name || '',
      industry: business.industry || '',
      description: business.description || ''
    });
    setShowEditModal(true);
  };

  const handleDeleteBusiness = (business: any) => {
    console.log('🗑️ Business Management: Delete clicked for business:', business.name);
    setSelectedBusinessForDelete(business);
    setShowDeleteModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedBusinessForEdit || !editForm.name.trim()) {
      console.log('💾 Business Management: Cannot save - no business selected or name is empty');
      return;
    }

    try {
      setLoading(true);
      console.log('💾 Business Management: Saving edit for business:', selectedBusinessForEdit.id);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.error('💾 Business Management: No session/access token');
        toast.error('Authentication required');
        return;
      }

      console.log('💾 Business Management: Making PUT request...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/businesses/${selectedBusinessForEdit.id}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(editForm),
            signal: controller.signal
          }
        );
        clearTimeout(timeoutId);

        console.log('💾 Business Management: Response received:', response.status);
        
        if (response.ok) {
          console.log('💾 Business Management: Update successful');
          await retryBusinessLoad();
          setShowEditModal(false);
          setSelectedBusinessForEdit(null);
          toast.success('Business updated successfully');
        } else {
          const errorText = await response.text();
          console.error('💾 Business Management: Failed to update business:', response.status, errorText);
          toast.error(`Failed to update business: ${errorText}`);
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          console.error('💾 Business Management: Request timeout');
          toast.error('Request timed out. Please try again.');
        } else {
          throw fetchError;
        }
      }
    } catch (error) {
      console.error('Error updating business:', error);
      toast.error(`Error updating business: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedBusinessForDelete) {
      console.log('🗑️ Business Management: Cannot delete - no business selected');
      return;
    }

    try {
      setLoading(true);
      console.log('🗑️ Business Management: Deleting business:', selectedBusinessForDelete.id);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.error('🗑️ Business Management: No session/access token');
        toast.error('Authentication required');
        return;
      }

      console.log('🗑️ Business Management: Making DELETE request...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/businesses/${selectedBusinessForDelete.id}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            },
            signal: controller.signal
          }
        );
        clearTimeout(timeoutId);

        console.log('🗑️ Business Management: Response received:', response.status);
        
        if (response.ok) {
          console.log('🗑️ Business Management: Delete successful');
          await retryBusinessLoad();
          setShowDeleteModal(false);
          setSelectedBusinessForDelete(null);
          toast.success('Business deleted successfully');
        } else {
          const errorText = await response.text();
          console.error('🗑️ Business Management: Failed to delete business:', response.status, errorText);
          toast.error(`Failed to delete business: ${errorText}`);
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          console.error('🗑️ Business Management: Request timeout');
          toast.error('Request timed out. Please try again.');
        } else {
          throw fetchError;
        }
      }
    } catch (error) {
      console.error('Error deleting business:', error);
      toast.error(`Error deleting business: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedBusinesses = useMemo(() => {
    return (userBusinesses || [])
      .filter(business => 
        business.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        business.industry?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        business.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return a.name.localeCompare(b.name);
          case 'industry':
            return (a.industry || '').localeCompare(b.industry || '');
          case 'created':
          default:
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
      });
  }, [userBusinesses, searchTerm, sortBy]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-950 starry-background transition-all duration-300">
      {/* Gentle meteors for business management */}
      <div className="shooting-star" style={{ animationDelay: '38s', animationDuration: '5.3s', top: '25%' }}></div>
      <div className="shooting-star" style={{ animationDelay: '82s', animationDuration: '4.6s', top: '70%' }}></div>
      {/* Header */}
      <div className="bg-white/20 dark:bg-gray-800/20 backdrop-blur-xl border-b border-white/30 dark:border-gray-700/30 px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Top row on mobile - Back button and actions */}
          <div className="flex items-center justify-between sm:justify-start">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3"
            >
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Back</span>
            </Button>
            
            {/* Mobile-only action buttons in header */}
            <div className="flex items-center gap-2 sm:hidden">
              <BusinessSwitcher />
            </div>
          </div>

          {/* Title section */}
          <div className="sm:flex-1">
            <h1 className="text-xl sm:text-2xl font-semibold">Business Management</h1>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5">
              Create, edit, and organize your businesses
            </p>
          </div>

          {/* Desktop-only action buttons */}
          <div className="hidden sm:flex items-center gap-4">
            <BusinessSwitcher />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main 
        className="p-3 sm:p-6 space-y-4 sm:space-y-6"
        style={{
          paddingBottom: isIOS() 
            ? 'max(env(safe-area-inset-bottom, 0px) + 96px, 96px)' 
            : '24px'
        }}
      >
        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
          <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Businesses</p>
                  <p className="text-xl sm:text-2xl font-semibold">{userBusinesses?.length || 0}</p>
                </div>
                <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1 pr-2">
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Currently Selected</p>
                  <p className="text-base sm:text-lg font-semibold truncate">
                    {selectedBusiness?.name || 'None'}
                  </p>
                </div>
                <Star className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Business Memory Section - Shows insights learned from conversations */}
        {selectedBusiness && (
          <BusinessMemoryDisplay 
            businessId={selectedBusiness.id} 
            user={user} 
          />
        )}

        {/* Controls */}
        <div className="flex flex-col gap-3 sm:gap-4">
          {/* Search and Sort Row */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search businesses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created">Date Created</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="industry">Industry</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Create Button - Full width on mobile */}
          <Button 
            onClick={(e) => {
              e.stopPropagation();
              console.log('Create Business button clicked');
              setShowCreateModal(true);
            }}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white w-full sm:w-auto sm:self-end"
            style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Business
          </Button>
        </div>

        {/* Business Cards Grid */}
        {filteredAndSortedBusinesses.length === 0 ? (
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-8 text-center">
              <Building2 className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {searchTerm ? 'No businesses found' : 'No businesses yet'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchTerm 
                  ? `No businesses match "${searchTerm}"`
                  : 'Get started by creating your first business'
                }
              </p>
              {!searchTerm && (
                <Button 
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Create First Business button clicked');
                    setShowCreateModal(true);
                  }}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                  style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Business
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredAndSortedBusinesses.map((business, index) => (
              <div
                key={business.id}
                style={{ 
                  opacity: 1,
                  transform: 'none',
                  pointerEvents: 'auto'
                }}
              >
                <Card className={`bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm hover:bg-white/60 dark:hover:bg-gray-800/60 transition-all duration-300 cursor-pointer border-2 ${
                  selectedBusiness?.id === business.id 
                    ? 'border-blue-500 ring-2 ring-blue-500/20' 
                    : 'border-transparent'
                }`}>
                  <CardHeader className="pb-3 p-4 sm:p-6 sm:pb-3">
                    <div className="flex items-start justify-between gap-2 w-full">
                      <div className="min-w-0 flex-1 overflow-hidden pr-2">
                        <CardTitle className="truncate text-base sm:text-lg">{business.name}</CardTitle>
                        <CardDescription className="flex flex-wrap items-center gap-2 mt-1.5">
                          <Badge variant="secondary" className="text-xs truncate max-w-[200px] sm:max-w-none">
                            {business.industry || 'General'}
                          </Badge>
                          {selectedBusiness?.id === business.id && (
                            <Badge variant="default" className="text-xs bg-blue-500 flex-shrink-0">
                              Current
                            </Badge>
                          )}
                        </CardDescription>
                      </div>
                      
                      <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0" style={{ pointerEvents: 'auto' }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('🔧 Edit button clicked for:', business.name);
                            handleEditBusiness(business);
                          }}
                          className="p-1 h-7 w-7 sm:h-8 sm:w-8"
                          style={{ pointerEvents: 'auto' }}
                        >
                          <Edit3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('🗑️ Delete button clicked for:', business.name);
                            handleDeleteBusiness(business);
                          }}
                          className="p-1 h-7 w-7 sm:h-8 sm:w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          style={{ pointerEvents: 'auto' }}
                        >
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3 p-4 pt-0 sm:p-6 sm:pt-0">
                    {business.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {business.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span className="hidden sm:inline">{formatDate(business.created_at)}</span>
                        <span className="sm:hidden">{new Date(business.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                      {selectedBusiness?.id === business.id ? (
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-blue-600 dark:text-blue-400">
                          <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          Currently selected
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('🔄 Switch button clicked for:', business.name);
                            setSelectedBusiness(business);
                          }}
                          className="w-full text-xs sm:text-sm h-8 sm:h-9"
                          style={{ pointerEvents: 'auto' }}
                        >
                          Switch to this business
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}

        {/* Business Creation Modal */}
        <BusinessCreationModal 
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />

        {/* Edit Business Modal - Mobile Optimized */}
        <Dialog open={showEditModal} onOpenChange={(open) => {
          if (!loading) {
            setShowEditModal(open);
          }
        }}>
          <DialogContent 
            className="sm:max-w-[425px] w-[95vw] max-h-[90vh] p-0"
            onPointerDownOutside={(e) => {
              if (loading) {
                e.preventDefault();
              }
            }}
            onEscapeKeyDown={(e) => {
              if (loading) {
                e.preventDefault();
              }
            }}
          >
            <DialogHeader className="px-4 pt-4 pb-3 border-b border-gray-200 dark:border-gray-700">
              <DialogTitle className="text-base">Edit Business</DialogTitle>
              <DialogDescription className="text-xs">
                Update your business information
              </DialogDescription>
            </DialogHeader>
            
            <div className="px-4 py-3 space-y-3 max-h-[60vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="space-y-1.5">
                <Label htmlFor="edit-name" className="text-xs font-medium">Business Name</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Enter business name"
                  className="h-9 text-sm"
                />
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="edit-description" className="text-xs font-medium">Description (Optional)</Label>
                <Textarea
                  id="edit-description"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="Describe your business..."
                  rows={2}
                  className="text-sm resize-none min-h-[60px]"
                />
              </div>
            </div>

            <div className="flex gap-2 px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <Button 
                type="button"
                variant="outline" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowEditModal(false);
                }}
                disabled={loading}
                className="flex-1 h-9 text-sm"
              >
                Cancel
              </Button>
              <Button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSaveEdit();
                }}
                disabled={loading || !editForm.name.trim()}
                className="flex-1 h-9 text-sm bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent className="sm:max-w-[425px] max-w-[calc(100vw-2rem)] p-0">
            <DialogHeader className="px-4 pt-6 pb-4 sm:px-6">
              <DialogTitle className="text-lg sm:text-xl">Delete Business</DialogTitle>
              <DialogDescription className="text-sm">
                Are you sure you want to delete "{selectedBusinessForDelete?.name}"?
              </DialogDescription>
            </DialogHeader>
            
            <Alert className="mx-4 mb-4 sm:mx-6 sm:mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs sm:text-sm">
                This action cannot be undone. All data associated with this business will be permanently deleted.
              </AlertDescription>
            </Alert>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 px-4 pb-4 sm:px-6 sm:pb-6 border-t border-gray-200 dark:border-gray-700 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteModal(false)}
                className="w-full sm:w-auto text-sm"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmDelete}
                disabled={loading}
                variant="destructive"
                className="w-full sm:w-auto text-sm"
              >
                {loading ? 'Deleting...' : 'Delete Business'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default BusinessManagementPage;