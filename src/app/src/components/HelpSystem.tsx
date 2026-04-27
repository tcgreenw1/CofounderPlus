import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  HelpCircle, X, BookOpen, Lightbulb, Target, Users, 
  Heart, Brain, Shield, Star, ArrowRight, CheckCircle,
  MessageSquare, Phone, Mail, ExternalLink
} from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

interface HelpSystemProps {
  section: string;
  trigger?: React.ReactNode;
}

interface HelpContent {
  title: string;
  description: string;
  tips: {
    icon: React.ReactNode;
    title: string;
    description: string;
  }[];
  quickActions?: {
    title: string;
    description: string;
    action: string;
  }[];
}

const helpContent: Record<string, HelpContent> = {
  dashboard: {
    title: "Dashboard Overview",
    description: "Your dashboard is your mission control center. Here you can see your business progress, upcoming tasks, and key metrics at a glance.",
    tips: [
      {
        icon: <Target className="w-5 h-5" />,
        title: "Focus on Your Current Phase",
        description: "Don't feel overwhelmed by everything. Just focus on completing tasks in your current phase - one step at a time."
      },
      {
        icon: <CheckCircle className="w-5 h-5" />,
        title: "Celebrate Small Wins",
        description: "Every completed task is progress! Click the checkmark to mark tasks as complete and watch your business grow."
      },
      {
        icon: <Heart className="w-5 h-5" />,
        title: "Take Breaks When Needed",
        description: "Building a business is a marathon, not a sprint. It's okay to take breaks and come back refreshed."
      }
    ],
    quickActions: [
      {
        title: "Complete Your Next Task",
        description: "Take the next small step in your business journey",
        action: "View Current Tasks"
      },
      {
        title: "Check Your Progress",
        description: "See how far you've come and what's next",
        action: "View Roadmap"
      }
    ]
  },
  
  operations: {
    title: "Business OS",
    description: "This is where you manage the day-to-day operations of your business. Don't worry about getting everything perfect - start with what you need most.",
    tips: [
      {
        icon: <Lightbulb className="w-5 h-5" />,
        title: "Start with One Area",
        description: "You don't need to manage everything at once. Pick the area that's most important for your business right now."
      },
      {
        icon: <BookOpen className="w-5 h-5" />,
        title: "Learn as You Go",
        description: "It's normal not to know everything. Each section has guides and tips to help you learn as you build."
      },
      {
        icon: <Users className="w-5 h-5" />,
        title: "You're Not Alone",
        description: "Remember, every successful business owner started exactly where you are now. You've got this!"
      }
    ]
  },

  product: {
    title: "Product Operations Help",
    description: "Managing your products doesn't have to be complicated. Start simple and grow your product management skills over time.",
    tips: [
      {
        icon: <Target className="w-5 h-5" />,
        title: "Start with Your Core Product",
        description: "Focus on one main product or service first. You can always add more later as you grow."
      },
      {
        icon: <BookOpen className="w-5 h-5" />,
        title: "Track What Matters",
        description: "Don't get lost in metrics. Focus on sales, customer feedback, and whether people want what you're offering."
      },
      {
        icon: <Lightbulb className="w-5 h-5" />,
        title: "Iterate and Improve",
        description: "Your first version doesn't need to be perfect. Launch, learn from customers, and improve continuously."
      }
    ]
  },

  marketing: {
    title: "Marketing Operations Help",
    description: "Marketing might feel overwhelming, but remember - you just need to find your people and tell them how you can help them.",
    tips: [
      {
        icon: <Users className="w-5 h-5" />,
        title: "Know Your Customer",
        description: "Focus on understanding who needs your product and where they spend their time online and offline."
      },
      {
        icon: <Heart className="w-5 h-5" />,
        title: "Be Authentic",
        description: "Share your story and passion. People connect with authenticity more than perfect marketing copy."
      },
      {
        icon: <Target className="w-5 h-5" />,
        title: "Start Small",
        description: "Pick 1-2 marketing channels to focus on initially. Master those before expanding to others."
      }
    ]
  },

  finance: {
    title: "Finance Operations Help",
    description: "Managing business finances can feel intimidating, but with the right tracking and habits, you'll gain confidence and control.",
    tips: [
      {
        icon: <BookOpen className="w-5 h-5" />,
        title: "Track Everything",
        description: "Record every business income and expense. This habit will save you time and stress later, especially at tax time."
      },
      {
        icon: <Target className="w-5 h-5" />,
        title: "Separate Business & Personal",
        description: "Keep business finances separate from personal. Open a business bank account if you haven't already."
      },
      {
        icon: <Shield className="w-5 h-5" />,
        title: "Plan for Taxes",
        description: "Set aside 25-30% of profits for taxes. Your future self will thank you when tax season arrives."
      }
    ]
  },

  hr: {
    title: "Human Resources Help",
    description: "Whether you're managing just yourself or a growing team, good HR practices create a foundation for sustainable growth.",
    tips: [
      {
        icon: <Heart className="w-5 h-5" />,
        title: "Take Care of Yourself First",
        description: "As a business owner, your wellness directly impacts your business. Set boundaries and prioritize your health."
      },
      {
        icon: <Users className="w-5 h-5" />,
        title: "Hire When Ready",
        description: "Don't rush to hire. When you do, focus on finding people who share your values and work ethic."
      },
      {
        icon: <Shield className="w-5 h-5" />,
        title: "Document Everything",
        description: "Keep good records of employment decisions, policies, and communications. It protects both you and your team."
      }
    ]
  },

  community: {
    title: "Community Hub Help",
    description: "Connect with other entrepreneurs who understand your journey. This community is here to support, encourage, and celebrate with you.",
    tips: [
      {
        icon: <Users className="w-5 h-5" />,
        title: "Don't Hesitate to Ask",
        description: "Everyone here started somewhere. Ask questions, share challenges, and learn from others' experiences."
      },
      {
        icon: <Heart className="w-5 h-5" />,
        title: "Share Your Wins",
        description: "Celebrate your progress, no matter how small. Your success inspires others and builds community spirit."
      },
      {
        icon: <Lightbulb className="w-5 h-5" />,
        title: "Offer Help When You Can",
        description: "Supporting others often helps clarify your own thinking and builds valuable relationships."
      }
    ]
  }
};

function HelpSystem({ section, trigger }: HelpSystemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const content = helpContent[section] || helpContent.dashboard;

  return (
    <>
      <div onClick={() => setIsOpen(true)} className="cursor-pointer">
        {trigger || (
          <Button
            variant="outline"
            size="sm"
            className="bg-white/20 dark:bg-gray-800/20 backdrop-blur-lg border-white/30 dark:border-gray-700/30 hover:bg-white/30 dark:hover:bg-gray-700/30 transition-all duration-300"
          >
            <HelpCircle className="w-4 h-4" />
          </Button>
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50 shadow-xl max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-blue-600" />
              {content.title}
            </DialogTitle>
            <DialogDescription className="text-base">
              {content.description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Tips Section */}
            <div>
              <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-600" />
                Helpful Tips
              </h4>
              <div className="space-y-3">
                {content.tips.map((tip, index) => (
                  <Card key={index} className="bg-white/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                          {tip.icon}
                        </div>
                        <div className="flex-1">
                          <h5 className="font-semibold mb-1">{tip.title}</h5>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{tip.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            {content.quickActions && (
              <div>
                <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-600" />
                  Quick Actions
                </h4>
                <div className="space-y-2">
                  {content.quickActions.map((action, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div>
                        <p className="font-medium">{action.title}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{action.description}</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-green-600" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Encouragement */}
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600 rounded-full">
                    <Star className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-blue-800 dark:text-blue-200">You're doing great!</p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Remember, every successful entrepreneur started exactly where you are now. Take it one step at a time.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={() => setIsOpen(false)} className="bg-blue-600 hover:bg-blue-700">
                Got it, thanks!
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default HelpSystem;