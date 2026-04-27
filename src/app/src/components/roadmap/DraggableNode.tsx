import React, { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { GripVertical, CheckCircle2, Circle } from 'lucide-react';

interface DraggableNodeProps {
  id: string;
  index: number;
  branchId: string;
  isCompleted: boolean;
  onMove: (dragIndex: number, hoverIndex: number, branchId: string) => void;
  onToggleComplete: (nodeId: string) => void;
  children: React.ReactNode;
}

const ItemType = 'ROADMAP_NODE';

export function DraggableNode({
  id,
  index,
  branchId,
  isCompleted,
  onMove,
  onToggleComplete,
  children,
}: DraggableNodeProps) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag, preview] = useDrag({
    type: ItemType,
    item: { id, index, branchId },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver }, drop] = useDrop({
    accept: ItemType,
    hover: (item: { id: string; index: number; branchId: string }, monitor) => {
      if (!ref.current) return;
      
      const dragIndex = item.index;
      const hoverIndex = index;
      const dragBranchId = item.branchId;

      // Don't replace items with themselves
      if (dragIndex === hoverIndex && dragBranchId === branchId) {
        return;
      }

      // Only allow reordering within same branch
      if (dragBranchId !== branchId) {
        return;
      }

      // Get rectangle on screen
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      
      // Get horizontal middle
      const hoverMiddleX = (hoverBoundingRect.right - hoverBoundingRect.left) / 2;
      
      // Get mouse position
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;
      
      // Get pixels to the left
      const hoverClientX = clientOffset.x - hoverBoundingRect.left;

      // Only perform the move when the mouse has crossed half of the item's width
      // Dragging right
      if (dragIndex < hoverIndex && hoverClientX < hoverMiddleX) {
        return;
      }

      // Dragging left
      if (dragIndex > hoverIndex && hoverClientX > hoverMiddleX) {
        return;
      }

      // Perform the action
      onMove(dragIndex, hoverIndex, branchId);
      
      // Note: we're mutating the item here!
      // Generally it's better to avoid mutations,
      // but it's good here for performance to avoid expensive re-renders
      item.index = hoverIndex;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  // Combine refs
  preview(drop(ref));

  return (
    <div
      ref={ref}
      className="relative group"
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
        transition: 'opacity 200ms ease',
      }}
    >
      {/* Hover indicator */}
      {isOver && (
        <div
          className="absolute inset-0 pointer-events-none rounded-lg"
          style={{
            background: 'var(--color-primary-glass, rgba(47, 128, 255, 0.1))',
            border: '2px dashed var(--color-primary, #2F80FF)',
            borderRadius: 'var(--radius-lg, 12px)',
            animation: 'pulse 1s ease-in-out infinite',
          }}
        />
      )}

      <div className="relative flex items-center gap-2">
        {/* Drag Handle */}
        <div
          ref={drag}
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-grab active:cursor-grabbing flex-shrink-0"
          style={{
            color: 'var(--muted-foreground, #64748b)',
          }}
        >
          <GripVertical className="size-5" />
        </div>

        {/* Completion Checkbox */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleComplete(id);
          }}
          className="opacity-0 group-hover:opacity-100 transition-all duration-200 flex-shrink-0 hover:scale-110"
          style={{
            color: isCompleted 
              ? 'var(--color-success, #27D17C)' 
              : 'var(--muted-foreground, #64748b)',
          }}
          aria-label={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
        >
          {isCompleted ? (
            <CheckCircle2 className="size-6" />
          ) : (
            <Circle className="size-6" />
          )}
        </button>

        {/* Node Content */}
        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
