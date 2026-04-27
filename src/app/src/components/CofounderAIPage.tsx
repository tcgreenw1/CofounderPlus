import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from './ui/sheet';
import { VisuallyHidden } from './ui/visually-hidden';
import { 
  MessageSquare, Send, Brain, Loader2, Sparkles, Plus,
  Database, FileText, Calculator, TrendingUp, Trash2,
  DollarSign, Users, Briefcase, BookOpen, Menu,
  Target, Zap, CheckCircle, AlertCircle, Edit3,
  ExternalLink, ArrowRight, X, Search, Settings, MapPin, StickyNote,
  Crown, Building2, ChevronDown, HelpCircle, GraduationCap, User, Home, ChevronLeft
} from 'lucide-react';
import { useBusiness } from './BusinessContext';
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';
import { toast } from "sonner@2.0.3";

interface CofounderAIPageProps {
  user?: any;
  userData?: any;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  context?: any;
  actions?: ChatAction[];
  data_used?: string[];
}

interface ChatAction {
  id: string;
  type: 'navigate' | 'create' | 'update' | 'learn';
  label: string;
  description: string;
  url?: string;
  data?: any;
  icon: string;
}

interface ChatSession {
  id: string;
  title: string;
  last_message: string;
  updated_at: string;
  message_count: number;
}

interface BusinessContext {
  industry: string;
  stage: string;
  team_size: number;
  revenue: number;
  goals: string[];
  recent_metrics: any;
  current_challenges: string[];
}

const QUICK_PROMPTS = [
  {
    id: 'add-transaction',
    title: 'Add Transaction',
    description: 'Log income or expense quickly',
    icon: DollarSign,
    color: 'bg-emerald-500',
    prompt: 'Add a transaction to my finance page'
  },
  {
    id: 'check-roadmap',
    title: 'Check My Roadmap',
    description: 'View current tasks and progress',
    icon: Target,
    color: 'bg-amber-500',
    prompt: 'What are my current roadmap tasks and progress?'
  },
  {
    id: 'manage-hr',
    title: 'Manage HR',
    description: 'Team and payroll assistance',
    icon: Users,
    color: 'bg-indigo-500',
    prompt: 'Help me manage my HR - show me my team and help with payroll'
  },
  {
    id: 'business-analysis',
    title: 'Analyze My Business',
    description: 'Get insights from your business data',
    icon: Database,
    color: 'bg-blue-500',
    prompt: 'Analyze my current business situation using all available data. Include insights about my financial health, growth trends, and areas for improvement.'
  },
  {
    id: 'growth-strategy',
    title: 'Growth Strategy',
    description: 'Personalized scaling recommendations',
    icon: TrendingUp,
    color: 'bg-green-500',
    prompt: 'Based on my business stage, industry, and current metrics, what are the top 3 strategies I should focus on for growth? Include specific, actionable steps.'
  },
  {
    id: 'learning-path',
    title: 'What Should I Learn?',
    description: 'Personalized University tutorials',
    icon: BookOpen,
    color: 'bg-orange-500',
    prompt: 'Based on my business needs and current challenges, what should I learn next? Recommend specific tutorials from the University that would help me most right now.'
  }
];

export default function CofounderAIPage({ user, userData }: CofounderAIPageProps) {
  const { selectedBusiness } = useBusiness();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [businessContext, setBusinessContext] = useState<BusinessContext | null>(null);
  const [availableData, setAvailableData] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Session state
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null); // Start with no session to show suggestions
  const [sessionTitle, setSessionTitle] = useState('New Chat');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState('');
  
  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Usage tracking state
  const [aiUsage, setAiUsage] = useState({ usage: 0, limit: 0, remaining: 0, tier: 'free', allowed: true, percentage: 0 });
  const [loadingUsage, setLoadingUsage] = useState(false);
  const [showPaywallDialog, setShowPaywallDialog] = useState(false);
  
  // More menu state for mobile navigation
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  // PERFORMANCE FIX: Clear cache when business changes
  const prevBusinessIdRef = useRef<string | null>(null);
  
  useEffect(() => {
    // If business changed, clear the cache
    if (selectedBusiness?.id && selectedBusiness.id !== prevBusinessIdRef.current) {
      console.log('🤖 PERFORMANCE: Business changed, clearing cache');
      setChatSessions([]);
      setBusinessContext(null);
      setAiUsage({ usage: 0, limit: 0, remaining: 0, tier: 'free', allowed: true, percentage: 0 });
      prevBusinessIdRef.current = selectedBusiness.id;
    }
  }, [selectedBusiness?.id]);

  // PERFORMANCE FIX: Load all data in parallel, non-blocking, with caching
  useEffect(() => {
    if (!user || !selectedBusiness) return;
    
    // Skip if we already have data (caching)
    if (chatSessions.length > 0 && businessContext && aiUsage.limit > 0) {
      console.log('🤖 PERFORMANCE: Using cached data, skipping API calls');
      return;
    }

    // Load all 3 API calls in PARALLEL (not sequential) for maximum speed
    const loadAllDataInParallel = async () => {
      console.log('🤖 PERFORMANCE: Loading all data in parallel...');
      
      try {
        // Fire all 3 API calls simultaneously!
        await Promise.all([
          loadBusinessContext(),
          loadChatSessions(),
          loadAIUsage()
        ]);
        console.log('🤖 PERFORMANCE: All data loaded successfully');
      } catch (error) {
        console.error('🤖 PERFORMANCE: Error loading data (non-blocking):', error);
        // Don't block the UI even if there's an error
      }
    };
    
    // Load in background without blocking
    loadAllDataInParallel();
  }, [user, selectedBusiness, chatSessions.length, businessContext, aiUsage.limit]);

  // Persist current session ID to localStorage whenever it changes
  useEffect(() => {
    if (currentSessionId && typeof window !== 'undefined') {
      localStorage.setItem('cofounder_ai_current_session', currentSessionId);
    }
  }, [currentSessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadBusinessContext = async () => {
    if (!user || !selectedBusiness) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      
      if (!accessToken) return;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/ai/business-context`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            userId: user.id,
            businessId: selectedBusiness.id
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        setBusinessContext(data.context);
        setAvailableData(data.available_data || []);
        console.log('🤖 PERFORMANCE: Business context loaded');
      }
      // Silently ignore errors - business context is optional
    } catch (error) {
      // Silently ignore errors - business context is optional for chat functionality
    }
  };

  const loadChatSessions = async () => {
    if (!user) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      
      if (!accessToken) return;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/ai/chat-sessions?userId=${user.id}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        const sessions = (data.sessions || []).filter(s => s && s.id);
        console.log('🤖 PERFORMANCE: Loaded', sessions.length, 'chat sessions');
        setChatSessions(sessions);
        
        // Always start with a fresh view showing suggestions
        setCurrentSessionId(null);
        setMessages([]);
        setSessionTitle('New Chat');
        if (typeof window !== 'undefined') {
          localStorage.removeItem('cofounder_ai_current_session');
        }
      }
    } catch (error) {
      console.error('Failed to load chat sessions (non-blocking):', error);
    }
  };

  const loadSessionMessages = async (sessionId: string) => {
    if (!user) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      
      if (!accessToken) return;

      console.log('🤖 Loading messages for session:', sessionId);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/ai/chat-history?userId=${user.id}&sessionId=${sessionId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        const messages = data.messages || [];
        console.log('🤖 Loaded', messages.length, 'messages for session:', sessionId);
        setMessages(messages);
      } else {
        console.error('🤖 Failed to load messages, response status:', response.status);
        const errorText = await response.text();
        console.error('🤖 Error response:', errorText);
      }
    } catch (error) {
      console.error('Failed to load session messages:', error);
    }
  };

  const createNewSession = async () => {
    console.log('🤖 Creating new session - showing suggestions');
    
    // Clear everything to show welcome suggestions
    setMessages([]);
    setCurrentSessionId(null); // Set to null so suggestions appear
    setSessionTitle('New Chat');
    
    // Clear localStorage so we don't auto-restore
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cofounder_ai_current_session');
    }
    
    console.log('🤖 New session ready. Suggestions should now be visible!');
  };

  const switchToSession = (session: ChatSession) => {
    console.log('🤖 Switching to session:', session.id, session.title);
    setCurrentSessionId(session.id);
    setSessionTitle(session.title);
    loadSessionMessages(session.id);
  };

  const deleteSession = async (sessionId: string) => {
    try {
      console.log('🗑️ PERFORMANCE: Deleting session:', sessionId);
      
      // PERFORMANCE FIX: Removed 3 debug API calls that were slowing everything down
      // Just get the token and delete - fast and simple!
      
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      
      if (!accessToken) {
        toast.error('Authentication required');
        return;
      }

      // Delete the session - single API call, no debugging overhead
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/ai/chat-sessions/${sessionId}`;
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('🗑️ Response status:', response.status);
      console.log('🗑️ Response status text:', response.statusText);

      if (response.ok) {
        const result = await response.json();
        console.log('🗑️ Session deleted successfully:', result);
        
        // Update local state only after successful deletion
        setChatSessions(prev => prev.filter(s => s.id !== sessionId));
        
        // Switch to another session or create new one if deleting current session
        if (currentSessionId === sessionId) {
          const remainingSessions = chatSessions.filter(s => s.id !== sessionId);
          if (remainingSessions.length > 0) {
            switchToSession(remainingSessions[0]);
          } else {
            createNewSession();
          }
        }
        
        toast.success('Chat session deleted successfully');
      } else {
        let errorText;
        let fullErrorDetails;
        try {
          const errorJson = await response.json();
          fullErrorDetails = errorJson;
          errorText = errorJson.error || errorJson.message || response.statusText;
          console.error('🗑️ Server error response:', errorJson);
          console.error('🗑️ Full error details:', fullErrorDetails);
        } catch {
          errorText = await response.text();
          console.error('🗑️ Server error text:', errorText);
        }
        
        console.error('🗑️ Failed to delete session. Status:', response.status, 'Error:', errorText);
        console.error('🗑️ Full response details:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          url: response.url
        });
        
        // Show more detailed error message
        const detailMessage = fullErrorDetails?.details ? ` (${fullErrorDetails.details})` : '';
        toast.error(`Failed to delete session: ${errorText}${detailMessage}`);
      }
    } catch (error) {
      console.error('🗑️ Network/unexpected error deleting session:', error);
      toast.error(`Failed to delete session: ${error.message}`);
    }
  };

  const updateSessionTitle = async (sessionId: string, newTitle: string) => {
    setChatSessions(prev => 
      prev.map(s => s.id === sessionId ? { ...s, title: newTitle } : s)
    );
    
    if (currentSessionId === sessionId) {
      setSessionTitle(newTitle);
    }
  };

  const loadAIUsage = async () => {
    if (!user || !selectedBusiness || loadingUsage) return;

    // DON'T SET LOADING TRUE - this blocks the UI!
    // setLoadingUsage(true); // REMOVED for performance
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      
      if (!accessToken) return;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/ai/ai-usage/${selectedBusiness.id}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (response.ok) {
        const usageData = await response.json();
        setAiUsage(usageData);
        console.log('🤖 PERFORMANCE: AI usage loaded in background');
      }
    } catch (error) {
      console.error('Failed to load AI usage (non-blocking):', error);
    }
    // No finally block needed - we're not using loading states
  };

  const sendMessage = async (message?: string) => {
    const messageText = message || inputMessage.trim();
    if (!messageText || isLoading) return;

    // Check AI usage limits before sending message
    if (!aiUsage.allowed) {
      setShowPaywallDialog(true);
      return;
    }

    // Create new session if none exists
    let sessionIdToUse = currentSessionId;
    if (!sessionIdToUse) {
      console.log('🤖 No current session, creating new one for message');
      const newSessionId = `session_${Date.now()}`;
      const newSessionTitle = `Chat ${chatSessions.length + 1}`;
      
      sessionIdToUse = newSessionId;
      setCurrentSessionId(newSessionId);
      setSessionTitle(newSessionTitle);
      
      // Add to sessions list
      const newSession: ChatSession = {
        id: newSessionId,
        title: newSessionTitle,
        last_message: '',
        updated_at: new Date().toISOString(),
        message_count: 0
      };
      
      setChatSessions(prev => [newSession, ...prev]);
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('cofounder_ai_current_session', newSessionId);
      }
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      
      if (!accessToken) {
        throw new Error('No access token available');
      }

      // Use ENHANCED endpoint with function calling - AI can write to database!
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/ai/chat-enhanced`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            message: messageText,
            sessionId: sessionIdToUse,
            conversationHistory: messages.slice(-5), // Last 5 messages for context
            businessContext: selectedBusiness ? {
              id: selectedBusiness.id,
              name: selectedBusiness.name,
              industry: selectedBusiness.industry,
              description: selectedBusiness.description
            } : null
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.message,
          timestamp: new Date(),
          context: data.context,
          actions: data.actions || [],
          data_used: data.data_used || []
        };

        setMessages(prev => [...prev, assistantMessage]);
        
        // Update usage data from response
        if (data.usage) {
          setAiUsage(prev => ({
            ...prev,
            usage: data.usage.used,
            remaining: data.usage.remaining,
            allowed: data.usage.remaining > 0
          }));
        }
        
        // Update session title if this is the first message
        if (messages.length === 0 && messageText.length < 50) {
          const title = messageText.substring(0, 40) + (messageText.length > 40 ? '...' : '');
          updateSessionTitle(sessionIdToUse, title);
        }
        
        // Update session in list
        setChatSessions(prev => 
          prev.map(s => s.id === sessionIdToUse ? {
            ...s,
            last_message: messageText,
            updated_at: new Date().toISOString(),
            message_count: s.message_count + 2
          } : s)
        );
        
      } else if (response.status === 429) {
        // Handle rate limit error
        const errorData = await response.json();
        toast.error(errorData.details?.message || 'AI message limit reached');
        
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `I'm sorry, but you've reached your monthly limit of ${errorData.details?.limit || 'unknown'} AI messages for your ${errorData.details?.tier || 'current'} plan. Please upgrade to continue using Cofounder AI.`,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, errorMessage]);
        
        // Update usage state to reflect limit reached
        if (errorData.details) {
          setAiUsage(prev => ({
            ...prev,
            usage: errorData.details.usage,
            limit: errorData.details.limit,
            remaining: 0,
            allowed: false,
            tier: errorData.details.tier
          }));
        }
        
        return; // Don't throw error for rate limits
      } else {
        throw new Error('Failed to get AI response');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message. Please try again.');
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const executeQuickPrompt = async (promptId: string) => {
    const prompt = QUICK_PROMPTS.find(p => p.id === promptId);
    if (prompt && prompt.prompt) {
      await sendMessage(prompt.prompt);
    }
  };

  const executeAction = async (action: ChatAction) => {
    switch (action.type) {
      case 'navigate':
        if (action.url) {
          // Check if it's an internal route (starts with /)
          if (action.url.startsWith('/')) {
            window.location.href = action.url;
          } else {
            window.open(action.url, '_blank');
          }
        }
        break;
        
      case 'learn':
        if (action.url) {
          window.open(action.url, '_blank');
        }
        break;
    }
  };

  const getActionIcon = (iconName: string) => {
    const icons = {
      'external-link': ExternalLink,
      'arrow-right': ArrowRight,
      'book-open': BookOpen,
      'calculator': Calculator,
      'trending-up': TrendingUp,
      'users': Users,
      'briefcase': Briefcase,
      'target': Target,
      'plus': Plus,
      'zap': Zap,
      'dollar-sign': DollarSign
    };
    return icons[iconName] || ArrowRight;
  };

  const filteredSessions = chatSessions.filter(session =>
    session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.last_message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Set body class for mobile chat mode to prevent page scrolling
  useEffect(() => {
    if (isMobile) {
      document.body.classList.add('mobile-chat-mode');
      return () => {
        document.body.classList.remove('mobile-chat-mode');
      };
    }
  }, [isMobile]);

  return (
    <div className={`flex ${isMobile ? 'flex-col min-h-screen fixed inset-0 z-50' : 'h-screen'} bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 ${isMobile ? 'hidden-scrollbar' : ''}`}>
      {/* Sidebar - Hidden on mobile or collapsible on desktop */}
      {!isMobile && (
        <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden border-r border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm`}>
          <div className="h-full flex flex-col">
            {/* Sidebar Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Chat History</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={createNewSession}
                  className="h-8 w-8 p-0"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search chats..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-9"
                />
              </div>
            </div>

            {/* Sessions List */}
            <ScrollArea className="flex-1">
              <div className="p-2">
                {filteredSessions.map((session) => (
                  <div
                    key={session.id}
                    className={`group p-3 rounded-lg mb-2 cursor-pointer transition-all hover:bg-gray-100 dark:hover:bg-gray-800 ${
                      currentSessionId === session.id 
                        ? 'bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }`}
                    onClick={() => switchToSession(session)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <MessageSquare className="w-3 h-3 text-gray-500 flex-shrink-0" />
                          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {session.title}
                          </h3>
                        </div>
                        {session.last_message && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {session.last_message}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {new Date(session.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('Are you sure you want to delete this chat session? This action cannot be undone.')) {
                            deleteSession(session.id);
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {filteredSessions.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No chat sessions yet</p>
                    <p className="text-xs">Start a new conversation!</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col ${isMobile ? 'h-full' : 'min-w-0'}`}>
        {/* Header - Mobile has iOS-style back button, Desktop has sidebar toggle */}
        <header className="glass-morphism backdrop-blur-xl border-b border-white/30 dark:border-blue-500/20 px-3 sm:px-6 py-3 sm:py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              {isMobile ? (
                // iOS-style back button for mobile
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(-1)}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
              ) : (
                // Sidebar toggle for desktop
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="h-8 w-8 p-0"
                >
                  <Menu className="w-4 h-4" />
                </Button>
              )}
                
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    {isEditingTitle ? (
                      <Input
                        value={editTitleValue}
                        onChange={(e) => setEditTitleValue(e.target.value)}
                        onBlur={() => {
                          if (currentSessionId) {
                            updateSessionTitle(currentSessionId, editTitleValue);
                          }
                          setIsEditingTitle(false);
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            if (currentSessionId) {
                              updateSessionTitle(currentSessionId, editTitleValue);
                            }
                            setIsEditingTitle(false);
                          }
                        }}
                        className="h-7 text-lg sm:text-3xl font-semibold"
                        autoFocus
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <h1 className={`${isMobile ? 'text-lg' : 'text-xl sm:text-3xl'} font-semibold truncate`}>
                          {isMobile ? 'Cofounder AI' : sessionTitle}
                        </h1>
                        {!isMobile && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditTitleValue(sessionTitle);
                              setIsEditingTitle(true);
                            }}
                            className="h-6 w-6 p-0 opacity-0 hover:opacity-100 transition-opacity"
                          >
                            <Edit3 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    )}
                    {!isMobile && (
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                        {businessContext ? `Connected to ${selectedBusiness?.name}` : 'AI Assistant'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* AI Usage Display - REMOVED per user request */}
              </div>
            </div>
          </header>

        {/* Chat Messages - ChatGPT-like scrollable area */}
        <div className={`flex-1 overflow-hidden ${isMobile ? 'hidden-scrollbar' : ''}`}>
          <div className={`h-full overflow-y-auto ${isMobile ? 'hidden-scrollbar' : ''}`}>
            <div className={`${isMobile ? 'px-4 pt-8 pb-4' : 'max-w-4xl mx-auto p-6'}`}>
              {/* Welcome State - Show when no messages OR when starting fresh (no session) */}
              {(messages.length === 0 || currentSessionId === null) && (
                <div className={`text-center ${isMobile ? 'py-4' : 'py-12'}`}>
                  <Sparkles className={`${isMobile ? 'w-12 h-12' : 'w-16 h-16'} mx-auto mb-6 text-purple-400`} />
                  <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent`}>
                    Welcome to Cofounder AI!
                  </h2>
                  <p className={`text-gray-600 dark:text-gray-400 ${isMobile ? 'text-sm' : ''} max-w-2xl mx-auto mb-8`}>
                    I have access to your business data and can help with learning, operations, strategy, and tactical decisions. 
                    Let's build something amazing together!
                  </p>
                  
                  {/* Quick Action Suggestions - Always show when no messages or new session */}
                  <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-2 md:grid-cols-3 gap-4'} max-w-4xl mx-auto`}>
                    {/* Quick Prompts */}
                    {QUICK_PROMPTS.map((prompt) => {
                      const IconComponent = prompt.icon;
                      return (
                        <Button
                          key={prompt.id}
                          variant="outline"
                          onClick={() => executeQuickPrompt(prompt.id)}
                          className={`h-auto ${isMobile ? 'p-3' : 'p-4'} text-left bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 transition-all`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-2 ${prompt.color} rounded-lg`}>
                              <IconComponent className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <div className={`font-semibold ${isMobile ? 'text-xs' : 'text-sm'}`}>{prompt.title}</div>
                              <div className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-500 mt-1`}>{prompt.description}</div>
                            </div>
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {/* Messages */}
              <div className={`space-y-${isMobile ? '4' : '6'}`}>
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`${isMobile ? 'max-w-[85%]' : 'max-w-[80%]'} ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                      <div className={`rounded-2xl ${isMobile ? 'p-3' : 'p-4'} ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white ml-auto'
                          : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700'
                      }`}>
                        <div className={`whitespace-pre-wrap ${isMobile ? 'text-sm' : ''}`}>
                          {typeof message.content === 'string' ? message.content : JSON.stringify(message.content)}
                        </div>
                        
                        {/* Data Used Indicators */}
                        {message.data_used && message.data_used.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {message.data_used.map((dataType, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                <Database className="w-3 h-3 mr-1" />
                                {dataType}
                              </Badge>
                            ))}
                          </div>
                        )}
                        
                        {/* Action Buttons */}
                        {message.actions && message.actions.length > 0 && (
                          <div className={`mt-${isMobile ? '3' : '4'} space-y-2`}>
                            {message.actions.map((action) => {
                              const IconComponent = getActionIcon(action.icon);
                              return (
                                <Button
                                  key={action.id}
                                  variant="outline"
                                  size={isMobile ? "sm" : "sm"}
                                  onClick={() => executeAction(action)}
                                  className={`w-full justify-start bg-white hover:bg-gray-50 text-gray-900 border-gray-300 ${isMobile ? 'h-auto py-2' : ''}`}
                                >
                                  <IconComponent className="w-4 h-4 mr-2" />
                                  <div className="text-left">
                                    <div className={`font-medium ${isMobile ? 'text-xs' : ''}`}>{action.label}</div>
                                    <div className={`text-xs text-gray-500 ${isMobile ? 'text-xs' : ''}`}>{action.description}</div>
                                  </div>
                                </Button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      
                      <div className={`text-xs text-gray-500 mt-2 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className={`bg-white dark:bg-gray-800 rounded-2xl ${isMobile ? 'p-3' : 'p-4'} border border-gray-200 dark:border-gray-700`}>
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className={`${isMobile ? 'text-xs' : 'text-sm'}`}>Analyzing your business data...</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </div>
          </div>
        </div>

        {/* Input Area - Fixed at bottom for mobile, ChatGPT style */}
        <div className={`border-t border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm ${isMobile ? 'p-4 pb-20' : 'p-6'} flex-shrink-0`}>
          <div className={`${isMobile ? '' : 'max-w-4xl mx-auto'}`}>
            <div className={`flex ${isMobile ? 'gap-2' : 'gap-3'}`}>
              <div className="flex-1">
                <Textarea
                  placeholder={isMobile ? "Ask me anything..." : "Ask me anything about your business, request analysis, or get learning recommendations..."}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  className={`${isMobile ? 'min-h-[44px] max-h-24 text-sm' : 'min-h-[60px] max-h-32'} resize-none border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400`}
                  disabled={isLoading}
                />
              </div>
              <Button 
                onClick={() => sendMessage()}
                disabled={!inputMessage.trim() || isLoading}
                size={isMobile ? "default" : "lg"}
                className={`${isMobile ? 'h-[44px] w-[44px] p-0' : 'h-[60px]'} bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700`}
              >
                <Send className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
              </Button>
            </div>
            
            {businessContext && !isMobile && (
              <div className="text-xs text-gray-500 mt-3 flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-500" />
                Connected to {selectedBusiness?.name}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* AI Usage Paywall Dialog - Hidden on mobile */}
      {!isMobile && (
        <AlertDialog open={showPaywallDialog} onOpenChange={setShowPaywallDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                AI Message Limit Reached
              </AlertDialogTitle>
              <AlertDialogDescription>
                You've used {aiUsage.usage} out of {aiUsage.limit} AI messages included in your {aiUsage.tier} plan this month.
                <br /><br />
                Upgrade your plan to get more AI messages and continue building with Cofounder AI:
                <br /><br />
                <div className="text-sm font-medium space-y-1">
                  <div>• Creator: 200 messages/month</div>
                  <div>• Builder: 2,000 messages/month</div>
                  <div>• Studio: 20,000 messages/month</div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Continue Browsing</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  window.open('/subscription-dashboard', '_blank');
                  setShowPaywallDialog(false);
                }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Upgrade Plan
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Mobile navigation is now handled by MobileLayout wrapper - no custom nav needed */}
      
      {/* Mobile More Menu Sheet */}
      <Sheet open={moreMenuOpen} onOpenChange={setMoreMenuOpen}>
        <SheetContent 
          side="bottom" 
          className="h-[70vh] mobile-sheet mobile-fade-in"
        >
          <VisuallyHidden>
            <SheetTitle>More Options</SheetTitle>
            <SheetDescription>Access additional features and settings</SheetDescription>
          </VisuallyHidden>
          
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-b border-blue-200/30 dark:border-blue-700/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                  <Menu className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-blue-900 dark:text-blue-100">More Options</h3>
                  <p className="text-xs text-blue-600 dark:text-blue-300">
                    Additional features and settings
                  </p>
                </div>
              </div>
            </div>
            
            {/* Menu Items */}
            <div className="flex-1 p-3 space-y-2 overflow-y-auto">
              {/* New Chat Button */}
              <button
                className="w-full p-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 transition-all duration-200 shadow-lg"
                onClick={() => {
                  setMoreMenuOpen(false);
                  createNewSession();
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Plus className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-semibold">New Chat</h4>
                    <p className="text-sm opacity-90">Start a fresh conversation</p>
                  </div>
                </div>
              </button>

              {/* University */}
              <button
                className="w-full p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-600 transition-all duration-200 text-left"
                onClick={() => {
                  setMoreMenuOpen(false);
                  navigate('/temp-university');
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">University</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Learn and grow your business</p>
                  </div>
                </div>
              </button>

              {/* Support */}
              <button
                className="w-full p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-600 transition-all duration-200 text-left"
                onClick={() => {
                  setMoreMenuOpen(false);
                  navigate('/support');
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center">
                    <HelpCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">Support</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Get help when you need it</p>
                  </div>
                </div>
              </button>

              {/* Profile/Settings */}
              <button
                className="w-full p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-600 transition-all duration-200 text-left"
                onClick={() => {
                  setMoreMenuOpen(false);
                  navigate('/profile');
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">Profile</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Manage your account</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}