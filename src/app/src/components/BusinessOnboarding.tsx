import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building, ArrowRight, Sparkles, Target, TrendingUp, Search, 
  ChevronLeft, ChevronRight, Star, Zap, Filter, ArrowLeft
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { useBusiness } from './BusinessContext';
import { testServerConnection } from '../utils/businessApi';
import { ALL_ROADMAPS } from './roadmap/RoadmapData';

interface BusinessOnboardingProps {
  user: any;
}

export const BusinessOnboarding: React.FC<BusinessOnboardingProps> = ({ user }) => {
  const { createNewBusiness } = useBusiness();
  const [currentStep, setCurrentStep] = useState<'industry' | 'details'>('industry');
  const [selectedIndustry, setSelectedIndustry] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [businessForm, setBusinessForm] = useState({
    name: '',
    industry: '',
    description: ''
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverTest, setServerTest] = useState<{ status: string; details?: any } | null>(null);

  // Generate industry data from roadmaps
  const generateIndustryDataFromRoadmaps = () => {
    const industryMap = new Map();
    
    ALL_ROADMAPS.forEach((roadmap) => {
      if (roadmap && roadmap.title && roadmap.description) {
        const category = determineCategory(roadmap);
        const icon = getIconForCategory(category);
        
        const industryData = {
          id: roadmap.id || roadmap.title.toLowerCase().replace(/\s+/g, '-'),
          title: roadmap.title,
          description: roadmap.description.length > 120 
            ? roadmap.description.substring(0, 117) + '...' 
            : roadmap.description,
          category,
          icon,
          tags: roadmap.tags || [],
          difficulty: roadmap.difficulty || 'Medium',
          timeToProfit: roadmap.estimatedTimeToProfit || '3-6 months',
          popular: roadmap.tags?.includes('popular') || false
        };
        
        industryMap.set(roadmap.title, industryData);
      }
    });

    return Array.from(industryMap.values());
  };

  // Determine category for roadmap
  const determineCategory = (roadmap: any): string => {
    const tags = roadmap.tags || [];
    const title = roadmap.title.toLowerCase();
    
    if (tags.some((tag: string) => ['manufacturing', 'production'].includes(tag)) || 
        title.includes('manufacturing') || title.includes('production')) {
      return 'Manufacturing';
    }
    if (tags.some((tag: string) => ['tech', 'technology', 'software', 'app', 'saas'].includes(tag)) || 
        title.includes('app') || title.includes('software') || title.includes('tech') || title.includes('saas')) {
      return 'Technology';
    }
    if (tags.some((tag: string) => ['ecommerce', 'retail', 'online'].includes(tag)) || 
        title.includes('ecommerce') || title.includes('dropshipping') || title.includes('online')) {
      return 'E-commerce';
    }
    if (tags.some((tag: string) => ['service', 'consulting', 'freelance'].includes(tag)) || 
        title.includes('service') || title.includes('consulting') || title.includes('freelance')) {
      return 'Services';
    }
    if (tags.some((tag: string) => ['health', 'medical', 'wellness'].includes(tag)) || 
        title.includes('health') || title.includes('medical') || title.includes('wellness')) {
      return 'Healthcare';
    }
    if (tags.some((tag: string) => ['finance', 'fintech', 'investment'].includes(tag)) || 
        title.includes('finance') || title.includes('investment') || title.includes('fintech')) {
      return 'Finance';
    }
    if (tags.some((tag: string) => ['education', 'training', 'course'].includes(tag)) || 
        title.includes('education') || title.includes('training') || title.includes('course')) {
      return 'Education';
    }
    if (tags.some((tag: string) => ['food', 'restaurant', 'catering'].includes(tag)) || 
        title.includes('food') || title.includes('restaurant') || title.includes('catering')) {
      return 'Food & Beverage';
    }
    if (tags.some((tag: string) => ['real estate', 'property'].includes(tag)) || 
        title.includes('real estate') || title.includes('property')) {
      return 'Real Estate';
    }
    if (tags.some((tag: string) => ['media', 'content', 'marketing'].includes(tag)) || 
        title.includes('media') || title.includes('content') || title.includes('marketing')) {
      return 'Media & Marketing';
    }
    return 'Other';
  };

  // Get icon for category
  const getIconForCategory = (category: string) => {
    const iconMap: { [key: string]: string } = {
      'Technology': '💻',
      'E-commerce': '🛒',
      'Services': '🔧',
      'Healthcare': '🏥',
      'Finance': '💰',
      'Education': '📚',
      'Food & Beverage': '🍽️',
      'Real Estate': '🏠',
      'Media & Marketing': '📱',
      'Manufacturing': '🏭',
      'Other': '🚀'
    };
    return iconMap[category] || '🚀';
  };

  const industries = generateIndustryDataFromRoadmaps();
  const categories = Array.from(new Set(industries.map(industry => industry.category)));

  // Filter industries based on search and category
  const filteredIndustries = industries.filter(industry => {
    const matchesSearch = industry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         industry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         industry.tags.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = !selectedCategory || industry.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const popularIndustries = industries.filter(industry => industry.popular).slice(0, 8);

  const handleIndustrySelect = (industry: any) => {
    setSelectedIndustry(industry);
    setBusinessForm(prev => ({ 
      ...prev, 
      industry: industry.title,
      name: prev.name || `${industry.title} Business` // Suggest a name if empty
    }));
    setCurrentStep('details');
  };

  const handleGeneralSetup = () => {
    // Set up a general business without specific industry
    setSelectedIndustry({
      id: 'general-setup',
      title: 'General Business Setup',
      description: 'A flexible business setup that can be customized later',
      category: 'Other',
      icon: '🚀'
    });
    setBusinessForm(prev => ({ 
      ...prev, 
      industry: 'General Setup',
      name: prev.name || 'My Business'
    }));
    setCurrentStep('details');
  };

  const handleCreateBusiness = async () => {
    if (!businessForm.name.trim()) {
      setError('Please enter a business name');
      return;
    }

    setCreating(true);
    setError(null);
    
    try {
      const business = await createNewBusiness({
        ...businessForm,
        industry: businessForm.industry || 'Other'
      });
      
      if (!business) {
        setError('Failed to create business. Please try again.');
      }
      // If successful, the context will handle updating the UI
    } catch (err) {
      setError('Failed to create business. Please try again.');
      console.error('Error creating business:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleTestServer = async () => {
    setServerTest({ status: 'testing' });
    try {
      const result = await testServerConnection();
      setServerTest({ status: 'success', details: result });
    } catch (error: any) {
      setServerTest({ status: 'error', details: error.message });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-950 starry-background flex items-center justify-center p-4 sm:p-6">
      {/* Gentle meteor for onboarding */}
      <div className="shooting-star" style={{ animationDelay: '22s', animationDuration: '5.8s', top: '40%' }}></div>
      
      <div className="w-full max-w-6xl">
        <AnimatePresence mode="wait">
          {currentStep === 'industry' ? (
            <motion.div
              key="industry"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              {/* Industry Selection Step */}
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg"
                >
                  <Building className="w-10 h-10 text-white" />
                </motion.div>
                
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-gray-200 mb-4">
                  Welcome! 🚀
                </h1>
                
                <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 mb-2">
                  Hey {user?.user_metadata?.name || 'Entrepreneur'}! Choose your industry to get started
                </p>
                
                <p className="text-gray-500 dark:text-gray-500 mb-6">
                  We'll customize your roadmap based on your industry selection
                </p>

                {/* Progress indicator */}
                <div className="flex items-center justify-center gap-2 mb-8">
                  <div className="w-8 h-2 bg-blue-500 rounded-full"></div>
                  <div className="w-8 h-2 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                  <span className="text-sm text-gray-500 ml-2">Step 1 of 2</span>
                </div>
              </div>

              <Card className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-lg border border-gray-200/50 dark:border-gray-700/50 shadow-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-center text-xl sm:text-2xl">
                    Choose Your Industry
                  </CardTitle>
                  <CardDescription className="text-center">
                    Select the industry that best matches your business idea (from our 100+ available roadmaps)
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Sidebar with search and categories */}
                    <div className="lg:w-80">
                      {/* Search */}
                      <div className="relative mb-6">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Search industries..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>

                      {/* Categories */}
                      <div className="space-y-2 mb-6">
                        <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-3">Categories</h4>
                        <button
                          onClick={() => setSelectedCategory(null)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                            !selectedCategory 
                              ? 'bg-blue-500 text-white' 
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          All Industries ({industries.length})
                        </button>
                        {categories.map((category) => {
                          const count = industries.filter(i => i.category === category).length;
                          return (
                            <button
                              key={category}
                              onClick={() => setSelectedCategory(category)}
                              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                                selectedCategory === category 
                                  ? 'bg-blue-500 text-white' 
                                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {category} ({count})
                            </button>
                          );
                        })}
                      </div>

                      {/* Popular Industries */}
                      {popularIndustries.length > 0 && !searchTerm && !selectedCategory && (
                        <div>
                          <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-3">Popular Choices</h4>
                          <div className="space-y-2">
                            {popularIndustries.slice(0, 4).map((industry) => (
                              <button
                                key={industry.id}
                                onClick={() => handleIndustrySelect(industry)}
                                className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">{industry.icon}</span>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                                      {industry.title}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                      Popular
                                    </div>
                                  </div>
                                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Main content area */}
                    <div className="flex-1">
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          {selectedCategory || 'All Industries'} 
                          <span className="text-gray-500 ml-2">({filteredIndustries.length})</span>
                        </h3>
                        
                        {searchTerm && (
                          <button
                            onClick={() => setSearchTerm('')}
                            className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                          >
                            Clear search
                          </button>
                        )}
                      </div>

                      {filteredIndustries.length === 0 ? (
                        <div className="text-center py-12">
                          <Building className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No industries found</h3>
                          <p className="text-gray-500 dark:text-gray-400">
                            Try adjusting your search or category filter
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                          {filteredIndustries.map((industry) => (
                            <motion.div
                              key={industry.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <Card 
                                className="h-full cursor-pointer hover:shadow-lg transition-all duration-300 hover:border-blue-300 dark:hover:border-blue-600 group"
                                onClick={() => handleIndustrySelect(industry)}
                              >
                                <CardHeader className="pb-3">
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className="text-2xl">{industry.icon}</div>
                                      <div className="flex-1 min-w-0">
                                        <CardTitle className="text-base leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                          {industry.title}
                                        </CardTitle>
                                        <div className="flex items-center gap-2 mt-1">
                                          <Badge variant="outline" className="text-xs">
                                            {industry.category}
                                          </Badge>
                                          {industry.popular && (
                                            <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                              <Star className="w-3 h-3 mr-1 fill-current" />
                                              Popular
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                                  </div>
                                </CardHeader>
                                <CardContent className="pt-0">
                                  <CardDescription className="text-sm mb-3 leading-relaxed">
                                    {industry.description}
                                  </CardDescription>
                                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                    <div className="flex items-center gap-1">
                                      <TrendingUp className="w-3 h-3" />
                                      {industry.difficulty}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Zap className="w-3 h-3" />
                                      {industry.timeToProfit}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* General Setup Option */}
                  <div className="mt-8 pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
                    <div className="text-center">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Don't see your industry? No problem!
                      </p>
                      <Button
                        onClick={handleGeneralSetup}
                        variant="outline"
                        className="py-3 px-6"
                      >
                        <div className="flex items-center gap-2">
                          <span>🚀</span>
                          <span>Use General Setup</span>
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </Button>
                      <p className="text-xs text-gray-400 mt-2">
                        You can customize your roadmap later
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-2xl mx-auto"
            >
              {/* Business Details Step */}
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg"
                >
                  <Building className="w-10 h-10 text-white" />
                </motion.div>
                
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-gray-200 mb-4">
                  Business Details
                </h1>
                
                <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 mb-2">
                  Tell us about your {selectedIndustry?.title} business
                </p>

                {/* Progress indicator */}
                <div className="flex items-center justify-center gap-2 mb-8">
                  <div className="w-8 h-2 bg-green-500 rounded-full"></div>
                  <div className="w-8 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-500 ml-2">Step 2 of 2</span>
                </div>
              </div>

              <Card className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-lg border border-gray-200/50 dark:border-gray-700/50 shadow-xl">
                <CardHeader className="text-center">
                  <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                    <Sparkles className="w-6 h-6 text-purple-600" />
                    Create Your Business
                  </CardTitle>
                  {selectedIndustry && (
                    <CardDescription className="flex items-center justify-center gap-2 mt-2">
                      <span className="text-lg">{selectedIndustry.icon}</span>
                      <span>{selectedIndustry.title}</span>
                    </CardDescription>
                  )}
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm"
                    >
                      {error}
                    </motion.div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="business-name" className="text-base font-medium">
                        Business Name *
                      </Label>
                      <Input
                        id="business-name"
                        value={businessForm.name}
                        onChange={(e) => setBusinessForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., My Amazing Startup"
                        className="mt-2 text-lg py-3"
                        disabled={creating}
                      />
                    </div>

                    <div>
                      <Label htmlFor="business-description" className="text-base font-medium">
                        Description
                      </Label>
                      <Textarea
                        id="business-description"
                        value={businessForm.description}
                        onChange={(e) => setBusinessForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Tell us a bit about your business idea... (optional)"
                        className="mt-2 text-lg"
                        rows={3}
                        disabled={creating}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button
                      onClick={() => setCurrentStep('industry')}
                      variant="outline"
                      className="flex-1 py-3 text-base"
                      disabled={creating}
                    >
                      <div className="flex items-center gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Industry</span>
                      </div>
                    </Button>
                    
                    <Button 
                      onClick={handleCreateBusiness}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 py-3 text-base"
                      disabled={!businessForm.name.trim() || creating}
                    >
                      {creating ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Creating...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span>Create Business</span>
                          <ArrowRight className="w-5 h-5" />
                        </div>
                      )}
                    </Button>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                    <div className="flex items-center justify-center gap-4">
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <Target className="w-4 h-4" />
                        <span>Personalized roadmap</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <TrendingUp className="w-4 h-4" />
                        <span>Progress tracking</span>
                      </div>
                    </div>

                    {/* Debug section - only show in development */}
                    {process.env.NODE_ENV === 'development' && (
                      <div className="text-center">
                        <Button
                          onClick={handleTestServer}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                        >
                          Test Server Connection
                        </Button>
                        {serverTest && (
                          <div className="mt-2 text-xs">
                            <span className={`${
                              serverTest.status === 'success' ? 'text-green-600' :
                              serverTest.status === 'error' ? 'text-red-600' :
                              'text-yellow-600'
                            }`}>
                              {serverTest.status === 'testing' ? 'Testing...' :
                               serverTest.status === 'success' ? 'Server OK' :
                               `Server Error: ${serverTest.details}`}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6"
        >
          You can manage multiple businesses and switch between them anytime
        </motion.p>
      </div>
    </div>
  );
};