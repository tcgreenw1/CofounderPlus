import React from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { motion } from 'motion/react';
import { GripVertical, Pencil, Trash2, Users, CalendarDays, ShieldCheck } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';

interface RoadmapItem {
  id: string;
  title: string;
  description?: string;
  status: 'in-progress' | 'planned' | 'planning' | 'backlog' | 'completed';
  progress: number;
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
  team: string;
  confidence: number;
  tags?: string[];
  order?: number;
}

interface DraggableRoadmapItemProps {
  item: RoadmapItem;
  index: number;
  onMove: (dragIndex: number, hoverIndex: number) => void;
  onEdit: (item: RoadmapItem) => void;
  onDelete: (id: string) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'in-progress': return '#3b82f6';
    case 'planned': return '#8b5cf6';
    case 'planning': return '#6366f1';
    case 'backlog': return '#64748b';
    default: return '#64748b';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return 'var(--destructive)';
    case 'medium': return '#f59e0b';
    case 'low': return '#64748b';
    default: return '#64748b';
  }
};

export function DraggableRoadmapItem({ item, index, onMove, onEdit, onDelete }: DraggableRoadmapItemProps) {
  const [{ isDragging }, drag, preview] = useDrag({
    type: 'ROADMAP_ITEM',
    item: { index, id: item.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver }, drop] = useDrop({
    accept: 'ROADMAP_ITEM',
    hover: (draggedItem: { index: number; id: string }) => {
      if (draggedItem.index !== index) {
        onMove(draggedItem.index, index);
        draggedItem.index = index;
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  return (
    <div ref={(node) => preview(drop(node))}>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: isDragging ? 0.5 : 1, x: 0 }}
        transition={{ duration: 0.2 }}
        style={{
          padding: 'var(--spacing-4)',
          borderRadius: 'var(--radius-lg)',
          border: isOver ? '2px solid #8b5cf6' : '1px solid var(--border)',
          background: isDragging ? 'var(--muted)' : 'var(--card)',
          cursor: 'move',
          position: 'relative',
        }}
      >
        {/* Drag Handle */}
        <div
          ref={drag}
          style={{
            position: 'absolute',
            left: 'var(--spacing-2)',
            top: '50%',
            transform: 'translateY(-50%)',
            cursor: 'grab',
            opacity: 0.3,
          }}
          className="hover:opacity-100 transition-opacity"
        >
          <GripVertical className="size-5" style={{ color: 'var(--muted-foreground)' }} />
        </div>

        <div style={{ marginLeft: 'var(--spacing-8)' }}>
          <div className="flex items-start justify-between" style={{ marginBottom: 'var(--spacing-3)' }}>
            <div style={{ flex: 1 }}>
              <div className="flex items-center flex-wrap" style={{ gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-1)' }}>
                <p className="text-sm" style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                  {item.title}
                </p>
                <Badge 
                  variant="outline"
                  style={{
                    borderColor: getPriorityColor(item.priority),
                    color: getPriorityColor(item.priority),
                    fontSize: '0.625rem',
                    textTransform: 'uppercase',
                  }}
                >
                  {item.priority}
                </Badge>
                {item.tags && item.tags.map((tag, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    style={{
                      fontSize: '0.625rem',
                      background: 'rgba(139, 92, 246, 0.1)',
                      color: '#8b5cf6',
                      border: 'none',
                    }}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center flex-wrap" style={{ gap: 'var(--spacing-3)' }}>
                <Badge 
                  variant="secondary"
                  style={{
                    fontSize: '0.625rem',
                    background: `${getStatusColor(item.status)}15`,
                    color: getStatusColor(item.status),
                    border: 'none',
                    textTransform: 'capitalize',
                  }}
                >
                  {item.status}
                </Badge>
                <p className="text-xs text-muted-foreground">
                  <CalendarDays className="size-3 inline mr-1" />
                  {item.dueDate}
                </p>
              </div>
            </div>
            <div className="flex items-center" style={{ gap: 'var(--spacing-1)' }}>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onEdit(item)}
                style={{
                  height: '24px',
                  width: '24px',
                  padding: 0,
                }}
              >
                <Pencil className="size-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete(item.id)}
                style={{
                  height: '24px',
                  width: '24px',
                  padding: 0,
                  color: 'var(--destructive)',
                }}
              >
                <Trash2 className="size-3" />
              </Button>
            </div>
          </div>
          <div style={{ marginBottom: 'var(--spacing-2)' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 'var(--spacing-1)' }}>
              <span className="text-xs text-muted-foreground">Progress</span>
              <span className="text-xs" style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                {item.progress}%
              </span>
            </div>
            <Progress 
              value={item.progress} 
              style={{ 
                height: '6px',
                backgroundColor: 'var(--muted)',
              }} 
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center" style={{ gap: 'var(--spacing-1)' }}>
              <ShieldCheck className="size-3" style={{ color: item.confidence >= 80 ? 'var(--success)' : '#f59e0b' }} />
              <span className="text-xs text-muted-foreground">
                {item.confidence}% confidence
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              <Users className="size-3 inline mr-1" />
              {item.team}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
