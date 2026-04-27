import React, { useState, useEffect } from 'react';
import { Undo2 } from 'lucide-react';
import { Button } from './ui/button';
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';
import { useBusiness } from './BusinessContext';

interface NotesUndoButtonProps {
  user: any;
  boardId: string;
  onUndoComplete?: () => void;
}

export const NotesUndoButton: React.FC<NotesUndoButtonProps> = ({ 
  user, 
  boardId, 
  onUndoComplete 
}) => {
  const { selectedBusiness } = useBusiness();
  const [hasUndo, setHasUndo] = useState(false);
  const [isUndoing, setIsUndoing] = useState(false);

  // Check if there's an undo available
  useEffect(() => {
    const checkUndo = async () => {
      if (!selectedBusiness || !boardId) return;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        const accessToken = session?.access_token;

        if (!accessToken) return;

        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notes/boards/${boardId}/can-undo?businessId=${selectedBusiness.id}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            }
          }
        );

        if (response.ok) {
          const result = await response.json();
          setHasUndo(result.canUndo || false);
        }
      } catch (error) {
        console.error('Error checking undo availability:', error);
      }
    };

    checkUndo();
  }, [selectedBusiness, boardId]);

  const handleUndo = async () => {
    if (!selectedBusiness || !boardId || isUndoing) return;

    setIsUndoing(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        toast.error('Please sign in to undo changes');
        setIsUndoing(false);
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notes/boards/${boardId}/undo`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            businessId: selectedBusiness.id
          })
        }
      );

      if (response.ok) {
        toast.success('Changes undone successfully');
        setHasUndo(false);
        if (onUndoComplete) {
          onUndoComplete();
        }
      } else {
        const errorText = await response.text();
        console.error('Failed to undo:', errorText);
        toast.error('Failed to undo changes');
      }
    } catch (error) {
      console.error('Error undoing changes:', error);
      toast.error('Failed to undo changes');
    } finally {
      setIsUndoing(false);
    }
  };

  if (!hasUndo) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleUndo}
      disabled={isUndoing}
      className="text-xs sm:text-sm h-7 sm:h-9"
    >
      <Undo2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
      <span className="hidden sm:inline">Undo</span>
    </Button>
  );
};
