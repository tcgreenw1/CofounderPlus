import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from './ThemeProvider';
import { MotivationButton } from './MotivationButton';
import { 
  Users, Calendar, Sparkles, ArrowLeft, Rocket, 
  Star, Heart, MessageSquare, Trophy
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface CommunityHubProps {
  user: any;
  onBack: () => void;
}

function CommunityHub({ user, onBack }: CommunityHubProps) {
  const navigate = useNavigate();
  const { theme } = useTheme();

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-sky-50/30 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-950 starry-background">
      {/* Gentle meteors for community hub */}
      <div className="shooting-star" style={{ animationDelay: '42s', animationDuration: '5.4s', top: '22%' }}></div>
      <div className="shooting-star" style={{ animationDelay: '78s', animationDuration: '4.9s', top: '72%' }}></div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Back Button */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </div>

        {/* Coming Soon Hero */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="mb-6 flex justify-center">
            <motion.div
              animate={{ 
                rotate: [0, 5, -5, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity, 
                ease: "easeInOut"
              }}
              className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl"
            >
              <Users className="w-12 h-12 text-white" />
            </motion.div>
          </div>
          
          <Badge className="mb-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 px-4 py-1">
            <Rocket className="w-3 h-3 mr-1" />
            Coming in 2026
          </Badge>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Community Hub
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Connect with fellow entrepreneurs, share experiences, and grow together in our exclusive community launching next year.
          </p>
        </motion.div>

        {/* Feature Preview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Card className="glass-morphism border-blue-200/50 dark:border-blue-800/50 h-full">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle className="text-lg">Entrepreneur Discussions</CardTitle>
                </div>
                <CardDescription>
                  Join conversations with like-minded founders, share challenges, and get advice from experienced entrepreneurs.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    Industry-specific discussion groups
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    Weekly founder meetups
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    Expert AMA sessions
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Card className="glass-morphism border-green-200/50 dark:border-green-800/50 h-full">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <CardTitle className="text-lg">Success Stories</CardTitle>
                </div>
                <CardDescription>
                  Get inspired by real founder journeys and celebrate milestones with the community.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    Milestone celebrations
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    Case study library
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    Founder spotlights
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <Card className="glass-morphism border-purple-200/50 dark:border-purple-800/50 h-full">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <CardTitle className="text-lg">Co-founder Matching</CardTitle>
                </div>
                <CardDescription>
                  Find the perfect co-founder or team members through our intelligent matching system.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    Skill-based matching
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    Verified profiles
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    Virtual coffee chats
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <Card className="glass-morphism border-orange-200/50 dark:border-orange-800/50 h-full">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <CardTitle className="text-lg">Events & Workshops</CardTitle>
                </div>
                <CardDescription>
                  Participate in exclusive events, workshops, and networking opportunities.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    Monthly workshops
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    Networking events
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    Investor pitch sessions
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-center"
        >
          <Card className="glass-morphism border-gradient-to-r from-blue-500/20 to-purple-500/20">
            <CardContent className="p-8">
              <div className="flex justify-center mb-4">
                <motion.div
                  animate={{ 
                    rotate: [0, 360],
                  }}
                  transition={{ 
                    duration: 20, 
                    repeat: Infinity, 
                    ease: "linear"
                  }}
                >
                  <Sparkles className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </motion.div>
              </div>
              
              <h3 className="text-2xl font-bold mb-3">Stay Focused on Your Journey</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                While we build the community features, keep making progress on your roadmap and operations. Great things are coming!
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button 
                  onClick={() => navigate('/roadmap')}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
                >
                  Continue Your Roadmap
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => navigate('/operations')}
                  className="border-blue-200 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-900/20"
                >
                  Explore Operations
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Motivation Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mt-8 flex justify-center"
        >
          <MotivationButton 
            variant="full" 
            className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border border-purple-200/50 dark:border-purple-700/50" 
          />
        </motion.div>
      </div>
    </div>
  );
}

export default CommunityHub;