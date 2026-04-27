import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useTheme } from './ThemeProvider';
import { useBusiness } from './BusinessContext';
import { supabase } from '../utils/supabase/client';
import { Moon, Sun, HelpCircle, Sparkles, RefreshCw, Check, Lightbulb, Shuffle, Filter, Target } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

function BusinessNameGenerator() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { createNewBusiness } = useBusiness();
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [customName, setCustomName] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [nameStyle, setNameStyle] = useState('mixed');

  // Enhanced name generation system with multiple algorithms and categories
  const nameCategories = {
    tech: {
      label: 'Tech & Innovation',
      prefixes: ['Cyber', 'Digital', 'Smart', 'Tech', 'Data', 'Cloud', 'AI', 'Quantum', 'Neural', 'Byte', 'Pixel', 'Code', 'Logic', 'Binary'],
      suffixes: ['Labs', 'Systems', 'Solutions', 'Hub', 'Core', 'Dynamics', 'Works', 'Tech', 'Studio', 'Engine', 'Stream', 'Grid', 'Network', 'Sphere'],
      roots: ['Innovation', 'Future', 'Digital', 'Connect', 'Transform', 'Evolve', 'Advance', 'Progress', 'Develop', 'Create']
    },
    creative: {
      label: 'Creative & Design',
      prefixes: ['Creative', 'Design', 'Artisan', 'Studio', 'Craft', 'Vision', 'Canvas', 'Pixel', 'Color', 'Form', 'Style', 'Muse', 'Inspire', 'Dream'],
      suffixes: ['Studio', 'Works', 'Co.', 'Collective', 'House', 'Lab', 'Space', 'Gallery', 'Atelier', 'Workshop', 'Forge', 'Craft', 'Design', 'Arts'],
      roots: ['Create', 'Design', 'Imagine', 'Craft', 'Build', 'Shape', 'Form', 'Express', 'Inspire', 'Visualize']
    },
    business: {
      label: 'Business & Finance',
      prefixes: ['Capital', 'Strategic', 'Elite', 'Prime', 'Summit', 'Apex', 'Peak', 'Alpha', 'Beta', 'Sigma', 'Crown', 'Royal', 'Premier', 'Executive'],
      suffixes: ['Partners', 'Group', 'Ventures', 'Capital', 'Holdings', 'Corp', 'Inc', 'Consulting', 'Advisory', 'Strategies', 'Solutions', 'Enterprises', 'Associates', 'Management'],
      roots: ['Growth', 'Success', 'Profit', 'Invest', 'Trade', 'Finance', 'Wealth', 'Capital', 'Strategy', 'Execute']
    },
    wellness: {
      label: 'Health & Wellness',
      prefixes: ['Vital', 'Pure', 'Zen', 'Balance', 'Harmony', 'Fresh', 'Natural', 'Organic', 'Green', 'Life', 'Wellness', 'Health', 'Mind', 'Body'],
      suffixes: ['Wellness', 'Health', 'Life', 'Care', 'Center', 'Studio', 'Space', 'Sanctuary', 'Haven', 'Retreat', 'Spa', 'Clinic', 'Institute', 'Lab'],
      roots: ['Heal', 'Balance', 'Restore', 'Revive', 'Energize', 'Nourish', 'Strengthen', 'Refresh', 'Renew', 'Transform']
    },
    lifestyle: {
      label: 'Lifestyle & Retail',
      prefixes: ['Urban', 'Modern', 'Classic', 'Luxury', 'Premium', 'Artisan', 'Boutique', 'Signature', 'Elite', 'Refined', 'Curated', 'Bespoke', 'Custom', 'Unique'],
      suffixes: ['Co.', 'Store', 'Boutique', 'Collection', 'House', 'Gallery', 'Market', 'Hub', 'Emporium', 'Collective', 'Supply', 'Goods', 'Trade', 'Exchange'],
      roots: ['Style', 'Fashion', 'Trend', 'Curate', 'Select', 'Craft', 'Discover', 'Experience', 'Enjoy', 'Live']
    }
  };

  // Modern business name patterns
  const modernPatterns = [
    'Velocity', 'Nexus', 'Catalyst', 'Summit', 'Pinnacle', 'Apex', 'Nova', 'Zenith', 'Prime', 'Elite',
    'Fusion', 'Quantum', 'Phoenix', 'Stellar', 'Infinite', 'Vision', 'Impact', 'Bright', 'Dynamic', 'Peak',
    'NextGen', 'Strategic', 'Bold', 'Rapid', 'Smart', 'Future', 'Breakthrough', 'Success', 'Momentum', 'Elevate',
    'Synergy', 'Vertex', 'Prism', 'Vector', 'Matrix', 'Cipher', 'Flux', 'Vortex', 'Orbit', 'Echo',
    'Pulse', 'Shift', 'Spark', 'Tide', 'Wave', 'Flow', 'Rise', 'Surge', 'Boost', 'Launch'
  ];

  const businessSuffixes = [
    'Ventures', 'Solutions', 'Partners', 'Group', 'Co.', 'Labs', 'Works', 'Hub', 'Studio', 'Dynamics',
    'Systems', 'Enterprises', 'Inc', 'Corp', 'Consulting', 'Strategies', 'Analytics', 'Networks', 'Digital',
    'Innovation', 'Technologies', 'Services', 'Agency', 'Collective', 'House', 'Institute', 'Center'
  ];

  const generateNamesByAlgorithm = useCallback((count: number) => {
    const names = new Set<string>();
    
    // Algorithm 1: Category-based generation
    if (selectedCategory !== 'all') {
      const category = nameCategories[selectedCategory as keyof typeof nameCategories];
      if (category) {
        // Prefix + Suffix combinations
        for (let i = 0; i < count / 4; i++) {
          const prefix = category.prefixes[Math.floor(Math.random() * category.prefixes.length)];
          const suffix = category.suffixes[Math.floor(Math.random() * category.suffixes.length)];
          names.add(`${prefix} ${suffix}`);
        }
        
        // Root + Suffix combinations
        for (let i = 0; i < count / 4; i++) {
          const root = category.roots[Math.floor(Math.random() * category.roots.length)];
          const suffix = category.suffixes[Math.floor(Math.random() * category.suffixes.length)];
          names.add(`${root} ${suffix}`);
        }
      }
    }

    // Algorithm 2: Modern pattern + suffix
    for (let i = 0; i < count / 3; i++) {
      const pattern = modernPatterns[Math.floor(Math.random() * modernPatterns.length)];
      const suffix = businessSuffixes[Math.floor(Math.random() * businessSuffixes.length)];
      names.add(`${pattern} ${suffix}`);
    }

    // Algorithm 3: Single word modern names
    const singleWordNames = [
      'Zenith', 'Nexus', 'Quantum', 'Velocity', 'Catalyst', 'Fusion', 'Prism', 'Vector',
      'Matrix', 'Vertex', 'Cipher', 'Flux', 'Orbit', 'Echo', 'Pulse', 'Spark', 'Tide',
      'Vortex', 'Summit', 'Apex', 'Nova', 'Phoenix', 'Stellar', 'Prime', 'Elite',
      'Surge', 'Boost', 'Launch', 'Rise', 'Wave', 'Flow', 'Shift', 'Momentum'
    ];
    
    for (let i = 0; i < count / 4; i++) {
      const name = singleWordNames[Math.floor(Math.random() * singleWordNames.length)];
      names.add(name);
    }

    // Algorithm 4: Creative combinations
    const adjectives = ['Smart', 'Bold', 'Swift', 'Pure', 'True', 'Clear', 'Bright', 'Sharp', 'Quick', 'Strong'];
    const nouns = ['Vision', 'Path', 'Way', 'Route', 'Journey', 'Quest', 'Mission', 'Goal', 'Dream', 'Hope'];
    
    for (let i = 0; i < count / 4; i++) {
      const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
      const noun = nouns[Math.floor(Math.random() * nouns.length)];
      names.add(`${adj} ${noun}`);
    }

    // Algorithm 5: Style-based generation
    if (nameStyle === 'short') {
      const shortNames = ['Zap', 'Zen', 'Ace', 'Arc', 'Hex', 'Lux', 'Max', 'Vex', 'Fox', 'Rex', 'Nix', 'Pix', 'Vox', 'Zix'];
      shortNames.forEach(name => names.add(name));
    } else if (nameStyle === 'descriptive') {
      const descriptiveNames = [
        'Innovative Solutions Group', 'Strategic Business Partners', 'Advanced Technology Systems',
        'Professional Services Network', 'Dynamic Growth Strategies', 'Excellence in Business',
        'Future Forward Enterprises', 'Breakthrough Innovation Labs', 'Success Driven Solutions'
      ];
      descriptiveNames.forEach(name => names.add(name));
    }

    // Fill remaining slots with random combinations
    while (names.size < count) {
      const pattern = modernPatterns[Math.floor(Math.random() * modernPatterns.length)];
      const suffix = businessSuffixes[Math.floor(Math.random() * businessSuffixes.length)];
      names.add(`${pattern} ${suffix}`);
    }

    return Array.from(names).slice(0, count);
  }, [selectedCategory, nameStyle]);

  const [generatedNames, setGeneratedNames] = useState(() => {
    return generateNamesByAlgorithm(15);
  });

  const handleNameSelect = useCallback(async (name: string) => {
    if (isNavigating) return;
    
    try {
      setSelectedName(name);
      setIsNavigating(true);
      
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        console.log('BusinessNameGenerator: User authenticated, creating business...');
        
        // Gather all the data from the questionnaire flow
        const selectedIndustry = localStorage.getItem('selectedIndustry');
        const personalityAnswers = localStorage.getItem('personalityAnswers');
        const questionnairePath = localStorage.getItem('questionnaire_path');
        
        // Create business data object
        const businessData = {
          name: name,
          industry: selectedIndustry || 'general',
          description: `A ${selectedIndustry || 'business'} venture`,
          personalityAnswers: personalityAnswers ? JSON.parse(personalityAnswers) : null,
          questionnairePath: questionnairePath || 'unknown'
        };
        
        try {
          console.log('BusinessNameGenerator: Creating business with data:', businessData);
          await createNewBusiness(businessData);
          
          // Clear the stored questionnaire data since business is now created
          localStorage.removeItem('selectedIndustry');
          localStorage.removeItem('personalityAnswers');
          localStorage.removeItem('questionnaire_path');
          localStorage.removeItem('businessName');
          
          // Add a slight delay for visual feedback then navigate to dashboard
          setTimeout(() => {
            console.log('BusinessNameGenerator: Business created successfully, redirecting to dashboard');
            navigate('/dashboard', { replace: true });
          }, 800);
        } catch (businessError) {
          console.error('BusinessNameGenerator: Error creating business:', businessError);
          setIsNavigating(false);
          setSelectedName(null);
          // Still navigate to dashboard even if business creation fails
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 800);
        }
      } else {
        // Store the business name for after authentication
        localStorage.setItem('businessName', name);
        
        // User not authenticated, go to auth page
        console.log('BusinessNameGenerator: User not authenticated, redirecting to auth');
        setTimeout(() => {
          navigate('/auth?from=business-name');
        }, 800);
      }
    } catch (error) {
      console.error('Error selecting business name:', error);
      setIsNavigating(false);
      setSelectedName(null);
    }
  }, [navigate, isNavigating, createNewBusiness]);

  const handleCustomSubmit = useCallback(() => {
    const trimmedName = customName.trim();
    if (trimmedName && !isNavigating) {
      handleNameSelect(trimmedName);
    }
  }, [customName, handleNameSelect, isNavigating]);

  const handleRegenerateNames = useCallback(() => {
    setGeneratedNames(generateNamesByAlgorithm(15));
    setSelectedName(null);
  }, [generateNamesByAlgorithm]);

  const handleGoBack = useCallback(() => {
    if (!isNavigating) {
      navigate(-1);
    }
  }, [navigate, isNavigating]);

  const filteredNames = useMemo(() => {
    return generatedNames;
  }, [generatedNames]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50/80 via-blue-50/80 to-pink-50/80 dark:from-purple-900/20 dark:via-blue-900/20 dark:to-pink-900/20"></div>
      
      {/* Animated Background Elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-purple-400/30 to-blue-400/30 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-40 h-40 bg-gradient-to-r from-blue-400/30 to-pink-400/30 rounded-full blur-xl animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-gradient-to-r from-pink-400/30 to-purple-400/30 rounded-full blur-xl animate-pulse delay-2000"></div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-6">
        <motion.button
          onClick={handleGoBack}
          disabled={isNavigating}
          className={`text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent transition-opacity ${
            isNavigating ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'
          }`}
        >
          ← Back
        </motion.button>

        <div className="flex items-center space-x-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-white/20 dark:bg-gray-800/20 backdrop-blur-lg border border-white/30 dark:border-gray-700/30 hover:bg-white/30 dark:hover:bg-gray-700/30 transition-all duration-300"
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 px-6 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-6xl mx-auto text-center mb-12"
        >
          {/* Progress Bar */}
          <div className="w-full h-2 bg-white/20 dark:bg-gray-800/20 rounded-full mb-8 backdrop-blur-lg">
            <motion.div
              initial={{ width: '60%' }}
              animate={{ width: '80%' }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="h-full bg-gradient-to-r from-purple-600 to-blue-600 rounded-full"
            ></motion.div>
          </div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mb-6 mx-auto"
          >
            <Sparkles className="w-8 h-8 text-white" />
          </motion.div>

          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 bg-clip-text text-transparent">
            Choose Your Business Name
          </h1>

          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Discover the perfect name from our AI-powered generator with {generatedNames.length}+ unique suggestions
          </p>

          {/* Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8 max-w-4xl mx-auto">
            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40 bg-white/20 dark:bg-gray-800/20 backdrop-blur-lg border border-white/30 dark:border-gray-700/30">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Object.entries(nameCategories).map(([key, category]) => (
                    <SelectItem key={key} value={key}>{category.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={nameStyle} onValueChange={setNameStyle}>
                <SelectTrigger className="w-40 bg-white/20 dark:bg-gray-800/20 backdrop-blur-lg border border-white/30 dark:border-gray-700/30">
                  <Target className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mixed">Mixed Style</SelectItem>
                  <SelectItem value="short">Short & Punchy</SelectItem>
                  <SelectItem value="descriptive">Descriptive</SelectItem>
                  <SelectItem value="modern">Modern Tech</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleRegenerateNames}
                disabled={isNavigating}
                variant="outline"
                className={`bg-white/20 dark:bg-gray-800/20 backdrop-blur-lg border-white/30 dark:border-gray-700/30 ${
                  isNavigating ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Shuffle className={`w-4 h-4 mr-2 ${isNavigating ? '' : 'hover:rotate-180 transition-transform duration-300'}`} />
                Generate 15 More
              </Button>

              <Button
                onClick={() => setShowCustom(!showCustom)}
                disabled={isNavigating}
                className={`bg-gradient-to-r from-purple-600 to-blue-600 ${
                  isNavigating ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Lightbulb className="w-4 h-4 mr-2" />
                Custom Name
              </Button>
            </div>
          </div>

          {/* Statistics */}
          <div className="flex justify-center gap-6 mb-8">
            <Badge variant="outline" className="bg-white/10 border-white/20 px-4 py-2">
              {filteredNames.length} Names Generated
            </Badge>
            <Badge variant="outline" className="bg-white/10 border-white/20 px-4 py-2">
              AI-Powered Algorithms
            </Badge>
            <Badge variant="outline" className="bg-white/10 border-white/20 px-4 py-2">
              Domain Available*
            </Badge>
          </div>

          {/* Custom Name Input */}
          {showCustom && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
              className="mb-8 max-w-md mx-auto"
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Enter your business name"
                  disabled={isNavigating}
                  className={`flex-1 p-4 rounded-xl bg-white/20 dark:bg-gray-800/20 backdrop-blur-lg border border-white/30 dark:border-gray-700/30 focus:border-purple-500 focus:outline-none transition-all duration-300 ${
                    isNavigating ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  onKeyPress={(e) => e.key === 'Enter' && !isNavigating && handleCustomSubmit()}
                />
                <motion.button
                  onClick={handleCustomSubmit}
                  disabled={!customName.trim() || isNavigating}
                  whileHover={!isNavigating ? { scale: 1.05 } : {}}
                  whileTap={!isNavigating ? { scale: 0.95 } : {}}
                  className={`px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 ${
                    (!customName.trim() || isNavigating) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <Check className="w-5 h-5" />
                </motion.button>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Generated Names Grid */}
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredNames.map((name, index) => (
              <motion.div
                key={`${name}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.05 * index }}
                whileHover={!isNavigating ? { scale: 1.02 } : {}}
                whileTap={!isNavigating ? { scale: 0.98 } : {}}
                onClick={() => !isNavigating && handleNameSelect(name)}
                className={`p-4 rounded-2xl cursor-pointer transition-all duration-500 backdrop-blur-lg border text-center ${
                  isNavigating ? 'opacity-50 cursor-not-allowed' : ''
                } ${
                  selectedName === name
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white border-transparent scale-105 shadow-2xl'
                    : 'bg-white/20 dark:bg-gray-800/20 border-white/30 dark:border-gray-700/30 hover:bg-white/30 dark:hover:bg-gray-700/30 hover:border-purple-300 dark:hover:border-purple-500'
                }`}
              >
                <div className="flex items-center justify-center mb-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    selectedName === name 
                      ? 'bg-white/20' 
                      : 'bg-gradient-to-r from-purple-600 to-blue-600'
                  }`}>
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                </div>
                
                <h3 className="font-bold mb-1 text-sm leading-tight">{name}</h3>
                <p className={`text-xs ${selectedName === name ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'}`}>
                  Available*
                </p>

                {selectedName === name && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="mt-3 flex items-center justify-center"
                  >
                    <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-purple-600" />
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="text-center mt-8"
          >
            <button 
              disabled={isNavigating}
              className={`px-6 py-3 bg-white/20 dark:bg-gray-800/20 backdrop-blur-lg border border-white/30 dark:border-gray-700/30 rounded-xl hover:bg-white/30 dark:hover:bg-gray-700/30 transition-all duration-300 flex items-center gap-2 mx-auto ${
                isNavigating ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <HelpCircle className="w-5 h-5" />
              Need help choosing? We're here to help!
            </button>
          </motion.div>

          <div className="text-center mt-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              *Domain availability not guaranteed. Please verify before finalizing your choice.
            </p>
          </div>
        </div>
      </div>

      {/* Help Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 1 }}
        disabled={isNavigating}
        className={`fixed bottom-6 right-6 p-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 z-50 ${
          isNavigating ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        <HelpCircle className="w-6 h-6" />
      </motion.button>

      {/* Loading overlay when navigating */}
      {isNavigating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 flex items-center justify-center"
        >
          <div className="bg-white/20 dark:bg-gray-800/20 backdrop-blur-lg rounded-2xl p-6 flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-4"></div>
            <p className="text-gray-800 dark:text-gray-200 font-medium">Setting up your business...</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default BusinessNameGenerator;