import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Calendar, Shield, Info, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';

export const AlphaTestingNotice: React.FC = () => {
  const [showDialog, setShowDialog] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleOpenDialog = () => {
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
  };

  return (
    <>
      {/* Fixed Alpha Testing Button - Top Left */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 1 }}
        onClick={handleOpenDialog}
        className="fixed top-4 left-4 z-40 px-3 py-2 sm:px-4 sm:py-2 bg-orange-500/90 hover:bg-orange-500 text-white rounded-xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 backdrop-blur-lg border border-orange-400/50 text-xs sm:text-sm"
      >
        <div className="flex items-center gap-1 sm:gap-2">
          <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Alpha Testing</span>
          <span className="sm:hidden">Alpha</span>
        </div>
      </motion.button>

      {/* Alpha Testing Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border-orange-200/50 dark:border-orange-800/50 shadow-2xl max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-lg sm:text-xl">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  Alpha Testing Phase
                </span>
                <Badge className="ml-2 bg-orange-500/20 text-orange-700 dark:text-orange-300 text-xs">
                  ALPHA
                </Badge>
              </div>
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
              Important information about Cofounder's current development status
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 sm:space-y-6">
            {/* Main Warning */}
            <Card className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-orange-800 dark:text-orange-200 mb-2 text-sm sm:text-base">
                      🚨 Do Not Enter Personal Information
                    </h3>
                    <p className="text-xs sm:text-sm text-orange-700 dark:text-orange-300 leading-relaxed">
                      Cofounder is currently in <strong>Alpha Testing</strong>. Please do not enter any personal, 
                      sensitive, or real business information during this phase. Use placeholder or test data only.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card className="bg-white/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2 text-sm sm:text-base">
                      📅 Beta Testing Launch
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      <strong>September 1st, 2025</strong> - Cofounder will transition to Beta Testing with enhanced 
                      security, data protection, and production-ready features.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* What This Means */}
            <Card className="bg-white/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-purple-800 dark:text-purple-200 mb-3 text-sm sm:text-base">
                      What This Means for You
                    </h3>
                    <ul className="space-y-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full flex-shrink-0 mt-2"></span>
                        <span><strong>Explore freely:</strong> Test all features and functionality</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full flex-shrink-0 mt-2"></span>
                        <span><strong>Use fake data:</strong> Create test businesses with placeholder information</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full flex-shrink-0 mt-2"></span>
                        <span><strong>Provide feedback:</strong> Help us improve by reporting bugs or suggestions</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full flex-shrink-0 mt-2"></span>
                        <span><strong>Data may be reset:</strong> Alpha data might be cleared during development</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Beta Features Preview */}
            <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-green-200 dark:border-green-800">
              <CardContent className="p-4 sm:p-6">
                <h3 className="font-semibold text-green-800 dark:text-green-200 mb-3 text-sm sm:text-base">
                  🚀 Coming in Beta (September 2025)
                </h3>
                <ul className="space-y-2 text-xs sm:text-sm text-green-700 dark:text-green-300">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>Enterprise-grade security & encryption</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>Real business data protection & privacy</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>Advanced business analytics & insights</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>Premium features & integrations</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Acknowledgment */}
            <div className="text-center pt-2">
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-4">
                By continuing to use Cofounder Alpha, you acknowledge that this is test software 
                and agree not to enter any real personal or business information.
              </p>
              
              <Button 
                onClick={handleCloseDialog} 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 sm:px-8 sm:py-3 text-sm sm:text-base"
              >
                I Understand
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};