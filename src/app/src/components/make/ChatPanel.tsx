import React, { useRef, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  Zap, 
  Bot, 
  Command,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

interface ChatPanelProps {
  messages: ChatMessage[];
  inputValue: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  isSending: boolean;
  className?: string;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  inputValue,
  onInputChange,
  onSend,
  isSending,
  className
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className={cn("flex flex-col h-full bg-card/30 backdrop-blur-xl border-r border-border/50", className)}>
      {/* Header */}
      <div className="p-4 border-b border-border/40 flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-semibold text-foreground tracking-tight">Cofounder</h2>
          <p className="text-xs text-muted-foreground">AI Development Partner</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden relative">
        <div 
          ref={scrollRef}
          className="h-full overflow-y-auto p-4 space-y-6 scroll-smooth"
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-6 animate-in fade-in zoom-in duration-500">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-2">
                <Sparkles className="w-8 h-8 text-primary animate-pulse" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
                  Your Cofounder is Ready
                </h3>
                <p className="text-sm text-muted-foreground max-w-[240px] mx-auto">
                  I can write code, fix bugs, and optimize your app. What shall we build?
                </p>
              </div>

              <div className="space-y-2 w-full max-w-[260px]">
                {[
                  { icon: Zap, text: "Optimize performance" },
                  { icon: AlertCircle, text: "Add error handling" },
                  { icon: Command, text: "Explain this code" },
                  { icon: MessageSquare, text: "Add TypeScript types" }
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={() => onInputChange(item.text)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-background/50 hover:bg-background/80 border border-border/50 transition-all duration-200 text-xs text-left group"
                  >
                    <div className="w-6 h-6 rounded-lg bg-primary/5 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                      <item.icon className="w-3 h-3 text-primary/70 group-hover:text-primary" />
                    </div>
                    <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                      {item.text}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((msg) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={msg.id}
                  className={cn(
                    "flex gap-3 max-w-[90%]",
                    msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                  )}
                >
                  <Avatar className="w-8 h-8 border border-border/50 shadow-sm shrink-0">
                    {msg.role === 'assistant' ? (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">YO</span>
                      </div>
                    )}
                  </Avatar>
                  
                  <div className={cn(
                    "p-3 rounded-2xl text-sm shadow-sm",
                    msg.role === 'user' 
                      ? "bg-primary text-primary-foreground rounded-tr-sm" 
                      : "bg-card border border-border/50 rounded-tl-sm"
                  )}>
                    {msg.content}
                  </div>
                </motion.div>
              ))}
              {isSending && (
                 <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mr-auto flex gap-3 max-w-[80%]"
                >
                  <Avatar className="w-8 h-8 border border-border/50 shadow-sm shrink-0">
                    <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  </Avatar>
                  <div className="bg-card border border-border/50 rounded-2xl rounded-tl-sm p-3 shadow-sm flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 bg-background/50 backdrop-blur-md border-t border-border/40">
        <div className="relative group">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Cofounder anything..."
            className="pr-12 py-6 bg-card/50 border-border/50 focus:border-primary/50 shadow-inner rounded-xl transition-all"
            disabled={isSending}
          />
          <Button 
            size="icon"
            onClick={onSend}
            disabled={!inputValue.trim() || isSending}
            className={cn(
              "absolute right-1.5 top-1.5 h-9 w-9 rounded-lg transition-all duration-300",
              inputValue.trim() 
                ? "bg-primary shadow-[0_0_15px_rgba(59,130,246,0.5)] hover:shadow-[0_0_20px_rgba(59,130,246,0.6)] hover:scale-105" 
                : "bg-muted text-muted-foreground"
            )}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex justify-between items-center mt-3 px-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-background/50 border-border/40 text-muted-foreground">
              ⌘ K
            </Badge>
            <span className="text-[10px] text-muted-foreground">to focus</span>
          </div>
          <span className="text-[10px] text-muted-foreground font-medium">
            {messages.length} messages
          </span>
        </div>
      </div>
    </div>
  );
};
