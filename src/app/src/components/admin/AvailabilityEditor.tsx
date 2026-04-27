/**
 * Enhanced Availability Editor
 * Per-day-of-week time slots and date-specific customization
 */

import React, { useState } from 'react';
import { X, Plus, Trash2, Clock, Calendar } from 'lucide-react';

interface AvailabilityEditorProps {
  availabilitySettings: {
    weeklySchedule: {
      [key: number]: string[];
    };
    dateOverrides: {
      [date: string]: string[];
    };
    timezone: string;
  };
  onUpdate: (settings: any) => void;
}

export function AvailabilityEditor({ availabilitySettings, onUpdate }: AvailabilityEditorProps) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [newTimeSlot, setNewTimeSlot] = useState('');

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const addTimeSlot = (day: number, time: string) => {
    if (!time.trim()) return;
    
    const currentSlots = availabilitySettings.weeklySchedule[day] || [];
    if (currentSlots.includes(time)) {
      return; // Already exists
    }

    onUpdate({
      ...availabilitySettings,
      weeklySchedule: {
        ...availabilitySettings.weeklySchedule,
        [day]: [...currentSlots, time].sort(),
      },
    });
    setNewTimeSlot('');
  };

  const removeTimeSlot = (day: number, time: string) => {
    const currentSlots = availabilitySettings.weeklySchedule[day] || [];
    onUpdate({
      ...availabilitySettings,
      weeklySchedule: {
        ...availabilitySettings.weeklySchedule,
        [day]: currentSlots.filter(t => t !== time),
      },
    });
  };

  const copyToAllDays = (sourceDayIndex: number) => {
    const sourceSlots = availabilitySettings.weeklySchedule[sourceDayIndex] || [];
    const newWeeklySchedule = { ...availabilitySettings.weeklySchedule };
    
    for (let i = 0; i < 7; i++) {
      if (i !== sourceDayIndex) {
        newWeeklySchedule[i] = [...sourceSlots];
      }
    }

    onUpdate({
      ...availabilitySettings,
      weeklySchedule: newWeeklySchedule,
    });
  };

  const addDateOverride = (date: string, slots: string[]) => {
    onUpdate({
      ...availabilitySettings,
      dateOverrides: {
        ...availabilitySettings.dateOverrides,
        [date]: slots,
      },
    });
  };

  const removeDateOverride = (date: string) => {
    const { [date]: removed, ...rest } = availabilitySettings.dateOverrides;
    onUpdate({
      ...availabilitySettings,
      dateOverrides: rest,
    });
  };

  return (
    <div className="space-y-[var(--spacing-6)]">
      {/* Weekly Schedule Editor */}
      <div>
        <div className="flex items-center justify-between mb-[var(--spacing-4)]">
          <div>
            <h3 
              className="text-foreground mb-[var(--spacing-1)]"
              style={{ 
                fontSize: '1.125rem',
                fontWeight: 'var(--font-weight-semibold)',
              }}
            >
              Weekly Schedule
            </h3>
            <p className="text-xs text-muted-foreground">
              Set different time slots for each day of the week
            </p>
          </div>
        </div>

        <div className="space-y-[var(--spacing-3)]">
          {dayNames.map((dayName, dayIndex) => {
            const slots = availabilitySettings.weeklySchedule[dayIndex] || [];
            const isExpanded = selectedDay === dayIndex;

            return (
              <div
                key={dayIndex}
                style={{
                  padding: 'var(--spacing-4)',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                }}
              >
                <div className="flex items-center justify-between mb-[var(--spacing-2)]">
                  <button
                    onClick={() => setSelectedDay(isExpanded ? null : dayIndex)}
                    className="flex items-center gap-[var(--spacing-3)] flex-1 text-left"
                  >
                    <span 
                      className="text-foreground"
                      style={{ fontWeight: 'var(--font-weight-semibold)' }}
                    >
                      {dayName}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {slots.length === 0 ? 'Unavailable' : `${slots.length} slots`}
                    </span>
                  </button>
                  
                  {slots.length > 0 && (
                    <button
                      onClick={() => copyToAllDays(dayIndex)}
                      className="text-xs px-[var(--spacing-2)] py-[var(--spacing-1)] rounded-[var(--radius-md)] bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                    >
                      Copy to All Days
                    </button>
                  )}
                </div>

                {isExpanded && (
                  <div className="space-y-[var(--spacing-3)] pt-[var(--spacing-3)] border-t border-border mt-[var(--spacing-3)]">
                    {/* Time slot list */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-[var(--spacing-2)]">
                      {slots.map((slot) => (
                        <div
                          key={slot}
                          className="flex items-center justify-between px-[var(--spacing-3)] py-[var(--spacing-2)] rounded-[var(--radius-md)] text-sm"
                          style={{
                            background: 'var(--muted)',
                            border: '1px solid var(--border)',
                          }}
                        >
                          <div className="flex items-center gap-[var(--spacing-2)]">
                            <Clock className="size-3 text-muted-foreground" />
                            <span className="text-foreground">{slot}</span>
                          </div>
                          <button
                            onClick={() => removeTimeSlot(dayIndex, slot)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <X className="size-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add new time slot */}
                    <div className="flex items-center gap-[var(--spacing-2)]">
                      <input
                        type="text"
                        value={newTimeSlot}
                        onChange={(e) => setNewTimeSlot(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addTimeSlot(dayIndex, newTimeSlot);
                          }
                        }}
                        placeholder="e.g., 9:00 AM, 2:30 PM"
                        className="flex-1 px-[var(--spacing-3)] py-[var(--spacing-2)] bg-background border border-border rounded-[var(--radius-lg)] text-foreground text-sm"
                      />
                      <button
                        onClick={() => addTimeSlot(dayIndex, newTimeSlot)}
                        className="px-[var(--spacing-3)] py-[var(--spacing-2)] bg-primary text-white rounded-[var(--radius-lg)] hover:opacity-90 transition-opacity flex items-center gap-[var(--spacing-2)]"
                      >
                        <Plus className="size-4" />
                        <span className="text-sm">Add</span>
                      </button>
                    </div>

                    {/* Quick presets */}
                    <div className="flex flex-wrap gap-[var(--spacing-2)]">
                      <span className="text-xs text-muted-foreground">Quick add:</span>
                      {['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'].map((preset) => (
                        <button
                          key={preset}
                          onClick={() => addTimeSlot(dayIndex, preset)}
                          className="text-xs px-[var(--spacing-2)] py-[var(--spacing-1)] rounded-[var(--radius-md)] bg-muted text-foreground hover:bg-primary hover:text-white transition-colors"
                          disabled={slots.includes(preset)}
                          style={{
                            opacity: slots.includes(preset) ? 0.5 : 1,
                            cursor: slots.includes(preset) ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Date-Specific Overrides */}
      <div
        style={{
          padding: 'var(--spacing-4)',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--muted)',
          border: '1px solid var(--border)',
        }}
      >
        <h3 
          className="text-foreground mb-[var(--spacing-2)]"
          style={{ 
            fontSize: '1.125rem',
            fontWeight: 'var(--font-weight-semibold)',
          }}
        >
          Date-Specific Customizations
        </h3>
        <p className="text-xs text-muted-foreground mb-[var(--spacing-4)]">
          Use the calendar below to customize specific dates or block them completely
        </p>

        {Object.keys(availabilitySettings.dateOverrides).length > 0 ? (
          <div className="space-y-[var(--spacing-2)]">
            {Object.entries(availabilitySettings.dateOverrides).map(([date, slots]) => (
              <div
                key={date}
                className="flex items-center justify-between px-[var(--spacing-3)] py-[var(--spacing-2)] rounded-[var(--radius-md)]"
                style={{
                  background: 'var(--background)',
                  border: '1px solid var(--border)',
                }}
              >
                <div className="flex items-center gap-[var(--spacing-3)]">
                  <Calendar className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-foreground" style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                      {new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {slots.length === 0 ? 'Blocked' : `${slots.length} custom slots`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeDateOverride(date)}
                  className="p-[var(--spacing-1)] hover:bg-destructive-soft rounded-[var(--radius-md)] transition-colors"
                >
                  <Trash2 className="size-4 text-destructive" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-[var(--spacing-4)]">
            No date-specific customizations yet. Click on dates in the calendar below to add them.
          </p>
        )}
      </div>
    </div>
  );
}
