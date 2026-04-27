import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from './ThemeProvider';
import { 
  Moon, Sun, Zap, Users, X, Send, Mail, MessageSquare, Phone,
  CheckCircle, ArrowRight, Trophy, Target, Rocket, 
  DollarSign, Sparkles, Timer, Star, Building, Gift, Crown, PlayCircle,
  TrendingUp, BarChart3, Lightbulb, Headphones, Clock, HelpCircle, Shield, GamepadIcon, Calendar, Video
} from 'lucide-react';
import { Logo } from './Logo';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { projectId } from '../utils/supabase/info';
import InteractiveAppDemo from './InteractiveAppDemo';

interface HomepageProps {
  user: any;
  authError?: string | null;
  supabaseAvailable?: boolean;
  customServerAvailable?: boolean;
}

function Homepage({ user, authError, supabaseAvailable = true, customServerAvailable = true }: HomepageProps) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [showSupportForm, setShowSupportForm] = useState(false);
  const [isAnnual, setIsAnnual] = useState(true); // Default to annual billing
  const [supportForm, setSupportForm] = useState({
    name: '',
    email: '',
    category: '',
    subject: '',
    message: '',
    urgency: 'medium',
    contactMethod: 'email'
  });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      // Route to signup form for new users
      handleSignUp();
    }
  };

  const handleLogin = () => {
    navigate('/auth?mode=login', { state: { mode: 'login' } });
  };

  const handleSignUp = () => {
    navigate('/auth?mode=signup', { state: { mode: 'signup' } });
  };

  // Show service unavailable message if Supabase is down
  if (!supabaseAvailable) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-sky-50/30 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-950 starry-background transition-all duration-300 relative overflow-hidden">
        {/* Single meteor for service unavailable page */}
        <div className="shooting-star" style={{ animationDelay: '3s', animationDuration: '5s', top: '40%' }}></div>
        
        {/* Mobile Navigation */}
        <nav className="relative z-10 flex items-center justify-between p-4 sm:p-6">
          <div className="flex items-center space-x-2">
            <Logo size="md" showText={true} />
          </div>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl glass-morphism border border-white/30 dark:border-gray-700/30 hover:bg-white/30 dark:hover:bg-gray-700/30 transition-all duration-300 text-gray-900 dark:text-gray-300"
          >
            {theme === 'light' ? <Moon className="w-4 h-4 sm:w-5 sm:h-5" /> : <Sun className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>
        </nav>

        {/* Service unavailable message */}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8">
              <HelpCircle className="w-8 h-8 sm:w-12 sm:h-12 text-white" />
            </div>
            
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Service Temporarily Unavailable
            </h1>
            
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-6 sm:mb-8">
              We're experiencing technical difficulties with our backend services. 
              Our team is working to restore full functionality as soon as possible.
            </p>

            <div className="glass-morphism rounded-2xl border border-white/20 dark:border-gray-700/20 p-4 sm:p-6 mb-6 sm:mb-8">
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                In the meantime, you can still explore our public features:
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <button
                  onClick={() => navigate('/questionnaire')}
                  className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-500/20 text-blue-800 dark:text-blue-300 rounded-xl hover:bg-blue-500/30 transition-all duration-300 text-sm sm:text-base font-medium"
                >
                  Try Questionnaire
                </button>
                <button
                  onClick={() => navigate('/help-demo')}
                  className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-500/20 text-blue-800 dark:bg-purple-500/20 dark:text-purple-300 rounded-xl hover:bg-blue-500/30 dark:hover:bg-purple-500/30 transition-all duration-300 text-sm sm:text-base font-medium"
                >
                  Help Demo
                </button>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Expected resolution time: We're working around the clock to fix this issue.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleSupportClick = () => {
    setShowSupportForm(true);
  };

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Map category to support type
      const categoryMap: { [key: string]: string } = {
        'getting-started': 'business-setup',
        'business-planning': 'business-setup',
        'technical-issues': 'technical-issue',
        'feature-request': 'feature-request',
        'billing': 'billing-question',
        'partnership': 'partnership-inquiry',
        'other': 'general-inquiry'
      };

      const supportType = categoryMap[supportForm.category] || 'general-inquiry';
      
      // Create full message with name and contact preference
      const fullMessage = `Name: ${supportForm.name}\nEmail: ${supportForm.email}\nPreferred Contact: ${supportForm.contactMethod}\n\n${supportForm.message}`;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/support/create`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subject: supportForm.subject,
            message: fullMessage,
            type: supportType,
            priority: supportForm.urgency,
            userEmail: supportForm.email,
            userId: user?.id || `anonymous_${Date.now()}`, // Use user ID if logged in, otherwise anonymous
            userName: supportForm.name,
            contactMethod: supportForm.contactMethod
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        console.log('Support ticket created:', data.ticketId);
        setFormSubmitted(true);
      } else {
        console.error('Failed to create support ticket:', data.error);
        // Still show success to user (failsafe UX)
        setFormSubmitted(true);
      }
    } catch (error) {
      console.error('Error submitting support form:', error);
      // Still show success to user (failsafe UX)
      setFormSubmitted(true);
    } finally {
      setSubmitting(false);
      
      // Reset form after showing success
      setTimeout(() => {
        setShowSupportForm(false);
        setFormSubmitted(false);
        setSupportForm({
          name: '',
          email: '',
          category: '',
          subject: '',
          message: '',
          urgency: 'medium',
          contactMethod: 'email'
        });
      }, 2000);
    }
  };

  const supportCategories = [
    { value: 'getting-started', label: 'Getting Started Help' },
    { value: 'business-planning', label: 'Business Planning Support' },
    { value: 'technical-issues', label: 'Technical Issues' },
    { value: 'feature-request', label: 'Feature Request' },
    { value: 'billing', label: 'Billing & Pricing' },
    { value: 'partnership', label: 'Partnership Opportunities' },
    { value: 'other', label: 'Other' }
  ];

  return (
    <div className="min-h-screen starry-background transition-all duration-300"
      style={{ 
        background: theme === 'dark' 
          ? 'linear-gradient(to bottom right, rgb(10, 15, 30), rgb(20, 30, 50), rgb(15, 20, 35))' 
          : '#FFFFFF'
      }}
    >
      {/* Natural meteor shower */}
      <div className="shooting-star" style={{ animationDelay: '8s', animationDuration: '5.2s', top: '15%' }}></div>
      <div className="shooting-star" style={{ animationDelay: '45s', animationDuration: '4.8s', top: '60%' }}></div>
      <div className="shooting-star" style={{ animationDelay: '82s', animationDuration: '6.1s', top: '80%' }}></div>

      {/* Navigation Bar - Enhanced for logged out users */}
      <nav className="relative z-10 flex items-center justify-between p-4 sm:p-6 pt-12 sm:pt-6">
        <div className="flex items-center space-x-2">
          <Logo size="md" showText={true} />
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Supported Businesses button - always visible */}
          <button
            onClick={() => navigate('/supported-businesses')}
            className="bouncy-button px-3 py-2 sm:px-4 sm:py-2 rounded-xl liquid-glass-nav text-sm sm:text-base text-primary"
          >
            Supported Businesses
          </button>
          
          {/* Jobs button - always visible */}
          <button
            onClick={() => navigate('/jobs')}
            className="bouncy-button px-3 py-2 sm:px-4 sm:py-2 rounded-xl liquid-glass-nav text-sm sm:text-base text-primary"
          >
            Jobs
          </button>
          
          {/* About Us button - always visible */}
          <button
            onClick={() => navigate('/about-us')}
            className="bouncy-button px-3 py-2 sm:px-4 sm:py-2 rounded-xl liquid-glass-nav text-sm sm:text-base text-primary"
          >
            About Us
          </button>

          {/* Support button - always visible */}
          <button
            onClick={() => navigate('/help')}
            className="bouncy-button px-3 py-2 sm:px-4 sm:py-2 rounded-xl liquid-glass-nav text-sm sm:text-base text-primary"
          >
            Support
          </button>
          
          {/* Show auth buttons when no user is signed in */}
          {!user && (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleLogin}
                className="bouncy-button px-3 py-2 sm:px-4 sm:py-2 rounded-xl liquid-glass-nav text-sm sm:text-base"
                style={{ color: 'var(--color-foreground)' }}
              >
                Login
              </button>
              <button
                onClick={handleSignUp}
                className="bouncy-button px-3 py-2 sm:px-6 sm:py-2 rounded-xl text-sm sm:text-base font-semibold"
                style={{ 
                  background: 'linear-gradient(135deg, rgba(0, 224, 255, 1) 0%, rgba(0, 200, 255, 1) 100%)',
                  color: '#FFFFFF',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.3), 0 4px 12px rgba(0, 224, 255, 0.3), 0 2px 4px rgba(0, 0, 0, 0.1)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  transition: 'all 0.2s ease-out'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 224, 255, 1) 0%, rgba(0, 255, 255, 1) 100%)';
                  e.currentTarget.style.boxShadow = 'inset 0 1px 2px rgba(255, 255, 255, 0.4), 0 6px 16px rgba(0, 224, 255, 0.4), 0 2px 4px rgba(0, 0, 0, 0.15)';
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 224, 255, 1) 0%, rgba(0, 200, 255, 1) 100%)';
                  e.currentTarget.style.boxShadow = 'inset 0 1px 2px rgba(255, 255, 255, 0.3), 0 4px 12px rgba(0, 224, 255, 0.3), 0 2px 4px rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 pt-16 sm:pt-0">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-7xl mx-auto w-full"
        >
          <div className="grid grid-cols-1 gap-12 items-center">
            {/* Text Content */}
            <div className="text-center max-w-4xl mx-auto">
              {/* Floating Badges */}
            
              {/* Hero Headline */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                <span
                  className="block"
                  style={{
                    background: 'linear-gradient(135deg, #00E0FF 0%, #00B8D4 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    textShadow: '0 0 40px rgba(0, 224, 255, 0.3)'
                  }}
                >
                  Stop Hiring for Repetitive Work. Automate It Instead.
                </span>
              </h1>

              {/* Subheadline */}
              <p className="text-lg sm:text-xl md:text-2xl text-gray-700 dark:text-gray-200 mb-8 max-w-3xl mx-auto leading-relaxed">
                If you're hiring for data entry, bookkeeping support, or admin tasks, we replace or reduce that workload with simple automations—fast.
              </p>

              {/* Supporting Text */}
              <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
                Instead of paying $2,000–$4,000/month for repetitive roles, automate them for a fraction of the cost—and get your time back.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-6">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSignUp}
                  className="bouncy-button px-8 py-4 rounded-2xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center gap-3 text-lg"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255, 79, 79, 0.95) 0%, rgba(255, 60, 60, 1) 100%)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: '0 8px 24px rgba(255, 79, 79, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.3)',
                    color: '#FFFFFF'
                  }}
                >
                  <Zap className="w-6 h-6" />
                  See If Your Role Can Be Automated
                </motion.button>
              </div>

              {/* Risk Reversal */}
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 max-w-md mx-auto">
                If it doesn't save you time in the first week, you don't pay.
              </p>

              {/* Secondary CTA - Text Link */}
              <button
                onClick={() => {
                  const pricingSection = document.getElementById('pricing');
                  pricingSection?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="group flex items-center justify-center gap-2 text-lg font-medium transition-all duration-300"
                style={{ color: '#00E0FF' }}
              >
                See Pricing vs. Hiring Costs
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* SECTION 2 - VALUE CARDS (Cost Savings Focus) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto px-4 mt-16 lg:mt-24">
            {/* Replace Admin Work */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="p-8 rounded-3xl backdrop-blur-md"
              style={{
                background: 'linear-gradient(135deg, rgba(0, 224, 255, 0.15) 0%, rgba(0, 200, 255, 0.18) 100%)',
                border: '2px solid rgba(0, 224, 255, 0.4)',
                boxShadow: '0 8px 24px rgba(0, 224, 255, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.3)'
              }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 mx-auto"
                style={{
                  background: 'linear-gradient(135deg, rgba(0, 224, 255, 0.9) 0%, rgba(0, 200, 255, 1) 100%)',
                  boxShadow: '0 4px 12px rgba(0, 224, 255, 0.4)'
                }}
              >
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl mb-3 text-gray-900 dark:text-white text-center font-bold">
                Replace Admin Work
              </h3>
              <p className="text-base text-gray-600 dark:text-gray-100 text-center">
                Save $3,000+/month by automating data entry, scheduling, email management, and customer support.
              </p>
            </motion.div>

            {/* Eliminate Bookkeeping Costs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="p-8 rounded-3xl backdrop-blur-md"
              style={{
                background: 'linear-gradient(135deg, rgba(108, 255, 108, 0.15) 0%, rgba(80, 230, 80, 0.18) 100%)',
                border: '2px solid rgba(108, 255, 108, 0.4)',
                boxShadow: '0 8px 24px rgba(108, 255, 108, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.3)'
              }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 mx-auto"
                style={{
                  background: 'linear-gradient(135deg, rgba(108, 255, 108, 0.9) 0%, rgba(80, 230, 80, 1) 100%)',
                  boxShadow: '0 4px 12px rgba(108, 255, 108, 0.4)'
                }}
              >
                <BarChart3 className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-xl mb-3 text-gray-900 dark:text-white text-center font-bold">
                Eliminate Bookkeeping Costs
              </h3>
              <p className="text-base text-gray-600 dark:text-gray-100 text-center">
                Replace your $2,000/month bookkeeper with AI. Auto-categorize transactions, reconcile accounts, generate reports.
              </p>
            </motion.div>

            {/* Skip the Hire, Keep the Output */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="p-8 rounded-3xl backdrop-blur-md"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 207, 0, 0.15) 0%, rgba(255, 180, 0, 0.18) 100%)',
                border: '2px solid rgba(255, 207, 0, 0.4)',
                boxShadow: '0 8px 24px rgba(255, 207, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.3)'
              }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 mx-auto"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 207, 0, 0.9) 0%, rgba(255, 180, 0, 1) 100%)',
                  boxShadow: '0 4px 12px rgba(255, 207, 0, 0.4)'
                }}
              >
                <Timer className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-xl mb-3 text-gray-900 dark:text-white text-center font-bold">
                Skip the Hire, Keep the Output
              </h3>
              <p className="text-base text-gray-600 dark:text-gray-100 text-center">
                Get tasks done 10x faster than hiring, onboarding, and training—no payroll, no benefits, no turnover.
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Interactive App Demo */}
      <InteractiveAppDemo />

      {/* How It Works Section */}
      <section className="relative z-10 py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6" style={{ color: '#4B00FF' }}>
              How It Works
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-100 max-w-3xl mx-auto">
              Three simple steps to replace your next hire with automation
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div 
                className="p-8 rounded-3xl backdrop-blur-md h-full"
                style={{
                  background: 'linear-gradient(135deg, rgba(0, 224, 255, 0.12) 0%, rgba(0, 200, 255, 0.15) 100%)',
                  border: '1.5px solid rgba(0, 224, 255, 0.3)',
                  boxShadow: '0 8px 24px rgba(0, 224, 255, 0.15), inset 0 1px 3px rgba(255, 255, 255, 0.2)'
                }}
              >
                <div 
                  className="absolute -top-4 -left-4 w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl text-white"
                  style={{ 
                    background: 'linear-gradient(135deg, #00E0FF 0%, #00B8D4 100%)',
                    boxShadow: '0 4px 12px rgba(0, 224, 255, 0.4)'
                  }}
                >
                  1
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                  Describe the Role You're Hiring For
                </h3>
                <p className="text-gray-600 dark:text-gray-100 mb-4">
                  Tell us what tasks are eating your time.
                </p>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#00E0FF' }} />
                    <span>Paste a job description or list of tasks</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#00E0FF' }} />
                    <span>We analyze if automation can replace it</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#00E0FF' }} />
                    <span>Get a free automation feasibility report</span>
                  </li>
                </ul>
              </div>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div 
                className="p-8 rounded-3xl backdrop-blur-md h-full"
                style={{
                  background: 'linear-gradient(135deg, rgba(108, 255, 108, 0.12) 0%, rgba(80, 230, 80, 0.15) 100%)',
                  border: '1.5px solid rgba(108, 255, 108, 0.3)',
                  boxShadow: '0 8px 24px rgba(108, 255, 108, 0.15), inset 0 1px 3px rgba(255, 255, 255, 0.2)'
                }}
              >
                <div 
                  className="absolute -top-4 -left-4 w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl text-black"
                  style={{ 
                    background: 'linear-gradient(135deg, #6CFF6C 0%, #50E650 100%)',
                    boxShadow: '0 4px 12px rgba(108, 255, 108, 0.4)'
                  }}
                >
                  2
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                  We Build Your Automation
                </h3>
                <p className="text-gray-600 dark:text-gray-100 mb-4">
                  Custom workflows deployed in days, not months.
                </p>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#6CFF6C' }} />
                    <span>Cofounder+ designs the automation workflow</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#6CFF6C' }} />
                    <span>Connects to your existing tools and data</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#6CFF6C' }} />
                    <span>Tested and ready to run 24/7</span>
                  </li>
                </ul>
              </div>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div 
                className="p-8 rounded-3xl backdrop-blur-md h-full"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 207, 0, 0.12) 0%, rgba(255, 180, 0, 0.15) 100%)',
                  border: '1.5px solid rgba(255, 207, 0, 0.3)',
                  boxShadow: '0 8px 24px rgba(255, 207, 0, 0.15), inset 0 1px 3px rgba(255, 255, 255, 0.2)'
                }}
              >
                <div 
                  className="absolute -top-4 -left-4 w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl text-black"
                  style={{ 
                    background: 'linear-gradient(135deg, #FFCF00 0%, #FFB400 100%)',
                    boxShadow: '0 4px 12px rgba(255, 207, 0, 0.4)'
                  }}
                >
                  3
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                  Start Saving Money Immediately
                </h3>
                <p className="text-gray-600 dark:text-gray-100 mb-4">
                  Your automation runs while you focus on growth.
                </p>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#FFCF00' }} />
                    <span>Cancel the job posting—automation is live</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#FFCF00' }} />
                    <span>See $2,000–$4,000/month savings in first 30 days</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#FFCF00' }} />
                    <span>Scale without adding headcount</span>
                  </li>
                </ul>
              </div>
            </motion.div>
          </div>

          {/* CTA under How It Works */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="text-center mt-16"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSignUp}
              className="bouncy-button px-8 py-4 rounded-2xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center gap-3 text-lg mx-auto"
              style={{
                background: 'linear-gradient(135deg, rgba(75, 0, 255, 0.95) 0%, rgba(100, 0, 255, 1) 100%)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 8px 24px rgba(75, 0, 255, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.3)',
                color: '#FFFFFF'
              }}
            >
              <DollarSign className="w-6 h-6" />
              Stop Hiring. Start Automating.
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Cofounder Finance Section */}
      <section className="relative z-10 py-16 sm:py-24 px-4 sm:px-6" style={{ backgroundColor: 'var(--background)' }}>
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <div 
              style={{ 
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--spacing-2)',
                padding: 'var(--spacing-2) var(--spacing-4)',
                backgroundColor: 'var(--success-soft)',
                borderRadius: 'var(--radius-full)',
                marginBottom: 'var(--spacing-4)'
              }}
            >
              <DollarSign className="w-5 h-5" style={{ color: 'var(--success)' }} />
              <span style={{ color: 'var(--success)', fontWeight: '600' }}>Cofounder Finance</span>
            </div>
            <h2 style={{ marginBottom: 'var(--spacing-4)' }}>
              Replace Your $21,960/Year CPA
            </h2>
            <p style={{ color: 'var(--muted-foreground)', maxWidth: '42rem', margin: '0 auto' }}>
              Everything a professional CPA does—automated with AI. Save thousands while getting better, faster financial insights.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              style={{
                padding: 'var(--spacing-6)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--card)'
              }}
            >
              <div 
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--success-soft)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 'var(--spacing-4)'
                }}
              >
                <Sparkles className="w-6 h-6" style={{ color: 'var(--success)' }} />
              </div>
              <h3 style={{ marginBottom: 'var(--spacing-2)' }}>AI CPA Chat</h3>
              <p style={{ color: 'var(--muted-foreground)', marginBottom: 'var(--spacing-3)' }}>
                Ask any tax, accounting, or financial question. Get instant expert-level answers with your real business data.
              </p>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-2)' }}>
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--success)' }} />
                  <span style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>21 quick action prompts</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-2)' }}>
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--success)' }} />
                  <span style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>Real-time financial analysis</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-2)' }}>
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--success)' }} />
                  <span style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>Personalized tax advice</span>
                </li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              style={{
                padding: 'var(--spacing-6)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--card)'
              }}
            >
              <div 
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--success-soft)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 'var(--spacing-4)'
                }}
              >
                <TrendingUp className="w-6 h-6" style={{ color: 'var(--success)' }} />
              </div>
              <h3 style={{ marginBottom: 'var(--spacing-2)' }}>Auto-Bookkeeping</h3>
              <p style={{ color: 'var(--muted-foreground)', marginBottom: 'var(--spacing-3)' }}>
                Automatic transaction tracking and categorization. Bank sync, receipt OCR, and IRS-compliant categories.
              </p>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-2)' }}>
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--success)' }} />
                  <span style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>Plaid bank integration</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-2)' }}>
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--success)' }} />
                  <span style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>Receipt photo scanning</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-2)' }}>
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--success)' }} />
                  <span style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>AI expense categorization</span>
                </li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              style={{
                padding: 'var(--spacing-6)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--card)'
              }}
            >
              <div 
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--success-soft)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 'var(--spacing-4)'
                }}
              >
                <BarChart3 className="w-6 h-6" style={{ color: 'var(--success)' }} />
              </div>
              <h3 style={{ marginBottom: 'var(--spacing-2)' }}>44 CPA Services</h3>
              <p style={{ color: 'var(--muted-foreground)', marginBottom: 'var(--spacing-3)' }}>
                From tax planning to financial reporting, we automate every service a traditional CPA provides.
              </p>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-2)' }}>
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--success)' }} />
                  <span style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>32 services automated</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-2)' }}>
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--success)' }} />
                  <span style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>Burn rate calculator</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-2)' }}>
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--success)' }} />
                  <span style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>Runway projections</span>
                </li>
              </ul>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            style={{
              padding: 'var(--spacing-8)',
              borderRadius: 'var(--radius-xl)',
              background: 'linear-gradient(135deg, var(--success-soft) 0%, var(--primary-soft) 100%)',
              border: '2px solid var(--success)',
              textAlign: 'center'
            }}
          >
            <div style={{ marginBottom: 'var(--spacing-4)' }}>
              <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-2)' }}>💰</div>
              <h3 style={{ marginBottom: 'var(--spacing-2)' }}>Save $21,960 Per Year</h3>
              <p style={{ color: 'var(--muted-foreground)', marginBottom: 'var(--spacing-4)' }}>
                Average cost of a professional CPA: $1,830/month. Cofounder Finance includes all their services for a fraction of the price.
              </p>
            </div>
            <Button
              onClick={() => navigate('/cofounder-finance')}
              size="lg"
              style={{
                backgroundColor: 'var(--success)',
                color: 'white',
                borderRadius: 'var(--radius-lg)'
              }}
              className="group"
            >
              See Full Cost Breakdown
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative z-10 py-12 sm:py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6" style={{ color: '#4B00FF' }}>
              Automation vs. Hiring: The Real Numbers
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-100 max-w-3xl mx-auto px-2">
              Compare: A mid-level employee costs $2,000–$4,000/month (plus benefits, training, and turnover).
              Our automation does the same work for a fraction of the cost—and never takes a day off.
            </p>
            
            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4 mt-8">
              <span className={`text-sm font-medium transition-colors ${!isAnnual ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}>
                Monthly
              </span>
              <div className="relative">
                <Switch
                  checked={isAnnual}
                  onCheckedChange={setIsAnnual}
                  className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-600 data-[state=checked]:to-cyan-600"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium transition-colors ${isAnnual ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}>
                  Annual
                </span>
                <Badge className="bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/50 px-2 py-1 text-xs">
                  Save up to 20%
                </Badge>
              </div>
            </div>

          </motion.div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Launch Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="liquid-glass-card rounded-3xl border-2 border-primary/30 p-6 sm:p-8 relative"
            >
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge 
                  style={{ 
                    backgroundColor: '#00E0FF',
                    color: '#FFFFFF'
                  }}
                  className="border-0 px-3 py-1"
                >
                  Solo Founders
                </Badge>
              </div>

              <div className="text-center mb-6">
                <h3 className="text-xl sm:text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">Launch</h3>
                <div className="mb-4">
                  <span className="text-3xl sm:text-4xl font-bold" style={{ color: '#00E0FF' }}>
                    ${isAnnual ? '15' : '19'}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">/month</span>
                  {isAnnual && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      $179 billed annually
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Perfect for solopreneurs testing automation
                </p>
              </div>

              <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: 'rgba(0, 224, 255, 0.1)' }}>
                <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 mb-1">💰 Replaces:</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Part-time VA ($500–$1,200/month)</p>
                <p className="text-xs font-bold mt-1" style={{ color: '#00E0FF' }}>You save: ~$500/month</p>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Basic task automation</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Email & calendar management</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Data entry automation</span>
                </li>
              </ul>

              <button 
                onClick={handleSignUp}
                style={{ backgroundColor: '#00E0FF', color: '#FFFFFF' }}
                className="bouncy-button w-full px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
              >
                Choose Launch
              </button>
            </motion.div>

            {/* Grow Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="glass-morphism rounded-3xl border border-purple-400/30 dark:border-purple-600/30 p-6 sm:p-8 relative"
            >
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge 
                  style={{ 
                    backgroundColor: '#4B00FF',
                    color: '#FFFFFF'
                  }}
                  className="border-0 px-3 py-1"
                >
                  Most Popular
                </Badge>
              </div>

              <div className="text-center mb-6">
                <h3 className="text-xl sm:text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">Grow</h3>
                <div className="mb-4">
                  <span className="text-3xl sm:text-4xl font-bold" style={{ color: '#4B00FF' }}>
                    ${isAnnual ? '38' : '49'}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">/month</span>
                  {isAnnual && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      $450 billed annually
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Replace full-time admin and support roles
                </p>
              </div>

              <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: 'rgba(75, 0, 255, 0.1)' }}>
                <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 mb-1">💰 Replaces:</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">1 Admin + 1 Bookkeeper ($4,000–$6,000/month)</p>
                <p className="text-xs font-bold mt-1" style={{ color: '#4B00FF' }}>You save: ~$4,500/month</p>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-purple-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Full bookkeeping automation</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-purple-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Customer support workflows</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-purple-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Advanced integrations & reporting</span>
                </li>
              </ul>

              <button 
                onClick={handleSignUp}
                style={{ backgroundColor: '#4B00FF', color: '#FFFFFF' }}
                className="bouncy-button w-full px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
              >
                Choose Grow
              </button>
            </motion.div>

            {/* Scale Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              className="glass-morphism rounded-3xl border border-yellow-400/30 dark:border-yellow-600/30 p-6 sm:p-8 relative"
            >
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge 
                  style={{ 
                    backgroundColor: '#FFCF00',
                    color: '#000000'
                  }}
                  className="border-0 px-3 py-1 flex items-center gap-1"
                >
                  <Crown className="w-3 h-3" />
                  Small Teams
                </Badge>
              </div>

              <div className="text-center mb-6">
                <h3 className="text-xl sm:text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">Scale</h3>
                <div className="mb-4">
                  <span className="text-3xl sm:text-4xl font-bold" style={{ color: '#FFCF00' }}>
                    ${isAnnual ? '159' : '199'}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">/month</span>
                  {isAnnual && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      $1,908 billed annually
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Replace entire departments with AI workflows
                </p>
              </div>

              <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: 'rgba(255, 207, 0, 0.1)' }}>
                <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 mb-1">💰 Replaces:</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">3–5 employees ($12,000–$20,000/month)</p>
                <p className="text-xs font-bold mt-1" style={{ color: '#FFCF00' }}>You save: ~$16,000/month</p>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Multi-business automation</span>
                </li>
                <li className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">White-glove setup & support</span>
                </li>
                <li className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Custom workflow development</span>
                </li>
              </ul>

              <button 
                onClick={handleSignUp}
                style={{ backgroundColor: '#FFCF00', color: '#000000' }}
                className="bouncy-button w-full px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
              >
                Choose Scale
              </button>
            </motion.div>
          </div>

          {/* Pricing CTA */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            viewport={{ once: true }}
            className="text-center mt-12 sm:mt-16"
          >
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              All plans include our core gamified experience and community access. 
              Upgrade or downgrade anytime.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <Shield className="w-4 h-4 text-green-500" />
                30-day money-back guarantee
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Cancel anytime
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section for logged out users */}
      {!user && (
        <section className="relative z-10 py-12 sm:py-20 px-4 sm:px-6 overflow-hidden">
          <div className="max-w-4xl mx-auto text-center">
            <div 
              className="relative rounded-3xl border p-8 sm:p-16" 
              style={{ 
                background: 'linear-gradient(135deg, rgba(0, 224, 255, 0.2) 0%, rgba(0, 200, 255, 0.25) 100%)',
                borderColor: 'rgba(0, 224, 255, 0.4)',
                backdropFilter: 'blur(20px)'
              }}
            >
              {/* Floating Confetti Dots */}
              {[...Array(20)].map((_, i) => {
                const colors = ['#00E0FF', '#6CFF6C', '#FFCF00', '#FF4F4F'];
                const randomColor = colors[Math.floor(Math.random() * colors.length)];
                const randomX = Math.random() * 100;
                const randomDelay = Math.random() * 5;
                const randomDuration = 3 + Math.random() * 2;
                
                return (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: randomColor,
                      left: `${randomX}%`,
                      top: '50%',
                      boxShadow: `0 0 10px ${randomColor}`
                    }}
                    animate={{
                      y: [-20, -60, -20],
                      x: [0, Math.random() * 40 - 20, 0],
                      opacity: [0.3, 1, 0.3],
                      scale: [1, 1.5, 1]
                    }}
                    transition={{
                      duration: randomDuration,
                      repeat: Infinity,
                      delay: randomDelay,
                      ease: "easeInOut"
                    }}
                  />
                );
              })}

              <h2 className="text-3xl sm:text-5xl font-bold mb-8 text-gray-900 dark:text-white relative z-10">
                Ready to Start Your Business?
              </h2>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSignUp}
                style={{ backgroundColor: '#FF4F4F' }}
                className="relative z-10 bouncy-button px-8 py-4 sm:px-10 sm:py-5 rounded-2xl text-white font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center justify-center gap-3 border border-white/20 mx-auto"
              >
                <Rocket className="w-6 h-6 sm:w-7 sm:h-7" />
                <span className="text-lg sm:text-xl">Begin Your Journey — Free</span>
              </motion.button>
            </div>
          </div>
        </section>
      )}

      {/* Founder Setup Call Section */}
      {!user && (
        <section 
          style={{
            padding: 'var(--spacing-16) var(--spacing-4)',
            background: 'var(--background)',
          }}
        >
          <div className="max-w-4xl mx-auto">
            <div 
              style={{
                padding: 'var(--spacing-8)',
                borderRadius: 'var(--radius-2xl)',
                background: 'linear-gradient(135deg, rgba(43, 127, 255, 0.1) 0%, rgba(108, 92, 231, 0.1) 100%)',
                border: '1px solid var(--border)',
                textAlign: 'center',
              }}
            >
              <div 
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  marginBottom: 'var(--spacing-4)',
                }}
              >
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: 'var(--radius-full)',
                    background: 'linear-gradient(135deg, #2b7fff 0%, #6c5ce7 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Video className="w-8 h-8" style={{ color: 'white' }} />
                </div>
              </div>

              <h2 
                className="text-gray-900 dark:text-white"
                style={{
                  fontSize: '2rem',
                  fontWeight: 'var(--font-weight-bold)',
                  marginBottom: 'var(--spacing-4)',
                }}
              >
                Need Help Getting Started?
              </h2>
              
              <p 
                className="text-gray-700 dark:text-gray-300"
                style={{
                  fontSize: '1.125rem',
                  lineHeight: '1.75',
                  marginBottom: 'var(--spacing-6)',
                  maxWidth: '600px',
                  margin: '0 auto var(--spacing-6)',
                }}
              >
                Book a personalized working session with a founder. We'll help you set up your business, 
                review your strategy, and tackle your biggest challenges together.
              </p>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/founder-setup-call')}
                style={{
                  background: 'linear-gradient(135deg, #2b7fff 0%, #6c5ce7 100%)',
                  padding: 'var(--spacing-4) var(--spacing-8)',
                  borderRadius: 'var(--radius-xl)',
                  color: 'white',
                  fontWeight: 'var(--font-weight-semibold)',
                  fontSize: '1.125rem',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-2)',
                  boxShadow: '0 4px 14px 0 rgba(43, 127, 255, 0.39)',
                }}
              >
                <Calendar className="w-5 h-5" />
                Schedule Your Call
              </motion.button>

              <div 
                style={{
                  marginTop: 'var(--spacing-6)',
                  display: 'flex',
                  gap: 'var(--spacing-6)',
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <div className="flex items-center gap-[var(--spacing-2)]">
                  <CheckCircle className="w-5 h-5" style={{ color: '#10b981' }} />
                  <span className="text-sm text-gray-600 dark:text-gray-400">60-minute session</span>
                </div>
                <div className="flex items-center gap-[var(--spacing-2)]">
                  <CheckCircle className="w-5 h-5" style={{ color: '#10b981' }} />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Personalized strategy</span>
                </div>
                <div className="flex items-center gap-[var(--spacing-2)]">
                  <CheckCircle className="w-5 h-5" style={{ color: '#10b981' }} />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Actionable next steps</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Task Automation Setup Section */}
      {!user && (
        <section 
          style={{
            padding: 'var(--spacing-16) var(--spacing-4)',
            background: 'var(--background)',
            borderTop: '1px solid var(--border)',
          }}
        >
          <div className="max-w-4xl mx-auto">
            <div 
              style={{
                padding: 'var(--spacing-8)',
                borderRadius: 'var(--radius-2xl)',
                background: 'linear-gradient(135deg, rgba(39, 209, 124, 0.1) 0%, rgba(39, 209, 124, 0.05) 100%)',
                border: '1px solid rgba(39, 209, 124, 0.2)',
                textAlign: 'center',
              }}
            >
              <div 
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  marginBottom: 'var(--spacing-4)',
                }}
              >
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: 'var(--radius-full)',
                    background: 'linear-gradient(135deg, #27d17c 0%, #10b981 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(39, 209, 124, 0.3)'
                  }}
                >
                  <Zap className="w-8 h-8" style={{ color: 'white' }} />
                </div>
              </div>

              <h2 
                className="text-gray-900 dark:text-white"
                style={{
                  fontSize: '2rem',
                  fontWeight: 'var(--font-weight-bold)',
                  marginBottom: 'var(--spacing-4)',
                }}
              >
                Drowning in Manual Tasks?
              </h2>
              
              <p 
                className="text-gray-700 dark:text-gray-300"
                style={{
                  fontSize: '1.125rem',
                  lineHeight: '1.75',
                  marginBottom: 'var(--spacing-6)',
                  maxWidth: '600px',
                  margin: '0 auto var(--spacing-6)',
                }}
              >
                Book a 60-minute automation session. We'll identify your repetitive workflows 
                and design a system to handle them automatically—saving you hours every week.
              </p>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/task-automation-setup')}
                style={{
                  background: 'linear-gradient(135deg, #27d17c 0%, #10b981 100%)',
                  padding: 'var(--spacing-4) var(--spacing-8)',
                  borderRadius: 'var(--radius-xl)',
                  color: 'white',
                  fontWeight: 'var(--font-weight-semibold)',
                  fontSize: '1.125rem',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-2)',
                  boxShadow: '0 4px 14px 0 rgba(39, 209, 124, 0.39)',
                }}
              >
                <Zap className="w-5 h-5" />
                Automate Your Tasks
              </motion.button>

              <div 
                style={{
                  marginTop: 'var(--spacing-6)',
                  display: 'flex',
                  gap: 'var(--spacing-6)',
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <div className="flex items-center gap-[var(--spacing-2)]">
                  <CheckCircle className="w-5 h-5" style={{ color: '#10b981' }} />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Fixed price: $99</span>
                </div>
                <div className="flex items-center gap-[var(--spacing-2)]">
                  <CheckCircle className="w-5 h-5" style={{ color: '#10b981' }} />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Immediate ROI</span>
                </div>
                <div className="flex items-center gap-[var(--spacing-2)]">
                  <CheckCircle className="w-5 h-5" style={{ color: '#10b981' }} />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Expert setup</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Support Form Modal */}
      <AnimatePresence>
        {showSupportForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowSupportForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-morphism rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto border border-white/20 dark:border-gray-700/20"
              onClick={(e) => e.stopPropagation()}
            >
              {!formSubmitted ? (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Get Support</h3>
                    <button
                      onClick={() => setShowSupportForm(false)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-900 dark:text-gray-300"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSupportSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Name</label>
                        <Input
                          value={supportForm.name}
                          onChange={(e) => setSupportForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Your name"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Email</label>
                        <Input
                          type="email"
                          value={supportForm.email}
                          onChange={(e) => setSupportForm(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="your@email.com"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Category</label>
                      <Select
                        value={supportForm.category}
                        onValueChange={(value) => setSupportForm(prev => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {supportCategories.map(cat => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Subject</label>
                      <Input
                        value={supportForm.subject}
                        onChange={(e) => setSupportForm(prev => ({ ...prev, subject: e.target.value }))}
                        placeholder="Brief description of your issue"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Message</label>
                      <Textarea
                        value={supportForm.message}
                        onChange={(e) => setSupportForm(prev => ({ ...prev, message: e.target.value }))}
                        placeholder="Please describe your issue or question in detail..."
                        rows={4}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Urgency</label>
                        <Select
                          value={supportForm.urgency}
                          onValueChange={(value) => setSupportForm(prev => ({ ...prev, urgency: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low - General question</SelectItem>
                            <SelectItem value="medium">Medium - Need help soon</SelectItem>
                            <SelectItem value="high">High - Business critical</SelectItem>
                            <SelectItem value="urgent">Urgent - System down</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Preferred Contact</label>
                        <Select
                          value={supportForm.contactMethod}
                          onValueChange={(value) => setSupportForm(prev => ({ ...prev, contactMethod: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="phone">Phone Call</SelectItem>
                            <SelectItem value="chat">Live Chat</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowSupportForm(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={submitting}
                        style={{ backgroundColor: '#00E0FF', color: '#FFFFFF' }}
                        className="flex-1 text-white hover:text-white hover:opacity-90"
                      >
                        {submitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Send Message
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-gray-100">Message Sent!</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Thank you for reaching out. We'll get back to you within 24 hours.
                  </p>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Clock className="w-4 h-4" />
                      Expected response time: 
                      {supportForm.urgency === 'urgent' && ' Within 2 hours'}
                      {supportForm.urgency === 'high' && ' Within 4 hours'}
                      {supportForm.urgency === 'medium' && ' Within 24 hours'}
                      {supportForm.urgency === 'low' && ' Within 48 hours'}
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      {supportForm.contactMethod === 'email' && <Mail className="w-4 h-4" />}
                      {supportForm.contactMethod === 'phone' && <Phone className="w-4 h-4" />}
                      {supportForm.contactMethod === 'chat' && <MessageSquare className="w-4 h-4" />}
                      We'll contact you via {supportForm.contactMethod}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer with Privacy Policy Link */}
      <footer className="relative z-10 border-t border-white/20 dark:border-gray-700/20 glass-morphism mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              © 2025 Cofounder. All rights reserved.
            </div>
            <div className="flex items-center gap-6">
              <button
                onClick={() => navigate('/privacy-policy')}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Privacy Policy
              </button>
              <button
                onClick={() => setShowSupportForm(true)}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Contact Us
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Homepage;