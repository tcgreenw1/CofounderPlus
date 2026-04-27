import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import {
  Sparkles,
  Send,
  Loader2,
  Settings,
  Package,
  TrendingUp,
  Users,
  DollarSign,
  Briefcase
} from 'lucide-react';
import { useBusiness } from '../BusinessContext';
import { supabase } from '../../utils/supabase/client';
import { projectId } from '../../utils/supabase/info';
import { toast } from 'sonner@2.0.3';
import { useIsMobile } from '../ui/use-mobile';
import { useNavigate } from 'react-router-dom';

interface UnifiedDepartmentChatProps {
  user?: any;
  department: 'product' | 'marketing' | 'sales' | 'finance' | 'hr' | 'operations';
  placeholder?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  functionsExecuted?: any[];
}

const DEPARTMENT_CONFIG = {
  product: {
    icon: Package,
    title: 'Cofounder Product',
    welcomeMessage: `👋 Hi! I'm your Cofounder Product tool, powered by GPT-5.1. I can help you with:

• Product strategy and roadmap planning
• Feature prioritization and requirements
• User research and customer feedback analysis
• Competitive analysis and market positioning
• Product metrics and KPI tracking
• Go-to-market strategies
• Creating and managing product tasks

I have access to all your business data and can make changes directly. What would you like help with today?`,
  },
  marketing: {
    icon: TrendingUp,
    title: 'Cofounder Marketing',
    welcomeMessage: `👋 Hi! I'm your Cofounder Marketing tool, powered by GPT-5.1. I can help you with:

• Marketing strategy and campaign planning
• Content marketing and SEO
• Social media strategy
• Email marketing campaigns
• Brand positioning and messaging
• Marketing analytics and ROI
• Creating and managing marketing campaigns

I have access to all your business data and can make changes directly. What would you like help with today?`,
  },
  sales: {
    icon: DollarSign,
    title: 'Cofounder Sales',
    welcomeMessage: `👋 Hi! I'm your Cofounder Sales tool, powered by GPT-5.1. I can help you with:

• Sales strategy and pipeline management
• Lead generation and qualification
• Deal closing techniques
• Sales forecasting and reporting
• CRM best practices
• Customer relationship management
• Creating and managing leads and deals

I have access to all your business data and can make changes directly. What would you like help with today?`,
  },
  finance: {
    icon: Briefcase,
    title: 'Cofounder Finance',
    welcomeMessage: `👋 Hi! I'm your Cofounder Finance tool, powered by GPT-5.1. I can help you with:

• Financial planning and budgeting
• Cash flow management
• Financial reporting and analysis
• Tax planning and compliance
• Funding and investment strategies
• Expense tracking and categorization
• Creating transactions, budgets, and forecasts

I have access to all your business data and can make changes directly. What would you like help with today?`,
  },
  hr: {
    icon: Users,
    title: 'Cofounder HR',
    welcomeMessage: `👋 Hi! I'm your Cofounder HR tool, powered by GPT-5.1. I can help you with:

• Hiring and recruitment strategies
• Employee onboarding and training
• Performance management
• Team culture and engagement
• HR policies and compliance
• Compensation and benefits
• Adding and managing team members

I have access to all your business data and can make changes directly. What would you like help with today?`,
  },
  operations: {
    icon: Briefcase,
    title: 'Cofounder Operations',
    welcomeMessage: `👋 Hi! I'm your Cofounder Operations tool, powered by GPT-5.1. I can help you with:

• Streamlining business processes
• Workflow automation and optimization
• Operational efficiency analysis
• Resource allocation and management
• Policy and procedure documentation
• Vendor and inventory management
• Security and compliance monitoring

I have access to all your business data and can make changes directly. What would you like help with today?`,
  },
};

export function UnifiedDepartmentChat({ user, department, placeholder }: UnifiedDepartmentChatProps) {
  const { selectedBusiness } = useBusiness();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const config = DEPARTMENT_CONFIG[department] || DEPARTMENT_CONFIG.product; // Fallback to product if invalid
  const Icon = config.icon;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: config.welcomeMessage,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [viewportHeight, setViewportHeight] = useState(window.visualViewport ? window.visualViewport.height : window.innerHeight);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle viewport resizing (keyboard)
  useEffect(() => {
    if (!isMobile) return;

    const handleResize = () => {
      if (window.visualViewport) {
        setViewportHeight(window.visualViewport.height);
        // Scroll to bottom when viewport resizes (e.g. keyboard opens)
        setTimeout(scrollToBottom, 100);
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
      }
    };
  }, [isMobile]);

  // Generate session ID on mount
  useEffect(() => {
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(newSessionId);
  }, []);

  // Load chat history from session storage
  useEffect(() => {
    if (selectedBusiness?.id) {
      const savedMessages = sessionStorage.getItem(`${department}-chat-${selectedBusiness.id}`);
      if (savedMessages) {
        try {
          const parsed = JSON.parse(savedMessages);
          setMessages(parsed.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          })));
        } catch (e) {
          console.error('Failed to load chat history:', e);
        }
      }
    }
  }, [selectedBusiness, department]);

  // Save chat history to session storage
  useEffect(() => {
    if (selectedBusiness?.id && messages.length > 1) {
      sessionStorage.setItem(`${department}-chat-${selectedBusiness.id}`, JSON.stringify(messages));
    }
  }, [messages, selectedBusiness, department]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      console.log(`🚀 ${config.title} - Starting GPT-5.1 request`);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Please sign in to continue');
        setIsLoading(false);
        return;
      }

      // Use GPT-5.1 endpoint
      const endpoint = `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/gpt-5-1-chat`;
      
      const requestBody = {
        message: content.trim(),
        sessionId: sessionId,
        businessContext: selectedBusiness ? {
          id: selectedBusiness.id,
          name: selectedBusiness.name,
          industry: selectedBusiness.industry,
          description: selectedBusiness.description
        } : undefined,
        conversationHistory: messages.slice(-10).map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      };
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to get response' }));
        console.error(`${config.title} API Error:`, errorData);
        throw new Error(errorData.error || `API request failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log(`${config.title} API Success:`, data);
      
      // Handle GPT-5.1 response format
      const responseContent = data.response || 'I apologize, but I could not generate a response.';
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseContent,
        timestamp: new Date(),
        functionsExecuted: data.functionsExecuted || []
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Show function execution results if any
      if (data.functionsExecuted && data.functionsExecuted.length > 0) {
        const successCount = data.functionsExecuted.filter((f: any) => f.result?.success).length;
        if (successCount > 0) {
          toast.success(`Executed ${successCount} action${successCount > 1 ? 's' : ''} successfully`);
        }
      }
    } catch (error: any) {
      console.error(`❌ ${config.title} Error:`, error);
      toast.error(`${config.title} Error: ${error.message}`);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ Error: ${error.message || 'Unknown error occurred'}`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputMessage);
    }
  };

  return (
    <div 
      className="h-full flex flex-col"
      style={{
        // Remove fixed positioning override for mobile to allow natural flow
        // and avoid keyboard overlap issues
      }}
    >
      <Card 
        className="flex-1 flex flex-col overflow-hidden"
        style={{
          backgroundColor: 'var(--card)',
          borderColor: 'var(--border)',
          borderRadius: isMobile ? 0 : 'var(--radius-lg)',
          border: isMobile ? 'none' : undefined,
          ...(isMobile && {
            height: '100%',
            maxHeight: '100%'
          })
        }}
      >
        <CardHeader 
          className="border-b flex-shrink-0"
          style={{
            borderColor: 'var(--border)',
            padding: 'var(--spacing-4)',
            // Add top padding for safe area on mobile
            paddingTop: isMobile ? 'max(env(safe-area-inset-top), 16px)' : 'var(--spacing-4)'
          }}
        >
          <CardTitle className="flex items-center gap-2">
            <Icon className="w-5 h-5" style={{ color: 'var(--primary)' }} />
            <span style={{ color: 'var(--foreground)' }}>{config.title}</span>
            <Badge 
              className="ml-2"
              style={{
                backgroundColor: 'var(--primary)',
                color: 'var(--primary-foreground)',
              }}
            >
              GPT-5.1
            </Badge>
            {isMobile && (
               <Button 
                variant="ghost" 
                size="icon" 
                className="ml-auto" 
                onClick={() => navigate(-1)}
              >
                <span className="text-xl">×</span>
              </Button>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent 
          className="flex-1 overflow-y-auto p-4 space-y-4"
          style={{
            backgroundColor: 'var(--muted)',
            ...(isMobile && {
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
              flexGrow: 1,
              flexShrink: 1,
              minHeight: 0
            })
          }}
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className="max-w-[80%]"
                style={
                  message.role === 'user'
                    ? {
                        backgroundColor: 'var(--message-user-bg)',
                        color: 'var(--message-user-text)',
                        borderRadius: 'var(--radius-lg)',
                        padding: 'var(--spacing-3)',
                      }
                    : {
                        backgroundColor: 'var(--message-assistant-bg)',
                        borderWidth: '1px',
                        borderColor: 'var(--message-assistant-border)',
                        borderStyle: 'solid',
                        color: 'var(--message-assistant-text)',
                        borderRadius: 'var(--radius-lg)',
                        padding: 'var(--spacing-3)',
                      }
                }
              >
                <div className="whitespace-pre-wrap break-words">
                  {message.content}
                </div>
                
                {/* Show function execution details */}
                {message.functionsExecuted && message.functionsExecuted.length > 0 && (
                  <div 
                    className="mt-2 pt-2 text-xs opacity-75"
                    style={{ 
                      borderTopWidth: '1px',
                      borderTopStyle: 'solid',
                      borderTopColor: message.role === 'user' ? 'rgba(255, 255, 255, 0.3)' : 'var(--border)'
                    }}
                  >
                    <div style={{ fontWeight: 'var(--font-weight-semibold)' }} className="mb-1">Actions Executed:</div>
                    {message.functionsExecuted.map((func: any, idx: number) => (
                      <div key={idx}>
                        • {func.name}: {func.result?.success ? '✅' : '❌'}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div
                className="rounded-lg p-3 flex items-center gap-2"
                style={{
                  backgroundColor: 'var(--muted)',
                  borderWidth: '1px',
                  borderColor: 'var(--border)',
                  borderStyle: 'solid',
                }}
              >
                <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--primary)' }} />
                <span style={{ color: 'var(--muted-foreground)' }}>Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </CardContent>

        <div 
          className="border-t p-4 flex-shrink-0"
          style={{
            borderColor: 'var(--border)',
            backgroundColor: 'var(--card)',
            // Ensure bottom padding accounts for safe area and keyboard
            paddingBottom: 'calc(var(--spacing-4) + env(safe-area-inset-bottom))',
          }}
        >
          <form onSubmit={handleSubmit} className="flex gap-2 items-end">
            <Textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder || `Ask your ${department} questions...`}
              disabled={isLoading}
              className="flex-1 resize-none"
              rows={isMobile ? 1 : 3}
              style={{
                backgroundColor: 'var(--input-background)',
                borderColor: 'var(--border)',
                color: 'var(--foreground)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--spacing-3)',
                minHeight: isMobile ? '44px' : '80px',
                maxHeight: isMobile ? '120px' : '200px',
              }}
            />
            <Button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              size="icon"
              className="flex-shrink-0"
              style={{
                backgroundColor: 'var(--primary)',
                color: 'var(--primary-foreground)',
                borderRadius: 'var(--radius-lg)',
                height: isMobile ? '44px' : '60px',
                width: isMobile ? '44px' : '60px',
              }}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}

// Import Badge component
function Badge({ children, className, style }: { children: React.ReactNode; className?: string; style?: any }) {
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded text-xs ${className}`} style={style}>
      {children}
    </span>
  );
}
