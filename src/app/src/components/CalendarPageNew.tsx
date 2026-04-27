/**
 * Calendar Page - Main Component
 * Orchestrates all calendar views and functionality
 * Uses design system CSS variables for consistent styling
 */

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import { useBusiness } from './BusinessContext';
import { toast } from 'sonner@2.0.3';
import { calendarAPI } from '../utils/calendarAPI';
import { supabase } from '../utils/supabase/client';

// Calendar sub-components
import { WeekView } from './calendar/WeekView';
import { DayView } from './calendar/DayView';
import { MonthView } from './calendar/MonthView';
import { YearView } from './calendar/YearView';
import { EventDialog } from './calendar/EventDialog';
import type { CalendarEvent, CalendarView, EventFormData } from './calendar/types';
import { EVENT_COLORS } from './calendar/types';
import { getDaysInMonth, monthNames } from './calendar/utils';

function CalendarPageContent() {
  const { selectedBusiness } = useBusiness();
  const [isLoading, setIsLoading] = useState(true);
  
  // Load saved state from localStorage
  const [currentDate, setCurrentDate] = useState(() => {
    const saved = localStorage.getItem('calendarCurrentDate');
    return saved ? new Date(saved) : new Date();
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [view, setView] = useState<CalendarView>(() => {
    const saved = localStorage.getItem('calendarView');
    return (saved as CalendarView) || 'month';
  });
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showQuickEventForm, setShowQuickEventForm] = useState(false);
  const [quickEventDate, setQuickEventDate] = useState<Date | null>(null);
  const [quickEventHour, setQuickEventHour] = useState<number | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  // Form state
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    type: 'meeting',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    attendees: ''
  });

  // Save view and current date to localStorage
  useEffect(() => {
    localStorage.setItem('calendarView', view);
  }, [view]);

  useEffect(() => {
    localStorage.setItem('calendarCurrentDate', currentDate.toISOString());
  }, [currentDate]);

  // Load events from backend
  useEffect(() => {
    const loadEvents = async () => {
      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          console.log('📅 No active session, skipping calendar load');
          setIsLoading(false);
          return;
        }
        
        console.log('📅 Loading calendar events for businessId:', selectedBusiness?.id);
        const fetchedEvents = await calendarAPI.fetchEvents(selectedBusiness?.id);
        console.log('📅 Loaded events from backend:', {
          count: fetchedEvents.length,
          events: fetchedEvents.map(e => ({ id: e.id, title: e.title }))
        });
        setEvents(fetchedEvents);
        
        if (fetchedEvents.length > 0) {
          toast.success(`Loaded ${fetchedEvents.length} calendar events`);
        }
      } catch (error: any) {
        console.error('Failed to load calendar events:', error);
        toast.error('Failed to load calendar events');
      } finally {
        setIsLoading(false);
      }
    };

    loadEvents();
  }, [selectedBusiness?.id]);

  // Navigation functions
  const { year, month } = getDaysInMonth(currentDate);

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
    if (!quickEventDate) return;

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
    
    try {
      // Optimistically add event
      setEvents([...events, newEvent]);
      setShowQuickEventForm(false);
      setQuickEventDate(null);
      setQuickEventHour(null);
      
      // Save to backend
      const success = await calendarAPI.createEvent(newEvent, selectedBusiness?.id);
      if (success) {
        toast.success('Event created');
      } else {
        setEvents(events.filter(e => e.id !== newEvent.id));
        toast.error('Failed to save event');
      }
    } catch (error) {
      setEvents(events.filter(e => e.id !== newEvent.id));
      toast.error('Failed to create event');
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
      success = await calendarAPI.updateEvent(selectedEvent.id, newEvent, selectedBusiness?.id);
      if (success) {
        setEvents(events.map(e => e.id === selectedEvent.id ? newEvent : e));
        toast.success('Event updated');
      } else {
        toast.error('Failed to update event');
      }
    } else {
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
    const oldStart = new Date(event.startTime);
    const oldEnd = new Date(event.endTime);
    const durationMs = oldEnd.getTime() - oldStart.getTime();

    const newStartTime = new Date(
      newDate.getFullYear(),
      newDate.getMonth(),
      newDate.getDate(),
      newHour,
      newMinute
    );

    const newEndTime = new Date(newStartTime.getTime() + durationMs);

    const updatedEvent: CalendarEvent = {
      ...event,
      startTime: newStartTime,
      endTime: newEndTime,
    };

    console.log('📅 Dropping event:', {
      eventId: event.id,
      oldStart: oldStart.toISOString(),
      newStart: newStartTime.toISOString(),
      newEnd: newEndTime.toISOString(),
      duration: durationMs
    });

    // Store original events for potential rollback
    const originalEvents = [...events];

    // Optimistically update UI
    setEvents(events.map(e => e.id === event.id ? updatedEvent : e));
    toast.success('Event moved');

    // Save to backend
    try {
      const success = await calendarAPI.updateEvent(event.id, updatedEvent, selectedBusiness?.id);
      if (!success) {
        console.error('❌ Failed to save event move, reverting');
        setEvents(originalEvents);
        toast.error('Failed to save event - changes reverted');
      } else {
        console.log('✅ Event move saved successfully');
      }
    } catch (error) {
      console.error('❌ Error moving event, reverting:', error);
      setEvents(originalEvents);
      toast.error('Failed to move event - changes reverted');
    }
  };

  // View title
  const getViewTitle = () => {
    if (view === 'year') {
      return year.toString();
    } else if (view === 'month') {
      return `${monthNames[month]} ${year}`;
    } else if (view === 'week') {
      return `Week of ${currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else {
      return currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    }
  };

  return (
    <div 
      className="min-h-screen bg-background"
      style={{ padding: 'var(--spacing-3) var(--spacing-4)' }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div 
          className="flex flex-col md:flex-row md:items-center md:justify-between"
          style={{ 
            marginBottom: 'var(--spacing-4)',
            gap: 'var(--spacing-3)'
          }}
        >
          <div>
            <h1 
              className="text-foreground"
              style={{ marginBottom: 'var(--spacing-1)' }}
            >
              Calendar
            </h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Manage your schedule and events
            </p>
          </div>

          <div 
            className="flex flex-col sm:flex-row items-stretch sm:items-center"
            style={{ gap: 'var(--spacing-2)' }}
          >
            <ToggleGroup 
              type="single" 
              value={view} 
              onValueChange={(value) => value && setView(value as CalendarView)}
              className="grid grid-cols-4 sm:flex w-full sm:w-auto"
            >
              <ToggleGroupItem value="year" aria-label="Year view" className="text-xs sm:text-sm">
                Year
              </ToggleGroupItem>
              <ToggleGroupItem value="month" aria-label="Month view" className="text-xs sm:text-sm">
                Month
              </ToggleGroupItem>
              <ToggleGroupItem value="week" aria-label="Week view" className="text-xs sm:text-sm">
                Week
              </ToggleGroupItem>
              <ToggleGroupItem value="day" aria-label="Day view" className="text-xs sm:text-sm">
                Day
              </ToggleGroupItem>
            </ToggleGroup>

            <Button onClick={handleAddEvent} className="w-full sm:w-auto">
              <Plus style={{ width: '16px', height: '16px', marginRight: 'var(--spacing-2)' }} />
              <span className="hidden sm:inline">Add Event</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>

        {/* Calendar Card */}
        <Card>
          <CardHeader style={{ padding: 'var(--spacing-3) var(--spacing-4)' }}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between" style={{ gap: 'var(--spacing-3)' }}>
              <CardTitle className="text-foreground text-base sm:text-lg">
                {getViewTitle()}
              </CardTitle>
              
              <div 
                className="flex items-center justify-between sm:justify-end"
                style={{ gap: 'var(--spacing-2)' }}
              >
                <Button variant="outline" size="sm" onClick={goToToday} className="text-xs sm:text-sm">
                  Today
                </Button>
                <div className="flex items-center" style={{ gap: 'var(--spacing-1)' }}>
                  <Button variant="ghost" size="icon" onClick={goToPrevious} className="h-8 w-8 sm:h-10 sm:w-10">
                    <ChevronLeft style={{ width: '16px', height: '16px' }} />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={goToNext} className="h-8 w-8 sm:h-10 sm:w-10">
                    <ChevronRight style={{ width: '16px', height: '16px' }} />
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent style={{ padding: 'var(--spacing-2) var(--spacing-4) var(--spacing-4)' }}>
            {view === 'year' && (
              <YearView
                year={year}
                events={events}
                onMonthClick={(monthDate) => {
                  setCurrentDate(monthDate);
                  setView('month');
                }}
              />
            )}
            {view === 'month' && (
              <MonthView
                currentDate={currentDate}
                selectedDate={selectedDate}
                events={events}
                onDayClick={(day) => {
                  setCurrentDate(day);
                  setSelectedDate(day);
                  setView('week');
                }}
                onEventClick={handleEditEvent}
              />
            )}
            {view === 'week' && (
              <WeekView
                currentDate={currentDate}
                events={events}
                showQuickEventForm={showQuickEventForm}
                quickEventDate={quickEventDate}
                quickEventHour={quickEventHour}
                onTimeSlotClick={handleTimeSlotClick}
                onQuickEventSave={handleQuickEventSave}
                onQuickEventCancel={handleQuickEventCancel}
                onEditEvent={handleEditEvent}
                onEventDrop={handleEventDrop}
                onDayClick={(day) => {
                  setCurrentDate(day);
                  setSelectedDate(day);
                  setView('day');
                }}
              />
            )}
            {view === 'day' && (
              <DayView
                currentDate={currentDate}
                events={events}
                showQuickEventForm={showQuickEventForm}
                quickEventDate={quickEventDate}
                quickEventHour={quickEventHour}
                onTimeSlotClick={handleTimeSlotClick}
                onQuickEventSave={handleQuickEventSave}
                onQuickEventCancel={handleQuickEventCancel}
                onEditEvent={handleEditEvent}
                onEventDrop={handleEventDrop}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Event Dialog */}
      <EventDialog
        open={showEventDialog}
        onOpenChange={setShowEventDialog}
        selectedEvent={selectedEvent}
        formData={formData}
        onFormDataChange={setFormData}
        onSave={handleSaveEvent}
        onDelete={selectedEvent ? () => handleDeleteEvent(selectedEvent.id) : undefined}
      />
    </div>
  );
}

// Wrap with DnD Provider
export default function CalendarPage() {
  return (
    <DndProvider backend={HTML5Backend}>
      <CalendarPageContent />
    </DndProvider>
  );
}