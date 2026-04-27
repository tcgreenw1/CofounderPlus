import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageSquare,
  CheckCircle2,
  Target,
  DollarSign,
  Users,
  BarChart3,
  Sparkles,
  TrendingUp,
  ChevronRight,
  Play,
  Pause,
  Plus,
  Send,
  Award,
  Zap,
  Package,
  Megaphone,
  ShoppingCart,
  UserCheck,
  StickyNote,
  Plug,
  TrendingDown,
  Box,
  Calendar,
  FileText,
  Mail,
  Check
} from 'lucide-react';

type DemoScreen = 'dashboard' | 'roadmap' | 'chat' | 'product' | 'marketing' | 'sales' | 'finance' | 'hr' | 'notes' | 'integrations';

export default function InteractiveAppDemo() {
  const [currentScreen, setCurrentScreen] = useState<DemoScreen>('dashboard');
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [messageCount, setMessageCount] = useState(0);

  const screens: DemoScreen[] = ['dashboard', 'roadmap', 'chat', 'product', 'marketing', 'sales', 'finance', 'hr', 'notes', 'integrations'];

  // Auto-play through screens
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentScreen((prev) => {
        const currentIndex = screens.indexOf(prev);
        const nextIndex = (currentIndex + 1) % screens.length;
        return screens[nextIndex];
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const handleScreenClick = (screen: DemoScreen) => {
    setIsAutoPlaying(false);
    setCurrentScreen(screen);
  };

  const handleSendMessage = () => {
    setMessageCount((prev) => prev + 1);
  };

  return (
    <section className="relative z-10 py-20 px-4 sm:px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span
              style={{
                background: 'linear-gradient(135deg, #00E0FF 0%, #FFCF00 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              See Cofounder+ in Action
            </span>
          </h2>
          <p className="text-xl text-gray-800 dark:text-gray-100 max-w-2xl mx-auto font-medium">
            Click around and explore the platform. (This is just a preview — sign up to unlock everything!)
          </p>
        </motion.div>

        {/* Demo Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="relative rounded-3xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(240, 250, 255, 0.2) 100%)',
            backdropFilter: 'blur(30px)',
            WebkitBackdropFilter: 'blur(30px)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            boxShadow: `
              0 0 0 1px rgba(0, 224, 255, 0.1),
              0 20px 60px rgba(0, 0, 0, 0.2),
              inset 0 1px 3px rgba(255, 255, 255, 0.3)
            `
          }}
        >
          {/* Auto-play Controls */}
          <div className="absolute top-6 right-6 z-20 flex items-center gap-3">
            <button
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              className="p-3 rounded-xl backdrop-blur-md transition-all duration-300 hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, rgba(0, 224, 255, 0.2) 0%, rgba(0, 200, 255, 0.25) 100%)',
                border: '1px solid rgba(0, 224, 255, 0.3)',
                boxShadow: '0 4px 12px rgba(0, 224, 255, 0.15)'
              }}
            >
              {isAutoPlaying ? (
                <Pause className="w-5 h-5" style={{ color: '#00E0FF' }} />
              ) : (
                <Play className="w-5 h-5" style={{ color: '#00E0FF' }} />
              )}
            </button>
          </div>

          {/* App Demo */}
          <div className="grid grid-cols-12 gap-0">
            {/* Sidebar Navigation */}
            <div
              className="col-span-2 p-6 border-r"
              style={{
                background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.7) 100%)',
                borderColor: 'rgba(255, 255, 255, 0.1)'
              }}
            >
              <div className="mb-8">
                <h3 className="text-2xl font-bold" style={{ color: '#00E0FF' }}>
                  Cofounder+
                </h3>
              </div>

              <nav className="space-y-2">
                <button
                  onClick={() => handleScreenClick('dashboard')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                    currentScreen === 'dashboard' ? 'scale-105' : 'hover:scale-102'
                  }`}
                  style={{
                    background:
                      currentScreen === 'dashboard'
                        ? 'linear-gradient(135deg, rgba(0, 224, 255, 0.3) 0%, rgba(0, 200, 255, 0.35) 100%)'
                        : 'transparent',
                    border: currentScreen === 'dashboard' ? '1px solid rgba(0, 224, 255, 0.4)' : '1px solid transparent'
                  }}
                >
                  <BarChart3 className="w-5 h-5" style={{ color: currentScreen === 'dashboard' ? '#00E0FF' : '#AAA' }} />
                  <span className={currentScreen === 'dashboard' ? 'text-white font-medium' : 'text-gray-300'}>Dashboard</span>
                </button>

                <button
                  onClick={() => handleScreenClick('roadmap')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                    currentScreen === 'roadmap' ? 'scale-105' : 'hover:scale-102'
                  }`}
                  style={{
                    background:
                      currentScreen === 'roadmap'
                        ? 'linear-gradient(135deg, rgba(108, 255, 108, 0.3) 0%, rgba(80, 230, 80, 0.35) 100%)'
                        : 'transparent',
                    border: currentScreen === 'roadmap' ? '1px solid rgba(108, 255, 108, 0.4)' : '1px solid transparent'
                  }}
                >
                  <Target className="w-5 h-5" style={{ color: currentScreen === 'roadmap' ? '#6CFF6C' : '#AAA' }} />
                  <span className={currentScreen === 'roadmap' ? 'text-white font-medium' : 'text-gray-300'}>Roadmap</span>
                </button>

                <button
                  onClick={() => handleScreenClick('chat')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                    currentScreen === 'chat' ? 'scale-105' : 'hover:scale-102'
                  }`}
                  style={{
                    background:
                      currentScreen === 'chat'
                        ? 'linear-gradient(135deg, rgba(255, 207, 0, 0.3) 0%, rgba(255, 180, 0, 0.35) 100%)'
                        : 'transparent',
                    border: currentScreen === 'chat' ? '1px solid rgba(255, 207, 0, 0.4)' : '1px solid transparent'
                  }}
                >
                  <MessageSquare className="w-5 h-5" style={{ color: currentScreen === 'chat' ? '#FFCF00' : '#AAA' }} />
                  <span className={currentScreen === 'chat' ? 'text-white font-medium' : 'text-gray-300'}>AI Cofounder</span>
                </button>

                {/* Operations Section */}
                <div className="pt-4 pb-2">
                  <div className="text-xs font-bold text-gray-400 px-4 mb-2">OPERATIONS</div>
                </div>

                <button
                  onClick={() => handleScreenClick('product')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                    currentScreen === 'product' ? 'scale-105' : 'hover:scale-102'
                  }`}
                  style={{
                    background:
                      currentScreen === 'product'
                        ? 'linear-gradient(135deg, rgba(0, 224, 255, 0.3) 0%, rgba(0, 200, 255, 0.35) 100%)'
                        : 'transparent',
                    border: currentScreen === 'product' ? '1px solid rgba(0, 224, 255, 0.4)' : '1px solid transparent'
                  }}
                >
                  <Package className="w-5 h-5" style={{ color: currentScreen === 'product' ? '#00E0FF' : '#AAA' }} />
                  <span className={currentScreen === 'product' ? 'text-white font-medium' : 'text-gray-300'}>Product</span>
                </button>

                <button
                  onClick={() => handleScreenClick('marketing')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                    currentScreen === 'marketing' ? 'scale-105' : 'hover:scale-102'
                  }`}
                  style={{
                    background:
                      currentScreen === 'marketing'
                        ? 'linear-gradient(135deg, rgba(255, 207, 0, 0.3) 0%, rgba(255, 180, 0, 0.35) 100%)'
                        : 'transparent',
                    border: currentScreen === 'marketing' ? '1px solid rgba(255, 207, 0, 0.4)' : '1px solid transparent'
                  }}
                >
                  <Megaphone className="w-5 h-5" style={{ color: currentScreen === 'marketing' ? '#FFCF00' : '#AAA' }} />
                  <span className={currentScreen === 'marketing' ? 'text-white font-medium' : 'text-gray-300'}>Marketing</span>
                </button>

                <button
                  onClick={() => handleScreenClick('sales')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                    currentScreen === 'sales' ? 'scale-105' : 'hover:scale-102'
                  }`}
                  style={{
                    background:
                      currentScreen === 'sales'
                        ? 'linear-gradient(135deg, rgba(108, 255, 108, 0.3) 0%, rgba(80, 230, 80, 0.35) 100%)'
                        : 'transparent',
                    border: currentScreen === 'sales' ? '1px solid rgba(108, 255, 108, 0.4)' : '1px solid transparent'
                  }}
                >
                  <ShoppingCart className="w-5 h-5" style={{ color: currentScreen === 'sales' ? '#6CFF6C' : '#AAA' }} />
                  <span className={currentScreen === 'sales' ? 'text-white font-medium' : 'text-gray-300'}>Sales</span>
                </button>

                <button
                  onClick={() => handleScreenClick('finance')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                    currentScreen === 'finance' ? 'scale-105' : 'hover:scale-102'
                  }`}
                  style={{
                    background:
                      currentScreen === 'finance'
                        ? 'linear-gradient(135deg, rgba(255, 79, 79, 0.3) 0%, rgba(255, 60, 60, 0.35) 100%)'
                        : 'transparent',
                    border: currentScreen === 'finance' ? '1px solid rgba(255, 79, 79, 0.4)' : '1px solid transparent'
                  }}
                >
                  <DollarSign className="w-5 h-5" style={{ color: currentScreen === 'finance' ? '#FF4F4F' : '#AAA' }} />
                  <span className={currentScreen === 'finance' ? 'text-white font-medium' : 'text-gray-300'}>Finance</span>
                </button>

                <button
                  onClick={() => handleScreenClick('hr')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                    currentScreen === 'hr' ? 'scale-105' : 'hover:scale-102'
                  }`}
                  style={{
                    background:
                      currentScreen === 'hr'
                        ? 'linear-gradient(135deg, rgba(0, 224, 255, 0.3) 0%, rgba(0, 200, 255, 0.35) 100%)'
                        : 'transparent',
                    border: currentScreen === 'hr' ? '1px solid rgba(0, 224, 255, 0.4)' : '1px solid transparent'
                  }}
                >
                  <UserCheck className="w-5 h-5" style={{ color: currentScreen === 'hr' ? '#00E0FF' : '#AAA' }} />
                  <span className={currentScreen === 'hr' ? 'text-white font-medium' : 'text-gray-300'}>HR</span>
                </button>

                <div className="pt-4 pb-2">
                  <div className="text-xs font-bold text-gray-400 px-4 mb-2">TOOLS</div>
                </div>

                <button
                  onClick={() => handleScreenClick('notes')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                    currentScreen === 'notes' ? 'scale-105' : 'hover:scale-102'
                  }`}
                  style={{
                    background:
                      currentScreen === 'notes'
                        ? 'linear-gradient(135deg, rgba(255, 207, 0, 0.3) 0%, rgba(255, 180, 0, 0.35) 100%)'
                        : 'transparent',
                    border: currentScreen === 'notes' ? '1px solid rgba(255, 207, 0, 0.4)' : '1px solid transparent'
                  }}
                >
                  <StickyNote className="w-5 h-5" style={{ color: currentScreen === 'notes' ? '#FFCF00' : '#AAA' }} />
                  <span className={currentScreen === 'notes' ? 'text-white font-medium' : 'text-gray-300'}>Notes</span>
                </button>

                <button
                  onClick={() => handleScreenClick('integrations')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                    currentScreen === 'integrations' ? 'scale-105' : 'hover:scale-102'
                  }`}
                  style={{
                    background:
                      currentScreen === 'integrations'
                        ? 'linear-gradient(135deg, rgba(108, 255, 108, 0.3) 0%, rgba(80, 230, 80, 0.35) 100%)'
                        : 'transparent',
                    border: currentScreen === 'integrations' ? '1px solid rgba(108, 255, 108, 0.4)' : '1px solid transparent'
                  }}
                >
                  <Plug className="w-5 h-5" style={{ color: currentScreen === 'integrations' ? '#6CFF6C' : '#AAA' }} />
                  <span className={currentScreen === 'integrations' ? 'text-white font-medium' : 'text-gray-300'}>Integrations</span>
                </button>
              </nav>
            </div>

            {/* Main Content Area */}
            <div className="col-span-10 p-8 min-h-[600px]">
              <AnimatePresence mode="wait">
                {currentScreen === 'dashboard' && (
                  <motion.div
                    key="dashboard"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
                      Dashboard Overview
                    </h2>

                    {/* XP Progress */}
                    <div
                      className="p-6 rounded-2xl mb-6"
                      style={{
                        background: 'linear-gradient(135deg, rgba(0, 224, 255, 0.2) 0%, rgba(0, 200, 255, 0.25) 100%)',
                        border: '1px solid rgba(0, 224, 255, 0.4)'
                      }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Award className="w-6 h-6" style={{ color: '#FFCF00' }} />
                          <span className="text-xl font-bold text-gray-900 dark:text-white">Level 7 Entrepreneur</span>
                        </div>
                        <span className="text-lg font-bold" style={{ color: '#FFCF00' }}>
                          3,850 XP
                        </span>
                      </div>
                      <div className="h-4 rounded-full overflow-hidden" style={{ background: 'rgba(0, 0, 0, 0.4)' }}>
                        <motion.div
                          initial={{ width: '0%' }}
                          animate={{ width: '75%' }}
                          transition={{ duration: 1, delay: 0.5 }}
                          className="h-full rounded-full"
                          style={{
                            background: 'linear-gradient(90deg, #00E0FF 0%, #FFCF00 100%)',
                            boxShadow: '0 0 12px rgba(0, 224, 255, 0.5)'
                          }}
                        />
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-4">
                      <div
                        className="p-5 rounded-2xl"
                        style={{
                          background: 'linear-gradient(135deg, rgba(108, 255, 108, 0.2) 0%, rgba(80, 230, 80, 0.25) 100%)',
                          border: '1px solid rgba(108, 255, 108, 0.4)'
                        }}
                      >
                        <div className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
                          12/15
                        </div>
                        <div className="text-sm text-gray-800 dark:text-gray-200 font-bold">Tasks Completed</div>
                      </div>

                      <div
                        className="p-5 rounded-2xl"
                        style={{
                          background: 'linear-gradient(135deg, rgba(255, 207, 0, 0.2) 0%, rgba(255, 180, 0, 0.25) 100%)',
                          border: '1px solid rgba(255, 207, 0, 0.4)'
                        }}
                      >
                        <div className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
                          $12.5K
                        </div>
                        <div className="text-sm text-gray-800 dark:text-gray-200 font-bold">Monthly Revenue</div>
                      </div>

                      <div
                        className="p-5 rounded-2xl"
                        style={{
                          background: 'linear-gradient(135deg, rgba(255, 79, 79, 0.2) 0%, rgba(255, 60, 60, 0.25) 100%)',
                          border: '1px solid rgba(255, 79, 79, 0.4)'
                        }}
                      >
                        <div className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
                          247
                        </div>
                        <div className="text-sm text-gray-800 dark:text-gray-200 font-bold">Active Customers</div>
                      </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="mt-6">
                      <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Recent Activity</h3>
                      <div className="space-y-3">
                        {[
                          { icon: CheckCircle2, text: 'Completed market research task', color: '#6CFF6C' },
                          { icon: Zap, text: 'Achieved 100-day streak!', color: '#FFCF00' },
                          { icon: TrendingUp, text: 'Revenue increased by 23%', color: '#00E0FF' }
                        ].map((item, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.7 + i * 0.1 }}
                            className="flex items-center gap-3 p-3 rounded-xl"
                            style={{ background: 'rgba(255, 255, 255, 0.08)' }}
                          >
                            <item.icon className="w-5 h-5" style={{ color: item.color }} />
                            <span className="text-gray-900 dark:text-white font-bold">{item.text}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {currentScreen === 'roadmap' && (
                  <motion.div
                    key="roadmap"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
                      Your Business Roadmap
                    </h2>

                    <div className="space-y-4">
                      {[
                        { phase: 'Phase 1: Foundation', tasks: ['Market Research', 'Business Plan', 'Legal Setup'], completed: 3, total: 3, color: '#6CFF6C' },
                        { phase: 'Phase 2: Launch', tasks: ['Build MVP', 'First Customer', 'Product-Market Fit'], completed: 2, total: 3, color: '#FFCF00' },
                        { phase: 'Phase 3: Growth', tasks: ['Scale Marketing', 'Hire Team', 'Expand Product'], completed: 0, total: 3, color: '#FF4F4F' }
                      ].map((phase, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 + i * 0.15 }}
                          className="p-6 rounded-2xl"
                          style={{
                            background: `linear-gradient(135deg, ${phase.color}20 0%, ${phase.color}30 100%)`,
                            border: `1.5px solid ${phase.color}60`
                          }}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                              {phase.phase}
                            </h3>
                            <span className="text-sm font-bold text-gray-900 dark:text-white">
                              {phase.completed}/{phase.total} Complete
                            </span>
                          </div>

                          <div className="space-y-2">
                            {phase.tasks.map((task, j) => {
                              const isComplete = j < phase.completed;
                              return (
                                <div key={j} className="flex items-center gap-3">
                                  <div
                                    className="w-6 h-6 rounded-full flex items-center justify-center"
                                    style={{
                                      background: isComplete ? phase.color : 'transparent',
                                      border: isComplete ? 'none' : `2px solid ${phase.color}`
                                    }}
                                  >
                                    {isComplete && <CheckCircle2 className="w-4 h-4 text-black" />}
                                  </div>
                                  <span className={isComplete ? 'text-gray-900 dark:text-white font-bold' : 'text-gray-700 dark:text-gray-300 font-medium'}>{task}</span>
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {currentScreen === 'chat' && (
                  <motion.div
                    key="chat"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="h-full flex flex-col"
                  >
                    <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
                      AI Cofounder Chat
                    </h2>

                    {/* Chat Messages */}
                    <div
                      className="flex-1 p-6 rounded-2xl mb-4 overflow-y-auto"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255, 207, 0, 0.15) 0%, rgba(255, 180, 0, 0.2) 100%)',
                        border: '1px solid rgba(255, 207, 0, 0.4)',
                        maxHeight: '400px'
                      }}
                    >
                      <div className="space-y-4">
                        {/* User Message */}
                        <div className="flex justify-end">
                          <div
                            className="max-w-xs p-4 rounded-2xl"
                            style={{
                              background: 'linear-gradient(135deg, rgba(0, 224, 255, 0.4) 0%, rgba(0, 200, 255, 0.5) 100%)',
                              border: '1px solid rgba(0, 224, 255, 0.6)'
                            }}
                          >
                            <p className="text-gray-900 dark:text-white font-bold">Help me create a marketing plan for my SaaS product</p>
                          </div>
                        </div>

                        {/* AI Response */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 }}
                          className="flex justify-start"
                        >
                          <div
                            className="max-w-md p-4 rounded-2xl"
                            style={{
                              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(240, 250, 255, 0.2) 100%)',
                              border: '1px solid rgba(255, 207, 0, 0.4)'
                            }}
                          >
                            <div className="flex items-start gap-3">
                              <Sparkles className="w-5 h-5 mt-1" style={{ color: '#FFCF00' }} />
                              <div>
                                <p className="text-gray-900 dark:text-white mb-3 font-bold">
                                  I'd be happy to help! Let's build a comprehensive marketing plan together. Here are the key areas we should focus on:
                                </p>
                                <ul className="space-y-2 text-sm text-gray-800 dark:text-gray-100 font-medium">
                                  <li className="flex items-start gap-2">
                                    <ChevronRight className="w-4 h-4 mt-0.5" style={{ color: '#FFCF00' }} />
                                    <span>Content marketing & SEO strategy</span>
                                  </li>
                                  <li className="flex items-start gap-2">
                                    <ChevronRight className="w-4 h-4 mt-0.5" style={{ color: '#FFCF00' }} />
                                    <span>Social media presence & community building</span>
                                  </li>
                                  <li className="flex items-start gap-2">
                                    <ChevronRight className="w-4 h-4 mt-0.5" style={{ color: '#FFCF00' }} />
                                    <span>Paid advertising campaigns (Google, Facebook)</span>
                                  </li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </motion.div>

                        {messageCount > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex justify-end"
                          >
                            <div
                              className="max-w-xs p-4 rounded-2xl"
                              style={{
                                background: 'linear-gradient(135deg, rgba(0, 224, 255, 0.4) 0%, rgba(0, 200, 255, 0.5) 100%)',
                                border: '1px solid rgba(0, 224, 255, 0.6)'
                              }}
                            >
                              <p className="text-gray-900 dark:text-white font-bold">This looks great! Let's start with content marketing.</p>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </div>

                    {/* Chat Input */}
                    <div className="flex gap-3">
                      <input
                        type="text"
                        placeholder="Ask your AI Cofounder anything..."
                        className="flex-1 px-6 py-4 rounded-2xl backdrop-blur-md text-gray-900 dark:text-white placeholder-gray-700 dark:placeholder-gray-300 font-bold"
                        style={{
                          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(240, 250, 255, 0.2) 100%)',
                          border: '1px solid rgba(255, 207, 0, 0.4)'
                        }}
                        onClick={() => {
                          setIsAutoPlaying(false);
                        }}
                      />
                      <button
                        onClick={handleSendMessage}
                        className="px-6 py-4 rounded-2xl transition-all duration-300 hover:scale-105"
                        style={{
                          background: 'linear-gradient(135deg, rgba(255, 207, 0, 0.9) 0%, rgba(255, 180, 0, 1) 100%)',
                          boxShadow: '0 4px 12px rgba(255, 207, 0, 0.3)'
                        }}
                      >
                        <Send className="w-5 h-5 text-black" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {currentScreen === 'product' && (
                  <motion.div
                    key="product"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
                      Product Management
                    </h2>

                    {/* Product Roadmap */}
                    <div
                      className="p-6 rounded-2xl mb-6"
                      style={{
                        background: 'linear-gradient(135deg, rgba(0, 224, 255, 0.2) 0%, rgba(0, 200, 255, 0.25) 100%)',
                        border: '1px solid rgba(0, 224, 255, 0.4)'
                      }}
                    >
                      <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Active Features</h3>
                      <div className="space-y-3">
                        {[
                          { feature: 'User Authentication', status: 'Live', progress: 100, color: '#6CFF6C' },
                          { feature: 'Payment Integration', status: 'In Progress', progress: 65, color: '#FFCF00' },
                          { feature: 'Mobile App', status: 'Planning', progress: 20, color: '#FF4F4F' }
                        ].map((item, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 + i * 0.1 }}
                            className="p-4 rounded-xl"
                            style={{ background: 'rgba(255, 255, 255, 0.08)' }}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-bold text-gray-900 dark:text-white">{item.feature}</span>
                              <span className="text-sm font-bold" style={{ color: item.color }}>
                                {item.status}
                              </span>
                            </div>
                            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0, 0, 0, 0.3)' }}>
                              <motion.div
                                initial={{ width: '0%' }}
                                animate={{ width: `${item.progress}%` }}
                                transition={{ delay: 0.5 + i * 0.1, duration: 0.8 }}
                                className="h-full rounded-full"
                                style={{ background: item.color }}
                              />
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Product Metrics */}
                    <div className="grid grid-cols-3 gap-4">
                      <div
                        className="p-5 rounded-2xl"
                        style={{
                          background: 'linear-gradient(135deg, rgba(108, 255, 108, 0.2) 0%, rgba(80, 230, 80, 0.25) 100%)',
                          border: '1px solid rgba(108, 255, 108, 0.4)'
                        }}
                      >
                        <div className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">94%</div>
                        <div className="text-sm text-gray-800 dark:text-gray-200 font-bold">Customer Satisfaction</div>
                      </div>
                      <div
                        className="p-5 rounded-2xl"
                        style={{
                          background: 'linear-gradient(135deg, rgba(255, 207, 0, 0.2) 0%, rgba(255, 180, 0, 0.25) 100%)',
                          border: '1px solid rgba(255, 207, 0, 0.4)'
                        }}
                      >
                        <div className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">23</div>
                        <div className="text-sm text-gray-800 dark:text-gray-200 font-bold">Feature Requests</div>
                      </div>
                      <div
                        className="p-5 rounded-2xl"
                        style={{
                          background: 'linear-gradient(135deg, rgba(255, 79, 79, 0.2) 0%, rgba(255, 60, 60, 0.25) 100%)',
                          border: '1px solid rgba(255, 79, 79, 0.4)'
                        }}
                      >
                        <div className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">8</div>
                        <div className="text-sm text-gray-800 dark:text-gray-200 font-bold">Bug Reports</div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {currentScreen === 'marketing' && (
                  <motion.div
                    key="marketing"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
                      Marketing Hub
                    </h2>

                    {/* Campaign Performance */}
                    <div
                      className="p-6 rounded-2xl mb-6"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255, 207, 0, 0.2) 0%, rgba(255, 180, 0, 0.25) 100%)',
                        border: '1px solid rgba(255, 207, 0, 0.4)'
                      }}
                    >
                      <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Active Campaigns</h3>
                      <div className="space-y-3">
                        {[
                          { campaign: 'Email Newsletter', reach: '12.4K', engagement: '8.3%', color: '#00E0FF' },
                          { campaign: 'Social Media Ads', reach: '45.2K', engagement: '5.1%', color: '#FFCF00' },
                          { campaign: 'Content Marketing', reach: '28.7K', engagement: '12.8%', color: '#6CFF6C' }
                        ].map((item, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 + i * 0.1 }}
                            className="p-4 rounded-xl flex items-center justify-between"
                            style={{ background: 'rgba(255, 255, 255, 0.08)' }}
                          >
                            <div>
                              <div className="font-bold text-gray-900 dark:text-white mb-1">{item.campaign}</div>
                              <div className="text-sm text-gray-800 dark:text-gray-200 font-medium">Reach: {item.reach} | Engagement: {item.engagement}</div>
                            </div>
                            <TrendingUp className="w-5 h-5" style={{ color: item.color }} />
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Marketing Metrics */}
                    <div className="grid grid-cols-3 gap-4">
                      <div
                        className="p-5 rounded-2xl"
                        style={{
                          background: 'linear-gradient(135deg, rgba(0, 224, 255, 0.2) 0%, rgba(0, 200, 255, 0.25) 100%)',
                          border: '1px solid rgba(0, 224, 255, 0.4)'
                        }}
                      >
                        <div className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">86.2K</div>
                        <div className="text-sm text-gray-800 dark:text-gray-200 font-bold">Total Reach</div>
                      </div>
                      <div
                        className="p-5 rounded-2xl"
                        style={{
                          background: 'linear-gradient(135deg, rgba(108, 255, 108, 0.2) 0%, rgba(80, 230, 80, 0.25) 100%)',
                          border: '1px solid rgba(108, 255, 108, 0.4)'
                        }}
                      >
                        <div className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">$2.4K</div>
                        <div className="text-sm text-gray-800 dark:text-gray-200 font-bold">Ad Spend</div>
                      </div>
                      <div
                        className="p-5 rounded-2xl"
                        style={{
                          background: 'linear-gradient(135deg, rgba(255, 207, 0, 0.2) 0%, rgba(255, 180, 0, 0.25) 100%)',
                          border: '1px solid rgba(255, 207, 0, 0.4)'
                        }}
                      >
                        <div className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">3.2x</div>
                        <div className="text-sm text-gray-800 dark:text-gray-200 font-bold">ROI</div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {currentScreen === 'sales' && (
                  <motion.div
                    key="sales"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
                      Sales Pipeline
                    </h2>

                    {/* Sales Funnel */}
                    <div
                      className="p-6 rounded-2xl mb-6"
                      style={{
                        background: 'linear-gradient(135deg, rgba(108, 255, 108, 0.2) 0%, rgba(80, 230, 80, 0.25) 100%)',
                        border: '1px solid rgba(108, 255, 108, 0.4)'
                      }}
                    >
                      <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Pipeline Stages</h3>
                      <div className="space-y-3">
                        {[
                          { stage: 'Leads', count: 142, value: '$284K', width: '100%' },
                          { stage: 'Qualified', count: 67, value: '$201K', width: '75%' },
                          { stage: 'Proposal', count: 23, value: '$115K', width: '50%' },
                          { stage: 'Closed', count: 12, value: '$60K', width: '25%' }
                        ].map((item, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, scaleX: 0 }}
                            animate={{ opacity: 1, scaleX: 1 }}
                            transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                            style={{ transformOrigin: 'left' }}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-bold text-gray-900 dark:text-white">{item.stage}</span>
                              <span className="text-sm text-gray-800 dark:text-gray-200 font-medium">{item.count} deals • {item.value}</span>
                            </div>
                            <div
                              className="h-3 rounded-full"
                              style={{
                                width: item.width,
                                background: 'linear-gradient(90deg, #6CFF6C 0%, #50E650 100%)',
                                boxShadow: '0 2px 8px rgba(108, 255, 108, 0.3)'
                              }}
                            />
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Sales Metrics */}
                    <div className="grid grid-cols-3 gap-4">
                      <div
                        className="p-5 rounded-2xl"
                        style={{
                          background: 'linear-gradient(135deg, rgba(108, 255, 108, 0.2) 0%, rgba(80, 230, 80, 0.25) 100%)',
                          border: '1px solid rgba(108, 255, 108, 0.4)'
                        }}
                      >
                        <div className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">$60K</div>
                        <div className="text-sm text-gray-800 dark:text-gray-200 font-bold">Closed This Month</div>
                      </div>
                      <div
                        className="p-5 rounded-2xl"
                        style={{
                          background: 'linear-gradient(135deg, rgba(255, 207, 0, 0.2) 0%, rgba(255, 180, 0, 0.25) 100%)',
                          border: '1px solid rgba(255, 207, 0, 0.4)'
                        }}
                      >
                        <div className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">32%</div>
                        <div className="text-sm text-gray-800 dark:text-gray-200 font-bold">Win Rate</div>
                      </div>
                      <div
                        className="p-5 rounded-2xl"
                        style={{
                          background: 'linear-gradient(135deg, rgba(0, 224, 255, 0.2) 0%, rgba(0, 200, 255, 0.25) 100%)',
                          border: '1px solid rgba(0, 224, 255, 0.4)'
                        }}
                      >
                        <div className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">18 days</div>
                        <div className="text-sm text-gray-800 dark:text-gray-200 font-bold">Avg. Sales Cycle</div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {currentScreen === 'finance' && (
                  <motion.div
                    key="finance"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
                      Financial Overview
                    </h2>

                    {/* Revenue Chart */}
                    <div
                      className="p-6 rounded-2xl mb-6"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255, 79, 79, 0.2) 0%, rgba(255, 60, 60, 0.25) 100%)',
                        border: '1px solid rgba(255, 79, 79, 0.4)'
                      }}
                    >
                      <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Monthly Revenue Trend</h3>
                      <div className="h-48 flex items-end gap-4 justify-between">
                        {[40, 55, 45, 70, 65, 85, 100].map((height, i) => (
                          <motion.div
                            key={i}
                            initial={{ height: 0 }}
                            animate={{ height: `${height}%` }}
                            transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
                            className="flex-1 rounded-t-lg"
                            style={{
                              background: 'linear-gradient(180deg, rgba(255, 79, 79, 0.8) 0%, rgba(255, 60, 60, 1) 100%)',
                              boxShadow: '0 -4px 12px rgba(255, 79, 79, 0.3)'
                            }}
                          />
                        ))}
                      </div>
                      <div className="flex justify-between mt-4 text-sm text-gray-800 dark:text-gray-200 font-bold">
                        <span>Jan</span>
                        <span>Feb</span>
                        <span>Mar</span>
                        <span>Apr</span>
                        <span>May</span>
                        <span>Jun</span>
                        <span>Jul</span>
                      </div>
                    </div>

                    {/* Financial Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                      <div
                        className="p-5 rounded-2xl"
                        style={{
                          background: 'linear-gradient(135deg, rgba(108, 255, 108, 0.2) 0%, rgba(80, 230, 80, 0.25) 100%)',
                          border: '1px solid rgba(108, 255, 108, 0.4)'
                        }}
                      >
                        <div className="text-sm text-gray-800 dark:text-gray-200 mb-2 font-bold">Total Revenue</div>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white">
                          $87.5K
                        </div>
                      </div>

                      <div
                        className="p-5 rounded-2xl"
                        style={{
                          background: 'linear-gradient(135deg, rgba(255, 207, 0, 0.2) 0%, rgba(255, 180, 0, 0.25) 100%)',
                          border: '1px solid rgba(255, 207, 0, 0.4)'
                        }}
                      >
                        <div className="text-sm text-gray-800 dark:text-gray-200 mb-2 font-bold">Expenses</div>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white">
                          $23.2K
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {currentScreen === 'hr' && (
                  <motion.div
                    key="hr"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
                      Human Resources
                    </h2>

                    {/* Team Overview */}
                    <div
                      className="p-6 rounded-2xl mb-6"
                      style={{
                        background: 'linear-gradient(135deg, rgba(0, 224, 255, 0.2) 0%, rgba(0, 200, 255, 0.25) 100%)',
                        border: '1px solid rgba(0, 224, 255, 0.4)'
                      }}
                    >
                      <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Team Members</h3>
                      <div className="space-y-3">
                        {[
                          { name: 'Sarah Johnson', role: 'CEO', status: 'Active', avatar: '👩‍💼' },
                          { name: 'Michael Chen', role: 'CTO', status: 'Active', avatar: '👨‍💻' },
                          { name: 'Emily Rodriguez', role: 'CMO', status: 'On Leave', avatar: '👩‍🎨' },
                          { name: 'David Kim', role: 'CFO', status: 'Active', avatar: '👨‍💼' }
                        ].map((member, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 + i * 0.1 }}
                            className="p-4 rounded-xl flex items-center justify-between"
                            style={{ background: 'rgba(255, 255, 255, 0.08)' }}
                          >
                            <div className="flex items-center gap-3">
                              <div className="text-3xl">{member.avatar}</div>
                              <div>
                                <div className="font-bold text-gray-900 dark:text-white">{member.name}</div>
                                <div className="text-sm text-gray-800 dark:text-gray-200 font-medium">{member.role}</div>
                              </div>
                            </div>
                            <div
                              className="px-3 py-1 rounded-full text-sm font-medium"
                              style={{
                                background: member.status === 'Active' ? 'rgba(108, 255, 108, 0.2)' : 'rgba(255, 207, 0, 0.2)',
                                color: member.status === 'Active' ? '#6CFF6C' : '#FFCF00',
                                border: member.status === 'Active' ? '1px solid rgba(108, 255, 108, 0.4)' : '1px solid rgba(255, 207, 0, 0.4)'
                              }}
                            >
                              {member.status}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* HR Metrics */}
                    <div className="grid grid-cols-3 gap-4">
                      <div
                        className="p-5 rounded-2xl"
                        style={{
                          background: 'linear-gradient(135deg, rgba(108, 255, 108, 0.2) 0%, rgba(80, 230, 80, 0.25) 100%)',
                          border: '1px solid rgba(108, 255, 108, 0.4)'
                        }}
                      >
                        <div className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">12</div>
                        <div className="text-sm text-gray-800 dark:text-gray-200 font-bold">Total Employees</div>
                      </div>
                      <div
                        className="p-5 rounded-2xl"
                        style={{
                          background: 'linear-gradient(135deg, rgba(255, 207, 0, 0.2) 0%, rgba(255, 180, 0, 0.25) 100%)',
                          border: '1px solid rgba(255, 207, 0, 0.4)'
                        }}
                      >
                        <div className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">3</div>
                        <div className="text-sm text-gray-800 dark:text-gray-200 font-bold">Open Positions</div>
                      </div>
                      <div
                        className="p-5 rounded-2xl"
                        style={{
                          background: 'linear-gradient(135deg, rgba(0, 224, 255, 0.2) 0%, rgba(0, 200, 255, 0.25) 100%)',
                          border: '1px solid rgba(0, 224, 255, 0.4)'
                        }}
                      >
                        <div className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">92%</div>
                        <div className="text-sm text-gray-800 dark:text-gray-200 font-bold">Satisfaction Rate</div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {currentScreen === 'notes' && (
                  <motion.div
                    key="notes"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Notes & Ideas
                      </h2>
                      <button
                        className="px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105 flex items-center gap-2"
                        style={{
                          background: 'linear-gradient(135deg, rgba(255, 207, 0, 0.4) 0%, rgba(255, 180, 0, 0.5) 100%)',
                          border: '1px solid rgba(255, 207, 0, 0.6)'
                        }}
                        onClick={() => setIsAutoPlaying(false)}
                      >
                        <Plus className="w-5 h-5 text-white" />
                        <span className="font-bold text-gray-900 dark:text-white">New Note</span>
                      </button>
                    </div>

                    {/* Notes Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { title: 'Q3 Product Launch', content: 'Key features to prioritize for upcoming release...', color: '#00E0FF', icon: Box },
                        { title: 'Marketing Ideas', content: 'Brainstorming session notes from team meeting...', color: '#FFCF00', icon: Megaphone },
                        { title: 'Customer Feedback', content: 'Summary of user interviews and feature requests...', color: '#6CFF6C', icon: Users },
                        { title: 'Financial Planning', content: 'Budget allocation for Q4 2024...', color: '#FF4F4F', icon: DollarSign }
                      ].map((note, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.2 + i * 0.1 }}
                          className="p-5 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-105"
                          style={{
                            background: `linear-gradient(135deg, ${note.color}20 0%, ${note.color}30 100%)`,
                            border: `1.5px solid ${note.color}60`
                          }}
                          onClick={() => setIsAutoPlaying(false)}
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <note.icon className="w-5 h-5" style={{ color: note.color }} />
                            <h3 className="font-bold text-gray-900 dark:text-white">{note.title}</h3>
                          </div>
                          <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">{note.content}</p>
                        </motion.div>
                      ))}
                    </div>

                    {/* Quick Actions */}
                    <div className="mt-6 grid grid-cols-3 gap-3">
                      {[
                        { label: 'Meeting Notes', icon: Calendar },
                        { label: 'Task Lists', icon: CheckCircle2 },
                        { label: 'Documents', icon: FileText }
                      ].map((action, i) => (
                        <button
                          key={i}
                          className="p-4 rounded-xl transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
                          style={{
                            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(240, 250, 255, 0.15) 100%)',
                            border: '1px solid rgba(255, 207, 0, 0.3)'
                          }}
                          onClick={() => setIsAutoPlaying(false)}
                        >
                          <action.icon className="w-5 h-5" style={{ color: '#FFCF00' }} />
                          <span className="text-sm font-bold text-gray-900 dark:text-white">{action.label}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {currentScreen === 'integrations' && (
                  <motion.div
                    key="integrations"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
                      Integrations
                    </h2>

                    {/* Connected Apps */}
                    <div
                      className="p-6 rounded-2xl mb-6"
                      style={{
                        background: 'linear-gradient(135deg, rgba(108, 255, 108, 0.2) 0%, rgba(80, 230, 80, 0.25) 100%)',
                        border: '1px solid rgba(108, 255, 108, 0.4)'
                      }}
                    >
                      <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Connected Apps</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { name: 'Stripe', status: 'Connected', color: '#00E0FF', icon: '💳' },
                          { name: 'Slack', status: 'Connected', color: '#6CFF6C', icon: '💬' },
                          { name: 'Amazon Seller', status: 'Connected', color: '#FFCF00', icon: '📦' },
                          { name: 'Hubspot', status: 'Connected', color: '#FF4F4F', icon: '🎯' }
                        ].map((app, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 + i * 0.1 }}
                            className="p-4 rounded-xl flex items-center justify-between"
                            style={{ background: 'rgba(255, 255, 255, 0.08)' }}
                          >
                            <div className="flex items-center gap-3">
                              <div className="text-2xl">{app.icon}</div>
                              <div>
                                <div className="font-bold text-gray-900 dark:text-white">{app.name}</div>
                                <div className="text-xs text-gray-800 dark:text-gray-200 font-medium">{app.status}</div>
                              </div>
                            </div>
                            <Check className="w-5 h-5" style={{ color: app.color }} />
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Available Integrations */}
                    <div>
                      <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Available Integrations</h3>
                      <div className="grid grid-cols-3 gap-3">
                        {['QuickBooks', 'Salesforce', 'TikTok', 'Xero', 'Plaid'].map((app, i) => (
                          <motion.button
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 + i * 0.05 }}
                            className="p-4 rounded-xl transition-all duration-300 hover:scale-105"
                            style={{
                              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(240, 250, 255, 0.15) 100%)',
                              border: '1px solid rgba(108, 255, 108, 0.3)'
                            }}
                            onClick={() => setIsAutoPlaying(false)}
                          >
                            <div className="font-bold text-gray-900 dark:text-white">{app}</div>
                            <div className="text-xs text-gray-800 dark:text-gray-200 font-medium mt-1">Connect</div>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2">
            {screens.map((screen, i) => (
              <button
                key={screen}
                onClick={() => handleScreenClick(screen)}
                className="transition-all duration-300"
                style={{
                  width: currentScreen === screen ? '32px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  background:
                    currentScreen === screen
                      ? 'linear-gradient(90deg, #00E0FF 0%, #FFCF00 100%)'
                      : 'rgba(255, 255, 255, 0.4)'
                }}
              />
            ))}
          </div>
        </motion.div>

        {/* CTA Below Demo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <p className="text-lg text-gray-800 dark:text-gray-100 mb-6 font-medium">
            This is just a preview. Sign up to unlock the full platform and start building your business!
          </p>
          <button
            onClick={() => {
              const pricingSection = document.getElementById('pricing');
              pricingSection?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="bouncy-button px-8 py-4 rounded-2xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center gap-3 text-lg mx-auto"
            style={{
              background: 'linear-gradient(135deg, rgba(0, 224, 255, 0.9) 0%, rgba(0, 200, 255, 1) 100%)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 24px rgba(0, 224, 255, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.3)',
              color: '#FFFFFF'
            }}
          >
            <Sparkles className="w-6 h-6" />
            Get Started Free
          </button>
        </motion.div>
      </div>
    </section>
  );
}
