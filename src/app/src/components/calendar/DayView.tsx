/**
 * Day View Component
 * Displays calendar in day format with 15-minute interval drag and drop
 */

import React from 'react';
import { Clock, MapPin, Calendar as CalendarIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { QuickEventForm } from '../QuickEventForm';
import { DraggableEvent, DroppableTimeSlot } from './DragAndDrop';
import type { CalendarEvent } from './types';
import { getEventsForDate, getEventsForTimeSlot, formatTime } from './utils';

interface DayViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  showQuickEventForm: boolean;
  quickEventDate: Date | null;
  quickEventHour: number | null;
  onTimeSlotClick: (date: Date, hour: number) => void;
  onQuickEventSave: (title: string, type: CalendarEvent['type'], duration: number, selectedHour: number) => Promise<void>;
  onQuickEventCancel: () => void;
  onEditEvent: (event: CalendarEvent) => void;
  onEventDrop: (event: CalendarEvent, newDate: Date, newHour: number, newMinute: number) => void;
}

export function DayView({
  currentDate,
  events,
  showQuickEventForm,
  quickEventDate,
  quickEventHour,
  onTimeSlotClick,
  onQuickEventSave,
  onQuickEventCancel,
  onEditEvent,
  onEventDrop,
}: DayViewProps) {
  const dayEvents = events.filter(e => {
    const eventDate = new Date(e.startTime);
    return eventDate.getDate() === currentDate.getDate() &&
           eventDate.getMonth() === currentDate.getMonth() &&
           eventDate.getFullYear() === currentDate.getFullYear();
  });

  // Sort events by time
  const sortedDayEvents = [...dayEvents].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  const now = new Date();
  const isToday = currentDate.toDateString() === now.toDateString();

  // Group events by time of day
  const groupEventsByTimeOfDay = (events: CalendarEvent[]) => {
    const morning: CalendarEvent[] = []; // 5am - 12pm
    const afternoon: CalendarEvent[] = []; // 12pm - 5pm
    const evening: CalendarEvent[] = []; // 5pm - 9pm
    const night: CalendarEvent[] = []; // 9pm - 5am

    events.forEach(event => {
      const hour = new Date(event.startTime).getHours();
      if (hour >= 5 && hour < 12) morning.push(event);
      else if (hour >= 12 && hour < 17) afternoon.push(event);
      else if (hour >= 17 && hour < 21) evening.push(event);
      else night.push(event);
    });

    return { morning, afternoon, evening, night };
  };

  const groupedEvents = groupEventsByTimeOfDay(sortedDayEvents);

  const TimeOfDaySection = ({ title, events, icon }: { title: string; events: CalendarEvent[]; icon: string }) => {
    if (events.length === 0) return null;

    return (
      <div style={{ marginBottom: 'var(--spacing-6)' }}>
        <div 
          className="flex items-center"
          style={{ 
            gap: 'var(--spacing-2)',
            marginBottom: 'var(--spacing-3)',
            paddingLeft: 'var(--spacing-2)'
          }}
        >
          <span style={{ fontSize: '20px' }}>{icon}</span>
          <h3 
            className="text-muted-foreground"
            style={{ 
              fontSize: '13px',
              fontWeight: 'var(--font-weight-semibold)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            {title}
          </h3>
        </div>
        
        <div className="space-y-2">
          {events.map(event => {
            const eventStart = new Date(event.startTime);
            const eventEnd = new Date(event.endTime);
            const isPast = isToday && eventEnd < now;
            const isCurrent = isToday && eventStart <= now && eventEnd > now;

            return (
              <div
                key={event.id}
                className="cursor-pointer transition-all hover:bg-accent/50 active:bg-accent/70"
                onClick={() => onEditEvent(event)}
                style={{
                  padding: 'var(--spacing-3) var(--spacing-4)',
                  background: isCurrent ? 'var(--primary-soft)' : 'var(--card)',
                  borderRadius: 'var(--radius-lg)',
                  border: isCurrent ? '2px solid var(--primary)' : '1px solid var(--border)',
                  borderLeft: `4px solid ${event.color}`,
                  opacity: isPast ? 0.6 : 1,
                  boxShadow: isCurrent ? '0 4px 12px rgba(0, 0, 0, 0.1)' : 'none'
                }}
              >
                <div className="flex items-start justify-between" style={{ gap: 'var(--spacing-3)' }}>
                  {/* Event details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap" style={{ gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-2)' }}>
                      <h4 
                        className="text-foreground"
                        style={{ 
                          fontSize: '16px',
                          fontWeight: 'var(--font-weight-semibold)',
                          lineHeight: '1.3'
                        }}
                      >
                        {event.title}
                      </h4>
                      {isCurrent && (
                        <Badge 
                          style={{
                            background: 'var(--primary)',
                            color: 'var(--primary-foreground)',
                            fontSize: '10px',
                            fontWeight: 'var(--font-weight-medium)',
                            padding: '2px var(--spacing-2)',
                            borderRadius: 'var(--radius-full)'
                          }}
                        >
                          Now
                        </Badge>
                      )}
                      {isPast && (
                        <Badge 
                          style={{
                            background: 'var(--muted)',
                            color: 'var(--muted-foreground)',
                            fontSize: '10px',
                            fontWeight: 'var(--font-weight-medium)',
                            padding: '2px var(--spacing-2)',
                            borderRadius: 'var(--radius-full)'
                          }}
                        >
                          Completed
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center" style={{ gap: 'var(--spacing-2)' }}>
                        <Clock 
                          className="text-muted-foreground"
                          style={{ width: '14px', height: '14px', flexShrink: 0 }} 
                        />
                        <span 
                          className="text-muted-foreground"
                          style={{ 
                            fontSize: '14px',
                            fontWeight: 'var(--font-weight-normal)'
                          }}
                        >
                          {eventStart.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} - {eventEnd.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                        </span>
                      </div>

                      {event.location && (
                        <div className="flex items-center" style={{ gap: 'var(--spacing-2)' }}>
                          <MapPin 
                            className="text-muted-foreground"
                            style={{ width: '14px', height: '14px', flexShrink: 0 }} 
                          />
                          <span 
                            className="text-muted-foreground truncate"
                            style={{ 
                              fontSize: '14px',
                              fontWeight: 'var(--font-weight-normal)'
                            }}
                          >
                            {event.location}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Event type badge */}
                  <Badge 
                    variant="outline"
                    style={{
                      background: event.color + '20',
                      borderColor: event.color,
                      color: event.color,
                      fontSize: '11px',
                      fontWeight: 'var(--font-weight-medium)',
                      padding: 'var(--spacing-1) var(--spacing-3)',
                      borderRadius: 'var(--radius-md)',
                      flexShrink: 0
                    }}
                  >
                    {event.type}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col" style={{ gap: 'var(--spacing-4)', height: 'calc(100vh - 380px)' }}>
      {/* Header Card */}
      <Card 
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)'
        }}
      >
        <CardHeader style={{ padding: 'var(--spacing-4)' }}>
          <div className="flex items-center justify-between flex-wrap" style={{ gap: 'var(--spacing-3)' }}>
            <div>
              <CardTitle 
                className="text-foreground" 
                style={{ 
                  fontSize: '20px',
                  fontWeight: 'var(--font-weight-semibold)',
                  marginBottom: 'var(--spacing-1)'
                }}
              >
                {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </CardTitle>
              <CardDescription 
                style={{ 
                  fontSize: '14px',
                  fontWeight: 'var(--font-weight-normal)'
                }}
              >
                {sortedDayEvents.length === 0 ? 'No events scheduled' : `${sortedDayEvents.length} event${sortedDayEvents.length !== 1 ? 's' : ''} scheduled`}
              </CardDescription>
            </div>

            <div className="flex items-center" style={{ gap: 'var(--spacing-2)' }}>
              {isToday && (
                <Badge 
                  style={{
                    background: 'var(--primary)',
                    color: 'var(--primary-foreground)',
                    fontSize: '12px',
                    fontWeight: 'var(--font-weight-medium)',
                    padding: 'var(--spacing-1) var(--spacing-3)',
                    borderRadius: 'var(--radius-full)'
                  }}
                >
                  Today
                </Badge>
              )}
              
              <button
                onClick={() => onTimeSlotClick(currentDate, now.getHours())}
                className="transition-all hover:bg-accent active:scale-95"
                style={{
                  background: 'var(--primary)',
                  color: 'var(--primary-foreground)',
                  padding: 'var(--spacing-2) var(--spacing-4)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '14px',
                  fontWeight: 'var(--font-weight-medium)',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                }}
              >
                + Add Event
              </button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Events List */}
      <div 
        className="flex-1 overflow-y-auto"
        style={{
          padding: 'var(--spacing-2)',
          background: 'var(--background)',
          borderRadius: 'var(--radius-lg)'
        }}
      >
        {sortedDayEvents.length === 0 ? (
          <div 
            className="flex flex-col items-center justify-center text-center"
            style={{ 
              height: '100%',
              padding: 'var(--spacing-8)'
            }}
          >
            <CalendarIcon 
              className="text-muted-foreground"
              style={{ 
                width: '64px', 
                height: '64px', 
                marginBottom: 'var(--spacing-4)',
                opacity: 0.3
              }} 
            />
            <h3 
              className="text-foreground"
              style={{ 
                fontSize: '18px',
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: 'var(--spacing-2)'
              }}
            >
              No events scheduled
            </h3>
            <p 
              className="text-muted-foreground"
              style={{ 
                fontSize: '14px',
                fontWeight: 'var(--font-weight-normal)',
                marginBottom: 'var(--spacing-4)'
              }}
            >
              Tap "Add Event" to schedule something for {isToday ? 'today' : 'this day'}
            </p>
          </div>
        ) : (
          <>
            <TimeOfDaySection title="Morning" events={groupedEvents.morning} icon="🌅" />
            <TimeOfDaySection title="Afternoon" events={groupedEvents.afternoon} icon="☀️" />
            <TimeOfDaySection title="Evening" events={groupedEvents.evening} icon="🌆" />
            <TimeOfDaySection title="Night" events={groupedEvents.night} icon="🌙" />
          </>
        )}
      </div>
    </div>
  );
}