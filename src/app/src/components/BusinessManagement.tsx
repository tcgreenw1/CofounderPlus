import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useBusiness } from './BusinessContext';
import { updateBusiness, deleteBusiness } from '../utils/businessApi';
import {
  Building2, Edit3, Trash2, Check, X,  MoreHorizontal,
  AlertTriangle, Eye, ChevronDown, ChevronUp
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Alert, AlertDescription } from './ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { toast } from 'sonner';

interface Business {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

interface EditingBusiness {
  id: string;
  name: string;
}

export const BusinessManagement: React.FC = () => {
  const { userBusinesses, selectedBusiness, setSelectedBusiness, refreshBusinesses } = useBusiness();
  
  // State management
  const [editingBusiness, setEditingBusiness] = useState<EditingBusiness | null>(null);
  const [selectedBusinessIds, setSelectedBusinessIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  // Helper functions
  const toggleBusinessSelection = (businessId: string) => {
    setSelectedBusinessIds(prev => 
      prev.includes(businessId) 
        ? prev.filter(id => id !== businessId)
        : [...prev, businessId]
    );
  };

  const selectAllBusinesses = () => {
    setSelectedBusinessIds(
      selectedBusinessIds.length === userBusinesses.length 
        ? [] 
        : userBusinesses.map(b => b.id)
    );
  };

  const startEditing = (business: Business) => {
    setEditingBusiness({
      id: business.id,
      name: business.name
    });
  };

  const cancelEditing = () => {
    setEditingBusiness(null);
  };

  const saveEdit = async () => {
    if (!editingBusiness) return;

    // Don't try to update temporary businesses on backend
    if (editingBusiness.id.startsWith('temp-')) {
      toast.error('Cannot edit temporary business. Please wait for it to be created.');
      setEditingBusiness(null);
      return;
    }

    setIsUpdating(prev => [...prev, editingBusiness.id]);
    
    try {
      const updated = await updateBusiness(editingBusiness.id, {
        name: editingBusiness.name.trim()
      });

      if (updated) {
        toast.success('Business updated successfully');
        await refreshBusinesses();
        setEditingBusiness(null);
      }
    } catch (error) {
      console.error('Error updating business:', error);
      toast.error('Failed to update business');
    } finally {
      setIsUpdating(prev => prev.filter(id => id !== editingBusiness.id));
    }
  };

  const handleDelete = async (businessId: string) => {
    setIsDeleting(prev => [...prev, businessId]);
    
    try {
      // Check if this is a temporary business or board ID (optimistic update)
      // This prevents calling the backend API for temp businesses or boards
      const id = businessId?.toString() || '';
      if (id.startsWith('temp-') || id.startsWith('board_')) {
        console.log('🗑️ Business Management: Removing temporary business/board from UI:', businessId);
        
        // If we deleted the selected business, clear selection
        if (selectedBusiness?.id === businessId) {
          setSelectedBusiness(null);
        }
        
        // Remove from selected businesses
        setSelectedBusinessIds(prev => prev.filter(id => id !== businessId));
        
        // Refresh to remove it from the list
        await refreshBusinesses();
        
        toast.success(id.startsWith('board_') ? 'Board entry removed' : 'Temporary business removed');
        setIsDeleting(prev => prev.filter(id => id !== businessId));
        setShowDeleteConfirm(null);
        return; // CRITICAL: Exit early to prevent backend call
      }
      
      // Only call backend for real businesses
      console.log('🗑️ Business Management: Deleting real business:', businessId);
      const success = await deleteBusiness(businessId);
      
      if (success) {
        toast.success('Business deleted successfully');
        
        // If we deleted the selected business, clear selection
        if (selectedBusiness?.id === businessId) {
          setSelectedBusiness(null);
        }
        
        // Remove from selected businesses
        setSelectedBusinessIds(prev => prev.filter(id => id !== businessId));
        
        await refreshBusinesses();
      }
    } catch (error) {
      console.error('🗑️ Business Management: Failed to delete business:', error);
      
      // Special handling for 404 errors on temp businesses or boards
      if (error.message && (error.message.includes('temp-') || error.message.includes('board_'))) {
        console.log('🗑️ Detected orphaned temporary business/board, removing from UI');
        toast.info('Removed invalid entry');
        
        if (selectedBusiness?.id === businessId) {
          setSelectedBusiness(null);
        }
        setSelectedBusinessIds(prev => prev.filter(id => id !== businessId));
        await refreshBusinesses();
      } else {
        toast.error(`Failed to delete business: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setIsDeleting(prev => prev.filter(id => id !== businessId));
      setShowDeleteConfirm(null);
    }
  };

  const handleBulkDelete = async () => {
    // Separate temporary and real businesses
    const tempBusinessIds = selectedBusinessIds.filter(id => id.startsWith('temp-'));
    const realBusinessIds = selectedBusinessIds.filter(id => !id.startsWith('temp-'));
    
    setIsDeleting([...selectedBusinessIds]);
    
    try {
      // Delete real businesses from backend
      if (realBusinessIds.length > 0) {
        const deletePromises = realBusinessIds.map(id => deleteBusiness(id));
        await Promise.all(deletePromises);
      }
      
      // Handle temporary businesses - just remove from local state
      if (tempBusinessIds.length > 0) {
        tempBusinessIds.forEach(tempId => {
          if (selectedBusiness?.id === tempId) {
            setSelectedBusiness(null);
          }
        });
      }
      
      const totalCount = selectedBusinessIds.length;
      const message = totalCount === 1 
        ? 'Business deleted successfully'
        : `${totalCount} businesses deleted successfully`;
      toast.success(message);
      
      // Clear selection if selected business was deleted
      if (selectedBusiness && selectedBusinessIds.includes(selectedBusiness.id)) {
        setSelectedBusiness(null);
      }
      
      setSelectedBusinessIds([]);
      await refreshBusinesses();
    } catch (error) {
      console.error('Error bulk deleting businesses:', error);
      toast.error('Some businesses failed to delete');
    } finally {
      setIsDeleting([]);
      setShowBulkDeleteConfirm(false);
    }
  };

  if (userBusinesses.length === 0) {
    return null; // Don't show if no businesses
  }

  return (
    <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-white/60 dark:border-gray-700/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            Business Management
            <Badge variant="outline" className="ml-2">
              {userBusinesses.length} {userBusinesses.length === 1 ? 'Business' : 'Businesses'}
            </Badge>
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {selectedBusinessIds.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBulkDeleteConfirm(true)}
                className="flex items-center gap-2 text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-3 h-3" />
                Delete {selectedBusinessIds.length}
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent className="pt-0">
              {/* Bulk Actions Bar */}
              {selectedBusinessIds.length > 0 && (
                <Alert className="mb-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                  <AlertDescription className="flex items-center justify-between">
                    <span>{selectedBusinessIds.length} businesses selected</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedBusinessIds([])}
                    >
                      Clear Selection
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {/* Desktop Table View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedBusinessIds.length === userBusinesses.filter(b => !b.id.startsWith('temp-')).length && userBusinesses.filter(b => !b.id.startsWith('temp-')).length > 0}
                          onCheckedChange={selectAllBusinesses}
                        />
                      </TableHead>
                      <TableHead>Business Name</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userBusinesses.filter(b => !b.id.startsWith('temp-')).map((business) => (
                      <TableRow key={business.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedBusinessIds.includes(business.id)}
                            onCheckedChange={() => toggleBusinessSelection(business.id)}
                          />
                        </TableCell>
                        
                        <TableCell>
                          {editingBusiness?.id === business.id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={editingBusiness.name}
                                onChange={(e) => setEditingBusiness({
                                  ...editingBusiness,
                                  name: e.target.value
                                })}
                                className="h-8"
                                autoFocus
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={saveEdit}
                                disabled={isUpdating.includes(business.id)}
                                className="h-8 w-8 p-0"
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={cancelEditing}
                                className="h-8 w-8 p-0"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{business.name}</span>
                              {selectedBusiness?.id === business.id && (
                                <Badge variant="outline" className="text-xs">Active</Badge>
                              )}
                            </div>
                          )}
                        </TableCell>
                        
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(business.created_at).toLocaleDateString()}
                        </TableCell>
                        
                        <TableCell>
                          {isUpdating.includes(business.id) ? (
                            <Badge variant="outline">Updating...</Badge>
                          ) : isDeleting.includes(business.id) ? (
                            <Badge variant="destructive">Deleting...</Badge>
                          ) : (
                            <Badge variant="outline" className="text-green-600">Active</Badge>
                          )}
                        </TableCell>
                        
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {selectedBusiness?.id !== business.id && (
                                <>
                                  <DropdownMenuItem onClick={() => setSelectedBusiness(business)}>
                                    <Eye className="w-4 h-4 mr-2" />
                                    Set as Active
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                </>
                              )}
                              <DropdownMenuItem onClick={() => startEditing(business)}>
                                <Edit3 className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => setShowDeleteConfirm(business.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {userBusinesses.filter(b => !b.id.startsWith('temp-')).map((business) => (
                  <Card key={business.id} className="border border-gray-200 dark:border-gray-700">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={selectedBusinessIds.includes(business.id)}
                            onCheckedChange={() => toggleBusinessSelection(business.id)}
                          />
                          <div>
                            <h4 className="font-medium">{business.name}</h4>
                          </div>
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {selectedBusiness?.id !== business.id && (
                              <>
                                <DropdownMenuItem onClick={() => setSelectedBusiness(business)}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  Set as Active
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            <DropdownMenuItem onClick={() => startEditing(business)}>
                              <Edit3 className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => setShowDeleteConfirm(business.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Created {new Date(business.created_at).toLocaleDateString()}</span>
                        {selectedBusiness?.id === business.id && (
                          <Badge variant="outline" className="text-xs">Active</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Delete Business
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this business? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(null)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => showDeleteConfirm && handleDelete(showDeleteConfirm)}
              className="flex-1"
            >
              Delete Business
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={showBulkDeleteConfirm} onOpenChange={setShowBulkDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Delete Multiple Businesses
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedBusinessIds.length} businesses? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowBulkDeleteConfirm(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              className="flex-1"
            >
              Delete {selectedBusinessIds.length} Businesses
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};