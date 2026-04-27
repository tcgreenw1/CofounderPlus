# Todo List Feature - Setup Guide

## Overview
The Todo List feature is a simple, design-system-compliant task management system for Cofounder+. It allows users to create, organize, and track tasks with priorities, categories, due dates, and completion status.

## Features
- ✅ Create and edit tasks with rich details
- ⭐ Star important tasks
- 🏷️ Categorize tasks
- 🎯 Set priority levels (low, medium, high)
- 📅 Set due dates
- ✔️ Mark tasks as complete
- 🔍 Filter tasks by status and category
- 📊 View task statistics

## Design System Compliance
The Todo List feature **strictly uses** design system variables from `/styles/globals.css`:
- **Colors**: Uses `var(--primary)`, `var(--success)`, `var(--destructive)`, etc.
- **Spacing**: Uses `var(--spacing-1)` through `var(--spacing-8)`
- **Border Radius**: Uses `var(--radius-lg)`, `var(--radius-md)`, etc.
- **Typography**: Uses `var(--text-base)`, `var(--font-weight-medium)`, etc.

This ensures the todo list will automatically update when you modify your design system CSS.

## Files Created

### Frontend
- `/src/components/TodoListPage.tsx` - Main todo list component with full UI

### Backend
- `/supabase/functions/server/todo-endpoints.tsx` - API endpoints using `kv_cache.tsx` wrapper

### Integration
- Added route in `/src/components/AppContent.tsx` at path `/todos`
- Mounted endpoints in `/supabase/functions/server/index.tsx`

## How to Use

### Accessing the Todo List
Navigate to `/todos` in your app after signing in. The todo list is protected by authentication and scoped to your current business.

### API Endpoints

All endpoints use the prefix: `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/todos`

**GET /todos**
- Query params: `businessId` (required)
- Returns: List of all todos for the business

**POST /todos**
- Creates a new todo
- Body: `{ businessId, title, description, priority, dueDate, category }`

**PUT /todos**
- Updates an existing todo
- Body: `{ id, businessId, title, description, priority, dueDate, category }`

**PATCH /todos/:id/toggle-complete**
- Toggles completion status
- Body: `{ businessId }`

**PATCH /todos/:id/toggle-star**
- Toggles starred status
- Body: `{ businessId }`

**DELETE /todos/:id**
- Deletes a todo
- Query params: `businessId` (required)

### Data Storage
Todos are stored in the KV store using the key pattern:
```
todos:business:{businessId}
```

This uses the `kv_cache.tsx` wrapper which provides:
- In-memory caching (5-minute TTL)
- Timeout handling (25-second timeout)
- Automatic retry logic

## Customization

### Adding New Fields
To add new fields to todos:

1. Update the `TodoItem` interface in both files:
   - `/src/components/TodoListPage.tsx`
   - `/supabase/functions/server/todo-endpoints.tsx`

2. Update the form in `TodoListPage.tsx` to capture the new field

3. Update the create/update endpoints to save the new field

### Changing Design
All design is controlled by CSS variables. To change colors, spacing, or fonts:

1. Edit `/styles/globals.css`
2. The changes will automatically apply to the todo list

### Example: Change Primary Color
```css
:root {
  --primary: #0066ff; /* Changes all primary buttons and accents */
}
```

## Mobile Support
The todo list is fully responsive and works on mobile devices. It uses:
- Grid layout that adapts to screen size
- Touch-friendly buttons
- Mobile-optimized spacing

## Integration with Cofounder
The todo list integrates with your Cofounder+ app:
- Uses `BusinessContext` to scope todos to current business
- Uses existing auth system
- Follows "Toy Box Pop" aesthetic
- Refers to AI as "Cofounder" or "tool" (as per your guidelines)

## Next Steps

### Recommended Enhancements
1. **AI Integration**: Add Cofounder tool integration to suggest tasks
2. **Drag & Drop**: Add drag-and-drop reordering like the Notes page
3. **Subtasks**: Add support for nested sub-tasks
4. **Reminders**: Add notifications for due dates
5. **Team Collaboration**: Add task assignment to team members
6. **Templates**: Add task templates for common workflows

### Navigation Integration
To add the todo list to your navigation menu, update your sidebar/navigation component to include:
```tsx
<NavLink to="/todos">
  <CheckSquare className="h-4 w-4" />
  Tasks
</NavLink>
```

## Support
The todo list uses the same backend infrastructure as your other features:
- Dual-server architecture (production `o9` and development servers)
- Health monitoring endpoints
- Retry mechanisms with exponential backoff
- Comprehensive error logging

All backend operations use the `kv_cache.tsx` wrapper as per your backend guidelines.
