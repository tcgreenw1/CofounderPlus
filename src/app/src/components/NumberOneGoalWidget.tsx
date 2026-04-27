import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Star, Target, DollarSign, Calendar, TrendingUp, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';

interface NumberOneGoalWidgetProps {
  goal: any;
  showAddGoalButton?: boolean;
}

export const NumberOneGoalWidget: React.FC<NumberOneGoalWidgetProps> = ({ 
  goal, 
  showAddGoalButton = true 
}) => {
  const navigate = useNavigate();

  const handleNavigateToGoal = () => {
    navigate('/dream-board');
  };

  const categoryConfig = {
    financial: { color: 'text-green-500', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/20' },
    lifestyle: { color: 'text-blue-500', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/20' },
    career: { color: 'text-orange-500', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/20' },
    personal: { color: 'text-pink-500', bgColor: 'bg-pink-500/10', borderColor: 'border-pink-500/20' },
    travel: { color: 'text-blue-600', bgColor: 'bg-blue-600/10', borderColor: 'border-blue-600/20' },
    family: { color: 'text-indigo-500', bgColor: 'bg-indigo-500/10', borderColor: 'border-indigo-500/20' }
  };

  if (!goal) {
    return (
      <Card className="glass-card border-yellow-400/30 dark:border-yellow-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-600" />
            Your #1 Goal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <motion.div
              animate={{ 
                scale: [1, 1.05, 1],
                rotate: [0, 2, -2, 0]
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              className="w-16 h-16 mx-auto mb-4 bg-yellow-500/20 rounded-full flex items-center justify-center"
            >
              <Target className="w-8 h-8 text-yellow-600" />
            </motion.div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Set Your #1 Goal
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Focus on what matters most by choosing your top priority from your dream board.
            </p>
            {showAddGoalButton && (
              <Button
                onClick={handleNavigateToGoal}
                className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Dream Board
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const categoryInfo = categoryConfig[goal.category as keyof typeof categoryConfig] || categoryConfig.financial;
  
  return (
    <Card className="glass-card border-yellow-400/30 dark:border-yellow-500/30 cursor-pointer"
          onClick={handleNavigateToGoal}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          >
            <Star className="w-5 h-5 text-yellow-600" />
          </motion.div>
          Your #1 Goal
          <Badge className="ml-auto bg-gradient-to-r from-yellow-500 to-amber-500 text-white border-0">
            Priority Focus
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Goal Title and Description */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
              {goal.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {goal.description}
            </p>
          </div>

          {/* Category and Priority Tags */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={`${categoryInfo.bgColor} ${categoryInfo.color} border-0 text-xs`}>
              {goal.category}
            </Badge>
            {goal.priority && (
              <Badge variant="outline" className="text-xs">
                {goal.priority} priority
              </Badge>
            )}
          </div>

          {/* Target Amount */}
          {goal.targetAmount && (
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-500" />
              <span className="font-medium text-green-600 dark:text-green-400">
                ${goal.targetAmount.toLocaleString()}
              </span>
            </div>
          )}

          {/* Target Date */}
          {goal.targetDate && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-blue-600 dark:text-blue-400">
                Target: {new Date(goal.targetDate).toLocaleDateString()}
              </span>
            </div>
          )}

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Progress
              </span>
              <span className="text-xs font-medium text-gray-900 dark:text-white">
                {goal.progress}%
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className={`h-full ${
                  goal.isCompleted 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                    : 'bg-gradient-to-r from-yellow-500 to-amber-500'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${goal.progress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
              onClick={(e) => {
                e.stopPropagation();
                handleNavigateToGoal();
              }}
            >
              <TrendingUp className="w-3 h-3 mr-1" />
              View Dream Board
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};