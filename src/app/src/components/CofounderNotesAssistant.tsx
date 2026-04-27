import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';
import { Loader2, Sparkles, MessageSquare, ArrowRight, CheckCircle2 } from 'lucide-react';

// Import centralized Cofounder chat system
import { 
  sendCofounderMessage, 
  getChatSessions,
  buildBusinessContext 
} from '../utils/cofounderChat';

interface CofounderNotesAssistantProps {
  user: any;
  businessContext: any;
  currentBoards: any[];
  onCreateBoard: (board: { name: string; description: string; color: string }) => Promise<string>;
  onCreateList: (boardId: string, list: { name: string; position: number }) => Promise<string>;
  onCreateCard: (listId: string, card: { title: string; description: string; labels: string[]; priority: string; position: number }) => Promise<void>;
  onDeleteBoard: (boardId: string) => Promise<void>;
  onEditBoard: (boardId: string, updates: { name?: string; description?: string; color?: string }) => Promise<void>;
  onDeleteList: (listId: string) => Promise<void>;
  onEditList: (listId: string, updates: string | { name?: string; color?: string; position?: number; gridRow?: number; gridColumn?: number }) => Promise<void>;
  onMoveList: (listId: string, toBoardId: string, position: number) => Promise<void>;
  onDeleteCard: (cardId: string) => Promise<void>;
  onEditCard: (cardId: string, updates: { title?: string; description?: string; priority?: string }) => Promise<void>;
  onMoveCard: (cardId: string, toListId: string, position: number) => Promise<void>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Question {
  id: string;
  question: string;
  placeholder?: string;
}

export const CofounderNotesAssistant: React.FC<CofounderNotesAssistantProps> = ({
  user,
  businessContext,
  currentBoards,
  onCreateBoard,
  onCreateList,
  onCreateCard,
  onDeleteBoard,
  onEditBoard,
  onDeleteList,
  onEditList,
  onMoveList,
  onDeleteCard,
  onEditCard,
  onMoveCard,
  open,
  onOpenChange
}) => {
  const [step, setStep] = useState<'loading' | 'questions' | 'generating' | 'complete' | 'no-changes'>('loading');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [cofounderMessage, setCofounderMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [changesPlanned, setChangesPlanned] = useState<any>(null);

  useEffect(() => {
    if (open) {
      initializeCofounderAssistant();
    } else {
      // Reset state when closed
      setStep('loading');
      setQuestions([]);
      setAnswers({});
      setCofounderMessage('');
      setError(null);
      setChangesPlanned(null);
    }
  }, [open]);

  const initializeCofounderAssistant = async () => {
    try {
      setStep('loading');
      setError(null);

      console.log('🤖 Cofounder Notes: Loading chat history...');

      // Get user's chat sessions using centralized utility
      const sessionsResult = await getChatSessions(user.id);
      const sessions = sessionsResult.sessions || [];

      console.log(`🤖 Cofounder Notes: Found ${sessions.length} chat sessions`);

      // Build a summary of chat history for context
      let historyContext = '';
      if (sessions.length > 0) {
        historyContext = `User has ${sessions.length} previous conversations with their Cofounder. `;
        // Get most recent session for deeper context
        const recentSession = sessions[0];
        if (recentSession.last_message) {
          historyContext += `Most recent topic: "${recentSession.last_message.substring(0, 100)}..."`;
        }
      } else {
        historyContext = 'This is the user\'s first interaction with their Cofounder.';
      }

      console.log('🤖 Cofounder Notes: Requesting notes analysis from unified Cofounder API...');

      // Build context for notes-specific recommendations
      const businessCtx = buildBusinessContext(businessContext);
      const notesContext = buildNotesContext(currentBoards);

      // Ask Cofounder AI for notes suggestions using centralized API
      const result = await sendCofounderMessage({
        message: buildCofounderRequest(historyContext),
        context: {
          ...businessCtx,
          ...notesContext,
          userId: user.id
        },
        conversationHistory: []
      });

      if (!result.success || !result.response) {
        throw new Error(result.error || 'Failed to get suggestions from Cofounder');
      }

      console.log('🤖 Cofounder Notes: Unified API Response:', result.response);

      parseCofounderResponse(result.response);

    } catch (err: any) {
      console.error('🤖 Cofounder Notes: Error:', err);
      setError(err.message || 'Failed to connect with your Cofounder');
      setStep('loading');
    }
  };

  const buildNotesContext = (boards: any[]): any => {
    const totalLists = boards.reduce((sum, board) => sum + (board.lists?.length || 0), 0);
    const totalCards = boards.reduce((sum, board) => 
      sum + (board.lists?.reduce((listSum: number, list: any) => 
        listSum + (list.cards?.length || 0), 0) || 0), 0);

    return {
      currentBoards: boards.map(b => ({
        name: b.name,
        description: b.description,
        listsCount: b.lists?.length || 0,
        cardsCount: b.lists?.reduce((sum: number, list: any) => sum + (list.cards?.length || 0), 0) || 0
      })),
      totalBoards: boards.length,
      totalLists,
      totalCards,
      hasNotes: boards.length > 0
    };
  };

  const buildCofounderRequest = (historyContext: string): string => {
    const currentBoardsSummary = currentBoards.length > 0 
      ? `Current boards: ${currentBoards.map(b => `${b.name} (${b.lists?.length || 0} lists, ${b.lists?.reduce((sum: number, l: any) => sum + (l.cards?.length || 0), 0) || 0} cards)`).join(', ')}`
      : 'No boards created yet';
    
    return `Based on our conversation history and what you know about my business, I need help organizing my notes and tasks.

${currentBoardsSummary}

${historyContext}

Please analyze what I need and either:
1. Create new boards/lists/cards OR modify/delete existing ones to improve organization
2. If everything is already optimal, tell me that
3. If you need more info (max 2 questions), ask me

Your response should be in ONE of these formats:

Format 1 - To CREATE new items:
ACTION: CREATE
BOARDS:
- Board Name: [name] | Description: [desc] | Color: [blue/green/purple/orange/pink]
  LISTS:
  - List Name: [name]
    CARDS:
    - Card: [title] | Description: [desc] | Priority: [high/medium/low]
REASON: Brief explanation

Format 2 - To MODIFY existing items:
ACTION: MODIFY
BOARDS:
- Delete Board: [board name]
- Rename Board: [old name] | New Name: [new name]
- Update Board: [name] | Description: [desc] | Color: [color]
LISTS:
- Delete List: [list name] from Board: [board name]
- Rename List: [old name] | New Name: [new name] | Board: [board name]
- Move List: [list name] | From Board: [old board] | To Board: [new board]
CARDS:
- Delete Card: [card title] from List: [list name]
- Edit Card: [old title] | New Title: [title] | Description: [desc] | Priority: [priority] | List: [list name]
- Move Card: [card title] | From List: [old list] | To List: [new list] | Board: [board name]
REASON: Brief explanation

Format 3 - No changes needed:
ACTION: NO_CHANGES
REASON: Brief explanation

Format 4 - Need more info:
ACTION: QUESTIONS
QUESTIONS:
1. [Question]
2. [Question]

Be concise. You're my Cofounder. Max 2 questions if needed.`;
  };

  const parseCofounderResponse = (response: string) => {
    console.log('🤖 Parsing Cofounder response:', response);

    // Check if response indicates no changes needed
    if (response.includes('ACTION: NO_CHANGES')) {
      const reasonMatch = response.match(/REASON:\s*([^\n]+)/);
      setCofounderMessage(reasonMatch ? reasonMatch[1] : 'Your notes are well-organized. Everything looks good!');
      setStep('no-changes');
      return;
    }

    // Check if response contains creation actions
    if (response.includes('ACTION: CREATE')) {
      const reasonMatch = response.match(/REASON:\s*([^\n]+)/);
      setCofounderMessage(reasonMatch ? reasonMatch[1] : 'Creating your notes structure...');
      setChangesPlanned(response);
      executeCreationActions(response);
      return;
    }

    // Check if response contains modification actions
    if (response.includes('ACTION: MODIFY')) {
      const reasonMatch = response.match(/REASON:\s*([^\n]+)/);
      setCofounderMessage(reasonMatch ? reasonMatch[1] : 'Modifying your notes structure...');
      setChangesPlanned(response);
      executeModificationActions(response);
      return;
    }

    // Check if response contains questions
    if (response.includes('ACTION: QUESTIONS') || response.includes('QUESTIONS:')) {
      const questionsSection = response.split('QUESTIONS:')[1];
      const questionLines = questionsSection
        .split('\n')
        .filter(line => line.trim().match(/^\d+\./))
        .map((line, index) => {
          const cleanQuestion = line.replace(/^\d+\.\s*/, '').trim();
          return {
            id: `q${index}`,
            question: cleanQuestion,
            placeholder: ''
          };
        })
        .slice(0, 2); // Max 2 questions

      if (questionLines.length > 0) {
        setQuestions(questionLines);
        setCofounderMessage('I need to understand a bit more about your priorities to organize your notes perfectly.');
        setStep('questions');
        return;
      }
    }

    // Fallback: Assume no changes needed
    setCofounderMessage('I analyzed your notes and everything looks good for now!');
    setStep('no-changes');
  };

  const executeCreationActions = async (response: string) => {
    try {
      setStep('generating');

      // Parse the full structure: boards, lists, and cards
      const lines = response.split('\n').map(l => l.trim()).filter(l => l);
      
      const boardsToCreate: Array<{
        name: string;
        description: string;
        color: string;
        lists: Array<{
          name: string;
          cards: Array<{
            title: string;
            description: string;
            priority: string;
          }>;
        }>;
      }> = [];

      let currentBoard: any = null;
      let currentList: any = null;
      let inListsSection = false;
      let inCardsSection = false;

      console.log('🤖 Parsing structure from response...');

      for (const line of lines) {
        // Parse board line
        if (line.match(/^-?\s*Board Name:/i)) {
          // Save previous board if exists
          if (currentBoard && currentBoard.name) {
            boardsToCreate.push(currentBoard);
          }
          
          const boardMatch = line.match(/Board Name:\s*([^|]+)\s*\|\s*Description:\s*([^|]+)\s*\|\s*Color:\s*(\w+)/i);
          if (boardMatch) {
            currentBoard = {
              name: boardMatch[1].trim(),
              description: boardMatch[2].trim(),
              color: boardMatch[3].trim().toLowerCase(),
              lists: []
            };
            inListsSection = false;
            inCardsSection = false;
            console.log('🤖 Found board:', currentBoard.name);
          }
        }
        // Check for LISTS section
        else if (line.match(/^\\s*LISTS:\\s*$/i)) {
          inListsSection = true;
          inCardsSection = false;
          console.log('🤖 Entering LISTS section');
        }
        // Check for CARDS section
        else if (line.match(/^\\s*CARDS:\\s*$/i)) {
          inCardsSection = true;
          console.log('🤖 Entering CARDS section');
        }
        // Parse list line
        else if (inListsSection && line.match(/^-\s*List Name:/i)) {
          const listMatch = line.match(/List Name:\s*(.+)/i);
          if (listMatch && currentBoard) {
            currentList = {
              name: listMatch[1].trim(),
              cards: []
            };
            currentBoard.lists.push(currentList);
            inCardsSection = false;
            console.log('🤖 Found list:', currentList.name);
          }
        }
        // Parse card line
        else if (inCardsSection && line.match(/^-\s*Card:/i) && currentList) {
          const cardMatch = line.match(/Card:\s*([^|]+)\s*\|\s*Description:\s*([^|]+)\s*\|\s*Priority:\s*(\w+)/i);
          if (cardMatch) {
            currentList.cards.push({
              title: cardMatch[1].trim(),
              description: cardMatch[2].trim(),
              priority: cardMatch[3].trim().toLowerCase()
            });
            console.log('🤖 Found card:', cardMatch[1].trim());
          }
        }
      }

      // Save the last board if exists
      if (currentBoard && currentBoard.name) {
        boardsToCreate.push(currentBoard);
      }

      console.log('🤖 Parsed structure:', JSON.stringify(boardsToCreate, null, 2));

      if (boardsToCreate.length === 0) {
        console.log('🤖 No structured boards found, creating a default board');
        await onCreateBoard({
          name: 'New Board',
          description: 'Created by your Cofounder',
          color: 'blue'
        });
      } else {
        // Create each board with its lists and cards
        for (const boardData of boardsToCreate) {
          console.log('🤖 Creating board:', boardData.name);
          
          // Create the board and get its ID
          const boardId = await onCreateBoard({
            name: boardData.name,
            description: boardData.description,
            color: boardData.color
          });

          // Wait for board to be created
          await new Promise(resolve => setTimeout(resolve, 800));

          // Create lists for this board
          for (let listIndex = 0; listIndex < boardData.lists.length; listIndex++) {
            const listData = boardData.lists[listIndex];
            console.log('🤖 Creating list:', listData.name);
            
            const listId = await onCreateList(boardId, {
              name: listData.name,
              position: listIndex
            });

            // Wait for list to be created
            await new Promise(resolve => setTimeout(resolve, 600));

            // Create cards for this list
            for (let cardIndex = 0; cardIndex < listData.cards.length; cardIndex++) {
              const cardData = listData.cards[cardIndex];
              console.log('🤖 Creating card:', cardData.title);
              
              await onCreateCard(listId, {
                title: cardData.title,
                description: cardData.description,
                labels: [],
                priority: cardData.priority,
                position: cardIndex
              });

              // Wait for card to be created
              await new Promise(resolve => setTimeout(resolve, 400));
            }
          }

          // Small delay between boards
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      setStep('complete');

    } catch (err: any) {
      console.error('🤖 Error creating notes structure:', err);
      setError(err.message || 'Failed to create notes structure');
      setStep('loading');
    }
  };

  const executeModificationActions = async (response: string) => {
    try {
      setStep('generating');

      // Parse the full structure: boards, lists, and cards
      const lines = response.split('\n').map(l => l.trim()).filter(l => l);
      
      const boardsToDelete: string[] = [];
      const boardsToUpdate: { name: string; description: string; color: string }[] = [];
      const boardsToRename: { oldName: string; newName: string }[] = [];
      const listsToDelete: { name: string; boardName: string }[] = [];
      const listsToRename: { oldName: string; newName: string; boardName: string }[] = [];
      const listsToMove: { name: string; fromBoard: string; toBoard: string }[] = [];
      const cardsToDelete: { title: string; listName: string }[] = [];
      const cardsToUpdate: { oldTitle: string; newTitle: string; description: string; priority: string; listName: string }[] = [];
      const cardsToMove: { title: string; fromList: string; toList: string; boardName: string }[] = [];

      let inListsSection = false;
      let inCardsSection = false;

      console.log('🤖 Parsing structure from response...');

      for (const line of lines) {
        // Parse board line
        if (line.match(/^-?\s*Delete Board:/i)) {
          const boardMatch = line.match(/Delete Board:\s*(.+)/i);
          if (boardMatch) {
            boardsToDelete.push(boardMatch[1].trim());
            console.log('🤖 Found board to delete:', boardMatch[1].trim());
          }
        }
        else if (line.match(/^-?\s*Rename Board:/i)) {
          const boardMatch = line.match(/Rename Board:\s*(.+) \| New Name:\s*(.+)/i);
          if (boardMatch) {
            boardsToRename.push({
              oldName: boardMatch[1].trim(),
              newName: boardMatch[2].trim()
            });
            console.log('🤖 Found board to rename:', boardMatch[1].trim(), 'to', boardMatch[2].trim());
          }
        }
        else if (line.match(/^-?\s*Update Board:/i)) {
          const boardMatch = line.match(/Update Board:\s*(.+) \| Description:\s*(.+) \| Color:\s*(.+)/i);
          if (boardMatch) {
            boardsToUpdate.push({
              name: boardMatch[1].trim(),
              description: boardMatch[2].trim(),
              color: boardMatch[3].trim().toLowerCase()
            });
            console.log('🤖 Found board to update:', boardMatch[1].trim());
          }
        }
        // Check for LISTS section
        else if (line.match(/^\s*LISTS:\s*$/i)) {
          inListsSection = true;
          inCardsSection = false;
          console.log('🤖 Entering LISTS section');
        }
        // Check for CARDS section
        else if (line.match(/^\s*CARDS:\s*$/i)) {
          inCardsSection = true;
          console.log('🤖 Entering CARDS section');
        }
        // Parse list line
        else if (inListsSection && line.match(/^-\s*Delete List:/i)) {
          const listMatch = line.match(/Delete List:\s*(.+) from Board:\s*(.+)/i);
          if (listMatch) {
            listsToDelete.push({
              name: listMatch[1].trim(),
              boardName: listMatch[2].trim()
            });
            console.log('🤖 Found list to delete:', listMatch[1].trim(), 'from board', listMatch[2].trim());
          }
        }
        else if (inListsSection && line.match(/^-\s*Rename List:/i)) {
          const listMatch = line.match(/Rename List:\s*(.+) \| New Name:\s*(.+) \| Board:\s*(.+)/i);
          if (listMatch) {
            listsToRename.push({
              oldName: listMatch[1].trim(),
              newName: listMatch[2].trim(),
              boardName: listMatch[3].trim()
            });
            console.log('🤖 Found list to rename:', listMatch[1].trim(), 'to', listMatch[2].trim(), 'in board', listMatch[3].trim());
          }
        }
        else if (inListsSection && line.match(/^-\s*Move List:/i)) {
          const listMatch = line.match(/Move List:\s*(.+) \| From Board:\s*(.+) \| To Board:\s*(.+)/i);
          if (listMatch) {
            listsToMove.push({
              name: listMatch[1].trim(),
              fromBoard: listMatch[2].trim(),
              toBoard: listMatch[3].trim()
            });
            console.log('🤖 Found list to move:', listMatch[1].trim(), 'from board', listMatch[2].trim(), 'to board', listMatch[3].trim());
          }
        }
        // Parse card line
        else if (inCardsSection && line.match(/^-\s*Delete Card:/i)) {
          const cardMatch = line.match(/Delete Card:\s*(.+) from List:\s*(.+)/i);
          if (cardMatch) {
            cardsToDelete.push({
              title: cardMatch[1].trim(),
              listName: cardMatch[2].trim()
            });
            console.log('🤖 Found card to delete:', cardMatch[1].trim(), 'from list', cardMatch[2].trim());
          }
        }
        else if (inCardsSection && line.match(/^-\s*Edit Card:/i)) {
          const cardMatch = line.match(/Edit Card:\s*(.+) \| New Title:\s*(.+) \| Description:\s*(.+) \| Priority:\s*(.+) \| List:\s*(.+)/i);
          if (cardMatch) {
            cardsToUpdate.push({
              oldTitle: cardMatch[1].trim(),
              newTitle: cardMatch[2].trim(),
              description: cardMatch[3].trim(),
              priority: cardMatch[4].trim().toLowerCase(),
              listName: cardMatch[5].trim()
            });
            console.log('🤖 Found card to update:', cardMatch[1].trim(), 'to', cardMatch[2].trim(), 'in list', cardMatch[5].trim());
          }
        }
        else if (inCardsSection && line.match(/^-\s*Move Card:/i)) {
          const cardMatch = line.match(/Move Card:\s*(.+) \| From List:\s*(.+) \| To List:\s*(.+) \| Board:\s*(.+)/i);
          if (cardMatch) {
            cardsToMove.push({
              title: cardMatch[1].trim(),
              fromList: cardMatch[2].trim(),
              toList: cardMatch[3].trim(),
              boardName: cardMatch[4].trim()
            });
            console.log('🤖 Found card to move:', cardMatch[1].trim(), 'from list', cardMatch[2].trim(), 'to list', cardMatch[3].trim(), 'in board', cardMatch[4].trim());
          }
        }
      }

      console.log('🤖 Parsed structure:', JSON.stringify({
        boardsToDelete,
        boardsToUpdate,
        boardsToRename,
        listsToDelete,
        listsToRename,
        listsToMove,
        cardsToDelete,
        cardsToUpdate,
        cardsToMove
      }, null, 2));

      // Execute deletions
      for (const boardName of boardsToDelete) {
        const board = currentBoards.find(b => b.name === boardName);
        if (board) {
          console.log('🤖 Deleting board:', boardName);
          await onDeleteBoard(board.id);
          await new Promise(resolve => setTimeout(resolve, 800));
        }
      }

      // Execute renames
      for (const { oldName, newName } of boardsToRename) {
        const board = currentBoards.find(b => b.name === oldName);
        if (board) {
          console.log('🤖 Renaming board:', oldName, 'to', newName);
          await onEditBoard(board.id, { name: newName });
          await new Promise(resolve => setTimeout(resolve, 800));
        }
      }

      // Execute updates
      for (const { name, description, color } of boardsToUpdate) {
        const board = currentBoards.find(b => b.name === name);
        if (board) {
          console.log('🤖 Updating board:', name);
          await onEditBoard(board.id, { description, color });
          await new Promise(resolve => setTimeout(resolve, 800));
        }
      }

      // Execute list deletions
      for (const { name, boardName } of listsToDelete) {
        const board = currentBoards.find(b => b.name === boardName);
        if (board) {
          const list = board.lists.find(l => l.name === name);
          if (list) {
            console.log('🤖 Deleting list:', name, 'from board', boardName);
            await onDeleteList(list.id);
            await new Promise(resolve => setTimeout(resolve, 600));
          }
        }
      }

      // Execute list renames
      for (const { oldName, newName, boardName } of listsToRename) {
        const board = currentBoards.find(b => b.name === boardName);
        if (board) {
          const list = board.lists.find(l => l.name === oldName);
          if (list) {
            console.log('🤖 Renaming list:', oldName, 'to', newName, 'in board', boardName);
            await onEditList(list.id, newName);
            await new Promise(resolve => setTimeout(resolve, 600));
          }
        }
      }

      // Execute list moves
      for (const { name, fromBoard, toBoard } of listsToMove) {
        const fromBoardObj = currentBoards.find(b => b.name === fromBoard);
        const toBoardObj = currentBoards.find(b => b.name === toBoard);
        if (fromBoardObj && toBoardObj) {
          const list = fromBoardObj.lists.find(l => l.name === name);
          if (list) {
            console.log('🤖 Moving list:', name, 'from board', fromBoard, 'to board', toBoard);
            await onMoveList(list.id, toBoardObj.id, fromBoardObj.lists.length);
            await new Promise(resolve => setTimeout(resolve, 600));
          }
        }
      }

      // Execute card deletions
      for (const { title, listName } of cardsToDelete) {
        const board = currentBoards.find(b => b.lists.some(l => l.name === listName));
        if (board) {
          const list = board.lists.find(l => l.name === listName);
          if (list) {
            const card = list.cards.find(c => c.title === title);
            if (card) {
              console.log('🤖 Deleting card:', title, 'from list', listName);
              await onDeleteCard(card.id);
              await new Promise(resolve => setTimeout(resolve, 400));
            }
          }
        }
      }

      // Execute card updates
      for (const { oldTitle, newTitle, description, priority, listName } of cardsToUpdate) {
        const board = currentBoards.find(b => b.lists.some(l => l.name === listName));
        if (board) {
          const list = board.lists.find(l => l.name === listName);
          if (list) {
            const card = list.cards.find(c => c.title === oldTitle);
            if (card) {
              console.log('🤖 Updating card:', oldTitle, 'to', newTitle, 'in list', listName);
              await onEditCard(card.id, { title: newTitle, description, priority });
              await new Promise(resolve => setTimeout(resolve, 400));
            }
          }
        }
      }

      // Execute card moves
      for (const { title, fromList, toList, boardName } of cardsToMove) {
        const board = currentBoards.find(b => b.name === boardName);
        if (board) {
          const fromListObj = board.lists.find(l => l.name === fromList);
          const toListObj = board.lists.find(l => l.name === toList);
          if (fromListObj && toListObj) {
            const card = fromListObj.cards.find(c => c.title === title);
            if (card) {
              console.log('🤖 Moving card:', title, 'from list', fromList, 'to list', toList, 'in board', boardName);
              await onMoveCard(card.id, toListObj.id, fromListObj.cards.length);
              await new Promise(resolve => setTimeout(resolve, 400));
            }
          }
        }
      }

      setStep('complete');

    } catch (err: any) {
      console.error('🤖 Error modifying notes structure:', err);
      setError(err.message || 'Failed to modify notes structure');
      setStep('loading');
    }
  };

  const handleAnswerSubmit = async () => {
    try {
      setStep('generating');

      // Format answers for Cofounder
      const answersText = questions
        .map(q => `${q.question}\nAnswer: ${answers[q.id] || 'Not answered'}`)
        .join('\n\n');

      const followUpMessage = `Based on my previous questions, here are my answers:

${answersText}

Now, please create boards/lists/cards that would help me using this format:
ACTION: CREATE
BOARDS:
- Board Name: [name] | Description: [desc] | Color: [blue/green/purple/orange/pink]
  LISTS:
  - List Name: [name]
    CARDS:
    - Card: [title] | Description: [desc] | Priority: [high/medium/low]
REASON: Brief explanation`;

      // Build context for notes-specific recommendations
      const businessCtx = buildBusinessContext(businessContext);
      const notesContext = buildNotesContext(currentBoards);

      // Send follow-up message using centralized API
      const result = await sendCofounderMessage({
        message: followUpMessage,
        context: {
          ...businessCtx,
          ...notesContext,
          userId: user.id
        },
        conversationHistory: []
      });

      if (!result.success || !result.response) {
        throw new Error(result.error || 'Failed to get updated suggestions');
      }

      console.log('🤖 Cofounder Notes: Follow-up response:', result.response);
      parseCofounderResponse(result.response);

    } catch (err: any) {
      console.error('🤖 Error submitting answers:', err);
      setError(err.message || 'Failed to process your answers');
      setStep('questions');
    }
  };

  const handleReconsider = () => {
    // Re-run the initial analysis
    initializeCofounderAssistant();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" style={{ color: 'var(--primary)' }} />
            <span>Cofounder Notes</span>
          </DialogTitle>
          <DialogDescription>
            Let your Cofounder help you organize your notes and tasks
          </DialogDescription>
        </DialogHeader>

        {/* Loading State */}
        {step === 'loading' && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="relative">
              <Loader2 className="w-12 h-12 animate-spin" style={{ color: 'var(--primary)' }} />
              <Sparkles className="w-6 h-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ color: 'var(--primary)' }} />
            </div>
            <p style={{ color: 'var(--muted-foreground)' }}>
              {error ? error : 'Consulting with your Cofounder...'}
            </p>
            {error && (
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="mt-4"
              >
                Close
              </Button>
            )}
          </div>
        )}

        {/* Questions State */}
        {step === 'questions' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3 p-4 rounded-lg" style={{ backgroundColor: 'var(--muted)' }}>
              <MessageSquare className="w-5 h-5 mt-1 flex-shrink-0" style={{ color: 'var(--primary)' }} />
              <div className="flex-1">
                <p style={{ color: 'var(--foreground)' }}>{cofounderMessage}</p>
              </div>
            </div>

            <ScrollArea className="flex-1 max-h-[400px]">
              <div className="space-y-4 pr-4">
                {questions.map((question) => (
                  <div key={question.id} className="space-y-2">
                    <Label htmlFor={question.id}>{question.question}</Label>
                    <Textarea
                      id={question.id}
                      placeholder={question.placeholder || 'Your answer...'}
                      value={answers[question.id] || ''}
                      onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
                      rows={3}
                    />
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex gap-2 justify-end pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleAnswerSubmit}>
                Submit Answers
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Generating State */}
        {step === 'generating' && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="relative">
              <Loader2 className="w-12 h-12 animate-spin" style={{ color: 'var(--primary)' }} />
              <Sparkles className="w-6 h-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ color: 'var(--primary)' }} />
            </div>
            <p style={{ color: 'var(--muted-foreground)' }}>
              Creating your notes structure...
            </p>
          </div>
        )}

        {/* Complete State - All done :) */}
        {step === 'complete' && (
          <div className="flex flex-col items-center justify-center py-16 gap-6">
            <div className="relative">
              <div 
                className="w-24 h-24 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'var(--muted)' }}
              >
                <Sparkles className="w-12 h-12" style={{ color: 'var(--primary)' }} />
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <p className="text-2xl">All done :)</p>
              <p style={{ color: 'var(--muted-foreground)' }} className="text-center max-w-md">
                {cofounderMessage}
              </p>
            </div>
            <Button 
              onClick={() => onOpenChange(false)}
              className="mt-4"
              style={{
                backgroundColor: 'var(--primary)',
                color: 'var(--primary-foreground)'
              }}
            >
              Close
            </Button>
          </div>
        )}

        {/* No Changes Needed State */}
        {step === 'no-changes' && (
          <div className="flex flex-col items-center justify-center py-16 gap-6">
            <div className="relative">
              <div 
                className="w-24 h-24 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'var(--muted)' }}
              >
                <CheckCircle2 className="w-12 h-12" style={{ color: 'var(--primary)' }} />
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <p className="text-2xl">You're all set!</p>
              <p style={{ color: 'var(--muted-foreground)' }} className="text-center max-w-md">
                {cofounderMessage}
              </p>
            </div>
            <div className="flex gap-3 mt-4">
              <Button 
                variant="outline"
                onClick={handleReconsider}
              >
                Reconsider
              </Button>
              <Button 
                onClick={() => onOpenChange(false)}
                style={{
                  backgroundColor: 'var(--primary)',
                  color: 'var(--primary-foreground)'
                }}
              >
                Agree & Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};