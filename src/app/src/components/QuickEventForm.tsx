/**
 * Quick Event Form Component
 * Inline form for quick event creation
 * Uses design system CSS variables for consistent styling
 */

import React, { useState, useEffect, useRef } from 'react';
import { Check, X, Calendar, Clock } from 'lucide-react';

interface QuickEventFormProps {
  date: Date;
  hour: number;
  onSave: (title: string, type: 'meeting' | 'call' | 'task' | 'reminder' | 'other', duration: number, selectedHour: number) => Promise<void>;
  onCancel: () => void;
}

const EVENT_TYPE_COLORS = {
  meeting: '#3b82f6',
  call: '#10b981',
  task: '#f59e0b',
  reminder: '#8b5cf6',
  other: '#6b7280'
};

const DURATION_OPTIONS = [
  { value: 15, label: '15m' },
  { value: 30, label: '30m' },
  { value: 45, label: '45m' },
  { value: 60, label: '1h' },
  { value: 90, label: '1.5h' },
  { value: 120, label: '2h' }
];

export function QuickEventForm({ date, hour, onSave, onCancel }: QuickEventFormProps) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'meeting' | 'call' | 'task' | 'reminder' | 'other'>('meeting');
  const [duration, setDuration] = useState(30);
  const [showTimeAdjust, setShowTimeAdjust] = useState(false);
  const [selectedHour, setSelectedHour] = useState(hour);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with title:', title, 'type:', type, 'duration:', duration, 'selectedHour:', selectedHour);
    if (title.trim() && !isSubmitting) {
      console.log('Calling onSave with selectedHour:', selectedHour);
      setIsSubmitting(true);
      // Pass selectedHour instead of the original hour prop
      await onSave(title.trim(), type, duration, selectedHour);
      setTitle('');
      setIsSubmitting(false);
    } else {
      console.log('Title is empty or already submitting, not calling onSave');
    }
  };

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    } else if (e.key === 'Enter' && title.trim() && !isSubmitting) {
      e.preventDefault();
      setIsSubmitting(true);
      // Pass selectedHour instead of the original hour prop
      await onSave(title.trim(), type, duration, selectedHour);
      setTitle('');
      setIsSubmitting(false);
    }
  };

  const formatTime = (hour: number) => {
    if (hour === 0) return '12:00 AM';
    if (hour < 12) return `${hour}:00 AM`;
    if (hour === 12) return '12:00 PM';
    return `${hour - 12}:00 PM`;
  };

  const calculateEndTime = (startHour: number, durationMinutes: number) => {
    const endMinutes = durationMinutes % 60;
    const endHour = startHour + Math.floor(durationMinutes / 60);
    return formatTime(endHour) + (endMinutes > 0 ? `:${endMinutes.toString().padStart(2, '0')}` : '').replace(':00', '');
  };

  return (
    <div
      className="border shadow-xl backdrop-blur-sm"
      style={{
        padding: 'var(--spacing-2) var(--spacing-3)',
        borderRadius: 'var(--radius-lg)',
        marginBottom: 'var(--spacing-2)',
        background: 'linear-gradient(135deg, var(--card) 0%, var(--accent) 100%)',
        borderColor: 'var(--border)',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
        maxWidth: '100%',
        overflow: 'hidden'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <form onSubmit={handleSubmit}>
        {/* Header */}
        <div 
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
          style={{ marginBottom: 'var(--spacing-2)', gap: 'var(--spacing-2)' }}
        >
          <div className="flex items-center" style={{ gap: 'var(--spacing-2)' }}>
            <div 
              className="flex items-center justify-center"
              style={{
                width: '28px',
                height: '28px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--primary)',
                color: 'var(--primary-foreground)',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                flexShrink: 0
              }}
            >
              <Calendar style={{ width: '14px', height: '14px' }} />
            </div>
            <div>
              <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </div>
              <button
                type="button"
                onClick={() => setShowTimeAdjust(!showTimeAdjust)}
                className="flex items-center hover:underline transition-all active:scale-95"
                style={{ 
                  gap: 'var(--spacing-1)', 
                  color: 'var(--foreground)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px 0',
                  fontSize: '11px',
                  fontWeight: '500',
                  minHeight: '20px'
                }}
              >
                <Clock style={{ width: '10px', height: '10px' }} />
                {formatTime(selectedHour)} → {calculateEndTime(selectedHour, duration)}
              </button>
            </div>
          </div>
        </div>

        {/* Time Adjust */}
        {showTimeAdjust && (
          <div 
            className="border-t border-b"
            style={{ 
              padding: 'var(--spacing-2) 0',
              marginBottom: 'var(--spacing-2)',
              borderColor: 'var(--border)'
            }}
          >
            <div className="text-xs" style={{ color: 'var(--muted-foreground)', marginBottom: 'var(--spacing-1)' }}>
              Start Time
            </div>
            <div 
              className="grid grid-cols-4 sm:grid-cols-6"
              style={{ gap: 'var(--spacing-1)', marginBottom: 'var(--spacing-2)' }}
            >
              {Array.from({ length: 24 }, (_, i) => i).map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => {
                    setSelectedHour(h);
                    setShowTimeAdjust(false);
                  }}
                  className="transition-all active:scale-95"
                  style={{
                    padding: 'var(--spacing-1) var(--spacing-2)',
                    borderRadius: 'var(--radius-md)',
                    background: selectedHour === h ? 'var(--primary)' : 'var(--muted)',
                    color: selectedHour === h ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '10px',
                    fontWeight: selectedHour === h ? '500' : '400',
                    minHeight: '28px'
                  }}
                >
                  {formatTime(h).replace(':00', '')}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Title Input */}
        <input
          ref={inputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="What's the event?"
          className="w-full shadow-sm transition-all focus:ring-2 focus:ring-primary/50"
          style={{ 
            marginBottom: 'var(--spacing-2)',
            fontSize: '14px',
            padding: 'var(--spacing-2) var(--spacing-3)',
            background: 'var(--background)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--foreground)',
            outline: 'none',
            minHeight: '40px'
          }}
        />

        {/* Duration Pills */}
        <div style={{ marginBottom: 'var(--spacing-2)' }}>
          <div className="text-xs" style={{ color: 'var(--muted-foreground)', marginBottom: 'var(--spacing-1)' }}>
            Duration
          </div>
          <div 
            className="flex flex-wrap"
            style={{ gap: 'var(--spacing-1)' }}
          >
            {DURATION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setDuration(opt.value)}
                className="transition-all transform active:scale-95"
                style={{
                  padding: 'var(--spacing-1) var(--spacing-3)',
                  borderRadius: 'var(--radius-full)',
                  background: duration === opt.value 
                    ? 'var(--primary)'
                    : 'var(--muted)',
                  color: duration === opt.value ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                  border: duration === opt.value ? 'none' : '1px solid var(--border)',
                  cursor: 'pointer',
                  boxShadow: duration === opt.value 
                    ? '0 2px 4px rgba(0, 0, 0, 0.1)'
                    : 'none',
                  fontWeight: duration === opt.value ? '500' : '400',
                  fontSize: '12px',
                  minHeight: '32px',
                  minWidth: '48px'
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Event Type Pills */}
        <div style={{ marginBottom: 'var(--spacing-3)' }}>
          <div className="text-xs" style={{ color: 'var(--muted-foreground)', marginBottom: 'var(--spacing-1)' }}>
            Type
          </div>
          <div 
            className="flex flex-wrap"
            style={{ gap: 'var(--spacing-1)' }}
          >
            {(['meeting', 'call', 'task', 'reminder', 'other'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className="capitalize transition-all transform active:scale-95"
                style={{
                  padding: 'var(--spacing-1) var(--spacing-3)',
                  borderRadius: 'var(--radius-full)',
                  background: type === t 
                    ? EVENT_TYPE_COLORS[t]
                    : 'var(--muted)',
                  color: type === t ? 'white' : 'var(--muted-foreground)',
                  border: type === t ? 'none' : '1px solid var(--border)',
                  cursor: 'pointer',
                  boxShadow: type === t 
                    ? '0 2px 4px rgba(0, 0, 0, 0.1)'
                    : 'none',
                  fontWeight: type === t ? '500' : '400',
                  fontSize: '12px',
                  minHeight: '32px'
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div 
          className="flex"
          style={{ gap: 'var(--spacing-2)' }}
        >
          <button
            type="submit"
            disabled={!title.trim() || isSubmitting}
            className="flex-1 shadow-sm transition-all transform active:scale-95 flex items-center justify-center"
            style={{
              padding: 'var(--spacing-2) var(--spacing-3)',
              background: title.trim() ? 'var(--primary)' : 'var(--muted)',
              color: title.trim() ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
              borderRadius: 'var(--radius-lg)',
              fontWeight: '500',
              border: 'none',
              cursor: title.trim() ? 'pointer' : 'not-allowed',
              fontSize: '13px',
              opacity: title.trim() ? 1 : 0.6,
              minHeight: '40px'
            }}
          >
            <Check style={{ width: '14px', height: '14px', marginRight: 'var(--spacing-2)' }} />
            <span className="hidden sm:inline">Create Event</span>
            <span className="sm:hidden">Create</span>
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="transition-all hover:bg-destructive/10 active:bg-destructive/20 flex items-center justify-center"
            style={{
              padding: 'var(--spacing-2)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
              background: 'transparent',
              cursor: 'pointer',
              minWidth: '40px',
              minHeight: '40px'
            }}
          >
            <X style={{ width: '14px', height: '14px' }} />
          </button>
        </div>
      </form>
    </div>
  );
}