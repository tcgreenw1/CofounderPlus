import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../ThemeProvider';
import { 
  Trophy, 
  Star, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  Mail, 
  Save, 
  ArrowRight, 
  ChevronDown,
  ChevronUp,
  Target,
  Lightbulb,
  Users,
  Briefcase
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';

interface Industry {
  slug: string;
  name: string;
  category: string;
  score: number;
  reasons: string[];
  constraints_fit: number;
  min_capital?: number;
  hours_min_per_week?: number;
  sales_level?: string;
  hands_on?: string;
  market_simple?: number;
  weights?: any;
}

interface QuizResultsProps {
  top3: Industry[];
  traits: {
    bigfive: any;
    riasec: any;
  };
  onEmailResults?: (email: string) => void;
  onStartBusiness: (industrySlug: string, industry?: Industry) => void;
  onRetakeQuiz: () => void;
  onManualSelection?: () => void;
  isSignupFlow?: boolean;
  showBackButton?: boolean;
}

export function QuizResults({ 
  top3, 
  traits, 
  onEmailResults, 
  onStartBusiness, 
  onRetakeQuiz,
  onManualSelection,
  isSignupFlow = false,
  showBackButton = true
}: QuizResultsProps) {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [selectedIndustry, setSelectedIndustry] = useState(0);
  const [emailValue, setEmailValue] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (emailValue && onEmailResults) {
      try {
        await onEmailResults(emailValue);
        setIsEmailSent(true);
        setTimeout(() => {
          setShowEmailForm(false);
          setIsEmailSent(false);
        }, 2000);
      } catch (error) {
        console.error('Failed to email results:', error);
      }
    }
  };

  const getRankDisplay = (index: number) => {
    const rankings = ['🥇', '🥈', '🥉'];
    return rankings[index] || `#${index + 1}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'from-green-500 to-emerald-600';
    if (score >= 0.6) return 'from-blue-500 to-cyan-600';
    if (score >= 0.4) return 'from-yellow-500 to-orange-600';
    return 'from-gray-500 to-gray-600';
  };

  const formatTraitValue = (value: number) => {
    return Math.round(value * 100);
  };

  const getTraitLabel = (trait: string) => {
    const labels: { [key: string]: string } = {
      'C': 'Conscientiousness',
      'Ex': 'Extraversion',
      'O': 'Openness', 
      'S': 'Emotional Stability',
      'R': 'Realistic',
      'I': 'Investigative',
      'A': 'Artistic',
      'E': 'Enterprising'
    };
    return labels[trait] || trait;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-950 starry-background transition-all duration-300">
      {/* Background elements */}
      <div className="shooting-star" style={{ animationDelay: '10s', animationDuration: '5.5s', top: '25%' }}></div>
      <div className="shooting-star" style={{ animationDelay: '40s', animationDuration: '4.2s', top: '70%' }}></div>

      <div className="relative z-10 min-h-screen py-8 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="w-24 h-24 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-full flex items-center justify-center mb-6 mx-auto"
            >
              <Trophy className="w-12 h-12 text-white" />
            </motion.div>

            <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
              {isSignupFlow ? 'Your Perfect Industry Matches' : 'Your Perfect Industries'}
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              {isSignupFlow 
                ? 'Based on your personality and preferences, here are your top 3 industry matches. Choose one to start your business journey!'
                : 'Based on your personality and preferences, here are your top 3 industry matches with detailed action plans.'
              }
            </p>
          </motion.div>

          {/* Results Grid */}
          <div className="grid lg:grid-cols-3 gap-8 mb-12">
            {top3.map((industry, index) => (
              <motion.div
                key={industry.slug}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 + index * 0.2 }}
              >
                <Card className={`h-full bg-white/10 dark:bg-gray-800/10 backdrop-blur-lg border-white/20 dark:border-gray-700/20 hover:bg-white/20 dark:hover:bg-gray-700/20 transition-all duration-300 ${
                  index === 0 ? 'ring-2 ring-gold-400 shadow-2xl' : ''
                }`}>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-3xl">{getRankDisplay(index)}</div>
                      <Badge variant="secondary" className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                        {industry.category}
                      </Badge>
                    </div>
                    
                    <CardTitle className="text-xl mb-3 text-gray-800 dark:text-gray-200">
                      {industry.name}
                    </CardTitle>
                    
                    {/* Score Display */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Match Score</span>
                        <span className="text-lg font-bold text-gray-800 dark:text-gray-200">
                          {Math.round(industry.score * 100)}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${industry.score * 100}%` }}
                          transition={{ duration: 1, delay: 0.8 + index * 0.2 }}
                          className={`h-full bg-gradient-to-r ${getScoreColor(industry.score)}`}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="text-center p-3 bg-white/10 dark:bg-gray-800/10 rounded-lg">
                        <DollarSign className="w-5 h-5 mx-auto mb-1 text-green-600" />
                        <div className="text-xs text-gray-600 dark:text-gray-400">Investment</div>
                        <div className="text-sm font-semibold">
                          ${industry.min_capital ? (industry.min_capital >= 1000 ? `${Math.round(industry.min_capital/1000)}k` : industry.min_capital) : '500+'}
                        </div>
                      </div>
                      <div className="text-center p-3 bg-white/10 dark:bg-gray-800/10 rounded-lg">
                        <Clock className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                        <div className="text-xs text-gray-600 dark:text-gray-400">Time</div>
                        <div className="text-sm font-semibold">
                          {industry.hours_min_per_week ? `${industry.hours_min_per_week}h/week` : '15h/week'}
                        </div>
                      </div>
                    </div>

                    {/* Why It Fits */}
                    <div className="mb-6">
                      <h4 className="font-semibold mb-3 text-gray-800 dark:text-gray-200 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Why This Fits You
                      </h4>
                      <ul className="space-y-2">
                        {industry.reasons.slice(0, 3).map((reason, idx) => (
                          <li key={idx} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                            <Star className="w-3 h-3 mt-0.5 text-yellow-500 flex-shrink-0" />
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Market Opportunity */}
                    <div className="mb-6 p-3 bg-gradient-to-r from-purple-600/10 to-blue-600/10 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {industry.market_simple ? Math.round(industry.market_simple * 100) : 70}% Market Score
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Market opportunity assessment
                      </p>
                    </div>

                    {/* Action Button */}
                    <Button
                      onClick={() => onStartBusiness(industry.slug, industry)}
                      className={`w-full ${
                        index === 0 
                          ? 'bg-gradient-to-r from-yellow-500 to-orange-600 hover:shadow-xl' 
                          : 'bg-gradient-to-r from-purple-600 to-blue-600'
                      } text-white border-0 hover:scale-105 transition-all duration-300`}
                    >
                      <Briefcase className="w-4 h-4 mr-2" />
                      {isSignupFlow ? 'Choose This Industry' : 'Start This Business'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Comparison Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.2 }}
            className="mb-12"
          >
            <Card className="bg-white/10 dark:bg-gray-800/10 backdrop-blur-lg border-white/20 dark:border-gray-700/20">
              <CardHeader>
                <Button
                  variant="ghost"
                  onClick={() => setShowComparison(!showComparison)}
                  className="flex items-center justify-between w-full text-left p-0 h-auto"
                >
                  <CardTitle className="text-xl text-gray-800 dark:text-gray-200">
                    Compare Your Top 3 Industries
                  </CardTitle>
                  {showComparison ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </Button>
              </CardHeader>
              
              {showComparison && (
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-3 px-4 text-gray-800 dark:text-gray-200">Industry</th>
                          <th className="text-center py-3 px-4 text-gray-800 dark:text-gray-200">Score</th>
                          <th className="text-center py-3 px-4 text-gray-800 dark:text-gray-200">Investment</th>
                          <th className="text-center py-3 px-4 text-gray-800 dark:text-gray-200">Time</th>
                          <th className="text-center py-3 px-4 text-gray-800 dark:text-gray-200">Ramp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {top3.map((industry, index) => (
                          <tr key={industry.slug} className="border-b border-gray-100 dark:border-gray-800">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <span className="text-lg">{getRankDisplay(index)}</span>
                                <div>
                                  <div className="font-medium text-gray-800 dark:text-gray-200">{industry.name}</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">{industry.category}</div>
                                </div>
                              </div>
                            </td>
                            <td className="text-center py-3 px-4">
                              <span className="font-bold text-gray-800 dark:text-gray-200">
                                {Math.round(industry.score * 100)}%
                              </span>
                            </td>
                            <td className="text-center py-3 px-4 text-gray-600 dark:text-gray-400">
                              ${industry.min_capital ? (industry.min_capital >= 1000 ? `${Math.round(industry.min_capital/1000)}k` : industry.min_capital) : '500+'}
                            </td>
                            <td className="text-center py-3 px-4 text-gray-600 dark:text-gray-400">
                              {industry.hours_min_per_week ? `${industry.hours_min_per_week}h/wk` : '15h/wk'}
                            </td>
                            <td className="text-center py-3 px-4 text-gray-600 dark:text-gray-400">
                              {industry.market_simple ? Math.round(industry.market_simple * 100) : 70}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              )}
            </Card>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.4 }}
            className="flex flex-wrap justify-center gap-4 mb-12"
          >
            {onEmailResults && (
              <Button
                onClick={() => setShowEmailForm(!showEmailForm)}
                variant="outline"
                className="bg-white/10 dark:bg-gray-800/10 backdrop-blur-lg border-white/20 dark:border-gray-700/20 hover:bg-white/20 dark:hover:bg-gray-700/20"
              >
                <Mail className="w-4 h-4 mr-2" />
                Email Results
              </Button>
            )}
            
            <Button
              onClick={onRetakeQuiz}
              variant="outline"
              className="bg-white/10 dark:bg-gray-800/10 backdrop-blur-lg border-white/20 dark:border-gray-700/20 hover:bg-white/20 dark:hover:bg-gray-700/20"
            >
              Retake Quiz
            </Button>

            {onManualSelection && (
              <Button
                onClick={onManualSelection}
                variant="outline"
                className="bg-white/10 dark:bg-gray-800/10 backdrop-blur-lg border-white/20 dark:border-gray-700/20 hover:bg-white/20 dark:hover:bg-gray-700/20"
              >
                <Users className="w-4 h-4 mr-2" />
                Browse All Industries
              </Button>
            )}
          </motion.div>

          {/* Email Form */}
          {showEmailForm && onEmailResults && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.4 }}
              className="mb-12"
            >
              <Card className="max-w-md mx-auto bg-white/10 dark:bg-gray-800/10 backdrop-blur-lg border-white/20 dark:border-gray-700/20">
                <CardContent className="p-6">
                  <form onSubmit={handleEmailSubmit}>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={emailValue}
                        onChange={(e) => setEmailValue(e.target.value)}
                        className="w-full px-3 py-2 bg-white/20 dark:bg-gray-800/20 border border-white/30 dark:border-gray-700/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="your@email.com"
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0"
                      disabled={isEmailSent}
                    >
                      {isEmailSent ? (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Sent!
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4 mr-2" />
                          Send Results
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Your Personality Profile */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.6 }}
          >
            <Card className="bg-white/10 dark:bg-gray-800/10 backdrop-blur-lg border-white/20 dark:border-gray-700/20">
              <CardHeader>
                <CardTitle className="text-xl text-gray-800 dark:text-gray-200 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  Your Personality Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Big Five */}
                  <div>
                    <h4 className="font-semibold mb-4 text-gray-800 dark:text-gray-200">Personality Traits</h4>
                    <div className="space-y-3">
                      {Object.entries(traits.bigfive).map(([trait, value]) => (
                        <div key={trait}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {getTraitLabel(trait)}
                            </span>
                            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                              {formatTraitValue(value as number)}%
                            </span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-purple-600 to-blue-600 transition-all duration-1000"
                              style={{ width: `${formatTraitValue(value as number)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* RIASEC */}
                  <div>
                    <h4 className="font-semibold mb-4 text-gray-800 dark:text-gray-200">Interest Areas</h4>
                    <div className="space-y-3">
                      {Object.entries(traits.riasec).map(([trait, value]) => (
                        <div key={trait}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {getTraitLabel(trait)}
                            </span>
                            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                              {formatTraitValue(value as number)}%
                            </span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-600 to-cyan-600 transition-all duration-1000"
                              style={{ width: `${formatTraitValue(value as number)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}