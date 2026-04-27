import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Edit3, Save, X, CheckCircle } from 'lucide-react';
import { useBusiness } from './BusinessContext';
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';
import { toast } from "sonner@2.0.3";

interface QuickBusinessNameChangerProps {
  user?: any;
}

export default function QuickBusinessNameChanger({ user }: QuickBusinessNameChangerProps) {
  const { selectedBusiness, setSelectedBusiness, userBusinesses, refreshBusinesses } = useBusiness();
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleStartEdit = () => {
    if (selectedBusiness) {
      setNewName(selectedBusiness.name);
      setIsEditing(true);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setNewName('');
  };

  const handleSave = async () => {
    if (!selectedBusiness || !newName.trim()) {
      toast.error('Please enter a valid business name');
      return;
    }

    if (newName.trim() === selectedBusiness.name) {
      setIsEditing(false);
      toast.info('No changes made');
      return;
    }

    setIsLoading(true);
    
    try {
      // Get current session for API call
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Please log in again to save changes');
      }

      // Call the business update API endpoint (same server as BusinessContext loads from)
      const endpoint = `https://${projectId}.supabase.co/functions/v1/make-server-ac1075a9/businesses/${selectedBusiness.id}`;
      const updateData = { name: newName.trim() };
      
      console.log('💾 Updating business with standard endpoint:', {
        businessId: selectedBusiness.id,
        businessName: selectedBusiness.name,
        newName: newName.trim(),
        userId: user.id,
        endpoint: endpoint,
        updateData: updateData
      });
      
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(updateData)
      });

      console.log('💾 Server response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (response.ok) {
        const result = await response.json();
        console.log('💾 Server response data:', result);
        
        const updatedBusiness = result.business || {
          ...selectedBusiness,
          name: newName.trim(),
          updated_at: new Date().toISOString()
        };

        // Update the selected business in context with server response
        setSelectedBusiness(updatedBusiness);
        
        // Force refresh the businesses list from the server to ensure consistency
        try {
          await refreshBusinesses();
          console.log('✅ Successfully refreshed businesses from server');
        } catch (refreshError) {
          console.warn('⚠️ Could not refresh businesses list:', refreshError);
          // Don't fail the update if refresh fails
        }
        
        setIsEditing(false);
        setNewName('');
        
        toast.success(`✅ Business name saved to database: "${newName.trim()}"!`);
        
      } else {
        let errorText = 'Unknown error';
        try {
          errorText = await response.text();
        } catch (e) {
          errorText = `HTTP ${response.status}`;
        }
        
        console.error('Failed to update business:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        
        if (response.status === 404) {
          throw new Error('Business not found in database. Please refresh and try again.');
        } else if (response.status === 401) {
          throw new Error('Please log in again to save changes');
        } else if (response.status === 500) {
          throw new Error('Server error. Please try again in a moment.');
        } else {
          throw new Error(`Failed to save (${response.status}): ${errorText || 'Server error'}`);
        }
      }
      
    } catch (error) {
      console.error('Error updating business name:', error);
      
      // Extract a meaningful error message
      let errorMessage = 'Failed to save business name to database';
      
      if (error && typeof error === 'object') {
        if (error.message && typeof error.message === 'string') {
          errorMessage = error.message;
        } else if (error.toString && typeof error.toString === 'function') {
          errorMessage = error.toString();
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!user) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <p className="text-gray-600">Please log in to manage your business</p>
        </CardContent>
      </Card>
    );
  }

  if (!selectedBusiness) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <p className="text-gray-600 mb-4">No business selected</p>
          <p className="text-sm text-gray-500">
            Please select a business from the business switcher in the top navigation
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-blue-600" />
            Quick Business Name Changer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="outline" className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-500" />
              {selectedBusiness.name}
            </Badge>
            <span className="text-sm text-gray-500">
              ID: {selectedBusiness.id}
            </span>
          </div>

          {!isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Current Business Name
                </label>
                <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-lg font-semibold">{selectedBusiness.name}</p>
                </div>
              </div>
              
              <Button onClick={handleStartEdit} className="w-full">
                <Edit3 className="w-4 h-4 mr-2" />
                Change Business Name
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  New Business Name
                </label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter new business name"
                  className="mt-1"
                  autoFocus
                  disabled={isLoading}
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleSave} 
                  disabled={!newName.trim() || isLoading}
                  className="flex-1"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
          
          <div className="text-xs text-gray-500 space-y-1 pt-4 border-t">
            <p><strong>Note:</strong> This tool saves your business name changes to the database.</p>
            <p>Changes are permanently saved and will persist across all sessions.</p>
            <p>The business switcher and all app features will reflect the new name immediately.</p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            variant="outline" 
            onClick={() => setNewName('Cofounder Plus')}
            className="w-full justify-start"
            disabled={!isEditing}
          >
            Set to "Cofounder Plus"
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setNewName('Super Star')}
            className="w-full justify-start"
            disabled={!isEditing}
          >
            Set to "Super Star"
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setNewName('My Awesome Business')}
            className="w-full justify-start"
            disabled={!isEditing}
          >
            Set to "My Awesome Business"
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}