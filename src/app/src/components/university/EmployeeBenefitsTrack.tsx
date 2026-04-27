import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, Eye, Stethoscope, TrendingUp, Umbrella, Gift, 
  CheckCircle, BookOpen, Info, ChevronDown, ChevronUp 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';

interface LessonProps {
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgGradient: string;
  borderColor: string;
  avgCost: string;
  isCompleted: boolean;
  onComplete: () => void;
}

const BenefitLesson: React.FC<LessonProps> = ({ 
  title, 
  description, 
  icon: Icon, 
  color, 
  bgGradient, 
  borderColor, 
  avgCost,
  isCompleted,
  onComplete 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className={`${bgGradient} ${borderColor} border transition-all duration-300 hover:shadow-lg`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <div className={`p-2 rounded-lg bg-white/50 dark:bg-black/20`}>
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold">{title}</h4>
                {isCompleted && <CheckCircle className="w-4 h-4 text-green-600" />}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                {description}
              </p>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3"
                >
                  <div className="text-xs text-gray-500 dark:text-gray-400 bg-white/50 dark:bg-black/20 p-2 rounded">
                    <strong>Average Cost:</strong> {avgCost}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 p-0"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
            {!isCompleted && (
              <Button
                variant="outline"
                size="sm"
                onClick={onComplete}
                className="text-xs px-2 py-1 h-auto"
              >
                Mark Done
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const EmployeeBenefitsTrack: React.FC = () => {
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());

  const lessons = [
    {
      id: 'health',
      title: 'Health Insurance',
      description: 'Medical coverage including doctor visits, hospital stays, and prescriptions. Essential for employee wellbeing and attracting top talent.',
      icon: Heart,
      color: '#FF4F4F',
      bgGradient: 'bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      avgCost: '$500-800/employee/month'
    },
    {
      id: 'vision',
      title: 'Vision Insurance',
      description: 'Coverage for eye exams, glasses, and contact lenses. Important for employees who work on screens all day.',
      icon: Eye,
      color: '#00E0FF',
      bgGradient: 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      avgCost: '$10-20/employee/month'
    },
    {
      id: 'dental',
      title: 'Dental Insurance',
      description: 'Dental care coverage for cleanings, fillings, and major procedures. Preventive care keeps employees healthy and productive.',
      icon: Stethoscope,
      color: '#6CFF6C',
      bgGradient: 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      avgCost: '$30-50/employee/month'
    },
    {
      id: 'retirement',
      title: 'Retirement (401k)',
      description: 'Help employees save for retirement with employer matching. Great for retention and provides tax benefits for your company.',
      icon: TrendingUp,
      color: '#4B00FF',
      bgGradient: 'bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20',
      borderColor: 'border-purple-200 dark:border-purple-800',
      avgCost: '3-6% of salary match'
    },
    {
      id: 'pto',
      title: 'Paid Time Off',
      description: 'Vacation days, sick leave, and personal days. Essential for work-life balance and preventing burnout.',
      icon: Umbrella,
      color: '#FFCF00',
      bgGradient: 'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20',
      borderColor: 'border-orange-200 dark:border-orange-800',
      avgCost: '10-20 days/year'
    },
    {
      id: 'other',
      title: 'Other Benefits',
      description: 'Gym memberships, education stipends, commuter benefits, life insurance, and more. Customize to your company culture.',
      icon: Gift,
      color: '#FF4F4F',
      bgGradient: 'bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      avgCost: 'Varies by company size'
    }
  ];

  const handleComplete = (lessonId: string) => {
    setCompletedLessons(prev => new Set([...prev, lessonId]));
  };

  const progress = (completedLessons.size / lessons.length) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Employee Benefits Guide
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Learn about different types of employee benefits and how they can help your business
          </p>
        </div>
        <Badge variant="outline" className="flex-shrink-0">
          {completedLessons.size}/{lessons.length} Complete
        </Badge>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Track Progress</span>
              <span className="font-semibold">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Pro Tip */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Pro Tip:</strong> Offering competitive benefits can reduce turnover by up to 50% and is often more cost-effective than constantly recruiting new employees. Start with health insurance and PTO, then expand as your business grows.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lessons */}
      <div className="grid gap-4">
        {lessons.map((lesson) => (
          <BenefitLesson
            key={lesson.id}
            title={lesson.title}
            description={lesson.description}
            icon={lesson.icon}
            color={lesson.color}
            bgGradient={lesson.bgGradient}
            borderColor={lesson.borderColor}
            avgCost={lesson.avgCost}
            isCompleted={completedLessons.has(lesson.id)}
            onComplete={() => handleComplete(lesson.id)}
          />
        ))}
      </div>

      {/* Completion Card */}
      {progress === 100 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
            <CardContent className="p-6 text-center">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Track Complete!
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                You've learned about all the major employee benefits. You're now ready to design a competitive benefits package for your team!
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default EmployeeBenefitsTrack;
