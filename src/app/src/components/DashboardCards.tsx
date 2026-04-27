import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useBusiness } from './BusinessContext';
import { BusinessQuickSwitcher } from './BusinessQuickSwitcher';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { ArrowRight, ArrowUp } from 'lucide-react';

interface DashboardCardsProps {
  quickStats: any[];
  isMobile: boolean;
}

export const DashboardCards: React.FC<DashboardCardsProps> = ({ quickStats, isMobile }) => {
  const navigate = useNavigate();
  const { selectedBusiness } = useBusiness();

  return (
    <div className={`grid gap-3 ${isMobile ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-6'}`}>
      {quickStats.map((stat, index) => {
        const IconComponent = stat.icon;
        
        // Special handling for the Active Businesses card
        if (stat.customAction === 'businessSwitcher') {
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="col-span-2 md:col-span-1"
            >
              <BusinessQuickSwitcher stat={stat} />
            </motion.div>
          );
        }

        // Regular stat cards with premium liquid glass styling
        return (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            whileHover={{ y: -4, scale: 1.02 }}
            className="col-span-2 sm:col-span-1"
          >
            <Card 
              className={`liquid-glass-card ${isMobile ? 'dashboard-card' : ''}`}
              style={{
                boxShadow: '0 4px 16px rgba(0, 224, 255, 0.08)',
                transition: 'all 0.3s ease',
              }}
            >
              <CardContent className={isMobile ? "p-2 card-content" : "p-4 sm:p-6"}>
                <div className={`flex items-center gap-2 ${isMobile ? 'mb-2' : 'mb-4'}`}>
                  {/* Premium Glass Icon Container */}
                  <motion.div 
                    className={`${isMobile ? 'p-1.5' : 'p-2 sm:p-3'} rounded-xl flex-shrink-0`}
                    style={{
                      background: stat.title === 'Total Revenue' 
                        ? 'linear-gradient(135deg, rgba(108, 255, 108, 0.2), rgba(200, 255, 200, 0.15))'
                        : stat.title === 'Total Expenses'
                        ? 'linear-gradient(135deg, rgba(255, 79, 79, 0.2), rgba(255, 150, 150, 0.15))'
                        : stat.title === 'Pending Invoices'
                        ? 'linear-gradient(135deg, rgba(255, 207, 0, 0.2), rgba(255, 235, 150, 0.15))'
                        : 'linear-gradient(135deg, rgba(0, 224, 255, 0.15), rgba(150, 235, 255, 0.12))',
                      backdropFilter: 'blur(16px)',
                      border: stat.title === 'Total Revenue'
                        ? '1px solid rgba(108, 255, 108, 0.3)'
                        : stat.title === 'Total Expenses'
                        ? '1px solid rgba(255, 79, 79, 0.3)'
                        : stat.title === 'Pending Invoices'
                        ? '1px solid rgba(255, 207, 0, 0.3)'
                        : '1px solid rgba(0, 224, 255, 0.3)',
                      boxShadow: stat.title === 'Total Revenue'
                        ? '0 2px 8px rgba(108, 255, 108, 0.15)'
                        : stat.title === 'Total Expenses'
                        ? '0 2px 8px rgba(255, 79, 79, 0.15)'
                        : stat.title === 'Pending Invoices'
                        ? '0 2px 8px rgba(255, 207, 0, 0.15)'
                        : '0 2px 8px rgba(0, 224, 255, 0.15)',
                    }}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <IconComponent className={`${isMobile ? 'w-3 h-3' : 'w-5 h-5 sm:w-6 sm:h-6'} ${stat.color}`} />
                  </motion.div>
                  {/* Text content */}
                  <div className="min-w-0 flex-1">
                    <p className={`${isMobile ? 'text-xs' : 'text-xs sm:text-sm'} text-gray-600 dark:text-gray-400 truncate`}>{stat.title}</p>
                    <p className={`${isMobile ? 'text-sm' : 'text-lg sm:text-2xl'} font-semibold text-gray-800 dark:text-gray-200 truncate`}>{stat.value}</p>
                  </div>
                </div>

                {stat.change && !isMobile && (
                  <div className="flex items-center gap-1 mb-4 text-sm">
                    {stat.trend === 'up' && <ArrowUp className="w-3 h-3 text-green-600" />}
                    {stat.trend === 'down' && <ArrowUp className="w-3 h-3 text-red-600 transform rotate-180" />}
                    <span className={stat.trend === 'up' ? 'text-green-600' : stat.trend === 'down' ? 'text-red-600' : 'text-gray-600'}>
                      {stat.change}
                    </span>
                  </div>
                )}

                <div className={isMobile ? "space-y-1" : "space-y-2"}>
                  {!isMobile && (
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {stat.actionDescription}
                    </p>
                  )}
                  
                  {selectedBusiness && !isMobile && (
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      Data for: {selectedBusiness.name}
                    </p>
                  )}
                  
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      onClick={() => navigate(stat.actionPath)}
                      variant="outline"
                      size={isMobile ? "sm" : "sm"}
                      className={`w-full flex items-center justify-center gap-1 rounded-xl ${isMobile ? 'h-7 text-xs' : ''}`}
                      style={{
                        background: 'linear-gradient(135deg, rgba(0, 224, 255, 0.08), rgba(108, 255, 108, 0.05))',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(0, 224, 255, 0.2)',
                      }}
                    >
                      {isMobile ? 'View' : stat.actionLabel}
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};