/**
 * Week View Component
 * Displays calendar in week format with 15-minute interval drag and drop
 */

import React from 'react';
import { Clock, MapPin } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { QuickEventForm } from '../QuickEventForm';
import { DraggableEvent, DroppableTimeSlot } from './DragAndDrop';
import type { CalendarEvent } from './types';
import { getWeekDays, dayNames, monthNames, isToday, getEventsForTimeSlot, formatTime } from './utils';

interface WeekViewProps {
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
  onDayClick: (date: Date) => void;
}

export function WeekView({
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
  onDayClick,
}: WeekViewProps) {
  const weekDays = getWeekDays(currentDate);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = [0, 15, 30, 45]; // 15-minute intervals

  // Mobile Agenda View
  const MobileAgendaView = () => {
    return (
      <div className="lg:hidden space-y-2">
        {weekDays.map((day, dayIndex) => {
          const dayEvents = events.filter(e => {
            const eventDate = new Date(e.startTime);
            return eventDate.getDate() === day.getDate() &&
                   eventDate.getMonth() === day.getMonth() &&
                   eventDate.getFullYear() === day.getFullYear();
          }).sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

          return (
            <Card 
              key={dayIndex}
              className="overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
              onClick={() => onDayClick(day)}
              style={{
                background: isToday(day) ? 'linear-gradient(135deg, var(--accent) 0%, var(--card) 100%)' : 'var(--card)',
                border: isToday(day) ? '2px solid var(--primary)' : '1px solid var(--border)'
              }}
            >
              <CardHeader style={{ padding: 'var(--spacing-2) var(--spacing-3)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm" style={{ color: isToday(day) ? 'var(--primary)' : 'var(--foreground)' }}>
                      {dayNames[day.getDay()]} {day.getDate()}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {monthNames[day.getMonth()]}
                    </CardDescription>
                  </div>
                  <Badge 
                    variant={isToday(day) ? "default" : "outline"}
                    style={{ fontSize: '10px' }}
                  >
                    {dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </CardHeader>
              
              {dayEvents.length > 0 && (
                <CardContent style={{ padding: 'var(--spacing-2) var(--spacing-3) var(--spacing-3)' }}>
                  <div className="space-y-2">
                    {dayEvents.map(event => {
                      const eventStart = new Date(event.startTime);
                      const eventEnd = new Date(event.endTime);
                      
                      return (
                        <div
                          key={event.id}
                          className="transition-all active:scale-95 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditEvent(event);
                          }}
                          style={{
                            padding: 'var(--spacing-2)',
                            borderRadius: 'var(--radius-md)',
                            background: event.color + '15',
                            borderLeft: `4px solid ${event.color}`
                          }}
                        >
                          <div className="flex items-start justify-between" style={{ gap: 'var(--spacing-2)' }}>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm" style={{ fontWeight: '500', color: 'var(--foreground)' }}>
                                {event.title}
                              </div>
                              <div className="flex items-center text-xs text-muted-foreground" style={{ gap: 'var(--spacing-1)', marginTop: 'var(--spacing-1)' }}>
                                <Clock style={{ width: '12px', height: '12px' }} />
                                <span>
                                  {formatTime(eventStart.getHours(), eventStart.getMinutes())} - 
                                  {formatTime(eventEnd.getHours(), eventEnd.getMinutes())}
                                </span>
                              </div>
                              {event.location && (
                                <div className="flex items-center text-xs text-muted-foreground" style={{ gap: 'var(--spacing-1)', marginTop: 'var(--spacing-1)' }}>
                                  <MapPin style={{ width: '12px', height: '12px' }} />
                                  <span className="truncate">{event.location}</span>
                                </div>
                              )}
                            </div>
                            <Badge 
                              variant="outline"
                              style={{
                                background: event.color + '20',
                                borderColor: event.color,
                                color: event.color,
                                fontSize: '9px',
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
                </CardContent>
              )}
              
              {dayEvents.length === 0 && (
                <CardContent style={{ padding: 'var(--spacing-2) var(--spacing-3) var(--spacing-3)' }}>
                  <div className="text-center text-muted-foreground text-xs" style={{ padding: 'var(--spacing-2)' }}>
                    No events scheduled
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    );
  };

  // Desktop Grid View
  const DesktopGridView = () => {
    return (
      <div 
        className="hidden lg:flex" 
        style={{ 
          gap: 'var(--spacing-2)', 
          height: 'calc(100vh - 380px)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          background: 'var(--card)',
          border: '1px solid var(--border)'
        }}
      >
        {/* Time column */}
        <div 
          style={{ 
            width: '70px', 
            flexShrink: 0, 
            display: 'flex', 
            flexDirection: 'column',
            background: 'var(--muted)',
            borderRight: '1px solid var(--border)'
          }}
        >
          <div style={{ height: '48px', flexShrink: 0, borderBottom: '2px solid var(--border)' }} /> {/* Header spacer */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }} className="thin-scrollbar">
            {hours.map(hour => (
              <div
                key={hour}
                style={{ 
                  flex: 1,
                  minHeight: 0,
                  paddingRight: 'var(--spacing-3)',
                  paddingTop: 'var(--spacing-2)',
                  borderBottom: '1px solid var(--border)',
                  fontWeight: 'var(--font-weight-medium)'
                }}
              >
                <span className="text-xs text-muted-foreground">
                  {formatTime(hour)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Days columns */}
        <div className="flex-1 grid grid-cols-7" style={{ gap: '1px', minWidth: '100%', display: 'grid', background: 'var(--border)' }}>
          {weekDays.map((day, dayIndex) => (
            <div key={dayIndex} className="min-w-0" style={{ display: 'flex', flexDirection: 'column', background: 'var(--background)' }}>
              {/* Day header */}
              <div 
                className="text-center cursor-pointer hover:bg-accent/50 active:bg-accent/70 transition-all"
                onClick={() => onDayClick(day)}
                style={{
                  height: '48px',
                  flexShrink: 0,
                  padding: 'var(--spacing-2)',
                  background: isToday(day) ? 'var(--primary-soft)' : 'var(--card)',
                  borderBottom: isToday(day) ? '2px solid var(--primary)' : '2px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  gap: 'var(--spacing-1)'
                }}
              >
                <div 
                  className="text-xs"
                  style={{ 
                    color: 'var(--muted-foreground)',
                    fontWeight: 'var(--font-weight-medium)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                >
                  {dayNames[day.getDay()]}
                </div>
                <div 
                  style={{ 
                    color: isToday(day) ? 'var(--primary)' : 'var(--foreground)',
                    fontWeight: isToday(day) ? 'var(--font-weight-semibold)' : 'var(--font-weight-medium)',
                    fontSize: '15px'
                  }}
                >
                  {day.getDate()}
                </div>
              </div>

              {/* Hour slots with 15-minute intervals */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }} className="thin-scrollbar">
                {hours.map(hour => (
                  <div key={hour} style={{ flex: 1, minHeight: 0, position: 'relative', display: 'flex', flexDirection: 'column' }}>
                    {minutes.map((minute, idx) => {
                      const slotEvents = getEventsForTimeSlot(events, day, hour, minute);
                      const isQuickFormActive = showQuickEventForm && 
                        quickEventDate?.getDate() === day.getDate() && 
                        quickEventDate?.getMonth() === day.getMonth() &&
                        quickEventDate?.getFullYear() === day.getFullYear() &&
                        quickEventHour === hour &&
                        minute === 0; // Show form only on the hour

                      return (
                        <DroppableTimeSlot
                          key={`${hour}-${minute}`}
                          date={day}
                          hour={hour}
                          minute={minute}
                          onDrop={onEventDrop}
                          onSlotClick={() => {
                            if (!slotEvents.length && !isQuickFormActive && minute === 0) {
                              onTimeSlotClick(day, hour);
                            }
                          }}
                          className="relative cursor-pointer hover:bg-accent/20 active:bg-accent/40 transition-colors"
                          style={{ 
                            flex: 1,
                            minHeight: 0,
                            background: 'var(--card)',
                            borderBottom: minute === 0 ? '1px solid var(--border)' : '1px dashed rgba(0, 0, 0, 0.05)',
                          }}
                        >
                          {isQuickFormActive && minute === 0 && (
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20 }}>
                              <QuickEventForm
                                date={day}
                                hour={hour}
                                onSave={onQuickEventSave}
                                onCancel={onQuickEventCancel}
                              />
                            </div>
                          )}
                          
                          {slotEvents.map((event, idx) => {
                            const eventStart = new Date(event.startTime);
                            const startMinute = eventStart.getMinutes();
                            const eventEnd = new Date(event.endTime);
                            const durationMinutes = (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60);
                            
                            // Only render if this is the starting slot
                            if (eventStart.getHours() === hour && Math.floor(startMinute / 15) * 15 === minute) {
                              const height = (durationMinutes / 15) * 15; // 15px per 15 minutes
                              
                              return (
                                <DraggableEvent
                                  key={event.id}
                                  event={event}
                                  onEdit={onEditEvent}
                                >
                                  <div
                                    className="absolute left-0 right-0 text-xs overflow-hidden"
                                    style={{
                                      top: 0,
                                      height: `${height}px`,
                                      padding: 'var(--spacing-1)',
                                      margin: '1px',
                                      background: event.color,
                                      color: 'white',
                                      borderRadius: 'var(--radius-sm)',
                                      borderLeft: `3px solid ${event.color}`,
                                      filter: 'brightness(0.9)',
                                      zIndex: 10,
                                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
                                      fontSize: '10px'
                                    }}
                                  >
                                    <div className="truncate" style={{ fontWeight: '500' }}>
                                      {event.title}
                                    </div>
                                    {height >= 30 && (
                                      <div className="text-xs opacity-80" style={{ fontSize: '9px' }}>
                                        {formatTime(eventStart.getHours(), eventStart.getMinutes())}
                                      </div>
                                    )}
                                  </div>
                                </DraggableEvent>
                              );
                            }
                            return null;
                          })}
                        </DroppableTimeSlot>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <MobileAgendaView />
      <DesktopGridView />
    </>
  );
}