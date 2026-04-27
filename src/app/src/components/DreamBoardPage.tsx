import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from './ThemeProvider';
import { useBusiness } from './BusinessContext';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { 
  Plus, Target, DollarSign, Home, Car, Plane, GraduationCap, 
  Heart, Trophy, Star, Sparkles, Edit3, Trash2, Calendar,
  TrendingUp, ArrowLeft, Save, X, CheckCircle2, Clock
} from 'lucide-react';
import { getDreams, createDream, updateDream, deleteDream, getTopGoal, setNumberOneGoal } from '../utils/dreamBoardApi';
import type { Dream, CreateDreamRequest, UpdateDreamRequest } from '../utils/dreamBoardApi';
import { supabase } from '../utils/supabase/client';
import { toast } from 'sonner@2.0.3';

interface DreamBoardPageProps {
  user: any;
}

const DreamBoardPage: React.FC<DreamBoardPageProps> = ({ user }) => {
  const { theme } = useTheme();
  const { selectedBusiness, userBusinesses } = useBusiness();
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [isAddingDream, setIsAddingDream] = useState(false);
  const [editingDream, setEditingDream] = useState<Dream | null>(null);
  const [numberOneGoalId, setNumberOneGoalId] = useState<string | null>(null);
  const [savingsDialogDream, setSavingsDialogDream] = useState<Dream | null>(null);
  const [savingsAmount, setSavingsAmount] = useState('');
  const [newDream, setNewDream] = useState({
    title: '',
    description: '',
    targetAmount: '',
    category: 'financial' as Dream['category'],
    targetDate: '',
    priority: 'medium' as Dream['priority'],
    imageUrl: ''
  });

  // Category icons and colors
  const categoryConfig = {
    financial: { icon: DollarSign, color: 'text-green-500', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/20' },
    lifestyle: { icon: Home, color: 'text-blue-500', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/20' },
    career: { icon: Trophy, color: 'text-orange-500', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/20' },
    personal: { icon: Heart, color: 'text-pink-500', bgColor: 'bg-pink-500/10', borderColor: 'border-pink-500/20' },
    travel: { icon: Plane, color: 'text-cyan-500', bgColor: 'bg-cyan-500/10', borderColor: 'border-cyan-500/20' },
    family: { icon: GraduationCap, color: 'text-indigo-500', bgColor: 'bg-indigo-500/10', borderColor: 'border-indigo-500/20' }
  };

  // Priority colors
  const priorityConfig = {
    low: { color: 'text-gray-500', bgColor: 'bg-gray-500/10' },
    medium: { color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' },
    high: { color: 'text-red-500', bgColor: 'bg-red-500/10' }
  };

  // Load dreams and #1 goal from API
  useEffect(() => {
    const loadDreams = async () => {
      if (!user?.id) return;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        const accessToken = session?.access_token;
        
        const allDreams = await getDreams(user.id, selectedBusiness?.id, accessToken);
        setDreams(allDreams);

        // Load #1 goal
        const topGoalId = await getTopGoal(user.id, selectedBusiness?.id, accessToken);
        if (topGoalId) {
          setNumberOneGoalId(topGoalId);
        }
      } catch (error) {
        console.error('Error loading dreams:', error);
        toast.error('Failed to load dreams');
      }
    };

    loadDreams();
  }, [user?.id, selectedBusiness?.id]);

  // Save dreams to API
  const saveDreams = async (updatedDreams: Dream[]) => {
    setDreams(updatedDreams);
    // Note: Individual dream updates are handled by handleAddDream, handleDeleteDream, etc.
    // This function is kept for local state updates
  };

  // Save #1 goal to API
  const saveNumberOneGoal = async (goalId: string | null) => {
    // Optimistic update
    const previousGoalId = numberOneGoalId;
    setNumberOneGoalId(goalId);
    
    try {
      if (!user?.id) {
        throw new Error('User ID not found');
      }

      console.log('Saving #1 goal:', goalId, 'for user:', user.id);
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      
      await setNumberOneGoal(user.id, goalId, accessToken);
      console.log('Successfully saved #1 goal');
      
      // Dispatch custom event to update dashboard
      window.dispatchEvent(new Event('goalUpdated'));
      
      // Also update local storage as a backup/cache
      if (goalId) {
        localStorage.setItem(`cofounder_number_one_goal_${user.id}`, goalId);
      } else {
        localStorage.removeItem(`cofounder_number_one_goal_${user.id}`);
      }

    } catch (error: any) {
      console.error('Error saving #1 goal:', error);
      // Revert optimistic update
      setNumberOneGoalId(previousGoalId);
      toast.error(error.message || 'Failed to update #1 goal');
    }
  };

  // Set/unset #1 goal
  const handleSetNumberOneGoal = (dreamId: string) => {
    if (numberOneGoalId === dreamId) {
      saveNumberOneGoal(null); // Remove #1 goal
    } else {
      saveNumberOneGoal(dreamId); // Set as #1 goal
    }
  };

  // Get the #1 goal dream
  const numberOneGoal = dreams.find(dream => dream.id === numberOneGoalId);

  // Generate dream suggestions
  const dreamSuggestions = [
    { title: 'Buy my dream home', category: 'lifestyle', targetAmount: 500000 },
    { title: 'Achieve financial freedom', category: 'financial', targetAmount: 1000000 },
    { title: 'Buy a luxury watch', category: 'lifestyle', targetAmount: 10000 },
    { title: 'Pay off mortgage', category: 'financial', targetAmount: 300000 },
    { title: 'Travel the world', category: 'travel', targetAmount: 50000 },
    { title: 'Buy my dream car', category: 'lifestyle', targetAmount: 75000 },
    { title: 'Retire my parents', category: 'family', targetAmount: 2000000 },
    { title: 'Get an MBA', category: 'career', targetAmount: 150000 },
    { title: 'Buy a vacation home', category: 'lifestyle', targetAmount: 400000 }
  ];

  const handleAddDream = async () => {
    if (!newDream.title.trim() || !user?.id) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      const dreamRequest: CreateDreamRequest = {
        userId: user.id,
        businessId: selectedBusiness?.id,
        title: newDream.title,
        description: newDream.description,
        targetAmount: newDream.targetAmount ? parseFloat(newDream.targetAmount) : undefined,
        category: newDream.category,
        targetDate: newDream.targetDate || undefined,
        priority: newDream.priority,
        imageUrl: '', // For now, no image - can be added later via unsplash integration
      };

      const createdDream = await createDream(dreamRequest, accessToken);
      
      setDreams([...dreams, createdDream]);
      setNewDream({
        title: '',
        description: '',
        targetAmount: '',
        category: 'financial',
        targetDate: '',
        priority: 'medium',
        imageUrl: ''
      });
      setIsAddingDream(false);
      toast.success('Dream added successfully!');
    } catch (error: any) {
      console.error('Error adding dream:', error);
      toast.error(error.message || 'Failed to add dream');
    }
  };

  const handleDeleteDream = async (dreamId: string) => {
    if (!user?.id) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      await deleteDream(dreamId, user.id, selectedBusiness?.id, accessToken);
      
      setDreams(dreams.filter(d => d.id !== dreamId));
      // If we're deleting the #1 goal, clear it
      if (numberOneGoalId === dreamId) {
        saveNumberOneGoal(null);
      }
      toast.success('Dream deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting dream:', error);
      toast.error(error.message || 'Failed to delete dream');
    }
  };

  const handleUpdateProgress = async (dreamId: string, progress: number) => {
    const dream = dreams.find(d => d.id === dreamId);
    if (!dream) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      
      const updatedDream = await updateDream(dreamId, { 
        progress: Math.max(0, Math.min(100, progress)),
        isCompleted: progress >= 100 
      }, accessToken);
      
      setDreams(dreams.map(d => 
        d.id === dreamId ? updatedDream : d
      ));
      toast.success('Progress updated!');
    } catch (error: any) {
      console.error('Error updating progress:', error);
      toast.error(error.message || 'Failed to update progress');
    }
  };

  const handleAddSavings = () => {
    if (!savingsDialogDream || !savingsAmount) return;

    const amount = parseFloat(savingsAmount);
    if (isNaN(amount) || amount <= 0) return;

    const targetAmount = savingsDialogDream.targetAmount || 0;
    if (targetAmount === 0) return;

    // Calculate current saved amount from progress
    const currentSaved = (savingsDialogDream.progress / 100) * targetAmount;
    const newSaved = currentSaved + amount;
    const newProgress = Math.min(100, (newSaved / targetAmount) * 100);

    handleUpdateProgress(savingsDialogDream.id, newProgress);
    setSavingsDialogDream(null);
    setSavingsAmount('');
  };

  const handleUseSuggestion = (suggestion: any) => {
    setNewDream({
      title: suggestion.title,
      description: `Achieve ${suggestion.title.toLowerCase()} as part of your journey to financial freedom`,
      targetAmount: suggestion.targetAmount?.toString() || '',
      category: suggestion.category,
      targetDate: '',
      priority: 'medium',
      imageUrl: ''
    });
    setIsAddingDream(true);
  };

  // Calculate total progress
  const totalDreamValue = dreams.reduce((sum, dream) => sum + (dream.targetAmount || 0), 0);
  const completedDreamValue = dreams
    .filter(dream => dream.isCompleted)
    .reduce((sum, dream) => sum + (dream.targetAmount || 0), 0);
  const overallProgress = totalDreamValue > 0 ? (completedDreamValue / totalDreamValue) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-blue-900 dark:to-cyan-900">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-white/20 dark:border-gray-700/20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.history.back()}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 dark:from-blue-400 dark:via-cyan-400 dark:to-teal-400 bg-clip-text text-transparent">
                  Dream Board
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Visualize your goals and track your journey to financial freedom
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Progress Overview */}
              <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-white/20 dark:border-gray-700/20 backdrop-blur-sm">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium">
                  ${completedDreamValue.toLocaleString()} / ${totalDreamValue.toLocaleString()}
                </span>
                <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${overallProgress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
              </div>

              <Button
                onClick={() => setIsAddingDream(true)}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Dream
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-white/20 dark:border-gray-700/20 backdrop-blur-sm"
          >
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Dreams</span>
            </div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{dreams.length}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-white/20 dark:border-gray-700/20 backdrop-blur-sm"
          >
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</span>
            </div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {dreams.filter(d => d.isCompleted).length}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-white/20 dark:border-gray-700/20 backdrop-blur-sm"
          >
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Value</span>
            </div>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              ${(totalDreamValue / 1000).toFixed(0)}K
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-white/20 dark:border-gray-700/20 backdrop-blur-sm"
          >
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Progress</span>
            </div>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {overallProgress.toFixed(0)}%
            </div>
          </motion.div>
        </div>

        {/* Dreams Grid */}
        {dreams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <AnimatePresence>
              {dreams.map((dream, index) => {
                const categoryInfo = categoryConfig[dream.category];
                const priorityInfo = priorityConfig[dream.priority];
                const CategoryIcon = categoryInfo.icon;

                return (
                  <motion.div
                    key={dream.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                    className="group"
                  >
                    <Card className={`p-0 overflow-hidden bg-white/50 dark:bg-gray-800/50 border border-white/20 dark:border-gray-700/20 backdrop-blur-sm hover:shadow-lg transition-all duration-300 ${
                      dream.isCompleted ? 'ring-2 ring-green-500/50' : ''
                    } ${numberOneGoalId === dream.id ? 'ring-2 ring-yellow-500/50' : ''}`}>
                      {/* Dream Image */}
                      {dream.imageUrl && (
                        <div className="relative h-32 overflow-hidden">
                          <ImageWithFallback
                            src={dream.imageUrl}
                            alt={dream.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {dream.isCompleted && (
                            <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="p-2 bg-green-500 rounded-full"
                              >
                                <CheckCircle2 className="w-6 h-6 text-white" />
                              </motion.div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="p-4">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                              {dream.title}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                              {dream.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 ml-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingDream(dream)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-8 w-8"
                            >
                              <Edit3 className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteDream(dream.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-8 w-8 text-red-500 hover:text-red-600"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>

                        {/* Tags */}
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          <Badge className={`${categoryInfo.bgColor} ${categoryInfo.color} border-0 text-xs`}>
                            <CategoryIcon className="w-3 h-3 mr-1" />
                            {dream.category}
                          </Badge>
                          <Badge className={`${priorityInfo.bgColor} ${priorityInfo.color} border-0 text-xs`}>
                            {dream.priority}
                          </Badge>
                          {numberOneGoalId === dream.id && (
                            <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white border-0 text-xs font-bold">
                              <Star className="w-3 h-3 mr-1" />
                              #1 Goal
                            </Badge>
                          )}
                        </div>

                        {/* Target Amount */}
                        {dream.targetAmount && (
                          <div className="flex items-center gap-2 mb-3">
                            <DollarSign className="w-4 h-4 text-green-500" />
                            <span className="text-sm font-medium text-green-600 dark:text-green-400">
                              ${dream.targetAmount.toLocaleString()}
                            </span>
                          </div>
                        )}

                        {/* Target Date */}
                        {dream.targetDate && (
                          <div className="flex items-center gap-2 mb-3">
                            <Calendar className="w-4 h-4 text-blue-500" />
                            <span className="text-sm text-blue-600 dark:text-blue-400">
                              {new Date(dream.targetDate).toLocaleDateString()}
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
                              {dream.progress}%
                            </span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <motion.div
                              className={`h-full ${
                                dream.isCompleted 
                                  ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                                  : 'bg-gradient-to-r from-blue-500 to-cyan-500'
                              }`}
                              initial={{ width: 0 }}
                              animate={{ width: `${dream.progress}%` }}
                              transition={{ duration: 1, ease: "easeOut" }}
                            />
                          </div>
                          
                          {/* Savings saved / target */}
                          {dream.targetAmount && (
                            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                              <span>Saved: ${((dream.progress / 100) * dream.targetAmount).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                              <span>Target: ${dream.targetAmount.toLocaleString()}</span>
                            </div>
                          )}
                          
                          {/* Add Savings Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSavingsDialogDream(dream)}
                            className="w-full text-xs mt-2"
                          >
                            <DollarSign className="w-3 h-3 mr-1" />
                            Record Savings
                          </Button>
                        </div>
                        
                        {/* #1 Goal Button */}
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <Button
                            variant={numberOneGoalId === dream.id ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleSetNumberOneGoal(dream.id)}
                            className={`w-full text-xs transition-all duration-200 ${
                              numberOneGoalId === dream.id 
                                ? 'bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white border-0' 
                                : 'hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                            }`}
                          >
                            <Star className={`w-3 h-3 mr-1 ${numberOneGoalId === dream.id ? 'text-white' : 'text-yellow-500'}`} />
                            {numberOneGoalId === dream.id ? 'Remove #1 Goal' : 'Set as #1 Goal'}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="mb-8">
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
                className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full flex items-center justify-center"
              >
                <Sparkles className="w-12 h-12 text-blue-500" />
              </motion.div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Start Building Your Dream Board
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                Visualize your goals and track your progress towards financial freedom. 
                Add your first dream to get started!
              </p>
            </div>

            <Button
              onClick={() => setIsAddingDream(true)}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Dream
            </Button>
          </motion.div>
        )}

        {/* Dream Suggestions */}
        {dreams.length < 3 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/30 dark:bg-gray-800/30 rounded-xl p-6 border border-white/20 dark:border-gray-700/20 backdrop-blur-sm"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-orange-500" />
              Popular Dreams to Consider
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {dreamSuggestions.slice(0, 6).map((suggestion, index) => {
                const categoryInfo = categoryConfig[suggestion.category as keyof typeof categoryConfig];
                const CategoryIcon = categoryInfo.icon;
                
                return (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleUseSuggestion(suggestion)}
                    className="p-3 text-left bg-white/50 dark:bg-gray-700/50 rounded-lg border border-white/20 dark:border-gray-600/20 hover:bg-white/70 dark:hover:bg-gray-700/70 transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <CategoryIcon className={`w-4 h-4 ${categoryInfo.color}`} />
                      <span className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {suggestion.title}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      ${suggestion.targetAmount?.toLocaleString()}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>

      {/* Add Dream Dialog */}
      <Dialog open={isAddingDream} onOpenChange={setIsAddingDream}>
        <DialogContent className="max-w-md bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-white/20 dark:border-gray-700/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-500" />
              Add New Dream
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                Dream Title *
              </label>
              <Input
                value={newDream.title}
                onChange={(e) => setNewDream({ ...newDream, title: e.target.value })}
                placeholder="e.g., Buy my dream home"
                className="bg-white/50 dark:bg-gray-800/50"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                Description
              </label>
              <Textarea
                value={newDream.description}
                onChange={(e) => setNewDream({ ...newDream, description: e.target.value })}
                placeholder="Describe your dream..."
                rows={3}
                className="bg-white/50 dark:bg-gray-800/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Category
                </label>
                <select
                  value={newDream.category}
                  onChange={(e) => setNewDream({ ...newDream, category: e.target.value as Dream['category'] })}
                  className="w-full px-3 py-2 bg-white/50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
                >
                  <option value="financial">Financial</option>
                  <option value="lifestyle">Lifestyle</option>
                  <option value="career">Career</option>
                  <option value="personal">Personal</option>
                  <option value="travel">Travel</option>
                  <option value="family">Family</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Priority
                </label>
                <select
                  value={newDream.priority}
                  onChange={(e) => setNewDream({ ...newDream, priority: e.target.value as Dream['priority'] })}
                  className="w-full px-3 py-2 bg-white/50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Target Amount ($)
                </label>
                <Input
                  type="number"
                  value={newDream.targetAmount}
                  onChange={(e) => setNewDream({ ...newDream, targetAmount: e.target.value })}
                  placeholder="100000"
                  className="bg-white/50 dark:bg-gray-800/50"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Target Date
                </label>
                <Input
                  type="date"
                  value={newDream.targetDate}
                  onChange={(e) => setNewDream({ ...newDream, targetDate: e.target.value })}
                  className="bg-white/50 dark:bg-gray-800/50"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsAddingDream(false)}
                className="flex-1"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleAddDream}
                disabled={!newDream.title.trim()}
                className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Dream
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dream Dialog */}
      <Dialog open={!!editingDream} onOpenChange={() => setEditingDream(null)}>
        <DialogContent className="max-w-md bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-white/20 dark:border-gray-700/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-blue-500" />
              Edit Dream
            </DialogTitle>
          </DialogHeader>
          
          {editingDream && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Dream Title *
                </label>
                <Input
                  value={editingDream.title}
                  onChange={(e) => setEditingDream({ ...editingDream, title: e.target.value })}
                  placeholder="e.g., Buy my dream home"
                  className="bg-white/50 dark:bg-gray-800/50"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Description
                </label>
                <Textarea
                  value={editingDream.description}
                  onChange={(e) => setEditingDream({ ...editingDream, description: e.target.value })}
                  placeholder="Describe your dream..."
                  rows={3}
                  className="bg-white/50 dark:bg-gray-800/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                    Category
                  </label>
                  <select
                    value={editingDream.category}
                    onChange={(e) => setEditingDream({ ...editingDream, category: e.target.value as Dream['category'] })}
                    className="w-full px-3 py-2 bg-white/50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
                  >
                    <option value="financial">Financial</option>
                    <option value="lifestyle">Lifestyle</option>
                    <option value="career">Career</option>
                    <option value="personal">Personal</option>
                    <option value="travel">Travel</option>
                    <option value="family">Family</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                    Priority
                  </label>
                  <select
                    value={editingDream.priority}
                    onChange={(e) => setEditingDream({ ...editingDream, priority: e.target.value as Dream['priority'] })}
                    className="w-full px-3 py-2 bg-white/50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                    Target Amount ($)
                  </label>
                  <Input
                    type="number"
                    value={editingDream.targetAmount?.toString() || ''}
                    onChange={(e) => setEditingDream({ 
                      ...editingDream, 
                      targetAmount: e.target.value ? parseFloat(e.target.value) : undefined 
                    })}
                    placeholder="100000"
                    className="bg-white/50 dark:bg-gray-800/50"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                    Target Date
                  </label>
                  <Input
                    type="date"
                    value={editingDream.targetDate || ''}
                    onChange={(e) => setEditingDream({ ...editingDream, targetDate: e.target.value })}
                    className="bg-white/50 dark:bg-gray-800/50"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setEditingDream(null)}
                  className="flex-1"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (editingDream && editingDream.title.trim()) {
                      const updatedDreams = dreams.map(dream => 
                        dream.id === editingDream.id ? editingDream : dream
                      );
                      saveDreams(updatedDreams);
                      setEditingDream(null);
                    }
                  }}
                  disabled={!editingDream?.title.trim()}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Update Dream
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Savings Dialog */}
      <Dialog open={!!savingsDialogDream} onOpenChange={() => {
        setSavingsDialogDream(null);
        setSavingsAmount('');
      }}>
        <DialogContent className="max-w-md bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-white/20 dark:border-gray-700/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              Record Savings
            </DialogTitle>
          </DialogHeader>
          
          {savingsDialogDream && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  How much have you saved for <span className="font-semibold text-gray-900 dark:text-white">{savingsDialogDream.title}</span>?
                </p>
                
                {savingsDialogDream.targetAmount && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Current Savings:</span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        ${((savingsDialogDream.progress / 100) * savingsDialogDream.targetAmount).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-gray-600 dark:text-gray-400">Target Amount:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        ${savingsDialogDream.targetAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-gray-600 dark:text-gray-400">Remaining:</span>
                      <span className="font-semibold text-orange-600 dark:text-orange-400">
                        ${(savingsDialogDream.targetAmount - ((savingsDialogDream.progress / 100) * savingsDialogDream.targetAmount)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Amount Saved *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="number"
                    value={savingsAmount}
                    onChange={(e) => setSavingsAmount(e.target.value)}
                    placeholder="0.00"
                    className="bg-white/50 dark:bg-gray-800/50 pl-10"
                    min="0"
                    step="0.01"
                    autoFocus
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Enter the additional amount you've saved toward this goal
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSavingsDialogDream(null);
                    setSavingsAmount('');
                  }}
                  className="flex-1"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleAddSavings}
                  disabled={!savingsAmount || parseFloat(savingsAmount) <= 0}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DreamBoardPage;