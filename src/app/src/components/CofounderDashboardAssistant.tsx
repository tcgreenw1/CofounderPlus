import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';
import { Loader2, Sparkles, MessageSquare, ArrowRight } from 'lucide-react';
import { AVAILABLE_WIDGETS } from './DashboardWidgetCustomizer';

// Import centralized Cofounder chat system
import { 
  sendCofounderMessage, 
  getChatSessions,
  buildDashboardContext,
  buildBusinessContext 
} from '../utils/cofounderChat';

interface CofounderDashboardAssistantProps {
  user: any;
  businessContext: any;
  currentWidgets: string[];
  onApplyLayout: (widgets: string[]) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Question {
  id: string;
  question: string;
  placeholder?: string;
  type: 'text' | 'textarea' | 'select';
  options?: string[];
}

export const CofounderDashboardAssistant: React.FC<CofounderDashboardAssistantProps> = ({
  user,
  businessContext,
  currentWidgets,
  onApplyLayout,
  open,
  onOpenChange
}) => {
  const [step, setStep] = useState<'loading' | 'questions' | 'generating' | 'complete'>('loading');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [cofounderMessage, setCofounderMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      initializeCofounderAssistant();
    } else {
      // Reset state when closed
      setStep('loading');
      setQuestions([]);
      setAnswers({});
      setCofounderMessage('');
      setError(null);
    }
  }, [open]);

  const initializeCofounderAssistant = async () => {
    try {
      setStep('loading');
      setError(null);

      console.log('🤖 Cofounder Dashboard: Loading chat history...');

      // Get user's chat sessions using centralized utility
      const sessionsResult = await getChatSessions(user.id);
      const sessions = sessionsResult.sessions || [];

      console.log(`🤖 Cofounder Dashboard: Found ${sessions.length} chat sessions`);

      // Build a summary of chat history for context
      let historyContext = '';
      if (sessions.length > 0) {
        historyContext = `User has ${sessions.length} previous conversations with their Cofounder. `;
        // Get most recent session for deeper context
        const recentSession = sessions[0];
        if (recentSession.last_message) {
          historyContext += `Most recent topic: "${recentSession.last_message.substring(0, 100)}..."`;
        }
      } else {
        historyContext = 'This is the user\'s first interaction with their Cofounder.';
      }

      console.log('🤖 Cofounder Dashboard: Requesting widget suggestions from unified Cofounder API...');

      // Build context for dashboard-specific recommendations
      const dashboardCtx = buildDashboardContext(currentWidgets, businessContext);
      const businessCtx = buildBusinessContext(businessContext);

      // Ask Cofounder AI for dashboard suggestions using centralized API
      const result = await sendCofounderMessage({
        message: buildCofounderRequest(historyContext),
        context: {
          ...businessCtx,
          ...dashboardCtx,
          userId: user.id
        },
        conversationHistory: []
      });

      if (!result.success || !result.response) {
        throw new Error(result.error || 'Failed to get suggestions from Cofounder');
      }

      console.log('🤖 Cofounder Dashboard: Unified API Response:', result.response);

      parseCofounderResponse(result.response);

    } catch (err: any) {
      console.error('🤖 Cofounder Dashboard: Error:', err);
      setError(err.message || 'Failed to connect with your Cofounder');
      setStep('loading');
    }
  };

  const buildCofounderRequest = (historyContext: string): string => {
    const availableWidgetsList = AVAILABLE_WIDGETS.map(w => `- ${w.name}: ${w.description}`).join('\n');
    
    return `Based on our conversation history and what you know about my business, I need help customizing my dashboard. Here are the available widgets:

${availableWidgetsList}

Current dashboard widgets: ${currentWidgets.join(', ')}

${historyContext}

Please analyze what I need and either:
1. If you have enough context about my business goals and priorities, suggest the best 3-5 widgets for my dashboard
2. If you need more information, ask me 1-3 specific questions that will help you make better recommendations

Your response should be in this format:
If suggesting widgets:
WIDGETS: widget-id-1, widget-id-2, widget-id-3
REASON: Brief explanation of why these widgets will help me

If asking questions:
QUESTIONS:
1. [Question text]
2. [Question text]

Be concise and specific. Remember, you're my Cofounder, not just a tool.`;
  };

  const parseCofounderResponse = (response: string) => {
    console.log('🤖 Parsing Cofounder response:', response);

    // Check if response contains widget suggestions
    if (response.includes('WIDGETS:')) {
      const widgetMatch = response.match(/WIDGETS:\s*([^\n]+)/);
      const reasonMatch = response.match(/REASON:\s*([^\n]+)/);

      if (widgetMatch) {
        const widgetIds = widgetMatch[1]
          .split(',')
          .map(w => w.trim())
          .filter(w => AVAILABLE_WIDGETS.some(widget => widget.id === w));

        if (widgetIds.length > 0) {
          // Automatically apply the layout
          console.log('🤖 Auto-applying Cofounder-suggested layout:', widgetIds);
          onApplyLayout(widgetIds);
          
          // Show completion message
          setCofounderMessage(reasonMatch ? reasonMatch[1] : 'I\'ve optimized your dashboard based on what I know about your business.');
          setStep('complete');
          return;
        }
      }
    }

    // Check if response contains questions
    if (response.includes('QUESTIONS:')) {
      const questionsSection = response.split('QUESTIONS:')[1];
      const questionLines = questionsSection
        .split('\n')
        .filter(line => line.trim().match(/^\d+\./))
        .map((line, index) => {
          const cleanQuestion = line.replace(/^\d+\.\s*/, '').trim();
          return {
            id: `q${index}`,
            question: cleanQuestion,
            placeholder: '',
            type: 'textarea' as const
          };
        });

      if (questionLines.length > 0) {
        setQuestions(questionLines);
        setCofounderMessage('I need to understand a bit more about your priorities to personalize your dashboard perfectly.');
        setStep('questions');
        return;
      }
    }

    // Fallback: Try to extract widget suggestions from natural language
    const extractedWidgets = AVAILABLE_WIDGETS
      .filter(widget => 
        response.toLowerCase().includes(widget.name.toLowerCase()) ||
        response.toLowerCase().includes(widget.id)
      )
      .map(w => w.id)
      .slice(0, 5);

    if (extractedWidgets.length > 0) {
      // Auto-apply fallback widgets
      console.log('🤖 Auto-applying extracted widgets:', extractedWidgets);
      onApplyLayout(extractedWidgets);
      setCofounderMessage('I\'ve personalized your dashboard based on our conversation.');
      setStep('complete');
    } else {
      // If we can't parse anything useful, show an error
      setError('I had trouble understanding my response. Let me try again.');
      setTimeout(() => {
        initializeCofounderAssistant();
      }, 2000);
    }
  };

  const handleAnswerSubmit = async () => {
    try {
      setStep('generating');

      // Format answers for Cofounder
      const answersText = questions
        .map(q => `${q.question}\nAnswer: ${answers[q.id] || 'Not answered'}`)
        .join('\n\n');

      const followUpMessage = `Based on my previous questions, here are my answers:

${answersText}

Now, please suggest the best 3-5 dashboard widgets for me using this format:
WIDGETS: widget-id-1, widget-id-2, widget-id-3
REASON: Brief explanation`;

      // Build context for dashboard-specific recommendations
      const dashboardCtx = buildDashboardContext(currentWidgets, businessContext);
      const businessCtx = buildBusinessContext(businessContext);

      // Send follow-up message using centralized API
      const result = await sendCofounderMessage({
        message: followUpMessage,
        context: {
          ...businessCtx,
          ...dashboardCtx,
          userId: user.id
        },
        conversationHistory: []
      });

      if (!result.success || !result.response) {
        throw new Error(result.error || 'Failed to get updated suggestions');
      }

      console.log('🤖 Cofounder Dashboard: Follow-up response:', result.response);
      parseCofounderResponse(result.response);

    } catch (err: any) {
      console.error('🤖 Error submitting answers:', err);
      setError(err.message || 'Failed to process your answers');
      setStep('questions');
    }
  };

  const getWidgetInfo = (widgetId: string) => {
    return AVAILABLE_WIDGETS.find(w => w.id === widgetId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" style={{ color: 'var(--primary)' }} />
            <span>Cofounder Dashboard</span>
          </DialogTitle>
          <DialogDescription>
            Let your Cofounder help you optimize your dashboard layout
          </DialogDescription>
        </DialogHeader>

        {/* Loading State */}
        {step === 'loading' && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="relative">
              <Loader2 className="w-12 h-12 animate-spin" style={{ color: 'var(--primary)' }} />
              <Sparkles className="w-6 h-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ color: 'var(--primary)' }} />
            </div>
            <p style={{ color: 'var(--muted-foreground)' }}>
              {error ? error : 'Consulting with your Cofounder...'}
            </p>
            {error && (
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="mt-4"
              >
                Close
              </Button>
            )}
          </div>
        )}

        {/* Questions State */}
        {step === 'questions' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3 p-4 rounded-lg" style={{ backgroundColor: 'var(--muted)' }}>
              <MessageSquare className="w-5 h-5 mt-1 flex-shrink-0" style={{ color: 'var(--primary)' }} />
              <div className="flex-1">
                <p style={{ color: 'var(--foreground)' }}>{cofounderMessage}</p>
              </div>
            </div>

            <ScrollArea className="flex-1 max-h-[400px]">
              <div className="space-y-4 pr-4">
                {questions.map((question) => (
                  <div key={question.id} className="space-y-2">
                    <Label htmlFor={question.id}>{question.question}</Label>
                    {question.type === 'textarea' ? (
                      <Textarea
                        id={question.id}
                        placeholder={question.placeholder || 'Your answer...'}
                        value={answers[question.id] || ''}
                        onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
                        rows={3}
                      />
                    ) : (
                      <Input
                        id={question.id}
                        placeholder={question.placeholder || 'Your answer...'}
                        value={answers[question.id] || ''}
                        onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
                      />
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex gap-2 justify-end pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleAnswerSubmit}>
                Submit Answers
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Generating State */}
        {step === 'generating' && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="relative">
              <Loader2 className="w-12 h-12 animate-spin" style={{ color: 'var(--primary)' }} />
              <Sparkles className="w-6 h-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ color: 'var(--primary)' }} />
            </div>
            <p style={{ color: 'var(--muted-foreground)' }}>
              Personalizing your dashboard...
            </p>
          </div>
        )}

        {/* Complete State - All done :) */}
        {step === 'complete' && (
          <div className="flex flex-col items-center justify-center py-16 gap-6">
            <div className="relative">
              <div 
                className="w-24 h-24 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'var(--muted)' }}
              >
                <Sparkles className="w-12 h-12" style={{ color: 'var(--primary)' }} />
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <p className="text-2xl">All done :)</p>
              <p style={{ color: 'var(--muted-foreground)' }} className="text-center max-w-md">
                {cofounderMessage}
              </p>
            </div>
            <Button 
              onClick={() => onOpenChange(false)}
              className="mt-4"
              style={{
                backgroundColor: 'var(--primary)',
                color: 'var(--primary-foreground)'
              }}
            >
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};