import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Target, Zap, Users, CheckCircle, Sparkles, Award, Rocket } from 'lucide-react';
import { motion } from 'motion/react';
import { Logo } from './Logo';
import { useTheme } from './ThemeProvider';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface AboutUsProps {
  user?: any;
}

export function AboutUs({ user }: AboutUsProps) {
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

  const beliefs = [
    {
      title: 'Everyone deserves a shot at building something real.',
      description: 'Whether you\'re 19, 29, or 49, business shouldn\'t require an MBA, $10K consultants, or 12 different apps.',
      icon: Users
    },
    {
      title: 'Structure beats chaos.',
      description: 'Entrepreneurs don\'t need more inspiration — they need a roadmap. A path. Steps.',
      icon: Target
    },
    {
      title: 'Accountability is everything.',
      description: 'Motivation fades. Systems don\'t. Streaks, XP, and progress tracking create momentum.',
      icon: CheckCircle
    },
    {
      title: 'AI can finally replace the feeling of "I\'m doing this alone."',
      description: 'Not generic AI. An assistant that knows your business, your numbers, your roadmap, your goals.',
      icon: Sparkles
    },
    {
      title: 'Simplicity scales.',
      description: 'Everything inside Cofounder+ is built to help you go from idea → revenue → growth without drowning in complexity.',
      icon: Zap
    }
  ];

  const differentiators = [
    { icon: Target, text: 'Unified Ops Hub (Everything in One Brain) — Finance, HR, Sales, Marketing, Product, Notes, University, Dream Board… all synced under one operating model. No more Frankenstack of 8+ tools.' },
    { icon: Sparkles, text: 'AI That Actually Builds the Business — Not just chat. Cofounder AGI reads/writes every table: product, budget, HR, CRM, campaigns, roadmaps. It acts as your operator, not your advisor.' },
    { icon: Award, text: 'Infinite Personalized Roadmaps - Step-by-step, founder-agnostic launch systems that adapt to user progress and require evidence of completion, not just checkboxes.' },
    { icon: Zap, text: 'API Integrations - Connect and operate your entire business all in one place.' },
    { icon: Users, text: 'Multi-Business Management Out of the Box — Switch ventures instantly. Cofounder is built for serial founders, small teams, and multi-brand operators.' }
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
            <Heart className="w-8 h-8 text-primary" />
          </div>

          <h1 className="mb-4">About Cofounder+</h1>

          <p className="text-muted-foreground max-w-3xl mx-auto mb-3">
            Cofounder+ was built by one entrepreneur who was tired of building businesses the hard way.
          </p>
          <p className="text-muted-foreground max-w-3xl mx-auto">
            No team of 40. No venture capital. No "cofounder with 15 years of experience at Google." Just one person obsessed with creating the tool he wished he had years ago.
          </p>
        </motion.div>

        {/* Founder Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-16"
        >
          <Card className="border-border overflow-hidden">
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row items-center gap-8 p-8">
                <div className="flex-shrink-0">
                  <div className="rounded-2xl overflow-hidden w-64 h-64 md:w-72 md:h-72 border-2 border-border">
                    <ImageWithFallback
                      src="figma:asset/02a3c85c5465daf4c4a11f70c45d5603a94ca01d.png"
                      alt="Tyler Greenwood, Founder & CEO"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h2 className="mb-2">Tyler Greenwood</h2>
                  <p className="text-muted-foreground mb-4">Founder & CEO, Age 23</p>
                  <p className="text-foreground mb-3">
                    An entrepreneur obsessed with automation, business systems, AI, and helping millions of people build real income and independence.
                  </p>
                  <p className="text-muted-foreground">
                    No PR team. No inflated founder story. Just someone building the tool he needed most — and giving it to everyone else who's tired of guessing.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Mission Statement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-16"
        >
          <Card className="border-border bg-accent/50">
            <CardContent className="p-8 text-center">
              <h3 className="mb-4">Why Cofounder+ Exists</h3>
              <p className="text-foreground max-w-3xl mx-auto mb-4">
                Cofounder+ exists because building a business alone is overwhelming, confusing, and — let's be honest — lonely as hell. You're expected to learn finance, marketing, operations, sales, taxes, HR, legal, and strategy while somehow keeping the energy to stay motivated, consistent, and sane.
              </p>
              <p className="text-foreground max-w-3xl mx-auto">
                <strong>Most founders don't fail because the idea was bad. They fail because the path was unclear.</strong>
              </p>
              <p className="text-foreground max-w-3xl mx-auto mt-4">
                Cofounder+ fixes that.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* What We Believe */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-16"
        >
          <h2 className="mb-8 text-center">What We Believe</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {beliefs.map((belief, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
              >
                <Card className="h-full border-border hover:border-primary/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-primary text-primary-foreground flex-shrink-0">
                        <belief.icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h4 className="mb-2">{belief.title}</h4>
                        <p className="text-muted-foreground">{belief.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* How It Started */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mb-16"
        >
          <Card className="border-border">
            <CardContent className="p-8">
              <h3 className="mb-4">How Cofounder+ Started</h3>
              <p className="text-foreground mb-4">
                Cofounder+ began as a personal frustration: "Why isn't there one platform that shows me exactly what to do next, teaches me what I don't know, and helps me actually run the business?"
              </p>
              <p className="text-foreground mb-4">
                After building and failing and rebuilding across multiple industries — hardware, B2B, reselling, SaaS — it became obvious: entrepreneurs don't need another tool. They need one tool that brings all the pieces together.
              </p>
              <p className="text-foreground">
                Finance, sales, marketing, team, learning, AI, and the actual step-by-step path.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* What Makes Us Different */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mb-16"
        >
          <Card className="border-border bg-secondary/30">
            <CardContent className="p-8">
              <h3 className="mb-6">What Makes Cofounder+ Different</h3>
              <div className="space-y-4">
                {differentiators.map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary text-primary-foreground flex-shrink-0 mt-0.5">
                      <item.icon className="w-4 h-4" />
                    </div>
                    <p className="text-foreground">{item.text}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Who It's For */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mb-16"
        >
          <Card className="border-border">
            <CardContent className="p-8">
              <h3 className="mb-4">Who Cofounder+ Is For</h3>
              <p className="text-foreground mb-4">
                Cofounder+ is for the entrepreneur who:
              </p>
              <ul className="space-y-3 mb-6">
                {[
                  'has ambition but needs clarity',
                  'has ideas but needs structure',
                  'wants to move fast but stay organized',
                  'can\'t afford 10 tools or 3 consultants',
                  'is sick of doing everything alone'
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-2" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-foreground">
                Whether you're validating your first idea or managing a small team, Cofounder+ gives you a path to follow, the tools to execute, and the AI assistant to guide you.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Mission */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mb-16"
        >
          <Card className="border-border bg-accent/50">
            <CardContent className="p-8 text-center">
              <h3 className="mb-4">Our Mission</h3>
              <p className="text-foreground max-w-3xl mx-auto">
                To give every entrepreneur the clarity, structure, and tools they need to build a business they're proud of — faster, cheaper, and with less chaos.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Final Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="text-center"
        >
          <h2 className="mb-6">
            If You're Building Something… You're Not Alone Anymore.
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Cofounder+ gives you the roadmap, the tools, the AI, the accountability, and the momentum. You bring the ambition. We handle the complexity.
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

export default AboutUs;