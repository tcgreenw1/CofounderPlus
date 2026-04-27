import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Trash2, Check, Circle, Star, 
  ChevronRight, Calendar, Flag, Sparkles 
} from 'lucide-react';
import { useBusiness } from './BusinessContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';

interface TodoItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  starred: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate: string | null;
  category: string;
  created_at: string;
  updated_at: string;
}

interface TodoListPageProps {
  user: any;
}

const priorityColors = {
  low: 'text-success',
  medium: 'text-[oklch(0.828_0.189_84.429)]',
  high: 'text-destructive',
};

const priorityBadgeStyles = {
  low: 'bg-success-soft text-success border-success/20',
  medium: 'bg-[rgba(255,191,0,0.1)] text-[oklch(0.828_0.189_84.429)] border-[oklch(0.828_0.189_84.429)]/20',
  high: 'bg-[rgba(212,24,61,0.1)] text-destructive border-destructive/20',
};

export const TodoListPage: React.FC<TodoListPageProps> = ({ user }) => {
  const { currentBusiness } = useBusiness();
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'starred'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<TodoItem | null>(null);

  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newDueDate, setNewDueDate] = useState('');
  const [newCategory, setNewCategory] = useState('');

  const categories = Array.from(new Set(todos.map(t => t.category).filter(Boolean)));

  // Load todos
  const loadTodos = useCallback(async () => {
    if (!currentBusiness?.id || !user?.id) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/todos?businessId=${currentBusiness.id}`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setTodos(data.todos || []);
      } else {
        console.error('Failed to load todos');
      }
    } catch (error) {
      console.error('Error loading todos:', error);
      toast.error('Failed to load todos');
    } finally {
      setLoading(false);
    }
  }, [currentBusiness?.id, user?.id]);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  // Create or update todo
  const saveTodo = useCallback(async () => {
    if (!newTitle.trim() || !currentBusiness?.id) {
      toast.error('Please enter a task title');
      return;
    }

    try {
      const todoData = {
        title: newTitle.trim(),
        description: newDescription.trim(),
        priority: newPriority,
        dueDate: newDueDate || null,
        category: newCategory.trim() || 'General',
        businessId: currentBusiness.id,
        ...(editingTodo && { id: editingTodo.id }),
      };

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/todos`,
        {
          method: editingTodo ? 'PUT' : 'POST',
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(todoData),
        }
      );

      if (response.ok) {
        toast.success(editingTodo ? 'Task updated' : 'Task created');
        loadTodos();
        resetForm();
        setIsAddDialogOpen(false);
      } else {
        toast.error('Failed to save task');
      }
    } catch (error) {
      console.error('Error saving todo:', error);
      toast.error('Failed to save task');
    }
  }, [newTitle, newDescription, newPriority, newDueDate, newCategory, currentBusiness?.id, editingTodo, loadTodos]);

  // Toggle todo completion
  const toggleComplete = useCallback(async (todoId: string) => {
    if (!currentBusiness?.id) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/todos/${todoId}/toggle-complete`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ businessId: currentBusiness.id }),
        }
      );

      if (response.ok) {
        loadTodos();
      }
    } catch (error) {
      console.error('Error toggling todo:', error);
    }
  }, [currentBusiness?.id, loadTodos]);

  // Toggle starred
  const toggleStar = useCallback(async (todoId: string) => {
    if (!currentBusiness?.id) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/todos/${todoId}/toggle-star`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ businessId: currentBusiness.id }),
        }
      );

      if (response.ok) {
        loadTodos();
      }
    } catch (error) {
      console.error('Error starring todo:', error);
    }
  }, [currentBusiness?.id, loadTodos]);

  // Delete todo
  const deleteTodo = useCallback(async (todoId: string) => {
    if (!currentBusiness?.id) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/todos/${todoId}?businessId=${currentBusiness.id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        toast.success('Task deleted');
        loadTodos();
      }
    } catch (error) {
      console.error('Error deleting todo:', error);
      toast.error('Failed to delete task');
    }
  }, [currentBusiness?.id, loadTodos]);

  const resetForm = () => {
    setNewTitle('');
    setNewDescription('');
    setNewPriority('medium');
    setNewDueDate('');
    setNewCategory('');
    setEditingTodo(null);
  };

  const openEditDialog = (todo: TodoItem) => {
    setEditingTodo(todo);
    setNewTitle(todo.title);
    setNewDescription(todo.description);
    setNewPriority(todo.priority);
    setNewDueDate(todo.dueDate || '');
    setNewCategory(todo.category);
    setIsAddDialogOpen(true);
  };

  const filteredTodos = todos.filter(todo => {
    if (filter === 'active' && todo.completed) return false;
    if (filter === 'completed' && !todo.completed) return false;
    if (filter === 'starred' && !todo.starred) return false;
    if (categoryFilter !== 'all' && todo.category !== categoryFilter) return false;
    return true;
  });

  const stats = {
    total: todos.length,
    active: todos.filter(t => !t.completed).length,
    completed: todos.filter(t => t.completed).length,
    starred: todos.filter(t => t.starred).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
        <div className="flex flex-col items-center" style={{ gap: 'var(--spacing-4)' }}>
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p style={{ 
            fontSize: 'var(--text-base)', 
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--muted-foreground)'
          }}>
            Loading your tasks...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 style={{
              fontSize: 'var(--text-2xl)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--foreground)',
              marginBottom: 'var(--spacing-2)',
            }}>
              <Sparkles className="inline-block mr-2 h-6 w-6" style={{ color: 'var(--primary)' }} />
              My Tasks
            </h1>
            <p style={{
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-normal)',
              color: 'var(--muted-foreground)',
            }}>
              Organize your work with your Cofounder tool
            </p>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button 
                className="gap-2"
                style={{
                  backgroundColor: 'var(--primary)',
                  color: 'var(--primary-foreground)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--spacing-2) var(--spacing-4)',
                  fontSize: 'var(--text-base)',
                  fontWeight: 'var(--font-weight-medium)',
                }}
              >
                <Plus className="h-4 w-4" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent 
              style={{
                backgroundColor: 'var(--card)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border)',
              }}
            >
              <DialogHeader>
                <DialogTitle style={{
                  fontSize: 'var(--text-xl)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--foreground)',
                }}>
                  {editingTodo ? 'Edit Task' : 'Create New Task'}
                </DialogTitle>
                <DialogDescription style={{
                  fontSize: 'var(--text-base)',
                  fontWeight: 'var(--font-weight-normal)',
                  color: 'var(--muted-foreground)',
                }}>
                  {editingTodo ? 'Update your task details' : 'Add a new task to your list'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4" style={{ marginTop: 'var(--spacing-4)' }}>
                <div>
                  <Label style={{
                    fontSize: 'var(--text-base)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--foreground)',
                  }}>
                    Task Title
                  </Label>
                  <Input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Enter task title..."
                    style={{
                      marginTop: 'var(--spacing-2)',
                      backgroundColor: 'var(--input-background)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                      padding: 'var(--spacing-2) var(--spacing-3)',
                      fontSize: 'var(--text-base)',
                    }}
                  />
                </div>

                <div>
                  <Label style={{
                    fontSize: 'var(--text-base)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--foreground)',
                  }}>
                    Description
                  </Label>
                  <Textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Add details about this task..."
                    rows={3}
                    style={{
                      marginTop: 'var(--spacing-2)',
                      backgroundColor: 'var(--input-background)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                      padding: 'var(--spacing-2) var(--spacing-3)',
                      fontSize: 'var(--text-base)',
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label style={{
                      fontSize: 'var(--text-base)',
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'var(--foreground)',
                    }}>
                      Priority
                    </Label>
                    <Select value={newPriority} onValueChange={(value: any) => setNewPriority(value)}>
                      <SelectTrigger 
                        style={{
                          marginTop: 'var(--spacing-2)',
                          backgroundColor: 'var(--input-background)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border)',
                        }}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label style={{
                      fontSize: 'var(--text-base)',
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'var(--foreground)',
                    }}>
                      Category
                    </Label>
                    <Input
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="e.g., Work, Personal"
                      style={{
                        marginTop: 'var(--spacing-2)',
                        backgroundColor: 'var(--input-background)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border)',
                        padding: 'var(--spacing-2) var(--spacing-3)',
                        fontSize: 'var(--text-base)',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <Label style={{
                    fontSize: 'var(--text-base)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--foreground)',
                  }}>
                    Due Date (Optional)
                  </Label>
                  <Input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    style={{
                      marginTop: 'var(--spacing-2)',
                      backgroundColor: 'var(--input-background)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                      padding: 'var(--spacing-2) var(--spacing-3)',
                      fontSize: 'var(--text-base)',
                    }}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={saveTodo}
                    style={{
                      flex: 1,
                      backgroundColor: 'var(--primary)',
                      color: 'var(--primary-foreground)',
                      borderRadius: 'var(--radius-md)',
                      padding: 'var(--spacing-2) var(--spacing-4)',
                      fontSize: 'var(--text-base)',
                      fontWeight: 'var(--font-weight-medium)',
                    }}
                  >
                    {editingTodo ? 'Update Task' : 'Create Task'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAddDialogOpen(false);
                      resetForm();
                    }}
                    style={{
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total', value: stats.total, color: 'var(--primary)' },
            { label: 'Active', value: stats.active, color: 'var(--chart-2)' },
            { label: 'Completed', value: stats.completed, color: 'var(--success)' },
            { label: 'Starred', value: stats.starred, color: 'var(--chart-1)' },
          ].map((stat) => (
            <Card 
              key={stat.label}
              style={{
                backgroundColor: 'var(--card)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border)',
              }}
            >
              <CardContent className="p-4">
                <p style={{
                  fontSize: 'var(--text-base)',
                  fontWeight: 'var(--font-weight-normal)',
                  color: 'var(--muted-foreground)',
                  marginBottom: 'var(--spacing-1)',
                }}>
                  {stat.label}
                </p>
                <p style={{
                  fontSize: 'var(--text-2xl)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: stat.color,
                }}>
                  {stat.value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="flex gap-2">
            {(['all', 'active', 'completed', 'starred'] as const).map((filterOption) => (
              <Button
                key={filterOption}
                variant={filter === filterOption ? 'default' : 'outline'}
                onClick={() => setFilter(filterOption)}
                style={{
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--spacing-2) var(--spacing-4)',
                  fontSize: 'var(--text-base)',
                  fontWeight: 'var(--font-weight-medium)',
                  ...(filter === filterOption && {
                    backgroundColor: 'var(--primary)',
                    color: 'var(--primary-foreground)',
                  }),
                }}
              >
                {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
              </Button>
            ))}
          </div>

          {categories.length > 0 && (
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger 
                style={{
                  width: '180px',
                  backgroundColor: 'var(--input-background)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                }}
              >
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Todo List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredTodos.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              style={{
                textAlign: 'center',
                padding: 'var(--spacing-8)',
              }}
            >
              <p style={{
                fontSize: 'var(--text-lg)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--muted-foreground)',
              }}>
                {filter === 'all' ? 'No tasks yet. Create your first task!' : `No ${filter} tasks`}
              </p>
            </motion.div>
          ) : (
            filteredTodos.map((todo) => (
              <motion.div
                key={todo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                layout
              >
                <Card
                  style={{
                    backgroundColor: 'var(--card)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border)',
                    transition: 'all 0.2s',
                  }}
                  className="hover:shadow-lg"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Completion checkbox */}
                      <button
                        onClick={() => toggleComplete(todo.id)}
                        className="mt-1 flex-shrink-0 transition-all hover:scale-110"
                        style={{
                          color: todo.completed ? 'var(--success)' : 'var(--muted-foreground)',
                        }}
                      >
                        {todo.completed ? (
                          <Check className="h-5 w-5" />
                        ) : (
                          <Circle className="h-5 w-5" />
                        )}
                      </button>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h3
                            onClick={() => openEditDialog(todo)}
                            className="cursor-pointer hover:underline"
                            style={{
                              fontSize: 'var(--text-base)',
                              fontWeight: 'var(--font-weight-semibold)',
                              color: todo.completed ? 'var(--muted-foreground)' : 'var(--foreground)',
                              textDecoration: todo.completed ? 'line-through' : 'none',
                            }}
                          >
                            {todo.title}
                          </h3>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            {/* Star button */}
                            <button
                              onClick={() => toggleStar(todo.id)}
                              className="transition-all hover:scale-110"
                              style={{
                                color: todo.starred ? 'var(--chart-1)' : 'var(--muted-foreground)',
                              }}
                            >
                              <Star className="h-4 w-4" fill={todo.starred ? 'currentColor' : 'none'} />
                            </button>

                            {/* Delete button */}
                            <button
                              onClick={() => deleteTodo(todo.id)}
                              className="transition-all hover:scale-110"
                              style={{ color: 'var(--destructive)' }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {todo.description && (
                          <p style={{
                            fontSize: 'var(--text-base)',
                            fontWeight: 'var(--font-weight-normal)',
                            color: 'var(--muted-foreground)',
                            marginBottom: 'var(--spacing-3)',
                          }}>
                            {todo.description}
                          </p>
                        )}

                        {/* Metadata */}
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            className={priorityBadgeStyles[todo.priority]}
                            style={{
                              borderRadius: 'var(--radius-md)',
                              padding: 'var(--spacing-1) var(--spacing-2)',
                              fontSize: 'var(--text-base)',
                              fontWeight: 'var(--font-weight-medium)',
                            }}
                          >
                            <Flag className="h-3 w-3 mr-1" />
                            {todo.priority}
                          </Badge>

                          {todo.category && (
                            <Badge
                              variant="outline"
                              style={{
                                borderRadius: 'var(--radius-md)',
                                padding: 'var(--spacing-1) var(--spacing-2)',
                                fontSize: 'var(--text-base)',
                                fontWeight: 'var(--font-weight-medium)',
                                backgroundColor: 'var(--secondary)',
                                color: 'var(--secondary-foreground)',
                                border: '1px solid var(--border)',
                              }}
                            >
                              {todo.category}
                            </Badge>
                          )}

                          {todo.dueDate && (
                            <Badge
                              variant="outline"
                              style={{
                                borderRadius: 'var(--radius-md)',
                                padding: 'var(--spacing-1) var(--spacing-2)',
                                fontSize: 'var(--text-base)',
                                fontWeight: 'var(--font-weight-medium)',
                                border: '1px solid var(--border)',
                              }}
                            >
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(todo.dueDate).toLocaleDateString()}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
