import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Building2, Plus, Check, Eye, ChevronDown } from 'lucide-react';
import { useBusiness } from './BusinessContext';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Avatar, AvatarFallback } from './ui/avatar';

interface BusinessQuickSwitcherProps {
  stat: {
    title: string;
    value: string;
    icon: any;
    color: string;
    actionLabel: string;
    actionDescription: string;
  };
}

export const BusinessQuickSwitcher: React.FC<BusinessQuickSwitcherProps> = ({ stat }) => {
  const { selectedBusiness, userBusinesses, setSelectedBusiness } = useBusiness();
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleBusinessSelect = (business: any) => {
    setSelectedBusiness(business);
    setShowModal(false);
  };

  const handleCreateNew = () => {
    setShowModal(false);
    navigate('/business-management');
  };

  const IconComponent = stat.icon;

  return (
    <>
      {/* Main Card */}
      <Card className="glass-card">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 sm:p-3 bg-blue-500/20 rounded-xl flex-shrink-0`}>
                <IconComponent className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{stat.title}</p>
                <p className="text-lg sm:text-2xl font-semibold text-gray-800 dark:text-gray-200">{stat.value}</p>
              </div>
            </div>
          </div>

          {/* Current Selected Business */}
          {selectedBusiness && (
            <div className="mb-4 p-3 glass-panel rounded-lg">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200 truncate">
                    {selectedBusiness.name}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    {selectedBusiness.industry || 'General'} • Currently Active
                  </p>
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100 text-xs">
                  Active
                </Badge>
              </div>
            </div>
          )}

          {/* Action Button */}
          <Button
            onClick={() => setShowModal(true)}
            variant="outline"
            className="w-full flex items-center justify-center gap-2 bg-transparent hover:bg-blue-50 dark:hover:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300"
            disabled={userBusinesses.length === 0}
          >
            <Eye className="w-4 h-4" />
            {stat.actionLabel}
            <ChevronDown className="w-4 h-4 opacity-60" />
          </Button>

          {/* No businesses message */}
          {userBusinesses.length === 0 && (
            <div className="mt-3 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Create your first business to get started
              </p>
              <Button
                onClick={() => navigate('/business-management')}
                size="sm"
                className="mt-2 text-xs bg-gradient-to-r from-blue-600 to-purple-600"
              >
                <Plus className="w-3 h-3 mr-1" />
                Create Business
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Business Switcher Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[500px] bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Building2 className="w-6 h-6 text-blue-600" />
              Select Business
            </DialogTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Choose which business you want to view and manage
            </p>
          </DialogHeader>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {userBusinesses.map((business) => (
              <motion.div
                key={business.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <Card 
                  className={`cursor-pointer transition-all border-2 ${
                    selectedBusiness?.id === business.id 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'border-transparent hover:border-blue-200 dark:hover:border-blue-800 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                  onClick={() => handleBusinessSelect(business)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Avatar className="w-10 h-10 flex-shrink-0">
                          <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold">
                            {business.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold truncate">{business.name}</h3>
                            {selectedBusiness?.id === business.id && (
                              <Badge variant="default" className="text-xs bg-blue-500 text-white">
                                Current
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Badge variant="outline" className="text-xs">
                              {business.industry || 'General'}
                            </Badge>
                            <span className="text-xs">
                              Created {formatDate(business.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {selectedBusiness?.id === business.id ? (
                        <div className="flex items-center gap-2 text-blue-600">
                          <Check className="w-5 h-5" />
                        </div>
                      ) : (
                        <Button variant="ghost" size="sm" className="opacity-60 group-hover:opacity-100">
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <Button
              onClick={handleCreateNew}
              variant="outline"
              className="flex-1 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create New Business
            </Button>
            
            <Button
              onClick={() => navigate('/operations')}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white"
              disabled={!selectedBusiness}
            >
              <Eye className="w-4 h-4 mr-2" />
              View Operations
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};