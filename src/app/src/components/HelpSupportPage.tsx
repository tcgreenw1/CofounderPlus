import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Mail, MessageSquare, ChevronDown, ChevronLeft,
  HelpCircle, FileText, ArrowRight, X, ArrowLeft, Send
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Logo } from './Logo';
import { useIsMobile } from './ui/use-mobile';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { supabase } from '../utils/supabase/client';
import { toast } from 'sonner@2.0.3';

const FAQS = [
  {
    id: 'item-1',
    question: "How do I start my first business?",
    answer: "Starting is easy! Just click 'Start Free' on the homepage or dashboard. Cofounder+ will guide you through a simple questionnaire to understand your skills and interests, then generate a personalized roadmap for you."
  },
  {
    id: 'item-2',
    question: "Is Cofounder+ really free?",
    answer: "Yes, you can start building your business for free. We offer a 'Launch' tier that gives you access to core features. As your business grows, you can upgrade to 'Creator' or 'Builder' plans for advanced AI tools and automation."
  },
  {
    id: 'item-3',
    question: "What if I don't have a business idea?",
    answer: "No problem! Our AI analyzes your personality, strengths, and market trends to suggest viable business ideas that match your profile. You can explore multiple paths before committing."
  },
  {
    id: 'item-4',
    question: "Can I invite my team members?",
    answer: "Absolutely. You can invite co-founders and employees to your workspace. Go to Settings > Team to manage invites and roles."
  },
  {
    id: 'item-5',
    question: "How does the AI Cofounder help me?",
    answer: "Your AI Cofounder acts as a partner, providing daily tasks, strategy advice, marketing copy, and financial insights. It's like having an experienced mentor available 24/7."
  }
];

interface ChatMessage {
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: string;
}

export default function HelpSupportPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState('');
  const [showChatDialog, setShowChatDialog] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [isChatStarted, setIsChatStarted] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const filteredFaqs = FAQS.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleStartChat = async () => {
    setLoading(true);
    try {
      // Get current user if logged in
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/support/chat/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || publicAnonKey}`
        },
        body: JSON.stringify({
          userId: user?.id,
          userEmail: user?.email,
          userName: user?.user_metadata?.name || 'Guest'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSessionId(data.sessionId);
        setIsChatStarted(true);
        setChatHistory([{ 
          role: 'agent', 
          content: "Hello! You've been connected to our support system. How can I help you today?",
          timestamp: new Date().toISOString()
        }]);
      } else {
        const errorText = await response.text();
        console.error('Failed to start chat session. Status:', response.status, 'Error:', errorText);
        
        let errorMessage = 'Could not start chat session. Please try again.';
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.error) errorMessage += ` (${errorJson.error})`;
        } catch (e) {
          errorMessage += ` (Status: ${response.status})`;
        }
        
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      toast.error(`Network error: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || !sessionId) return;
    
    const messageContent = chatMessage.trim();
    setChatMessage('');
    
    // Optimistically add user message
    const newHistory = [
      ...chatHistory, 
      { role: 'user' as const, content: messageContent, timestamp: new Date().toISOString() }
    ];
    setChatHistory(newHistory);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/support/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || publicAnonKey}`
        },
        body: JSON.stringify({
          sessionId,
          message: messageContent,
          role: 'user'
        })
      });

      if (!response.ok) {
        toast.error('Failed to send message');
        // Revert message on error (optional implementation)
      } else {
        // Poll for updates or rely on WebSocket/polling hook
        // For now, we simulate a "system" response if it's the first message or simple acknowledgement
        // In a real app, you'd have a polling mechanism or websocket
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  // Poll for new messages every 3 seconds when chat is active
  useEffect(() => {
    if (!isChatStarted || !sessionId) return;

    const pollInterval = setInterval(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/support/chat/history?sessionId=${sessionId}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token || publicAnonKey}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.messages && data.messages.length > 0) {
            setChatHistory(data.messages);
          }
        }
      } catch (error) {
        console.error('Error polling chat:', error);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [isChatStarted, sessionId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleBack = () => {
    if (isMobile) {
      navigate(-1);
    } else {
      navigate(-1);
    }
  };

  const handleLogoClick = () => {
    // If mobile, go to welcome page (usually root / or /mobile-welcome depending on auth state)
    // The previous instructions said "go back to the welcome page" if user clicks company name
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header - Conditional styling for Mobile vs Desktop */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between relative">
          
          {/* Mobile Layout */}
          <div className="md:hidden w-full flex items-center justify-center">
            {/* Back Button - Top Left */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleBack} 
              className="absolute left-0 top-1/2 -translate-y-1/2 gap-1 px-1 text-blue-500 hover:text-blue-600 hover:bg-transparent font-medium text-base"
            >
              <ChevronLeft className="w-6 h-6 -ml-1" />
              Back
            </Button>
            
            {/* Logo - Center */}
            <div className="cursor-pointer" onClick={handleLogoClick}>
              <Logo size="sm" showText={true} />
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden md:flex items-center justify-between w-full">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <Logo size="sm" />
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container max-w-7xl py-6 md:py-12">
        <div className="max-w-3xl mx-auto h-full">
          {/* Help Content */}
          <div className="space-y-8 flex flex-col h-full overflow-y-auto pr-2">
            {/* Hero Section */}
            <div className="space-y-4">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                How can we help you?
              </h1>
              <p className="text-lg text-muted-foreground">
                Search our knowledge base or chat with our support team.
              </p>
              
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                  className="pl-10 h-12 text-lg rounded-xl shadow-sm" 
                  placeholder="Search for answers..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* FAQs Section */}
            <div className="space-y-4 flex-1">
              <div className="flex items-center gap-2 mb-2">
                <HelpCircle className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold">Frequently Asked Questions</h2>
              </div>
              
              <Card>
                <CardContent className="pt-6">
                  <Accordion type="single" collapsible className="w-full">
                    {filteredFaqs.length > 0 ? (
                      filteredFaqs.map((faq) => (
                        <AccordionItem key={faq.id} value={faq.id}>
                          <AccordionTrigger className="text-left font-medium">
                            {faq.question}
                          </AccordionTrigger>
                          <AccordionContent className="text-muted-foreground">
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No results found for "{searchQuery}". Try different keywords.
                      </div>
                    )}
                  </Accordion>
                </CardContent>
              </Card>
            </div>

            {/* Contact Options (Mobile Only or Secondary) */}
            <div className="block lg:hidden pt-4">
              <Card className="bg-gradient-to-br from-background to-primary/5 border-primary/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                      <Mail className="w-5 h-5" />
                    </div>
                    Email Support
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Prefer email? Send us a detailed message.
                  </p>
                  <Button 
                    className="w-full gap-2" 
                    variant="outline"
                    onClick={() => window.location.href = 'mailto:support@cofounderplus.com'}
                  >
                    <Mail className="w-4 h-4" />
                    support@cofounderplus.com
                  </Button>
                </CardContent>
              </Card>
              
              {/* Chat button hidden */}
            </div>
            
            {/* Desktop Email Option */}
            <div className="hidden lg:block">
               <Card className="bg-muted/30 border-none shadow-none">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Email Support</h3>
                      <p className="text-sm text-muted-foreground">Get a response within 24 hours</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = 'mailto:support@cofounderplus.com'}
                  >
                    Send Email
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Column: Chat Interface (Desktop Only) - HIDDEN */}
          {/* 
          <div className="hidden lg:flex flex-col h-[calc(100vh-140px)] sticky top-24">
            ... chat interface hidden ...
          </div> 
          */}
        </div>
      </main>

      {/* Chat Dialog (Mobile Only) - HIDDEN */}
      {/* 
      <Dialog open={showChatDialog} onOpenChange={setShowChatDialog}>
        ... dialog hidden ...
      </Dialog>
      */}
    </div>
  );
}
