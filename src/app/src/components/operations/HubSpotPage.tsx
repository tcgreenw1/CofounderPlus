import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Building } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import HubSpotOAuthIntegration from './HubSpotOAuthIntegration';

function HubSpotPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen starry-background-light pb-20 pt-[60px] sm:pt-0">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/operations/sales')}
                className="gap-1 sm:gap-2 h-8 sm:h-9 px-2 sm:px-3"
              >
                <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline text-xs sm:text-sm">Back to Sales</span>
                <span className="sm:hidden text-xs">Back</span>
              </Button>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Building className="w-4 h-4 sm:w-6 sm:h-6 text-orange-600 dark:text-orange-400" />
                <h1 className="text-base sm:text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100">
                  HubSpot Integration
                </h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <HubSpotOAuthIntegration />
        </motion.div>
      </div>
    </div>
  );
}

export default HubSpotPage;