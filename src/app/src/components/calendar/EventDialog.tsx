/**
 * Event Dialog Component
 * Dialog for adding and editing calendar events
 */

import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import type { CalendarEvent, EventFormData } from './types';

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedEvent: CalendarEvent | null;
  formData: EventFormData;
  onFormDataChange: (data: EventFormData) => void;
  onSave: () => void;
  onDelete?: (eventId: string) => void;
}

export function EventDialog({
  open,
  onOpenChange,
  selectedEvent,
  formData,
  onFormDataChange,
  onSave,
  onDelete,
}: EventDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[calc(100vw-2rem)] mx-auto">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">
            {selectedEvent ? 'Edit Event' : 'Add New Event'}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {selectedEvent ? 'Update event details' : 'Create a new calendar event'}
          </DialogDescription>
        </DialogHeader>

        <div 
          className="space-y-3 sm:space-y-4 max-h-[70vh] overflow-y-auto"
          style={{ gap: 'var(--spacing-3)' }}
        >
          <div>
            <Label htmlFor="title" className="text-xs sm:text-sm">Event Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => onFormDataChange({ ...formData, title: e.target.value })}
              placeholder="e.g., Team Meeting"
              className="text-sm w-full"
              style={{ minHeight: '40px' }}
            />
          </div>

          <div>
            <Label htmlFor="description" className="text-xs sm:text-sm">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => onFormDataChange({ ...formData, description: e.target.value })}
              placeholder="Add event details..."
              rows={3}
              className="text-sm w-full"
            />
          </div>

          <div>
            <Label htmlFor="type" className="text-xs sm:text-sm">Event Type *</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value: CalendarEvent['type']) => onFormDataChange({ ...formData, type: value })}
            >
              <SelectTrigger style={{ minHeight: '40px' }} className="text-sm w-full">
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
            <Label htmlFor="date" className="text-xs sm:text-sm">Date *</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => onFormDataChange({ ...formData, date: e.target.value })}
              className="text-sm w-full"
              style={{ minHeight: '40px' }}
            />
          </div>

          <div 
            className="grid grid-cols-2"
            style={{ gap: 'var(--spacing-3)' }}
          >
            <div>
              <Label htmlFor="startTime" className="text-xs sm:text-sm">Start Time *</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => onFormDataChange({ ...formData, startTime: e.target.value })}
                className="text-sm w-full"
                style={{ minHeight: '40px' }}
              />
            </div>
            <div>
              <Label htmlFor="endTime" className="text-xs sm:text-sm">End Time *</Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => onFormDataChange({ ...formData, endTime: e.target.value })}
                className="text-sm w-full"
                style={{ minHeight: '40px' }}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="location" className="text-xs sm:text-sm">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => onFormDataChange({ ...formData, location: e.target.value })}
              placeholder="e.g., Conference Room A or Zoom"
              className="text-sm w-full"
              style={{ minHeight: '40px' }}
            />
          </div>

          <div>
            <Label htmlFor="attendees" className="text-xs sm:text-sm">Attendees</Label>
            <Input
              id="attendees"
              value={formData.attendees}
              onChange={(e) => onFormDataChange({ ...formData, attendees: e.target.value })}
              placeholder="Comma-separated emails"
              className="text-sm w-full"
              style={{ minHeight: '40px' }}
            />
          </div>

          <div 
            className="flex flex-col sm:flex-row"
            style={{ 
              gap: 'var(--spacing-2)',
              paddingTop: 'var(--spacing-3)'
            }}
          >
            <Button
              onClick={onSave}
              disabled={!formData.title || !formData.date || !formData.startTime || !formData.endTime}
              className="flex-1 text-sm w-full"
              style={{ minHeight: '44px' }}
            >
              {selectedEvent ? 'Update Event' : 'Create Event'}
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="text-sm w-full sm:w-auto"
              style={{ minHeight: '44px' }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}