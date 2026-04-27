/**
 * AGI Smart Panel
 * Collapsible frosted glass panel with integrated Cofounder AI chat
 * Uses design system CSS variables and colors (blues, greens, yellows, reds only)
 * Connected to real OpenAI API via centralized cofounder chat system
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  X, 
  Sparkles, 
  Send, 
  Lightbulb, 
  TrendingUp, 
  Target,
  ChevronRight,
  MessageCircle,
  Zap,
  Settings
} from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { ScrollArea } from '../ui/scroll-area';
import { useRoadmap } from '../../contexts/RoadmapContext';
import { useBusiness } from '../BusinessContext';
import { useNotifications } from '../../contexts/NotificationContext';

// Import centralized Cofounder chat system
import { 
  sendCofounderMessage, 
  buildRoadmapContext,
  formatConversationHistory,
  createSpecializedPrompt 
} from '../../utils/cofounderChat';

interface AGISmartPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentNodeId?: string;
  onAskAboutNode?: (nodeId: string) => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Suggestion {
  id: string;
  title: string;
  description: string;
  action: () => void;
  icon: React.ReactNode;
  color: string;
}

export function AGISmartPanel({ 
  isOpen, 
  onClose, 
  currentNodeId,
  onAskAboutNode 
}: AGISmartPanelProps) {
  // Get business and roadmap context
  const { selectedBusiness } = useBusiness();
  const { roadmap, masteryData } = useRoadmap();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your Cofounder. I'm here to help you navigate your roadmap, prioritize tasks, and achieve your goals faster. How can I assist you today?",
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const suggestions: Suggestion[] = [
    {
      id: '1',
      title: 'Optimize My Path',
      description: 'Reorder tasks for maximum efficiency',
      action: () => handleSuggestionClick('Optimize my current roadmap path'),
      icon: <TrendingUp className="size-4" />,
      color: '#2b7fff', // Blue
    },
    {
      id: '2',
      title: 'Quick Wins',
      description: 'Show me easy wins I can complete now',
      action: () => handleSuggestionClick('What are my quick wins?'),
      icon: <Zap className="size-4" />,
      color: '#ffe020', // Yellow
    },
    {
      id: '3',
      title: 'Next Best Step',
      description: 'What should I focus on right now?',
      action: () => handleSuggestionClick('What should I work on next?'),
      icon: <Target className="size-4" />,
      color: '#00a73d', // Green
    },
  ];

  const handleSuggestionClick = (message: string) => {
    handleSendMessage(message);
  };

  const handleSendMessage = async (content?: string) => {
    const messageContent = content || inputValue.trim();
    if (!messageContent) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageContent,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);
    setError(null);

    // Notify user that Cofounder is working
    addNotification({
      title: 'Cofounder Thinking',
      message: 'Analyzing your request...',
      type: 'info',
      category: 'system'
    });

    try {
      // Build roadmap context with current data
      const roadmapContextData = buildRoadmapContext(roadmap, currentNodeId ? { title: currentNodeId } : undefined);
      
      // Format conversation history for the API
      const conversationHistory = formatConversationHistory(messages);

      // Send message to unified Cofounder AI
      const result = await sendCofounderMessage({
        message: messageContent,
        context: {
          ...roadmapContextData,
          businessId: selectedBusiness?.id,
          businessName: selectedBusiness?.name,
          industry: selectedBusiness?.industry,
          userId: selectedBusiness?.userId
        },
        conversationHistory
      });

      if (result.success && result.response) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: result.response,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMessage]);
        
        // Notify user that Cofounder has responded
        addNotification({
          title: 'Cofounder Responded',
          message: 'New insights available in the chat panel.',
          type: 'success',
          category: 'system'
        });
        
        console.log('✅ Roadmap AGI response:', result.response.substring(0, 100) + '...');
      } else {
        throw new Error(result.error || 'Failed to get response');
      }
    } catch (err: any) {
      console.error('❌ Roadmap AGI Error:', err);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I'm having trouble connecting right now. Please try again in a moment. Error: ${err.message}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      setError(err.message || 'Failed to get response from Cofounder');
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(4px)',
              zIndex: 90,
            }}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 bottom-0 w-full sm:w-[440px] sm:max-w-[90vw] z-[95]"
            style={{
              top: 'env(safe-area-inset-top, 0)',
              paddingBottom: 'max(calc(env(safe-area-inset-bottom) + 80px), 80px)', // Increased from 60px to 80px for floating button clearance
            }}
          >
            <div
              className="h-full flex flex-col bg-card/95 border-l"
              style={{
                backdropFilter: 'blur(40px)',
                borderColor: 'var(--border)',
                boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.1)',
              }}
            >
              {/* Header - More compact */}
              <div
                className="flex items-center justify-between border-b flex-shrink-0"
                style={{
                  paddingTop: 'calc(var(--spacing-3) - 2px)',
                  paddingBottom: 'calc(var(--spacing-3) - 2px)',
                  paddingLeft: 'var(--spacing-4)',
                  paddingRight: 'var(--spacing-4)',
                  borderColor: 'var(--border)',
                  background: 'linear-gradient(180deg, rgba(43, 127, 255, 0.05), transparent)',
                }}
              >
                <div className="flex items-center" style={{ gap: 'var(--spacing-2)' }}>
                  <div
                    className="size-8 flex items-center justify-center flex-shrink-0"
                    style={{
                      borderRadius: 'var(--radius-lg)',
                      background: 'linear-gradient(135deg, rgba(43, 127, 255, 0.2), rgba(43, 127, 255, 0.1))',
                      border: '1px solid rgba(43, 127, 255, 0.3)',
                    }}
                  >
                    <Sparkles className="size-4 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-base leading-tight">AI Cofounder</h2>
                    <p className="text-xs text-muted-foreground leading-tight">
                      Always here to help
                    </p>
                  </div>
                </div>
                <div className="flex items-center" style={{ gap: 'var(--spacing-1)' }}>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate('/cofounder-settings')}
                    className="rounded-full flex-shrink-0 size-8"
                    style={{
                      borderRadius: 'var(--radius-lg)',
                    }}
                    title="Cofounder Settings"
                  >
                    <Settings className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="rounded-full flex-shrink-0 size-8"
                    style={{
                      borderRadius: 'var(--radius-lg)',
                    }}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              </div>

              {/* Smart Suggestions - Reduced footprint */}
              <div className="border-b flex-shrink-0" style={{ padding: 'var(--spacing-2) var(--spacing-3)', borderColor: 'var(--border)' }}>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground" style={{ marginBottom: 'var(--spacing-1-5)' }}>
                  Quick Actions
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1-5)' }}>
                  {suggestions.map(suggestion => (
                    <button
                      key={suggestion.id}
                      onClick={suggestion.action}
                      className="w-full text-left transition-all hover:scale-[1.02] active:scale-[0.98] bg-card border"
                      style={{
                        padding: 'var(--spacing-2)',
                        borderRadius: 'var(--radius-lg)',
                        borderColor: 'var(--border)',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                      }}
                    >
                      <div className="flex items-center" style={{ gap: 'var(--spacing-2)' }}>
                        <div
                          className="size-7 flex items-center justify-center flex-shrink-0"
                          style={{
                            borderRadius: 'var(--radius-md)',
                            background: `${suggestion.color}20`,
                            border: `1px solid ${suggestion.color}40`,
                          }}
                        >
                          {React.cloneElement(suggestion.icon as React.ReactElement, {
                            style: { color: suggestion.color }
                          })}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-snug">{suggestion.title}</p>
                          <p className="text-xs text-muted-foreground leading-snug">
                            {suggestion.description}
                          </p>
                        </div>
                        <ChevronRight className="size-4 flex-shrink-0 text-muted-foreground" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Messages - Increased vertical spacing with explicit height and scroll */}
              <div className="flex-1 overflow-y-auto" style={{ padding: 'var(--spacing-4) var(--spacing-3)', maxHeight: 'calc(100vh - 400px)' }} ref={scrollAreaRef}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-5)' }}> {/* Increased gap from spacing-4 to spacing-5 */}
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className="max-w-[85%]"
                        style={{
                          padding: 'var(--spacing-3)',
                          borderRadius: 'var(--radius-xl)',
                          background: message.role === 'user'
                            ? 'linear-gradient(135deg, #2b7fff 0%, #1e5dd9 100%)'
                            : 'var(--muted)',
                          color: message.role === 'user' ? 'white' : 'var(--foreground)',
                          border: message.role === 'assistant' ? '1px solid var(--border)' : 'none',
                          boxShadow: message.role === 'user'
                            ? '0 4px 12px rgba(43, 127, 255, 0.3)'
                            : '0 2px 8px rgba(0, 0, 0, 0.05)',
                        }}
                      >
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">
                          {typeof message.content === 'string' ? message.content : JSON.stringify(message.content)}
                        </p>
                        <p
                          className="text-xs"
                          style={{
                            marginTop: 'var(--spacing-2)',
                            color: message.role === 'user' ? 'rgba(255, 255, 255, 0.7)' : 'var(--muted-foreground)',
                          }}
                        >
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* Typing Indicator */}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div
                        style={{
                          padding: 'var(--spacing-4)',
                          borderRadius: 'var(--radius-xl)',
                          background: 'var(--muted)',
                          border: '1px solid var(--border)',
                        }}
                      >
                        <div className="flex" style={{ gap: 'var(--spacing-1)' }}>
                          <motion.div
                            className="size-2 rounded-full bg-primary"
                            animate={{ y: [0, -8, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                          />
                          <motion.div
                            className="size-2 rounded-full bg-primary"
                            animate={{ y: [0, -8, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                          />
                          <motion.div
                            className="size-2 rounded-full bg-primary"
                            animate={{ y: [0, -8, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Input */}
              <div
                className="border-t bg-muted/50 flex-shrink-0"
                style={{
                  padding: 'var(--spacing-3)',
                  borderColor: 'var(--border)',
                }}
              >
                <div className="flex" style={{ gap: 'var(--spacing-2)' }}>
                  <Textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Ask me anything..."
                    className="resize-none text-sm"
                    rows={1}
                    style={{
                      borderRadius: 'var(--radius-lg)',
                      minHeight: '44px',
                    }}
                  />
                  <Button
                    onClick={() => handleSendMessage()}
                    disabled={!inputValue.trim()}
                    size="icon"
                    className="flex-shrink-0"
                    style={{
                      borderRadius: 'var(--radius-lg)',
                      background: inputValue.trim()
                        ? 'linear-gradient(135deg, #2b7fff, #1e5dd9)'
                        : 'var(--muted)',
                      minHeight: '44px',
                      minWidth: '44px',
                    }}
                  >
                    <Send className="size-5" />
                  </Button>
                </div>
                <p className="text-[10px] mt-1.5 text-center text-muted-foreground hidden sm:block">
                  Press Enter to send • Shift + Enter for new line
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}