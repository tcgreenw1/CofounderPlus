import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Star, Eye, StickyNote } from 'lucide-react';
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';

interface StarredCard {
  id: string;
  title: string;
  boardId: string;
  boardName: string;
  listId: string;
  listName: string;
}

interface ImportantNotesWidgetProps {
  businessId: string;
}

export const ImportantNotesWidget: React.FC<ImportantNotesWidgetProps> = ({ businessId }) => {
  const navigate = useNavigate();
  const [starredNotes, setStarredNotes] = useState<StarredCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStarredNotes();
  }, [businessId]);

  const loadStarredNotes = async () => {
    if (!businessId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.log('📝 No active session - skipping starred notes load');
        setStarredNotes([]);
        setLoading(false);
        return;
      }

      // Fetch all boards for this business
      const boardsResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notes/boards?businessId=${businessId}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      );

      if (!boardsResponse.ok) {
        console.error('📝 Failed to fetch boards:', boardsResponse.status, boardsResponse.statusText);
        setStarredNotes([]);
        setLoading(false);
        return;
      }

      const boardsData = await boardsResponse.json();
      const boards = boardsData.boards || [];

      // If no boards exist, just show empty state
      if (boards.length === 0) {
        console.log('📝 No boards found for business');
        setStarredNotes([]);
        setLoading(false);
        return;
      }

      // Collect all starred cards across all boards
      const allStarredCards: StarredCard[] = [];

      for (const board of boards) {
        // Fetch board details to get lists and cards
        const boardDetailsResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notes/boards/${board.id}/details?businessId=${businessId}`,
          {
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          }
        );

        if (boardDetailsResponse.ok) {
          const boardDetails = await boardDetailsResponse.json();
          const boardData = boardDetails.board;

          // Iterate through lists and find starred cards
          if (boardData.lists) {
            for (const list of boardData.lists) {
              if (list.cards) {
                for (const card of list.cards) {
                  if (card.starCompleted) {
                    allStarredCards.push({
                      id: card.id,
                      title: card.title,
                      boardId: board.id,
                      boardName: boardData.name || board.name,
                      listId: list.id,
                      listName: list.name
                    });
                  }
                }
              }
            }
          }
        }
      }

      setStarredNotes(allStarredCards);
    } catch (error: any) {
      // Network errors are common when offline or during development
      // Only log if it's not a basic network failure
      if (error?.message && !error.message.includes('Failed to fetch') && !error.message.includes('NetworkError')) {
        console.error('Error loading starred notes:', error);
      }
      // Silently fail - just show empty state
      setStarredNotes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateToNotes = () => {
    navigate('/notes');
  };

  const handleViewNote = (boardId: string, listId: string, cardId: string) => {
    // Navigate to notes page with query params to open specific board/list/card
    navigate(`/notes?board=${boardId}&list=${listId}&card=${cardId}`);
  };

  if (loading) {
    return (
      <Card className="glass-card border-green-400/30 dark:border-green-500/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (starredNotes.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="glass-card border-green-400/30 dark:border-green-500/30">
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                <Star className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2 justify-center">
                  <Star className="w-5 h-5 text-green-600" />
                  Important Notes
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  No starred notes yet. Star important note cards to see them here!
                </p>
                <Button 
                  onClick={handleNavigateToNotes} 
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                >
                  <StickyNote className="w-4 h-4 mr-2" />
                  Go to Notes
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="glass-card border-green-400/30 dark:border-green-500/30 overflow-hidden">
        <CardContent className="p-0">
          {/* Top Bar */}
          <div className="bg-green-600 dark:bg-green-700 p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5" />
                <span className="font-semibold">Important Notes</span>
              </div>
              <Badge variant="secondary" className="bg-white/20 text-white border-0">
                {starredNotes.length} {starredNotes.length === 1 ? 'note' : 'notes'}
              </Badge>
            </div>
          </div>

          {/* Starred Notes List */}
          <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
            {starredNotes.map((note) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="glass-panel border-yellow-400/30 dark:border-yellow-500/30">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Star className="w-4 h-4 text-yellow-600 dark:text-yellow-400 fill-yellow-600 dark:fill-yellow-400 flex-shrink-0" />
                          <h4 className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                            {note.title}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                          <span className="truncate">{note.boardName}</span>
                          <span>•</span>
                          <span className="truncate">{note.listName}</span>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleViewNote(note.boardId, note.listId, note.id)}
                        size="sm"
                        variant="ghost"
                        className="flex-shrink-0 h-8 w-8 p-0 hover:bg-yellow-200 dark:hover:bg-yellow-800"
                        title="View note"
                      >
                        <Eye className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-4 pt-2 border-t border-green-200 dark:border-green-800">
            <Button 
              onClick={handleNavigateToNotes}
              variant="ghost"
              className="w-full text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            >
              View All Notes →
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};