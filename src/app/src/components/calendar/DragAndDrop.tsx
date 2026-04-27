/**
 * Drag and Drop Components
 * Draggable events and droppable time slots for calendar
 */

import React from 'react';
import { useDrag, useDrop } from 'react-dnd';
import type { CalendarEvent } from './types';

const ITEM_TYPE = 'EVENT';

// Draggable Event Component
interface DraggableEventProps {
  event: CalendarEvent;
  children: React.ReactNode;
  onEdit: (event: CalendarEvent) => void;
}

export function DraggableEvent({ event, children, onEdit }: DraggableEventProps) {
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
        if (!isDragging) {
          e.stopPropagation();
          onEdit(event);
        }
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

// Droppable Time Slot Component (15-minute intervals)
interface DroppableTimeSlotProps {
  date: Date;
  hour: number;
  minute: number;
  onDrop: (event: CalendarEvent, newDate: Date, newHour: number, newMinute: number) => void;
  children: React.ReactNode;
  onSlotClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export function DroppableTimeSlot({ 
  date, 
  hour, 
  minute, 
  onDrop, 
  children, 
  onSlotClick,
  className = '',
  style = {}
}: DroppableTimeSlotProps) {
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
      className={className}
      style={{
        ...style,
        background: isOver ? 'var(--accent)' : style.background,
        transition: 'background 0.2s',
        borderTop: minute === 0 ? style.borderTop : '1px dashed var(--border)',
      }}
    >
      {children}
    </div>
  );
}
