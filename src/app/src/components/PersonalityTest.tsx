import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuizIntro } from './quiz/QuizIntro';
import { QuizQuestion } from './quiz/QuizQuestion';
import { QuizResults } from './quiz/QuizResults';
import { useTheme } from './ThemeProvider';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Moon, Sun } from 'lucide-react';

type QuizState = 'intro' | 'questions' | 'calculating' | 'results';

interface QuizResponse {
  question_id: string;
  value: any;
}

function PersonalityTest() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [quizState, setQuizState] = useState<QuizState>('intro');
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<QuizResponse[]>([]);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate a unique session ID for this quiz attempt
  const getSessionData = () => {
    // For the signup flow, we'll use a temporary session ID
    const sessionId = `signup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      user_id: sessionId,
      business_id: `${sessionId}_default`
    };
  };

  // Load quiz questions
  const loadQuestions = useCallback(async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ac1075a9/quiz/questions`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load quiz questions');
      }

      const data = await response.json();
      setQuestions(data.questions);
      console.log('📝 Loaded', data.questions.length, 'quiz questions');
    } catch (error: any) {
      console.error('❌ Error loading questions:', error);
      setError('Failed to load quiz. Please try again.');
    }
  }, []);

  // Initialize quiz
  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  // Save response and move to next question
  const handleAnswer = async (value: any) => {
    try {
      const { user_id, business_id } = getSessionData();
      const currentQuestion = questions[currentQuestionIndex];
      
      console.log('💾 Saving answer:', { question_id: currentQuestion.id, value });

      // Save to server
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ac1075a9/quiz/response`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id,
          business_id,
          question_id: currentQuestion.id,
          value
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save response');
      }

      // Update local state
      const newResponse = { question_id: currentQuestion.id, value };
      const existingIndex = responses.findIndex(r => r.question_id === currentQuestion.id);
      let newResponses;
      
      if (existingIndex >= 0) {
        newResponses = [...responses];
        newResponses[existingIndex] = newResponse;
      } else {
        newResponses = [...responses, newResponse];
      }
      
      setResponses(newResponses);

      // Move to next question or finish
      if (currentQuestionIndex < questions.length - 1) {
        setTimeout(() => {
          setCurrentQuestionIndex(currentQuestionIndex + 1);
        }, 800);
      } else {
        // Quiz completed - calculate results
        setTimeout(() => {
          calculateResults();
        }, 800);
      }
    } catch (error: any) {
      console.error('❌ Error saving response:', error);
      setError('Failed to save answer. Please try again.');
    }
  };

  // Go back to previous question
  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  // Calculate industry recommendations
  const calculateResults = async () => {
    setQuizState('calculating');
    setLoading(true);

    try {
      const { user_id, business_id } = getSessionData();
      
      console.log('🧮 Calculating results...');

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ac1075a9/quiz/calculate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id,
          business_id
        })
      });

      if (!response.ok) {
        throw new Error('Failed to calculate results');
      }

      const data = await response.json();
      setResults(data);
      setQuizState('results');

      console.log('📊 Quiz completed with top 3 industries:', data.top3?.map((i: any) => i.name));

    } catch (error: any) {
      console.error('❌ Error calculating results:', error);
      setError('Failed to calculate results. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Start quiz
  const handleStartQuiz = () => {
    setQuizState('questions');
    console.log('📊 Industry matching quiz started');
  };

  // Go back from intro
  const handleBackFromIntro = () => {
    navigate('/questionnaire');
  };

  // Go back from questions
  const handleBackFromQuestions = () => {
    if (currentQuestionIndex === 0) {
      setQuizState('intro');
    } else {
      handleBack();
    }
  };

  // Start business from results
  const handleStartBusiness = (industrySlug: string, industry: any) => {
    console.log('📊 User selected industry:', industry.name);
    
    // Store the selected industry data (similar to how IndustryList.tsx does it)
    localStorage.setItem('questionnaire_industry', industry.name);
    localStorage.setItem('questionnaire_industry_data', JSON.stringify({
      id: industrySlug,
      name: industry.name,
      category: industry.category,
      score: industry.score,
      reasons: industry.reasons
    }));
    
    // Navigate to signup
    navigate('/auth?from=personality-test');
  };

  // Skip for now / manual selection
  const handleManualSelection = () => {
    // Take user to auth/signup
    navigate('/auth?mode=signup');
  };

  // Retake quiz
  const handleRetakeQuiz = async () => {
    try {
      const { user_id, business_id } = getSessionData();
      
      // Clear existing data
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ac1075a9/quiz/session/${user_id}/${business_id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      // Reset state
      setResponses([]);
      setCurrentQuestionIndex(0);
      setResults(null);
      setQuizState('intro');
      
      console.log('🔄 Quiz reset for retake');
    } catch (error: any) {
      console.error('❌ Error resetting quiz:', error);
      // Still allow retake even if clearing fails
      setResponses([]);
      setCurrentQuestionIndex(0);
      setResults(null);
      setQuizState('intro');
    }
  };

  // Get current response for a question
  const getCurrentResponse = (questionId: string) => {
    const response = responses.find(r => r.question_id === questionId);
    return response?.value;
  };

  // Error display
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-950 starry-background flex items-center justify-center px-6">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-6 z-20">
          <button
            onClick={() => navigate('/questionnaire')}
            className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
          >
            ← Back
          </button>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-white/20 dark:bg-gray-800/20 backdrop-blur-lg border border-white/30 dark:border-gray-700/30 hover:bg-white/30 dark:hover:bg-gray-700/30 transition-all duration-300"
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
        </div>

        <div className="text-center relative z-10">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Oops! Something went wrong</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => {
              setError(null);
              loadQuestions();
            }}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all duration-300"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Loading display
  if (quizState === 'calculating' || (questions.length === 0 && !error)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-950 starry-background flex items-center justify-center px-6">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-6 z-20">
          <button
            onClick={() => navigate('/questionnaire')}
            className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
          >
            ← Back
          </button>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-white/20 dark:bg-gray-800/20 backdrop-blur-lg border border-white/30 dark:border-gray-700/30 hover:bg-white/30 dark:hover:bg-gray-700/30 transition-all duration-300"
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
        </div>

        <div className="text-center relative z-10">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-full flex items-center justify-center mb-6 mx-auto animate-pulse">
            <div className="w-8 h-8 bg-white rounded-full animate-ping"></div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
            {quizState === 'calculating' ? 'Analyzing Your Responses...' : 'Loading Quiz...'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {quizState === 'calculating' 
              ? 'Finding your perfect industry matches using advanced personality analysis'
              : 'Preparing your personalized industry matching experience'
            }
          </p>
        </div>
      </div>
    );
  }

  // Quiz flow with header integration
  const renderWithHeader = (content: React.ReactNode) => (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-950 starry-background">
      {/* Header */}
      <div className="relative z-20 flex items-center justify-between p-6">
        <button
          onClick={quizState === 'questions' ? handleBackFromQuestions : handleBackFromIntro}
          className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
        >
          ← Back
        </button>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-white/20 dark:bg-gray-800/20 backdrop-blur-lg border border-white/30 dark:border-gray-700/30 hover:bg-white/30 dark:hover:bg-gray-700/30 transition-all duration-300"
        >
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>
      </div>
      {content}
    </div>
  );

  switch (quizState) {
    case 'intro':
      return renderWithHeader(
        <QuizIntro 
          onStart={handleStartQuiz}
          onBack={handleBackFromIntro}
          showBackButton={false} // We handle the back button in the header
        />
      );

    case 'questions':
      if (questions.length === 0) return null;
      
      const currentQuestion = questions[currentQuestionIndex];
      return renderWithHeader(
        <QuizQuestion
          question={currentQuestion}
          currentIndex={currentQuestionIndex}
          totalQuestions={questions.length}
          onAnswer={handleAnswer}
          onBack={handleBackFromQuestions}
          selectedValue={getCurrentResponse(currentQuestion.id)}
          canGoBack={true}
          showBackButton={false} // We handle the back button in the header
        />
      );

    case 'results':
      if (!results) return null;
      
      return renderWithHeader(
        <QuizResults
          top3={results.top3}
          traits={results.traits}
          onStartBusiness={handleStartBusiness}
          onRetakeQuiz={handleRetakeQuiz}
          onManualSelection={handleManualSelection} // Add option for manual selection
          isSignupFlow={true} // Indicate this is for signup
          showBackButton={false} // We handle the back button in the header
        />
      );

    default:
      return null;
  }
}

export default PersonalityTest;