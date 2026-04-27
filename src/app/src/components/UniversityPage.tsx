import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useBusiness } from './BusinessContext';
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { 
  BookOpen, 
  GraduationCap, 
  Search, 
  ArrowLeft,
  Clock,
  TrendingUp,
  Target,
  Award,
  Building2,
  Sparkles,
  Zap,
  Star,
  ChevronRight,
  Filter,
  X,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import RegisteringBusinessTrack from './university/RegisteringBusinessTrack';
import MarketingFoundationTrack from './university/MarketingFoundationTrack';
import SalesRevenueTrack from './university/SalesRevenueTrack';
import CustomerSuccessTrack from './university/CustomerSuccessTrack';
import OperationsSystemsTrack from './university/OperationsSystemsTrack';

interface Track {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  estimatedHours: number;
  tutorialCount: number;
  completedCount?: number;
  icon: string;
}

// Button animation variants
const buttonVariants = {
  hover: { 
    scale: 1.02,
    transition: { type: "spring", stiffness: 400, damping: 10 }
  },
  tap: { 
    scale: 0.98,
    transition: { type: "spring", stiffness: 400, damping: 10 }
  }
};

// Card animation variants
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.3,
      ease: "easeOut"
    }
  }),
  hover: {
    y: -4,
    transition: { type: "spring", stiffness: 300, damping: 20 }
  }
};

// Icon mapping
const iconComponents: { [key: string]: any } = {
  '🏢': Building2,
  '📊': TrendingUp,
  '🎯': Target,
  '🏆': Award,
  '📚': BookOpen,
  '⚡': Zap,
};

// Difficulty colors using Toy Box Pop palette
const difficultyColors = {
  'Beginner': { bg: '#6CFF6C', text: 'text-white', border: 'border-[#6CFF6C]' },
  'Intermediate': { bg: '#FFCF00', text: 'text-black', border: 'border-[#FFCF00]' },
  'Advanced': { bg: '#FF4F4F', text: 'text-white', border: 'border-[#FF4F4F]' }
};

// Category colors
const categoryColors = {
  'Legal': '#4B00FF',
  'Finance': '#00E0FF',
  'Marketing': '#FF4F4F',
  'Operations': '#6CFF6C',
  'Sales': '#FFCF00',
  'HR': '#4B00FF',
};

export default function UniversityPage() {
  const { selectedBusiness } = useBusiness();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [trackProgress, setTrackProgress] = useState<{ [key: string]: any }>({});

  // Load tracks and progress
  useEffect(() => {
    loadTracks();
    loadTrackProgress();
  }, [selectedBusiness]);

  const loadTracks = async () => {
    if (!selectedBusiness) return;
    
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/university/tracks`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        const serverTracks = data.tracks || [];
        
        // Add our custom "Registering Your Business" track
        const customTrack: Track = {
          id: 'registering-business',
          title: 'Registering Your Business',
          description: 'Learn how to choose the right business structure and complete your LLC registration',
          category: 'Legal',
          difficulty: 'Beginner',
          estimatedHours: 0.75,
          tutorialCount: 13,
          completedCount: 0,
          icon: '🏢'
        };
        
        // Add Marketing Foundation track
        const marketingTrack: Track = {
          id: 'marketing-foundation',
          title: 'Marketing Foundation',
          description: 'Core marketing skills for customer acquisition and conversion',
          category: 'Growth',
          difficulty: 'Beginner',
          estimatedHours: 9,
          tutorialCount: 7,
          completedCount: 0,
          icon: '🎯'
        };

        // Add Sales & Revenue track
        const salesTrack: Track = {
          id: 'sales-revenue',
          title: 'Sales & Revenue',
          description: 'Pricing, sales processes, and revenue optimization strategies',
          category: 'Growth',
          difficulty: 'Intermediate',
          estimatedHours: 7,
          tutorialCount: 3,
          completedCount: 0,
          icon: '💰'
        };

        // Add Customer Success track
        const customerSuccessTrack: Track = {
          id: 'customer-success',
          title: 'Customer Success',
          description: 'Onboarding, retention, and long-term customer value',
          category: 'Growth',
          difficulty: 'Intermediate',
          estimatedHours: 7,
          tutorialCount: 3,
          completedCount: 0,
          icon: '❤️'
        };

        // Add Operations & Systems track
        const operationsTrack: Track = {
          id: 'operations-systems',
          title: 'Operations & Systems',
          description: 'Delegation, analytics, and scalable business systems',
          category: 'Operations',
          difficulty: 'Advanced',
          estimatedHours: 7,
          tutorialCount: 2,
          completedCount: 0,
          icon: '⚙️'
        };
        
        setTracks([customTrack, marketingTrack, salesTrack, customerSuccessTrack, operationsTrack, ...serverTracks]);
      }
    } catch (error) {
      console.error('Error loading tracks:', error);
      toast.error('Failed to load tracks');
    } finally {
      setLoading(false);
    }
  };

  const loadTrackProgress = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user || !session?.access_token) return;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/university/user-track-progress`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setTrackProgress(data.progress || {});
      }
    } catch (error) {
      console.error('Error loading track progress:', error);
      // Don't show error toast, just log it
    }
  };

  // Handle track selection
  const handleTrackClick = (track: Track) => {
    if (track.id === 'registering-business' || 
        track.id === 'marketing-foundation' || 
        track.id === 'sales-revenue' || 
        track.id === 'customer-success' || 
        track.id === 'operations-systems') {
      setSelectedTrack(track);
    } else {
      toast('This track is coming soon!', { icon: '🚧' });
    }
  };

  // Back to tracks view
  const backToTracks = () => {
    setSelectedTrack(null);
  };

  // Filter tracks
  const filteredTracks = tracks.filter(track => {
    const matchesSearch = track.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         track.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || track.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = ['all', ...new Set(tracks.map(t => t.category))];

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-[#00E0FF] rounded-full blur-xl opacity-30" />
            <div className="relative w-20 h-20 bg-white dark:bg-gray-800 border-4 border-[#00E0FF] rounded-full flex items-center justify-center mx-auto">
              <GraduationCap className="w-10 h-10 text-[#00E0FF] animate-pulse" />
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-300">Loading University...</p>
        </motion.div>
      </div>
    );
  }

  // Show selected track (Registering Business Track)
  if (selectedTrack?.id === 'registering-business') {
    return <RegisteringBusinessTrack onBack={backToTracks} />;
  }

  if (selectedTrack?.id === 'marketing-foundation') {
    return <MarketingFoundationTrack onBack={backToTracks} />;
  }

  if (selectedTrack?.id === 'sales-revenue') {
    return <SalesRevenueTrack onBack={backToTracks} />;
  }

  if (selectedTrack?.id === 'customer-success') {
    return <CustomerSuccessTrack onBack={backToTracks} />;
  }

  if (selectedTrack?.id === 'operations-systems') {
    return <OperationsSystemsTrack onBack={backToTracks} />;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          {/* Title Row */}
          <div className="flex items-center gap-2 mb-3">
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="p-2 rounded-xl bg-gradient-to-br from-[#00E0FF]/10 to-[#4B00FF]/10 border-2 border-[#00E0FF]">
                <GraduationCap className="w-5 h-5 md:w-7 md:h-7 text-[#4B00FF]" />
              </div>
            </motion.div>
            <div>
              <h1 className="text-xl md:text-4xl font-bold text-gray-900 dark:text-white">
                Cofounder University
              </h1>
              <p className="text-xs md:text-base text-gray-600 dark:text-gray-300 mt-0.5">
                Master the skills to build and grow your business
              </p>
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex flex-wrap gap-2 mt-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-1.5 bg-gradient-to-r from-[#00E0FF]/10 to-[#00E0FF]/5 border-2 border-[#00E0FF]/30 rounded-lg px-3 py-1.5"
            >
              <BookOpen className="w-4 h-4 text-[#00E0FF]" />
              <span className="text-sm font-semibold text-gray-900 dark:text-white">{tracks.length} Tracks</span>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-1.5 bg-gradient-to-r from-[#6CFF6C]/10 to-[#6CFF6C]/5 border-2 border-[#6CFF6C]/30 rounded-lg px-3 py-1.5"
            >
              <Sparkles className="w-4 h-4 text-[#6CFF6C]" />
              <span className="text-sm font-semibold text-gray-900 dark:text-white">Free Learning</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-1.5 bg-gradient-to-r from-[#FFCF00]/10 to-[#FFCF00]/5 border-2 border-[#FFCF00]/30 rounded-lg px-3 py-1.5"
            >
              <Zap className="w-4 h-4 text-[#FFCF00]" fill="#FFCF00" />
              <span className="text-sm font-semibold text-gray-900 dark:text-white">Earn XP</span>
            </motion.div>
          </div>
        </motion.div>

        {/* Search and Filter Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <Input
                type="text"
                placeholder="Search tracks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 text-sm border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:border-[#00E0FF] transition-colors dark:bg-gray-800 dark:text-white"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Button */}
            <motion.div whileHover="hover" whileTap="tap" variants={buttonVariants}>
              <Button
                variant={showFilters ? "default" : "outline"}
                onClick={() => setShowFilters(!showFilters)}
                className={`h-10 px-4 text-sm rounded-lg border-2 transition-all ${
                  showFilters 
                    ? 'bg-[#4B00FF] hover:bg-[#4B00FF]/90 text-white border-[#4B00FF]' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-[#4B00FF] dark:bg-gray-800 dark:text-white'
                }`}
              >
                <Filter className="w-4 h-4 mr-1.5" />
                Filters
                {categoryFilter !== 'all' && (
                  <Badge className="ml-1.5 bg-[#FF4F4F] text-white border-0 text-xs">1</Badge>
                )}
              </Button>
            </motion.div>
          </div>

          {/* Filter Pills */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 flex flex-wrap gap-1.5"
            >
              {categories.map((category) => (
                <motion.button
                  key={category}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCategoryFilter(category)}
                  className={`px-3 py-1.5 text-sm rounded-lg border-2 transition-all ${
                    categoryFilter === category
                      ? 'bg-[#4B00FF] text-white border-[#4B00FF]'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:border-[#4B00FF]'
                  }`}
                >
                  {category === 'all' ? 'All Categories' : category}
                </motion.button>
              ))}
            </motion.div>
          )}
        </motion.div>

        {/* Tracks Grid */}
        {filteredTracks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 md:py-20"
          >
            <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
              <Search className="w-6 h-6 md:w-8 md:h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">No tracks found matching your search</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('all');
              }}
              className="mt-3 border-2 border-gray-200 dark:border-gray-700 hover:border-[#00E0FF] dark:bg-gray-800 dark:text-white"
            >
              Clear Filters
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredTracks.map((track, index) => {
              const Icon = iconComponents[track.icon] || BookOpen;
              const categoryColor = categoryColors[track.category as keyof typeof categoryColors] || '#00E0FF';
              const difficultyStyle = difficultyColors[track.difficulty as keyof typeof difficultyColors];

              return (
                <motion.div
                  key={track.id}
                  custom={index}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover="hover"
                >
                  <Card 
                    className="h-full rounded-xl md:rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-[#00E0FF] cursor-pointer transition-all overflow-hidden group relative dark:bg-gray-800"
                    onClick={() => handleTrackClick(track)}
                  >
                    {/* Completion checkmark badge */}
                    {trackProgress[track.id]?.allCompleted && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-2 right-2 md:top-4 md:right-4 z-10 bg-[#6CFF6C] rounded-full p-1.5 md:p-2 shadow-lg border-2 border-white"
                      >
                        <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-white" fill="white" />
                      </motion.div>
                    )}

                    {/* Quiz badge */}
                    {trackProgress[track.id]?.badge && (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className="absolute top-10 right-2 md:top-16 md:right-4 z-10 bg-[#FFCF00] rounded-full p-1.5 md:p-2 shadow-lg border-2 border-white"
                      >
                        <Award className="w-4 h-4 md:w-5 md:h-5 text-white" fill="white" />
                      </motion.div>
                    )}

                    {/* Color accent bar */}
                    <div 
                      className="h-1.5 md:h-2 w-full"
                      style={{ backgroundColor: categoryColor }}
                    />

                    <CardHeader className="pb-2 md:pb-3 p-3 md:p-6">
                      <div className="flex items-start justify-between mb-2 md:mb-3">
                        <div 
                          className="p-2 md:p-3 rounded-lg md:rounded-xl"
                          style={{ backgroundColor: `${categoryColor}20` }}
                        >
                          <Icon 
                            className="w-4 h-4 md:w-6 md:h-6" 
                            style={{ color: categoryColor }}
                          />
                        </div>
                        
                        <Badge 
                          className="border-2 text-xs"
                          style={{
                            backgroundColor: difficultyStyle.bg,
                            borderColor: difficultyStyle.bg,
                            color: difficultyStyle.text === 'text-white' ? 'white' : 'black'
                          }}
                        >
                          {track.difficulty}
                        </Badge>
                      </div>

                      <CardTitle className="text-base md:text-xl group-hover:text-[#4B00FF] transition-colors dark:text-white">
                        {track.title}
                      </CardTitle>
                      <CardDescription className="text-xs md:text-sm leading-relaxed line-clamp-2 mt-1 md:mt-2 dark:text-gray-300">
                        {track.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="pt-0 p-3 md:p-6">
                      <div className="space-y-2 md:space-y-3">
                        {/* Stats */}
                        <div className="flex items-center gap-3 md:gap-4 text-xs md:text-sm text-gray-600 dark:text-gray-300">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 md:w-4 md:h-4" />
                            <span>{track.estimatedHours}h</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <BookOpen className="w-3 h-3 md:w-4 md:h-4" />
                            <span>{track.tutorialCount} tutorials</span>
                          </div>
                        </div>

                        {/* Category Badge */}
                        <Badge 
                          variant="outline" 
                          className="border-2 text-xs"
                          style={{ 
                            borderColor: categoryColor,
                            color: categoryColor
                          }}
                        >
                          {track.category}
                        </Badge>

                        {/* Start Button */}
                        <motion.div 
                          whileHover="hover" 
                          whileTap="tap" 
                          variants={buttonVariants}
                          className="pt-1 md:pt-2"
                        >
                          <Button 
                            className="w-full bg-[#00E0FF] hover:bg-[#00E0FF]/90 text-white rounded-lg md:rounded-xl h-9 md:h-11 text-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTrackClick(track);
                            }}
                          >
                            Start Learning
                            <ChevronRight className="w-4 h-4 md:w-5 md:h-5 ml-1.5 md:ml-2" />
                          </Button>
                        </motion.div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Coming Soon Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="mt-12"
        >
          <Card className="rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-[#FFCF00]/20 to-[#FF4F4F]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-[#FFCF00]" />
              </div>
              <h3 className="text-xl mb-2 dark:text-white">More Tracks Coming Soon!</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                We're constantly adding new learning paths to help you master every aspect of your business
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {['Marketing Mastery', 'Financial Planning', 'Team Building', 'Sales Strategy'].map((upcoming) => (
                  <Badge 
                    key={upcoming}
                    variant="outline" 
                    className="border-2 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300"
                  >
                    {upcoming}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}