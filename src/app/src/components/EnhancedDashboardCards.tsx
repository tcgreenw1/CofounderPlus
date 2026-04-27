import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Zap, 
  Target, 
  Trophy, 
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Eye,
  DollarSign,
  BarChart3,
  Flame,
  Star,
  ArrowRight,
  Plus,
  Lightbulb,
  Shield,
  Crown,
  FileText,
  Timer,
  Rocket
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface DashboardStats {
  title: string;
  value: string;
  change?: string | null;
  trend?: 'up' | 'down' | 'neutral';
  icon: any;
  color: string;
  actionLabel: string;
  actionPath?: string | null;
  actionDescription: string;
  customAction?: string;
}

interface EnhancedDashboardCardsProps {
  quickStats: DashboardStats[];
  isMobile: boolean;
  isProUser?: boolean;
  userStreak?: number;
  totalXP?: number;
  currentLevel?: number;
  nextTasks?: any[];
  onUpgrade?: () => void;
  onBusinessSwitch?: () => void;
  bankBalance?: number;
  opsKPIs?: {
    product: number;
    marketing: number;
    sales: number;
    finance: number;
  };
  alerts?: any[];
}

export const EnhancedDashboardCards: React.FC<EnhancedDashboardCardsProps> = ({
  quickStats,
  isMobile,
  isProUser = false,
  userStreak = 0,
  totalXP = 0,
  currentLevel = 1,
  nextTasks = [],
  onUpgrade,
  onBusinessSwitch,
  bankBalance = 0,
  opsKPIs = { product: 0, marketing: 0, sales: 0, finance: 0 },
  alerts = []
}) => {
  const navigate = useNavigate();
  const [showRescuePlan, setShowRescuePlan] = useState(false);

  // Generate rescue plan micro tasks
  const generateRescueTasks = () => {
    const rescueTasks = [
      {
        id: 'rescue-1',
        title: 'Send 3 customer outreach messages',
        duration: '15 min',
        xp: 10,
        category: 'sales'
      },
      {
        id: 'rescue-2', 
        title: 'Review and update product pricing',
        duration: '10 min',
        xp: 15,
        category: 'product'
      },
      {
        id: 'rescue-3',
        title: 'Post on social media about your business',
        duration: '5 min',
        xp: 5,
        category: 'marketing'
      }
    ];
    
    setShowRescuePlan(true);
    toast.success('Rescue plan activated! 3 micro tasks added for today.', {
      description: 'Complete these quick wins to maintain momentum.'
    });
  };

  const handleStatAction = (stat: DashboardStats) => {
    if (stat.customAction === 'businessSwitcher') {
      onBusinessSwitch?.();
    } else if (stat.actionPath) {
      navigate(stat.actionPath);
    }
  };

  return (
    <div className="space-y-6">
      {/* Fast Lane Section - Always visible */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200/50 dark:border-blue-700/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-blue-600" />
            Fast Lane
            <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
              Today's Focus
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Next 3 Tasks */}
            <div className="lg:col-span-2">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-600" />
                Next 3 Tasks
              </h4>
              <div className="space-y-2">
                {nextTasks.length > 0 ? (
                  nextTasks.slice(0, 3).map((task, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-blue-200/30 dark:border-blue-700/30">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        <div>
                          <div className="font-medium text-sm">{task.title}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {task.milestone} • {task.estimatedTime || '30 min'}
                          </div>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => navigate('/roadmap')}>
                        <ArrowRight className="w-3 h-3" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-600 dark:text-gray-400 p-3 text-center">
                    All caught up! Check your roadmap for new tasks.
                  </div>
                )}
              </div>
            </div>

            {/* Streak & Timer */}
            <div className="space-y-4">
              <div className="text-center p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-blue-200/30 dark:border-blue-700/30">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Flame className="w-5 h-5 text-orange-500" />
                  <span className="text-2xl font-bold text-orange-600">{userStreak}</span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Day Streak</div>
              </div>
              
              <div className="text-center p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-blue-200/30 dark:border-blue-700/30">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Timer className="w-5 h-5 text-purple-500" />
                  <span className="text-lg font-mono">25:00</span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Focus Timer</div>
                <Button size="sm" variant="outline" className="mt-2 w-full" onClick={() => navigate('/roadmap')}>
                  Start Session
                </Button>
              </div>
            </div>
          </div>

          {/* Proof Locker Link */}
          <div className="mt-4 pt-4 border-t border-blue-200/30 dark:border-blue-700/30">
            <Button 
              variant="outline" 
              className="w-full border-blue-200 dark:border-blue-700"
              onClick={() => navigate('/proof-locker')}
            >
              <Shield className="w-4 h-4 mr-2" />
              View Proof Locker
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Rescue Plan Button */}
      <div className="flex justify-center">
        <Button 
          onClick={generateRescueTasks}
          className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-none"
        >
          <Lightbulb className="w-4 h-4 mr-2" />
          Activate Rescue Plan
          <Zap className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* Rescue Plan Tasks */}
      {showRescuePlan && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <h4 className="font-semibold text-orange-600 dark:text-orange-400 flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Rescue Plan - Today's Micro Tasks
          </h4>
          {[
            { title: 'Send 3 customer outreach messages', duration: '15 min', xp: 10 },
            { title: 'Review and update product pricing', duration: '10 min', xp: 15 },
            { title: 'Post on social media about your business', duration: '5 min', xp: 5 }
          ].map((task, index) => (
            <Card key={index} className="border-orange-200 dark:border-orange-800">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">{task.title}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {task.duration} • +{task.xp} XP
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    <CheckCircle2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      )}

      {/* Pro Features */}
      {isProUser && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bank Balance */}
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200/50 dark:border-green-700/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                Bank Balance
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs">
                  <Crown className="w-3 h-3 mr-1" />
                  Pro
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 mb-2">
                ${bankBalance.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Current business account balance
              </div>
              <Button size="sm" variant="outline" className="mt-3" onClick={() => navigate('/operations/finance')}>
                <BarChart3 className="w-3 h-3 mr-1" />
                View Details
              </Button>
            </CardContent>
          </Card>

          {/* Ops KPI Bar */}
          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200/50 dark:border-purple-700/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                Operations Health
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs">
                  <Crown className="w-3 h-3 mr-1" />
                  Pro
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(opsKPIs).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{key}</span>
                    <div className="flex items-center gap-2">
                      <Progress value={value} className="w-16 h-2" />
                      <span className="text-xs font-mono w-8">{value}%</span>
                    </div>
                  </div>
                ))}
              </div>
              <Button size="sm" variant="outline" className="mt-3 w-full" onClick={() => navigate('/operations')}>
                <Eye className="w-3 h-3 mr-1" />
                View Operations
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alerts Area for Pro */}
      {isProUser && alerts.length > 0 && (
        <Card className="border-orange-200 dark:border-orange-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              Business Alerts
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs">
                <Crown className="w-3 h-3 mr-1" />
                Pro
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.map((alert, index) => (
                <Alert key={index} className="border-orange-200 dark:border-orange-800">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <AlertDescription>
                    {alert.message}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Standard Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="glass-morphism border border-white/20 dark:border-gray-700/20 hover:shadow-lg transition-all duration-300 cursor-pointer group"
                  onClick={() => handleStatAction(stat)}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    stat.color === 'text-green-600' ? 'bg-green-100 dark:bg-green-900/20' :
                    stat.color === 'text-red-600' ? 'bg-red-100 dark:bg-red-900/20' :
                    stat.color === 'text-orange-600' ? 'bg-orange-100 dark:bg-orange-900/20' :
                    'bg-blue-100 dark:bg-blue-900/20'
                  }`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {stat.title}
                    </p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {stat.value}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {stat.actionDescription}
                  </span>
                  <ArrowRight className="w-3 h-3 text-gray-400 group-hover:text-blue-500 transition-colors" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Upgrade Prompt for Free Users */}
      {!isProUser && (
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200/50 dark:border-purple-700/50">
          <CardContent className="p-6 text-center">
            <div className="mb-4">
              <Crown className="w-12 h-12 text-purple-600 mx-auto mb-3" />
              <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                Unlock Advanced Dashboard Features
              </h3>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                Get bank balance tracking, operations KPIs, alerts, and more with Pro.
              </p>
            </div>
            <Button 
              onClick={onUpgrade}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-none"
            >
              <Crown className="w-4 h-4 mr-2" />
              Upgrade to Pro
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};