/**
 * Calendar Type Definitions
 */

export interface CalendarEvent {
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

export const EVENT_COLORS = {
  meeting: '#3b82f6',
  call: '#10b981',
  task: '#f59e0b',
  reminder: '#8b5cf6',
  other: '#6b7280'
};

export type CalendarView = 'year' | 'month' | 'week' | 'day';

export interface EventFormData {
  title: string;
  description: string;
  type: CalendarEvent['type'];
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  attendees: string;
}
