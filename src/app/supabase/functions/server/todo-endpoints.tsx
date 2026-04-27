/**
 * Todo List Endpoints
 * Manages simple todo items for businesses using kv_cache wrapper
 */

import { Hono } from 'npm:hono@4';
import * as kvCache from './kv_cache.tsx';

const app = new Hono();

interface TodoItem {
  id: string;
  businessId: string;
  userId: string;
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

// Helper to generate unique ID
function generateId(): string {
  return `todo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// GET /todos - Get all todos for a business
app.get('/make-server-373d8b09/todos', async (c) => {
  try {
    const businessId = c.req.query('businessId');

    if (!businessId) {
      return c.json({ error: 'Business ID is required' }, 400);
    }

    console.log(`📋 Loading todos for business: ${businessId}`);

    // Get todos from KV store
    const todosKey = `todos:business:${businessId}`;
    const todos = await kvCache.get(todosKey) || [];

    console.log(`📋 Found ${todos.length} todos`);

    return c.json({ todos });
  } catch (error) {
    console.error('❌ Error loading todos:', error);
    return c.json({ error: 'Failed to load todos', details: error.message }, 500);
  }
});

// POST /todos - Create a new todo
app.post('/make-server-373d8b09/todos', async (c) => {
  try {
    const body = await c.req.json();
    const { businessId, title, description, priority, dueDate, category } = body;

    if (!businessId || !title) {
      return c.json({ error: 'Business ID and title are required' }, 400);
    }

    console.log(`📋 Creating todo for business: ${businessId}`);

    // Get existing todos
    const todosKey = `todos:business:${businessId}`;
    const todos = await kvCache.get(todosKey) || [];

    // Create new todo
    const newTodo: TodoItem = {
      id: generateId(),
      businessId,
      userId: body.userId || 'system',
      title: title.trim(),
      description: description?.trim() || '',
      completed: false,
      starred: false,
      priority: priority || 'medium',
      dueDate: dueDate || null,
      category: category?.trim() || 'General',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Add to array
    todos.unshift(newTodo);

    // Save back to KV store
    await kvCache.set(todosKey, todos);

    console.log(`✅ Created todo: ${newTodo.id}`);

    return c.json({ todo: newTodo }, 201);
  } catch (error) {
    console.error('❌ Error creating todo:', error);
    return c.json({ error: 'Failed to create todo', details: error.message }, 500);
  }
});

// PUT /todos - Update an existing todo
app.put('/make-server-373d8b09/todos', async (c) => {
  try {
    const body = await c.req.json();
    const { id, businessId, title, description, priority, dueDate, category } = body;

    if (!businessId || !id) {
      return c.json({ error: 'Business ID and todo ID are required' }, 400);
    }

    console.log(`📋 Updating todo: ${id} for business: ${businessId}`);

    // Get existing todos
    const todosKey = `todos:business:${businessId}`;
    const todos = await kvCache.get(todosKey) || [];

    // Find and update todo
    const todoIndex = todos.findIndex((t: TodoItem) => t.id === id);

    if (todoIndex === -1) {
      return c.json({ error: 'Todo not found' }, 404);
    }

    // Update fields
    todos[todoIndex] = {
      ...todos[todoIndex],
      ...(title !== undefined && { title: title.trim() }),
      ...(description !== undefined && { description: description.trim() }),
      ...(priority !== undefined && { priority }),
      ...(dueDate !== undefined && { dueDate }),
      ...(category !== undefined && { category: category.trim() }),
      updated_at: new Date().toISOString(),
    };

    // Save back to KV store
    await kvCache.set(todosKey, todos);

    console.log(`✅ Updated todo: ${id}`);

    return c.json({ todo: todos[todoIndex] });
  } catch (error) {
    console.error('❌ Error updating todo:', error);
    return c.json({ error: 'Failed to update todo', details: error.message }, 500);
  }
});

// PATCH /todos/:id/toggle-complete - Toggle todo completion
app.patch('/make-server-373d8b09/todos/:id/toggle-complete', async (c) => {
  try {
    const todoId = c.req.param('id');
    const body = await c.req.json();
    const { businessId } = body;

    if (!businessId) {
      return c.json({ error: 'Business ID is required' }, 400);
    }

    console.log(`📋 Toggling completion for todo: ${todoId}`);

    // Get existing todos
    const todosKey = `todos:business:${businessId}`;
    const todos = await kvCache.get(todosKey) || [];

    // Find and update todo
    const todoIndex = todos.findIndex((t: TodoItem) => t.id === todoId);

    if (todoIndex === -1) {
      return c.json({ error: 'Todo not found' }, 404);
    }

    todos[todoIndex].completed = !todos[todoIndex].completed;
    todos[todoIndex].updated_at = new Date().toISOString();

    // Save back to KV store
    await kvCache.set(todosKey, todos);

    console.log(`✅ Toggled completion for todo: ${todoId} -> ${todos[todoIndex].completed}`);

    return c.json({ todo: todos[todoIndex] });
  } catch (error) {
    console.error('❌ Error toggling todo completion:', error);
    return c.json({ error: 'Failed to toggle completion', details: error.message }, 500);
  }
});

// PATCH /todos/:id/toggle-star - Toggle todo starred status
app.patch('/make-server-373d8b09/todos/:id/toggle-star', async (c) => {
  try {
    const todoId = c.req.param('id');
    const body = await c.req.json();
    const { businessId } = body;

    if (!businessId) {
      return c.json({ error: 'Business ID is required' }, 400);
    }

    console.log(`📋 Toggling star for todo: ${todoId}`);

    // Get existing todos
    const todosKey = `todos:business:${businessId}`;
    const todos = await kvCache.get(todosKey) || [];

    // Find and update todo
    const todoIndex = todos.findIndex((t: TodoItem) => t.id === todoId);

    if (todoIndex === -1) {
      return c.json({ error: 'Todo not found' }, 404);
    }

    todos[todoIndex].starred = !todos[todoIndex].starred;
    todos[todoIndex].updated_at = new Date().toISOString();

    // Save back to KV store
    await kvCache.set(todosKey, todos);

    console.log(`✅ Toggled star for todo: ${todoId} -> ${todos[todoIndex].starred}`);

    return c.json({ todo: todos[todoIndex] });
  } catch (error) {
    console.error('❌ Error toggling todo star:', error);
    return c.json({ error: 'Failed to toggle star', details: error.message }, 500);
  }
});

// DELETE /todos/:id - Delete a todo
app.delete('/make-server-373d8b09/todos/:id', async (c) => {
  try {
    const todoId = c.req.param('id');
    const businessId = c.req.query('businessId');

    if (!businessId) {
      return c.json({ error: 'Business ID is required' }, 400);
    }

    console.log(`📋 Deleting todo: ${todoId} for business: ${businessId}`);

    // Get existing todos
    const todosKey = `todos:business:${businessId}`;
    const todos = await kvCache.get(todosKey) || [];

    // Filter out the todo
    const filteredTodos = todos.filter((t: TodoItem) => t.id !== todoId);

    if (filteredTodos.length === todos.length) {
      return c.json({ error: 'Todo not found' }, 404);
    }

    // Save back to KV store
    await kvCache.set(todosKey, filteredTodos);

    console.log(`✅ Deleted todo: ${todoId}`);

    return c.json({ success: true });
  } catch (error) {
    console.error('❌ Error deleting todo:', error);
    return c.json({ error: 'Failed to delete todo', details: error.message }, 500);
  }
});

export default app;
