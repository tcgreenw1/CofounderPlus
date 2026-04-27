import React, { useState } from 'react';
import { Button } from './ui/button';
import { 
  Sparkles, 
  Wand2, 
  Copy, 
  ArrowLeftRight, 
  FileText, 
  Calendar 
} from 'lucide-react';
import { AGITaskModal } from './AGITaskModal';

interface AGIActionBarProps {
  onTaskComplete?: (taskType: string) => void;
  businessId?: string;
  month?: string;
}

export type AGITaskType = 
  | 'auto-categorize'
  | 'auto-rules'
  | 'detect-duplicates'
  | 'match-transfers'
  | 'tax-summary'
  | 'explain-month';

interface AGITask {
  type: AGITaskType;
  title: string;
  description: string;
  icon: any;
  buttonText: string;
  buttonVariant?: 'default' | 'outline' | 'secondary';
}

const AGI_TASKS: AGITask[] = [
  {
    type: 'auto-categorize',
    title: 'Auto Categorize All',
    description: 'Automatically categorize all uncategorized transactions using AI',
    icon: Wand2,
    buttonText: 'Auto Categorize All',
    buttonVariant: 'default'
  },
  {
    type: 'auto-rules',
    title: 'Auto Create Rules',
    description: 'Create categorization rules based on your transaction patterns',
    icon: Sparkles,
    buttonText: 'Auto Create Rules',
    buttonVariant: 'outline'
  },
  {
    type: 'detect-duplicates',
    title: 'Detect Duplicates',
    description: 'Find and merge duplicate transactions',
    icon: Copy,
    buttonText: 'Detect Duplicates',
    buttonVariant: 'outline'
  },
  {
    type: 'match-transfers',
    title: 'Match Transfers',
    description: 'Identify and match bank transfers between accounts',
    icon: ArrowLeftRight,
    buttonText: 'Match Transfers',
    buttonVariant: 'outline'
  },
  {
    type: 'tax-summary',
    title: 'Prepare Tax Summary',
    description: 'Generate a comprehensive tax summary for all transactions',
    icon: FileText,
    buttonText: 'Prepare Tax Summary',
    buttonVariant: 'outline'
  },
  {
    type: 'explain-month',
    title: 'Explain This Month',
    description: 'Get AI insights and explanations about this month\'s transactions',
    icon: Calendar,
    buttonText: 'Explain This Month',
    buttonVariant: 'outline'
  }
];

export function AGIActionBar({ onTaskComplete, businessId, month }: AGIActionBarProps) {
  const [activeTask, setActiveTask] = useState<AGITaskType | null>(null);

  const handleOpenTask = (taskType: AGITaskType) => {
    setActiveTask(taskType);
  };

  const handleCloseTask = () => {
    setActiveTask(null);
  };

  const handleTaskComplete = (taskType: AGITaskType) => {
    setActiveTask(null);
    onTaskComplete?.(taskType);
  };

  const currentTask = AGI_TASKS.find(task => task.type === activeTask);

  return (
    <>
      {/* AGI Action Bar */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
              <Sparkles className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">AGI Actions</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Let AI help you manage your transactions
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {AGI_TASKS.map((task) => {
            const IconComponent = task.icon;
            return (
              <Button
                key={task.type}
                variant={task.buttonVariant}
                size="sm"
                onClick={() => handleOpenTask(task.type)}
                className="flex items-center gap-2"
              >
                <IconComponent className="w-4 h-4" />
                {task.buttonText}
              </Button>
            );
          })}
        </div>
      </div>

      {/* AGI Task Modal */}
      {currentTask && (
        <AGITaskModal
          open={activeTask !== null}
          onClose={handleCloseTask}
          taskType={currentTask.type}
          title={currentTask.title}
          description={currentTask.description}
          icon={currentTask.icon}
          onComplete={() => handleTaskComplete(currentTask.type)}
          businessId={businessId}
          month={month}
        />
      )}
    </>
  );
}
