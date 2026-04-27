import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Sparkles,
  Send,
  Loader2,
  CheckCircle2,
  Rocket,
} from 'lucide-react';
import { supabase } from '../../utils/supabase/client';
import { projectId } from '../../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

interface AGIOnboardingProps {
  businessId: string;
  businessName: string;
  onRoadmapGenerated: () => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function AGIOnboarding({ businessId, businessName, onRoadmapGenerated }: AGIOnboardingProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [readyToGenerate, setReadyToGenerate] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Start the conversation automatically
    startOnboarding();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const startOnboarding = async () => {
    setIsLoading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Please sign in to continue');
        return;
      }

      // Get initial message from AGI
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/agi/onboarding-chat`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            businessId,
            businessName,
            message: null, // No user message yet - AGI will start
            conversationHistory: []
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        const assistantMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        };

        setMessages([assistantMessage]);
        setReadyToGenerate(data.readyToGenerate || false);
      } else {
        toast.error('Failed to start onboarding');
      }
    } catch (error) {
      console.error('Onboarding error:', error);
      toast.error('An error occurred starting onboarding');
    } finally {
      setIsLoading(false);
    }
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Please sign in to continue');
        setIsLoading(false);
        return;
      }

      // Send message to AGI
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/agi/onboarding-chat`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            businessId,
            businessName,
            message: content.trim(),
            conversationHistory: messages
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, assistantMessage]);
        setReadyToGenerate(data.readyToGenerate || false);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const generateRoadmap = async () => {
    setIsGenerating(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Please sign in to continue');
        return;
      }

      toast.loading('Generating your personalized roadmap...', { id: 'generating' });

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/agi/generate-roadmap`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            businessId,
            businessName,
            conversationHistory: messages
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        toast.success('Your personalized roadmap is ready!', { id: 'generating' });
        
        // Give a moment for user to see success message
        setTimeout(() => {
          onRoadmapGenerated();
        }, 1000);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to generate roadmap', { id: 'generating' });
      }
    } catch (error) {
      console.error('Roadmap generation error:', error);
      toast.error('An error occurred generating your roadmap', { id: 'generating' });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div 
      className="flex items-center justify-center min-h-screen"
      style={{ 
        padding: 'var(--spacing-4)',
        background: 'var(--background)',
      }}
    >
      <Card 
        className="w-full max-w-3xl"
        style={{ 
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border)',
        }}
      >
        <CardHeader 
          style={{ 
            padding: 'var(--spacing-6)',
            borderBottom: '1px solid var(--border)',
            textAlign: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--spacing-3)' }}>
            <div 
              style={{ 
                padding: 'var(--spacing-3)',
                borderRadius: 'var(--radius-xl)',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles className="w-8 h-8" style={{ color: '#6366f1' }} />
            </div>
          </div>
          <h2 style={{ fontSize: '1.875rem', marginBottom: 'var(--spacing-2)' }}>
            Welcome to Cofounder AGI
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
            Let's build your personalized roadmap for <strong>{businessName}</strong>
          </p>
        </CardHeader>

        <CardContent 
          style={{ 
            padding: 'var(--spacing-6)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--spacing-4)',
          }}
        >
          {/* Chat Messages */}
          <div 
            style={{
              maxHeight: '400px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--spacing-4)',
              marginBottom: 'var(--spacing-4)',
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
                    maxWidth: '85%',
                    padding: 'var(--spacing-3)',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: message.role === 'user' ? 'var(--primary)' : 'var(--muted)',
                    color: message.role === 'user' ? 'var(--primary-foreground)' : 'var(--foreground)',
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
          </div>

          {/* Input Area or Generate Button */}
          {readyToGenerate ? (
            <div style={{ textAlign: 'center' }}>
              <Button
                onClick={generateRoadmap}
                disabled={isGenerating}
                size="lg"
                style={{
                  borderRadius: 'var(--radius-lg)',
                  background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                  color: 'white',
                  padding: 'var(--spacing-3) var(--spacing-6)',
                  gap: 'var(--spacing-2)',
                  fontSize: '1rem',
                }}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating Your Roadmap...
                  </>
                ) : (
                  <>
                    <Rocket className="w-5 h-5" />
                    Generate My Personalized Roadmap
                  </>
                )}
              </Button>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: 'var(--spacing-3)' }}>
                This will create a custom roadmap across all 6 departments based on your answers
              </p>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(inputMessage);
              }}
              style={{ display: 'flex', gap: 'var(--spacing-2)' }}
            >
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type your answer..."
                disabled={isLoading}
                style={{ flex: 1 }}
              />
              <Button
                type="submit"
                disabled={isLoading || !inputMessage.trim()}
                style={{
                  borderRadius: 'var(--radius-lg)',
                  background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                  color: 'white',
                }}
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
