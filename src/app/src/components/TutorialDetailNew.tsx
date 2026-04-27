import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, DollarSign, CheckCircle2, Circle, Download, Users, Target, BookOpen, ExternalLink, MessageSquare, Bot } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { newUniversityApi, Tutorial } from '../utils/universityApiNew';

interface TutorialDetailNewProps {
  tutorial: Tutorial;
  onBack: () => void;
  user?: any;
}

const TutorialDetailNew: React.FC<TutorialDetailNewProps> = ({ tutorial, onBack, user }) => {
  const navigate = useNavigate();
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set());
  const [isBookmarked, setIsBookmarked] = useState(false);

  const handleStepToggle = async (stepIndex: number) => {
    const newCheckedSteps = new Set(checkedSteps);
    if (newCheckedSteps.has(stepIndex)) {
      newCheckedSteps.delete(stepIndex);
    } else {
      newCheckedSteps.add(stepIndex);
    }
    setCheckedSteps(newCheckedSteps);

    // Update progress in API
    if (user) {
      try {
        const totalSteps = tutorial.steps?.length || 0;
        const completedSteps = newCheckedSteps.size;
        const progressPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
        
        await newUniversityApi.updateProgress(tutorial.id, {
          completed: completedSteps === totalSteps,
          percent: progressPercent
        }, user);
      } catch (error) {
        console.error('Failed to update progress:', error);
      }
    }
  };

  const handleBookmarkToggle = async () => {
    if (user) {
      try {
        await newUniversityApi.toggleBookmark(tutorial.id, user);
        setIsBookmarked(!isBookmarked);
      } catch (error) {
        console.error('Failed to toggle bookmark:', error);
      }
    }
  };

  const generateCofounderQuestion = () => {
    // Generate a context-aware question based on tutorial content
    const completedStepsCount = checkedSteps.size;
    const totalSteps = tutorial.steps?.length || 0;
    const progressPercent = totalSteps > 0 ? Math.round((completedStepsCount / totalSteps) * 100) : 0;
    
    let question = '';
    
    if (progressPercent === 0) {
      // User hasn't started yet
      question = `I'm about to start the "${tutorial.title}" tutorial. Can you help me understand how this fits into my business strategy and what I should focus on first?`;
    } else if (progressPercent < 50) {
      // User is in progress but early - be more specific about current step
      const nextUncompletedStep = tutorial.steps?.find((_, index) => !checkedSteps.has(index));
      if (nextUncompletedStep) {
        question = `I'm working through the "${tutorial.title}" tutorial (${progressPercent}% complete). I'm currently on the step "${nextUncompletedStep.title}" and need guidance on the best approach for my specific business situation. Can you help me work through this step and customize it for my needs?`;
      } else {
        question = `I'm partway through the "${tutorial.title}" tutorial (${progressPercent}% complete). I'm stuck and need guidance on the best approach for my specific situation. Can you help me work through this step by step?`;
      }
    } else if (progressPercent < 100) {
      // User is making good progress
      question = `I'm ${progressPercent}% through the "${tutorial.title}" tutorial and making good progress. Can you help me customize the remaining steps for my business and ensure I'm implementing this correctly? I want to make sure I'm getting maximum value from this.`;
    } else {
      // User completed the tutorial
      question = `I just completed the "${tutorial.title}" tutorial. Can you help me plan the next steps, ensure I haven't missed anything important, and show me how to integrate what I learned into my overall business strategy?`;
    }
    
    // Add tutorial context with more detail
    question += `\n\n📚 Tutorial Context:`;
    question += `\n• Tutorial: ${tutorial.title}`;
    question += `\n• Focus: ${tutorial.whyThisMatters || tutorial.description}`;
    question += `\n• Difficulty: ${tutorial.difficulty}`;
    question += `\n• Time Investment: ${tutorial.estimatedTime}`;
    
    if (tutorial.tags && tutorial.tags.length > 0) {
      question += `\n• Related areas: ${tutorial.tags.join(', ')}`;
    }

    // Add progress context
    if (completedStepsCount > 0) {
      question += `\n\n✅ Progress: ${completedStepsCount}/${totalSteps} steps completed (${progressPercent}%)`;
      
      // List completed steps
      const completedStepsList = tutorial.steps?.filter((_, index) => checkedSteps.has(index)).map(step => step.title) || [];
      if (completedStepsList.length > 0) {
        question += `\n• Completed: ${completedStepsList.slice(0, 3).join(', ')}${completedStepsList.length > 3 ? ` and ${completedStepsList.length - 3} more` : ''}`;
      }
    }

    question += `\n\nPlease provide specific, actionable advice tailored to my business situation.`;
    
    return question;
  };

  const handleAskCofounder = () => {
    const question = generateCofounderQuestion();
    // Navigate to cofounder page with pre-populated question
    const encodedQuestion = encodeURIComponent(question);
    const encodedTutorial = encodeURIComponent(tutorial.title);
    navigate(`/cofounder?question=${encodedQuestion}&tutorial=${encodedTutorial}`);
  };

  const progressPercent = tutorial.steps ? Math.round((checkedSteps.size / tutorial.steps.length) * 100) : 0;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner': return 'bg-green-100 text-green-800 border-green-200';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'advanced': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-background university-container">
      {/* Header */}
      <div className="university-header sticky top-0 z-40 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to University
            </Button>
            <div className="flex items-center gap-2 ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAskCofounder}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-blue-200 text-blue-700 hover:text-blue-800 transition-all duration-200"
                title="Get personalized AI guidance for this tutorial based on your progress"
              >
                <Bot className="w-4 h-4" />
                Ask Your Cofounder
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBookmarkToggle}
                className="flex items-center gap-2"
              >
                <BookOpen className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                {isBookmarked ? 'Bookmarked' : 'Bookmark'}
              </Button>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{tutorial.title}</h1>
              <p className="text-lg text-muted-foreground mb-4">{tutorial.description}</p>
              
              <div className="flex items-center gap-4 flex-wrap">
                <Badge className={getDifficultyColor(tutorial.difficulty)}>
                  {tutorial.difficulty}
                </Badge>
                
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {tutorial.estimatedTime}
                </div>
                
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  {tutorial.author}
                </div>
                
                <Badge variant="outline">
                  Updated {new Date(tutorial.lastUpdated).toLocaleDateString()}
                </Badge>
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          {user && tutorial.steps && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progress</span>
                <span className="text-sm text-muted-foreground">
                  {checkedSteps.size} of {tutorial.steps.length} steps completed
                </span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Why This Matters */}
        {tutorial.whyThisMatters && (
          <Card className="university-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Why This Matters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{tutorial.whyThisMatters}</p>
            </CardContent>
          </Card>
        )}

        {/* Prerequisites & Time/Cost */}
        <div className="grid md:grid-cols-2 gap-6">
          {tutorial.prerequisites && (
            <Card className="university-card">
              <CardHeader>
                <CardTitle>Prerequisites</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {tutorial.prerequisites.map((prereq, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{prereq}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {tutorial.timeCost && (
            <Card className="university-card">
              <CardHeader>
                <CardTitle>Time & Cost</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">
                    <strong>Time:</strong> {tutorial.timeCost.time}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  <span className="text-sm">
                    <strong>Cost:</strong> {tutorial.timeCost.cost}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Steps Checklist */}
        {tutorial.steps && (
          <Card className="university-card">
            <CardHeader>
              <CardTitle>Steps (Checklist)</CardTitle>
              <CardDescription>
                Follow these steps to complete the tutorial. Check them off as you go!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tutorial.steps.map((step, index) => (
                  <div key={index} className="flex items-start gap-3 group">
                    <button
                      onClick={() => handleStepToggle(index)}
                      className="mt-1 flex-shrink-0 transition-colors"
                      disabled={!user}
                    >
                      {checkedSteps.has(index) ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground hover:text-blue-500" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium ${checkedSteps.has(index) ? 'line-through text-muted-foreground' : ''}`}>
                        {step.title}
                      </div>
                      {step.description && (
                        <div className={`text-sm text-muted-foreground mt-1 ${checkedSteps.has(index) ? 'line-through' : ''}`}>
                          {step.description}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {!user && (
                <div className="mt-4 p-4 bg-muted rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">
                    Sign in to track your progress through this tutorial
                  </p>
                </div>
              )}

              {/* Contextual AI Help - Show when user has started but hasn't finished */}
              {user && checkedSteps.size > 0 && checkedSteps.size < (tutorial.steps?.length || 0) && (
                <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <Bot className="w-5 h-5 text-blue-600 mt-0.5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-blue-900 mb-1">
                        Need help with this tutorial?
                      </h4>
                      <p className="text-sm text-blue-700 mb-3">
                        Your AI cofounder can provide personalized guidance, help you adapt these steps to your specific business, or troubleshoot any challenges you're facing.
                      </p>
                      <Button
                        size="sm"
                        onClick={handleAskCofounder}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Get Personalized Help
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Templates & Resources */}
        {tutorial.templatesResources && (
          <Card className="university-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Templates & Resources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tutorial.templatesResources.map((resource, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium">{resource}</span>
                    <Button size="sm" variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Next Actions */}
        {tutorial.nextActions && (
          <Card className="university-card border-green-200 bg-green-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <ExternalLink className="w-5 h-5" />
                Next Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {tutorial.nextActions.map((action, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-sm text-green-700">{action}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Tags */}
        <div>
          <h3 className="text-sm font-medium mb-3">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {tutorial.tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorialDetailNew;