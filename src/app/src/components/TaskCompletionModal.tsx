import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, X, Trophy, Star, Gift, Zap } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { VisuallyHidden } from './ui/visually-hidden';
import SlotMachineWinAnimation from './SlotMachineWinAnimation';

interface TaskCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskTitle: string;
  taskType: string;
  experiencePoints?: number;
  completionData?: any;
  showSlotMachine?: boolean;
  showDetailedModal?: boolean;
}

const TaskCompletionModal: React.FC<TaskCompletionModalProps> = ({
  isOpen,
  onClose,
  taskTitle = 'Task Completed',
  taskType = 'general',
  experiencePoints = 100,
  completionData,
  showSlotMachine = true,
  showDetailedModal = false
}) => {
  const [showSlotMachineAnimation, setShowSlotMachineAnimation] = useState(false);
  const [showRegularModal, setShowRegularModal] = useState(false);

  useEffect(() => {
    console.log('TaskCompletionModal: props changed', { 
      isOpen, 
      showSlotMachine, 
      showDetailedModal,
      taskTitle 
    });

    if (isOpen) {
      if (showSlotMachine) {
        console.log('TaskCompletionModal: showing slot machine animation');
        setShowSlotMachineAnimation(true);
        setShowRegularModal(false);
      } else {
        console.log('TaskCompletionModal: showing regular modal directly');
        setShowRegularModal(true);
        setShowSlotMachineAnimation(false);
      }
    } else {
      console.log('TaskCompletionModal: closing all modals');
      setShowSlotMachineAnimation(false);
      setShowRegularModal(false);
    }
  }, [isOpen, showSlotMachine]);

  const handleSlotMachineClose = () => {
    console.log('TaskCompletionModal: slot machine close requested', { showDetailedModal });
    setShowSlotMachineAnimation(false);
    
    if (showDetailedModal) {
      console.log('TaskCompletionModal: showing detailed modal');
      setShowRegularModal(true);
    } else {
      console.log('TaskCompletionModal: closing completely');
      onClose();
    }
  };

  const handleSlotMachineViewDetails = () => {
    console.log('TaskCompletionModal: view details requested');
    setShowSlotMachineAnimation(false);
    setShowRegularModal(true);
  };

  const handleFinalClose = () => {
    console.log('TaskCompletionModal: final close requested');
    setShowRegularModal(false);
    onClose();
  };

  const getTaskTypeColor = (type: string) => {
    const safeType = (type || 'general').toLowerCase();
    
    switch (safeType) {
      case 'planning':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'legal':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'product':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'marketing':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'sales':
        return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300';
      case 'finance':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getRewardMessage = (points: number) => {
    if (points >= 500) return "🎉 Epic Achievement! 🎉";
    if (points >= 200) return "🌟 Great Work! 🌟";
    if (points >= 100) return "✨ Well Done! ✨";
    return "👍 Task Completed! 👍";
  };

  const safeTaskTitle = taskTitle || 'Task Completed';
  const safeTaskType = taskType || 'general';
  const safeExperiencePoints = experiencePoints || 100;

  return (
    <>
      <SlotMachineWinAnimation
        isVisible={showSlotMachineAnimation}
        onClose={handleSlotMachineClose}
        onViewDetails={showDetailedModal ? handleSlotMachineViewDetails : undefined}
        taskTitle={safeTaskTitle}
        reward={`+${safeExperiencePoints} XP`}
      />

      <Dialog open={showRegularModal} onOpenChange={setShowRegularModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 10 }}
                className="p-2 bg-green-100 dark:bg-green-900 rounded-full"
              >
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </motion.div>
              Task Completed!
            </DialogTitle>
            <VisuallyHidden>
              <DialogDescription>
                Congratulations! You have successfully completed a task and earned experience points. View your progress and achievements.
              </DialogDescription>
            </VisuallyHidden>
          </DialogHeader>

          <div className="space-y-6">
            <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-blue-200 dark:border-blue-800">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">{safeTaskTitle}</h3>
                      <Badge className={getTaskTypeColor(safeTaskType)}>
                        {safeTaskType}
                      </Badge>
                    </div>
                  </div>

                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Trophy className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                        <div>
                          <p className="font-semibold text-yellow-800 dark:text-yellow-200">
                            {getRewardMessage(safeExperiencePoints)}
                          </p>
                          <p className="text-sm text-yellow-700 dark:text-yellow-300">
                            You've gained experience points!
                          </p>
                        </div>
                      </div>
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="text-2xl font-bold text-yellow-600 dark:text-yellow-400"
                      >
                        +{safeExperiencePoints} XP
                      </motion.div>
                    </div>
                  </motion.div>

                  <div className="flex flex-wrap gap-2">
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        Progress Made
                      </Badge>
                    </motion.div>
                    
                    {safeExperiencePoints >= 200 && (
                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.7 }}
                      >
                        <Badge variant="outline" className="flex items-center gap-1 border-purple-300 text-purple-600">
                          <Gift className="w-3 h-3" />
                          Bonus XP
                        </Badge>
                      </motion.div>
                    )}

                    {safeExperiencePoints >= 500 && (
                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.9 }}
                      >
                        <Badge variant="outline" className="flex items-center gap-1 border-orange-300 text-orange-600">
                          <Zap className="w-3 h-3" />
                          Epic Achievement
                        </Badge>
                      </motion.div>
                    )}
                  </div>

                  {completionData && (
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                      <h4 className="font-medium mb-2">Completion Details:</h4>
                      <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        {Object.entries(completionData).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                            <span className="font-medium">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button
                onClick={handleFinalClose}
                className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              >
                Continue Journey
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TaskCompletionModal;