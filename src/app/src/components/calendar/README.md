# Calendar Module

This directory contains the modularized calendar components with full drag-and-drop functionality.

## Structure

```
calendar/
├── types.ts              # Type definitions and constants
├── utils.ts              # Utility functions (date calculations, event filters)
├── DragAndDrop.tsx       # Drag-and-drop components (DraggableEvent, DroppableTimeSlot)
├── WeekView.tsx          # Week view with 15-minute interval slots
├── DayView.tsx           # Day view with 15-minute interval slots
├── MonthView.tsx         # Month grid view
├── YearView.tsx          # Year overview with 12 months
└── EventDialog.tsx       # Add/Edit event dialog
```

## Features

### ✅ Drag and Drop
- **15-minute intervals**: Drop events precisely on 15-minute time slots
- **Optimistic updates**: Events move instantly (no lag)
- **Background saving**: Changes save to database without blocking UI
- **Auto-revert**: If save fails, events automatically return to original position
- **Cross-day support**: Drag events to different days in week view

### ✅ Views
- **Year**: Overview of all 12 months
- **Month**: Classic calendar grid with event preview
- **Week**: 7-day view with hourly timeline and 15-minute slots
- **Day**: Detailed single-day view with 15-minute slots

### ✅ Design System
- All styling uses CSS variables from `/styles/globals.css`
- Consistent spacing: `var(--spacing-*)` 
- Consistent colors: `var(--primary)`, `var(--accent)`, etc.
- Consistent borders: `var(--border)`, `var(--radius-*)`
- Typography respects font-family from CSS

## Usage

Import the main component:
```tsx
import CalendarPage from './CalendarPageNew';
```

The component automatically wraps itself in `DndProvider`, so no additional setup is needed.

## Drag and Drop Implementation

### How It Works

1. **DraggableEvent**: Wraps event elements, makes them draggable
2. **DroppableTimeSlot**: Wraps time slots (15-min intervals), accepts drops
3. **handleEventDrop**: Calculates new start/end times, preserves duration
4. **Optimistic Update**: UI updates immediately
5. **Background Save**: API call to save changes
6. **Error Handling**: Reverts on failure

### Time Slot Precision

Week and Day views divide each hour into four 15-minute slots:
- `:00` - `:15` - `:30` - `:45`

Events snap to the nearest 15-minute interval when dropped.

## Database Integration

All CRUD operations use `calendarAPI` from `/src/utils/calendarAPI.ts`:
- `fetchEvents()` - Load events
- `createEvent()` - Create new event
- `updateEvent()` - Update existing event (used by drag-drop)
- `deleteEvent()` - Delete event

## Performance

- Optimistic updates ensure zero perceived lag
- Only one network request per operation
- Visual feedback during drag (50% opacity)
- Hover highlighting on drop targets (accent color)
- Smooth animations using CSS transitions

## Future Enhancements

Potential additions:
- Event resize by dragging edges
- Multi-select and bulk operations
- Recurring events
- External calendar sync (Google Calendar, Outlook)
- Event templates
- Color customization per event
