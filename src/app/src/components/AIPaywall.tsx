import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Zap, Crown, Sparkles, TrendingUp, Check, X } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../utils/supabase/client';

interface AIPaywallProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  remaining: number;
  monthlyAllocation: number;
  currentTier: string;
}

const TIER_INFO = {
  free: {
    name: 'Free',
    messages: 50,
    price: '$0',
    color: 'from-gray-500 to-gray-600',
    icon: Zap,
  },
  creator: {
    name: 'Launch',
    messages: 500,
    price: '$19',
    color: 'from-blue-500 to-cyan-500',
    icon: Sparkles,
    recommended: true,
  },
  builder: {
    name: 'Grow',
    messages: 2000,
    price: '$49',
    color: 'from-purple-500 to-pink-500',
    icon: TrendingUp,
  },
  studio: {
    name: 'Scale',
    messages: 999999,
    price: '$199',
    color: 'from-yellow-500 to-orange-500',
    icon: Crown,
  },
};

export function AIPaywall({ open, onOpenChange, remaining, monthlyAllocation, currentTier }: AIPaywallProps) {
  const navigate = useNavigate();
  const handleUpgrade = () => {
    // Navigate to pricing page for all users
    onOpenChange(false);
    navigate('/pricing');
  };

  const maxBalance = monthlyAllocation * 2; // Cap at 2 months

  const availableTiers = Object.entries(TIER_INFO).filter(
    ([tier]) => TIER_INFO[tier as keyof typeof TIER_INFO].messages > monthlyAllocation
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="w-16 h-16 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center"
            >
              <Zap className="w-8 h-8 text-white" />
            </motion.div>
          </div>

          <DialogTitle className="text-center text-2xl">
            No AI Messages Remaining
          </DialogTitle>
          
          <DialogDescription className="text-center text-base">
            You have <strong>0 messages remaining</strong> on the{' '}
            <strong>{TIER_INFO[currentTier as keyof typeof TIER_INFO]?.name || 'Free'}</strong> plan.
            Upgrade to get more AI messages and continue chatting with your AI cofounder.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Current Balance Card */}
          <Card className="p-4 bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Messages Remaining
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {remaining} messages
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {monthlyAllocation} added every 30 days (max {maxBalance})
                </div>
              </div>
              <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center">
                <Zap className="w-8 h-8 text-orange-500" />
              </div>
            </div>
            
            {/* Progress Bar (shows how depleted the balance is) */}
            <div className="mt-4 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-500"
                style={{ width: `${Math.min(100, (remaining / maxBalance) * 100)}%` }}
              />
            </div>
          </Card>

          {/* Upgrade Options */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Upgrade to continue chatting with your AI cofounder
            </h3>
            
            <div className="grid gap-4">
              {availableTiers.map(([tier, info]) => {
                const Icon = info.icon;
                return (
                  <Card
                    key={tier}
                    className={`p-4 cursor-pointer transition-all hover:shadow-lg ${
                      info.recommended
                        ? 'ring-2 ring-blue-500 dark:ring-blue-400'
                        : 'hover:border-primary'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${info.color} flex items-center justify-center`}>
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-gray-100">
                              {info.name}
                            </div>
                            {info.recommended && (
                              <Badge className="bg-blue-500 text-white text-xs">
                                Most Popular
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-baseline gap-2 mb-3">
                          <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                            {info.price}
                          </span>
                          <span className="text-gray-600 dark:text-gray-400">/month</span>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <span><strong>{info.messages.toLocaleString()}</strong> AI messages/month</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <span>Full business operations access</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <span>Advanced analytics & insights</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              Maybe Later
            </Button>
            <Button
              onClick={handleUpgrade}
              className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
            >
              <Crown className="w-4 h-4 mr-2" />
              View Pricing Plans
            </Button>
          </div>

          {/* Additional Info */}
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            You'll get {monthlyAllocation} more messages in 30 days. Unused messages roll over up to {maxBalance} total.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}