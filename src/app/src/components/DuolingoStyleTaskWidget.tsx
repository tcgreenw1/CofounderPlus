import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Card, CardContent } from './ui/card';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  CheckCircle2, 
  Target, 
  TrendingUp, 
  Clock, 
  Star,
  ChevronRight,
  Flame,
  Trophy,
  Zap
} from 'lucide-react';
import { roadmapAPI } from '../utils/roadmapApi';
import { RoadmapTask, RoadmapMilestone, UserProgress } from '../types/roadmap';
import { ALL_ROADMAPS } from './roadmap/RoadmapData';

interface DuolingoStyleTaskWidgetProps {
  businessId: string;
  roadmapId: string;
}

export const DuolingoStyleTaskWidget: React.FC<DuolingoStyleTaskWidgetProps> = ({
  businessId,
  roadmapId
}) => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [currentTask, setCurrentTask] = useState<RoadmapTask | null>(null);
  const [currentMilestone, setCurrentMilestone] = useState<RoadmapMilestone | null>(null);
  const [roadmapData, setRoadmapData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRoadmapData();
  }, [businessId, roadmapId]);

  // Add effect to reload when page becomes visible (user returns to dashboard)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && businessId && roadmapId) {
        console.log('🎯 Dashboard Task Widget: Page visible, reloading data...');
        loadRoadmapData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [businessId, roadmapId]);

  // Add effect to reload when tasks are completed (listen for custom event)
  useEffect(() => {
    const handleTaskUpdate = () => {
      console.log('🎯 Dashboard Task Widget: Task update event received, reloading...');
      loadRoadmapData();
    };

    window.addEventListener('roadmapTaskCompleted', handleTaskUpdate);
    window.addEventListener('roadmapProgressUpdated', handleTaskUpdate);
    
    return () => {
      window.removeEventListener('roadmapTaskCompleted', handleTaskUpdate);
      window.removeEventListener('roadmapProgressUpdated', handleTaskUpdate);
    };
  }, [businessId, roadmapId]);

  const loadRoadmapData = async () => {
    if (!businessId || !roadmapId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Get progress data - try from server, fall back to localStorage
      let progressData;
      try {
        progressData = await roadmapAPI.getRoadmapProgress(roadmapId, businessId);
        console.log('🎯 Dashboard: Loaded progress from server:', progressData);
      } catch (error) {
        console.warn('🎯 Dashboard: Failed to load from server, trying localStorage:', error);
        // Fall back to localStorage
        const savedProgress = localStorage.getItem(`cofounder_progress_${businessId}`);
        if (savedProgress) {
          progressData = JSON.parse(savedProgress);
          console.log('🎯 Dashboard: Loaded progress from localStorage:', progressData);
        } else {
          // Initialize with empty progress
          progressData = {
            totalXP: 0,
            currentStreak: 0,
            longestStreak: 0,
            completedTasks: [],
            completedMilestones: [],
            currentRoadmap: roadmapId,
            lastActiveDate: new Date().toISOString(),
            achievements: []
          };
          console.log('🎯 Dashboard: Using default empty progress');
        }
      }
      
      setProgress(progressData);

      // Find the current roadmap template from imported roadmaps
      const currentRoadmap = ALL_ROADMAPS.find((r: any) => r.id === roadmapId);
      
      if (currentRoadmap) {
        setRoadmapData(currentRoadmap);
        
        // Ensure completedTasks is an array
        const completedTaskIds = progressData?.completedTasks || [];
        
        console.log('🎯 Dashboard Task Widget: Finding current incomplete task...');
        console.log('🎯 Completed tasks:', completedTaskIds);
        
        // Find the next incomplete task
        for (const milestone of currentRoadmap.milestones || []) {
          const incompleteTasks = milestone.tasks?.filter(
            (task: any) => !completedTaskIds.includes(task.id)
          );
          
          console.log(`🎯 Milestone "${milestone.title}": ${incompleteTasks?.length || 0} incomplete tasks`);
          
          if (incompleteTasks && incompleteTasks.length > 0) {
            console.log(`🎯 Selected task: "${incompleteTasks[0].title}" from milestone "${milestone.title}"`);
            setCurrentTask(incompleteTasks[0]);
            setCurrentMilestone(milestone);
            break;
          }
        }
      } else {
        console.warn(`Roadmap with id "${roadmapId}" not found in ALL_ROADMAPS`);
      }
    } catch (error) {
      console.error('Error loading roadmap data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTaskCompletion = () => {
    if (!roadmapData || !progress) return { completed: 0, total: 0, percentage: 0 };
    
    let totalTasks = 0;
    roadmapData.milestones?.forEach((milestone: RoadmapMilestone) => {
      totalTasks += milestone.tasks?.length || 0;
    });
    
    const completed = progress.completedTasks?.length || 0;
    const percentage = totalTasks > 0 ? (completed / totalTasks) * 100 : 0;
    
    return { completed, total: totalTasks, percentage };
  };

  const handleNavigateToRoadmap = () => {
    navigate('/roadmap');
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentTask || !currentMilestone) {
    return (
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">
                {roadmapData ? 'All Tasks Complete! 🎉' : 'No Roadmap Selected'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {roadmapData 
                  ? "You've completed all available tasks. Great work!" 
                  : "Select a roadmap to get started with your business journey."}
              </p>
              <Button onClick={handleNavigateToRoadmap} variant="outline">
                {roadmapData ? 'View Roadmap' : 'Browse Roadmaps'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const taskCompletion = getTaskCompletion();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-teal-900/20 border-2 border-green-300 dark:border-green-700 overflow-hidden">
        <CardContent className="p-0">
          {/* Top Bar - Duolingo Style */}
          <div className="bg-green-600 dark:bg-green-700 p-4 text-white">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                <span className="font-semibold">Today's Task</span>
              </div>
              <div className="flex items-center gap-3">
                {/* Streak Indicator */}
                {progress && progress.currentStreak > 0 && (
                  <div className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-full">
                    <Flame className="w-4 h-4 text-orange-300" />
                    <span className="text-sm font-bold">{progress.currentStreak}</span>
                  </div>
                )}
                {/* XP Counter */}
                <div className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-full">
                  <Star className="w-4 h-4 text-yellow-300" />
                  <span className="text-sm font-bold">{progress?.totalXP || 0} XP</span>
                </div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span>Roadmap Progress</span>
                <span>{taskCompletion.completed} / {taskCompletion.total} tasks</span>
              </div>
              <Progress 
                value={taskCompletion.percentage} 
                className="h-2 bg-white/30"
              />
            </div>
          </div>

          {/* Task Content */}
          <div className="p-6 space-y-4">
            {/* Milestone Badge */}
            <div className="flex items-center gap-2">
              <Badge 
                variant="secondary" 
                className="bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 border border-green-300 dark:border-green-700"
              >
                {currentMilestone.title}
              </Badge>
            </div>

            {/* Task Title - Large and Prominent */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {currentTask.title}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {currentTask.whyItMatters}
              </p>
            </div>

            {/* Task Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">Time</span>
                </div>
                <div className="font-semibold text-sm">{currentTask.timeEstimate}</div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-yellow-600" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">Reward</span>
                </div>
                <div className="font-semibold text-sm">+{currentTask.xpReward} XP</div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">Steps</span>
                </div>
                <div className="font-semibold text-sm">{currentTask.steps?.length || 0} steps</div>
              </div>
            </div>

            {/* CTA Button - Duolingo Style */}
            <Button 
              onClick={handleNavigateToRoadmap}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-6 text-lg shadow-lg hover:shadow-xl transition-all"
            >
              <span className="flex items-center justify-center gap-2">
                Start Task
                <ChevronRight className="w-5 h-5" />
              </span>
            </Button>

            {/* Secondary Action */}
            <Button 
              onClick={handleNavigateToRoadmap}
              variant="ghost"
              className="w-full text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            >
              View Full Roadmap →
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
