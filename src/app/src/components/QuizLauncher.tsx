import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Lightbulb, 
  Target, 
  Sparkles, 
  Clock, 
  CheckCircle2,
  ArrowRight,
  BrainCircuit
} from 'lucide-react';

interface QuizLauncherProps {
  user?: any;
  className?: string;
}

export const QuizLauncher: React.FC<QuizLauncherProps> = ({ user, className = '' }) => {
  const navigate = useNavigate();

  const handleStartQuiz = () => {
    navigate('/personality-test');
  };

  const handleViewResults = () => {
    navigate('/personality-test?showResults=true');
  };

  // Check if user has taken the quiz before (could be stored in localStorage or user data)
  const hasCompletedQuiz = localStorage.getItem(`quiz_completed_${user?.id}`) !== null;
  const quizResults = hasCompletedQuiz ? JSON.parse(localStorage.getItem(`quiz_results_${user?.id}`) || '{}') : null;

  return (
    <Card className={`bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-800 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center">
              <BrainCircuit className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Industry Match Quiz
                {hasCompletedQuiz && (
                  <Badge variant="secondary" className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Completed
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {hasCompletedQuiz 
                  ? 'Find your personalized industry recommendations'
                  : 'Discover the perfect industry for your personality and goals'
                }
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {hasCompletedQuiz && quizResults?.topRecommendations ? (
            <>
              {/* Show quiz results summary */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Target className="w-4 h-4" />
                  Your top industry matches:
                </div>
                <div className="space-y-2">
                  {quizResults.topRecommendations.slice(0, 3).map((industry: any, index: number) => (
                    <div key={industry.name} className="flex items-center justify-between p-2 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0 ? 'bg-yellow-500 text-white' :
                          index === 1 ? 'bg-gray-400 text-white' :
                          'bg-orange-500 text-white'
                        }`}>
                          {index + 1}
                        </div>
                        <span className="font-medium">{industry.name}</span>
                      </div>
                      <Badge variant="outline">
                        {Math.round(industry.score)}% match
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  onClick={handleViewResults}
                  className="flex items-center gap-2 flex-1"
                  variant="outline"
                >
                  <Sparkles className="w-4 h-4" />
                  View Full Results
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <Button 
                  onClick={handleStartQuiz}
                  variant="ghost"
                  size="sm"
                  className="text-purple-600 hover:text-purple-700"
                >
                  Retake Quiz
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Show quiz introduction */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-500" />
                    <span>2-3 minutes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-purple-500" />
                    <span>16 questions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-purple-500" />
                    <span>Personality-based</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    <span>Top 3 matches</span>
                  </div>
                </div>

                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <p className="text-sm text-purple-700 dark:text-purple-300">
                    Get personalized industry recommendations based on your personality traits, 
                    career interests, and business constraints.
                  </p>
                </div>
              </div>

              <Button 
                onClick={handleStartQuiz}
                className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white flex items-center gap-2"
              >
                <BrainCircuit className="w-4 h-4" />
                Start Industry Quiz
                <ArrowRight className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuizLauncher;