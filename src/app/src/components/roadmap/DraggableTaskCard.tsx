import React, { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import type { Identifier, XYCoord } from 'dnd-core';

interface DraggableTaskCardProps {
  id: string;
  index: number;
  departmentId: string;
  canDrag: boolean;
  onMove: (dragIndex: number, hoverIndex: number, departmentId: string) => void;
  children: React.ReactNode;
}

interface DragItem {
  type: string;
  id: string;
  index: number;
  departmentId: string;
}

export function DraggableTaskCard({
  id,
  index,
  departmentId,
  canDrag,
  onMove,
  children,
}: DraggableTaskCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ handlerId }, drop] = useDrop<DragItem, void, { handlerId: Identifier | null }>({
    accept: 'TASK_CARD',
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: DragItem, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;
      const dragDepartmentId = item.departmentId;

      // Don't replace items with themselves
      if (dragIndex === hoverIndex && dragDepartmentId === departmentId) {
        return;
      }

      // Only allow reordering within same department
      if (dragDepartmentId !== departmentId) {
        return;
      }

      // Determine rectangle on screen
      const hoverBoundingRect = ref.current?.getBoundingClientRect();

      // Get vertical middle
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

      // Determine mouse position
      const clientOffset = monitor.getClientOffset();

      // Get pixels to the top
      const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top;

      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%

      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }

      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      // Time to actually perform the action
      onMove(dragIndex, hoverIndex, departmentId);

      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: 'TASK_CARD',
    item: () => {
      return { id, index, departmentId };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag,
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      data-handler-id={handlerId}
      style={{
        opacity: isDragging ? 0.4 : 1,
        cursor: canDrag ? 'move' : 'default',
      }}
    >
      {children}
    </div>
  );
}
