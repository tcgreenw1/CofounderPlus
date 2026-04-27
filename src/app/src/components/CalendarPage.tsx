/**
 * Calendar Page
 * Full-featured calendar with year, month, week, and day views
 * Uses design system CSS variables for consistent styling
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  X,
  Edit,
  Trash2,
  MoreVertical
} from 'lucide-react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import { QuickEventForm } from './QuickEventForm';
import { useBusiness } from './BusinessContext';
import { toast } from 'sonner@2.0.3';
import { calendarAPI } from '../utils/calendarAPI';
import { supabase } from '../utils/supabase/client';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  type: 'meeting' | 'call' | 'task' | 'reminder' | 'other';
  location?: string;
  attendees?: string[];
  color: string;
}

const EVENT_COLORS = {
  meeting: '#3b82f6',
  call: '#10b981',
  task: '#f59e0b',
  reminder: '#8b5cf6',
  other: '#6b7280'
};

const ITEM_TYPE = 'EVENT';

// Draggable Event Component
interface DraggableEventProps {
  event: CalendarEvent;
  children: React.ReactNode;
  onEdit: (event: CalendarEvent) => void;
}

function DraggableEvent({ event, children, onEdit }: DraggableEventProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ITEM_TYPE,
    item: { event },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      onClick={(e) => {
        e.stopPropagation();
        onEdit(event);
      }}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
    >
      {children}
    </div>
  );
}

// Droppable Time Slot Component
interface DroppableTimeSlotProps {
  date: Date;
  hour: number;
  minute: number;
  onDrop: (event: CalendarEvent, newDate: Date, newHour: number, newMinute: number) => void;
  children: React.ReactNode;
  onSlotClick?: () => void;
}

function DroppableTimeSlot({ date, hour, minute, onDrop, children, onSlotClick }: DroppableTimeSlotProps) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ITEM_TYPE,
    drop: (item: { event: CalendarEvent }) => {
      onDrop(item.event, date, hour, minute);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  return (
    <div
      ref={drop}
      onClick={onSlotClick}
      style={{
        background: isOver ? 'var(--accent)' : undefined,
        transition: 'background 0.2s',
      }}
    >
      {children}
    </div>
  );
}

export function CalendarPage() {
  const { selectedBusiness } = useBusiness();
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Load saved state from localStorage
  const [currentDate, setCurrentDate] = useState(() => {
    const saved = localStorage.getItem('calendarCurrentDate');
    return saved ? new Date(saved) : new Date();
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [view, setView] = useState<'year' | 'month' | 'week' | 'day'>(() => {
    const saved = localStorage.getItem('calendarView');
    return (saved as 'year' | 'month' | 'week' | 'day') || 'month';
  });
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showQuickEventForm, setShowQuickEventForm] = useState(false);
  const [quickEventDate, setQuickEventDate] = useState<Date | null>(null);
  const [quickEventHour, setQuickEventHour] = useState<number | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'meeting' as CalendarEvent['type'],
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    attendees: ''
  });

  // Save view and current date to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('calendarView', view);
  }, [view]);

  useEffect(() => {
    localStorage.setItem('calendarCurrentDate', currentDate.toISOString());
  }, [currentDate]);

  // Load events from backend on mount and when business changes
  useEffect(() => {
    const loadEvents = async () => {
      setIsLoading(true);
      try {
        // Check if we have a valid session before making the request
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          console.log('📅 No active session, skipping calendar load');
          toast.error('Please sign in to view calendar events');
          setIsLoading(false);
          return;
        }
        
        console.log('📅 Session found, loading calendar events from backend...', {
          userId: session.user?.id,
          expiresAt: session.expires_at
        });
        
        const fetchedEvents = await calendarAPI.fetchEvents(selectedBusiness?.id);
        console.log('📅 Fetched events:', fetchedEvents.length);
        setEvents(fetchedEvents);
        
        if (fetchedEvents.length > 0) {
          toast.success(`Loaded ${fetchedEvents.length} calendar events`);
        } else {
          toast.info('No calendar events found');
        }
      } catch (error: any) {
        console.error('Failed to load calendar events:', error);
        if (error.message?.includes('not authenticated')) {
          toast.error('Authentication required. Please sign in again.');
        } else {
          toast.error('Failed to load calendar events');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadEvents();
  }, [selectedBusiness?.id]);

  // Auto-save events to backend whenever they change (debounced)
  useEffect(() => {
    if (isLoading) return; // Don't save during initial load
    
    const timeoutId = setTimeout(async () => {
      if (events.length === 0) return;
      
      console.log('📅 Auto-saving events to backend...');
      // Save to localStorage as backup
      localStorage.setItem('calendarEvents', JSON.stringify(events));
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [events, isLoading]);

  // Get days in month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);

  // Generate calendar days for month view
  const calendarDays = useMemo(() => {
    const days = [];
    
    // Add empty slots for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  }, [year, month, daysInMonth, startingDayOfWeek]);

  // Generate week days for week view
  const getWeekDays = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  }, [currentDate]);

  // Get hours for day/week view
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Get events for a specific date
  const getEventsForDate = (date: Date | null) => {
    if (!date) return [];
    return events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.getDate() === date.getDate() &&
             eventDate.getMonth() === date.getMonth() &&
             eventDate.getFullYear() === date.getFullYear();
    });
  };

  // Get events for a specific hour
  const getEventsForHour = (date: Date, hour: number) => {
    return events.filter(event => {
      const eventDate = new Date(event.startTime);
      const eventHour = eventDate.getHours();
      
      return eventDate.getDate() === date.getDate() &&
             eventDate.getMonth() === date.getMonth() &&
             eventDate.getFullYear() === date.getFullYear() &&
             eventHour === hour;
    });
  };

  // Navigation functions
  const goToPrevious = () => {
    if (view === 'year') {
      setCurrentDate(new Date(year - 1, month));
    } else if (view === 'month') {
      setCurrentDate(new Date(year, month - 1));
    } else if (view === 'week') {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() - 7);
      setCurrentDate(newDate);
    } else if (view === 'day') {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() - 1);
      setCurrentDate(newDate);
    }
  };

  const goToNext = () => {
    if (view === 'year') {
      setCurrentDate(new Date(year + 1, month));
    } else if (view === 'month') {
      setCurrentDate(new Date(year, month + 1));
    } else if (view === 'week') {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() + 7);
      setCurrentDate(newDate);
    } else if (view === 'day') {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() + 1);
      setCurrentDate(newDate);
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Quick event handlers
  const handleTimeSlotClick = (date: Date, hour: number) => {
    setQuickEventDate(date);
    setQuickEventHour(hour);
    setShowQuickEventForm(true);
  };

  const handleQuickEventSave = async (title: string, type: CalendarEvent['type'], duration: number, selectedHour: number) => {
    console.log('handleQuickEventSave called', { title, type, duration, selectedHour, quickEventDate });
    if (!quickEventDate) return;

    // Use selectedHour instead of quickEventHour
    const startTime = new Date(
      quickEventDate.getFullYear(),
      quickEventDate.getMonth(),
      quickEventDate.getDate(),
      selectedHour,
      0
    );
    
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + duration);

    const newEvent: CalendarEvent = {
      id: Date.now().toString(),
      title,
      startTime,
      endTime,
      type,
      color: EVENT_COLORS[type]
    };

    console.log('Creating new event:', newEvent);
    
    try {
      // Optimistically add the event to UI first for instant feedback
      setEvents([...events, newEvent]);
      
      // Close the form immediately
      setShowQuickEventForm(false);
      setQuickEventDate(null);
      setQuickEventHour(null);
      
      // Save to backend in background
      const success = await calendarAPI.createEvent(newEvent, selectedBusiness?.id);
      if (success) {
        toast.success('Event created');
      } else {
        // If save failed, remove the event from UI
        setEvents(events.filter(e => e.id !== newEvent.id));
        toast.error('Failed to save event');
      }
    } catch (error) {
      // If error, remove the event from UI
      setEvents(events.filter(e => e.id !== newEvent.id));
      toast.error('Failed to create event');
      console.error('Error creating event:', error);
    }
  };

  const handleQuickEventCancel = () => {
    setShowQuickEventForm(false);
    setQuickEventDate(null);
    setQuickEventHour(null);
  };

  // Event management
  const handleAddEvent = () => {
    setSelectedEvent(null);
    setFormData({
      title: '',
      description: '',
      type: 'meeting',
      date: selectedDate ? selectedDate.toISOString().split('T')[0] : '',
      startTime: '',
      endTime: '',
      location: '',
      attendees: ''
    });
    setShowEventDialog(true);
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    const eventDate = new Date(event.startTime);
    setFormData({
      title: event.title,
      description: event.description || '',
      type: event.type,
      date: eventDate.toISOString().split('T')[0],
      startTime: eventDate.toTimeString().slice(0, 5),
      endTime: new Date(event.endTime).toTimeString().slice(0, 5),
      location: event.location || '',
      attendees: event.attendees?.join(', ') || ''
    });
    setShowEventDialog(true);
  };

  const handleDeleteEvent = async (eventId: string) => {
    const success = await calendarAPI.deleteEvent(eventId, selectedBusiness?.id);
    if (success) {
      setEvents(events.filter(e => e.id !== eventId));
      toast.success('Event deleted');
    } else {
      toast.error('Failed to delete event');
    }
    setShowEventDialog(false);
  };

  const handleSaveEvent = async () => {
    if (!formData.title || !formData.date || !formData.startTime || !formData.endTime) return;

    const [startHour, startMinute] = formData.startTime.split(':').map(Number);
    const [endHour, endMinute] = formData.endTime.split(':').map(Number);
    const eventDate = new Date(formData.date);

    const newEvent: CalendarEvent = {
      id: selectedEvent?.id || Date.now().toString(),
      title: formData.title,
      description: formData.description,
      startTime: new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate(), startHour, startMinute),
      endTime: new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate(), endHour, endMinute),
      type: formData.type,
      location: formData.location,
      attendees: formData.attendees ? formData.attendees.split(',').map(e => e.trim()) : [],
      color: EVENT_COLORS[formData.type]
    };

    let success = false;
    if (selectedEvent) {
      // Update existing event
      success = await calendarAPI.updateEvent(selectedEvent.id, newEvent, selectedBusiness?.id);
      if (success) {
        setEvents(events.map(e => e.id === selectedEvent.id ? newEvent : e));
        toast.success('Event updated');
      } else {
        toast.error('Failed to update event');
      }
    } else {
      // Create new event
      success = await calendarAPI.createEvent(newEvent, selectedBusiness?.id);
      if (success) {
        setEvents([...events, newEvent]);
        toast.success('Event created');
      } else {
        toast.error('Failed to create event');
      }
    }

    if (success) {
      setShowEventDialog(false);
    }
  };

  // Handle event drop for drag and drop
  const handleEventDrop = async (event: CalendarEvent, newDate: Date, newHour: number, newMinute: number) => {
    // Calculate duration
    const oldStart = new Date(event.startTime);
    const oldEnd = new Date(event.endTime);
    const durationMs = oldEnd.getTime() - oldStart.getTime();

    // Create new start time with the dropped date/time
    const newStartTime = new Date(
      newDate.getFullYear(),
      newDate.getMonth(),
      newDate.getDate(),
      newHour,
      newMinute
    );

    // Create new end time (preserve duration)
    const newEndTime = new Date(newStartTime.getTime() + durationMs);

    // Updated event
    const updatedEvent: CalendarEvent = {
      ...event,
      startTime: newStartTime,
      endTime: newEndTime,
    };

    console.log('Dropping event:', {
      oldStart,
      newStart: newStartTime,
      newEnd: newEndTime,
    });

    // Optimistically update UI immediately
    setEvents(events.map(e => e.id === event.id ? updatedEvent : e));
    toast.success('Event moved');

    // Save to backend in background
    try {
      const success = await calendarAPI.updateEvent(event.id, updatedEvent, selectedBusiness?.id);
      if (!success) {
        // Revert if failed
        setEvents(events.map(e => e.id === event.id ? event : e));
        toast.error('Failed to save event');
      }
    } catch (error) {
      // Revert if error
      setEvents(events.map(e => e.id === event.id ? event : e));
      toast.error('Failed to move event');
      console.error('Error moving event:', error);
    }
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Get title based on view
  const getViewTitle = () => {
    if (view === 'year') {
      return year.toString();
    } else if (view === 'month') {
      return `${monthNames[month]} ${year}`;
    } else if (view === 'week') {
      const weekStart = getWeekDays[0];
      const weekEnd = getWeekDays[6];
      if (weekStart.getMonth() === weekEnd.getMonth()) {
        return `${monthNames[weekStart.getMonth()]} ${weekStart.getDate()}-${weekEnd.getDate()}, ${weekStart.getFullYear()}`;
      } else {
        return `${monthNames[weekStart.getMonth()]} ${weekStart.getDate()} - ${monthNames[weekEnd.getMonth()]} ${weekEnd.getDate()}, ${weekStart.getFullYear()}`;
      }
    } else {
      return currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    }
  };

  // Render Year View
  const renderYearView = () => {
    const months = Array.from({ length: 12 }, (_, i) => i);
    
    return (
      <div 
        className="grid grid-cols-3 md:grid-cols-4"
        style={{ gap: 'var(--spacing-4)' }}
      >
        {months.map(monthIndex => {
          const monthDate = new Date(year, monthIndex, 1);
          const monthInfo = getDaysInMonth(monthDate);
          const monthDays = [];
          
          for (let i = 0; i < monthInfo.startingDayOfWeek; i++) {
            monthDays.push(null);
          }
          for (let i = 1; i <= monthInfo.daysInMonth; i++) {
            monthDays.push(new Date(year, monthIndex, i));
          }
          
          const monthEvents = events.filter(e => 
            new Date(e.startTime).getMonth() === monthIndex &&
            new Date(e.startTime).getFullYear() === year
          );
          
          return (
            <Card 
              key={monthIndex}
              className="cursor-pointer transition-all hover:scale-105 transform"
              onClick={() => {
                setCurrentDate(monthDate);
                setView('month');
              }}
              style={{
                background: 'linear-gradient(135deg, var(--card) 0%, var(--accent) 100%)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                border: '1px solid var(--border)'
              }}
            >
              <CardHeader style={{ padding: 'var(--spacing-3)' }}>
                <CardTitle className="text-sm text-foreground" style={{ fontWeight: '600' }}>
                  {monthNames[monthIndex]}
                </CardTitle>
              </CardHeader>
              <CardContent style={{ padding: 'var(--spacing-3)', paddingTop: 0 }}>
                <div 
                  className="grid grid-cols-7 text-xs"
                  style={{ gap: '2px' }}
                >
                  {dayNames.map(day => (
                    <div key={day} className="text-center text-muted-foreground">
                      {day[0]}
                    </div>
                  ))}
                  {monthDays.map((day, idx) => (
                    <div
                      key={idx}
                      className="text-center"
                      style={{
                        padding: '2px',
                        borderRadius: 'var(--radius-sm)',
                        background: day && getEventsForDate(day).length > 0 ? 'var(--primary)' : 'transparent',
                        color: day && getEventsForDate(day).length > 0 ? 'var(--primary-foreground)' : 
                               day ? 'var(--foreground)' : 'transparent'
                      }}
                    >
                      {day ? day.getDate() : ''}
                    </div>
                  ))}
                </div>
                {monthEvents.length > 0 && (
                  <div 
                    className="text-xs text-muted-foreground text-center"
                    style={{ marginTop: 'var(--spacing-2)' }}
                  >
                    {monthEvents.length} event{monthEvents.length > 1 ? 's' : ''}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  // Render Month View
  const renderMonthView = () => {
    return (
      <div>
        {/* Day headers */}
        <div 
          className="grid grid-cols-7 border-b"
          style={{ 
            gap: 'var(--spacing-1)',
            marginBottom: 'var(--spacing-2)',
            paddingBottom: 'var(--spacing-2)'
          }}
        >
          {dayNames.map(day => (
            <div
              key={day}
              className="text-center text-muted-foreground"
              style={{ padding: 'var(--spacing-2)' }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div 
          className="grid grid-cols-7"
          style={{ gap: 'var(--spacing-1)' }}
        >
          {calendarDays.map((day, index) => {
            const dayEvents = day ? getEventsForDate(day).slice(0, 3) : [];
            const hasMoreEvents = day && getEventsForDate(day).length > 3;
            const isSelected = selectedDate && day && 
              day.getDate() === selectedDate.getDate() &&
              day.getMonth() === selectedDate.getMonth() &&
              day.getFullYear() === selectedDate.getFullYear();

            return (
              <div
                key={index}
                onClick={() => {
                  if (day) {
                    setCurrentDate(day);
                    setSelectedDate(day);
                    setView('week');
                  }
                }}
                className="border transition-all hover:scale-102 transform cursor-pointer hover:shadow-lg"
                style={{
                  minHeight: '120px',
                  padding: 'var(--spacing-3)',
                  borderRadius: 'var(--radius-lg)',
                  background: day ? (
                    isSelected 
                      ? 'linear-gradient(135deg, var(--primary) 0%, var(--primary) 100%)'
                      : isToday(day) 
                      ? 'linear-gradient(135deg, var(--accent) 0%, var(--card) 100%)'
                      : 'var(--card)'
                  ) : 'var(--muted)',
                  opacity: day ? 1 : 0.3,
                  border: day && isToday(day) ? '2px solid var(--primary)' : '1px solid var(--border)',
                  boxShadow: day && isToday(day) 
                    ? '0 4px 12px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                    : '0 2px 4px rgba(0, 0, 0, 0.04)',
                  backdropFilter: 'blur(8px)'
                }}
              >
                {day && (
                  <>
                    <div 
                      className="flex items-center justify-center"
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: 'var(--radius-full)',
                        background: isToday(day) ? 'var(--primary)' : 'transparent',
                        color: isToday(day) ? 'var(--primary-foreground)' : isSelected ? 'white' : 'var(--foreground)',
                        fontWeight: isToday(day) ? '600' : '500',
                        marginBottom: 'var(--spacing-2)',
                        boxShadow: isToday(day) ? '0 2px 8px rgba(0, 0, 0, 0.15)' : 'none'
                      }}
                    >
                      {day.getDate()}
                    </div>
                    
                    <div 
                      className="space-y-1"
                      style={{ gap: 'var(--spacing-1)' }}
                    >
                      {dayEvents.map((event, i) => (
                        <div
                          key={i}
                          className="text-xs truncate cursor-pointer transition-all hover:scale-105 transform"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditEvent(event);
                          }}
                          style={{
                            padding: '4px var(--spacing-2)',
                            borderRadius: 'var(--radius-md)',
                            background: `linear-gradient(135deg, ${event.color} 0%, ${event.color}dd 100%)`,
                            color: 'white',
                            borderLeft: `3px solid ${event.color}`,
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                            fontWeight: '500'
                          }}
                        >
                          {event.startTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} {event.title}
                        </div>
                      ))}
                      
                      {hasMoreEvents && (
                        <div 
                          className="text-xs"
                          style={{ 
                            paddingLeft: 'var(--spacing-2)',
                            color: isSelected ? 'rgba(255, 255, 255, 0.8)' : 'var(--muted-foreground)',
                            fontWeight: '500'
                          }}
                        >
                          +{getEventsForDate(day).length - 3} more
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render Week View
  const renderWeekView = () => {
    return (
      <div className="flex" style={{ gap: 'var(--spacing-2)', height: 'calc(100vh - 320px)' }}>
        {/* Time column */}
        <div style={{ width: '60px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: '40px', flexShrink: 0 }} /> {/* Header spacer */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {hours.map(hour => (
              <div
                key={hour}
                className="text-xs text-muted-foreground text-right"
                style={{ 
                  flex: 1,
                  paddingRight: 'var(--spacing-2)',
                  paddingTop: 'var(--spacing-1)',
                  minHeight: 0
                }}
              >
                {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
              </div>
            ))}
          </div>
        </div>

        {/* Days columns */}
        <div className="flex-1 grid grid-cols-7" style={{ gap: 'var(--spacing-1)', display: 'grid' }}>
          {getWeekDays.map((day, dayIndex) => (
            <div key={dayIndex} style={{ display: 'flex', flexDirection: 'column' }}>
              {/* Day header */}
              <div 
                className="text-center border-b cursor-pointer"
                onClick={() => {
                  setCurrentDate(day);
                  setSelectedDate(day);
                  setView('day');
                }}
                style={{
                  height: '40px',
                  flexShrink: 0,
                  padding: 'var(--spacing-2)',
                  background: isToday(day) ? 'var(--accent)' : 'var(--card)',
                  borderRadius: 'var(--radius-md) var(--radius-md) 0 0'
                }}
              >
                <div className="text-xs text-muted-foreground">{dayNames[day.getDay()]}</div>
                <div 
                  className="text-sm"
                  style={{ 
                    color: isToday(day) ? 'var(--primary)' : 'var(--foreground)',
                    fontWeight: isToday(day) ? '600' : '400'
                  }}
                >
                  {day.getDate()}
                </div>
              </div>

              {/* Hour slots */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {hours.map(hour => {
                  const hourEvents = getEventsForHour(day, hour);
                  const isQuickFormActive = showQuickEventForm && 
                    quickEventDate?.getDate() === day.getDate() && 
                    quickEventDate?.getMonth() === day.getMonth() &&
                    quickEventDate?.getFullYear() === day.getFullYear() &&
                    quickEventHour === hour;

                  return (
                    <div
                      key={hour}
                      className="border-t border-l border-r relative cursor-pointer hover:bg-accent/30 transition-colors"
                      onClick={(e) => {
                        if (!hourEvents.length && !isQuickFormActive) {
                          e.stopPropagation();
                          handleTimeSlotClick(day, hour);
                        }
                      }}
                      style={{ 
                        flex: 1,
                        minHeight: 0,
                        background: 'var(--card)'
                      }}
                    >
                      {isQuickFormActive && (
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20 }}>
                          <QuickEventForm
                            date={day}
                            hour={hour}
                            onSave={handleQuickEventSave}
                            onCancel={handleQuickEventCancel}
                          />
                        </div>
                      )}
                      
                      {hourEvents.map((event, idx) => (
                        <div
                          key={idx}
                          className="absolute left-0 right-0 text-xs cursor-pointer hover:opacity-80 overflow-hidden"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditEvent(event);
                          }}
                          style={{
                            top: 0,
                            padding: 'var(--spacing-1)',
                            margin: '2px',
                            background: event.color,
                            color: 'white',
                            borderRadius: 'var(--radius-sm)',
                            borderLeft: `3px solid ${event.color}`,
                            filter: 'brightness(0.9)',
                            zIndex: 10
                          }}
                        >
                          <div className="truncate">{event.title}</div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render Day View
  const renderDayView = () => {
    const dayEvents = getEventsForDate(currentDate);
    
    return (
      <div className="flex" style={{ gap: 'var(--spacing-4)', height: 'calc(100vh - 320px)' }}>
        {/* Time + Events column */}
        <div className="flex-1 flex" style={{ gap: 'var(--spacing-2)', display: 'flex' }}>
          {/* Time column */}
          <div style={{ width: '80px', display: 'flex', flexDirection: 'column' }}>
            {hours.map(hour => (
              <div
                key={hour}
                className="text-sm text-muted-foreground text-right border-t"
                style={{ 
                  flex: 1,
                  paddingRight: 'var(--spacing-3)',
                  paddingTop: 'var(--spacing-2)',
                  minHeight: 0
                }}
              >
                {hour === 0 ? '12:00 AM' : hour < 12 ? `${hour}:00 AM` : hour === 12 ? '12:00 PM' : `${hour - 12}:00 PM`}
              </div>
            ))}
          </div>

          {/* Events column */}
          <div className="flex-1" style={{ display: 'flex', flexDirection: 'column' }}>
            {hours.map(hour => {
              const hourEvents = getEventsForHour(currentDate, hour);
              const isQuickFormActive = showQuickEventForm && 
                quickEventDate?.getDate() === currentDate.getDate() && 
                quickEventDate?.getMonth() === currentDate.getMonth() &&
                quickEventDate?.getFullYear() === currentDate.getFullYear() &&
                quickEventHour === hour;

              return (
                <div
                  key={hour}
                  className="border-t border-l border-r relative cursor-pointer hover:bg-accent/30 transition-colors"
                  onClick={(e) => {
                    if (!hourEvents.length && !isQuickFormActive) {
                      e.stopPropagation();
                      handleTimeSlotClick(currentDate, hour);
                    }
                  }}
                  style={{ 
                    flex: 1,
                    minHeight: 0,
                    background: 'var(--card)'
                  }}
                >
                  {isQuickFormActive && (
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20 }}>
                      <QuickEventForm
                        date={currentDate}
                        hour={hour}
                        onSave={handleQuickEventSave}
                        onCancel={handleQuickEventCancel}
                      />
                    </div>
                  )}

                  {hourEvents.map((event, idx) => {
                    const eventStart = new Date(event.startTime);
                    const eventEnd = new Date(event.endTime);
                    const durationMinutes = (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60);
                    const height = Math.min((durationMinutes / 60) * 80, 160);
                    
                    return (
                      <div
                        key={idx}
                        className="absolute left-0 right-0 cursor-pointer hover:opacity-80 overflow-hidden"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditEvent(event);
                        }}
                        style={{
                          top: 0,
                          height: `${height}px`,
                          padding: 'var(--spacing-2)',
                          margin: 'var(--spacing-1)',
                          background: event.color,
                          color: 'white',
                          borderRadius: 'var(--radius-md)',
                          borderLeft: `4px solid ${event.color}`,
                          filter: 'brightness(0.9)',
                          zIndex: 10
                        }}
                      >
                        <div className="font-medium">{event.title}</div>
                        <div className="text-xs opacity-90">
                          {eventStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                          {eventEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        {event.location && (
                          <div className="text-xs opacity-80 flex items-center" style={{ gap: 'var(--spacing-1)', marginTop: 'var(--spacing-1)' }}>
                            <MapPin style={{ width: '12px', height: '12px' }} />
                            {event.location}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Day events sidebar */}
        <div style={{ width: '300px' }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Events</CardTitle>
              <CardDescription>{dayEvents.length} scheduled</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {dayEvents.length === 0 ? (
                  <div className="text-center text-muted-foreground" style={{ padding: 'var(--spacing-4)' }}>
                    <CalendarIcon className="mx-auto" style={{ width: '32px', height: '32px', marginBottom: 'var(--spacing-2)', opacity: 0.5 }} />
                    <p>No events today</p>
                  </div>
                ) : (
                  dayEvents.sort((a, b) => a.startTime.getTime() - b.startTime.getTime()).map(event => (
                    <div
                      key={event.id}
                      className="border rounded-lg transition-colors hover:bg-accent/50 cursor-pointer"
                      onClick={() => handleEditEvent(event)}
                      style={{
                        padding: 'var(--spacing-3)',
                        borderRadius: 'var(--radius-md)',
                        borderLeft: `4px solid ${event.color}`
                      }}
                    >
                      <div className="flex items-center justify-between" style={{ marginBottom: 'var(--spacing-1)' }}>
                        <h4 className="text-foreground">{event.title}</h4>
                        <Badge 
                          variant="outline"
                          style={{
                            background: event.color + '20',
                            borderColor: event.color,
                            color: event.color,
                            fontSize: '10px'
                          }}
                        >
                          {event.type}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div className="flex items-center" style={{ gap: 'var(--spacing-1)' }}>
                          <Clock style={{ width: '12px', height: '12px' }} />
                          {event.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                          {event.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        {event.location && (
                          <div className="flex items-center" style={{ gap: 'var(--spacing-1)' }}>
                            <MapPin style={{ width: '12px', height: '12px' }} />
                            {event.location}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <div 
      className="min-h-screen bg-background"
      style={{ padding: 'var(--spacing-6)' }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div 
          className="flex items-center justify-between flex-wrap"
          style={{ 
            marginBottom: 'var(--spacing-6)',
            gap: 'var(--spacing-4)'
          }}
        >
          <div>
            <h1 
              className="text-foreground"
              style={{ marginBottom: 'var(--spacing-1)' }}
            >
              Calendar
            </h1>
            <p className="text-muted-foreground">
              Manage your schedule and events
            </p>
          </div>

          <div 
            className="flex items-center"
            style={{ gap: 'var(--spacing-3)' }}
          >
            {/* View Toggle */}
            <ToggleGroup type="single" value={view} onValueChange={(value) => value && setView(value as typeof view)}>
              <ToggleGroupItem value="year" aria-label="Year view">
                Year
              </ToggleGroupItem>
              <ToggleGroupItem value="month" aria-label="Month view">
                Month
              </ToggleGroupItem>
              <ToggleGroupItem value="week" aria-label="Week view">
                Week
              </ToggleGroupItem>
              <ToggleGroupItem value="day" aria-label="Day view">
                Day
              </ToggleGroupItem>
            </ToggleGroup>

            <Button onClick={handleAddEvent}>
              <Plus style={{ width: '16px', height: '16px', marginRight: 'var(--spacing-2)' }} />
              Add Event
            </Button>
          </div>
        </div>

        {/* Calendar Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-foreground">
                {getViewTitle()}
              </CardTitle>
              
              <div 
                className="flex items-center"
                style={{ gap: 'var(--spacing-2)' }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToToday}
                >
                  Today
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToPrevious}
                >
                  <ChevronLeft style={{ width: '16px', height: '16px' }} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToNext}
                >
                  <ChevronRight style={{ width: '16px', height: '16px' }} />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {view === 'year' && renderYearView()}
            {view === 'month' && renderMonthView()}
            {view === 'week' && renderWeekView()}
            {view === 'day' && renderDayView()}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Event Dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedEvent ? 'Edit Event' : 'Add New Event'}
            </DialogTitle>
            <DialogDescription>
              {selectedEvent ? 'Update event details' : 'Create a new calendar event'}
            </DialogDescription>
          </DialogHeader>

          <div 
            className="space-y-4"
            style={{ gap: 'var(--spacing-4)' }}
          >
            <div>
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Team Meeting"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Add event details..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="type">Event Type *</Label>
              <Select value={formData.type} onValueChange={(value: CalendarEvent['type']) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="task">Task</SelectItem>
                  <SelectItem value="reminder">Reminder</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>

            <div 
              className="grid grid-cols-2"
              style={{ gap: 'var(--spacing-4)' }}
            >
              <div>
                <Label htmlFor="startTime">Start Time *</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="endTime">End Time *</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Conference Room A or Zoom"
              />
            </div>

            <div>
              <Label htmlFor="attendees">Attendees</Label>
              <Input
                id="attendees"
                value={formData.attendees}
                onChange={(e) => setFormData({ ...formData, attendees: e.target.value })}
                placeholder="Comma-separated emails"
              />
            </div>

            <div 
              className="flex"
              style={{ 
                gap: 'var(--spacing-3)',
                paddingTop: 'var(--spacing-4)'
              }}
            >
              <Button
                onClick={handleSaveEvent}
                disabled={!formData.title || !formData.date || !formData.startTime || !formData.endTime}
                className="flex-1"
              >
                {selectedEvent ? 'Update Event' : 'Create Event'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowEventDialog(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Wrapper with DnD Provider
export default function CalendarPageWithDnd() {
  return (
    <DndProvider backend={HTML5Backend}>
      <CalendarPage />
    </DndProvider>
  );
}