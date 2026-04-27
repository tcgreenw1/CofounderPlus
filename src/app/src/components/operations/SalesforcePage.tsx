import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Cloud } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import SalesforceOAuthIntegration from './SalesforceOAuthIntegration';

function SalesforcePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen starry-background-light pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/operations/sales')}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back to Sales</span>
              </Button>
              <div className="flex items-center gap-2">
                <Cloud className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100">
                  Salesforce Integration
                </h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <SalesforceOAuthIntegration />
        </motion.div>
      </div>
    </div>
  );
}

export default SalesforcePage;
