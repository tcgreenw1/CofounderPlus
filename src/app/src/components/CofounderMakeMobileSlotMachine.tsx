/**
 * Mobile Slot Machine UI Component for Cofounder Make
 * Tasks flow through the code like a slot machine: flour in -> machine -> bread out
 */

import React from 'react';
import {
  CheckCircle2,
  Clock,
  Loader2,
  Plus,
  Play,
  Trash2,
  Zap,
  Brain,
  Code2,
  Sparkles,
  X
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  targetEngine: 'claude' | 'supervisor';
  createdAt: string;
  completedAt?: string;
  errorMessage?: string;
}

interface MobileSlotMachineProps {
  tasks: Task[];
  newTaskTitle: string;
  newTaskDescription: string;
  setNewTaskTitle: (value: string) => void;
  setNewTaskDescription: (value: string) => void;
  addTask: () => void;
  runTask: (id: string) => void;
  removeTask: (id: string) => void;
  claudeThinking: boolean;
  fileContent: string;
  selectedFile: string;
  onClose: () => void;
}

export default function MobileSlotMachine({
  tasks,
  newTaskTitle,
  newTaskDescription,
  setNewTaskTitle,
  setNewTaskDescription,
  addTask,
  runTask,
  removeTask,
  claudeThinking,
  fileContent,
  selectedFile,
  onClose
}: MobileSlotMachineProps) {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when tasks change
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [tasks]);

  return (
    <div 
      className="fixed inset-0 z-40 flex flex-col"
      style={{
        background: 'var(--background)',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'calc(80px + env(safe-area-inset-bottom))'
      }}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between border-b"
        style={{ 
          padding: 'var(--spacing-3)',
          borderColor: 'var(--border)',
          background: 'var(--background)',
          backdropFilter: 'blur(8px)'
        }}
      >
        <div className="flex items-center gap-2">
          <div 
            className="size-8 rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, var(--primary), var(--accent))',
              animation: 'scaleIn 0.3s ease-out'
            }}
          >
            <Sparkles className="size-4" style={{ color: 'var(--primary-foreground)' }} />
          </div>
          <div>
            <h3 style={{ fontWeight: 'var(--font-weight-semibold)' }}>
              Task Machine
            </h3>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              {tasks.filter(t => t.status === 'pending' || t.status === 'running').length} active
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0 mobile-touch-button"
        >
          <X className="size-4" />
        </Button>
      </div>

      {/* Slot Machine Layout */}
      <div 
        className="flex-1 overflow-y-auto"
        style={{ 
          padding: 'var(--spacing-4)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--spacing-6)'
        }}
      >
        {/* Completed Tasks - "Bread Coming Out" */}
        <div>
          <div 
            className="flex items-center gap-2 mb-3"
            style={{ 
              padding: 'var(--spacing-2)',
              borderRadius: 'var(--radius)',
              background: 'linear-gradient(135deg, var(--success), #4ade80)'
            }}
          >
            <CheckCircle2 className="size-5" style={{ color: 'var(--success-foreground)' }} />
            <h4 style={{ 
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--success-foreground)',
              flex: 1
            }}>
              ✨ Completed
            </h4>
            <Badge 
              style={{ 
                background: 'rgba(255,255,255,0.3)',
                color: 'var(--success-foreground)',
                border: 'none'
              }}
            >
              {tasks.filter(t => t.status === 'completed').length}
            </Badge>
          </div>
          
          <div className="space-y-2">
            {tasks.filter(t => t.status === 'completed').length === 0 ? (
              <div 
                className="text-center py-6 rounded-lg"
                style={{ 
                  background: 'var(--muted)',
                  color: 'var(--muted-foreground)',
                  border: '2px dashed var(--border)'
                }}
              >
                <p className="text-sm">No completed tasks yet</p>
                <p className="text-xs mt-1">Completed tasks will appear here</p>
              </div>
            ) : (
              tasks.filter(t => t.status === 'completed').slice(-3).reverse().map((task) => (
                <div
                  key={task.id}
                  className="rounded-lg p-3"
                  style={{
                    background: 'linear-gradient(135deg, rgba(108, 255, 108, 0.1), rgba(74, 222, 128, 0.1))',
                    border: '1px solid var(--success)',
                    animation: 'slideDown 0.5s ease-out'
                  }}
                >
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="size-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--success)' }} />
                    <div className="flex-1 min-w-0">
                      <p style={{ fontWeight: 'var(--font-weight-medium)' }} className="truncate">
                        {task.title}
                      </p>
                      {task.completedAt && (
                        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                          {new Date(task.completedAt).toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Code Editor - "The Machine" */}
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: 'var(--card)',
            border: '3px solid var(--primary)',
            boxShadow: '0 0 30px rgba(0, 224, 255, 0.3)',
            position: 'relative'
          }}
        >
          {/* Machine Header */}
          <div
            className="flex items-center gap-2 border-b"
            style={{
              padding: 'var(--spacing-3)',
              background: 'linear-gradient(135deg, var(--primary), var(--accent))',
              borderColor: 'var(--border)'
            }}
          >
            <Brain className="size-5 animate-pulse" style={{ color: 'var(--primary-foreground)' }} />
            <span style={{ 
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--primary-foreground)',
              flex: 1
            }}>
              🤖 Cofounder Coding Engine
            </span>
            {claudeThinking && (
              <Loader2 className="size-4 animate-spin" style={{ color: 'var(--primary-foreground)' }} />
            )}
          </div>

          {/* Code Display */}
          <div
            style={{
              padding: 'var(--spacing-4)',
              background: '#1a1a1a',
              minHeight: '200px',
              maxHeight: '300px',
              overflow: 'auto',
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              lineHeight: '1.5'
            }}
          >
            {fileContent ? (
              <pre style={{ color: '#00ff00', margin: 0 }}>
                {fileContent.split('\n').slice(0, 20).join('\n')}
                {fileContent.split('\n').length > 20 && '\n...'}
              </pre>
            ) : selectedFile ? (
              <div className="flex items-center justify-center h-full" style={{ color: 'var(--muted-foreground)' }}>
                <Loader2 className="size-6 animate-spin" />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center" style={{ color: 'var(--muted-foreground)' }}>
                <Code2 className="size-8 mb-2 opacity-50" />
                <p className="text-xs">No file selected</p>
                <p className="text-xs mt-1">Pull from GitHub to see code</p>
              </div>
            )}
          </div>

          {/* Activity Indicator */}
          {claudeThinking && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                background: 'rgba(0, 0, 0, 0.7)',
                backdropFilter: 'blur(4px)'
              }}
            >
              <div className="text-center">
                <div className="flex gap-2 justify-center mb-3">
                  <div className="size-3 rounded-full animate-bounce" style={{ background: 'var(--primary)', animationDelay: '0ms' }} />
                  <div className="size-3 rounded-full animate-bounce" style={{ background: 'var(--primary)', animationDelay: '150ms' }} />
                  <div className="size-3 rounded-full animate-bounce" style={{ background: 'var(--primary)', animationDelay: '300ms' }} />
                </div>
                <p style={{ color: 'var(--primary)', fontWeight: 'var(--font-weight-semibold)' }}>
                  Processing...
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Current Task - "In the Machine" */}
        <div>
          <div 
            className="flex items-center gap-2 mb-3"
            style={{ 
              padding: 'var(--spacing-2)',
              borderRadius: 'var(--radius)',
              background: 'linear-gradient(135deg, var(--primary), var(--accent))'
            }}
          >
            <Zap className="size-5 animate-pulse" style={{ color: 'var(--primary-foreground)' }} />
            <h4 style={{ 
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--primary-foreground)',
              flex: 1
            }}>
              ⚡ Working On
            </h4>
          </div>
          
          {tasks.find(t => t.status === 'running') ? (
            <div
              className="rounded-lg p-4"
              style={{
                background: 'linear-gradient(135deg, rgba(0, 224, 255, 0.15), rgba(43, 127, 255, 0.15))',
                border: '2px solid var(--primary)',
                boxShadow: '0 0 20px rgba(0, 224, 255, 0.2)'
              }}
            >
              <div className="flex items-start gap-3">
                <Loader2 className="size-5 mt-0.5 flex-shrink-0 animate-spin" style={{ color: 'var(--primary)' }} />
                <div className="flex-1">
                  <p style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                    {tasks.find(t => t.status === 'running')!.title}
                  </p>
                  {tasks.find(t => t.status === 'running')!.description && (
                    <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
                      {tasks.find(t => t.status === 'running')!.description}
                    </p>
                  )}
                  <div className="mt-3">
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--muted)' }}>
                      <div 
                        className="h-full rounded-full"
                        style={{ 
                          background: 'linear-gradient(90deg, var(--primary), var(--accent))',
                          width: '60%',
                          animation: 'progressPulse 2s ease-in-out infinite'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div 
              className="text-center py-8 rounded-lg"
              style={{ 
                background: 'var(--muted)',
                color: 'var(--muted-foreground)',
                border: '2px dashed var(--border)'
              }}
            >
              <Clock className="size-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No task in progress</p>
              <p className="text-xs mt-1">Waiting for tasks...</p>
            </div>
          )}
        </div>

        {/* Upcoming Tasks - "Flour Going In" */}
        <div>
          <div 
            className="flex items-center gap-2 mb-3"
            style={{ 
              padding: 'var(--spacing-2)',
              borderRadius: 'var(--radius)',
              background: 'linear-gradient(135deg, var(--muted), var(--secondary))'
            }}
          >
            <Clock className="size-5" style={{ color: 'var(--foreground)' }} />
            <h4 style={{ 
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--foreground)',
              flex: 1
            }}>
              📋 Scheduled
            </h4>
            <Badge variant="secondary">
              {tasks.filter(t => t.status === 'pending').length}
            </Badge>
          </div>
          
          <div className="space-y-2">
            {tasks.filter(t => t.status === 'pending').length === 0 ? (
              <div 
                className="text-center py-6 rounded-lg"
                style={{ 
                  background: 'var(--muted)',
                  color: 'var(--muted-foreground)',
                  border: '2px dashed var(--border)'
                }}
              >
                <Plus className="size-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No scheduled tasks</p>
                <p className="text-xs mt-1">Add tasks below to get started</p>
              </div>
            ) : (
              tasks.filter(t => t.status === 'pending').slice(0, 5).map((task, index) => (
                <div
                  key={task.id}
                  className="rounded-lg p-3 flex items-center gap-3"
                  style={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    opacity: 1 - (index * 0.15)
                  }}
                >
                  <div 
                    className="flex items-center justify-center size-6 rounded-full flex-shrink-0 text-xs"
                    style={{ 
                      background: 'var(--muted)',
                      color: 'var(--muted-foreground)',
                      fontWeight: 'var(--font-weight-semibold)'
                    }}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ fontWeight: 'var(--font-weight-medium)' }} className="truncate">
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>
                        {task.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => runTask(task.id)}
                      className="h-8 w-8 p-0 mobile-touch-button"
                      style={{
                        minHeight: '44px',
                        minWidth: '44px'
                      }}
                    >
                      <Play className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTask(task.id)}
                      className="h-8 w-8 p-0 mobile-touch-button"
                      style={{ 
                        color: 'var(--destructive)',
                        minHeight: '44px',
                        minWidth: '44px'
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Add Task Section - "Add Flour" */}
        <div
          className="rounded-lg p-4"
          style={{
            background: 'var(--card)',
            border: '2px solid var(--border)'
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Plus className="size-5" style={{ color: 'var(--primary)' }} />
            <h4 style={{ fontWeight: 'var(--font-weight-semibold)' }}>
              Add New Task
            </h4>
          </div>
          
          <div className="space-y-3">
            <div>
              <Label className="text-sm mb-1.5 block">Task Title</Label>
              <Input
                placeholder="e.g., Fix login bug"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="text-sm"
              />
            </div>
            
            <div>
              <Label className="text-sm mb-1.5 block">Description (Optional)</Label>
              <Textarea
                placeholder="Describe what needs to be done..."
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                className="text-sm resize-none"
                rows={2}
              />
            </div>
            
            <Button
              onClick={addTask}
              disabled={!newTaskTitle.trim()}
              className="w-full"
              style={{
                background: 'var(--primary)',
                color: 'var(--primary-foreground)'
              }}
            >
              <Plus className="size-4 mr-2" />
              Add to Queue
            </Button>
          </div>
        </div>

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}