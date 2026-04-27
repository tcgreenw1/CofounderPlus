/**
 * Year View Component
 * Displays all 12 months in a grid
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import type { CalendarEvent } from './types';
import { getDaysInMonth, monthNames, dayNames, getEventsForDate } from './utils';

interface YearViewProps {
  year: number;
  events: CalendarEvent[];
  onMonthClick: (monthDate: Date) => void;
}

export function YearView({ year, events, onMonthClick }: YearViewProps) {
  const months = Array.from({ length: 12 }, (_, i) => i);

  return (
    <div 
      className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      style={{ gap: 'var(--spacing-2)' }}
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
            className="cursor-pointer transition-all hover:scale-105 transform active:scale-95"
            onClick={() => onMonthClick(monthDate)}
            style={{
              background: 'linear-gradient(135deg, var(--card) 0%, var(--accent) 100%)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              border: '1px solid var(--border)'
            }}
          >
            <CardHeader style={{ padding: 'var(--spacing-1) var(--spacing-2)' }}>
              <CardTitle className="text-foreground text-xs sm:text-sm" style={{ fontWeight: '600' }}>
                {monthNames[monthIndex]}
              </CardTitle>
            </CardHeader>
            <CardContent style={{ padding: 'var(--spacing-1) var(--spacing-2) var(--spacing-2)' }}>
              <div 
                className="grid grid-cols-7 text-xs"
                style={{ gap: '1px' }}
              >
                {dayNames.map(day => (
                  <div key={day} className="text-center text-muted-foreground" style={{ fontSize: '8px' }}>
                    {day[0]}
                  </div>
                ))}
                {monthDays.map((day, idx) => (
                  <div
                    key={idx}
                    className="text-center"
                    style={{
                      padding: '1px',
                      fontSize: '9px',
                      borderRadius: 'var(--radius-sm)',
                      background: day && getEventsForDate(events, day).length > 0 ? 'var(--primary)' : 'transparent',
                      color: day && getEventsForDate(events, day).length > 0 ? 'var(--primary-foreground)' : 
                             day ? 'var(--foreground)' : 'transparent',
                      minHeight: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {day ? day.getDate() : ''}
                  </div>
                ))}
              </div>
              {monthEvents.length > 0 && (
                <div 
                  className="text-xs text-muted-foreground text-center"
                  style={{ marginTop: 'var(--spacing-1)', fontSize: '9px' }}
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
}