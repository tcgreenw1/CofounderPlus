import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useBusiness } from './BusinessContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { supabase } from '../utils/supabase/client';
import NotesPageEnhanced from './NotesPageEnhanced';

// Types to match the API structure
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

interface Board {
  id: string;
  name: string;
  description?: string;
  color: string;
  lists: TaskList[];
  cards: TaskCard[];
}

interface NotesPageEnhancedWrapperProps {
  user: any;
}

const NotesPageEnhancedWrapper: React.FC<NotesPageEnhancedWrapperProps> = ({ user }) => {
  const { selectedBusiness } = useBusiness();
  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);

  // Get current lists and cards from selected board
  const currentLists = selectedBoard?.lists || [];
  const currentCards = selectedBoard?.cards || [];

  console.log('📝 Wrapper: Current state:', {
    selectedBoard: selectedBoard?.id,
    listsCount: currentLists.length,
    cardsCount: currentCards.length
  });

  // Load boards on mount and when business changes
  useEffect(() => {
    if (selectedBusiness?.id && user?.id) {
      loadBoards();
    }
  }, [selectedBusiness?.id, user?.id]);

  const loadBoards = async () => {
    if (!selectedBusiness?.id || !user?.id) return;

    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const authHeader = session?.access_token ? `Bearer ${session.access_token}` : `Bearer ${publicAnonKey}`;

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notes/boards?businessId=${selectedBusiness.id}`, {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      console.log('📝 Wrapper: Received boards response:', result);
      
      if (response.ok && result.success) {
        // Ensure each board has proper structure with flat cards array
        const processedBoards = result.boards.map((board: any) => {
          const flattenedCards: TaskCard[] = [];
          
          // If board has lists with cards, flatten them
          if (board.lists && Array.isArray(board.lists)) {
            board.lists.forEach((list: any) => {
              if (list.cards && Array.isArray(list.cards)) {
                list.cards.forEach((card: any) => {
                  flattenedCards.push({
                    ...card,
                    listId: list.id
                  });
                });
              }
            });
          }
          
          return {
            ...board,
            lists: board.lists || [],
            cards: flattenedCards
          };
        });
        
        setBoards(processedBoards);
        
        // If no board is selected and we have boards, select the first one
        if (!selectedBoard && processedBoards.length > 0) {
          setSelectedBoard(processedBoards[0]);
        }
      } else {
        console.error('Failed to load boards:', result.error);
        toast.error('Failed to load notes boards');
      }
    } catch (error) {
      console.error('Error loading boards:', error);
      toast.error('Error loading notes boards');
    } finally {
      setLoading(false);
    }
  };

  const updateCard = async (card: TaskCard): Promise<void> => {
    if (!selectedBusiness?.id || !user?.id || !selectedBoard) return;

    // Optimistic update - update UI immediately
    const previousBoard = selectedBoard;
    const previousBoards = boards;

    const updatedBoard = {
      ...selectedBoard,
      cards: selectedBoard.cards.map(c => c.id === card.id ? card : c)
    };
    setSelectedBoard(updatedBoard);
    setBoards(prevBoards => prevBoards.map(b => b.id === selectedBoard.id ? updatedBoard : b));

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const authHeader = session?.access_token ? `Bearer ${session.access_token}` : `Bearer ${publicAnonKey}`;

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notes/cards/${card.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...card,
          businessId: selectedBusiness.id,
          boardId: selectedBoard.id
        })
      });

      const result = await response.json();
      
      if (!response.ok || !result.success) {
        // Revert optimistic update on failure
        console.error('Failed to update card:', result.error);
        setSelectedBoard(previousBoard);
        setBoards(previousBoards);
        toast.error('Failed to update task');
      }
    } catch (error) {
      // Revert optimistic update on error
      console.error('Error updating card:', error);
      setSelectedBoard(previousBoard);
      setBoards(previousBoards);
      toast.error('Error updating task');
    }
  };

  const updateList = async (list: TaskList): Promise<void> => {
    if (!selectedBusiness?.id || !user?.id || !selectedBoard) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const authHeader = session?.access_token ? `Bearer ${session.access_token}` : `Bearer ${publicAnonKey}`;

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notes/lists/${list.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...list,
          businessId: selectedBusiness.id,
          boardId: selectedBoard.id
        })
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        // Update the list in the current board
        const updatedBoard = {
          ...selectedBoard,
          lists: selectedBoard.lists.map(l => l.id === list.id ? { ...l, ...list } : l)
        };
        setSelectedBoard(updatedBoard);
        setBoards(boards.map(b => b.id === selectedBoard.id ? updatedBoard : b));
        toast.success('List updated');
      } else {
        console.error('Failed to update list:', result.error);
        toast.error('Failed to update list');
      }
    } catch (error) {
      console.error('Error updating list:', error);
      toast.error('Error updating list');
    }
  };

  const deleteCard = async (cardId: string): Promise<void> => {
    if (!selectedBusiness?.id || !user?.id || !selectedBoard) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const authHeader = session?.access_token ? `Bearer ${session.access_token}` : `Bearer ${publicAnonKey}`;

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notes/cards/${cardId}?businessId=${selectedBusiness.id}&boardId=${selectedBoard.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        // Remove the card from the current board
        const updatedBoard = {
          ...selectedBoard,
          cards: selectedBoard.cards.filter(c => c.id !== cardId)
        };
        setSelectedBoard(updatedBoard);
        setBoards(boards.map(b => b.id === selectedBoard.id ? updatedBoard : b));
        toast.success('Task deleted');
      } else {
        console.error('Failed to delete card:', result.error);
        toast.error('Failed to delete task');
      }
    } catch (error) {
      console.error('Error deleting card:', error);
      toast.error('Error deleting task');
    }
  };

  const deleteList = async (listId: string): Promise<void> => {
    if (!selectedBusiness?.id || !user?.id || !selectedBoard) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const authHeader = session?.access_token ? `Bearer ${session.access_token}` : `Bearer ${publicAnonKey}`;

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notes/lists/${listId}?businessId=${selectedBusiness.id}&boardId=${selectedBoard.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        // Remove the list and its cards from the current board
        const updatedBoard = {
          ...selectedBoard,
          lists: selectedBoard.lists.filter(l => l.id !== listId),
          cards: selectedBoard.cards.filter(c => c.listId !== listId)
        };
        setSelectedBoard(updatedBoard);
        setBoards(boards.map(b => b.id === selectedBoard.id ? updatedBoard : b));
        toast.success('List deleted');
      } else {
        console.error('Failed to delete list:', result.error);
        toast.error('Failed to delete list');
      }
    } catch (error) {
      console.error('Error deleting list:', error);
      toast.error('Error deleting list');
    }
  };

  const createCard = async (listId: string, title: string, description?: string): Promise<void> => {
    if (!selectedBusiness?.id || !user?.id || !selectedBoard) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const authHeader = session?.access_token ? `Bearer ${session.access_token}` : `Bearer ${publicAnonKey}`;

      const newCard = {
        title,
        description: description || '',
        listId,
        position: selectedBoard.cards.filter(c => c.listId === listId).length
      };

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notes/cards`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newCard,
          businessId: selectedBusiness.id,
          boardId: selectedBoard.id
        })
      });

      const result = await response.json();
      
      if (response.ok && result.success && result.card) {
        // Add the new card to the current board
        const updatedBoard = {
          ...selectedBoard,
          cards: [...selectedBoard.cards, result.card]
        };
        setSelectedBoard(updatedBoard);
        setBoards(boards.map(b => b.id === selectedBoard.id ? updatedBoard : b));
        toast.success('Task created');
      } else {
        console.error('Failed to create card:', result.error);
        toast.error('Failed to create task');
      }
    } catch (error) {
      console.error('Error creating card:', error);
      toast.error('Error creating task');
    }
  };

  const createList = async (title: string): Promise<void> => {
    if (!selectedBusiness?.id || !user?.id || !selectedBoard) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const authHeader = session?.access_token ? `Bearer ${session.access_token}` : `Bearer ${publicAnonKey}`;

      const newList = {
        title,
        position: selectedBoard.lists.length
      };

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notes/lists`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...newList, boardId: selectedBoard.id })
      });

      const result = await response.json();
      
      if (response.ok && result.success && result.list) {
        // Add the new list to the current board
        const updatedBoard = {
          ...selectedBoard,
          lists: [...selectedBoard.lists, result.list]
        };
        setSelectedBoard(updatedBoard);
        setBoards(boards.map(b => b.id === selectedBoard.id ? updatedBoard : b));
        toast.success('List created');
      } else {
        console.error('Failed to create list:', result.error);
        toast.error('Failed to create list');
      }
    } catch (error) {
      console.error('Error creating list:', error);
      toast.error('Error creating list');
    }
  };

  const moveCard = async (cardId: string, newListId: string, newPosition: number): Promise<void> => {
    if (!selectedBusiness?.id || !user?.id || !selectedBoard) return;

    const card = selectedBoard.cards.find(c => c.id === cardId);
    if (!card) return;

    const updatedCard = {
      ...card,
      listId: newListId,
      position: newPosition
    };

    await updateCard(updatedCard);
  };

  const createDefaultBoard = async () => {
    if (!selectedBusiness?.id || !user?.id) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const authHeader = session?.access_token ? `Bearer ${session.access_token}` : `Bearer ${publicAnonKey}`;

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notes/boards`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          businessId: selectedBusiness.id,
          name: 'My Notes',
          description: 'Default notes board',
          color: 'blue'
        })
      });

      const result = await response.json();
      
      if (response.ok && result.success && result.board) {
        const processedBoard = {
          ...result.board,
          lists: result.board.lists || [],
          cards: []
        };
        setBoards([processedBoard]);
        setSelectedBoard(processedBoard);
        toast.success('Created your first notes board!');
      } else {
        console.error('Failed to create default board:', result.error);
      }
    } catch (error) {
      console.error('Error creating default board:', error);
    }
  };

  // Create default board if none exist
  useEffect(() => {
    if (!loading && boards.length === 0 && selectedBusiness?.id && user?.id) {
      createDefaultBoard();
    }
  }, [loading, boards.length, selectedBusiness?.id, user?.id]);

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading notes...</div>;
  }

  if (!selectedBoard) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg mb-2">No notes board found</h3>
          <p className="text-muted-foreground">Create your first board to start organizing your notes.</p>
        </div>
      </div>
    );
  }

  return (
    <NotesPageEnhanced
      lists={currentLists}
      cards={currentCards}
      onUpdateCard={updateCard}
      onUpdateList={updateList}
      onDeleteCard={deleteCard}
      onDeleteList={deleteList}
      onCreateCard={createCard}
      onCreateList={createList}
      onMoveCard={moveCard}
    />
  );
};

export default NotesPageEnhancedWrapper;