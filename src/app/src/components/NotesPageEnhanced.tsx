import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Star, Plus, X, Edit2, Check, Trash2, GripVertical } from 'lucide-react';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { useDrag, useDrop } from 'react-dnd';
import { toast } from 'sonner';

// Types
interface TaskCard {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  position: number;
  listId: string;
  created_at: string;
  updated_at: string;
}

interface TaskList {
  id: string;
  title: string;
  position: number;
  created_at: string;
  updated_at: string;
}

interface NotesPageProps {
  lists: TaskList[];
  cards: TaskCard[];
  onUpdateCard: (card: TaskCard) => Promise<void>;
  onUpdateList: (list: TaskList) => Promise<void>;
  onDeleteCard: (cardId: string) => Promise<void>;
  onDeleteList: (listId: string) => Promise<void>;
  onCreateCard: (listId: string, title: string, description?: string) => Promise<void>;
  onCreateList: (title: string) => Promise<void>;
  onMoveCard: (cardId: string, newListId: string, newPosition: number) => Promise<void>;
}

// Enhanced Task Card Component
const TaskCardComponent: React.FC<{
  card: TaskCard;
  onUpdateCard: (card: TaskCard) => Promise<void>;
  onDeleteCard: (cardId: string) => Promise<void>;
}> = ({ card, onUpdateCard, onDeleteCard }) => {
  const [editingTitle, setEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(card.title);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (editingTitle && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingTitle]);

  // Apply completion styling with useEffect for consistency
  useEffect(() => {
    const cardElement = document.querySelector(`[data-card-id="${card.id}"]`);
    if (cardElement) {
      if (card.completed) {
        // Apply gold styling for completed cards
        cardElement.classList.add(
          'bg-yellow-50/90', 'dark:bg-yellow-800/80', 
          'border-yellow-400/60', 'dark:border-yellow-500/70',
          'shadow-yellow-200/50', 'dark:shadow-yellow-800/60'
        );
        // Remove any conflicting regular classes
        cardElement.classList.remove(
          'bg-white/90', 'dark:bg-slate-700/90',
          'border-white/50', 'dark:border-slate-500/50', 
          'shadow-black/10', 'dark:shadow-black/30'
        );
      } else {
        // Apply regular styling for uncompleted cards
        cardElement.classList.add(
          'bg-white/90', 'dark:bg-slate-700/90',
          'border-white/50', 'dark:border-slate-500/50', 
          'shadow-black/10', 'dark:shadow-black/30'
        );
        // Remove any gold classes
        cardElement.classList.remove(
          'bg-yellow-50/90', 'dark:bg-yellow-800/80', 
          'border-yellow-400/60', 'dark:border-yellow-500/70',
          'shadow-yellow-200/50', 'dark:shadow-yellow-800/60'
        );
      }
    }
  }, [card.id, card.completed]);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'card',
    item: { id: card.id, listId: card.listId },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [card.id, card.listId]);

  const handleSaveTitle = async () => {
    if (editTitle.trim() && editTitle !== card.title) {
      const updatedCard = { ...card, title: editTitle.trim() };
      onUpdateCard(updatedCard);
    }
    setEditingTitle(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      setEditTitle(card.title);
      setEditingTitle(false);
    }
  };

  return (
    <motion.div
      ref={drag}
      data-card-id={card.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.02 }}
      className={`${
        card.completed 
          ? 'bg-yellow-50/90 dark:bg-yellow-800/80 border-yellow-400/60 dark:border-yellow-500/70 shadow-lg shadow-yellow-200/50 dark:shadow-yellow-800/60' 
          : 'bg-white/90 dark:bg-slate-700/90 border-white/50 dark:border-slate-500/50 shadow-lg shadow-black/10 dark:shadow-black/30'
      } backdrop-blur-md border rounded-xl p-3 md:p-4 mb-2 md:mb-3 cursor-pointer transition-all duration-300 relative group mobile-card-container ${
        isDragging ? 'opacity-50' : ''
      }`}
      style={{
        ...(card.completed ? {
          backgroundColor: 'rgba(254, 252, 232, 0.9)', // yellow-50/90 equivalent
          borderColor: 'rgba(251, 191, 36, 0.6)', // yellow-400/60 equivalent
          boxShadow: '0 10px 15px -3px rgba(252, 211, 77, 0.5), 0 4px 6px -2px rgba(252, 211, 77, 0.1)' // yellow shadow
        } : {})
      }}
    >
      {/* Completion star */}
      <div className="absolute left-1.5 md:left-3 top-1.5 md:top-3">
        <motion.button
          onClick={async () => {
            const updatedCard = { 
              ...card, 
              completed: !card.completed,
              updated_at: new Date().toISOString()
            };
            
            // Save to database - let useEffect handle styling
            try {
              await onUpdateCard(updatedCard);
              
              if (updatedCard.completed) {
                toast.success('✨ Task completed! Nice work!');
              } else {
                toast.info('Task marked as incomplete');
              }
            } catch (error) {
              console.error('Failed to save task completion:', error);
              toast.error('Failed to save changes. Please try again.');
            }
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className={`transition-all duration-300 mobile-touch-target ${
            card.completed
              ? 'text-yellow-500 hover:text-yellow-600 drop-shadow-sm'
              : 'text-gray-300 hover:text-yellow-400 dark:text-gray-600 dark:hover:text-yellow-400'
          }`}
        >
          {card.completed ? (
            <Star className="w-3 h-3 md:w-4 md:h-4 fill-current" />
          ) : (
            <Star className="w-3 h-3 md:w-4 md:h-4" />
          )}
        </motion.button>
      </div>

      {/* Card content */}
      <div className="pl-7 md:pl-8 pr-7 md:pr-2">
        {editingTitle ? (
          <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSaveTitle}
              className={`flex-1 h-6 md:h-8 text-xs md:text-sm mobile-input ${
                card.completed ? 'text-yellow-800 dark:text-yellow-100' : 'text-foreground'
              }`}
              placeholder="Task title..."
            />
          </div>
        ) : (
          <div 
            className="flex items-center justify-between group/card cursor-pointer"
            onClick={() => setEditingTitle(true)}
          >
            <h3 className={`text-xs md:text-sm mobile-text-sm line-clamp-2 transition-colors duration-200 ${
              card.completed 
                ? 'text-yellow-800 dark:text-yellow-100 line-through' 
                : 'text-foreground hover:text-primary'
            }`}>
              {card.title}
            </h3>
            
            {/* Action buttons */}
            <div className="flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity duration-200">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingTitle(true);
                }}
                className="h-6 w-6 p-0 mobile-button-small hover:bg-yellow-100 dark:hover:bg-yellow-900/20"
              >
                <Edit2 className="h-3 w-3 mobile-icon-xs" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteCard(card.id);
                  toast.success('Task deleted');
                }}
                className="h-6 w-6 p-0 mobile-button-small text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20"
              >
                <Trash2 className="h-3 w-3 mobile-icon-xs" />
              </Button>
              <div className="cursor-move">
                <GripVertical className="h-3 w-3 mobile-icon-xs text-gray-400" />
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Task List Component
const TaskListComponent: React.FC<{
  list: TaskList;
  cards: TaskCard[];
  onUpdateCard: (card: TaskCard) => Promise<void>;
  onUpdateList: (list: TaskList) => Promise<void>;
  onDeleteCard: (cardId: string) => Promise<void>;
  onDeleteList: (listId: string) => Promise<void>;
  onCreateCard: (listId: string, title: string) => Promise<void>;
  onMoveCard: (cardId: string, newListId: string, newPosition: number) => Promise<void>;
}> = ({ list, cards, onUpdateCard, onUpdateList, onDeleteCard, onDeleteList, onCreateCard, onMoveCard }) => {
  const [editingTitle, setEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(list.title);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [showAddCard, setShowAddCard] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const addCardRef = useRef<HTMLInputElement>(null);

  // Sort cards: incomplete first, then completed, both by position
  const sortedCards = cards.sort((a, b) => {
    // First sort by completion status (incomplete first)
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    // Then by position
    return a.position - b.position;
  });

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'card',
    drop: (item: { id: string; listId: string }) => {
      if (item.listId !== list.id) {
        const newPosition = cards.length;
        onMoveCard(item.id, list.id, newPosition);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }), [list.id, cards.length, onMoveCard]);

  useEffect(() => {
    if (editingTitle && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingTitle]);

  useEffect(() => {
    if (showAddCard && addCardRef.current) {
      addCardRef.current.focus();
    }
  }, [showAddCard]);

  const handleSaveTitle = async () => {
    if (editTitle.trim() && editTitle !== list.title) {
      const updatedList = { ...list, title: editTitle.trim() };
      onUpdateList(updatedList);
    }
    setEditingTitle(false);
  };

  const handleAddCard = async () => {
    if (newCardTitle.trim()) {
      await onCreateCard(list.id, newCardTitle.trim());
      setNewCardTitle('');
      setShowAddCard(false);
      toast.success('Task added!');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (editingTitle) {
        handleSaveTitle();
      } else {
        handleAddCard();
      }
    } else if (e.key === 'Escape') {
      if (editingTitle) {
        setEditTitle(list.title);
        setEditingTitle(false);
      } else {
        setNewCardTitle('');
        setShowAddCard(false);
      }
    }
  };

  return (
    <Card 
      ref={drop}
      className={`p-3 md:p-4 h-fit mobile-card-container ${
        isOver ? 'ring-2 ring-primary/50 bg-primary/5' : ''
      }`}
    >
      {/* List header */}
      <div className="flex items-center justify-between mb-3 md:mb-4">
        {editingTitle ? (
          <Input
            ref={inputRef}
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSaveTitle}
            className="flex-1 h-6 md:h-8 text-sm mobile-input"
            placeholder="List title..."
          />
        ) : (
          <div className="flex items-center gap-2 flex-1">
            <h2 
              onClick={() => setEditingTitle(true)}
              className="text-sm md:text-base mobile-text-base cursor-pointer hover:text-primary transition-colors"
            >
              {list.title}
            </h2>
            <span className="text-xs text-muted-foreground mobile-text-xs">
              ({sortedCards.length})
            </span>
          </div>
        )}
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAddCard(true)}
            className="h-6 w-6 p-0 mobile-button-small hover:bg-green-100 dark:hover:bg-green-900/20"
          >
            <Plus className="h-3 w-3 mobile-icon-xs text-green-600" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onDeleteList(list.id);
              toast.success('List deleted');
            }}
            className="h-6 w-6 p-0 mobile-button-small text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20"
          >
            <Trash2 className="h-3 w-3 mobile-icon-xs" />
          </Button>
        </div>
      </div>

      {/* Add new card */}
      {showAddCard && (
        <div className="mb-2 md:mb-3">
          <div className="flex items-center gap-2">
            <Input
              ref={addCardRef}
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter task title..."
              className="flex-1 h-7 md:h-8 text-xs md:text-sm mobile-input"
            />
            <Button
              onClick={handleAddCard}
              size="sm"
              className="h-7 md:h-8 px-2 mobile-button-small"
            >
              <Check className="h-3 w-3 mobile-icon-xs" />
            </Button>
            <Button
              onClick={() => {
                setNewCardTitle('');
                setShowAddCard(false);
              }}
              variant="ghost"
              size="sm"
              className="h-7 md:h-8 px-2 mobile-button-small"
            >
              <X className="h-3 w-3 mobile-icon-xs" />
            </Button>
          </div>
        </div>
      )}

      {/* Cards */}
      <div className="space-y-1 md:space-y-2 mobile-space-y-1">
        {sortedCards.map((card) => (
          <TaskCardComponent
            key={card.id}
            card={card}
            onUpdateCard={onUpdateCard}
            onDeleteCard={onDeleteCard}
          />
        ))}
        
        {sortedCards.length === 0 && (
          <div className="text-center py-4 md:py-6 text-muted-foreground">
            <p className="text-xs md:text-sm mobile-text-xs">No tasks yet</p>
            <p className="text-xs mobile-text-xs mt-1">Click + to add your first task</p>
          </div>
        )}
      </div>
    </Card>
  );
};

// Main Notes Page Component
const NotesPageEnhanced: React.FC<NotesPageProps> = ({
  lists,
  cards,
  onUpdateCard,
  onUpdateList,
  onDeleteCard,
  onDeleteList,
  onCreateCard,
  onCreateList,
  onMoveCard,
}) => {
  const [newListTitle, setNewListTitle] = useState('');
  const [showAddList, setShowAddList] = useState(false);
  const addListRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showAddList && addListRef.current) {
      addListRef.current.focus();
    }
  }, [showAddList]);

  const handleAddList = async () => {
    if (newListTitle.trim()) {
      await onCreateList(newListTitle.trim());
      setNewListTitle('');
      setShowAddList(false);
      toast.success('List created!');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddList();
    } else if (e.key === 'Escape') {
      setNewListTitle('');
      setShowAddList(false);
    }
  };

  const getListCards = (listId: string) => {
    return cards.filter(card => card.listId === listId);
  };

  return (
    <div className="container mx-auto p-4 md:p-6 mobile-content">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h1 className="text-lg md:text-2xl mobile-text-lg">Task Management</h1>
        
        {showAddList ? (
          <div className="flex items-center gap-2">
            <Input
              ref={addListRef}
              value={newListTitle}
              onChange={(e) => setNewListTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter list title..."
              className="w-40 md:w-48 h-7 md:h-8 mobile-input"
            />
            <Button
              onClick={handleAddList}
              size="sm"
              className="h-7 md:h-8 mobile-button-small"
            >
              <Check className="h-3 w-3 mobile-icon-xs" />
            </Button>
            <Button
              onClick={() => {
                setNewListTitle('');
                setShowAddList(false);
              }}
              variant="ghost"
              size="sm"
              className="h-7 md:h-8 mobile-button-small"
            >
              <X className="h-3 w-3 mobile-icon-xs" />
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => setShowAddList(true)}
            className="h-7 md:h-8 mobile-button"
          >
            <Plus className="h-3 w-3 mobile-icon-xs mr-1" />
            <span className="text-xs md:text-sm mobile-text-xs">Add List</span>
          </Button>
        )}
      </div>

      {/* Lists grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {lists
          .sort((a, b) => a.position - b.position)
          .map((list) => (
            <TaskListComponent
              key={list.id}
              list={list}
              cards={getListCards(list.id)}
              onUpdateCard={onUpdateCard}
              onUpdateList={onUpdateList}
              onDeleteCard={onDeleteCard}
              onDeleteList={onDeleteList}
              onCreateCard={onCreateCard}
              onMoveCard={onMoveCard}
            />
          ))}
        
        {lists.length === 0 && (
          <div className="col-span-full text-center py-8 md:py-12">
            <h3 className="text-base md:text-lg mobile-text-base mb-2">No task lists yet</h3>
            <p className="text-sm mobile-text-sm text-muted-foreground mb-4">
              Create your first list to start organizing your tasks
            </p>
            <Button onClick={() => setShowAddList(true)} className="mobile-button">
              <Plus className="h-4 w-4 mobile-icon-sm mr-2" />
              Create First List
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotesPageEnhanced;