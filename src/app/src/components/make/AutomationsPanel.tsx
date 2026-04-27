import React, { useState } from 'react';
import { 
  Plus, 
  Play, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Loader2, 
  Cpu, 
  Sparkles,
  MoreHorizontal,
  Trash2,
  ArrowUp
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export interface AutomationTask {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'running' | 'verifying' | 'fixing' | 'waiting' | 'completed' | 'error';
  model: 'claude' | 'gpt';
  createdAt: string;
}

interface AutomationsPanelProps {
  tasks: AutomationTask[];
  onAddTask: (task: Omit<AutomationTask, 'id' | 'createdAt' | 'status' | 'model'>) => void;
  onDeleteTask: (id: string) => void;
  className?: string;
}

export const AutomationsPanel: React.FC<AutomationsPanelProps> = ({
  tasks,
  onAddTask,
  onDeleteTask,
  className
}) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    
    setIsAdding(true);
    // Simulate network delay for "loading" state
    setTimeout(() => {
      onAddTask({
        title: newTaskTitle,
        description: newTaskDesc
      });
      setNewTaskTitle('');
      setNewTaskDesc('');
      setIsAdding(false);
    }, 600);
  };

  const pendingCount = tasks.filter(t => t.status === 'pending').length;

  const quickActions = [
    { label: "Add Errors", icon: AlertCircle },
    { label: "Add Types", icon: Sparkles },
    { label: "Optimize", icon: ZapIcon },
    { label: "Document", icon: FileTextIcon },
    { label: "Refactor", icon: RefreshIcon },
    { label: "Fix Bugs", icon: BugIcon }
  ];

  return (
    <div className={cn("flex flex-col h-full bg-card/30 backdrop-blur-xl border-l border-border/50", className)}>
      {/* Header */}
      <div className="p-4 border-b border-border/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-foreground tracking-tight">AI Automations</h2>
        </div>
        {pendingCount > 0 && (
          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
            {pendingCount} Pending
          </Badge>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Quick Actions */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider ml-1">
            Quick Actions
          </label>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action, i) => (
              <Button
                key={i}
                variant="ghost"
                size="sm"
                className="justify-start gap-2 h-9 bg-background/30 hover:bg-background/60 border border-border/30 rounded-lg text-xs"
                onClick={() => {
                  setNewTaskTitle(`${action.label}: `);
                  // Focus input somehow? Not strictly necessary for this mock
                }}
              >
                <action.icon className="w-3.5 h-3.5 opacity-70" />
                {action.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Task Entry Form */}
        <div className="space-y-3 p-4 rounded-xl bg-background/40 border border-border/40 shadow-sm">
          <label className="text-xs font-medium text-foreground ml-1">
            New Task
          </label>
          <div className="space-y-2">
            <Input
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Task Title..."
              className="h-9 bg-card/50 border-border/50 text-sm"
            />
            <Textarea
              value={newTaskDesc}
              onChange={(e) => setNewTaskDesc(e.target.value)}
              placeholder="Description (optional)..."
              className="min-h-[60px] bg-card/50 border-border/50 text-sm resize-none"
            />
            <Button 
              onClick={handleAddTask}
              disabled={!newTaskTitle.trim() || isAdding}
              className="w-full h-9 gap-2 shadow-sm"
              size="sm"
            >
              {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add Task
            </Button>
          </div>
        </div>

        {/* Task Queue */}
        <div className="space-y-3">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider ml-1">
            Task Queue
          </label>
          
          <AnimatePresence mode="popLayout">
            {tasks.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-border/30 rounded-xl"
              >
                <Clock className="w-8 h-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm font-medium text-muted-foreground">No tasks in queue</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Add tasks to automate your workflow</p>
              </motion.div>
            ) : (
              <div className="space-y-2">
                {tasks.map((task) => (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <TaskCard task={task} onDelete={() => onDeleteTask(task.id)} />
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

// Subcomponents for icons
const ZapIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
);
const FileTextIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
);
const RefreshIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
);
const BugIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="14" x="8" y="6" rx="4"/><path d="m19 7-3 2"/><path d="m5 7 3 2"/><path d="m19 19-3-2"/><path d="m5 19 3-2"/><path d="M20 13h-4"/><path d="M4 13h4"/><path d="m10 4 1 2"/></svg>
);

const TaskCard = ({ task, onDelete }: { task: AutomationTask; onDelete: () => void }) => {
  const getStatusColor = (status: AutomationTask['status']) => {
    switch (status) {
      case 'running': return 'text-blue-500 border-blue-500/30 bg-blue-500/10';
      case 'verifying': return 'text-purple-500 border-purple-500/30 bg-purple-500/10';
      case 'fixing': return 'text-amber-500 border-amber-500/30 bg-amber-500/10';
      case 'completed': return 'text-green-500 border-green-500/30 bg-green-500/10';
      case 'error': return 'text-red-500 border-red-500/30 bg-red-500/10';
      default: return 'text-muted-foreground border-border/50 bg-muted/20';
    }
  };

  const getStatusIcon = (status: AutomationTask['status']) => {
    switch (status) {
      case 'running': return <Loader2 className="w-3.5 h-3.5 animate-spin" />;
      case 'verifying': return <EyeIcon className="w-3.5 h-3.5 animate-pulse" />;
      case 'fixing': return <WrenchIcon className="w-3.5 h-3.5 animate-pulse" />;
      case 'completed': return <CheckCircle2 className="w-3.5 h-3.5" />;
      case 'error': return <AlertCircle className="w-3.5 h-3.5" />;
      default: return <Clock className="w-3.5 h-3.5" />;
    }
  };

  const getStatusText = (status: AutomationTask['status']) => {
    switch (status) {
      case 'running': return 'Claude is coding...';
      case 'verifying': return 'GPT scanning UI...';
      case 'fixing': return 'Fixing errors...';
      case 'completed': return 'Done';
      case 'error': return 'Failed';
      case 'waiting': return 'Waiting on user';
      default: return 'Pending';
    }
  };

  return (
    <Card className="group relative overflow-hidden border border-border/40 bg-card/60 hover:bg-card/80 transition-colors">
      {/* Active State Indicator Line */}
      {(task.status === 'running' || task.status === 'verifying' || task.status === 'fixing') && (
        <motion.div 
          layoutId="activeTaskLine"
          className="absolute left-0 top-0 bottom-0 w-1 bg-primary"
        />
      )}
      
      <div className="p-3 pl-4">
        <div className="flex justify-between items-start mb-2">
          <h4 className="text-sm font-medium leading-tight line-clamp-2 pr-6">
            {task.title}
          </h4>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 -mr-2 -mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={onDelete}
          >
            <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
          </Button>
        </div>
        
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
            {task.description}
          </p>
        )}
        
        <div className="flex items-center justify-between">
          <Badge 
            variant="outline" 
            className={cn("text-[10px] h-5 gap-1.5 px-2 font-normal capitalize", getStatusColor(task.status))}
          >
            {getStatusIcon(task.status)}
            {getStatusText(task.status)}
          </Badge>
          
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
             {task.model === 'claude' ? (
               <span className="flex items-center gap-1">
                 <Bot className="w-3 h-3" /> Claude
               </span>
             ) : (
                <span className="flex items-center gap-1">
                 <BrainIcon className="w-3 h-3" /> GPT
               </span>
             )}
          </div>
        </div>
      </div>
      
      {/* Background Pulse for Active States */}
      {(task.status === 'running' || task.status === 'verifying') && (
        <div className="absolute inset-0 bg-primary/5 animate-pulse pointer-events-none" />
      )}
    </Card>
  );
};

// More icons
const EyeIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
);
const WrenchIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
);
const Bot = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
);
const BrainIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>
);
