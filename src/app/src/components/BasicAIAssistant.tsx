import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Send, Bot, User, Loader2, Sparkles, CheckCircle } from 'lucide-react';
import { useBusiness } from './BusinessContext';
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';
import { toast } from "sonner@2.0.3";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actions?: Array<{
    id: string;
    label: string;
    action: () => void;
  }>;
}

interface BasicAIAssistantProps {
  user?: any;
}

export default function BasicAIAssistant({ user }: BasicAIAssistantProps) {
  const { selectedBusiness, userBusinesses, setSelectedBusiness } = useBusiness();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const updateBusinessLocally = async (updates: any) => {
    if (!selectedBusiness || !user) return false;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      
      if (!accessToken) throw new Error('No access token');

      // Use the existing business update endpoint
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/businesses/${selectedBusiness.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(updates)
        }
      );

      if (response.ok) {
        const result = await response.json();
        
        // Update the business in the frontend context
        const updatedBusiness = { ...selectedBusiness, ...updates };
        setSelectedBusiness(updatedBusiness);
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to update business:', error);
      return false;
    }
  };

  const processUserMessage = async (message: string) => {
    const lowerMessage = message.toLowerCase();
    
    // Simple pattern matching for business operations
    if (lowerMessage.includes('change') && lowerMessage.includes('name')) {
      // Extract the new name from patterns like "change my business name to X"
      const nameMatch = message.match(/(?:change.*name.*to|rename.*to|call.*it)\s+["']?([^"']+)["']?/i);
      
      if (nameMatch && nameMatch[1]) {
        const newName = nameMatch[1].trim();
        
        const success = await updateBusinessLocally({ name: newName });
        
        if (success) {
          return {
            content: `✅ Perfect! I've successfully changed your business name from "${selectedBusiness?.name}" to "${newName}". The change has been saved and you should see it reflected in your business switcher.`,
            actions: []
          };
        } else {
          return {
            content: `❌ I had trouble updating your business name. This might be due to a server issue or permissions problem. Please try again or check your internet connection.`,
            actions: []
          };
        }
      } else {
        return {
          content: `I understand you want to change your business name! Please tell me the new name you'd like. For example, say "Change my business name to NewCompany" or "Rename my business to My New Business".`,
          actions: []
        };
      }
    }
    
    else if (lowerMessage.includes('change') && lowerMessage.includes('industry')) {
      const industryMatch = message.match(/(?:change.*industry.*to|industry.*is)\s+["']?([^"']+)["']?/i);
      
      if (industryMatch && industryMatch[1]) {
        const newIndustry = industryMatch[1].trim();
        
        const success = await updateBusinessLocally({ industry: newIndustry });
        
        if (success) {
          return {
            content: `✅ Great! I've updated your business industry to "${newIndustry}". This change has been saved to your business profile.`,
            actions: []
          };
        } else {
          return {
            content: `❌ I couldn't update your business industry right now. Please try again.`,
            actions: []
          };
        }
      } else {
        return {
          content: `I can help you change your business industry! Please tell me what industry you're in. For example: "Change my industry to Technology" or "My industry is E-commerce".`,
          actions: []
        };
      }
    }
    
    else if (lowerMessage.includes('business') && (lowerMessage.includes('info') || lowerMessage.includes('about'))) {
      if (selectedBusiness) {
        return {
          content: `Here's your current business information:

**Business Name:** ${selectedBusiness.name}
**Industry:** ${selectedBusiness.industry || 'Not specified'}
**Description:** ${selectedBusiness.description || 'No description provided'}
**Created:** ${new Date(selectedBusiness.created_at).toLocaleDateString()}
**Last Updated:** ${new Date(selectedBusiness.updated_at).toLocaleDateString()}

I can help you update any of this information. Just ask me to change your business name, industry, or description!`,
          actions: []
        };
      } else {
        return {
          content: `You don't have a business selected right now. Please use the business switcher in the top navigation to select a business, or create a new one if you don't have any yet.`,
          actions: []
        };
      }
    }
    
    else if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
      return {
        content: `I'm your Basic AI Assistant! Here's what I can help you with:

🏢 **Business Management:**
• Change your business name: "Change my business name to NewName"
• Update your industry: "Change my industry to Technology"
• View business info: "Tell me about my business"

💡 **Tips:**
• Make sure you have a business selected (use the business switcher)
• Be specific with your requests
• I work directly with your existing business data

What would you like to do?`,
        actions: []
      };
    }
    
    else {
      return {
        content: `I'm a basic AI assistant focused on helping you manage your business information. I can help you:

• Change your business name
• Update your business industry  
• View your business details

Try asking something like "Change my business name to New Company" or "What's my business info?"

If you need more advanced AI features, you might want to try the full CofounderAI system.`,
        actions: []
      };
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    if (!user) {
      toast.error('Please log in to use the AI assistant');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await processUserMessage(userMessage.content);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        actions: response.actions || []
      };

      setMessages(prev => [...prev, assistantMessage]);
      
    } catch (error) {
      console.error('Failed to process message:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I encountered an error processing your request. Please try again.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      toast.error('Failed to process message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 h-screen flex flex-col">
      <Card className="flex-1 flex flex-col">
        <CardHeader className="flex-shrink-0">
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-6 h-6 text-green-600" />
            Basic AI Assistant
            {selectedBusiness && (
              <Badge variant="outline" className="ml-auto flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-green-500" />
                {selectedBusiness.name}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col gap-4">
          {/* Messages Area */}
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 text-green-400" />
                  <h3 className="text-lg font-semibold mb-2">Welcome to Basic AI!</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {selectedBusiness 
                      ? `I can help you manage "${selectedBusiness.name}". Try asking me to change your business name or industry!`
                      : 'Please select a business from the business switcher first, then I can help you manage it.'
                    }
                  </p>
                  <div className="text-sm text-gray-500 space-y-1">
                    <div>💬 "Change my business name to New Company"</div>
                    <div>🏭 "Change my industry to Technology"  </div>
                    <div>ℹ️ "Tell me about my business"</div>
                  </div>
                </div>
              )}
              
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-green-600" />
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white ml-auto'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">
                      {typeof message.content === 'string' ? message.content : JSON.stringify(message.content)}
                    </div>
                    
                    {message.actions && message.actions.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {message.actions.map((action) => (
                          <Button
                            key={action.id}
                            onClick={action.action}
                            variant="outline"
                            size="sm"
                            className="w-full"
                          >
                            {action.label}
                          </Button>
                        ))}
                      </div>
                    )}
                    
                    <div className={`text-xs mt-1 opacity-70 ${
                      message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  
                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Processing...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          
          {/* Input Area */}
          <div className="flex gap-2 pt-4 border-t">
            <Textarea
              placeholder={selectedBusiness ? "Try: Change my business name to..." : "Please select a business first"}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 min-h-[60px] max-h-32 resize-none"
              disabled={isLoading || !selectedBusiness}
            />
            <Button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading || !selectedBusiness}
              size="lg"
              className="h-[60px] px-6"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
          
          {!selectedBusiness && (
            <div className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
              💡 Please select a business from the business switcher in the top navigation to get started.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}