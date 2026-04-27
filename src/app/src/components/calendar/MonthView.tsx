/**
 * Month View Component
 * Displays calendar in month grid format
 */

import React, { useMemo } from 'react';
import type { CalendarEvent } from './types';
import { getDaysInMonth, dayNames, isToday, getEventsForDate } from './utils';

interface MonthViewProps {
  currentDate: Date;
  selectedDate: Date | null;
  events: CalendarEvent[];
  onDayClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}

export function MonthView({
  currentDate,
  selectedDate,
  events,
  onDayClick,
  onEventClick,
}: MonthViewProps) {
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
            className="text-center text-muted-foreground text-xs sm:text-sm"
            style={{ padding: 'var(--spacing-1) var(--spacing-2)' }}
          >
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{day.slice(0, 1)}</span>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div 
        className="grid grid-cols-7"
        style={{ gap: 'var(--spacing-1)' }}
      >
        {calendarDays.map((day, index) => {
          const dayEvents = day ? getEventsForDate(events, day).slice(0, 2) : [];
          const hasMoreEvents = day && getEventsForDate(events, day).length > 2;
          const isSelected = selectedDate && day && 
            day.getDate() === selectedDate.getDate() &&
            day.getMonth() === selectedDate.getMonth() &&
            day.getFullYear() === selectedDate.getFullYear();

          return (
            <div
              key={index}
              onClick={() => {
                if (day) {
                  onDayClick(day);
                }
              }}
              className="border transition-all hover:scale-105 sm:hover:scale-102 transform cursor-pointer active:scale-95"
              style={{
                minHeight: '80px',
                aspectRatio: '1/1',
                padding: 'var(--spacing-2)',
                borderRadius: 'var(--radius-md)',
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
                  ? '0 2px 8px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                  : '0 1px 3px rgba(0, 0, 0, 0.04)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {day && (
                <>
                  <div 
                    className="flex items-center justify-center text-xs sm:text-sm"
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: 'var(--radius-full)',
                      background: isToday(day) ? 'var(--primary)' : 'transparent',
                      color: isToday(day) ? 'var(--primary-foreground)' : isSelected ? 'white' : 'var(--foreground)',
                      fontWeight: isToday(day) ? '600' : '500',
                      marginBottom: 'var(--spacing-1)',
                      boxShadow: isToday(day) ? '0 2px 8px rgba(0, 0, 0, 0.15)' : 'none',
                      flexShrink: 0
                    }}
                  >
                    {day.getDate()}
                  </div>
                  
                  <div 
                    className="space-y-1 flex-1 overflow-hidden"
                    style={{ gap: 'var(--spacing-1)' }}
                  >
                    {dayEvents.map((event, i) => (
                      <div
                        key={i}
                        className="text-xs truncate cursor-pointer transition-all hover:scale-105 active:scale-95 transform hidden sm:block"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick(event);
                        }}
                        style={{
                          padding: '3px var(--spacing-1)',
                          fontSize: '10px',
                          borderRadius: 'var(--radius-sm)',
                          background: `linear-gradient(135deg, ${event.color} 0%, ${event.color}dd 100%)`,
                          color: 'white',
                          borderLeft: `3px solid ${event.color}`,
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                          fontWeight: '500'
                        }}
                      >
                        {event.title}
                      </div>
                    ))}
                    
                    {/* Mobile: Show dots for events instead of full titles */}
                    <div className="sm:hidden flex items-center" style={{ gap: 'var(--spacing-1)', marginTop: 'var(--spacing-1)' }}>
                      {getEventsForDate(events, day).slice(0, 3).map((event, i) => (
                        <div
                          key={i}
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: 'var(--radius-full)',
                            background: event.color,
                            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
                          }}
                        />
                      ))}
                    </div>
                    
                    {hasMoreEvents && (
                      <div 
                        className="text-xs hidden sm:block"
                        style={{ 
                          paddingLeft: 'var(--spacing-1)',
                          color: isSelected ? 'rgba(255, 255, 255, 0.8)' : 'var(--muted-foreground)',
                          fontWeight: '500',
                          fontSize: '10px'
                        }}
                      >
                        +{getEventsForDate(events, day).length - 2} more
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
}