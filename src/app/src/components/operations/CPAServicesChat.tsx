import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Sparkles,
  Send,
  Loader2,
  FileText,
  Calculator,
  TrendingUp,
  DollarSign,
  FileCheck,
  Target,
  PieChart,
  BarChart3,
  Receipt,
  Users,
  ShieldCheck,
  BookOpen,
  Briefcase,
  Scale,
  MessageSquare,
  Lightbulb,
  Zap,
  Settings
} from 'lucide-react';
import { useBusiness } from '../BusinessContext';
import { supabase } from '../../utils/supabase/client';
import { projectId } from '../../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

interface CPAServicesChatProps {
  user: any;
  transactions?: Transaction[];
  hideTabs?: boolean;
}

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  date: string;
  tags?: string[];
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface QuickAction {
  id: string;
  label: string;
  prompt: string;
  icon: React.ElementType;
  category: string;
  description: string;
}

const quickActions: QuickAction[] = [
  // Tax Services
  {
    id: 'quarterly-tax-estimate',
    label: 'Quarterly Tax Estimate',
    prompt: 'Calculate my quarterly estimated taxes based on my current revenue and expenses. What should I pay for this quarter?',
    icon: Calculator,
    category: 'Tax Services',
    description: 'Get quarterly tax calculations'
  },
  {
    id: 'tax-deductions',
    label: 'Find Tax Deductions',
    prompt: 'Review my expenses and identify all potential tax deductions I might be missing. What expenses can I deduct?',
    icon: Receipt,
    category: 'Tax Services',
    description: 'Discover deduction opportunities'
  },
  {
    id: 'tax-strategy',
    label: 'Tax Planning Strategy',
    prompt: 'Create a tax planning strategy for my business. What can I do to minimize my tax liability this year?',
    icon: Target,
    category: 'Tax Services',
    description: 'Optimize your tax position'
  },
  {
    id: 'sales-tax',
    label: 'Sales Tax Guidance',
    prompt: 'Help me understand sales tax requirements for my business. Which states do I need to collect sales tax in?',
    icon: FileCheck,
    category: 'Tax Services',
    description: 'Sales tax compliance help'
  },

  // Financial Analysis
  {
    id: 'profitability-analysis',
    label: 'Profitability Analysis',
    prompt: 'Analyze my profitability. What are my profit margins and how can I improve them?',
    icon: TrendingUp,
    category: 'Financial Analysis',
    description: 'Deep dive into profit margins'
  },
  {
    id: 'cash-flow-review',
    label: 'Cash Flow Review',
    prompt: 'Review my cash flow and tell me if there are any concerns. How healthy is my cash position?',
    icon: DollarSign,
    category: 'Financial Analysis',
    description: 'Assess cash health'
  },
  {
    id: 'expense-optimization',
    label: 'Expense Optimization',
    prompt: 'Analyze my expenses and identify where I can cut costs or optimize spending.',
    icon: PieChart,
    category: 'Financial Analysis',
    description: 'Find cost savings'
  },
  {
    id: 'revenue-trends',
    label: 'Revenue Trends',
    prompt: 'Analyze my revenue trends. What patterns do you see and what should I focus on?',
    icon: BarChart3,
    category: 'Financial Analysis',
    description: 'Revenue pattern analysis'
  },

  // Bookkeeping Services
  {
    id: 'reconciliation-check',
    label: 'Reconciliation Check',
    prompt: 'Check if all my accounts are properly reconciled. Are there any discrepancies I need to address?',
    icon: Scale,
    category: 'Bookkeeping',
    description: 'Verify account accuracy'
  },
  {
    id: 'categorization-review',
    label: 'Categorization Review',
    prompt: 'Review my transaction categorizations and suggest any corrections or improvements.',
    icon: BookOpen,
    category: 'Bookkeeping',
    description: 'Improve categorization'
  },
  {
    id: 'month-end-close',
    label: 'Month-End Close',
    prompt: 'Walk me through the month-end close process. What do I need to complete?',
    icon: FileCheck,
    category: 'Bookkeeping',
    description: 'Close the books properly'
  },
  {
    id: 'financial-statements',
    label: 'Financial Statements',
    prompt: 'Generate my financial statements (P&L, Balance Sheet, Cash Flow) and explain what they mean.',
    icon: FileText,
    category: 'Bookkeeping',
    description: 'Get complete statements'
  },

  // Business Advisory
  {
    id: 'business-health',
    label: 'Business Health Check',
    prompt: 'Give me a comprehensive business health assessment. How is my business performing financially?',
    icon: Briefcase,
    category: 'Business Advisory',
    description: 'Overall health assessment'
  },
  {
    id: 'growth-strategy',
    label: 'Growth Strategy',
    prompt: 'Based on my financials, what strategies should I pursue to grow my business?',
    icon: TrendingUp,
    category: 'Business Advisory',
    description: 'Strategic growth guidance'
  },
  {
    id: 'pricing-analysis',
    label: 'Pricing Analysis',
    prompt: 'Analyze my pricing strategy. Am I pricing my products/services correctly for profitability?',
    icon: DollarSign,
    category: 'Business Advisory',
    description: 'Optimize your pricing'
  },
  {
    id: 'kpi-setup',
    label: 'KPI Setup',
    prompt: 'What key performance indicators (KPIs) should I track for my business?',
    icon: Target,
    category: 'Business Advisory',
    description: 'Track what matters'
  },

  // Compliance & Risk
  {
    id: 'compliance-check',
    label: 'Compliance Review',
    prompt: 'Review my business for compliance issues. What regulations or requirements am I subject to?',
    icon: ShieldCheck,
    category: 'Compliance',
    description: 'Stay compliant'
  },
  {
    id: 'audit-preparation',
    label: 'Audit Preparation',
    prompt: 'Help me prepare for a potential audit. What documentation do I need and what should I organize?',
    icon: FileCheck,
    category: 'Compliance',
    description: 'Be audit-ready'
  },

  // Payroll
  {
    id: 'payroll-setup',
    label: 'Payroll Setup',
    prompt: 'Help me understand what I need to set up payroll for my employees. What are the requirements?',
    icon: Users,
    category: 'Payroll',
    description: 'Get payroll started'
  },
  {
    id: 'contractor-guidance',
    label: '1099 Contractor Guidance',
    prompt: 'Explain the requirements for paying and filing 1099s for contractors. What do I need to do?',
    icon: FileText,
    category: 'Payroll',
    description: 'Manage contractor payments'
  },
];

export function CPAServicesChat({ user, transactions = [], hideTabs = false }: CPAServicesChatProps) {
  const { selectedBusiness } = useBusiness();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [sessionId, setSessionId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Generate session ID on mount
  useEffect(() => {
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(newSessionId);
  }, []);

  useEffect(() => {
    // Load conversation history from session storage
    const savedMessages = sessionStorage.getItem(`cpa-chat-${selectedBusiness?.id}`);
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        setMessages(parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        })));
      } catch (error) {
        console.error('Failed to load chat history:', error);
      }
    } else {
      // Welcome message
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: `👋 Hi! I'm your Cofounder Finance tool, powered by CPA-level expertise with full database access. I can help you with:\n\n• Tax planning and quarterly estimates\n• Financial analysis and forecasting\n• **Add transactions and manage budgets directly**\n• Bookkeeping and reconciliation\n• Business advisory and strategy\n• **Create and update financial records**\n• Compliance and audit preparation\n• Payroll and contractor management\n• Industry-specific accounting automations\n\nI share the same brain and abilities as the main Cofounder chat—I can read and write to your database, add transactions, manage budgets, and more. Just ask!\n\nWhat would you like help with today?`,
          timestamp: new Date()
        }
      ]);
    }
  }, [selectedBusiness?.id]);

  useEffect(() => {
    // Save messages to session storage
    if (messages.length > 1) {
      sessionStorage.setItem(`cpa-chat-${selectedBusiness?.id}`, JSON.stringify(messages));
    }
  }, [messages, selectedBusiness?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || !selectedBusiness) return;

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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Please sign in to continue');
        setIsLoading(false);
        return;
      }

      // Use GPT-5.1 endpoint with function calling - AI can write to database!
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/gpt-5-1-chat`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: content.trim(),
            businessContext: {
              id: selectedBusiness.id,
              name: selectedBusiness.name,
              industry: selectedBusiness.industry,
              description: selectedBusiness.description
            },
            conversationHistory: messages.slice(-10).map(msg => ({
              role: msg.role,
              content: msg.content
            })),
            sessionId: sessionId
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to get response' }));
        console.error('CPA API Error Response:', errorData);
        throw new Error(errorData.error || errorData.details || `API request failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log('CPA API Success Response:', data);
      
      // Handle GPT-5.1 response format { response, functionsExecuted }
      const responseContent = data.response || 'I apologize, but I could not generate a response.';
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseContent,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('❌ CPA Chat Error (FULL DETAILS):', error);
      console.error('Error stack:', error.stack);
      const errorMsg = typeof error?.message === 'string' ? error.message : 'An error occurred. Please try again.';
      toast.error(`CPA Chat Error: ${errorMsg}`);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ ERROR: ${error.message || error.toString() || 'Unknown error occurred'}\n\nPlease check the browser console for full details.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action: QuickAction) => {
    // Switch to chat tab and send the message
    setActiveTab('chat');
    sendMessage(action.prompt);
  };

  const clearChat = () => {
    if (selectedBusiness?.id) {
      sessionStorage.removeItem(`cpa-chat-${selectedBusiness.id}`);
    }
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: `👋 Hi! I'm your Cofounder Finance tool, powered by CPA-level expertise with full database access. I can help you with:\n\n• Tax planning and quarterly estimates\n• Financial analysis and forecasting\n• **Add transactions and manage budgets directly**\n• Bookkeeping and reconciliation\n• Business advisory and strategy\n• **Create and update financial records**\n• Compliance and audit preparation\n• Payroll and contractor management\n• Industry-specific accounting automations\n\nI share the same brain and abilities as the main Cofounder chat—I can read and write to your database, add transactions, manage budgets, and more. Just ask!\n\nWhat would you like help with today?`,
        timestamp: new Date()
      }
    ]);
  };

  const categories = Array.from(new Set(quickActions.map(a => a.category)));
  const filteredActions = selectedCategory === 'all' 
    ? quickActions 
    : quickActions.filter(a => a.category === selectedCategory);

  return (
    <div 
      className="flex flex-col h-full"
      style={{ 
        backgroundColor: 'transparent',
      }}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        {!hideTabs && (
          <TabsList 
            className="grid w-full grid-cols-2"
            style={{
              padding: 'var(--spacing-1)',
              borderRadius: 'var(--radius-xl)',
              marginBottom: 'var(--spacing-4)',
              backgroundColor: 'rgba(255, 255, 255, 0.5)',
              ...(isMobile && {
                position: 'sticky',
                top: '0',
                zIndex: 10,
                marginBottom: 'var(--spacing-3)'
              })
            }}
          >
            <TabsTrigger 
              value="chat"
              style={{
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--spacing-2) var(--spacing-4)',
              }}
            >
              <MessageSquare className="w-4 h-4" style={{ marginRight: 'var(--spacing-2)' }} />
              Chat
            </TabsTrigger>
            <TabsTrigger 
              value="quick-actions"
              style={{
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--spacing-2) var(--spacing-4)',
              }}
            >
              <Zap className="w-4 h-4" style={{ marginRight: 'var(--spacing-2)' }} />
              Quick Actions
            </TabsTrigger>
          </TabsList>
        )}

        <TabsContent value="chat" className="flex-1 flex flex-col min-h-0">
          <Card 
            className="flex-1 flex flex-col min-h-0"
            style={{ 
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border)',
            }}
          >
            <CardHeader 
              style={{ 
                padding: 'var(--spacing-4)',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
                  <div 
                    style={{ 
                      padding: 'var(--spacing-2)',
                      borderRadius: 'var(--radius-lg)',
                      backgroundColor: 'var(--primary-soft)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Sparkles className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                  </div>
                  <div>
                    <CardTitle>Cofounder Finance</CardTitle>
                    <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginTop: 'var(--spacing-1)' }}>
                      CPA-level expertise for your business
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/settings')}
                    style={{ borderRadius: 'var(--radius-lg)' }}
                  >
                    <Settings className="w-4 h-4" style={{ marginRight: 'var(--spacing-1)' }} />
                    Settings
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearChat}
                    style={{ borderRadius: 'var(--radius-lg)' }}
                  >
                    Clear Chat
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent 
              className="flex-1 overflow-y-auto"
              style={{ 
                padding: 'var(--spacing-4)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--spacing-4)',
                maxHeight: 'calc(100vh - 400px)',
                overflowY: 'auto',
              }}
            >
              {messages.map((message) => (
                <div
                  key={message.id}
                  style={{
                    display: 'flex',
                    justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div
                    style={{
                      maxWidth: '80%',
                      padding: 'var(--spacing-3)',
                      borderRadius: 'var(--radius-lg)',
                      backgroundColor: message.role === 'user' ? 'var(--message-user-bg)' : 'var(--message-assistant-bg)',
                      color: message.role === 'user' ? 'var(--message-user-text)' : 'var(--message-assistant-text)',
                      borderWidth: message.role === 'user' ? '0' : '1px',
                      borderColor: message.role === 'user' ? 'transparent' : 'var(--message-assistant-border)',
                      borderStyle: 'solid',
                    }}
                  >
                    <div style={{ whiteSpace: 'pre-wrap' }}>
                      {typeof message.content === 'string' ? message.content : JSON.stringify(message.content)}
                    </div>
                    <div 
                      style={{ 
                        fontSize: '0.75rem',
                        marginTop: 'var(--spacing-2)',
                        opacity: 0.7,
                      }}
                    >
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div
                    style={{
                      padding: 'var(--spacing-3)',
                      borderRadius: 'var(--radius-lg)',
                      backgroundColor: 'var(--muted)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-2)',
                    }}
                  >
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Thinking...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </CardContent>

            <div 
              style={{ 
                padding: 'var(--spacing-4)',
                borderTop: '1px solid var(--border)',
                paddingBottom: 'calc(var(--spacing-4) + env(safe-area-inset-bottom))',
                backgroundColor: 'var(--background)',
              }}
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage(inputMessage);
                }}
                style={{ display: 'flex', gap: 'var(--spacing-2)', alignItems: 'flex-end' }}
              >
                <Textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask about taxes, financial analysis, bookkeeping..."
                  disabled={isLoading}
                  style={{ 
                    flex: 1, 
                    minHeight: '44px',
                    maxHeight: '120px',
                    resize: 'none',
                    borderRadius: 'var(--radius-lg)'
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(inputMessage);
                    }
                  }}
                />
                <Button
                  type="submit"
                  disabled={!inputMessage.trim() || isLoading}
                  style={{ 
                    borderRadius: 'var(--radius-lg)',
                    height: '44px',
                    width: '44px',
                    padding: 0,
                    flexShrink: 0
                  }}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="quick-actions" className="flex-1" style={{ maxHeight: 'calc(100vh - 400px)', overflowY: 'auto' }}>
          <div 
            style={{ 
              padding: 'var(--spacing-4)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--primary-soft)',
              border: '1px solid var(--primary)',
              marginBottom: 'var(--spacing-4)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-3)'
            }}
          >
            <Lightbulb className="w-5 h-5" style={{ color: 'var(--primary)', flexShrink: 0 }} />
            <p style={{ fontSize: '0.875rem', color: 'var(--foreground)' }}>
              Click any quick action below to automatically switch to the chat and start a conversation with your Cofounder
            </p>
          </div>
          <div style={{ marginBottom: 'var(--spacing-4)' }}>
            <div style={{ display: 'flex', gap: 'var(--spacing-2)', flexWrap: 'wrap' }}>
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('all')}
                style={{ borderRadius: 'var(--radius-lg)' }}
              >
                All Services
              </Button>
              {categories.map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  style={{ borderRadius: 'var(--radius-lg)' }}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredActions.map(action => {
              const Icon = action.icon;
              return (
                <Card
                  key={action.id}
                  style={{
                    borderRadius: 'var(--radius-xl)',
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  className="hover:shadow-lg"
                  onClick={() => handleQuickAction(action)}
                >
                  <CardHeader style={{ padding: 'var(--spacing-4)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-3)' }}>
                      <div
                        style={{
                          padding: 'var(--spacing-2)',
                          borderRadius: 'var(--radius-lg)',
                          backgroundColor: 'var(--success-soft)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Icon className="w-5 h-5" style={{ color: 'var(--success)' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ marginBottom: 'var(--spacing-1)' }}>{action.label}</h4>
                        <Badge
                          style={{
                            backgroundColor: 'var(--muted)',
                            color: 'var(--muted-foreground)',
                            borderRadius: 'var(--radius-lg)',
                            padding: 'var(--spacing-1) var(--spacing-2)',
                            fontSize: '0.75rem',
                          }}
                        >
                          {action.category}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent style={{ padding: 'var(--spacing-4)', paddingTop: 0 }}>
                    <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                      {action.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}