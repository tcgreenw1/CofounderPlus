import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Heart, MessageSquare, Phone, Mail, ExternalLink, Users,
  Brain, Shield, Star, Lightbulb, Target, BookOpen,
  Coffee, Sunrise, Moon, Activity
} from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

function SupportButton() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const encouragementMessages = [
    "Every expert was once a beginner. You're exactly where you need to be.",
    "Building a business is brave. You're braver than you think.",
    "Progress, not perfection. Every small step counts.",
    "You don't have to see the whole staircase, just take the first step.",
    "Your business idea matters. The world needs what you have to offer.",
    "Feeling anxious is normal. It means you're pushing your boundaries.",
    "You're not behind. You're not ahead. You're exactly on time.",
    "The courage to begin separates dreamers from achievers. You've already started."
  ];

  const [currentMessage] = useState(() => 
    encouragementMessages[Math.floor(Math.random() * encouragementMessages.length)]
  );

  const copingStrategies = [
    {
      icon: <Brain className="w-5 h-5" />,
      title: "Take a Deep Breath",
      description: "Use the 4-7-8 breathing technique: Inhale for 4, hold for 7, exhale for 8. Repeat 3 times.",
      category: "immediate"
    },
    {
      icon: <Coffee className="w-5 h-5" />,
      title: "Take a Break",
      description: "Step away for 10-15 minutes. Get some water, stretch, or step outside for fresh air.",
      category: "immediate"
    },
    {
      icon: <Target className="w-5 h-5" />,
      title: "Focus on One Thing",
      description: "Choose just one small task to complete today. Progress is progress, no matter how small.",
      category: "immediate"
    },
    {
      icon: <Users className="w-5 h-5" />,
      title: "Connect with Others",
      description: "Reach out to the community, a friend, or family member. You don't have to do this alone.",
      category: "connect"
    },
    {
      icon: <BookOpen className="w-5 h-5" />,
      title: "Read Success Stories",
      description: "Remember that every successful entrepreneur has felt exactly like you do right now.",
      category: "inspire"
    },
    {
      icon: <Star className="w-5 h-5" />,
      title: "Celebrate Small Wins",
      description: "Write down 3 things you've accomplished this week, no matter how small they seem.",
      category: "inspire"
    }
  ];

  const resources = [
    {
      title: "SAMHSA National Helpline",
      description: "Mental health and substance abuse support",
      contact: "1-800-662-4357",
      type: "mental-health"
    },
    {
      title: "SCORE Mentors",
      description: "Free business mentoring and support",
      contact: "score.org",
      type: "business"
    },
    {
      title: "Small Business Administration",
      description: "Resources and support for entrepreneurs",
      contact: "sba.gov",
      type: "business"
    }
  ];

  return (
    <>
      <motion.button
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        onClick={() => setIsOpen(true)}
        className="w-full p-4 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3 group"
      >
        <Brain className="w-5 h-5 group-hover:scale-110 transition-transform" />
        <span className="font-medium">Feeling Anxious?</span>
      </motion.button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50 shadow-xl max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Brain className="w-6 h-6 text-blue-600" />
              We're Here to Help You Through This
            </DialogTitle>
            <DialogDescription className="text-base">
              Feeling anxious while building your business is completely normal. Many successful entrepreneurs have been exactly where you are right now.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Encouragement Message */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-600 rounded-full">
                    <Star className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">A Gentle Reminder</h3>
                    <p className="text-blue-700 dark:text-blue-300 text-lg leading-relaxed">
                      "{currentMessage}"
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="immediate" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-gray-100 dark:bg-gray-800">
                <TabsTrigger value="immediate">Right Now</TabsTrigger>
                <TabsTrigger value="connect">Connect</TabsTrigger>
                <TabsTrigger value="inspire">Inspire</TabsTrigger>
                <TabsTrigger value="resources">Resources</TabsTrigger>
              </TabsList>

              <TabsContent value="immediate" className="space-y-4">
                <div>
                  <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Sunrise className="w-5 h-5 text-orange-600" />
                    If You're Feeling Anxious Right Now
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    {copingStrategies
                      .filter(strategy => strategy.category === 'immediate')
                      .map((strategy, index) => (
                      <Card key={index} className="bg-white/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50 hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400">
                              {strategy.icon}
                            </div>
                            <div className="flex-1">
                              <h5 className="font-semibold mb-2">{strategy.title}</h5>
                              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                {strategy.description}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="connect" className="space-y-4">
                <div>
                  <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    You're Not Alone
                  </h4>
                  <div className="space-y-4">
                    {copingStrategies
                      .filter(strategy => strategy.category === 'connect')
                      .map((strategy, index) => (
                      <Card key={index} className="bg-white/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                              {strategy.icon}
                            </div>
                            <div className="flex-1">
                              <h5 className="font-semibold mb-2">{strategy.title}</h5>
                              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                {strategy.description}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <MessageSquare className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="font-medium text-blue-800 dark:text-blue-200">Join Our Community</p>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                              Connect with other entrepreneurs who understand exactly what you're going through.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="inspire" className="space-y-4">
                <div>
                  <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-purple-600" />
                    Remember Your Why
                  </h4>
                  <div className="space-y-4">
                    {copingStrategies
                      .filter(strategy => strategy.category === 'inspire')
                      .map((strategy, index) => (
                      <Card key={index} className="bg-white/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                              {strategy.icon}
                            </div>
                            <div className="flex-1">
                              <h5 className="font-semibold mb-2">{strategy.title}</h5>
                              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                {strategy.description}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
                      <CardContent className="p-6">
                        <h5 className="font-semibold text-purple-800 dark:text-purple-200 mb-3">Famous Entrepreneurs Who Faced Anxiety</h5>
                        <div className="space-y-2 text-sm text-purple-700 dark:text-purple-300">
                          <p>• <strong>Elon Musk</strong> has spoken openly about his struggles with stress and anxiety while building Tesla and SpaceX.</p>
                          <p>• <strong>Arianna Huffington</strong> experienced burnout and had to completely change her approach to work-life balance.</p>
                          <p>• <strong>Richard Branson</strong> has dyslexia and struggled with traditional business approaches, finding his own unique path.</p>
                        </div>
                        <p className="text-purple-800 dark:text-purple-200 font-medium mt-4">
                          Your anxiety doesn't disqualify you - it's part of the journey that makes you stronger and more empathetic.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="resources" className="space-y-4">
                <div>
                  <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-green-600" />
                    Professional Support Resources
                  </h4>
                  

                  {/* Mental Health Resources */}
                  <div className="mb-6">
                    <h5 className="font-semibold text-blue-700 dark:text-blue-300 mb-3 flex items-center gap-2">
                      <Brain className="w-4 h-4" />
                      Mental Health Support
                    </h5>
                    <div className="space-y-3">
                      {resources
                        .filter(resource => resource.type === 'mental-health')
                        .map((resource, index) => (
                        <Card key={index} className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-blue-800 dark:text-blue-200">{resource.title}</p>
                                <p className="text-sm text-blue-700 dark:text-blue-300">{resource.description}</p>
                              </div>
                              <Badge className="bg-blue-600 text-white">
                                {resource.contact}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Business Support */}
                  <div>
                    <h5 className="font-semibold text-green-700 dark:text-green-300 mb-3 flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Business Support & Mentoring
                    </h5>
                    <div className="space-y-3">
                      {resources
                        .filter(resource => resource.type === 'business')
                        .map((resource, index) => (
                        <Card key={index} className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-green-800 dark:text-green-200">{resource.title}</p>
                                <p className="text-sm text-green-700 dark:text-green-300">{resource.description}</p>
                              </div>
                              <Badge className="bg-green-600 text-white flex items-center gap-1">
                                {resource.contact}
                                <ExternalLink className="w-3 h-3" />
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
              <Button 
                onClick={() => setIsOpen(false)} 
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
              >
                <Brain className="w-4 h-4 mr-2" />
                Thank you, I feel calmer
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsOpen(false);
                  navigate('/community');
                }}
                className="flex-1"
              >
                <Users className="w-4 h-4 mr-2" />
                Talk to the Community
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default SupportButton;