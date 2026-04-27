import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Target, Building2, Lightbulb, CheckCircle, Zap, Award } from 'lucide-react';
import { motion } from 'motion/react';
import { Logo } from './Logo';
import { useTheme } from './ThemeProvider';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

interface SupportedBusinessesProps {
  user?: any;
}

export function SupportedBusinesses({ user }: SupportedBusinessesProps) {
  const navigate = useNavigate();
  const { theme } = useTheme();

  const handleBackToHome = () => {
    navigate('/');
  };

  const handleLogin = () => {
    navigate('/auth?mode=login', { state: { mode: 'login' } });
  };

  const handleSignUp = () => {
    navigate('/auth?mode=signup', { state: { mode: 'signup' } });
  };

  const features = [
    {
      icon: Sparkles,
      title: 'AI-Powered Personalization',
      description: 'Our AI adapts to every single type of business, creating a personalized roadmap tailored to your industry, goals, and unique challenges. Unlike generic self-help books or courses, we provide specific, actionable guidance that increases your chances of success.'
    },
    {
      icon: Award,
      title: 'Infinite Industries Supported',
      description: 'From e-commerce to consulting, restaurants to software companies, our AI generates custom roadmaps for any industry imaginable. Each roadmap is dynamically crafted with industry-specific milestones, challenges, and best practices.'
    }
  ];

  const benefits = [
    'Your choice, your way of working',
    'All operations in one place - Finance, HR, Marketing, Sales, Product',
    'Advanced AI available when you need it',
    'Manual management options for full control'
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header Navigation */}
      <nav className="sticky top-0 z-50 flex items-center justify-between p-4 sm:p-6 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="flex items-center space-x-2">
          <Logo size="md" showText={true} />
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          {!user && (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleLogin}
                className="bouncy-button px-3 py-2 sm:px-4 sm:py-2 rounded-xl liquid-glass-nav text-sm sm:text-base text-primary"
              >
                Login
              </button>
              <button
                onClick={handleSignUp}
                className="bouncy-button px-3 py-2 sm:px-6 sm:py-2 rounded-xl text-sm sm:text-base liquid-glass-btn-primary text-white"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          onClick={handleBackToHome}
          className="flex items-center gap-2 mb-8 text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Homepage</span>
        </motion.button>

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-accent mb-6">
            <Building2 className="w-8 h-8 text-primary" />
          </div>

          <h1 className="mb-4">Supporting Every Type of Business</h1>

          <p className="text-muted-foreground max-w-3xl mx-auto">
            At Cofounder, we understand that there's no one-size-fits-all approach to business success. 
            That's why we've built a platform that adapts to your unique business needs.
          </p>
        </motion.div>

        {/* Key Value Propositions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 + index * 0.1 }}
            >
              <Card className="h-full border-border hover:border-primary/50 transition-colors">
                <CardContent className="p-8">
                  <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary text-primary-foreground mb-6">
                    <feature.icon className="w-7 h-7" />
                  </div>
                  <h3 className="mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* AI is Completely Optional */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-16"
        >
          <Card className="border-border bg-accent/50">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-start gap-6">
                <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary text-primary-foreground flex-shrink-0">
                  <Lightbulb className="w-7 h-7" />
                </div>
                <div className="flex-1">
                  <h3 className="mb-3">AI is Completely Optional</h3>
                  <p className="text-foreground mb-4">
                    While our AI capabilities are powerful, we understand that some businesses prefer 
                    to manage operations manually. That's why AI is completely optional on our platform.
                  </p>
                  <p className="text-foreground mb-6">
                    You can choose to use our advanced all-in-one Business OS without any AI features. 
                    This makes Cofounder the only software where business owners and small teams can operate 
                    every department—Finance, HR, Marketing, Sales, and Product—all in one place, with or 
                    without AI assistance.
                  </p>
                  <div className="space-y-3">
                    {benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                        <span className="text-foreground">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Why We Made This Choice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-16"
        >
          <Card className="border-border">
            <CardContent className="p-8">
              <h3 className="mb-4">Why We Made This Choice</h3>
              <p className="text-foreground mb-4">
                We've seen too many entrepreneurs struggle with generic advice that doesn't apply to their 
                specific situation. Generic business books and courses might inspire you, but they rarely 
                provide the tactical, step-by-step guidance you need for <em>your</em> specific business 
                in <em>your</em> specific industry.
              </p>
              <p className="text-foreground mb-4">
                That's why we chose to invest in AI technology that can understand your unique context and 
                provide personalized guidance. But we also recognize that not everyone wants AI assistance, 
                which is why we've made it completely optional.
              </p>
              <p className="text-foreground">
                Our goal is simple: Give you the tools and guidance you need to succeed, in the way that 
                works best for you. Whether that's with AI-powered insights or manual operations management, 
                we're here to support your journey.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Industries Examples */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mb-16"
        >
          <Card className="border-border bg-secondary/30">
            <CardContent className="p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-2 rounded-lg bg-primary text-primary-foreground flex-shrink-0">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="mb-2">Built for Every Industry</h3>
                  <p className="text-muted-foreground">
                    Each roadmap includes industry-specific milestones, proven strategies, and common pitfalls to avoid
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {[
                  'E-commerce', 'SaaS', 'Consulting', 'Restaurant', 
                  'Retail', 'Agency', 'Manufacturing', 'Real Estate',
                  'Healthcare', 'Education', 'Fitness', 'Any Industry'
                ].map((industry, index) => (
                  <div 
                    key={index} 
                    className="px-4 py-2 rounded-lg bg-card border border-border text-center text-sm"
                  >
                    {industry}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center"
        >
          <p className="text-muted-foreground mb-6">
            Ready to experience a business platform built specifically for your needs?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleSignUp}
              size="lg"
              className="bouncy-button"
            >
              Get Started Free
            </Button>
            <Button
              onClick={handleBackToHome}
              variant="outline"
              size="lg"
              className="bouncy-button"
            >
              Back to Homepage
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8 px-4 sm:px-6 mt-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center space-x-2">
              <Logo size="sm" showText={true} />
            </div>
            
            <div className="flex flex-wrap justify-center gap-6">
              <button
                onClick={() => navigate('/privacy')}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Privacy Policy
              </button>
              <button
                onClick={() => navigate('/terms')}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Terms of Service
              </button>
            </div>

            <div className="text-sm text-muted-foreground">
              © 2024 Cofounder. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default SupportedBusinesses;
