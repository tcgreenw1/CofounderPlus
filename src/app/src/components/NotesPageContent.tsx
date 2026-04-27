import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from './ThemeProvider';
import SupportButton from './SupportButton';
import { BusinessSwitcher } from './BusinessSwitcher';
import { 
  ArrowLeft, Moon, Sun, HelpCircle, Menu, StickyNote, Plus, MoreHorizontal,
  Edit3, Trash2, Calendar, Flag, Tag, Filter, Users, TrendingUp, 
  Target, DollarSign, LogOut, Map, X, Check, AlertCircle, CheckCircle2,
  Eye, EyeOff, FileText, Star, GripVertical, Circle, CircleDot, Hand,
  ChevronUp, ChevronDown, ArrowUp, ArrowDown, Sparkles, Palette
} from 'lucide-react';
import { supabase } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { useBusiness } from './BusinessContext';
import { useIsMobile } from './ui/use-mobile';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from './ui/sheet';
import { VisuallyHidden } from './ui/visually-hidden';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { toast } from 'sonner@2.0.3';
import { CofounderNotesAssistant } from './CofounderNotesAssistant';
import { TeamMemberSelector, type AssignedMember as TeamAssignedMember } from './TeamMemberSelector';
import { NotesUndoButton } from './NotesUndoButton';

interface AssignedMember {
  id: string;
  name: string;
  email?: string;
  type: 'user' | 'cofounder';
}

interface Board {
  id: string;
  name: string;
  description: string;
  color: string;
  lists?: List[]; // Optional - only loaded when viewing board details
  assignedMembers?: AssignedMember[];
  created_at: string;
  updated_at: string;
  position?: number; // Board position for ordering
}

interface List {
  id: string;
  boardId: string;
  name: string;
  position: number;
  gridRow?: number; // Grid row position (1-based)
  gridColumn?: number; // Grid column position (1-based)
  color?: string; // Color for the list
  cards: Card[];
  assignedMembers?: AssignedMember[];
  created_at: string;
  updated_at: string;
}

interface Card {
  id: string;
  listId: string;
  title: string;
  description: string;
  labels: string[];
  dueDate: string | null;
  priority: string;
  position: number;
  completed: boolean;
  starCompleted: boolean; // New field for star completion
  assignedMembers?: AssignedMember[];
  created_at: string;
  updated_at: string;
}

interface NotesPageContentProps {
  user: any;
}

// Color palette for boards and lists - 10 colors using design system
const COLOR_PALETTE = [
  { name: 'Blue', value: 'blue', bg: '#007AFF', text: '#ffffff' },
  { name: 'Red', value: 'red', bg: '#d4183d', text: '#ffffff' },
  { name: 'Green', value: 'green', bg: '#27D17C', text: '#ffffff' },
  { name: 'Purple', value: 'purple', bg: '#8B5CF6', text: '#ffffff' },
  { name: 'Orange', value: 'orange', bg: '#F97316', text: '#ffffff' },
  { name: 'Yellow', value: 'yellow', bg: '#EAB308', text: '#030213' },
  { name: 'Pink', value: 'pink', bg: '#EC4899', text: '#ffffff' },
  { name: 'Cyan', value: 'cyan', bg: '#06B6D4', text: '#ffffff' },
  { name: 'Gray', value: 'gray', bg: '#717182', text: '#ffffff' },
  { name: 'Indigo', value: 'indigo', bg: '#6366F1', text: '#ffffff' }
] as const;

// Helper function to get color style
const getColorStyle = (colorValue?: string) => {
  const color = COLOR_PALETTE.find(c => c.value === colorValue) || COLOR_PALETTE[0];
  return color;
};

const DraggableCard: React.FC<{
  card: Card;
  onCompleteCard: (cardId: string, type: "circle" | "star") => void;
  onEditCard: (cardId: string, updates: Partial<Card>) => void;
  onDeleteCard: (cardId: string) => void;
  listId: string;
  index: number;
  moveCard: (
    dragIndex: number,
    hoverIndex: number,
    sourceListId: string,
    targetListId: string
  ) => void;
  totalCards: number;
  isExpanded: boolean;
  onToggleExpand: (cardId: string) => void;
}> = ({ card, onCompleteCard, onEditCard, onDeleteCard, listId, index, moveCard, totalCards, isExpanded, onToggleExpand }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(card.title);
  const [editDescription, setEditDescription] = useState(card.description);
  const [editPriority, setEditPriority] = useState(card.priority);
  const [editAssignedMembers, setEditAssignedMembers] = useState<AssignedMember[]>(card.assignedMembers || []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100/60 text-red-700 border-red-300/60";
      case "medium": return "bg-yellow-100/60 text-yellow-700 border-yellow-300/60";
      case "low": return "bg-green-100/60 text-green-700 border-green-300/60";
      default: return "bg-gray-100/60 text-gray-700 border-gray-300/60";
    }
  };

  // Check if description is long enough to need expand button (more than ~50 chars)
  const needsExpand = card.description && card.description.length > 50;

  const handleSaveEdit = () => {
    if (editTitle.trim()) {
      onEditCard(card.id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        priority: editPriority,
        assignedMembers: editAssignedMembers
      });
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditTitle(card.title);
    setEditDescription(card.description);
    setEditPriority(card.priority);
    setEditAssignedMembers(card.assignedMembers || []);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  if (isEditing) {
    // INLINE EDITING MODE
    return (
      <div
        className="relative rounded-xl p-2 sm:p-2.5 border-2 transition-all liquid-glass-card w-full"
        style={{
          borderColor: 'var(--primary)',
          boxShadow: '0 4px 12px rgba(0, 224, 255, 0.2)',
        }}
      >
        <div className="space-y-2">
          {/* Title Input */}
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Card title..."
            className="text-[10px] sm:text-[11px] h-6 sm:h-7 border-border"
            style={{
              backgroundColor: 'var(--background)',
              color: 'var(--foreground)'
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSaveEdit();
              } else if (e.key === 'Escape') {
                handleCancelEdit();
              }
            }}
            autoFocus
          />

          {/* Description Textarea */}
          <Textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            placeholder="Description (optional)..."
            className="text-[8px] sm:text-[10px] min-h-12 sm:min-h-14 border-border resize-none"
            style={{
              backgroundColor: 'var(--background)',
              color: 'var(--foreground)'
            }}
            onKeyDown={handleKeyDown}
            rows={2}
          />

          {/* Team Members Assignment */}
          <div className="flex items-center gap-2">
            <span className="text-[8px] sm:text-[9px]" style={{ color: 'var(--muted-foreground)', fontWeight: 'var(--font-weight-medium)' }}>
              Assign:
            </span>
            <TeamMemberSelector
              currentAssignments={editAssignedMembers}
              onChange={setEditAssignedMembers}
              size="sm"
              showLabel={false}
            />
          </div>

          {/* Priority & Actions Row */}
          <div className="flex items-center justify-between gap-2">
            <Select value={editPriority} onValueChange={setEditPriority}>
              <SelectTrigger className="w-16 sm:w-20 h-6 sm:h-7 text-[7px] sm:text-[8px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent 
                className="text-[8px] sm:text-[10px] max-h-[200px] overflow-y-auto"
                position="popper"
                sideOffset={4}
              >
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancelEdit}
                className="h-6 sm:h-7 px-2 text-[7px] sm:text-[8px]"
                style={{
                  borderColor: 'var(--border)',
                  color: 'var(--foreground)'
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveEdit}
                disabled={!editTitle.trim()}
                className="h-6 sm:h-7 px-2 text-[7px] sm:text-[8px]"
                style={{
                  backgroundColor: 'var(--primary)',
                  color: 'var(--primary-foreground)'
                }}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // NORMAL DISPLAY MODE
  return (
    <div
      className={`relative rounded-xl p-2 sm:p-2.5 border transition-all liquid-glass-card
        hover:scale-[1.02]
        ${card.starCompleted && !card.completed
          ? "ring-2 ring-energy/50 shadow-[0_0_12px_rgba(255,207,0,0.2)]"
          : card.completed && !card.starCompleted
          ? "ring-2 ring-success/50 shadow-[0_0_12px_rgba(108,255,108,0.2)]"
          : ""
        }
        w-full sm:min-h-[90px] min-h-[70px]`}
      style={{
        boxShadow: '0 4px 12px rgba(0, 224, 255, 0.08)',
      }}
    >
      {/* --- HEADER ICON ROW --- */}
      <div className="flex justify-between items-center mb-[3px] px-[2px] relative">
        {/* Left: Completion circle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onCompleteCard(card.id, "circle");
          }}
          className="flex items-center justify-center active:scale-95"
          style={{ width: "14px", height: "14px" }}
          title="Complete"
        >
          {card.completed ? (
            <CircleDot className="w-[12px] h-[12px] text-[#6CFF6C]" strokeWidth={2.5} />
          ) : (
            <Circle className="w-[12px] h-[12px] text-gray-400" strokeWidth={2.5} />
          )}
        </button>

        {/* Center: Star */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onCompleteCard(card.id, "star");
          }}
          className="flex items-center justify-center transition-all active:scale-95"
          style={{ width: "14px", height: "14px" }}
          title="Star"
        >
          <Star
            className={`w-[11px] h-[11px] ${
              card.starCompleted ? "fill-[#FFCF00] text-[#FFCF00]" : "text-gray-400"
            }`}
            strokeWidth={2}
          />
        </button>

        {/* Right: Edit & Assign Members */}
        <div className="flex items-center gap-1">
          {/* Assign Team Members Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setIsEditing(true);
            }}
            className="flex items-center justify-center text-gray-400 hover:text-[#4B00FF] active:scale-95"
            style={{ width: "14px", height: "14px" }}
            title="Assign team members (click edit)"
          >
            <Users className="w-[9px] h-[9px]" strokeWidth={2} />
          </button>
          
          {/* Edit Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setIsEditing(true);
            }}
            className="flex items-center justify-center text-gray-400 hover:text-[#00E0FF] active:scale-95"
            style={{ width: "14px", height: "14px" }}
            title="Edit"
          >
            <Edit3 className="w-[9px] h-[9px]" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* --- CONTENT --- */}
      <div className="px-[1px] pb-5">
        <h4
          className={`text-[10px] sm:text-[11px] font-medium leading-tight truncate
          ${
            card.completed && !card.starCompleted
              ? "line-through text-green-700"
              : card.starCompleted && !card.completed
              ? "text-yellow-700 font-semibold"
              : "text-gray-800 dark:text-gray-100"
          }`}
        >
          {card.title}
        </h4>
        {card.description && (
          <div className="mt-1">
            <p className={`text-[8px] sm:text-[10px] text-gray-500 dark:text-gray-400 leading-snug ${
              isExpanded ? 'whitespace-pre-wrap break-words line-clamp-none' : 'line-clamp-2'
            }`}>
              {card.description}
            </p>
            {needsExpand && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onToggleExpand(card.id);
                }}
                className="flex items-center gap-1 mt-1 text-[8px] sm:text-[9px] text-primary hover:text-primary/80 transition-colors"
                title={isExpanded ? "Show less" : "Show more"}
              >
                <span>{isExpanded ? 'Show less' : 'Show more'}</span>
                <ChevronDown 
                  className={`w-2.5 h-2.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  strokeWidth={2.5}
                />
              </button>
            )}
          </div>
        )}
      </div>

      {/* --- DELETE ZONE & ASSIGN MEMBERS (BOTTOM LEFT CORNER) --- */}
      <div className="absolute bottom-0 left-0 h-[30%] flex items-end justify-start pl-[4px] pb-[0px] sm:pb-[1px] gap-1.5">
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onDeleteCard(card.id);
            // Instant visual feedback
            toast.success('Card deleted', { duration: 1500 });
          }}
          className="flex items-center justify-center text-gray-400 hover:text-[#FF4F4F] transition-all active:scale-95 hover:scale-110"
          style={{ width: "16px", height: "16px" }}
          title="Delete card instantly"
        >
          <Trash2 className="w-[13px] h-[13px]" strokeWidth={2} />
        </button>

        {/* Team Member Assignments */}
        {card.assignedMembers && card.assignedMembers.length > 0 ? (
          <div className="flex items-center gap-0.5">
            {card.assignedMembers.slice(0, 2).map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-center rounded-full"
                style={{
                  width: '16px',
                  height: '16px',
                  background: member.type === 'cofounder' 
                    ? 'linear-gradient(135deg, #4B00FF, #7C3AED)'
                    : 'var(--primary)',
                  border: '1.5px solid',
                  borderColor: 'var(--background)',
                }}
                title={member.name}
              >
                {member.type === 'cofounder' ? (
                  <svg className="w-2 h-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#ffffff" opacity="0.9"/>
                    <path d="M2 17L12 22L22 17" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 12L12 17L22 12" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <span 
                    className="text-[7px]"
                    style={{
                      color: 'var(--primary-foreground)',
                      fontWeight: 'var(--font-weight-bold)',
                    }}
                  >
                    {member.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            ))}
            {card.assignedMembers.length > 2 && (
              <div 
                className="flex items-center justify-center rounded-full text-[7px]"
                style={{
                  width: '16px',
                  height: '16px',
                  background: 'var(--muted)',
                  border: '1.5px solid',
                  borderColor: 'var(--background)',
                  color: 'var(--muted-foreground)',
                  fontWeight: 'var(--font-weight-semibold)',
                }}
              >
                +{card.assignedMembers.length - 2}
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setIsEditing(true);
            }}
            className="flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            style={{
              width: '16px',
              height: '16px',
              border: '1.5px dashed var(--border)',
            }}
            title="Assign team members"
          >
            <Users className="w-[9px] h-[9px]" style={{ color: 'var(--muted-foreground)' }} />
          </button>
        )}
      </div>

      {/* --- PRIORITY & REORDER BUTTONS (BOTTOM RIGHT CORNER) --- */}
      <div className="absolute bottom-0 right-0 flex flex-col items-end pr-[4px] pb-[3px] gap-[2px]">
        {/* Priority Badge */}
        {card.priority && (
          <Badge
            className={`px-1 py-0 text-[7px] sm:text-[8px] rounded-full border ${getPriorityColor(
              card.priority
            )}`}
          >
            {card.priority}
          </Badge>
        )}
        
        {/* Reorder Buttons */}
        <div className="flex gap-[2px]">
        {index > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              moveCard(index, index - 1, listId, listId);
            }}
            className="flex items-center justify-center hover:bg-primary/10 rounded transition-colors active:scale-95"
            style={{ width: "18px", height: "18px" }}
            title="Move up"
          >
            <ChevronUp className="w-[13px] h-[13px] text-gray-500" strokeWidth={2} />
          </button>
        )}
        {index < totalCards - 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              moveCard(index, index + 1, listId, listId);
            }}
            className="flex items-center justify-center hover:bg-primary/10 rounded transition-colors active:scale-95"
            style={{ width: "18px", height: "18px" }}
            title="Move down"
          >
            <ChevronDown className="w-[13px] h-[13px] text-gray-500" strokeWidth={2} />
          </button>
        )}
        </div>
      </div>
    </div>
  );
};

// Droppable List Component
const DroppableList: React.FC<{
  list: List;
  onCompleteCard: (cardId: string, type: 'circle' | 'star') => void;
  onEditCard: (cardId: string, updates: Partial<Card>) => void;
  onDeleteCard: (cardId: string) => void;
  onDeleteList: (listId: string) => void;
  onRenameList: (listId: string, updates: string | Partial<List>) => void;
  moveCard: (dragIndex: number, hoverIndex: number, sourceListId: string, targetListId: string) => void;
  onCreateCard: (listId: string, title: string, description: string, priority: string) => void;
  creatingCardInList: string | null;
  setCreatingCardInList: (listId: string | null) => void;
  expandedCards: Set<string>;
  onToggleCardExpand: (cardId: string) => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}> = ({ list, onCompleteCard, onEditCard, onDeleteCard, onDeleteList, onRenameList, moveCard, onCreateCard, creatingCardInList, setCreatingCardInList, expandedCards, onToggleCardExpand, onDragStart, onDragEnd }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(list.name);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [newCardDescription, setNewCardDescription] = useState('');
  const [newCardPriority, setNewCardPriority] = useState('medium');

  // Alias for clarity - onEditList and onRenameList refer to the same function
  const onEditList = onRenameList;

  const handleRename = () => {
    if (editName.trim() && editName !== list.name) {
      onRenameList(list.id, editName.trim());
    }
    setIsEditing(false);
  };

  const handleCreateCard = () => {
    if (newCardTitle.trim()) {
      onCreateCard(list.id, newCardTitle.trim(), newCardDescription.trim(), newCardPriority);
      setNewCardTitle('');
      setNewCardDescription('');
      setNewCardPriority('medium');
      setCreatingCardInList(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (creatingCardInList === list.id) {
        handleCreateCard();
      } else if (isEditing) {
        handleRename();
      }
    } else if (e.key === 'Escape') {
      if (creatingCardInList === list.id) {
        setCreatingCardInList(null);
        setNewCardTitle('');
        setNewCardDescription('');
        setNewCardPriority('medium');
      } else if (isEditing) {
        setEditName(list.name);
        setIsEditing(false);
      }
    }
  };

  const listColor = getColorStyle(list.color);
  
  return (
    <div 
      className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg p-1.5 sm:p-3 lg:p-4 w-full min-h-fit shadow-sm"
      style={{
        borderLeft: `4px solid ${listColor.bg}`,
        border: `1px solid var(--border)`,
        borderLeftWidth: '4px',
        borderLeftColor: listColor.bg
      }}
    >
      {/* List Header - Draggable with LARGE touch-friendly drag handle */}
      <div 
        className="flex items-center justify-between mb-1.5 sm:mb-4 cursor-grab active:cursor-grabbing"
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <div className="flex items-center gap-1 sm:gap-2 flex-1">
          {/* MOBILE-OPTIMIZED: Large drag handle for easy touch interaction */}
          <div 
            className="flex-shrink-0 flex items-center justify-center touch-none"
            style={{
              width: 'var(--spacing-8)',
              height: 'var(--spacing-8)',
              minWidth: 'var(--spacing-8)',
              minHeight: 'var(--spacing-8)',
            }}
            title="Drag to reposition list"
          >
            <GripVertical 
              className="w-6 h-6 sm:w-5 sm:h-5" 
              style={{ 
                color: 'var(--muted-foreground)',
                strokeWidth: '2px'
              }}
            />
          </div>
          {isEditing ? (
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="h-7 sm:h-8 text-xs sm:text-sm flex-1"
              style={{
                borderColor: 'rgba(0, 224, 255, 0.3)',
                color: 'var(--foreground)'
              }}
              onBlur={handleRename}
              onKeyDown={handleKeyDown}
              autoFocus
              onDragStart={(e) => e.stopPropagation()}
              draggable={false}
            />
          ) : (
            <h3 
              className="text-xs sm:text-base flex-1 transition-colors cursor-pointer"
              style={{
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--foreground)'
              }}
              onClick={() => setIsEditing(true)}
              onDragStart={(e) => e.stopPropagation()}
            >
              {list.name}
            </h3>
          )}
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 sm:h-6 sm:w-6 p-0"
              style={{
                minWidth: '44px',
                minHeight: '44px'
              }}
            >
              <MoreHorizontal className="w-4 h-4 sm:w-4 sm:h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="text-xs sm:text-sm w-48">
            <DropdownMenuItem onClick={() => setIsEditing(true)}>
              <Edit3 className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              Rename
            </DropdownMenuItem>
            
            {/* Color selection */}
            <div style={{ padding: 'var(--spacing-2)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', marginTop: 'var(--spacing-1)', marginBottom: 'var(--spacing-1)' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 'var(--spacing-1)', 
                marginBottom: 'var(--spacing-2)',
                fontSize: '0.75rem',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--muted-foreground)'
              }}>
                <Palette className="w-3 h-3" />
                <span>Color</span>
              </div>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(5, 1fr)', 
                gap: 'var(--spacing-1)' 
              }}>
                {COLOR_PALETTE.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => onEditList(list.id, { color: color.value })}
                    title={color.name}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: color.bg,
                      border: list.color === color.value ? '2px solid var(--foreground)' : '1px solid var(--border)',
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    {list.color === color.value && (
                      <Check className="w-3 h-3" style={{ color: color.text }} />
                    )}
                  </button>
                ))}
              </div>
            </div>
            
            <DropdownMenuItem 
              onClick={() => onDeleteList(list.id)} 
              className="hover:bg-red-50 dark:hover:bg-red-900/20"
              style={{ color: 'var(--destructive)' }}
            >
              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Cards */}
      <div className="space-y-1.5 sm:space-y-3">
        {list.cards.map((card, index) => (
          <DraggableCard
            key={card.id}
            card={card}
            index={index}
            listId={list.id}
            onCompleteCard={onCompleteCard}
            onEditCard={onEditCard}
            onDeleteCard={onDeleteCard}
            moveCard={moveCard}
            totalCards={list.cards.length}
            isExpanded={expandedCards.has(card.id)}
            onToggleExpand={onToggleCardExpand}
          />
        ))}
      </div>

      {/* Inline Card Creation Form */}
      {creatingCardInList === list.id ? (
        <div className="mt-1.5 sm:mt-3 space-y-1 sm:space-y-2">
          <Input
            placeholder="Card title..."
            value={newCardTitle}
            onChange={(e) => setNewCardTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            className="text-[8px] sm:text-sm h-6 sm:h-8"
            autoFocus
          />
          <Textarea
            placeholder="Description (optional)..."
            value={newCardDescription}
            onChange={(e) => setNewCardDescription(e.target.value)}
            onKeyDown={handleKeyDown}
            className="text-[8px] sm:text-sm min-h-8 sm:min-h-16"
            rows={2}
          />
          <div className="flex items-center justify-between">
            <Select value={newCardPriority} onValueChange={setNewCardPriority}>
              <SelectTrigger className="w-16 sm:w-24 h-6 sm:h-8 text-[7px] sm:text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent 
                className="text-[8px] sm:text-sm max-h-[200px] overflow-y-auto"
                position="popper"
                sideOffset={4}
              >
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex space-x-1 sm:space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setCreatingCardInList(null);
                  setNewCardTitle('');
                  setNewCardDescription('');
                  setNewCardPriority('medium');
                }}
                className="h-6 sm:h-8 px-1.5 sm:px-3 text-[7px] sm:text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleCreateCard}
                disabled={!newCardTitle.trim()}
                className="h-6 sm:h-8 px-1.5 sm:px-3 text-[7px] sm:text-xs bg-[#6CFF6C] hover:bg-[#6CFF6C]/90 text-gray-900 border-0 disabled:bg-gray-300 disabled:text-gray-500"
              >
                Add Card
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* Add Card Button */
        <div className="mt-1.5 sm:mt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCreatingCardInList(list.id)}
            className="w-full h-6 sm:h-8 text-[9px] sm:text-xs text-gray-500 hover:text-[#6CFF6C] hover:bg-[#6CFF6C]/10 dark:text-gray-400 dark:hover:text-[#6CFF6C] dark:hover:bg-[#6CFF6C]/10 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-[#6CFF6C] dark:hover:border-[#6CFF6C] transition-all"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add a card
          </Button>
        </div>
      )}

      {/* Card Count */}
      <div className="mt-2 text-[10px] sm:text-xs text-gray-500 text-center">
        {list.cards.length} card{list.cards.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
};

const NotesPageContentInner: React.FC<NotesPageContentProps> = ({ user }) => {
  const { selectedBusiness } = useBusiness();
  
  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadedBoardRef = React.useRef<string | null>(null); // Track which board details we've loaded
  const hasLoadedInitialDataRef = React.useRef(false); // Track if we've loaded data for this business
  const isRestoringFromCacheRef = React.useRef(false); // Track if we're currently restoring from cache
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set()); // Track which card descriptions are expanded
  
  // NEW: Cache all loaded boards in memory for instant switching
  const boardsCache = React.useRef<Record<string, Board>>({});
  
  // Reset state when business changes
  useEffect(() => {
    console.log('🔄 Business changed, resetting component state');
    hasLoadedInitialDataRef.current = false;
    loadedBoardRef.current = null;
    isRestoringFromCacheRef.current = false;
    boardsCache.current = {}; // Clear cache when business changes
    setDraggedBoardIndex(null);
    setDraggedListIndex(null);
    setExpandedCards(new Set());
  }, [selectedBusiness?.id]);

  // Restore from cache on mount - runs before loadBoards
  useEffect(() => {
    if (selectedBusiness?.id && !isRestoringFromCacheRef.current) {
      try {
        const cacheKey = `notes_cache_${selectedBusiness.id}`;
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.boards && parsed.boards.length > 0) {
            console.log('📦 Restoring notes from cache:', parsed.boards.length, 'boards');
            setBoards(parsed.boards);
            setSelectedBoard(parsed.selectedBoard);
            setLoading(false);
            hasLoadedInitialDataRef.current = true;
            loadedBoardRef.current = parsed.selectedBoard?.id || null;
            isRestoringFromCacheRef.current = true;
          }
        }
      } catch (error) {
        console.error('Failed to restore from cache:', error);
      }
    }
  }, [selectedBusiness?.id]);

  const [isCreatingBoard, setIsCreatingBoard] = useState(false);
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [isCreatingCard, setIsCreatingCard] = useState(false);
  const [creatingCardInList, setCreatingCardInList] = useState<string | null>(null);
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);
  const [isCofounderNotesOpen, setIsCofounderNotesOpen] = useState(false);
  const [newBoard, setNewBoard] = useState({
    name: '',
    description: '',
    color: 'blue'
  });
  const [newList, setNewList] = useState({
    name: ''
  });
  const [newCard, setNewCard] = useState({
    title: '',
    description: '',
    priority: 'medium',
    listId: ''
  });
  const isMobile = useIsMobile();
  const lastSavedBoardRef = React.useRef<string | null>(null); // Track last saved board JSON
  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null); // Track the save timeout
  const isSavingRef = React.useRef<boolean>(false); // Track if currently saving
  const pendingDeletesRef = React.useRef<Set<string>>(new Set()); // Track pending delete operations
  
  // Drag and drop state
  const [draggedBoardIndex, setDraggedBoardIndex] = useState<number | null>(null);
  const [draggedListIndex, setDraggedListIndex] = useState<number | null>(null);
  const [draggedOverPosition, setDraggedOverPosition] = useState<{index: number, isAfter: boolean} | null>(null);

  // Cleanup drag state on unmount or when business changes
  useEffect(() => {
    return () => {
      console.log('🧹 Cleaning up drag state on unmount');
      setDraggedBoardIndex(null);
      setDraggedListIndex(null);
    };
  }, [selectedBusiness?.id]);

  // Reset drag state when visibility changes or page hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        console.log('👁️ Tab hidden - resetting drag state and clearing editing states');
        setDraggedBoardIndex(null);
        setDraggedListIndex(null);
        // Also clear any open editing states to prevent stale modals
        setIsCreatingBoard(false);
        setIsCreatingList(false);
        setIsCreatingCard(false);
        setCreatingCardInList(null);
      } else if (document.visibilityState === 'visible') {
        console.log('👁️ Tab became visible - ensuring clean state');
        setDraggedBoardIndex(null);
        setDraggedListIndex(null);
      }
    };

    const handleBeforeUnload = () => {
      console.log('🚪 Page unloading - resetting drag state');
      setDraggedBoardIndex(null);
      setDraggedListIndex(null);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
    };
  }, []);

  // Update in-memory cache when selectedBoard changes
  useEffect(() => {
    if (selectedBoard?.id) {
      boardsCache.current[selectedBoard.id] = selectedBoard;
    }
  }, [selectedBoard]);

  // Cache data to sessionStorage whenever boards or selectedBoard changes
  useEffect(() => {
    if (selectedBusiness?.id && boards.length > 0) {
      try {
        const cacheKey = `notes_cache_${selectedBusiness.id}`;
        sessionStorage.setItem(cacheKey, JSON.stringify({
          boards,
          selectedBoard,
          timestamp: Date.now()
        }));
        console.log('💾 Cached notes data to session storage');
      } catch (error) {
        console.error('Failed to cache notes data:', error);
      }
    }
  }, [boards, selectedBoard, selectedBusiness?.id]);

  // Clean up any stuck DOM styles from interrupted drag operations
  useEffect(() => {
    // Reset any elements that might have stuck opacity from interrupted drags
    const resetDragStyles = () => {
      const draggableElements = document.querySelectorAll('[draggable="true"]');
      draggableElements.forEach((el) => {
        if (el instanceof HTMLElement && el.style.opacity !== '1' && el.style.opacity !== '') {
          console.log('🧹 Resetting stuck opacity on element');
          el.style.opacity = '1';
        }
      });
    };

    // Reset on mount
    resetDragStyles();

    // Also reset when visibility changes
    const handleVisibilityFocus = () => {
      if (document.visibilityState === 'visible') {
        setTimeout(resetDragStyles, 100); // Small delay to ensure DOM is ready
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityFocus);
    window.addEventListener('focus', resetDragStyles);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityFocus);
      window.removeEventListener('focus', resetDragStyles);
    };
  }, [boards, selectedBoard]); // Re-run when boards/board changes to catch new elements

  // Force save function - saves immediately without debounce
  const forceSave = useCallback(async () => {
    if (!selectedBoard || !selectedBusiness?.id) return;
    if (isSavingRef.current) return; // Prevent concurrent saves
    
    const currentBoardJson = JSON.stringify(selectedBoard);
    
    // Skip if already saved
    if (lastSavedBoardRef.current === currentBoardJson) {
      return;
    }

    try {
      isSavingRef.current = true;
      console.log('💾 Force-saving board changes...');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notes/boards/${selectedBoard.id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            businessId: selectedBusiness.id,
            boardData: {
              ...selectedBoard,
              lists: selectedBoard.lists
            }
          }),
        }
      );

      if (response.ok) {
        console.log('✅ Board force-saved successfully');
        lastSavedBoardRef.current = currentBoardJson;
      } else {
        // Check for auth errors
        if (response.status === 401 || response.status === 403) {
          console.error('❌ Auth error during force-save');
          isSavingRef.current = false;
          return;
        }
        console.error('❌ Failed to force-save board:', response.status);
      }
    } catch (error) {
      console.error('❌ Error force-saving board:', error);
    } finally {
      isSavingRef.current = false;
    }
  }, [selectedBoard, selectedBusiness?.id]);

  // Save on unmount or navigation away
  useEffect(() => {
    return () => {
      // Clear any pending debounced save
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      // Force save immediately if there are unsaved changes
      if (selectedBoard && selectedBusiness?.id && lastSavedBoardRef.current !== JSON.stringify(selectedBoard)) {
        console.log('🚪 Component unmounting with unsaved changes - force saving...');
        // Use synchronous approach since we're in cleanup
        forceSave();
      }
    };
  }, [selectedBoard, selectedBusiness?.id, forceSave]);

  // Auto-save effect - saves board changes to backend with debounce
  useEffect(() => {
    if (!selectedBoard || !selectedBusiness?.id) return;
    
    // Skip auto-save on initial load (when lastSavedBoardRef is not set yet)
    const currentBoardJson = JSON.stringify(selectedBoard);
    if (lastSavedBoardRef.current === null) {
      lastSavedBoardRef.current = currentBoardJson;
      return;
    }
    
    // Skip if nothing changed
    if (lastSavedBoardRef.current === currentBoardJson) {
      return;
    }
    
    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Debounce save by 500ms for drag-and-drop, 2s for other changes
    const debounceTime = 500; // Reduced from 2000ms to save faster
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        isSavingRef.current = true;
        console.log('💾 Auto-saving board changes...');
        
        // Check if there are pending deletes
        if (pendingDeletesRef.current.size > 0) {
          console.log('⏸️ Skipping auto-save - pending deletes:', Array.from(pendingDeletesRef.current));
          isSavingRef.current = false;
          return;
        }
        
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          isSavingRef.current = false;
          return;
        }

        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notes/boards/${selectedBoard.id}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              businessId: selectedBusiness.id,
              boardData: {
                ...selectedBoard,
                lists: selectedBoard.lists
              }
            }),
          }
        );

        if (response.ok) {
          console.log('✅ Board auto-saved successfully');
          lastSavedBoardRef.current = currentBoardJson;
          // Silent save - no toast to avoid interrupting user
        } else {
          // Check for auth errors - don't retry if auth failed
          if (response.status === 401 || response.status === 403) {
            console.error('❌ Auth error during auto-save, stopping retries');
            isSavingRef.current = false;
            return;
          }
          console.error('❌ Failed to auto-save board:', response.status);
          toast.error('Failed to save changes');
        }
      } catch (error) {
        console.error('❌ Error auto-saving board:', error);
        // Don't show toast for network errors during auto-save to avoid spam
      } finally {
        isSavingRef.current = false;
      }
    }, debounceTime);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [selectedBoard, selectedBusiness?.id]);

  // Reorder boards with drag and drop
  const handleReorderBoards = useCallback(async (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || !selectedBusiness?.id) return;
    
    const reorderedBoards = [...boards];
    const [movedBoard] = reorderedBoards.splice(fromIndex, 1);
    reorderedBoards.splice(toIndex, 0, movedBoard);
    
    // Optimistically update UI
    setBoards(reorderedBoards);
    toast.success('Board order updated');
    
    // Persist to backend
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const boardIds = reorderedBoards.map(board => board.id);
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notes/boards/reorder`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId: selectedBusiness.id,
          boardIds: boardIds
        })
      });

      if (!response.ok) {
        console.error('📝 Failed to persist board order');
        const errorText = await response.text();
        console.error('Error details:', errorText);
        // Don't show error toast - user experience is already good with optimistic update
      } else {
        console.log('📝 Board order persisted to backend');
      }
    } catch (error) {
      console.error('📝 Error persisting board order:', error);
      // Don't show error toast - user experience is already good with optimistic update
    }
  }, [boards, selectedBusiness?.id]);

  // Reorder lists with drag and drop (index-based positioning)
  const handleRepositionListByIndex = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || !selectedBoard) return;
    
    const reorderedLists = [...(selectedBoard.lists || [])];
    const [movedList] = reorderedLists.splice(fromIndex, 1);
    
    // Adjust target index if we're moving down
    const adjustedToIndex = fromIndex < toIndex ? toIndex - 1 : toIndex;
    reorderedLists.splice(adjustedToIndex, 0, movedList);
    
    setSelectedBoard(prev => prev ? {
      ...prev,
      lists: reorderedLists
    } : null);
    
    toast.success('List repositioned');
  }, [selectedBoard]);

  // Legacy reorder function for backward compatibility
  const handleReorderLists = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || !selectedBoard) return;
    
    const reorderedLists = [...(selectedBoard.lists || [])];
    const [movedList] = reorderedLists.splice(fromIndex, 1);
    reorderedLists.splice(toIndex, 0, movedList);
    
    // Update positions
    const updatedLists = reorderedLists.map((list, idx) => ({
      ...list,
      position: idx
    }));
    
    setSelectedBoard(prev => prev ? {
      ...prev,
      lists: updatedLists
    } : null);
    
    toast.success('List order updated');
  }, [selectedBoard]);

  // Load boards with enhanced caching and preloading
  const loadBoards = useCallback(async (forceReload = false) => {
    if (!selectedBusiness?.id) return;
    
    // Skip loading if we already have data and it's not a forced reload
    if (!forceReload && hasLoadedInitialDataRef.current && boards.length > 0) {
      console.log('📝 Data already loaded, skipping fetch');
      return;
    }
    
    try {
      setLoading(true); // Only set loading when actually fetching
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('📝 No session found, stopping load');
        setLoading(false);
        return;
      }

      console.log('📝 Loading boards for business:', selectedBusiness.id);

      // Load boards list
      const boardsResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notes/boards?businessId=${selectedBusiness.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!boardsResponse.ok) {
        // Check for auth errors to prevent infinite loops
        if (boardsResponse.status === 401 || boardsResponse.status === 403) {
          console.error('📝 Auth error loading boards, stopping retry');
          setError('Authentication failed. Please sign in again.');
          setLoading(false);
          return;
        }
        throw new Error(`Failed to load boards: ${boardsResponse.status}`);
      }

      const boardsResult = await boardsResponse.json();
      console.log('📝 Loaded boards:', boardsResult.boards?.length || 0);

      if (boardsResult.boards && boardsResult.boards.length > 0) {
        // Filter out any temporary boards that weren't properly saved
        const validBoards = boardsResult.boards.filter((b: Board) => !b.id.startsWith('temp-'));
        
        if (validBoards.length < boardsResult.boards.length) {
          console.log('⚠️ Filtered out', boardsResult.boards.length - validBoards.length, 'temporary boards');
        }
        
        // Store boards metadata WITHOUT lists - lists are loaded separately per board
        // This prevents overwriting existing board data with empty lists
        setBoards(validBoards);
        
        // Auto-select board and load its details ONLY if forced or no board is currently selected
        const shouldLoadDetails = forceReload || loadedBoardRef.current === null;
        if (shouldLoadDetails) {
          // Check localStorage for last selected board
          let boardToLoad = validBoards[0];
          try {
            const lastBoardId = localStorage.getItem(`notes_last_board_${selectedBusiness.id}`);
            if (lastBoardId) {
              // Check if the last board was a temporary one - if so, clear it
              if (lastBoardId.startsWith('temp-')) {
                console.log('📝 Clearing temporary board from localStorage:', lastBoardId);
                localStorage.removeItem(`notes_last_board_${selectedBusiness.id}`);
              } else {
                const foundBoard = validBoards.find((b: Board) => b.id === lastBoardId);
                if (foundBoard) {
                  boardToLoad = foundBoard;
                  console.log('📝 Restoring last selected board from localStorage:', boardToLoad.id);
                } else {
                  console.log('📝 Last board not found, defaulting to first board:', boardToLoad.id);
                }
              }
            } else {
              console.log('📝 No last board saved, auto-selecting first board:', boardToLoad.id);
            }
          } catch (error) {
            console.error('Failed to read last board from localStorage:', error);
            console.log('📝 Defaulting to first board:', boardToLoad.id);
          }
          
          // Check if we've already loaded this board's details (prevent duplicate loads)
          if (!forceReload && loadedBoardRef.current === boardToLoad.id) {
            console.log('📝 Board details already loaded, skipping fetch');
            setLoading(false);
            return;
          }
          
          // Load full board details with lists and cards
          const detailsResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notes/boards/${boardToLoad.id}/details?businessId=${selectedBusiness.id}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          });

          if (detailsResponse.ok) {
            const detailsResult = await detailsResponse.json();
            console.log('📝 Loaded board details for first board:', detailsResult.board);
            if (detailsResult.board) {
              // Ensure lists and cards arrays exist
              const boardWithData = {
                ...detailsResult.board,
                lists: (detailsResult.board.lists || []).map((list: List) => ({
                  ...list,
                  cards: list.cards || []
                }))
              };
              console.log('📝 Setting selected board with data:', boardWithData);
              loadedBoardRef.current = boardToLoad.id; // Mark as loaded
              boardsCache.current[boardToLoad.id] = boardWithData; // Cache the board
              setSelectedBoard(boardWithData);
              
              // Save to localStorage for next time
              try {
                localStorage.setItem(`notes_last_board_${selectedBusiness.id}`, boardToLoad.id);
              } catch (error) {
                console.error('Failed to save last board to localStorage:', error);
              }
              
              // PERFORMANCE: Preload remaining boards in parallel (background) for instant switching
              const remainingBoards = validBoards.filter((b: Board) => b.id !== boardToLoad.id);
              if (remainingBoards.length > 0) {
                console.log(`⚡ Preloading ${remainingBoards.length} additional boards in background...`);
                Promise.all(
                  remainingBoards.map(async (board: Board) => {
                    try {
                      const preloadResponse = await fetch(
                        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notes/boards/${board.id}/details?businessId=${selectedBusiness.id}`,
                        {
                          method: 'GET',
                          headers: {
                            'Authorization': `Bearer ${session.access_token}`,
                          },
                        }
                      );
                      
                      if (preloadResponse.ok) {
                        const preloadResult = await preloadResponse.json();
                        if (preloadResult.board) {
                          const preloadBoardWithData = {
                            ...preloadResult.board,
                            lists: (preloadResult.board.lists || []).map((list: List) => ({
                              ...list,
                              cards: list.cards || []
                            }))
                          };
                          boardsCache.current[board.id] = preloadBoardWithData;
                          console.log(`✅ Preloaded board: ${board.name}`);
                        }
                      }
                    } catch (err) {
                      console.log(`⚠️ Failed to preload board ${board.name}, will load on demand`);
                    }
                  })
                ).then(() => {
                  console.log(`🎉 All boards preloaded! Switching is now instant.`);
                });
              }
            } else {
              console.log('⚠️ No board data in details response, using basic board data');
              // Ensure lists array exists
              loadedBoardRef.current = firstBoard.id; // Mark as loaded
              setSelectedBoard({ ...firstBoard, lists: firstBoard.lists || [] });
            }
          } else {
            // Check for auth errors
            if (detailsResponse.status === 401 || detailsResponse.status === 403) {
              console.error('📝 Auth error loading board details, stopping retry');
              setError('Authentication failed. Please sign in again.');
              setLoading(false);
              return;
            }
            const errorText = await detailsResponse.text();
            console.error('❌ Failed to load board details:', detailsResponse.status, errorText);
            // Still set the board even if details fail, but with empty lists
            loadedBoardRef.current = firstBoard.id; // Mark as loaded even if failed
            setSelectedBoard({ ...firstBoard, lists: [] });
          }
        }
      } else {
        console.log('📝 No boards found');
        setBoards([]);
        setSelectedBoard(null);
        loadedBoardRef.current = null;
      }
    } catch (error: any) {
      console.error('📝 Error loading boards:', error);
      console.error('📝 Error details:', {
        message: error?.message,
        name: error?.name,
        stack: error?.stack,
        businessId: selectedBusiness?.id
      });
      setError(`Failed to load boards: ${error?.message || 'Unknown error'}. Please try again.`);
    } finally {
      setLoading(false);
      hasLoadedInitialDataRef.current = true; // Mark that we've loaded data for this business
    }
  }, [selectedBusiness?.id, boards.length]);

  // Simple board switching with caching for instant switching
  const handleBoardSwitch = useCallback(async (boardId: string) => {
    if (!selectedBusiness?.id) return;
    
    console.log('📝 Switching to board:', boardId);
    
    // Save the last selected board to localStorage for persistence
    try {
      localStorage.setItem(`notes_last_board_${selectedBusiness.id}`, boardId);
    } catch (error) {
      console.error('Failed to save last board to localStorage:', error);
    }
    
    // Check if board is in cache for instant switching
    const cachedBoard = boardsCache.current[boardId];
    if (cachedBoard) {
      console.log('⚡ Loading board from cache (instant)');
      setSelectedBoard(cachedBoard);
      loadedBoardRef.current = boardId;
      return;
    }
    
    // If not in cache, fetch from server
    console.log('📡 Fetching board from server...');
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return;

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notes/boards/${boardId}/details?businessId=${selectedBusiness.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log('📝 Loaded board details on switch:', result.board);
        if (result.board) {
          // Update with full board data from server, ensuring lists and cards arrays exist
          const boardWithData = {
            ...result.board,
            lists: (result.board.lists || []).map((list: List) => ({
              ...list,
              cards: list.cards || []
            }))
          };
          
          // Cache the board for future instant switching
          boardsCache.current[boardId] = boardWithData;
          
          loadedBoardRef.current = boardId; // Mark as loaded
          setSelectedBoard(boardWithData);
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to load board details on switch:', response.status, errorText);
        toast.error('Failed to load board details');
      }
    } catch (error) {
      console.error('📝 Error switching board:', error);
      toast.error('Error switching boards');
    }
  }, [selectedBusiness?.id, boards]);

  // Drag and drop functionality can be added later if needed

  // Create board with optimistic update
  const handleCreateBoard = async () => {
    if (!selectedBusiness?.id || !newBoard.name.trim()) return;

    // Prevent creating boards with temporary business IDs
    if (selectedBusiness.id.startsWith('temp-')) {
      toast.error('Please wait for the business to finish creating before adding boards.');
      setIsCreatingBoard(false);
      return;
    }

    console.log('📝 Creating board for business:', selectedBusiness.id, 'Board name:', newBoard.name);

    // Save form data before resetting
    const boardToCreate = {
      name: newBoard.name,
      description: newBoard.description,
      color: newBoard.color
    };

    // Optimistic update - create temporary board immediately
    const tempBoardId = `temp-${Date.now()}`;
    const optimisticBoard: Board = {
      id: tempBoardId,
      name: boardToCreate.name,
      description: boardToCreate.description,
      color: boardToCreate.color,
      // Don't include lists in metadata - prevents data corruption
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Immediately update UI
    setBoards(prev => [optimisticBoard, ...prev]);
    // DON'T auto-select the new board - let user manually switch to it
    // setSelectedBoard(optimisticBoard); // REMOVED: This was causing boards to be overwritten
    loadedBoardRef.current = null; // Don't mark as loaded since we're not selecting it
    setNewBoard({ name: '', description: '', color: 'blue' });
    setIsCreatingBoard(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notes/boards`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: boardToCreate.name,
          description: boardToCreate.description,
          color: boardToCreate.color,
          businessId: selectedBusiness.id
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.board) {
          // Create metadata-only board for boards list (no lists property)
          const boardMetadata = {
            id: result.board.id,
            business_id: result.board.business_id,
            name: result.board.name,
            description: result.board.description || '',
            color: result.board.color || 'blue',
            created_at: result.board.created_at,
            updated_at: result.board.updated_at
          };
          
          // Create full board with lists for selected board
          const boardWithLists = {
            ...result.board,
            lists: result.board.lists || []
          };
          
          // Update boards list with metadata only (no lists)
          setBoards(prev => prev.map(board => 
            board.id === tempBoardId ? boardMetadata : board
          ));
          
          // Set selected board with full data
          setSelectedBoard(boardWithLists);
          loadedBoardRef.current = boardWithLists.id;
          
          console.log('✅ Board created successfully:', boardWithLists.name, 'ID:', boardWithLists.id);
          toast.success(`Board "${boardToCreate.name}" created successfully!`);
        }
      } else {
        // Revert optimistic update on error
        setBoards(prev => prev.filter(board => board.id !== tempBoardId));
        setSelectedBoard(null);
        const errorText = await response.text();
        console.error('📝 Failed to create board:', response.status, errorText);
        toast.error('Failed to create board. Please try again.');
      }
    } catch (error) {
      // Revert optimistic update on error
      setBoards(prev => prev.filter(board => board.id !== tempBoardId));
      setSelectedBoard(null);
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('📝 Error creating board:', errorMessage);
      toast.error(`Error creating board: ${errorMessage}`);
    }
  };

  // Update board
  const handleUpdateBoard = async () => {
    if (!editingBoard || !selectedBusiness?.id || !editingBoard.name.trim()) return;

    const boardToUpdate = { ...editingBoard };

    // Don't try to update temporary boards on backend
    if (boardToUpdate.id.startsWith('temp-')) {
      toast.error('Cannot edit temporary board. Please wait for it to be created.');
      setEditingBoard(null);
      return;
    }

    // Optimistic update
    setBoards(prev => prev.map(board => 
      board.id === boardToUpdate.id ? boardToUpdate : board
    ));
    if (selectedBoard?.id === boardToUpdate.id) {
      setSelectedBoard(boardToUpdate);
    }
    setEditingBoard(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Session expired. Please refresh the page.');
        return;
      }

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notes/boards/${boardToUpdate.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId: selectedBusiness.id,
          name: boardToUpdate.name,
          description: boardToUpdate.description,
          color: boardToUpdate.color
        })
      });

      if (response.ok) {
        toast.success('Board updated successfully');
        
        // Reload the board details to ensure we have the complete data with lists and cards
        const result = await response.json();
        if (result.board) {
          // Update both the boards list and selected board with complete data
          setBoards(prev => prev.map(board => 
            board.id === result.board.id ? result.board : board
          ));
          if (selectedBoard?.id === result.board.id) {
            setSelectedBoard(result.board);
          }
        }
      } else {
        // Revert on error
        loadBoards(true); // Force reload on error
        const errorText = await response.text();
        console.error('📝 Failed to update board - Status:', response.status, 'Error:', errorText);
        toast.error(`Failed to update board: ${response.status} ${errorText || response.statusText}`);
      }
    } catch (error) {
      // Revert on error
      loadBoards(true); // Force reload on error
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('📝 Error updating board:', {
        error,
        boardId: boardToUpdate.id,
        businessId: selectedBusiness?.id,
        url: `https://${projectId}.supabase.co/functions/v1/make-server-ac1075a9/notes/boards/${boardToUpdate.id}`
      });
      toast.error(`Error updating board: ${errorMessage}`);
    }
  };

  // Quick edit board (for color changes without opening dialog)
  const handleEditBoard = async (boardId: string, updates: Partial<Board>) => {
    if (!selectedBusiness?.id) return;

    const boardToUpdate = boards.find(b => b.id === boardId);
    if (!boardToUpdate) return;

    const updatedBoard = { ...boardToUpdate, ...updates };

    // Optimistic update
    setBoards(prev => prev.map(board => 
      board.id === boardId ? updatedBoard : board
    ));
    if (selectedBoard?.id === boardId) {
      setSelectedBoard(updatedBoard);
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Session expired. Please refresh the page.');
        return;
      }

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notes/boards/${boardId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId: selectedBusiness.id,
          name: updatedBoard.name,
          description: updatedBoard.description,
          color: updatedBoard.color
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.board) {
          setBoards(prev => prev.map(board => 
            board.id === result.board.id ? result.board : board
          ));
          if (selectedBoard?.id === result.board.id) {
            setSelectedBoard(result.board);
          }
        }
      } else {
        loadBoards(true);
        toast.error('Failed to update board');
      }
    } catch (error) {
      loadBoards(true);
      console.error('📝 Error updating board:', error);
      toast.error('Error updating board');
    }
  };

  // Delete board
  const handleDeleteBoard = async (boardId: string) => {
    if (!selectedBusiness?.id) return;

    // Check if this is a temporary board (optimistic update that hasn't been saved yet)
    if (boardId.startsWith('temp-')) {
      console.log('📝 Removing temporary board from UI:', boardId);
      
      // Just remove from local state
      setBoards(prev => prev.filter(board => board.id !== boardId));
      if (selectedBoard?.id === boardId) {
        setSelectedBoard(null);
      }
      
      toast.success('Temporary board removed');
      return;
    }

    // Optimistic update for real boards
    const boardToDeleteData = boards.find(board => board.id === boardId);
    setBoards(prev => prev.filter(board => board.id !== boardId));
    if (selectedBoard?.id === boardId) {
      setSelectedBoard(null);
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Session expired. Please refresh the page.');
        return;
      }

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notes/boards/${boardId}?businessId=${selectedBusiness.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        }
      });

      if (response.ok) {
        toast.success('Board deleted successfully');
      } else {
        // Revert on error
        if (boardToDeleteData) {
          setBoards(prev => [...prev, boardToDeleteData].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()));
        }
        const errorText = await response.text();
        console.error('📝 Failed to delete board - Status:', response.status, 'Error:', errorText);
        toast.error(`Failed to delete board: ${response.status} ${errorText || response.statusText}`);
      }
    } catch (error) {
      // Revert on error
      if (boardToDeleteData) {
        setBoards(prev => [...prev, boardToDeleteData].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()));
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('📝 Error deleting board:', {
        error,
        boardId,
        businessId: selectedBusiness?.id,
        url: `https://${projectId}.supabase.co/functions/v1/make-server-ac1075a9/notes/boards/${boardId}?businessId=${selectedBusiness.id}`
      });
      toast.error(`Error deleting board: ${errorMessage}`);
    }
  };

  // Create list with optimistic update
  const handleCreateList = async () => {
    if (!selectedBusiness?.id || !selectedBoard?.id || !newList.name.trim()) return;

    // Save the name before clearing state
    const listName = newList.name;
    const listPosition = (selectedBoard.lists || []).length;

    // Optimistic update - create temporary list immediately
    const tempListId = `temp-${Date.now()}`;
    const optimisticList: List = {
      id: tempListId,
      boardId: selectedBoard.id,
      name: listName,
      position: listPosition,
      cards: [], // Initialize with empty array
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Immediately update UI
    setSelectedBoard(prev => prev ? {
      ...prev,
      lists: [...(prev.lists || []), optimisticList]
    } : null);
    setNewList({ name: '' });
    setIsCreatingList(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notes/lists`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId: selectedBusiness.id,
          boardId: selectedBoard.id,
          name: listName,
          position: listPosition
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.list) {
          // Replace optimistic list with real list
          setSelectedBoard(prev => prev ? {
            ...prev,
            lists: prev.lists.map(list => 
              list.id === tempListId ? { ...result.list, cards: [] } : list
            )
          } : null);
        }
      } else {
        // Revert optimistic update on error
        setSelectedBoard(prev => prev ? {
          ...prev,
          lists: prev.lists.filter(list => list.id !== tempListId)
        } : null);
        console.error('📝 Failed to create list');
      }
    } catch (error) {
      // Revert optimistic update on error
      setSelectedBoard(prev => prev ? {
        ...prev,
        lists: prev.lists.filter(list => list.id !== tempListId)
      } : null);
      console.error('📝 Error creating list:', error);
    }
  };

  // Rename/Update list (supports both name changes and other updates like color)
  const handleRenameList = async (listId: string, updates: string | Partial<List>) => {
    if (!selectedBusiness?.id || !selectedBoard?.id) return;

    // Don't try to update temporary lists on backend
    if (listId.startsWith('temp-')) {
      toast.error('Cannot update temporary list. Please wait for it to be created.');
      return;
    }

    // Handle both string (legacy name-only) and object (new partial update) formats
    const updateData = typeof updates === 'string' ? { name: updates } : updates;
    
    // Find the current list to get its full data
    const currentList = selectedBoard.lists.find(l => l.id === listId);
    if (!currentList) return;

    // Optimistic update
    setSelectedBoard(prev => prev ? {
      ...prev,
      lists: prev.lists.map(list => 
        list.id === listId ? { ...list, ...updateData } : list
      )
    } : null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notes/lists/${listId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId: selectedBusiness.id,
          boardId: selectedBoard.id,
          name: updateData.name || currentList.name,
          color: updateData.color !== undefined ? updateData.color : currentList.color
        })
      });

      if (!response.ok) {
        // Revert on error
        handleBoardSwitch(selectedBoard.id);
        console.error('📝 Failed to update list');
      }
    } catch (error) {
      // Revert on error
      handleBoardSwitch(selectedBoard.id);
      console.error('📝 Error updating list:', error);
    }
  };

  // Delete list
  const handleDeleteList = async (listId: string) => {

    // Check if this is a temporary list (optimistic update that hasn't been saved yet)
    if (listId.startsWith('temp-')) {
      console.log('📝 Removing temporary list from UI:', listId);
      
      // Just remove from local state
      setSelectedBoard(prev => prev ? {
        ...prev,
        lists: prev.lists.filter(list => list.id !== listId)
      } : null);
      
      toast.success('Temporary list removed');
      return;
    }

    // Optimistic update for real lists
    setSelectedBoard(prev => prev ? {
      ...prev,
      lists: prev.lists.filter(list => list.id !== listId)
    } : null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notes/lists/${listId}?businessId=${selectedBusiness?.id}&boardId=${selectedBoard?.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        }
      });

      if (!response.ok) {
        // Revert on error
        handleBoardSwitch(selectedBoard?.id || '');
        console.error('📝 Failed to delete list');
      }
    } catch (error) {
      // Revert on error
      handleBoardSwitch(selectedBoard?.id || '');
      console.error('📝 Error deleting list:', error);
    }
  };

  // Create card inline with optimistic update
  const handleCreateCardInline = useCallback(async (listId: string, title: string, description: string, priority: string) => {
    if (!selectedBusiness?.id || !selectedBoard?.id || !title.trim()) return;

    // Optimistic update - create temporary card immediately
    const tempCardId = `temp-${Date.now()}`;
    const targetList = (selectedBoard.lists || []).find(list => list.id === listId);
    const position = targetList ? targetList.cards.length : 0;
    
    const optimisticCard = {
      id: tempCardId,
      listId: listId,
      title: title,
      description: description,
      labels: [],
      dueDate: null,
      priority: priority,
      position: position,
      completed: false,
      starCompleted: false,
      assignedMembers: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Immediately update UI
    setSelectedBoard(prev => prev ? {
      ...prev,
      lists: prev.lists.map(list => 
        list.id === listId 
          ? { ...list, cards: [...list.cards, optimisticCard] }
          : list
      )
    } : null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notes/cards`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId: selectedBusiness.id,
          boardId: selectedBoard.id,
          listId: listId,
          title: title,
          description: description,
          priority: priority,
          position: position,
          completed: false,
          starCompleted: false
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.card) {
          // Replace optimistic card with real card
          setSelectedBoard(prev => prev ? {
            ...prev,
            lists: prev.lists.map(list => 
              list.id === listId 
                ? { 
                    ...list, 
                    cards: list.cards.map(card => 
                      card.id === tempCardId ? result.card : card
                    )
                  }
                : list
            )
          } : null);
          toast.success('Card created successfully');
        }
      } else {
        // Revert optimistic update on error
        setSelectedBoard(prev => prev ? {
          ...prev,
          lists: prev.lists.map(list => 
            list.id === listId 
              ? { ...list, cards: list.cards.filter(card => card.id !== tempCardId) }
              : list
          )
        } : null);
        const errorText = await response.text();
        console.error('📝 Failed to create card:', response.status, errorText);
        toast.error('📝 Failed to create card');
      }
    } catch (error) {
      // Revert optimistic update on error
      setSelectedBoard(prev => prev ? {
        ...prev,
        lists: prev.lists.map(list => 
          list.id === listId 
            ? { ...list, cards: list.cards.filter(card => card.id !== tempCardId) }
            : list
        )
      } : null);
      console.error('📝 Error creating card:', error);
      toast.error('📝 Failed to create card');
    }
  }, [selectedBusiness?.id, selectedBoard?.id]);

  // Create card with optimistic update (legacy modal version)
  const handleCreateCard = async () => {
    if (!selectedBusiness?.id || !selectedBoard?.id || !newCard.title.trim() || !newCard.listId) return;

    // Store card data before clearing state
    const cardToCreate = {
      listId: newCard.listId,
      title: newCard.title,
      description: newCard.description,
      priority: newCard.priority
    };

    // Optimistic update - create temporary card immediately
    const tempCardId = `temp-${Date.now()}`;
    const targetList = (selectedBoard.lists || []).find(list => list.id === cardToCreate.listId);
    const position = targetList ? (targetList.cards || []).length : 0;
    
    const optimisticCard: Card = {
      id: tempCardId,
      listId: cardToCreate.listId,
      title: cardToCreate.title,
      description: cardToCreate.description,
      labels: [],
      dueDate: null,
      priority: cardToCreate.priority,
      position: position,
      completed: false,
      starCompleted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Immediately update UI
    setSelectedBoard(prev => prev ? {
      ...prev,
      lists: (prev.lists || []).map(list => 
        list.id === cardToCreate.listId 
          ? { ...list, cards: [...(list.cards || []), optimisticCard] }
          : list
      )
    } : null);
    setNewCard({ title: '', description: '', priority: 'medium', listId: '' });
    setIsCreatingCard(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notes/cards`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId: selectedBusiness.id,
          boardId: selectedBoard.id,
          listId: cardToCreate.listId,
          title: cardToCreate.title,
          description: cardToCreate.description,
          priority: cardToCreate.priority,
          position: position,
          completed: false,
          starCompleted: false
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.card) {
          // Replace optimistic card with real card
          setSelectedBoard(prev => prev ? {
            ...prev,
            lists: prev.lists.map(list => 
              list.id === cardToCreate.listId 
                ? { 
                    ...list, 
                    cards: list.cards.map(card => 
                      card.id === tempCardId ? result.card : card
                    )
                  }
                : list
            )
          } : null);
        }
      } else {
        // Revert optimistic update on error
        const errorText = await response.text();
        console.error('📝 Failed to create card:', response.status, errorText);
        setSelectedBoard(prev => prev ? {
          ...prev,
          lists: prev.lists.map(list => 
            list.id === cardToCreate.listId 
              ? { ...list, cards: list.cards.filter(card => card.id !== tempCardId) }
              : list
          )
        } : null);
      }
    } catch (error) {
      // Revert optimistic update on error
      console.error('📝 Error creating card:', error);
      setSelectedBoard(prev => prev ? {
        ...prev,
        lists: prev.lists.map(list => 
          list.id === cardToCreate.listId 
            ? { ...list, cards: list.cards.filter(card => card.id !== tempCardId) }
            : list
        )
      } : null);
    }
  };

  // Complete card with mutual exclusivity
  const handleCompleteCard = useCallback(async (cardId: string, type: 'circle' | 'star') => {
    // Find the card in the current board
    let card: Card | null = null;
    let listId: string | null = null;
    
    for (const list of (selectedBoard?.lists || [])) {
      const foundCard = (list.cards || []).find(c => c.id === cardId);
      if (foundCard) {
        card = foundCard;
        listId = list.id;
        break;
      }
    }

    if (!card || !listId || !selectedBusiness?.id || !selectedBoard?.id) return;

    // Optimistic update with mutual exclusivity
    setSelectedBoard(prev => prev ? {
      ...prev,
      lists: (prev.lists || []).map(list => 
        list.id === listId
          ? {
              ...list,
              cards: (list.cards || []).map(c => 
                c.id === cardId 
                  ? { 
                      ...c, 
                      completed: type === 'circle' ? !c.completed : false,
                      starCompleted: type === 'star' ? !c.starCompleted : false
                    }
                  : c
              )
            }
          : list
      )
    } : null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const newCompleted = type === 'circle' ? !card.completed : false;
      const newStarCompleted = type === 'star' ? !card.starCompleted : false;

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notes/cards/${cardId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId: selectedBusiness.id,
          boardId: selectedBoard.id,
          listId: card.listId,
          title: card.title,
          description: card.description,
          priority: card.priority,
          position: card.position,
          completed: newCompleted,
          starCompleted: newStarCompleted
        })
      });

      if (!response.ok) {
        // Revert optimistic update on error
        setSelectedBoard(prev => prev ? {
          ...prev,
          lists: prev.lists.map(list => 
            list.id === listId
              ? {
                  ...list,
                  cards: list.cards.map(c => 
                    c.id === cardId 
                      ? { ...c, completed: card.completed, starCompleted: card.starCompleted }
                      : c
                  )
                }
              : list
          )
        } : null);
        const errorText = await response.text();
        console.error('📝 Failed to complete card:', response.status, errorText);
        toast.error('📝 Failed to complete card');
      }
    } catch (error) {
      // Revert optimistic update on error
      setSelectedBoard(prev => prev ? {
        ...prev,
        lists: prev.lists.map(list => 
          list.id === listId
            ? {
                ...list,
                cards: list.cards.map(c => 
                  c.id === cardId 
                    ? { ...c, completed: card.completed, starCompleted: card.starCompleted }
                    : c
                )
              }
            : list
        )
      } : null);
      console.error('📝 Error completing card:', error);
      toast.error('📝 Failed to complete card');
    }
  }, [selectedBoard, selectedBusiness?.id]);

  // Move card between lists or within list
  const moveCard = useCallback((dragIndex: number, hoverIndex: number, sourceListId: string, targetListId: string) => {
    setSelectedBoard(prev => {
      if (!prev || !prev.lists) return prev;

      // Create a deep copy of the lists to ensure state change detection
      const newLists = prev.lists.map(list => ({
        ...list,
        cards: [...list.cards]
      }));
      
      // Find source and target lists
      const sourceListIndex = newLists.findIndex(list => list.id === sourceListId);
      const targetListIndex = newLists.findIndex(list => list.id === targetListId);
      
      if (sourceListIndex === -1 || targetListIndex === -1) return prev;

      // Get the card being moved
      const sourceList = newLists[sourceListIndex];
      if (!sourceList.cards || sourceList.cards.length === 0) return prev;
      
      // Remove card from source list
      const [movedCard] = sourceList.cards.splice(dragIndex, 1);
      
      // Create a new card object with updated listId and timestamp
      const updatedCard = {
        ...movedCard,
        listId: targetListId,
        updated_at: new Date().toISOString()
      };
      
      // Insert card into target list
      const targetList = newLists[targetListIndex];
      targetList.cards.splice(hoverIndex, 0, updatedCard);
      
      // Update positions for all cards in source list
      newLists[sourceListIndex].cards = sourceList.cards.map((card, index) => ({
        ...card,
        position: index,
        updated_at: new Date().toISOString()
      }));
      
      // Update positions for all cards in target list (always, even if same list)
      newLists[targetListIndex].cards = targetList.cards.map((card, index) => ({
        ...card,
        position: index,
        updated_at: new Date().toISOString()
      }));

      console.log('🎯 Card moved - triggering auto-save');
      
      return {
        ...prev,
        lists: newLists,
        updated_at: new Date().toISOString()
      };
    });
  }, []); // Empty deps - uses functional state update

  // Inline edit handler - updates a card with partial updates
  const handleInlineEditCard = useCallback(async (cardId: string, updates: Partial<Card>) => {
    if (!selectedBusiness?.id || !selectedBoard?.id) return;

    // Don't try to update temporary cards on backend
    if (cardId.startsWith('temp-')) {
      // Just update locally for temp cards
      setSelectedBoard(prev => prev ? {
        ...prev,
        lists: (prev.lists || []).map(list => ({
          ...list,
          cards: (list.cards || []).map(c => 
            c.id === cardId ? { ...c, ...updates } : c
          )
        }))
      } : null);
      return;
    }

    // Find the card to get all its properties
    const card = (selectedBoard.lists || [])
      .flatMap(list => (list.cards || []))
      .find(c => c.id === cardId);

    if (!card) return;

    // Store original card for potential revert
    const originalCard = { ...card };

    // Create updated card
    const updatedCard = { ...card, ...updates };

    // Optimistic update - update card immediately
    setSelectedBoard(prev => prev ? {
      ...prev,
      lists: (prev.lists || []).map(list => ({
        ...list,
        cards: (list.cards || []).map(c => 
          c.id === cardId ? updatedCard : c
        )
      }))
    } : null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notes/cards/${cardId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId: selectedBusiness.id,
          boardId: selectedBoard.id,
          listId: updatedCard.listId,
          title: updatedCard.title,
          description: updatedCard.description,
          priority: updatedCard.priority,
          position: updatedCard.position,
          completed: updatedCard.completed,
          starCompleted: updatedCard.starCompleted || false,
          assignedMembers: updatedCard.assignedMembers || []
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.card) {
          // Replace optimistic update with real data
          setSelectedBoard(prev => prev ? {
            ...prev,
            lists: prev.lists.map(list => ({
              ...list,
              cards: list.cards.map(c => 
                c.id === cardId ? result.card : c
              )
            }))
          } : null);
        }
        toast.success('Card updated');
      } else {
        // Revert optimistic update on error
        setSelectedBoard(prev => prev ? {
          ...prev,
          lists: prev.lists.map(list => ({
            ...list,
            cards: list.cards.map(c => 
              c.id === cardId ? originalCard : c
            )
          }))
        } : null);
        console.error('📝 Failed to update card');
        toast.error('Failed to update card');
      }
    } catch (error) {
      // Revert optimistic update on error
      setSelectedBoard(prev => prev ? {
        ...prev,
        lists: prev.lists.map(list => ({
          ...list,
          cards: list.cards.map(c => 
            c.id === cardId ? originalCard : c
          )
        }))
      } : null);
      console.error('📝 Error updating card:', error);
      toast.error('Failed to update card');
    }
  }, [selectedBoard, selectedBusiness?.id]);

  // Delete card with optimistic update - FAST VERSION
  const handleDeleteCard = useCallback(async (cardId: string) => {
    console.log('🗑️ FAST DELETE initiated for card:', cardId);

    // Check if this is a temporary card (optimistic update that hasn't been saved yet)
    if (cardId.startsWith('temp-')) {
      console.log('🗑️ Removing temporary card from UI:', cardId);
      
      // Just remove from local state
      setSelectedBoard(prev => prev ? {
        ...prev,
        lists: prev.lists.map(list => ({
          ...list,
          cards: list.cards.filter(c => c.id !== cardId)
        }))
      } : null);
      
      // No toast needed - already shown by the calling code
      return;
    }

    // Find the card to get its list ID and store for potential revert
    let listId: string | null = null;
    let cardToDelete: Card | null = null;
    let cardIndex: number = -1;
    
    for (const list of (selectedBoard?.lists || [])) {
      const foundCardIndex = (list.cards || []).findIndex(c => c.id === cardId);
      if (foundCardIndex !== -1) {
        listId = list.id;
        cardToDelete = (list.cards || [])[foundCardIndex];
        cardIndex = foundCardIndex;
        break;
      }
    }

    if (!listId || !cardToDelete || !selectedBusiness?.id || !selectedBoard?.id) return;

    // Add to pending deletes to prevent auto-save interference
    pendingDeletesRef.current.add(cardId);
    console.log('🗑️ Added to pending deletes:', cardId);

    // Optimistic update - remove card immediately from UI
    setSelectedBoard(prev => prev ? {
      ...prev,
      lists: prev.lists.map(list => 
        list.id === listId
          ? {
              ...list,
              cards: list.cards.filter(c => c.id !== cardId)
            }
          : list
      )
    } : null);

    // Fire-and-forget delete request (don't await - let it happen in background)
    const deleteCard = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          pendingDeletesRef.current.delete(cardId);
          return;
        }

        const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notes/cards/${cardId}?businessId=${selectedBusiness.id}&boardId=${selectedBoard.id}&listId=${listId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          }
        });

        if (response.ok) {
          console.log('✅ Card deleted successfully:', cardId);
        } else {
          console.error('⚠️ Delete failed, reverting:', cardId);
          // Only revert if the delete actually failed
          setSelectedBoard(prev => prev ? {
            ...prev,
            lists: prev.lists.map(list => 
              list.id === listId
                ? {
                    ...list,
                    cards: [
                      ...list.cards.slice(0, cardIndex),
                      cardToDelete,
                      ...list.cards.slice(cardIndex)
                    ]
                  }
                : list
            )
          } : null);
          toast.error('Failed to delete card');
        }
      } catch (error) {
        console.error('❌ Delete error:', error);
        // Revert on error
        setSelectedBoard(prev => prev ? {
          ...prev,
          lists: prev.lists.map(list => 
            list.id === listId
              ? {
                  ...list,
                  cards: [
                    ...list.cards.slice(0, cardIndex),
                    cardToDelete,
                    ...list.cards.slice(cardIndex)
                  ]
                }
              : list
          )
        } : null);
        toast.error('Error deleting card');
      } finally {
        // Remove from pending deletes after completion
        pendingDeletesRef.current.delete(cardId);
        console.log('🗑️ Removed from pending deletes:', cardId);
      }
    };

    // Execute delete in background (non-blocking)
    deleteCard();
  }, [selectedBoard, selectedBusiness]);

  // Toggle card description expansion
  const handleToggleCardExpand = useCallback((cardId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  }, []);

  // Load boards on mount and when business changes
  useEffect(() => {
    if (selectedBusiness?.id) {
      // Small delay to let cache restoration effect run first
      const timer = setTimeout(() => {
        // Check if we already have cached data for this business
        const hasCachedData = boards.length > 0 && hasLoadedInitialDataRef.current;
        
        if (!hasCachedData) {
          console.log('📝 No cached data, loading from server...');
          // Reset loaded board tracking when business changes
          loadedBoardRef.current = null;
          hasLoadedInitialDataRef.current = false;
          isRestoringFromCacheRef.current = false;
          loadBoards();
        } else {
          console.log('📦 Using cached data, skipping server load');
        }
      }, 50);
      
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBusiness?.id]); // Only reload when business changes, not when loadBoards changes

  // Only show loading screen if we're loading AND have no data yet
  if (loading && boards.length === 0) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00E0FF] mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading your notes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-[#FF4F4F] mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Something went wrong</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
          <Button onClick={() => {
            setError(null);
            setLoading(true);
            loadBoards(true); // Force reload on retry
          }} className="bg-[#00E0FF] hover:bg-[#00E0FF]/90 text-white">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pink-mode-bg-gradient bg-gradient-to-br from-white via-blue-50/30 to-cyan-50/30 dark:from-black dark:via-slate-900/30 dark:to-cyan-950/30 relative overflow-hidden pt-2 sm:pt-0 pb-20 sm:pb-24">
      {/* Floating Toy Box Pop Particles Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            y: [0, -40, 0],
            x: [0, 30, 0],
            rotate: [0, 360],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-20 right-20 w-40 h-40 rounded-full opacity-20 blur-3xl"
          style={{ backgroundColor: '#00E0FF' }}
        />
        <motion.div
          animate={{
            y: [0, 50, 0],
            x: [0, -35, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute bottom-40 left-20 w-36 h-36 rounded-full opacity-20 blur-3xl"
          style={{ backgroundColor: '#FFCF00' }}
        />
        <motion.div
          animate={{
            y: [0, -45, 0],
            x: [0, 20, 0],
            rotate: [0, -360],
          }}
          transition={{
            duration: 28,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/3 left-32 w-28 h-28 rounded-full opacity-20 blur-3xl"
          style={{ backgroundColor: '#6CFF6C' }}
        />
        <motion.div
          animate={{
            y: [0, 40, 0],
            x: [0, -25, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 32,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/2 right-32 w-32 h-32 rounded-full opacity-15 blur-3xl"
          style={{ backgroundColor: '#4B00FF' }}
        />
      </div>

      {/* Premium Liquid Glass Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden"
      >
        {/* Header */}
        <div className="relative z-10 liquid-glass-card border-b-0 mb-4" style={{
          borderRadius: '0 0 24px 24px',
          boxShadow: '0 8px 32px rgba(0, 224, 255, 0.1)',
        }}>
          <div className="max-w-full mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
            <div className="flex items-center justify-between h-12 sm:h-16">
              <div className="flex items-center space-x-2 sm:space-x-4">
                <motion.div
                  animate={{ 
                    rotate: [0, 5, -5, 0],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <StickyNote className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: 'var(--primary)' }} />
                </motion.div>
                <h1 
                  className="text-base sm:text-xl font-semibold"
                  style={{
                    color: 'var(--primary)',
                    textShadow: '0 2px 10px rgba(0, 224, 255, 0.15)',
                  }}
                >
                  Notes
                </h1>
                {selectedBusiness && (
                  <Badge 
                    variant="outline"
                    className="liquid-glass-info border-0"
                  >
                    {selectedBusiness.name}
                  </Badge>
                )}
              </div>

              <div className="flex items-center space-x-2 sm:space-x-4">
                {/* Business Switcher */}
                <div className="hidden sm:block">
                  <BusinessSwitcher />
                </div>
                
                {/* Cofounder Notes Button */}
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    size="sm" 
                    onClick={() => setIsCofounderNotesOpen(true)}
                    className="text-xs sm:text-sm h-8 sm:h-10 liquid-glass-btn border-0 rounded-xl"
                    style={{
                      background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
                      color: 'var(--primary-foreground)'
                    }}
                  >
                    <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Cofounder Notes</span>
                    <span className="sm:hidden">Cofounder</span>
                  </Button>
                </motion.div>
                
                {/* Create Board */}
                <Dialog open={isCreatingBoard} onOpenChange={setIsCreatingBoard}>
                  <DialogTrigger asChild>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button 
                        size="sm" 
                        className="text-xs sm:text-sm h-8 sm:h-10 liquid-glass-btn-success border-0 rounded-xl"
                      >
                        <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">New Board</span>
                        <span className="sm:hidden">New</span>
                      </Button>
                    </motion.div>
                  </DialogTrigger>
                  <DialogContent className="text-sm sm:text-base">
                    <DialogHeader>
                      <DialogTitle className="text-base sm:text-lg">Create New Board</DialogTitle>
                      <DialogDescription className="text-xs sm:text-sm">
                        Create a new board to organize your notes and tasks.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="board-name" className="text-xs sm:text-sm">Board Name</Label>
                        <Input
                          id="board-name"
                          className="text-xs sm:text-sm h-8 sm:h-10"
                          value={newBoard.name}
                          onChange={(e) => setNewBoard(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter board name..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && newBoard.name.trim()) {
                              e.preventDefault();
                              handleCreateBoard();
                            }
                          }}
                        />
                      </div>
                      <div>
                        <Label htmlFor="board-description" className="text-xs sm:text-sm">Description (Optional)</Label>
                        <Textarea
                          id="board-description"
                          className="text-xs sm:text-sm min-h-16 sm:min-h-20"
                          value={newBoard.description}
                          onChange={(e) => setNewBoard(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Enter board description..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey && newBoard.name.trim()) {
                              e.preventDefault();
                              handleCreateBoard();
                            }
                          }}
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" size="sm" className="text-xs sm:text-sm h-8 sm:h-10 liquid-glass rounded-xl" onClick={() => setIsCreatingBoard(false)}>
                          Cancel
                        </Button>
                        <Button 
                          size="sm" 
                          className="text-xs sm:text-sm h-8 sm:h-10 liquid-glass-btn-success border-0 rounded-xl" 
                          style={{ color: '#ffffff' }}
                          onClick={handleCreateBoard}
                        >
                          Create Board
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="relative z-10">
        {/* Board Selection */}
        {boards.length > 0 && (
          <div className="liquid-glass-nav mx-3 sm:mx-4 lg:mx-6 xl:mx-8 mb-4 rounded-2xl border">
            <div className="max-w-full px-3 sm:px-4">
              <div className="flex items-center space-x-2 py-3 overflow-x-auto">
                {boards.map((board, boardIndex) => (
                  <div 
                    key={board.id} 
                    className="flex items-center space-x-1"
                    draggable
                    onDragStart={(e) => {
                      setDraggedBoardIndex(boardIndex);
                      e.dataTransfer.effectAllowed = 'move';
                      // Add a subtle visual cue
                      e.currentTarget.style.opacity = '0.5';
                    }}
                    onDragEnd={(e) => {
                      e.currentTarget.style.opacity = '1';
                      setDraggedBoardIndex(null);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (draggedBoardIndex !== null && draggedBoardIndex !== boardIndex) {
                        handleReorderBoards(draggedBoardIndex, boardIndex);
                      }
                      // Always reset drag state after drop
                      setDraggedBoardIndex(null);
                      e.currentTarget.style.opacity = '1';
                    }}
                  >
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant={selectedBoard?.id === board.id ? "default" : "ghost"}
                        size="sm"
                        onClick={() => handleBoardSwitch(board.id)}
                        className={`whitespace-nowrap text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3 rounded-xl cursor-grab active:cursor-grabbing flex items-center gap-1 ${
                          selectedBoard?.id === board.id 
                            ? 'liquid-glass-btn-primary border-0' 
                            : 'liquid-glass hover:liquid-glass-info'
                        }`}
                        style={{
                          ...(selectedBoard?.id === board.id ? { color: 'var(--primary-foreground)' } : {}),
                          borderLeft: `3px solid ${getColorStyle(board.color).bg}`
                        }}
                      >
                        <GripVertical className="w-3 h-3 opacity-50" />
                        {board.name}
                      </Button>
                    </motion.div>
                    {true && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant={selectedBoard?.id === board.id ? "default" : "ghost"} 
                            size="sm" 
                            className={`h-7 w-7 sm:h-8 sm:w-8 p-0 ${
                              selectedBoard?.id === board.id 
                                ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                                : "hover:bg-accent hover:text-accent-foreground"
                            }`}
                            title="Board options"
                          >
                            <MoreHorizontal className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 text-xs sm:text-sm">
                          <DropdownMenuItem onClick={() => setEditingBoard(board)} className="cursor-pointer">
                            <Edit3 className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                            Edit Board
                          </DropdownMenuItem>
                          
                          {/* Color selection */}
                          <div style={{ padding: 'var(--spacing-2)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', marginTop: 'var(--spacing-1)', marginBottom: 'var(--spacing-1)' }}>
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 'var(--spacing-1)', 
                              marginBottom: 'var(--spacing-2)',
                              fontSize: '0.75rem',
                              fontWeight: 'var(--font-weight-medium)',
                              color: 'var(--muted-foreground)'
                            }}>
                              <Palette className="w-3 h-3" />
                              <span>Color</span>
                            </div>
                            <div style={{ 
                              display: 'grid', 
                              gridTemplateColumns: 'repeat(5, 1fr)', 
                              gap: 'var(--spacing-1)' 
                            }}>
                              {COLOR_PALETTE.map((color) => (
                                <button
                                  key={color.value}
                                  onClick={() => handleEditBoard(board.id, { color: color.value })}
                                  title={color.name}
                                  style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: 'var(--radius-sm)',
                                    backgroundColor: color.bg,
                                    border: board.color === color.value ? '2px solid var(--foreground)' : '1px solid var(--border)',
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                  onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                                  onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                  {board.color === color.value && (
                                    <Check className="w-3 h-3" style={{ color: color.text }} />
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                          
                          <DropdownMenuItem 
                            onClick={() => handleDeleteBoard(board.id)} 
                            className="text-[#FF4F4F] cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                            Delete Board
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Board Content */}
        {selectedBoard ? (
          <div className="max-w-full mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-2 sm:py-4 lg:py-6 bg-gradient-to-b from-white to-gray-50/30 dark:from-gray-900 dark:to-gray-800/30 min-h-screen">
            {/* Board Actions */}
            <div className="flex items-center justify-between mb-3 sm:mb-6">
              <div className="flex items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    {/* Board color indicator */}
                    <div 
                      style={{ 
                        width: '8px', 
                        height: '32px',
                        backgroundColor: getColorStyle(selectedBoard.color).bg,
                        borderRadius: 'var(--radius-sm)'
                      }}
                    />
                    <h2 className="text-lg sm:text-2xl font-bold" style={{ color: 'var(--primary)' }}>
                      {selectedBoard.name}
                    </h2>
                  </div>
                  {selectedBoard.description && (
                    <p className="text-muted-foreground mt-1">{selectedBoard.description}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                {/* Undo Button */}
                <NotesUndoButton 
                  user={user}
                  boardId={selectedBoard.id}
                  onUndoComplete={loadBoards}
                />
                
                {/* Create List */}
                <Dialog open={isCreatingList} onOpenChange={setIsCreatingList}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs sm:text-sm h-7 sm:h-9 border-[#4B00FF] text-[#4B00FF] hover:bg-[#4B00FF] hover:text-white transition-colors">
                      <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Add List</span>
                      <span className="sm:hidden">List</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="text-sm sm:text-base">
                    <DialogHeader>
                      <DialogTitle className="text-base sm:text-lg">Create New List</DialogTitle>
                      <DialogDescription className="text-xs sm:text-sm">
                        Add a new list to organize your cards.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="list-name" className="text-xs sm:text-sm">List Name</Label>
                        <Input
                          id="list-name"
                          className="text-xs sm:text-sm h-8 sm:h-10"
                          value={newList.name}
                          onChange={(e) => setNewList({ name: e.target.value })}
                          placeholder="Enter list name..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && newList.name.trim()) {
                              e.preventDefault();
                              handleCreateList();
                            }
                          }}
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" size="sm" className="text-xs sm:text-sm h-8 sm:h-10 liquid-glass rounded-xl" onClick={() => setIsCreatingList(false)}>
                          Cancel
                        </Button>
                        <Button size="sm" className="text-xs sm:text-sm h-8 sm:h-10 liquid-glass-btn-primary text-white border-0 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(75, 0, 255, 0.95), rgba(75, 0, 255, 1))' }} onClick={handleCreateList}>Create List</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Create Card */}
                <Dialog open={isCreatingCard} onOpenChange={setIsCreatingCard}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="text-xs sm:text-sm h-7 sm:h-9 bg-[#FFCF00] hover:bg-[#FFCF00]/90 text-gray-900 border-0">
                      <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Add Card</span>
                      <span className="sm:hidden">Card</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="text-sm sm:text-base">
                    <DialogHeader>
                      <DialogTitle className="text-base sm:text-lg">Create New Card</DialogTitle>
                      <DialogDescription className="text-xs sm:text-sm">
                        Add a new card to one of your lists.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="card-list" className="text-xs sm:text-sm">List</Label>
                        <Select value={newCard.listId} onValueChange={(value) => setNewCard(prev => ({ ...prev, listId: value }))}>
                          <SelectTrigger className="text-xs sm:text-sm h-8 sm:h-10">
                            <SelectValue placeholder="Select a list..." />
                          </SelectTrigger>
                          <SelectContent 
                            className="text-xs sm:text-sm max-h-[300px] overflow-y-auto"
                            position="popper"
                            sideOffset={4}
                          >
                            {(selectedBoard.lists || []).map((list) => (
                              <SelectItem key={list.id} value={list.id}>
                                {list.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="card-title" className="text-xs sm:text-sm">Title</Label>
                        <Input
                          id="card-title"
                          className="text-xs sm:text-sm h-8 sm:h-10"
                          value={newCard.title}
                          onChange={(e) => setNewCard(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="Enter card title..."
                        />
                      </div>
                      <div>
                        <Label htmlFor="card-description" className="text-xs sm:text-sm">Description (Optional)</Label>
                        <Textarea
                          id="card-description"
                          className="text-xs sm:text-sm min-h-16 sm:min-h-20"
                          value={newCard.description}
                          onChange={(e) => setNewCard(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Enter card description..."
                        />
                      </div>
                      <div>
                        <Label htmlFor="card-priority" className="text-xs sm:text-sm">Priority</Label>
                        <Select value={newCard.priority} onValueChange={(value) => setNewCard(prev => ({ ...prev, priority: value }))}>
                          <SelectTrigger className="text-xs sm:text-sm h-8 sm:h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent 
                            className="text-xs sm:text-sm max-h-[200px] overflow-y-auto"
                            position="popper"
                            sideOffset={4}
                          >
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" size="sm" className="text-xs sm:text-sm h-8 sm:h-10 liquid-glass rounded-xl" onClick={() => setIsCreatingCard(false)}>
                          Cancel
                        </Button>
                        <Button size="sm" className="text-xs sm:text-sm h-8 sm:h-10 liquid-glass-btn-success text-gray-900 border-0 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(255, 207, 0, 0.95), rgba(255, 207, 0, 1))' }} onClick={handleCreateCard}>Create Card</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Lists and Cards - Grid with Auto Packing */}
            <div 
              className="relative grid gap-2 sm:gap-4 lg:gap-6 pb-4 lg:pb-6"
              style={{
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
                gridAutoRows: 'min-content',
                gridAutoFlow: 'row dense',
              }}
            >
              {(selectedBoard.lists || []).map((list, listIndex) => {
                return (
                  <div
                    key={list.id}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      
                      // Detect if we're hovering over top half or bottom half
                      const rect = e.currentTarget.getBoundingClientRect();
                      const mouseY = e.clientY - rect.top;
                      const halfHeight = rect.height / 2;
                      
                      // Set target index based on position
                      let targetIndex = listIndex;
                      if (mouseY > halfHeight) {
                        targetIndex = listIndex + 1; // Insert after this list
                      }
                      
                      setDraggedOverPosition({ index: targetIndex, isAfter: mouseY > halfHeight });
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (draggedListIndex !== null && draggedListIndex !== listIndex && draggedOverPosition) {
                        handleRepositionListByIndex(draggedListIndex, draggedOverPosition.index);
                      }
                      setDraggedListIndex(null);
                      setDraggedOverPosition(null);
                    }}
                    onDragLeave={(e) => {
                      // Only reset if we're actually leaving the element
                      const rect = e.currentTarget.getBoundingClientRect();
                      if (
                        e.clientX < rect.left ||
                        e.clientX >= rect.right ||
                        e.clientY < rect.top ||
                        e.clientY >= rect.bottom
                      ) {
                        setDraggedOverPosition(null);
                      }
                    }}
                    className={`relative transition-all`}
                  >
                    {/* Drop indicator - shows above or below the list */}
                    {draggedListIndex !== null && draggedListIndex !== listIndex && draggedOverPosition && (
                      <>
                        {/* Show indicator above if dropping before */}
                        {draggedOverPosition.index === listIndex && !draggedOverPosition.isAfter && (
                          <div 
                            className="absolute -top-2 left-0 right-0 h-1 rounded-full z-10"
                            style={{ backgroundColor: 'var(--primary)' }}
                          />
                        )}
                        {/* Show indicator below if dropping after */}
                        {draggedOverPosition.index === listIndex + 1 && draggedOverPosition.isAfter && (
                          <div 
                            className="absolute -bottom-2 left-0 right-0 h-1 rounded-full z-10"
                            style={{ backgroundColor: 'var(--primary)' }}
                          />
                        )}
                      </>
                    )}
                    
                    <DroppableList
                      key={list.id}
                      list={list}
                      onCompleteCard={handleCompleteCard}
                      onEditCard={handleInlineEditCard}
                      onDeleteCard={handleDeleteCard}
                      onDeleteList={handleDeleteList}
                      onRenameList={handleRenameList}
                      moveCard={moveCard}
                      onCreateCard={handleCreateCardInline}
                      creatingCardInList={creatingCardInList}
                      setCreatingCardInList={setCreatingCardInList}
                      expandedCards={expandedCards}
                      onToggleCardExpand={handleToggleCardExpand}
                      onDragStart={(e) => {
                        setDraggedListIndex(listIndex);
                        e.dataTransfer.effectAllowed = 'move';
                        (e.target as HTMLElement).style.opacity = '0.6';
                      }}
                      onDragEnd={(e) => {
                        (e.target as HTMLElement).style.opacity = '1';
                        setDraggedListIndex(null);
                        setDraggedOverPosition(null);
                      }}
                    />
                  </div>
                );
              })}
              
              {selectedBoard.lists.length === 0 && (
                <div className="text-center py-12 w-full">
                  <motion.div
                    animate={{ 
                      rotate: [0, 10, -10, 0],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <StickyNote className="w-12 h-12 mx-auto mb-4" style={{ color: '#4B00FF' }} />
                  </motion.div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No lists yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Create your first list to start organizing your cards.
                  </p>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      onClick={() => setIsCreatingList(true)} 
                      className="liquid-glass-btn-primary text-white border-0 rounded-xl"
                      style={{
                        background: 'linear-gradient(135deg, rgba(75, 0, 255, 0.95), rgba(75, 0, 255, 1))',
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create First List
                    </Button>
                  </motion.div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="max-w-full mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-8 lg:py-12">
            <div className="text-center">
              <motion.div
                animate={{ 
                  rotate: [0, 10, -10, 0], 
                  scale: [1, 1.1, 1],
                  y: [0, -10, 0]
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <StickyNote className="w-16 h-16 mx-auto mb-6" style={{ color: 'var(--primary)' }} />
              </motion.div>
              <h2 
                className="text-2xl font-bold mb-4"
                style={{
                  color: 'var(--primary)',
                  textShadow: '0 2px 10px rgba(0, 224, 255, 0.15)',
                }}
              >
                {boards.length === 0 ? 'Welcome to Notes' : 'Select a Board'}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
                {boards.length === 0 
                  ? 'Create your first board to start organizing your notes, tasks, and ideas with lists and cards.'
                  : 'Choose a board from the tabs above to view and manage your notes.'
                }
              </p>
              {boards.length === 0 && (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    onClick={() => setIsCreatingBoard(true)} 
                    size="lg" 
                    className="liquid-glass-btn-success border-0 rounded-xl"
                    style={{ color: 'var(--success-foreground)' }}
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Create Your First Board
                  </Button>
                </motion.div>
              )}
            </div>
          </div>
        )}

        {/* Edit Board Modal */}
        <Dialog open={!!editingBoard} onOpenChange={() => setEditingBoard(null)}>
          <DialogContent className="text-sm sm:text-base">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">Edit Board</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Update your board details.
              </DialogDescription>
            </DialogHeader>
            {editingBoard && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-board-name" className="text-xs sm:text-sm">Board Name</Label>
                  <Input
                    id="edit-board-name"
                    className="text-xs sm:text-sm h-8 sm:h-10"
                    value={editingBoard.name}
                    onChange={(e) => setEditingBoard(prev => prev ? { ...prev, name: e.target.value } : null)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && editingBoard.name.trim()) {
                        e.preventDefault();
                        handleUpdateBoard();
                      }
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-board-description" className="text-xs sm:text-sm">Description</Label>
                  <Textarea
                    id="edit-board-description"
                    className="text-xs sm:text-sm min-h-16 sm:min-h-20"
                    value={editingBoard.description}
                    onChange={(e) => setEditingBoard(prev => prev ? { ...prev, description: e.target.value } : null)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && editingBoard.name.trim()) {
                        e.preventDefault();
                        handleUpdateBoard();
                      }
                    }}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" size="sm" className="text-xs sm:text-sm h-8 sm:h-10 liquid-glass rounded-xl" onClick={() => setEditingBoard(null)}>
                    Cancel
                  </Button>
                  <Button 
                    size="sm"
                    className="text-xs sm:text-sm h-8 sm:h-10 liquid-glass-btn-primary text-white border-0 rounded-xl"
                    onClick={handleUpdateBoard}
                    disabled={!editingBoard?.name?.trim()}
                  >
                    Update Board
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Cofounder Notes Assistant */}
        <CofounderNotesAssistant
          user={user}
          businessContext={selectedBusiness}
          currentBoards={boards}
          onCreateBoard={async (board) => {
            // Create board using Cofounder data - returns board ID
            if (!selectedBusiness?.id) return '';
            
            const tempBoardId = `temp-${Date.now()}`;
            
            // Metadata-only board for the boards list (no lists)
            const optimisticBoardMetadata: Board = {
              id: tempBoardId,
              name: board.name,
              description: board.description,
              color: board.color,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            
            // Full board with lists for selected board
            const optimisticBoardWithLists: Board = {
              ...optimisticBoardMetadata,
              lists: []
            };

            setBoards(prev => [optimisticBoardMetadata, ...prev]);
            setSelectedBoard(optimisticBoardWithLists);
            loadedBoardRef.current = tempBoardId;

            try {
              const { data: { session } } = await supabase.auth.getSession();
              if (!session) return tempBoardId;

              const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notes/boards`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${session.access_token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  name: board.name,
                  description: board.description,
                  color: board.color,
                  businessId: selectedBusiness.id
                })
              });

              if (response.ok) {
                const result = await response.json();
                if (result.board) {
                  // Create metadata-only board for boards list (no lists property)
                  const boardMetadata = {
                    id: result.board.id,
                    business_id: result.board.business_id,
                    name: result.board.name,
                    description: result.board.description || '',
                    color: result.board.color || 'blue',
                    created_at: result.board.created_at,
                    updated_at: result.board.updated_at
                  };
                  
                  // Create full board with lists for selected board
                  const boardWithLists = {
                    ...result.board,
                    lists: result.board.lists || []
                  };
                  
                  // Update boards list with metadata only (no lists)
                  setBoards(prev => prev.map(b => 
                    b.id === tempBoardId ? boardMetadata : b
                  ));
                  
                  // Set selected board with full data
                  setSelectedBoard(boardWithLists);
                  loadedBoardRef.current = boardWithLists.id;
                  console.log('📝 Cofounder: Created board with ID:', boardWithLists.id);
                  return boardWithLists.id;
                }
              } else {
                setBoards(prev => prev.filter(b => b.id !== tempBoardId));
                console.error('📝 Failed to create board from Cofounder');
                return '';
              }
            } catch (error) {
              setBoards(prev => prev.filter(b => b.id !== tempBoardId));
              console.error('📝 Error creating board from Cofounder:', error);
              return '';
            }
            return tempBoardId;
          }}
          onCreateList={async (boardId, list) => {
            // Create list for a specific board - returns list ID
            if (!selectedBusiness?.id) return '';

            const tempListId = `temp-${Date.now()}`;
            const optimisticList: List = {
              id: tempListId,
              boardId: boardId,
              name: list.name,
              position: list.position,
              cards: [],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };

            // Update boards array
            setBoards(prev => prev.map(b => 
              b.id === boardId ? { ...b, lists: [...(b.lists || []), optimisticList] } : b
            ));
            
            // Update selectedBoard if it's the same board
            if (selectedBoard?.id === boardId) {
              setSelectedBoard(prev => prev ? {
                ...prev,
                lists: [...(prev.lists || []), optimisticList]
              } : null);
            }

            try {
              const { data: { session } } = await supabase.auth.getSession();
              if (!session) return tempListId;

              const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notes/lists`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${session.access_token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  businessId: selectedBusiness.id,
                  boardId: boardId,
                  name: list.name,
                  position: list.position
                })
              });

              if (response.ok) {
                const result = await response.json();
                if (result.list) {
                  const realList = { ...result.list, cards: [] };
                  
                  setBoards(prev => prev.map(b => 
                    b.id === boardId ? {
                      ...b,
                      lists: b.lists.map(l => l.id === tempListId ? realList : l)
                    } : b
                  ));
                  
                  if (selectedBoard?.id === boardId) {
                    setSelectedBoard(prev => prev ? {
                      ...prev,
                      lists: prev.lists.map(l => l.id === tempListId ? realList : l)
                    } : null);
                  }
                  
                  console.log('📝 Cofounder: Created list with ID:', realList.id);
                  return realList.id;
                } else {
                  console.error('📝 API returned success but no list data');
                  // Revert
                  setBoards(prev => prev.map(b => 
                    b.id === boardId ? {
                      ...b,
                      lists: b.lists.filter(l => l.id !== tempListId)
                    } : b
                  ));
                  if (selectedBoard?.id === boardId) {
                    setSelectedBoard(prev => prev ? {
                      ...prev,
                      lists: prev.lists.filter(l => l.id !== tempListId)
                    } : null);
                  }
                  return '';
                }
              } else {
                // Revert
                setBoards(prev => prev.map(b => 
                  b.id === boardId ? {
                    ...b,
                    lists: b.lists.filter(l => l.id !== tempListId)
                  } : b
                ));
                
                if (selectedBoard?.id === boardId) {
                  setSelectedBoard(prev => prev ? {
                    ...prev,
                    lists: prev.lists.filter(l => l.id !== tempListId)
                  } : null);
                }
                
                console.error('📝 Failed to create list from Cofounder');
                return '';
              }
            } catch (error) {
              console.error('📝 Error creating list from Cofounder:', error);
              // Revert optimistic update
              setBoards(prev => prev.map(b => 
                b.id === boardId ? {
                  ...b,
                  lists: b.lists.filter(l => l.id !== tempListId)
                } : b
              ));
              if (selectedBoard?.id === boardId) {
                setSelectedBoard(prev => prev ? {
                  ...prev,
                  lists: prev.lists.filter(l => l.id !== tempListId)
                } : null);
              }
              return '';
            }
          }}
          onCreateCard={async (listId, card) => {
            // Create card for a specific list - find board dynamically
            if (!selectedBusiness?.id) return;

            // Find which board contains this list - use functional update to get fresh state
            let targetBoardId: string | null = null;
            
            // First check boards state with functional update to get latest value
            setBoards(prev => {
              for (const board of prev) {
                const list = board.lists?.find(l => l.id === listId);
                if (list) {
                  targetBoardId = board.id;
                  break;
                }
              }
              return prev; // Don't actually update, just read
            });

            if (!targetBoardId) {
              console.error('📝 Could not find board for list:', listId, 'Available lists:', boards.flatMap(b => b.lists.map(l => ({ boardId: b.id, listId: l.id, listName: l.name }))));
              return;
            }

            const tempCardId = `temp-${Date.now()}`;
            const optimisticCard: Card = {
              id: tempCardId,
              listId: listId,
              title: card.title,
              description: card.description,
              labels: card.labels,
              dueDate: null,
              priority: card.priority,
              position: card.position,
              completed: false,
              starCompleted: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };

            // Update boards array
            setBoards(prev => prev.map(b =>
              b.id === targetBoardId ? {
                ...b,
                lists: b.lists.map(list =>
                  list.id === listId
                    ? { ...list, cards: [...list.cards, optimisticCard] }
                    : list
                )
              } : b
            ));

            // Update selectedBoard if it matches
            if (selectedBoard?.id === targetBoardId) {
              setSelectedBoard(prev => prev ? {
                ...prev,
                lists: prev.lists.map(list => 
                  list.id === listId 
                    ? { ...list, cards: [...list.cards, optimisticCard] }
                    : list
                )
              } : null);
            }

            try {
              const { data: { session } } = await supabase.auth.getSession();
              if (!session) return;

              const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notes/cards`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${session.access_token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  businessId: selectedBusiness.id,
                  boardId: targetBoardId,
                  listId: listId,
                  title: card.title,
                  description: card.description,
                  priority: card.priority,
                  position: card.position,
                  completed: false,
                  starCompleted: false
                })
              });

              if (response.ok) {
                const result = await response.json();
                if (result.card) {
                  // Update boards array
                  setBoards(prev => prev.map(b =>
                    b.id === targetBoardId ? {
                      ...b,
                      lists: b.lists.map(list =>
                        list.id === listId
                          ? {
                              ...list,
                              cards: list.cards.map(c =>
                                c.id === tempCardId ? result.card : c
                              )
                            }
                          : list
                      )
                    } : b
                  ));

                  // Update selectedBoard if it matches
                  if (selectedBoard?.id === targetBoardId) {
                    setSelectedBoard(prev => prev ? {
                      ...prev,
                      lists: prev.lists.map(list => 
                        list.id === listId 
                          ? { 
                              ...list, 
                              cards: list.cards.map(c => 
                                c.id === tempCardId ? result.card : c
                              )
                            }
                          : list
                      )
                    } : null);
                  }
                  
                  console.log('📝 Cofounder: Created card:', result.card.title);
                }
              } else {
                const errorText = await response.text();
                console.error('📝 Card creation failed. Status:', response.status, 'Error:', errorText);
                
                // Revert in boards array
                setBoards(prev => prev.map(b =>
                  b.id === targetBoardId ? {
                    ...b,
                    lists: b.lists.map(list =>
                      list.id === listId
                        ? { ...list, cards: list.cards.filter(c => c.id !== tempCardId) }
                        : list
                    )
                  } : b
                ));

                // Revert in selectedBoard if it matches
                if (selectedBoard?.id === targetBoardId) {
                  setSelectedBoard(prev => prev ? {
                    ...prev,
                    lists: prev.lists.map(list => 
                      list.id === listId 
                        ? { ...list, cards: list.cards.filter(c => c.id !== tempCardId) }
                        : list
                    )
                  } : null);
                }
              }
            } catch (error) {
              console.error('📝 Error creating card from Cofounder:', error);
              
              // Revert on error
              setBoards(prev => prev.map(b =>
                b.id === targetBoardId ? {
                  ...b,
                  lists: b.lists.map(list =>
                    list.id === listId
                      ? { ...list, cards: list.cards.filter(c => c.id !== tempCardId) }
                      : list
                  )
                } : b
              ));

              if (selectedBoard?.id === targetBoardId) {
                setSelectedBoard(prev => prev ? {
                  ...prev,
                  lists: prev.lists.map(list => 
                    list.id === listId 
                      ? { ...list, cards: list.cards.filter(c => c.id !== tempCardId) }
                      : list
                  )
                } : null);
              }
            }
          }}
          onDeleteBoard={handleDeleteBoard}
          onEditBoard={async (boardId, updates) => {
            if (!selectedBusiness?.id) return;
            
            // Optimistically update board
            setBoards(prev => prev.map(b =>
              b.id === boardId ? { ...b, ...updates } : b
            ));
            
            if (selectedBoard?.id === boardId) {
              setSelectedBoard(prev => prev ? { ...prev, ...updates } : null);
            }

            try {
              const { data: { session } } = await supabase.auth.getSession();
              if (!session) return;

              const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notes/boards/${boardId}`, {
                method: 'PUT',
                headers: {
                  'Authorization': `Bearer ${session.access_token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  businessId: selectedBusiness.id,
                  ...updates
                })
              });

              if (!response.ok) {
                console.error('📝 Failed to update board');
              }
            } catch (error) {
              console.error('📝 Error updating board:', error);
            }
          }}
          onDeleteList={handleDeleteList}
          onEditList={handleRenameList}
          onMoveList={async (listId, toBoardId, position) => {
            // Move list between boards
            if (!selectedBusiness?.id) return;

            // Find source board
            let sourceBoardId: string | null = null;
            for (const board of boards) {
              if (board.lists.some(l => l.id === listId)) {
                sourceBoardId = board.id;
                break;
              }
            }

            if (!sourceBoardId) return;

            // Optimistically update
            const listToMove = boards.find(b => b.id === sourceBoardId)?.lists.find(l => l.id === listId);
            if (!listToMove) return;

            setBoards(prev => prev.map(b => {
              if (b.id === sourceBoardId) {
                return { ...b, lists: b.lists.filter(l => l.id !== listId) };
              }
              if (b.id === toBoardId) {
                return { ...b, lists: [...b.lists, { ...listToMove, boardId: toBoardId, position }] };
              }
              return b;
            }));

            try {
              const { data: { session } } = await supabase.auth.getSession();
              if (!session) return;

              const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notes/lists/${listId}`, {
                method: 'PUT',
                headers: {
                  'Authorization': `Bearer ${session.access_token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  businessId: selectedBusiness.id,
                  boardId: toBoardId,
                  position
                })
              });

              if (!response.ok) {
                console.error('📝 Failed to move list');
              }
            } catch (error) {
              console.error('📝 Error moving list:', error);
            }
          }}
          onDeleteCard={handleDeleteCard}
          onEditCard={async (cardId, updates) => {
            if (!selectedBusiness?.id || !selectedBoard?.id) return;

            // Find the card
            let listId: string | null = null;
            for (const list of selectedBoard.lists) {
              if (list.cards.some(c => c.id === cardId)) {
                listId = list.id;
                break;
              }
            }

            if (!listId) return;

            // Optimistically update
            setSelectedBoard(prev => prev ? {
              ...prev,
              lists: prev.lists.map(list =>
                list.id === listId ? {
                  ...list,
                  cards: list.cards.map(c =>
                    c.id === cardId ? { ...c, ...updates } : c
                  )
                } : list
              )
            } : null);

            try {
              const { data: { session } } = await supabase.auth.getSession();
              if (!session) return;

              const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notes/cards/${cardId}`, {
                method: 'PUT',
                headers: {
                  'Authorization': `Bearer ${session.access_token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  businessId: selectedBusiness.id,
                  boardId: selectedBoard.id,
                  listId,
                  ...updates
                })
              });

              if (!response.ok) {
                console.error('📝 Failed to update card');
              }
            } catch (error) {
              console.error('📝 Error updating card:', error);
            }
          }}
          onMoveCard={async (cardId, toListId, position) => {
            if (!selectedBusiness?.id || !selectedBoard?.id) return;

            // Find source list
            let fromListId: string | null = null;
            let cardToMove: Card | null = null;
            
            for (const list of selectedBoard.lists) {
              const card = list.cards.find(c => c.id === cardId);
              if (card) {
                fromListId = list.id;
                cardToMove = card;
                break;
              }
            }

            if (!fromListId || !cardToMove) return;

            // Optimistically update
            setSelectedBoard(prev => prev ? {
              ...prev,
              lists: prev.lists.map(list => {
                if (list.id === fromListId) {
                  return { ...list, cards: list.cards.filter(c => c.id !== cardId) };
                }
                if (list.id === toListId) {
                  return { ...list, cards: [...list.cards, { ...cardToMove, listId: toListId, position }] };
                }
                return list;
              })
            } : null);

            try {
              const { data: { session } } = await supabase.auth.getSession();
              if (!session) return;

              const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notes/cards/${cardId}`, {
                method: 'PUT',
                headers: {
                  'Authorization': `Bearer ${session.access_token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  businessId: selectedBusiness.id,
                  boardId: selectedBoard.id,
                  listId: toListId,
                  position
                })
              });

              if (!response.ok) {
                console.error('📝 Failed to move card');
              }
            } catch (error) {
              console.error('📝 Error moving card:', error);
            }
          }}
          open={isCofounderNotesOpen}
          onOpenChange={setIsCofounderNotesOpen}
        />
      </div>
    </div>
  );
};

// Main component - cleaned and optimized
const NotesPageContent: React.FC<NotesPageContentProps> = (props) => {
  return <NotesPageContentInner {...props} />;
};

export default NotesPageContent;