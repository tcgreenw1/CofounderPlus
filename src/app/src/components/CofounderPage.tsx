import { Loader2, Send, Trash2, Copy, Sparkles, MessageSquare, TrendingUp, Users, Rocket, AlertCircle, UserCircle, ThumbsUp, ThumbsDown, Info, RotateCcw, Zap, Mic, Volume2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { copyToClipboard } from '../utils/clipboard';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { VisuallyHidden } from './ui/visually-hidden';
import { useBusiness } from './BusinessContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { supabase } from '../utils/supabase/client';
import { CreditsDisplay } from './CreditsDisplay';
import { canMakeAIRequest, trackAIUsage, tokensToCredits } from '../utils/creditsApi';
import { useIsMounted } from '../utils/reactHelpers';
import { useCloudSubscription } from './CloudSubscriptionContext';
import { VoiceFeaturePaywall } from './VoiceFeaturePaywall';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  threadId?: string; // Add thread tracking
  runId?: string; // Add run tracking
}

interface CofounderPageProps {
  user: any;
}

// Helper functions for chat persistence
const getChatStorageKey = (userId: string, businessId?: string) => {
  if (businessId) {
    return `cofounder_chat_${userId}_${businessId}`;
  }
  return `cofounder_chat_${userId}_global`;
};

const saveChatMessages = (userId: string, businessId: string | undefined, messages: Message[], threadId?: string) => {
  try {
    const storageKey = getChatStorageKey(userId, businessId);
    const chatData = {
      messages: messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp.toISOString() // Convert Date to string for storage
      })),
      lastUpdated: new Date().toISOString(),
      businessId: businessId || null,
      threadId: threadId || null // Store thread ID for conversation continuity
    };
    localStorage.setItem(storageKey, JSON.stringify(chatData));
  } catch (error) {
    console.warn('Failed to save chat messages:', error);
  }
};

const loadChatMessages = (userId: string, businessId?: string): { messages: Message[], threadId?: string } => {
  try {
    const storageKey = getChatStorageKey(userId, businessId);
    const savedData = localStorage.getItem(storageKey);
    
    if (savedData) {
      const chatData = JSON.parse(savedData);
      
      // Convert timestamp strings back to Date objects
      const messages = chatData.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));
      
      // If we have messages, return them with thread ID
      if (messages.length > 0) {
        console.log(`Loaded ${messages.length} chat messages from storage`);
        return { messages, threadId: chatData.threadId };
      }
    }
  } catch (error) {
    console.warn('Failed to load chat messages:', error);
  }
  
  // Return default welcome message if no saved messages
  return {
    messages: [
      {
        id: 'welcome',
        type: 'assistant',
        content: "Hi! I'm your cofounder assistant, here to help you build and scale your business with personalized guidance. What business challenge can I help you tackle today?",
        timestamp: new Date()
      }
    ],
    threadId: undefined
  };
};

const clearChatMessages = (userId: string, businessId?: string) => {
  try {
    const storageKey = getChatStorageKey(userId, businessId);
    localStorage.removeItem(storageKey);
  } catch (error) {
    console.warn('Failed to clear chat messages:', error);
  }
};

export const CofounderPage: React.FC<CofounderPageProps> = ({ user }) => {
  const { selectedBusiness } = useBusiness();
  const { subscriptionData } = useCloudSubscription();
  const [isTyping, setIsTyping] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [currentThreadId, setCurrentThreadId] = useState<string | undefined>();
  const [showCapabilitiesModal, setShowCapabilitiesModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isMounted = useIsMounted();
  const hasInitialized = useRef(false);
  const isFirstRender = useRef(true);
  
  // Voice chat state
  const [showVoicePaywall, setShowVoicePaywall] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Check if user has Scale tier for voice features (Scale plan only)
  const userTier = (subscriptionData?.plan || 'free').toLowerCase().trim();
  const isScaleUser = userTier === 'scale';

  // Check for pre-populated question from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const draftQuestion = urlParams.get('question');
    const tutorialContext = urlParams.get('tutorial');
    const roadmapContext = urlParams.get('roadmapContext');
    
    if (draftQuestion) {
      // Decode the question and set it in the input
      const decodedQuestion = decodeURIComponent(draftQuestion);
      setInputMessage(decodedQuestion);
      
      // Clear the URL parameters to clean up the URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      
      // Focus the input for immediate editing
      setTimeout(() => {
        inputRef.current?.focus();
        // Position cursor at the end
        if (inputRef.current) {
          const textarea = inputRef.current;
          textarea.setSelectionRange(textarea.value.length, textarea.value.length);
        }
      }, 100);
    } else if (roadmapContext) {
      // Handle roadmap context - decode and auto-send the message
      try {
        const context = JSON.parse(decodeURIComponent(roadmapContext));
        let contextMessage = `I need help with my roadmap:\n\n`;
        
        if (context.type === 'task') {
          contextMessage += `**Task**: ${context.title}\n`;
          contextMessage += `**Milestone**: ${context.milestoneName || 'Unknown'}\n`;
          contextMessage += `**Description**: ${context.description || 'No description'}\n`;
          contextMessage += `**Time Estimate**: ${context.timeEstimate || 'Not specified'}\n`;
          if (context.completed) {
            contextMessage += `**Status**: ✅ Completed\n`;
          } else {
            contextMessage += `**Status**: ⏳ In Progress\n`;
          }
        } else if (context.type === 'milestone') {
          contextMessage += `**Milestone**: ${context.title}\n`;
          contextMessage += `**Description**: ${context.description || 'No description'}\n`;
          contextMessage += `**Progress**: ${context.completedTasks || 0}/${context.totalTasks || 0} tasks completed\n`;
          if (context.completed) {
            contextMessage += `**Status**: ✅ Completed\n`;
          } else {
            contextMessage += `**Status**: ⏳ In Progress\n`;
          }
        }
        
        contextMessage += `\nCan you help me understand what I need to do and guide me through this?`;
        
        setInputMessage(contextMessage);
        
        // Clear the URL parameters
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
        
        // Auto-submit the message after a brief delay
        setTimeout(() => {
          // We'll trigger the send by creating a synthetic event
          const sendButton = document.querySelector('[data-send-button]') as HTMLButtonElement;
          if (sendButton) {
            sendButton.click();
          }
        }, 500);
      } catch (error) {
        console.error('Failed to parse roadmap context:', error);
      }
    }
  }, []);

  // Check if user has seen the capabilities modal before
  useEffect(() => {
    if (user?.id) {
      const hasSeenCapabilities = localStorage.getItem(`ai_capabilities_seen_${user.id}`);
      if (!hasSeenCapabilities) {
        // Show modal after a short delay to let the page load
        setTimeout(() => {
          setShowCapabilitiesModal(true);
        }, 1000);
      }
    }
  }, [user?.id]);

  // Mark capabilities as seen when modal is closed
  const handleCapabilitiesModalClose = () => {
    setShowCapabilitiesModal(false);
    if (user?.id) {
      localStorage.setItem(`ai_capabilities_seen_${user.id}`, 'true');
    }
  };
  
  // Initialize messages - always start fresh
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      type: 'assistant',
      content: "Hi! I'm your cofounder assistant, here to help you build and scale your business with personalized guidance. What business challenge can I help you tackle today?",
      timestamp: new Date()
    }
  ]);

  // DISABLED: No longer saving messages to localStorage - always start fresh
  // useEffect(() => {
  //   if (user?.id && messages.length > 0) {
  //     saveChatMessages(user.id, selectedBusiness?.id, messages, currentThreadId);
  //   }
  // }, [messages, user?.id, selectedBusiness?.id, currentThreadId]);

  // CRITICAL: Clear localStorage and reset on every mount
  useEffect(() => {
    // Aggressively clear any saved chat data
    if (user?.id) {
      clearChatMessages(user.id, selectedBusiness?.id);
    }
    
    // Force reset to fresh welcome message
    setMessages([
      {
        id: 'welcome',
        type: 'assistant',
        content: "Hi! I'm your cofounder assistant, here to help you build and scale your business with personalized guidance. What business challenge can I help you tackle today?",
        timestamp: new Date()
      }
    ]);
    setCurrentThreadId(undefined);
    hasInitialized.current = true;
    
    console.log('🔄 Cofounder chat reset to fresh state');
  }, [user?.id, selectedBusiness?.id]);
  
  // Additional effect to ensure fresh start when component becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && hasInitialized.current) {
        console.log('👁️ Page visible - resetting chat');
        if (user?.id) {
          clearChatMessages(user.id, selectedBusiness?.id);
        }
        setMessages([
          {
            id: 'welcome',
            type: 'assistant',
            content: "Hi! I'm your cofounder assistant, here to help you build and scale your business with personalized guidance. What business challenge can I help you tackle today?",
            timestamp: new Date()
          }
        ]);
        setCurrentThreadId(undefined);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user?.id, selectedBusiness?.id]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const scrollToTop = () => {
    const messagesContainer = document.querySelector('.messages-container');
    if (messagesContainer) {
      messagesContainer.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Enhanced scroll with multiple attempts to ensure it works
  useEffect(() => {
    // On first render (initial page load), scroll to top on desktop
    if (isFirstRender.current) {
      isFirstRender.current = false;
      
      // Check if desktop view (md breakpoint is 768px)
      const isDesktop = window.innerWidth >= 768;
      
      if (isDesktop) {
        // On desktop, scroll to top on initial load
        setTimeout(() => {
          scrollToTop();
        }, 100);
      } else {
        // On mobile, scroll to bottom to show latest messages
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      }
      
      return;
    }
    
    // For subsequent messages, always scroll to bottom
    // Immediate scroll
    scrollToBottom();
    
    // Backup scroll after animation
    const timer1 = setTimeout(() => {
      scrollToBottom();
    }, 150);
    
    // Final scroll to catch any delayed renders
    const timer2 = setTimeout(() => {
      scrollToBottom();
    }, 500);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [messages]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && isScaleUser) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          console.log('🎤 Voice recognition started');
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
            }
          }

          if (finalTranscript) {
            setInputMessage(prev => prev + finalTranscript);
          }
        };

        recognition.onerror = (event: any) => {
          console.error('🎤 Voice recognition error:', event.error);
          if (event.error === 'no-speech') {
            toast.error('No speech detected. Please try again.');
          } else if (event.error === 'not-allowed') {
            toast.error('Microphone access denied. Please enable microphone permissions.');
          } else {
            toast.error(`Voice recognition error: ${event.error}`);
          }
          stopListening();
        };

        recognition.onend = () => {
          console.log('🎤 Voice recognition ended');
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      } else {
        console.warn('🎤 Speech recognition not supported in this browser');
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors on cleanup
        }
      }
    };
  }, [isScaleUser]);

  // Voice input handlers
  const startListening = () => {
    if (!isScaleUser) {
      setShowVoicePaywall(true);
      return;
    }

    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        toast.success('Listening... Speak now');
      } catch (error) {
        console.error('Error starting recognition:', error);
        toast.error('Failed to start voice input');
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
    }
  };

  // Voice output handler
  const speakResponse = async (text: string) => {
    if (!isScaleUser) {
      setShowVoicePaywall(true);
      return;
    }

    try {
      setIsSpeaking(true);
      
      // Get user session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        throw new Error('User not authenticated');
      }

      // Call backend to generate speech using OpenAI TTS
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/voice/text-to-speech`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ text }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to generate speech');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      setCurrentAudioUrl(audioUrl);

      // Play the audio
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        setIsSpeaking(false);
        setCurrentAudioUrl(null);
      };

      audio.onerror = () => {
        setIsSpeaking(false);
        setCurrentAudioUrl(null);
        toast.error('Failed to play audio');
      };

      await audio.play();
    } catch (error) {
      console.error('Error generating speech:', error);
      toast.error('Failed to generate voice response');
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (currentAudioUrl) {
      URL.revokeObjectURL(currentAudioUrl);
      setCurrentAudioUrl(null);
    }
    setIsSpeaking(false);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isTyping) return;

    // Generate unique IDs using performance.now() for better uniqueness
    const userMessageId = `user-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const userMessage: Message = {
      id: userMessageId,
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    // Add user message immediately
    setMessages(prev => {
      console.log('💬 Adding user message:', userMessageId);
      return [...prev, userMessage];
    });
    
    setInputMessage('');
    setIsTyping(true);

    try {
      // Get user session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        throw new Error('User not authenticated');
      }

      console.log('🤖 Sending message to API...');

      // Call OpenAI Assistant API via our server
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/openai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          message: userMessage.content,
          threadId: currentThreadId, // Pass existing thread ID for conversation continuity
          businessContext: selectedBusiness ? {
            name: selectedBusiness.name,
            industry: selectedBusiness.industry,
            description: selectedBusiness.description,
            businessId: selectedBusiness.id // Pass business ID for credit tracking
          } : null
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        throw new Error(errorData.error || `API request failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Received API response:', { success: data.success, hasMessage: !!data.message });
      
      if (!data.success) {
        throw new Error(data.error || 'AI response was not successful');
      }

      // Ensure we have component is still mounted before updating state
      if (!isMounted()) {
        console.log('⚠️ Component unmounted, skipping message update');
        return;
      }

      // Update thread ID if we got a new one (for first message in conversation)
      if (data.threadId && data.threadId !== currentThreadId) {
        console.log('🧵 Updated thread ID:', data.threadId);
        setCurrentThreadId(data.threadId);
      }

      // Generate unique ID for assistant message
      const assistantMessageId = `assistant-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const assistantMessage: Message = {
        id: assistantMessageId,
        type: 'assistant',
        content: data.message,
        timestamp: new Date(),
        threadId: data.threadId,
        runId: data.runId
      };
      
      console.log('💬 Adding assistant message:', assistantMessageId);
      
      // Check if AI performed any actions and show a quick notification
      if (data.message && (
        data.message.includes('Successfully added income') ||
        data.message.includes('Successfully added expense') ||
        data.message.includes('Successfully created note') ||
        data.message.includes('Successfully added goal') ||
        data.message.includes('Successfully created budget') ||
        data.message.includes('Successfully updated budget')
      )) {
        console.log('🤖 AI Assistant performed an action:', data.message);
      }
      
      // Add assistant message - using callback to ensure we have latest state
      setMessages(prev => {
        const newMessages = [...prev, assistantMessage];
        console.log('📝 Total messages after assistant reply:', newMessages.length);
        return newMessages;
      });
      
      // Force scroll after a brief delay to ensure DOM has updated
      setTimeout(() => {
        scrollToBottom();
      }, 100);
      
    } catch (error: any) {
      console.error('❌ Error calling OpenAI Assistant API:', error);
      
      // Only add error message if component is still mounted
      if (!isMounted()) {
        return;
      }
      
      // Show error message to user
      const errorMessageId = `error-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const errorMessage: Message = {
        id: errorMessageId,
        type: 'assistant',
        content: `I apologize, but I'm having trouble connecting right now. ${error.message}. Please try again in a moment.`,
        timestamp: new Date()
      };
      
      console.log('⚠️ Adding error message:', errorMessageId);
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      // Only update isTyping if component is still mounted
      if (isMounted()) {
        console.log('✅ Finished processing message');
        setIsTyping(false);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyMessage = async (content: string) => {
    const success = await copyToClipboard(content);
    if (success) {
      toast.success('Message copied to clipboard');
    } else {
      toast.error('Failed to copy message');
    }
  };

  const clearChat = () => {
    const defaultMessages = [
      {
        id: 'welcome',
        type: 'assistant' as const,
        content: "Hi! I'm your cofounder assistant, here to help you build and scale your business with personalized guidance. What business challenge can I help you tackle today?",
        timestamp: new Date()
      }
    ];
    
    setMessages(defaultMessages);
    setCurrentThreadId(undefined); // Reset thread ID to start fresh conversation
    
    // Clear from localStorage as well
    if (user?.id) {
      clearChatMessages(user.id, selectedBusiness?.id);
    }
  };

  return (
    <div className="flex flex-col min-h-0 h-full">
      {/* Page Header - Integrated with mobile layout */}
      <div className="flex-shrink-0 p-3 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-600 dark:to-purple-600 rounded-lg flex items-center justify-center">
              <UserCircle className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-600 dark:to-purple-600 bg-clip-text text-transparent">
                Cofounder Assistant
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Your trusted business partner
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <div className="hidden sm:block">
              <CreditsDisplay variant="inline" showUpgrade={false} />
            </div>
            {isScaleUser && (
              <Badge 
                variant="outline" 
                className="text-xs hidden sm:inline-flex"
                style={{
                  borderColor: '#00D4AA',
                  color: '#00D4AA',
                  gap: 'var(--spacing-1)',
                }}
              >
                <Mic className="w-3 h-3" />
                Voice Enabled
              </Badge>
            )}
            {selectedBusiness && (
              <Badge variant="outline" className="text-xs hidden sm:inline-flex">
                {selectedBusiness.name}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCapabilitiesModal(true)}
              className="gap-1 h-8 px-2"
              title="View AI capabilities"
            >
              <Info className="w-3 h-3" />
              <span className="hidden sm:inline">Info</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearChat}
              className="gap-1 h-8 px-2"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">Clear</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Container - Scrollable content area */}
      <div className="messages-container flex-1 overflow-y-auto p-3 space-y-3 roadmap-scroll pb-20">
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`flex gap-2 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.type === 'assistant' && (
              <Avatar className="w-6 h-6 mt-1 flex-shrink-0">
                <AvatarFallback className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                  <UserCircle className="w-3 h-3" />
                </AvatarFallback>
              </Avatar>
            )}
            
            <div className={`max-w-[85%] xl:max-w-[75%] ${message.type === 'user' ? 'order-first' : ''}`}>
              <Card className={`p-3 ${
                message.type === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'glass-morphism'
              }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {typeof message.content === 'string' ? message.content : JSON.stringify(message.content)}
                </p>
                
                {/* Message Actions - only for assistant messages */}
                {message.type === 'assistant' && (
                  <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border/50">
                    {isScaleUser && (
                      <Button
                        variant={isSpeaking ? "default" : "ghost"}
                        size="sm"
                        onClick={() => isSpeaking ? stopSpeaking() : speakResponse(message.content)}
                        className="h-6 px-2 text-xs"
                        disabled={isTyping}
                        style={isSpeaking ? {
                          background: 'var(--success)',
                          color: 'var(--success-foreground)',
                        } : undefined}
                      >
                        <Volume2 
                          className="w-3 h-3 mr-1" 
                          style={isSpeaking ? { 
                            animation: 'pulse 1.5s ease-in-out infinite' 
                          } : undefined}
                        />
                        <span className="hidden sm:inline">{isSpeaking ? 'Stop' : 'Listen'}</span>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyMessage(message.content)}
                      className="h-6 px-2 text-xs"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      <span className="hidden sm:inline">Copy</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-1 text-xs"
                    >
                      <ThumbsUp className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-1 text-xs"
                    >
                      <ThumbsDown className="w-3 h-3" />
                    </Button>
                    <span className="text-xs text-muted-foreground ml-auto hidden sm:inline">
                      {message.timestamp.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                )}
              </Card>
            </div>

            {message.type === 'user' && (
              <Avatar className="w-6 h-6 mt-1 flex-shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            )}
          </motion.div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-2 justify-start"
          >
            <Avatar className="w-6 h-6 mt-1">
              <AvatarFallback className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                <UserCircle className="w-3 h-3" />
              </AvatarFallback>
            </Avatar>
            <Card className="glass-morphism p-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <motion.div
                    className="w-2 h-2 bg-current rounded-full"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                  />
                  <motion.div
                    className="w-2 h-2 bg-current rounded-full"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                  />
                  <motion.div
                    className="w-2 h-2 bg-current rounded-full"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 1 }}
                  />
                </div>
                <span className="text-sm text-muted-foreground">Thinking...</span>
              </div>
            </Card>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Fixed Input Area - Always visible at bottom */}
      <div className="fixed bottom-16 z-10 bg-background/95 backdrop-blur-xl border-t border-border
                      left-0 right-0 
                      md:left-16 
                      lg:left-64 
                      xl:right-80">
        <div className="p-3">
          <div className="flex gap-2 items-end">
            {/* Voice Input Button */}
            <Button
              size="sm"
              variant={isListening ? "default" : "outline"}
              onClick={isListening ? stopListening : startListening}
              disabled={isTyping}
              className="h-9 w-9 p-0 rounded-lg flex-shrink-0"
              style={{
                background: isListening 
                  ? 'var(--action)' 
                  : undefined,
                borderColor: isListening 
                  ? 'var(--action)' 
                  : 'var(--border)',
              }}
            >
              <Mic 
                className="w-4 h-4" 
                style={{ 
                  color: isListening 
                    ? 'var(--action-foreground)' 
                    : undefined 
                }} 
              />
            </Button>

            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask your cofounder assistant anything..."
                className="w-full min-h-[36px] max-h-24 px-3 py-2 pr-9 bg-card border border-border rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary transition-all duration-200 text-sm"
                disabled={isTyping}
                rows={1}
                style={{ 
                  height: 'auto',
                  minHeight: '36px'
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${Math.min(target.scrollHeight, 96)}px`;
                }}
              />
              <Button
                size="sm"
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isTyping}
                className="absolute right-2 bottom-2 h-6 w-6 p-0 rounded-md"
                data-send-button
              >
                <Send className="w-3 h-3" />
              </Button>
            </div>
          </div>
          
          {/* Helper Text - Only on larger screens */}
          <div className="text-center mt-1 hidden sm:block">
            <p className="text-xs text-muted-foreground">
              {isScaleUser ? (
                <>Press Enter to send • Shift+Enter for new line • <Mic className="inline w-3 h-3" /> for voice input</>
              ) : (
                <>Press Enter to send • Shift+Enter for new line</>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* AI Capabilities Side Panel - Desktop Only */}
      <div className="fixed right-4 top-24 w-80 z-10 hidden xl:block">
        <Card className="glass-morphism p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-semibold text-foreground">
              AI Capabilities
            </h3>
          </div>
          
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-foreground">
              <strong className="bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                Cofounder Autopilot
              </strong>—not a chatbot, an operator.
            </p>
            
            <p className="text-sm leading-relaxed text-muted-foreground">
              It doesn't just suggest; it <em>does</em>. Rename your business, spin up offers, update books, move roadmap tasks, and keep your playbooks honest—across finance/sales/marketing/product/HR—while you sleep.
            </p>
            
            <Separator className="my-4" />
            
            <div className="space-y-2">
              <h4 className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                Actions I Can Take
              </h4>
              <div className="grid gap-1">
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                  Add income & expenses
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                  Create & update budgets
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                  Manage dream board goals
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                  Save important notes
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                  Update roadmap progress
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* AI Capabilities Modal */}
      <Dialog open={showCapabilitiesModal} onOpenChange={handleCapabilitiesModalClose}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-cyan-400 rounded-lg flex items-center justify-center">
                <Zap className="w-3 h-3 text-white" />
              </div>
              AI Capabilities
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Learn about what your Cofounder Assistant can do to help automate and manage your business operations.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-foreground">
              <strong className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Cofounder Autopilot
              </strong>—not a chatbot, an operator.
            </p>
            
            <p className="text-sm leading-relaxed text-muted-foreground">
              It doesn't just suggest; it <em>does</em>. Rename your business, spin up offers, update books, move roadmap tasks, and keep your playbooks honest—across finance/sales/marketing/product/HR—while you sleep.
            </p>
            
            <Separator className="my-4" />
            
            <div className="space-y-2">
              <h4 className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                Actions I Can Take
              </h4>
              <div className="grid gap-1">
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                  Add income & expenses
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                  Create & update budgets
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                  Manage dream board goals
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                  Save important notes
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                  Update roadmap progress
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button 
                onClick={handleCapabilitiesModalClose}
                className="w-full text-sm"
              >
                Got it, let's start building!
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Voice Feature Paywall - for non-Scale users */}
      <VoiceFeaturePaywall
        isOpen={showVoicePaywall}
        onClose={() => setShowVoicePaywall(false)}
        currentTier={userTier}
      />
    </div>
  );
};

export default CofounderPage;