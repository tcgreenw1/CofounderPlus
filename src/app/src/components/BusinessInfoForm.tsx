import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { useTheme } from './ThemeProvider';
import { Moon, Sun, HelpCircle, Building, Users, DollarSign, Calendar, AlertCircle, CheckCircle, ChevronLeft, Search, Edit } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

function BusinessInfoForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fromSignup, setFromSignup] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    employees: '',
    revenue: '',
    yearsInBusiness: '',
    biggestChallenge: ''
  });

  // Check if mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Check if user is coming from signup flow
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const isFromSignup = searchParams.get('from') === 'signup';
    setFromSignup(isFromSignup);
  }, [location.search]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Basic validation
    if (!formData.businessName.trim()) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    try {
      if (fromSignup) {
        // User is coming from signup - create business record in database
        setSuccess('Creating your business profile...');

        const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/businesses`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify({
            name: formData.businessName.trim(),
            industry: 'Industry to be determined',
            description: formData.biggestChallenge || `Business with ${formData.employees} employees, ${formData.revenue} annual revenue, ${formData.yearsInBusiness} years in business.`
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || 'Failed to create business');
        }

        setSuccess('Business profile created! Redirecting to your dashboard...');
        
        // Add a small delay to ensure the business is fully created and indexed
        setTimeout(() => {
          // Force a full page navigation to ensure clean state
          window.location.href = '/dashboard';
        }, 2500);
      } else {
        // Original flow - store in localStorage and go to auth
        localStorage.setItem('businessInfo', JSON.stringify(formData));
        navigate('/auth?from=questionnaire&mode=signup');
      }
    } catch (error: any) {
      console.error('Business creation error:', error);
      setError(error.message || 'Failed to create business profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    if (!loading) {
      if (fromSignup) {
        navigate('/dashboard');
      } else {
        navigate('/questionnaire');
      }
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-purple-50/80 to-pink-50/80 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20"></div>
      
      {/* Animated Background Elements - Smaller on mobile */}
      <div className="absolute top-10 left-5 sm:top-20 sm:left-10 w-16 h-16 sm:w-32 sm:h-32 bg-gradient-to-r from-blue-400/30 to-purple-400/30 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute bottom-10 right-10 sm:bottom-20 sm:right-20 w-20 h-20 sm:w-40 sm:h-40 bg-gradient-to-r from-purple-400/30 to-pink-400/30 rounded-full blur-xl animate-pulse delay-1000"></div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-4 sm:p-6">
        <motion.button
          onClick={handleGoBack}
          disabled={loading}
          className={`flex items-center gap-2 text-lg sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent ${
            loading ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'
          }`}
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="hidden sm:inline">
            {fromSignup ? 'Dashboard' : 'Back'}
          </span>
        </motion.button>

        <div className="flex items-center space-x-2 sm:space-x-4">
          <button
            onClick={toggleTheme}
            disabled={loading}
            className={`p-2 rounded-xl bg-white/20 dark:bg-gray-800/20 backdrop-blur-lg border border-white/30 dark:border-gray-700/30 hover:bg-white/30 dark:hover:bg-gray-700/30 transition-all duration-300 ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {theme === 'light' ? <Moon className="w-4 h-4 sm:w-5 sm:h-5" /> : <Sun className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-2xl mx-auto w-full"
        >
          {/* Progress Bar */}
          <div className="w-full h-2 bg-white/20 dark:bg-gray-800/20 rounded-full mb-6 sm:mb-8 backdrop-blur-lg">
            <motion.div
              initial={{ width: fromSignup ? '90%' : '20%' }}
              animate={{ width: fromSignup ? '95%' : '60%' }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"
            ></motion.div>
          </div>

          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-4 sm:mb-6 mx-auto"
          >
            <Building className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </motion.div>

          {/* Title and Description */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent text-center leading-tight">
            {fromSignup ? 'Create Your Business Profile' : 'Tell Us About Your Business'}
          </h1>

          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 text-center px-2">
            {fromSignup 
              ? 'Complete your profile to access your personalized dashboard' 
              : 'Help us create a personalized roadmap to scale your business'
            }
          </p>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start space-x-3"
            >
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 dark:text-red-300 text-xs sm:text-sm leading-relaxed">{error}</p>
            </motion.div>
          )}

          {/* Success Message */}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-start space-x-3"
            >
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-green-700 dark:text-green-300 text-xs sm:text-sm leading-relaxed">{success}</p>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-6">
            {/* Business Name */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="relative"
            >
              <label className="block text-xs sm:text-sm font-semibold mb-0.5 sm:mb-2 text-gray-700 dark:text-gray-300">
                Business Name *
              </label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleInputChange}
                required
                disabled={loading}
                className={`w-full px-2.5 py-1.5 sm:p-4 text-sm sm:text-base rounded-xl bg-white/20 dark:bg-gray-800/20 backdrop-blur-lg border border-white/30 dark:border-gray-700/30 focus:border-blue-500 focus:outline-none transition-all duration-300 ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                placeholder="Enter your business name"
              />
            </motion.div>

            {/* Stats Grid - 3 columns on desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <label className="block text-xs sm:text-sm font-semibold mb-0.5 sm:mb-2 text-gray-700 dark:text-gray-300">
                  Number of Employees
                </label>
                <select
                  name="employees"
                  value={formData.employees}
                  onChange={handleInputChange}
                  disabled={loading}
                  className={`w-full px-2.5 py-1.5 sm:p-4 text-xs sm:text-base rounded-xl bg-white/20 dark:bg-gray-800/20 backdrop-blur-lg border border-white/30 dark:border-gray-700/30 focus:border-blue-500 focus:outline-none transition-all duration-300 ${
                    loading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <option value="">Select range</option>
                  <option value="1">Just me</option>
                  <option value="2-5">2-5</option>
                  <option value="6-10">6-10</option>
                  <option value="11-25">11-25</option>
                  <option value="26-50">26-50</option>
                  <option value="50+">50+</option>
                </select>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                <label className="block text-xs sm:text-sm font-semibold mb-0.5 sm:mb-2 text-gray-700 dark:text-gray-300">
                  Annual Revenue
                </label>
                <select
                  name="revenue"
                  value={formData.revenue}
                  onChange={handleInputChange}
                  disabled={loading}
                  className={`w-full px-2.5 py-1.5 sm:p-4 text-xs sm:text-base rounded-xl bg-white/20 dark:bg-gray-800/20 backdrop-blur-lg border border-white/30 dark:border-gray-700/30 focus:border-blue-500 focus:outline-none transition-all duration-300 ${
                    loading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <option value="">Select range</option>
                  <option value="0-10k">$0 - $10K</option>
                  <option value="10k-50k">$10K - $50K</option>
                  <option value="50k-100k">$50K - $100K</option>
                  <option value="100k-500k">$100K - $500K</option>
                  <option value="500k-1m">$500K - $1M</option>
                  <option value="1m+">$1M+</option>
                </select>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
              >
                <label className="block text-xs sm:text-sm font-semibold mb-0.5 sm:mb-2 text-gray-700 dark:text-gray-300">
                  Years in Business
                </label>
                <select
                  name="yearsInBusiness"
                  value={formData.yearsInBusiness}
                  onChange={handleInputChange}
                  disabled={loading}
                  className={`w-full px-2.5 py-1.5 sm:p-4 text-xs sm:text-base rounded-xl bg-white/20 dark:bg-gray-800/20 backdrop-blur-lg border border-white/30 dark:border-gray-700/30 focus:border-blue-500 focus:outline-none transition-all duration-300 ${
                    loading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <option value="">Select range</option>
                  <option value="0-1">Less than 1 year</option>
                  <option value="1-2">1-2 years</option>
                  <option value="3-5">3-5 years</option>
                  <option value="6-10">6-10 years</option>
                  <option value="10+">10+ years</option>
                </select>
              </motion.div>
            </div>

            {/* Challenge Textarea */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.0 }}
            >
              <label className="block text-xs sm:text-sm font-semibold mb-0.5 sm:mb-2 text-gray-700 dark:text-gray-300">
                What's your biggest challenge right now?
              </label>
              <textarea
                name="biggestChallenge"
                value={formData.biggestChallenge}
                onChange={handleInputChange}
                rows={isMobile ? 2 : 4}
                disabled={loading}
                className={`w-full px-2.5 py-1.5 sm:p-4 text-xs sm:text-base rounded-xl bg-white/20 dark:bg-gray-800/20 backdrop-blur-lg border border-white/30 dark:border-gray-700/30 focus:border-blue-500 focus:outline-none transition-all duration-300 resize-none ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                placeholder="e.g., finding customers, scaling operations..."
              />
            </motion.div>

            {/* Submit Button */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.1 }}
              whileHover={!loading ? { scale: 1.02 } : {}}
              whileTap={!loading ? { scale: 0.98 } : {}}
              type="submit"
              disabled={loading}
              className={`w-full py-2 sm:py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              } flex items-center justify-center space-x-2 text-sm sm:text-base`}
            >
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
              )}
              <span>
                {loading 
                  ? 'Processing...' 
                  : fromSignup 
                    ? 'Complete Setup' 
                    : 'Create My Roadmap'
                }
              </span>
            </motion.button>
          </form>
        </motion.div>
      </div>

      {/* Floating Help Button - Only show on mobile */}
      {isMobile && (
        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 1.2 }}
          disabled={loading}
          className={`fixed bottom-4 right-4 p-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 z-50 ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <HelpCircle className="w-5 h-5" />
        </motion.button>
      )}
    </div>
  );
}

export default BusinessInfoForm;