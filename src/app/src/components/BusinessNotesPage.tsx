import React, { useState, useEffect, useCallback, useRef, ErrorInfo, Component } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useDrag, useDrop } from 'react-dnd';
import { useTheme } from './ThemeProvider';
import { useBusiness } from './BusinessContext';
import { BusinessSwitcher } from './BusinessSwitcher';
import SupportButton from './SupportButton';
import { MotivationButton } from './MotivationButton';
import { Logo } from './Logo';

// NOTE: This is NOT the notes page that was worked on for hours either - 
// this is also the wrong version
import { 
  ArrowLeft, Moon, Sun, HelpCircle, Menu, StickyNote, Plus, MoreHorizontal,
  Edit3, Trash2, Calendar, Flag, Tag, Search, Filter, Users, TrendingUp, 
  Target, DollarSign, LogOut, Map, X, Check, AlertCircle, GripVertical
} from 'lucide-react';
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Label } from './ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';

interface BusinessNotesPageProps {
  user: any;
  onBack: () => void;
}

interface Board {
  id: string;
  userId: string;
  businessId: string;
  name: string;
  description: string;
  color: string;
  lists: List[];
  created_at: string;
  updated_at: string;
}

interface List {
  id: string;
  boardId: string;
  name: string;
  position: number;
  cards: NoteCard[];
  created_at: string;
  updated_at: string;
}

interface NoteCard {
  id: string;
  listId: string;
  title: string;
  description: string;
  labels: string[];
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
  position: number;
  created_at: string;
  updated_at: string;
}

interface DragItem {
  type: string;
  id: string;
  card: NoteCard;
  sourceListId: string;
}

const ItemTypes = {
  CARD: 'card',
  LIST: 'list'
};

// Simple Error Boundary for DroppableList components
class ListErrorBoundary extends Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('List component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex-none w-80 bg-white/20 dark:bg-gray-800/20 backdrop-blur-lg rounded-xl p-4 border border-gray-200/30 dark:border-gray-700/30 shadow-sm">
          <div className="text-center py-8">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Error loading list. Please refresh the page.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const priorityColors = {
  low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
};

const boardColors = [
  { name: 'Blue', value: 'blue', class: 'bg-blue-500' },
  { name: 'Purple', value: 'purple', class: 'bg-purple-500' },
  { name: 'Green', value: 'green', class: 'bg-green-500' },
  { name: 'Orange', value: 'orange', class: 'bg-orange-500' },
  { name: 'Pink', value: 'pink', class: 'bg-pink-500' },
  { name: 'Teal', value: 'teal', class: 'bg-teal-500' }
];

// Draggable Card Component
function DraggableCard({ card, onCardClick, onDeleteCard }: { card: NoteCard; onCardClick: (card: NoteCard) => void; onDeleteCard: (cardId: string, listId: string) => void }) {
  const [{ isDragging }, drag, preview] = useDrag({
    type: ItemTypes.CARD,
    item: { type: ItemTypes.CARD, id: card.id, card, sourceListId: card.listId },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div ref={preview}>
      <motion.div
        ref={drag}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-white/30 dark:bg-gray-700/30 rounded-lg p-3 border border-gray-200/30 dark:border-gray-600/30 hover:shadow-md transition-all cursor-pointer group ${
          isDragging ? 'opacity-50 rotate-2 scale-105 shadow-xl z-50' : ''
        }`}
        onClick={() => onCardClick(card)}
        style={{ opacity: isDragging ? 0.5 : 1 }}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-2 flex-1">
            <div 
              className="mt-1 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <GripVertical className="w-3 h-3 text-gray-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">
                {card.title}
              </h4>
              {card.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {card.description}
                </p>
              )}
              <div className="flex items-center justify-between">
                <Badge className={priorityColors[card.priority]} variant="secondary">
                  {card.priority}
                </Badge>
                {card.dueDate && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(card.dueDate)}
                  </span>
                )}
              </div>
            </div>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <Trash2 className="w-3 h-3 text-red-500" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Card</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{card.title}"?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => onDeleteCard(card.id, card.listId)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete Card
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </motion.div>
    </div>
  );
}

// Draggable and Droppable List Wrapper Component
function DraggableListWrapper({ 
  list, 
  index,
  filteredCards, 
  onCardClick, 
  onDeleteCard, 
  onDeleteList, 
  onCreateCard, 
  onMoveCard,
  onMoveList 
}: { 
  list: List; 
  index: number;
  filteredCards: NoteCard[]; 
  onCardClick: (card: NoteCard) => void; 
  onDeleteCard: (cardId: string, listId: string) => void; 
  onDeleteList: (listId: string) => void; 
  onCreateCard: (listId: string) => void;
  onMoveCard: (cardId: string, sourceListId: string, targetListId: string) => void;
  onMoveList: (dragIndex: number, hoverIndex: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.LIST,
    item: { type: ItemTypes.LIST, id: list.id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver }, drop] = useDrop({
    accept: ItemTypes.LIST,
    hover: (item: { type: string; id: string; index: number }, monitor) => {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }

      // Determine rectangle on screen
      const hoverBoundingRect = ref.current?.getBoundingClientRect();

      // Get horizontal middle
      const hoverMiddleX = (hoverBoundingRect.right - hoverBoundingRect.left) / 2;

      // Determine mouse position
      const clientOffset = monitor.getClientOffset();

      // Get pixels to the left
      const hoverClientX = clientOffset!.x - hoverBoundingRect.left;

      // Only perform the move when the mouse has crossed half of the items width
      // When dragging leftwards, only move when the cursor is below 50%
      // When dragging rightwards, only move when the cursor is above 50%

      // Dragging leftwards
      if (dragIndex < hoverIndex && hoverClientX < hoverMiddleX) {
        return;
      }

      // Dragging rightwards
      if (dragIndex > hoverIndex && hoverClientX > hoverMiddleX) {
        return;
      }

      // Time to actually perform the action
      onMoveList(dragIndex, hoverIndex);

      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: 'move',
      }}
    >
      <DroppableList
        list={list}
        filteredCards={filteredCards}
        onCardClick={onCardClick}
        onDeleteCard={onDeleteCard}
        onDeleteList={onDeleteList}
        onCreateCard={onCreateCard}
        onMoveCard={onMoveCard}
      />
    </div>
  );
}

// Droppable List Component
function DroppableList({ 
  list, 
  filteredCards, 
  onCardClick, 
  onDeleteCard, 
  onDeleteList, 
  onCreateCard, 
  onMoveCard 
}: { 
  list: List; 
  filteredCards: NoteCard[]; 
  onCardClick: (card: NoteCard) => void; 
  onDeleteCard: (cardId: string, listId: string) => void; 
  onDeleteList: (listId: string) => void; 
  onCreateCard: (listId: string) => void;
  onMoveCard: (cardId: string, sourceListId: string, targetListId: string) => void;
}) {
  // Add null safety checks
  if (!list || !list.id || !list.name) {
    return (
      <div className="flex-none w-80 bg-white/20 dark:bg-gray-800/20 backdrop-blur-lg rounded-xl p-4 border border-gray-200/30 dark:border-gray-700/30 shadow-sm">
        <div className="text-center py-8">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Invalid list data. Please refresh the page.
          </p>
        </div>
      </div>
    );
  }

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ItemTypes.CARD,
    drop: (item: DragItem) => {
      if (item.sourceListId !== list.id) {
        onMoveCard(item.id, item.sourceListId, list.id);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const isActive = isOver && canDrop;

  return (
    <div
      ref={drop}
      className={`flex-none w-80 bg-white/20 dark:bg-gray-800/20 backdrop-blur-lg rounded-xl p-4 border border-gray-200/30 dark:border-gray-700/30 shadow-sm transition-all flex flex-col max-h-[calc(100vh-12rem)] ${
        isActive ? 'bg-blue-50/50 dark:bg-blue-900/20 border-blue-300/50 shadow-md ring-2 ring-blue-500/20' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200">
          {list.name}
        </h3>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-white/30 dark:bg-gray-700/30">
            {list.cards.length}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete List
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete List</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{list.name}"? This will permanently remove all cards in this list.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => onDeleteList(list.id)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete List
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Drop Zone Indicator */}
      {isActive && (
        <div className="mb-3 p-3 border-2 border-dashed border-blue-400 rounded-lg bg-blue-50/50 dark:bg-blue-900/20 flex-shrink-0">
          <p className="text-sm text-blue-600 dark:text-blue-400 text-center">
            Drop card here
          </p>
        </div>
      )}

      {/* Scrollable Cards Container */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-3 mb-4 min-h-0">
        {filteredCards.map((card) => (
          <DraggableCard
            key={card.id}
            card={card}
            onCardClick={onCardClick}
            onDeleteCard={onDeleteCard}
          />
        ))}
      </div>

      {/* Add Card Button - Always visible at bottom */}
      <Button
        variant="outline"
        className="w-full bg-white/10 dark:bg-gray-700/20 border-dashed flex-shrink-0"
        onClick={() => onCreateCard(list.id)}
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Card
      </Button>
    </div>
  );
}

function BusinessNotesPage({ user, onBack }: BusinessNotesPageProps) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { selectedBusiness } = useBusiness();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // State management
  const [boards, setBoards] = useState<Board[]>([]);
  const [activeBoard, setActiveBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateBoard, setShowCreateBoard] = useState(false);
  const [showCreateList, setShowCreateList] = useState(false);
  const [showCreateCard, setShowCreateCard] = useState(false);
  const [selectedCard, setSelectedCard] = useState<NoteCard | null>(null);
  const [selectedList, setSelectedList] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [usingFallback, setUsingFallback] = useState(false);
  
  // Prevent infinite loops and duplicate API calls
  const loadingRef = useRef(false);
  const lastBusinessIdRef = useRef<string | null>(null);
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
    labels: [],
    dueDate: '',
    priority: 'medium' as 'low' | 'medium' | 'high'
  });

  // Board editing state
  const [editingBoardName, setEditingBoardName] = useState(false);
  const [editedBoardName, setEditedBoardName] = useState('');
  const boardNameInputRef = useRef<HTMLInputElement>(null);

  // Track in-progress operations to prevent race conditions
  const pendingDeletionsRef = useRef<Set<string>>(new Set());
  const deletionQueueRef = useRef<Map<string, { cardId: string; listId: string; timestamp: number }>>(new Map());

  // Scroll to top on mount (desktop view)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <TrendingUp className="w-5 h-5" />, path: '/dashboard' },
    { id: 'roadmap', label: 'Interactive Roadmap', icon: <Map className="w-5 h-5" />, path: '/roadmap' },
    { 
      id: 'operations', 
      label: 'Business OS', 
      icon: <Target className="w-5 h-5" />,
      path: '/operations'
    },
    { id: 'community', label: 'Community Hub', icon: <Users className="w-5 h-5" />, path: '/community' },
    { id: 'notes', label: 'Notes', icon: <StickyNote className="w-5 h-5" />, path: '/notes' }
  ];

  // Load boards when business changes
  useEffect(() => {
    if (selectedBusiness) {
      // Reset the last business ID when business actually changes
      if (lastBusinessIdRef.current !== selectedBusiness.id) {
        lastBusinessIdRef.current = null;
        loadBoards();
      }
    } else {
      setBoards([]);
      setActiveBoard(null);
      setLoading(false);
      lastBusinessIdRef.current = null;
    }
  }, [selectedBusiness, loadBoards]);

  const createDefaultBoard = useCallback((): Board => {
    const boardId = `board-${selectedBusiness?.id}-${Date.now()}`;
    return {
      id: boardId,
      userId: user.id,
      businessId: selectedBusiness?.id || '',
      name: `${selectedBusiness?.name} Notes`,
      description: `Notes and tasks for ${selectedBusiness?.name}`,
      color: 'blue',
      lists: [
        {
          id: `list-${boardId}-1`,
          boardId,
          name: 'To Do',
          position: 0,
          cards: [
            {
              id: `card-${boardId}-1`,
              listId: `list-${boardId}-1`,
              title: `Welcome to ${selectedBusiness?.name} notes!`,
              description: 'This is where you can organize your business-specific thoughts and tasks. Try dragging this card to another list!',
              labels: ['welcome'],
              priority: 'medium',
              position: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: `list-${boardId}-2`,
          boardId,
          name: 'In Progress',
          position: 1,
          cards: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: `list-${boardId}-3`,
          boardId,
          name: 'Done',
          position: 2,
          cards: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }, [selectedBusiness, user.id]);

  const loadBoardDetails = useCallback(async (boardId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) return;

      console.log(`Loading board details for: ${boardId}`);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notes/boards/${boardId}/details`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log(`Loaded board details with ${result.board?.lists?.length || 0} lists`);
        
        // ✅ FIX: Filter out cards that are pending deletion to prevent race conditions
        const pendingDeletions = pendingDeletionsRef.current;
        if (pendingDeletions.size > 0) {
          console.log(`⚠️ Filtering ${pendingDeletions.size} pending deletions from board data`);
          result.board.lists = result.board.lists.map((list: List) => ({
            ...list,
            cards: list.cards.filter((card: NoteCard) => !pendingDeletions.has(card.id))
          }));
        }
        
        setActiveBoard(result.board);
        
        // Update boards list to include the detailed board data
        setBoards(prev => prev.map(board => 
          board.id === boardId ? result.board : board
        ));
      } else {
        console.error('Failed to load board details:', await response.text());
      }
    } catch (error) {
      console.error('Error loading board details:', error);
    }
  }, []);

  const loadBoards = useCallback(async () => {
    if (!selectedBusiness) return;
    
    // Prevent duplicate calls for the same business
    if (loadingRef.current || lastBusinessIdRef.current === selectedBusiness.id) {
      console.log('Skipping duplicate loadBoards call');
      return;
    }
    
    loadingRef.current = true;
    lastBusinessIdRef.current = selectedBusiness.id;
    setLoading(true);
    setUsingFallback(false);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        console.log('No access token, using fallback');
        const defaultBoard = createDefaultBoard();
        setBoards([defaultBoard]);
        setActiveBoard(defaultBoard);
        setUsingFallback(true);
        setLoading(false);
        loadingRef.current = false;
        return;
      }

      console.log(`Loading boards for business: ${selectedBusiness.id}`);
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notes/boards?businessId=${selectedBusiness.id}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log(`Loaded ${result.boards?.length || 0} boards from server`);
        
        if (result.boards && result.boards.length > 0) {
          setBoards(result.boards);
          // Load details for the first board
          await loadBoardDetails(result.boards[0].id);
        } else {
          // No boards exist, create a default one
          await createDefaultBoardOnServer();
        }
      } else if (response.status === 401) {
        // Authentication error - don't retry, just use fallback
        console.warn('Authentication error, using fallback board');
        const defaultBoard = createDefaultBoard();
        setBoards([defaultBoard]);
        setActiveBoard(defaultBoard);
        setUsingFallback(true);
      } else {
        console.error('Failed to load boards:', response.status, response.statusText);
        // Fall back to local board
        const defaultBoard = createDefaultBoard();
        setBoards([defaultBoard]);
        setActiveBoard(defaultBoard);
        setUsingFallback(true);
      }
    } catch (error) {
      console.error('Error loading boards:', error);
      // Fall back to local board
      const defaultBoard = createDefaultBoard();
      setBoards([defaultBoard]);
      setActiveBoard(defaultBoard);
      setUsingFallback(true);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [selectedBusiness, createDefaultBoard, loadBoardDetails]);

  const createDefaultBoardOnServer = useCallback(async () => {
    if (!selectedBusiness) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        const defaultBoard = createDefaultBoard();
        setBoards([defaultBoard]);
        setActiveBoard(defaultBoard);
        setUsingFallback(true);
        return;
      }

      const boardData = {
        businessId: selectedBusiness.id,
        name: `${selectedBusiness.name} Notes`,
        description: `Notes and tasks for ${selectedBusiness.name}`,
        color: 'blue'
      };

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notes/boards`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(boardData)
        }
      );

      if (response.ok) {
        const result = await response.json();
        setBoards([result.board]);
        setActiveBoard(result.board);
        
        // Create default lists inline to avoid circular dependency
        const defaultLists = [
          { name: 'To Do', position: 0 },
          { name: 'In Progress', position: 1 },
          { name: 'Done', position: 2 }
        ];

        for (const listData of defaultLists) {
          await createListOnServer(result.board.id, listData.name, listData.position);
        }
      } else {
        console.error('Failed to create default board:', await response.text());
        const defaultBoard = createDefaultBoard();
        setBoards([defaultBoard]);
        setActiveBoard(defaultBoard);
        setUsingFallback(true);
      }
    } catch (error) {
      console.error('Error creating default board:', error);
      const defaultBoard = createDefaultBoard();
      setBoards([defaultBoard]);
      setActiveBoard(defaultBoard);
      setUsingFallback(true);
    }
  }, [selectedBusiness, createDefaultBoard]);

  const createListOnServer = async (boardId: string, name: string, position: number) => {
    if (!selectedBusiness) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) return;

      const listData = {
        businessId: selectedBusiness.id,
        boardId,
        name,
        position
      };

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notes/lists`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(listData)
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log(`Created list "${result.list.name}" for board ${boardId}`);
        return result.list;
      } else {
        console.error('Failed to create list:', await response.text());
      }
    } catch (error) {
      console.error('Error creating list:', error);
    }
  };

  const loadBoardDetails = async (boardId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) return;

      console.log(`Loading board details for: ${boardId}`);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notes/boards/${boardId}/details`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log(`Loaded board details with ${result.board?.lists?.length || 0} lists`);
        
        // ✅ FIX: Filter out cards that are pending deletion to prevent race conditions
        const pendingDeletions = pendingDeletionsRef.current;
        if (pendingDeletions.size > 0) {
          console.log(`⚠️ Filtering ${pendingDeletions.size} pending deletions from board data`);
          result.board.lists = result.board.lists.map((list: List) => ({
            ...list,
            cards: list.cards.filter((card: NoteCard) => !pendingDeletions.has(card.id))
          }));
        }
        
        setActiveBoard(result.board);
        
        // Update boards list to include the detailed board data
        setBoards(prev => prev.map(board => 
          board.id === boardId ? result.board : board
        ));
      } else {
        console.error('Failed to load board details:', await response.text());
      }
    } catch (error) {
      console.error('Error loading board details:', error);
    }
  };

  const handleMoveCard = async (cardId: string, sourceListId: string, targetListId: string) => {
    if (!activeBoard || !selectedBusiness) return;

    // Find the card and remove it from source list
    let cardToMove: NoteCard | null = null;
    const updatedLists = activeBoard.lists.map(list => {
      if (list.id === sourceListId) {
        const cardIndex = list.cards.findIndex(card => card.id === cardId);
        if (cardIndex !== -1) {
          cardToMove = list.cards[cardIndex];
          return {
            ...list,
            cards: list.cards.filter(card => card.id !== cardId)
          };
        }
      }
      return list;
    });

    if (!cardToMove) return;

    // Add the card to target list
    const finalLists = updatedLists.map(list => {
      if (list.id === targetListId) {
        return {
          ...list,
          cards: [...list.cards, { ...cardToMove!, listId: targetListId }]
        };
      }
      return list;
    });

    const updatedBoard = {
      ...activeBoard,
      lists: finalLists,
      updated_at: new Date().toISOString()
    };

    // Optimistically update UI
    setActiveBoard(updatedBoard);
    setBoards(prev => prev.map(board => 
      board.id === activeBoard.id ? updatedBoard : board
    ));

    // Update backend if not using fallback
    if (!usingFallback) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const accessToken = session?.access_token;

        if (accessToken) {
          console.log('📝 Moving card on server:', { cardId, sourceListId, targetListId });
          
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notes/cards/${cardId}`,
            {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                businessId: selectedBusiness.id,
                boardId: activeBoard.id,
                listId: targetListId,
                title: cardToMove.title,
                description: cardToMove.description,
                labels: cardToMove.labels,
                dueDate: cardToMove.dueDate,
                priority: cardToMove.priority,
                position: cardToMove.position
              })
            }
          );

          if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Failed to move card on server:', errorText);
            // Revert the change if server update failed
            setActiveBoard(activeBoard);
            setBoards(prev => prev.map(board => 
              board.id === activeBoard.id ? activeBoard : board
            ));
          } else {
            console.log(`✅ Successfully moved card ${cardId} from ${sourceListId} to ${targetListId}`);
          }
        }
      } catch (error) {
        console.error('Error moving card:', error);
      }
    }
  };

  const handleMoveList = useCallback(async (dragIndex: number, hoverIndex: number) => {
    if (!activeBoard || !selectedBusiness) return;

    const sortedLists = [...activeBoard.lists].sort((a, b) => a.position - b.position);
    const dragList = sortedLists[dragIndex];
    const newLists = [...sortedLists];
    
    // Remove the dragged list and insert it at the new position
    newLists.splice(dragIndex, 1);
    newLists.splice(hoverIndex, 0, dragList);

    // Update positions for all lists
    const updatedLists = newLists.map((list, idx) => ({
      ...list,
      position: idx
    }));

    const updatedBoard = {
      ...activeBoard,
      lists: updatedLists,
      updated_at: new Date().toISOString()
    };

    // Optimistically update UI
    setActiveBoard(updatedBoard);
    setBoards(prev => prev.map(board => 
      board.id === activeBoard.id ? updatedBoard : board
    ));

    // Update backend if not using fallback
    if (!usingFallback) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const accessToken = session?.access_token;

        if (accessToken) {
          console.log('📋 Updating list positions on server');
          
          // Update each list's position on the server
          const updatePromises = updatedLists.map(list => 
            fetch(
              `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notes/lists/${list.id}`,
              {
                method: 'PUT',
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  businessId: selectedBusiness.id,
                  boardId: activeBoard.id,
                  name: list.name,
                  position: list.position
                })
              }
            )
          );

          const responses = await Promise.all(updatePromises);
          const allSuccessful = responses.every(r => r.ok);

          if (!allSuccessful) {
            console.error('❌ Failed to update some list positions on server');
            // Revert the change if server update failed
            setActiveBoard(activeBoard);
            setBoards(prev => prev.map(board => 
              board.id === activeBoard.id ? activeBoard : board
            ));
          } else {
            console.log('✅ Successfully updated all list positions');
          }
        }
      } catch (error) {
        console.error('Error updating list positions:', error);
        // Revert on error
        setActiveBoard(activeBoard);
        setBoards(prev => prev.map(board => 
          board.id === activeBoard.id ? activeBoard : board
        ));
      }
    }
  }, [activeBoard, selectedBusiness, usingFallback]);

  const handleCreateBoard = async () => {
    if (!newBoard.name.trim() || !selectedBusiness) return;

    setCreating(true);
    
    if (usingFallback) {
      // Create locally
      const boardId = `board-${selectedBusiness.id}-${Date.now()}`;
      const newBoardObj: Board = {
        id: boardId,
        userId: user.id,
        businessId: selectedBusiness.id,
        name: newBoard.name,
        description: newBoard.description,
        color: newBoard.color,
        lists: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setBoards(prev => [...prev, newBoardObj]);
      setActiveBoard(newBoardObj);
      setNewBoard({ name: '', description: '', color: 'blue' });
      setShowCreateBoard(false);
      setCreating(false);
      return;
    }
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        // Fallback to local creation
        const localBoard = createLocalBoard();
        setCreating(false);
        return;
      }

      const boardData = {
        businessId: selectedBusiness.id,
        name: newBoard.name,
        description: newBoard.description,
        color: newBoard.color
      };

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notes/boards`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(boardData)
        }
      );

      if (response.ok) {
        const result = await response.json();
        setBoards(prev => [...prev, result.board]);
        setActiveBoard(result.board);
        setNewBoard({ name: '', description: '', color: 'blue' });
        setShowCreateBoard(false);
        console.log(`Created board: ${result.board.id}`);
      } else {
        console.error('Failed to create board:', await response.text());
        // Fallback to local creation
        const localBoard = createLocalBoard();
      }
    } catch (error) {
      console.error('Error creating board:', error);
      // Fallback to local creation
      const localBoard = createLocalBoard();
    } finally {
      setCreating(false);
    }
  };

  const createLocalBoard = () => {
    const boardId = `board-${selectedBusiness?.id}-${Date.now()}`;
    const newBoardObj: Board = {
      id: boardId,
      userId: user.id,
      businessId: selectedBusiness?.id || '',
      name: newBoard.name,
      description: newBoard.description,
      color: newBoard.color,
      lists: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setBoards(prev => [...prev, newBoardObj]);
    setActiveBoard(newBoardObj);
    setNewBoard({ name: '', description: '', color: 'blue' });
    setShowCreateBoard(false);
  };

  const handleDeleteBoard = async (boardId: string) => {
    if (usingFallback) {
      // Delete locally
      setBoards(prev => prev.filter(board => board.id !== boardId));
      if (activeBoard?.id === boardId) {
        const remainingBoards = boards.filter(b => b.id !== boardId);
        setActiveBoard(remainingBoards.length > 0 ? remainingBoards[0] : null);
      }
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        // Local delete
        setBoards(prev => prev.filter(board => board.id !== boardId));
        if (activeBoard?.id === boardId) {
          setActiveBoard(boards.length > 1 ? boards.find(b => b.id !== boardId) || null : null);
        }
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notes/boards/${boardId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        setBoards(prev => prev.filter(board => board.id !== boardId));
        if (activeBoard?.id === boardId) {
          const remainingBoards = boards.filter(b => b.id !== boardId);
          setActiveBoard(remainingBoards.length > 0 ? remainingBoards[0] : null);
        }
        console.log(`Deleted board: ${boardId}`);
      } else {
        console.error('Failed to delete board:', await response.text());
      }
    } catch (error) {
      console.error('Error deleting board:', error);
    }
  };

  const handleCreateList = async () => {
    if (!newList.name.trim() || !activeBoard) return;

    setCreating(true);
    await handleCreateListAPI(activeBoard.id, newList.name, activeBoard.lists.length);
    setNewList({ name: '' });
    setShowCreateList(false);
    setCreating(false);
  };

  const handleCreateListAPI = async (boardId: string, name: string, position: number) => {
    if (usingFallback || !selectedBusiness) {
      // Local creation
      const newListObj: List = {
        id: `list-${Date.now()}`,
        boardId,
        name,
        position,
        cards: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setActiveBoard(prev => prev ? {
        ...prev,
        lists: [...prev.lists, newListObj]
      } : null);
      
      setBoards(prev => prev.map(board => 
        board.id === boardId 
          ? { ...board, lists: [...board.lists, newListObj] }
          : board
      ));
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        // Local creation fallback
        const newListObj: List = {
          id: `list-${Date.now()}`,
          boardId,
          name,
          position,
          cards: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        setActiveBoard(prev => prev ? {
          ...prev,
          lists: [...prev.lists, newListObj]
        } : null);
        
        setBoards(prev => prev.map(board => 
          board.id === boardId 
            ? { ...board, lists: [...board.lists, newListObj] }
            : board
        ));
        return;
      }

      const listData = {
        businessId: selectedBusiness.id,
        boardId,
        name,
        position
      };

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notes/lists`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(listData)
        }
      );

      if (response.ok) {
        const result = await response.json();
        
        setActiveBoard(prev => prev ? {
          ...prev,
          lists: [...prev.lists, result.list]
        } : null);
        
        setBoards(prev => prev.map(board => 
          board.id === boardId 
            ? { ...board, lists: [...board.lists, result.list] }
            : board
        ));
        
        console.log(`Created list: ${result.list.id}`);
      } else {
        console.error('Failed to create list:', await response.text());
        // Local fallback
        const newListObj: List = {
          id: `list-${Date.now()}`,
          boardId,
          name,
          position,
          cards: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        setActiveBoard(prev => prev ? {
          ...prev,
          lists: [...prev.lists, newListObj]
        } : null);
      }
    } catch (error) {
      console.error('Error creating list:', error);
      // Local fallback
      const newListObj: List = {
        id: `list-${Date.now()}`,
        boardId,
        name,
        position,
        cards: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setActiveBoard(prev => prev ? {
        ...prev,
        lists: [...prev.lists, newListObj]
      } : null);
    }
  };

  const handleDeleteList = async (listId: string) => {
    if (!activeBoard) return;

    // Optimistically update UI
    const updatedBoard = {
      ...activeBoard,
      lists: activeBoard.lists.filter(list => list.id !== listId),
      updated_at: new Date().toISOString()
    };

    setActiveBoard(updatedBoard);
    setBoards(prev => prev.map(board => 
      board.id === activeBoard.id ? updatedBoard : board
    ));

    if (!usingFallback && selectedBusiness) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const accessToken = session?.access_token;

        if (accessToken) {
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notes/lists/${listId}`,
            {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                businessId: selectedBusiness.id,
                boardId: activeBoard.id
              })
            }
          );

          if (response.ok) {
            console.log(`Deleted list: ${listId}`);
          } else {
            console.error('Failed to delete list:', await response.text());
            // Revert change on failure
            setActiveBoard(activeBoard);
            setBoards(prev => prev.map(board => 
              board.id === activeBoard.id ? activeBoard : board
            ));
          }
        }
      } catch (error) {
        console.error('Error deleting list:', error);
      }
    }
  };

  const handleCreateCard = async () => {
    if (!newCard.title.trim() || !selectedList || !activeBoard) return;

    setCreating(true);
    
    const targetList = activeBoard.lists.find(list => list.id === selectedList);
    if (!targetList) return;
    
    const newCardObj: NoteCard = {
      id: `card-${Date.now()}`,
      listId: selectedList,
      title: newCard.title,
      description: newCard.description,
      labels: Array.isArray(newCard.labels) ? newCard.labels : [],
      dueDate: newCard.dueDate || undefined,
      priority: newCard.priority,
      position: targetList.cards.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Optimistically update UI
    const updatedBoard = {
      ...activeBoard,
      lists: activeBoard.lists.map(list => 
        list.id === selectedList 
          ? { ...list, cards: [...list.cards, newCardObj] }
          : list
      ),
      updated_at: new Date().toISOString()
    };

    setActiveBoard(updatedBoard);
    setBoards(prev => prev.map(board => 
      board.id === activeBoard.id ? updatedBoard : board
    ));

    // Create on server if not using fallback
    if (!usingFallback && selectedBusiness) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const accessToken = session?.access_token;

        if (accessToken) {
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notes/cards`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                businessId: selectedBusiness.id,
                boardId: activeBoard.id,
                listId: selectedList,
                title: newCard.title,
                description: newCard.description,
                labels: newCard.labels,
                dueDate: newCard.dueDate,
                priority: newCard.priority,
                position: newCardObj.position
              })
            }
          );

          if (response.ok) {
            const result = await response.json();
            console.log(`Created card: ${result.card.id}`);
            
            // Update with server response
            const serverUpdatedBoard = {
              ...activeBoard,
              lists: activeBoard.lists.map(list => 
                list.id === selectedList 
                  ? { 
                      ...list, 
                      cards: list.cards.map(card => 
                        card.id === newCardObj.id ? result.card : card
                      )
                    }
                  : list
              )
            };
            setActiveBoard(serverUpdatedBoard);
          } else {
            console.error('Failed to create card:', await response.text());
          }
        }
      } catch (error) {
        console.error('Error creating card:', error);
      }
    }
    
    setNewCard({ title: '', description: '', labels: [], dueDate: '', priority: 'medium' });
    setSelectedList('');
    setShowCreateCard(false);
    setCreating(false);
  };

  const handleDeleteCard = async (cardId: string, listId: string) => {
    if (!activeBoard) return;

    // ✅ FIX: Check if deletion is already in progress
    if (pendingDeletionsRef.current.has(cardId)) {
      console.log(`⚠️ Card ${cardId} is already being deleted, skipping duplicate request`);
      return;
    }

    // Mark this card as pending deletion
    pendingDeletionsRef.current.add(cardId);
    console.log(`🗑️ Starting deletion of card: ${cardId}`);

    // Store original board state for error recovery
    const originalBoard = activeBoard;

    // Optimistically update UI
    const updatedBoard = {
      ...activeBoard,
      lists: activeBoard.lists.map(list => ({
        ...list,
        cards: list.cards.filter(card => card.id !== cardId)
      })),
      updated_at: new Date().toISOString()
    };

    setActiveBoard(updatedBoard);
    setBoards(prev => prev.map(board => 
      board.id === activeBoard.id ? updatedBoard : board
    ));

    // Delete on server if not using fallback
    if (!usingFallback && selectedBusiness) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const accessToken = session?.access_token;

        if (accessToken) {
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notes/cards/${cardId}`,
            {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                businessId: selectedBusiness.id,
                boardId: activeBoard.id,
                listId: listId
              })
            }
          );

          if (response.ok) {
            console.log(`✅ Successfully deleted card: ${cardId}`);
            // Keep the card in pending deletions for a short time to prevent race conditions
            setTimeout(() => {
              pendingDeletionsRef.current.delete(cardId);
              console.log(`🧹 Cleared pending deletion for card: ${cardId}`);
            }, 1000);
          } else {
            console.error('❌ Failed to delete card:', await response.text());
            // ✅ FIX: Restore the card if server deletion failed
            pendingDeletionsRef.current.delete(cardId);
            setActiveBoard(originalBoard);
            setBoards(prev => prev.map(board => 
              board.id === originalBoard.id ? originalBoard : board
            ));
          }
        }
      } catch (error) {
        console.error('❌ Error deleting card:', error);
        // ✅ FIX: Restore the card if there was an error
        pendingDeletionsRef.current.delete(cardId);
        setActiveBoard(originalBoard);
        setBoards(prev => prev.map(board => 
          board.id === originalBoard.id ? originalBoard : board
        ));
      }
    } else {
      // In fallback mode, immediately remove from pending
      setTimeout(() => {
        pendingDeletionsRef.current.delete(cardId);
      }, 500);
    }
  };

  const handleSignOut = async () => {
    console.log('🔧 BusinessNotesPage: Sign out initiated');
    
    // Clear ALL storage
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.error('Storage clear error (non-blocking):', e);
    }
    
    // Sign out from Supabase
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('🔧 BusinessNotesPage: Supabase sign out error (non-blocking):', error);
    }
    
    // Small delay for UX
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Hard reload to root
    window.location.href = '/';
  };

  const handleMenuClick = (itemPath: string) => {
    navigate(itemPath);
    setSidebarOpen(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const filteredCards = (cards: NoteCard[]) => {
    if (!searchTerm) return cards;
    return cards.filter(card =>
      card.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const handleBoardSwitch = (boardId: string) => {
    const board = boards.find(b => b.id === boardId);
    if (board) {
      setActiveBoard(board);
      if (!usingFallback) {
        loadBoardDetails(boardId);
      }
    }
  };

  const handleStartEditingBoardName = () => {
    if (activeBoard) {
      setEditedBoardName(activeBoard.name);
      setEditingBoardName(true);
      // Focus input after render
      setTimeout(() => {
        boardNameInputRef.current?.focus();
        boardNameInputRef.current?.select();
      }, 0);
    }
  };

  const handleCancelEditingBoardName = () => {
    setEditingBoardName(false);
    setEditedBoardName('');
  };

  const handleSaveBoardName = async () => {
    if (!activeBoard || !selectedBusiness || !editedBoardName.trim()) {
      setEditingBoardName(false);
      return;
    }

    const trimmedName = editedBoardName.trim();
    
    // Optimistically update the UI - preserve all existing data including lists and cards
    const updatedBoard = {
      ...activeBoard,
      name: trimmedName,
      updated_at: new Date().toISOString()
    };

    // Update active board (preserving lists and cards)
    setActiveBoard(updatedBoard);
    
    // Update in boards list (preserving all data)
    setBoards(prev => prev.map(board => 
      board.id === activeBoard.id ? updatedBoard : board
    ));

    setEditingBoardName(false);
    setEditedBoardName('');

    // Update on server if not using fallback
    if (!usingFallback) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const accessToken = session?.access_token;

        if (accessToken) {
          console.log('📝 Updating board name on server:', { boardId: activeBoard.id, name: trimmedName });
          
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notes/boards/${activeBoard.id}`,
            {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                businessId: selectedBusiness.id,
                name: trimmedName,
                description: activeBoard.description,
                color: activeBoard.color
              })
            }
          );

          if (response.ok) {
            console.log('✅ Board name updated successfully');
            const result = await response.json();
            
            // Reload board details to ensure we have the latest data with lists
            // This prevents the lists from disappearing after rename
            await loadBoardDetails(activeBoard.id);
          } else {
            console.error('❌ Failed to update board name:', await response.text());
            // Revert on failure - use the original activeBoard which has lists
            setActiveBoard(activeBoard);
            setBoards(prev => prev.map(board => 
              board.id === activeBoard.id ? activeBoard : board
            ));
          }
        }
      } catch (error) {
        console.error('❌ Error updating board name:', error);
        // Revert on error
        setActiveBoard(activeBoard);
        setBoards(prev => prev.map(board => 
          board.id === activeBoard.id ? activeBoard : board
        ));
      }
    }
  };

  const handleCardClick = (card: NoteCard) => {
    setSelectedCard(card);
  };

  if (!selectedBusiness) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center">
        <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-lg border-gray-200/50 dark:border-gray-700/50 shadow-lg">
          <CardContent className="p-8 text-center">
            <StickyNote className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
              No Business Selected
            </h3>
            <p className="text-gray-500 dark:text-gray-500 mb-4">
              Please select a business to view its notes and boards.
            </p>
            <Button onClick={onBack} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 transition-all duration-300">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-700/50 shadow-lg transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center space-x-2 p-6 border-b border-gray-200/30 dark:border-gray-700/30">
            <Logo size="md" showText={true} />
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-6">
            <div className="space-y-2">
              {menuItems.map((item) => (
                <div key={item.id}>
                  <button
                    onClick={() => handleMenuClick(item.path)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 border ${
                      item.id === 'notes'
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-blue-500/50 shadow-lg'
                        : 'hover:bg-white/40 dark:hover:bg-gray-700/40 border-transparent hover:border-white/50 dark:hover:border-gray-600/50 hover:shadow-md'
                    }`}
                  >
                    {item.icon}
                    <span className="font-medium">{item.label}</span>
                  </button>
                </div>
              ))}
            </div>
          </nav>

          {/* Support Button */}
          <div className="p-4 border-t border-gray-200/30 dark:border-gray-700/30">
            <SupportButton />
          </div>

          {/* User Profile */}
          <div className="p-6 border-t border-gray-200/30 dark:border-gray-700/30">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                <span className="text-white font-semibold">
                  {user?.user_metadata?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-800 dark:text-gray-200">
                  {user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {user?.email}
                </p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-white/30 dark:hover:bg-gray-700/30 rounded-lg transition-colors border border-transparent hover:border-white/50 dark:hover:border-gray-600/50"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Header */}
        <header className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-white/30 dark:hover:bg-gray-700/30 transition-colors border border-transparent hover:border-white/50 dark:hover:border-gray-600/50"
              >
                <Menu className="w-6 h-6" />
              </button>
              
              <button
                onClick={onBack}
                className="p-2 rounded-lg hover:bg-white/30 dark:hover:bg-gray-700/30 transition-colors border border-transparent hover:border-white/50 dark:hover:border-gray-600/50"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-white shadow-md">
                  <StickyNote className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>
                    {selectedBusiness.name} Notes
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Business-specific notes and tasks {usingFallback && <span className="text-orange-500">(Local Mode)</span>}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Search cards..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64 bg-white/30 dark:bg-gray-800/30 backdrop-blur-lg border-gray-200/50 dark:border-gray-700/50 shadow-sm focus:border-blue-500/50 focus:shadow-md transition-all"
                />
              </div>
              
              <MotivationButton variant="minimal" />
              <BusinessSwitcher />
              
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-white/30 dark:bg-gray-800/30 backdrop-blur-lg border border-gray-200/50 dark:border-gray-700/50 hover:bg-white/40 dark:hover:bg-gray-700/40 hover:border-gray-300/50 dark:hover:border-gray-600/50 transition-all duration-300 shadow-sm hover:shadow-md"
              >
                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>
              
              <button className="p-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg transition-all duration-300 shadow-md border border-blue-500/30">
                <HelpCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6 pt-16">
          {/* Connection Status */}
          {usingFallback && (
            <div className="mb-4 p-3 bg-orange-100 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
              <p className="text-sm text-orange-800 dark:text-orange-200">
                <AlertCircle className="w-4 h-4 inline mr-2" />
                Running in local mode. Your changes will not be saved to the database.
              </p>
            </div>
          )}

          {/* Board Selection and Create Board */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Select
                value={activeBoard?.id || ''}
                onValueChange={handleBoardSwitch}
              >
                <SelectTrigger className="w-64 bg-white/30 dark:bg-gray-800/30 backdrop-blur-lg border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all focus:border-blue-500/50">
                  <SelectValue placeholder="Select a board" />
                </SelectTrigger>
                <SelectContent 
                  className="backdrop-blur-xl shadow-lg"
                  style={{
                    backgroundColor: 'var(--card)',
                    borderColor: 'var(--border)'
                  }}
                >
                  {boards.map((board) => (
                    <SelectItem 
                      key={board.id} 
                      value={board.id}
                    >
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${boardColors.find(c => c.value === board.color)?.class || 'bg-blue-500'} shadow-sm`} />
                        <span>{board.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {activeBoard && (
                <Badge variant="outline" className="bg-white/20 dark:bg-gray-700/30 border-gray-200/50 dark:border-gray-600/50 shadow-sm">
                  {activeBoard.lists.length} lists • {activeBoard.lists.reduce((acc, list) => acc + list.cards.length, 0)} cards
                </Badge>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Dialog open={showCreateBoard} onOpenChange={setShowCreateBoard}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-all border border-blue-500/30">
                    <Plus className="w-4 h-4 mr-2" />
                    New Board
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50 shadow-xl">
                  <DialogHeader>
                    <DialogTitle>Create New Board</DialogTitle>
                    <DialogDescription>
                      Create a new board to organize your notes and tasks for {selectedBusiness.name}.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Board Name</Label>
                      <Input
                        value={newBoard.name}
                        onChange={(e) => setNewBoard({ ...newBoard, name: e.target.value })}
                        placeholder="Enter board name"
                        className="bg-white/50 dark:bg-gray-800/50"
                      />
                    </div>
                    <div>
                      <Label>Description (Optional)</Label>
                      <Textarea
                        value={newBoard.description}
                        onChange={(e) => setNewBoard({ ...newBoard, description: e.target.value })}
                        placeholder="Enter board description"
                        className="bg-white/50 dark:bg-gray-800/50"
                      />
                    </div>
                    <div>
                      <Label>Color</Label>
                      <div className="flex gap-2 mt-2">
                        {boardColors.map((color) => (
                          <button
                            key={color.value}
                            onClick={() => setNewBoard({ ...newBoard, color: color.value })}
                            className={`w-8 h-8 rounded-full ${color.class} border-2 ${
                              newBoard.color === color.value ? 'border-gray-800 dark:border-white' : 'border-transparent'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setShowCreateBoard(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateBoard} disabled={creating || !newBoard.name.trim()}>
                        {creating ? 'Creating...' : 'Create Board'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Board Content */}
          {activeBoard ? (
            <div className="space-y-6">
              {/* Board Header */}
              <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-lg border-gray-200/50 dark:border-gray-700/50 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full ${boardColors.find(c => c.value === activeBoard.color)?.class || 'bg-blue-500'} shadow-sm`} />
                      <div className="flex-1">
                        {editingBoardName ? (
                          <div className="flex items-center gap-2">
                            <Input
                              ref={boardNameInputRef}
                              value={editedBoardName}
                              onChange={(e) => setEditedBoardName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleSaveBoardName();
                                } else if (e.key === 'Escape') {
                                  handleCancelEditingBoardName();
                                }
                              }}
                              onBlur={handleSaveBoardName}
                              className="h-8 bg-white/50 dark:bg-gray-800/50"
                              style={{ 
                                borderColor: 'var(--border)',
                                color: 'var(--foreground)'
                              }}
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleSaveBoardName}
                              className="h-8 w-8 p-0"
                            >
                              <Check className="h-4 w-4" style={{ color: 'var(--success)' }} />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleCancelEditingBoardName}
                              className="h-8 w-8 p-0"
                            >
                              <X className="h-4 w-4" style={{ color: 'var(--destructive)' }} />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 group">
                            <CardTitle 
                              className="text-lg cursor-pointer" 
                              style={{ 
                                color: 'var(--primary)',
                                fontWeight: 'var(--font-weight-semibold)'
                              }}
                              onClick={handleStartEditingBoardName}
                            >
                              {activeBoard.name}
                            </CardTitle>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleStartEditingBoardName}
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Edit3 className="h-3 w-3" style={{ color: 'var(--muted-foreground)' }} />
                            </Button>
                          </div>
                        )}
                        {activeBoard.description && (
                          <p 
                            className="text-sm mt-1" 
                            style={{ 
                              color: 'var(--muted-foreground)',
                              fontWeight: 'var(--font-weight-normal)'
                            }}
                          >
                            {activeBoard.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <Dialog open={showCreateList} onOpenChange={setShowCreateList}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 shadow-md">
                          <Plus className="w-4 h-4 mr-2" />
                          Add List
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50 shadow-xl">
                        <DialogHeader>
                          <DialogTitle>Create New List</DialogTitle>
                          <DialogDescription>
                            Add a new list to organize your cards.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>List Name</Label>
                            <Input
                              value={newList.name}
                              onChange={(e) => setNewList({ ...newList, name: e.target.value })}
                              placeholder="Enter list name"
                              className="bg-white/50 dark:bg-gray-800/50"
                            />
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => setShowCreateList(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleCreateList} disabled={creating || !newList.name.trim()}>
                              {creating ? 'Creating...' : 'Create List'}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
              </Card>

              {/* Lists */}
              <div className="flex gap-6 overflow-x-auto pb-4">
                {[...activeBoard.lists]
                  .sort((a, b) => a.position - b.position)
                  .map((list, index) => (
                    <DraggableListWrapper
                      key={list.id}
                      list={list}
                      index={index}
                      filteredCards={filteredCards(list.cards)}
                      onCardClick={handleCardClick}
                      onDeleteCard={handleDeleteCard}
                      onDeleteList={handleDeleteList}
                      onCreateCard={(listId) => {
                        setSelectedList(listId);
                        setShowCreateCard(true);
                      }}
                      onMoveCard={handleMoveCard}
                      onMoveList={handleMoveList}
                    />
                  ))}
              </div>
            </div>
          ) : (
            <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-lg border-gray-200/50 dark:border-gray-700/50 shadow-lg">
              <CardContent className="p-12 text-center">
                <StickyNote className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  No Board Selected
                </h3>
                <p className="text-gray-500 dark:text-gray-500">
                  Select a board or create a new one to get started.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Create Card Dialog */}
          <Dialog open={showCreateCard} onOpenChange={setShowCreateCard}>
            <DialogContent className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50 shadow-xl">
              <DialogHeader>
                <DialogTitle>Create New Card</DialogTitle>
                <DialogDescription>
                  Add a new card to your list.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Card Title</Label>
                  <Input
                    value={newCard.title}
                    onChange={(e) => setNewCard({ ...newCard, title: e.target.value })}
                    placeholder="Enter card title"
                    className="bg-white/50 dark:bg-gray-800/50"
                  />
                </div>
                <div>
                  <Label>Description (Optional)</Label>
                  <Textarea
                    value={newCard.description}
                    onChange={(e) => setNewCard({ ...newCard, description: e.target.value })}
                    placeholder="Enter card description"
                    className="bg-white/50 dark:bg-gray-800/50"
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select
                    value={newCard.priority}
                    onValueChange={(value: 'low' | 'medium' | 'high') => setNewCard({ ...newCard, priority: value })}
                  >
                    <SelectTrigger className="bg-white/50 dark:bg-gray-800/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Due Date (Optional)</Label>
                  <Input
                    type="date"
                    value={newCard.dueDate}
                    onChange={(e) => setNewCard({ ...newCard, dueDate: e.target.value })}
                    className="bg-white/50 dark:bg-gray-800/50"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowCreateCard(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateCard} disabled={creating || !newCard.title.trim()}>
                    {creating ? 'Creating...' : 'Create Card'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Card Detail Dialog */}
          <Dialog open={!!selectedCard} onOpenChange={() => setSelectedCard(null)}>
            <DialogContent className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50 shadow-xl max-w-2xl">
              {selectedCard && (
                <>
                  <DialogHeader>
                    <DialogTitle>{selectedCard.title}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {selectedCard.description && (
                      <div>
                        <Label>Description</Label>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {selectedCard.description}
                        </p>
                      </div>
                    )}
                    <div className="flex items-center space-x-4">
                      <div>
                        <Label>Priority</Label>
                        <Badge className={priorityColors[selectedCard.priority]} variant="secondary">
                          {selectedCard.priority}
                        </Badge>
                      </div>
                      {selectedCard.dueDate && (
                        <div>
                          <Label>Due Date</Label>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {formatDate(selectedCard.dueDate)}
                          </p>
                        </div>
                      )}
                    </div>
                    <div>
                      <Label>Created</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {formatDate(selectedCard.created_at)}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}

export default BusinessNotesPage;