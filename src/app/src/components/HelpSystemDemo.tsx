import React, { useState } from 'react';
import { motion } from 'motion/react';
import { HelpCircle, Heart, Users, Lightbulb, Star } from 'lucide-react';
import HelpSystem from './HelpSystem';
import SupportButton from './SupportButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

function HelpSystemDemo() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-200 mb-4">
            Cofounder Help System Demo
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            Click on any help button below to see the contextual guidance system in action!
          </p>
        </motion.div>

        {/* Help System Examples */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* Dashboard Help */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-lg border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-blue-600" />
                    Dashboard Help
                  </span>
                  <HelpSystem section="dashboard" />
                </CardTitle>
                <CardDescription>
                  Get guidance on using your business dashboard effectively
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Learn how to focus on your current phase, celebrate small wins, and manage your business progress without feeling overwhelmed.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Product Help */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-lg border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-green-600" />
                    Product Help
                  </span>
                  <HelpSystem section="product" />
                </CardTitle>
                <CardDescription>
                  Product management guidance for entrepreneurs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Start with your core product, track what matters, and iterate based on customer feedback.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Marketing Help */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-lg border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-600" />
                    Marketing Help
                  </span>
                  <HelpSystem section="marketing" />
                </CardTitle>
                <CardDescription>
                  Marketing strategies that don't overwhelm
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Find your people, be authentic, and start small with 1-2 marketing channels.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Finance Help */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-lg border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-600" />
                    Finance Help
                  </span>
                  <HelpSystem section="finance" />
                </CardTitle>
                <CardDescription>
                  Business finance management made simple
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Track everything, separate business from personal finances, and plan for taxes.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* HR Help */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-lg border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-600" />
                    HR Help
                  </span>
                  <HelpSystem section="hr" />
                </CardTitle>
                <CardDescription>
                  Human resources for small business owners
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Take care of yourself first, hire when ready, and document everything properly.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Community Help */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-lg border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-pink-600" />
                    Community Help
                  </span>
                  <HelpSystem section="community" />
                </CardTitle>
                <CardDescription>
                  Connect with fellow entrepreneurs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Don't hesitate to ask questions, share wins, and offer help to others in the community.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Special Support Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mb-12"
        >
          <Card className="bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 border-pink-200 dark:border-pink-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-pink-800 dark:text-pink-200">
                <Heart className="w-6 h-6" />
                Need Emotional Support?
              </CardTitle>
              <CardDescription className="text-pink-700 dark:text-pink-300">
                Building a business can be overwhelming. We're here to help when you need encouragement, motivation, or professional support.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <p className="text-pink-700 dark:text-pink-300 flex-1">
                  Click the support button to access immediate coping strategies, inspirational content, and professional resources including crisis support.
                </p>
                <div className="flex-shrink-0">
                  <SupportButton />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Feature Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-lg border-gray-200/50 dark:border-gray-700/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-center">Help System Features</CardTitle>
              <CardDescription className="text-center">
                Comprehensive support throughout your entrepreneurial journey
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                    <HelpCircle className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-semibold mb-2">Contextual Help</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Get specific guidance for each section of your business operations
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="p-3 bg-pink-100 dark:bg-pink-900/30 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                    <Heart className="w-8 h-8 text-pink-600 dark:text-pink-400" />
                  </div>
                  <h3 className="font-semibold mb-2">Emotional Support</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Access coping strategies, inspiration, and professional resources when needed
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                    <Lightbulb className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="font-semibold mb-2">Practical Tips</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Actionable advice to help you progress without feeling overwhelmed
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

export default HelpSystemDemo;