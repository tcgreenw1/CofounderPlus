// Notes endpoints for Cofounder API Server
import * as kv from './kv_store.tsx';

export function addNotesEndpoints(app: any) {
  console.log('📝 Adding notes endpoints...');

  // Get boards for a business
  app.get('/make-server-373d8b09/notes/boards', async (c: any) => {
    console.log('📝 Notes: Get boards endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      if (!accessToken || accessToken === 'undefined') {
        return c.json({ success: false, error: 'Unauthorized' }, 401);
      }
      
      const businessId = c.req.query('businessId');
      if (!businessId) {
        return c.json({ success: false, error: 'Business ID is required' }, 400);
      }

      console.log('📝 Notes: Fetching boards for business:', businessId);
      const boards = await kv.get(`business:${businessId}:notes:boards`) || [];
      
      console.log('📝 Notes: Found boards:', boards.length);
      return c.json({ 
        success: true,
        boards: boards,
        total: boards.length
      });

    } catch (error) {
      console.error('📝 Notes: Get boards error:', error);
      return c.json({ success: false, error: `Error getting boards: ${error.message}` }, 500);
    }
  });

  // Create a new board
  app.post('/make-server-373d8b09/notes/boards', async (c: any) => {
    console.log('📝 Notes: Create board endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      if (!accessToken || accessToken === 'undefined') {
        return new Response('Unauthorized', { status: 401 });
      }
      
      const boardData = await c.req.json();
      const { businessId, name, description, color } = boardData;
      
      if (!businessId || !name) {
        return new Response('Business ID and board name are required', { status: 400 });
      }

      const boardId = `board_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const board = {
        id: boardId,
        business_id: businessId,
        name: name.trim(),
        description: description?.trim() || '',
        color: color || 'blue',
        lists: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Get existing boards and add the new one
      const existingBoards = await kv.get(`business:${businessId}:notes:boards`) || [];
      const updatedBoards = [board, ...existingBoards];
      
      await kv.set(`business:${businessId}:notes:boards`, updatedBoards);
      
      console.log('📝 Notes: Board created successfully:', boardId);
      return c.json({ 
        success: true, 
        board,
        message: 'Board created successfully'
      });

    } catch (error) {
      console.error('📝 Notes: Create board error:', error);
      return new Response(`Error creating board: ${error.message}`, { status: 500 });
    }
  });

  // Get board details with lists and cards
  app.get('/make-server-373d8b09/notes/boards/:boardId/details', async (c: any) => {
    console.log('📝 Notes: Get board details endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      if (!accessToken || accessToken === 'undefined') {
        return new Response('Unauthorized', { status: 401 });
      }
      
      const boardId = c.req.param('boardId');
      const businessId = c.req.query('businessId');
      
      if (!businessId) {
        return new Response('Business ID is required', { status: 400 });
      }
      
      console.log('📝 Notes: Getting board details for:', boardId, 'in business:', businessId);
      
      // Get boards for business
      const boards = await kv.get(`business:${businessId}:notes:boards`) || [];
      const board = boards.find((b: any) => b.id === boardId);
      
      if (!board) {
        return new Response('Board not found', { status: 404 });
      }

      // Get board data with lists and cards
      const boardData = await kv.get(`business:${businessId}:notes:board:${boardId}`) || board;
      
      console.log('📝 Notes: Found board data:', boardData);
      return c.json({ 
        success: true,
        board: boardData 
      });

    } catch (error) {
      console.error('📝 Notes: Get board details error:', error);
      return new Response(`Error getting board details: ${error.message}`, { status: 500 });
    }
  });

  // Create a new list
  app.post('/make-server-373d8b09/notes/lists', async (c: any) => {
    console.log('📝 Notes: Create list endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      if (!accessToken || accessToken === 'undefined') {
        return new Response('Unauthorized', { status: 401 });
      }
      
      const listData = await c.req.json();
      const { businessId, boardId, name, position, color } = listData;
      
      if (!businessId || !boardId || !name) {
        return new Response('Business ID, board ID, and name are required', { status: 400 });
      }

      const listId = `list_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newList = {
        id: listId,
        boardId,
        name: name.trim(),
        position: position || 0,
        color: color || 'blue',
        cards: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Get current board data
      const boardData = await kv.get(`business:${businessId}:notes:board:${boardId}`) || { lists: [] };
      
      // Add the new list
      boardData.lists = boardData.lists || [];
      boardData.lists.push(newList);
      boardData.updated_at = new Date().toISOString();
      
      // Save updated board data
      await kv.set(`business:${businessId}:notes:board:${boardId}`, boardData);
      
      console.log('📝 Notes: List created successfully:', listId);
      return c.json({ 
        success: true, 
        list: newList,
        message: 'List created successfully'
      });

    } catch (error) {
      console.error('📝 Notes: Create list error:', error);
      return new Response(`Error creating list: ${error.message}`, { status: 500 });
    }
  });

  // Create a new card
  app.post('/make-server-373d8b09/notes/cards', async (c: any) => {
    console.log('📝 Notes: Create card endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      if (!accessToken || accessToken === 'undefined') {
        return new Response('Unauthorized', { status: 401 });
      }
      
      const cardData = await c.req.json();
      const { businessId, boardId, listId, title, description, priority, position } = cardData;
      
      if (!businessId || !boardId || !listId || !title) {
        return new Response('Business ID, board ID, list ID, and title are required', { status: 400 });
      }

      const cardId = `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newCard = {
        id: cardId,
        listId,
        title: title.trim(),
        description: description?.trim() || '',
        priority: priority || 'medium',
        dueDate: null,
        labels: [],
        position: position || 0,
        completed: false,
        starCompleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Get current board data
      const boardData = await kv.get(`business:${businessId}:notes:board:${boardId}`) || { lists: [] };
      
      // Find the target list and add the card
      const listIndex = boardData.lists.findIndex((list: any) => list.id === listId);
      if (listIndex === -1) {
        return new Response('List not found', { status: 404 });
      }
      
      boardData.lists[listIndex].cards = boardData.lists[listIndex].cards || [];
      boardData.lists[listIndex].cards.push(newCard);
      boardData.lists[listIndex].updated_at = new Date().toISOString();
      boardData.updated_at = new Date().toISOString();
      
      // Save updated board data
      await kv.set(`business:${businessId}:notes:board:${boardId}`, boardData);
      
      console.log('📝 Notes: Card created successfully:', cardId);
      return c.json({ 
        success: true, 
        card: newCard,
        message: 'Card created successfully'
      });

    } catch (error) {
      console.error('📝 Notes: Create card error:', error);
      return new Response(`Error creating card: ${error.message}`, { status: 500 });
    }
  });

  // Update a card (for drag and drop, completion, etc.)
  app.put('/make-server-373d8b09/notes/cards/:cardId', async (c: any) => {
    console.log('📝 Notes: Update card endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      if (!accessToken || accessToken === 'undefined') {
        return new Response('Unauthorized', { status: 401 });
      }
      
      const cardId = c.req.param('cardId');
      const updateData = await c.req.json();
      const { businessId, boardId } = updateData;
      
      if (!businessId || !boardId) {
        return new Response('Business ID and board ID are required', { status: 400 });
      }

      // Get current board data
      const boardData = await kv.get(`business:${businessId}:notes:board:${boardId}`) || { lists: [] };
      
      // Find and update the card
      let cardFound = false;
      for (const list of boardData.lists) {
        const cardIndex = list.cards.findIndex((card: any) => card.id === cardId);
        if (cardIndex !== -1) {
          // Update the card with new data
          list.cards[cardIndex] = {
            ...list.cards[cardIndex],
            ...updateData,
            id: cardId, // Preserve the original ID
            updated_at: new Date().toISOString()
          };
          cardFound = true;
          break;
        }
      }
      
      if (!cardFound) {
        return new Response('Card not found', { status: 404 });
      }
      
      boardData.updated_at = new Date().toISOString();
      
      // Save updated board data
      await kv.set(`business:${businessId}:notes:board:${boardId}`, boardData);
      
      console.log('📝 Notes: Card updated successfully:', cardId);
      return c.json({ 
        success: true, 
        message: 'Card updated successfully'
      });

    } catch (error) {
      console.error('📝 Notes: Update card error:', error);
      return new Response(`Error updating card: ${error.message}`, { status: 500 });
    }
  });

  // Update entire board data (for drag and drop operations)
  app.put('/make-server-373d8b09/notes/boards/:boardId', async (c: any) => {
    console.log('📝 Notes: Update board endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      if (!accessToken || accessToken === 'undefined') {
        return new Response('Unauthorized', { status: 401 });
      }
      
      const boardId = c.req.param('boardId');
      const updateData = await c.req.json();
      const { businessId, boardData, name, description, color } = updateData;
      
      if (!businessId) {
        return new Response('Business ID is required', { status: 400 });
      }

      let updatedBoardData;

      // Check if this is a full board update (with lists) or just metadata update
      if (boardData) {
        // Full board update (drag and drop)
        updatedBoardData = {
          ...boardData,
          id: boardId,
          updated_at: new Date().toISOString()
        };
      } else if (name !== undefined || description !== undefined || color !== undefined) {
        // Metadata update only (edit board name/description/color)
        // Get existing board data first
        const existingBoardData = await kv.get(`business:${businessId}:notes:board:${boardId}`) || {};
        const existingBoards = await kv.get(`business:${businessId}:notes:boards`) || [];
        const existingBoard = existingBoards.find((b: any) => b.id === boardId) || {};
        
        updatedBoardData = {
          ...existingBoardData,
          ...existingBoard,
          id: boardId,
          business_id: businessId,
          name: name !== undefined ? name : (existingBoard.name || existingBoardData.name),
          description: description !== undefined ? description : (existingBoard.description || existingBoardData.description || ''),
          color: color !== undefined ? color : (existingBoard.color || existingBoardData.color || 'blue'),
          lists: existingBoardData.lists || existingBoard.lists || [],
          updated_at: new Date().toISOString()
        };
        
        // Also update the board in the boards list
        const updatedBoards = existingBoards.map((b: any) => 
          b.id === boardId 
            ? { ...b, name: updatedBoardData.name, description: updatedBoardData.description, color: updatedBoardData.color, updated_at: updatedBoardData.updated_at }
            : b
        );
        await kv.set(`business:${businessId}:notes:boards`, updatedBoards);
      } else {
        return new Response('Either boardData or board properties (name/description/color) are required', { status: 400 });
      }
      
      // Save updated board data
      await kv.set(`business:${businessId}:notes:board:${boardId}`, updatedBoardData);
      
      console.log('📝 Notes: Board updated successfully:', boardId);
      return c.json({ 
        success: true, 
        board: updatedBoardData,
        message: 'Board updated successfully'
      });

    } catch (error) {
      console.error('📝 Notes: Update board error:', error);
      return new Response(`Error updating board: ${error.message}`, { status: 500 });
    }
  });

  // Update list (rename or reposition)
  app.put('/make-server-373d8b09/notes/lists/:listId', async (c: any) => {
    console.log('📝 Notes: Update list endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      if (!accessToken || accessToken === 'undefined') {
        return new Response('Unauthorized', { status: 401 });
      }
      
      const listId = c.req.param('listId');
      const updateData = await c.req.json();
      const { businessId, boardId, name, position, color } = updateData;
      
      if (!businessId || !boardId) {
        return new Response('Business ID and board ID are required', { status: 400 });
      }

      // Get current board data
      const boardData = await kv.get(`business:${businessId}:notes:board:${boardId}`) || { lists: [] };
      
      // Find and update the list
      const listIndex = boardData.lists.findIndex((list: any) => list.id === listId);
      if (listIndex === -1) {
        return new Response('List not found', { status: 404 });
      }
      
      if (name !== undefined) {
        boardData.lists[listIndex].name = name;
      }
      
      if (position !== undefined) {
        boardData.lists[listIndex].position = position;
      }
      
      if (color !== undefined) {
        boardData.lists[listIndex].color = color;
      }
      
      boardData.lists[listIndex].updated_at = new Date().toISOString();
      boardData.updated_at = new Date().toISOString();
      
      // Save updated board data
      await kv.set(`business:${businessId}:notes:board:${boardId}`, boardData);
      
      console.log('📝 Notes: List updated successfully:', listId);
      return c.json({ 
        success: true, 
        message: 'List updated successfully'
      });

    } catch (error) {
      console.error('📝 Notes: Update list error:', error);
      return new Response(`Error updating list: ${error.message}`, { status: 500 });
    }
  });

  // Delete a card
  app.delete('/make-server-373d8b09/notes/cards/:cardId', async (c: any) => {
    console.log('📝 Notes: Delete card endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      if (!accessToken || accessToken === 'undefined') {
        return new Response('Unauthorized', { status: 401 });
      }
      
      const cardId = c.req.param('cardId');
      const businessId = c.req.query('businessId');
      const boardId = c.req.query('boardId');
      
      if (!businessId || !boardId) {
        return new Response('Business ID and board ID are required', { status: 400 });
      }

      // Get current board data
      const boardData = await kv.get(`business:${businessId}:notes:board:${boardId}`) || { lists: [] };
      
      // Find and remove the card
      let cardFound = false;
      for (const list of boardData.lists) {
        const cardIndex = list.cards.findIndex((card: any) => card.id === cardId);
        if (cardIndex !== -1) {
          list.cards.splice(cardIndex, 1);
          cardFound = true;
          break;
        }
      }
      
      if (!cardFound) {
        return new Response('Card not found', { status: 404 });
      }
      
      boardData.updated_at = new Date().toISOString();
      
      // Save updated board data
      await kv.set(`business:${businessId}:notes:board:${boardId}`, boardData);
      
      console.log('📝 Notes: Card deleted successfully:', cardId);
      return c.json({ 
        success: true, 
        message: 'Card deleted successfully'
      });

    } catch (error) {
      console.error('📝 Notes: Delete card error:', error);
      return new Response(`Error deleting card: ${error.message}`, { status: 500 });
    }
  });

  // Delete a list
  app.delete('/make-server-373d8b09/notes/lists/:listId', async (c: any) => {
    console.log('📝 Notes: Delete list endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      if (!accessToken || accessToken === 'undefined') {
        return new Response('Unauthorized', { status: 401 });
      }
      
      const listId = c.req.param('listId');
      const businessId = c.req.query('businessId');
      const boardId = c.req.query('boardId');
      
      if (!businessId || !boardId) {
        return new Response('Business ID and board ID are required', { status: 400 });
      }

      // Get current board data
      const boardData = await kv.get(`business:${businessId}:notes:board:${boardId}`) || { lists: [] };
      
      // Find and remove the list
      const listIndex = boardData.lists.findIndex((list: any) => list.id === listId);
      if (listIndex === -1) {
        return new Response('List not found', { status: 404 });
      }
      
      boardData.lists.splice(listIndex, 1);
      boardData.updated_at = new Date().toISOString();
      
      // Save updated board data
      await kv.set(`business:${businessId}:notes:board:${boardId}`, boardData);
      
      console.log('📝 Notes: List deleted successfully:', listId);
      return c.json({ 
        success: true, 
        message: 'List deleted successfully'
      });

    } catch (error) {
      console.error('📝 Notes: Delete list error:', error);
      return new Response(`Error deleting list: ${error.message}`, { status: 500 });
    }
  });

  // Delete a board
  app.delete('/make-server-373d8b09/notes/boards/:boardId', async (c: any) => {
    console.log('📝 Notes: Delete board endpoint called');
    try {
      const authHeader = c.req.header('Authorization');
      const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
      
      if (!accessToken || accessToken === 'undefined') {
        return new Response('Unauthorized', { status: 401 });
      }
      
      // Get user ID from access token
      const user = await authenticateUser(accessToken);
      if (!user) {
        return new Response('Unauthorized', { status: 401 });
      }
      const userId = user.id;
      
      const boardId = c.req.param('boardId');
      const businessId = c.req.query('businessId');
      
      if (!businessId) {
        return new Response('Business ID is required', { status: 400 });
      }

      console.log('📝 Notes: Deleting board:', boardId, 'for user:', userId, 'business:', businessId);

      // Get current boards list
      const boards = await kv.get(`business:${userId}:${businessId}:notes:boards`) || [];
      
      // Find and remove the board from the list
      const boardIndex = boards.findIndex((board: any) => board.id === boardId);
      if (boardIndex === -1) {
        console.error('📝 Notes: Board not found for deletion:', boardId);
        return new Response('Board not found', { status: 404 });
      }
      
      boards.splice(boardIndex, 1);
      
      // Save updated boards list
      await kv.set(`business:${userId}:${businessId}:notes:boards`, boards);
      
      // Also delete the board's detailed data if it exists
      await kv.del(`business:${userId}:${businessId}:notes:board:${boardId}`);
      
      // Also delete the board's backup if it exists
      await kv.del(`business:${userId}:${businessId}:notes:board:${boardId}:backup`);
      
      console.log('📝 Notes: Board deleted successfully:', boardId);
      return c.json({ 
        success: true, 
        message: 'Board deleted successfully'
      });

    } catch (error: any) {
      console.error('📝 Notes: Delete board error:', error);
      return new Response(`Error deleting board: ${error.message}`, { status: 500 });
    }
  });

  // Comprehensive search endpoint to find notes data in any storage pattern
  app.post('/make-server-ac1075a9/admin/search-keys', async (c: any) => {
    console.log('🔍 Notes: Comprehensive search endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      if (!accessToken || accessToken === 'undefined') {
        return new Response('Unauthorized', { status: 401 });
      }
      
      const { patterns, userId, businessId } = await c.req.json();
      
      console.log('🔍 Comprehensive search for:', { patterns, userId, businessId });
      
      const results: any = {
        timestamp: new Date().toISOString(),
        user_id: userId,
        business_id: businessId,
        search_patterns: patterns,
        found_data: [],
        migration_candidates: [],
        total_items_found: 0
      };

      // COMPREHENSIVE list of all possible patterns that have been used for notes storage
      const keyPatternsToTry = [
        // Current pattern (business-scoped)
        `business:${businessId}:notes:boards`,
        `business:${businessId}:notes:board:`,
        
        // User + Business combinations
        `notes:${userId}:${businessId}:boards`,
        `notes:${userId}:${businessId}:board:`,
        `board:${userId}:${businessId}:`,
        `list:${userId}:${businessId}:`,
        `card:${userId}:${businessId}:`,
        
        // Business-only patterns
        `notes:${businessId}:boards`,
        `notes:${businessId}:board:`,
        `board:${businessId}:`,
        `list:${businessId}:`,
        `card:${businessId}:`,
        
        // User-only patterns  
        `notes:${userId}:boards`,
        `notes:${userId}:board:`,
        `board:${userId}:`,
        `list:${userId}:`,
        `card:${userId}:`,
        
        // Legacy patterns with underscores
        `notes_board:${businessId}:`,
        `notes_board:${userId}:`,
        `notes_list:${businessId}:`,
        `notes_list:${userId}:`,
        `notes_card:${businessId}:`,
        `notes_card:${userId}:`,
        
        // Old user-centric patterns
        `user:${userId}:notes`,
        `user:${userId}:notes:boards`,
        `user:${userId}:notes:${businessId}`,
        `user:${userId}:business:${businessId}:notes`,
        
        // Mixed patterns
        `business:${userId}:${businessId}:notes`,
        `business:${userId}:${businessId}:boards`,
        `${userId}:${businessId}:notes`,
        `${userId}:${businessId}:boards`,
        
        // Simple patterns
        `notes_${businessId}`,
        `boards_${businessId}`,
        `notes_${userId}`,
        `boards_${userId}`,
        
        // Timestamped patterns (might have been used)
        `notes:${businessId}:`,
        `notes:${userId}:`,
        `board_${businessId}_`,
        `board_${userId}_`,
        
        // Any pattern containing the business ID
        businessId,
        
        // Generic patterns to catch anything
        'notes:',
        'board:',
        'list:',
        'card:'
      ];

      // Search through all patterns systematically
      for (const pattern of keyPatternsToTry) {
        try {
          console.log('🔍 Searching pattern:', pattern);
          
          if (pattern.endsWith(':') || pattern.endsWith('_')) {
            // Use prefix search for patterns ending with : or _
            const data = await kv.getByPrefix(pattern);
            if (data && data.length > 0) {
              console.log(`🔍 Found ${data.length} items with prefix: ${pattern}`);
              
              for (const item of data) {
                if (item.value && typeof item.value === 'object') {
                  // Check if this looks like notes data
                  const isNotesData = (
                    item.value.boards || 
                    item.value.lists || 
                    item.value.cards ||
                    item.value.name ||
                    item.value.title ||
                    (Array.isArray(item.value) && item.value.some((v: any) => v.boards || v.lists || v.name))
                  );
                  
                  if (isNotesData) {
                    results.found_data.push({
                      key: item.key,
                      pattern: pattern,
                      type: 'prefix_match',
                      data: item.value,
                      data_type: Array.isArray(item.value) ? 'array' : 'object',
                      item_count: Array.isArray(item.value) ? item.value.length : 1
                    });
                    
                    results.migration_candidates.push({
                      source_key: item.key,
                      source_pattern: pattern,
                      data_structure: Array.isArray(item.value) ? 'boards_array' : 'single_item',
                      migration_target: 'business:' + businessId + ':notes:boards'
                    });
                    
                    results.total_items_found++;
                  }
                }
              }
            }
            
          } else {
            // Use direct get for specific keys
            const data = await kv.get(pattern);
            if (data) {
              console.log('🔍 Found direct data for:', pattern);
              
              // Check if this looks like notes data
              const isNotesData = (
                data.boards || 
                data.lists || 
                data.cards ||
                data.name ||
                data.title ||
                (Array.isArray(data) && data.some((v: any) => v.boards || v.lists || v.name))
              );
              
              if (isNotesData) {
                results.found_data.push({
                  key: pattern,
                  pattern: pattern,
                  type: 'direct_match',
                  data: data,
                  data_type: Array.isArray(data) ? 'array' : 'object',
                  item_count: Array.isArray(data) ? data.length : 1
                });
                
                results.migration_candidates.push({
                  source_key: pattern,
                  source_pattern: pattern,
                  data_structure: Array.isArray(data) ? 'boards_array' : 'single_item',
                  migration_target: 'business:' + businessId + ':notes:boards'
                });
                
                results.total_items_found++;
              }
            }
          }
          
        } catch (error) {
          console.log('🔍 Error searching pattern:', pattern, error.message);
        }
      }

      // Also search by general prefixes to catch anything we might have missed
      const generalPrefixes = [
        `business:${businessId}:`,
        `user:${userId}:`,
        `notes:`,
        `board:`,
        `list:`,
        `card:`
      ];
      
      for (const prefix of generalPrefixes) {
        try {
          console.log('🔍 Scanning general prefix:', prefix);
          const prefixData = await kv.getByPrefix(prefix);
          
          for (const item of prefixData) {
            if (item.key && item.value && typeof item.value === 'object') {
              // Check if this contains notes-related data
              const keyLower = item.key.toLowerCase();
              const hasNotesKeywords = (
                keyLower.includes('note') || 
                keyLower.includes('board') || 
                keyLower.includes('list') || 
                keyLower.includes('card')
              );
              
              const hasNotesData = (
                item.value.boards || 
                item.value.lists || 
                item.value.cards ||
                item.value.name ||
                item.value.title ||
                (Array.isArray(item.value) && item.value.some((v: any) => v && (v.boards || v.lists || v.name || v.title)))
              );
              
              if (hasNotesKeywords || hasNotesData) {
                // Check if we haven't already found this key
                const alreadyFound = results.found_data.some((found: any) => found.key === item.key);
                if (!alreadyFound) {
                  console.log('🔍 Found additional notes data:', item.key);
                  
                  results.found_data.push({
                    key: item.key,
                    pattern: prefix,
                    type: 'general_scan',
                    data: item.value,
                    data_type: Array.isArray(item.value) ? 'array' : 'object',
                    item_count: Array.isArray(item.value) ? item.value.length : 1
                  });
                  
                  results.migration_candidates.push({
                    source_key: item.key,
                    source_pattern: 'general_scan',
                    data_structure: Array.isArray(item.value) ? 'boards_array' : 'single_item',
                    migration_target: 'business:' + businessId + ':notes:boards'
                  });
                  
                  results.total_items_found++;
                }
              }
            }
          }
          
        } catch (error) {
          console.log('🔍 General prefix scan failed:', prefix, error.message);
        }
      }

      // Summary and recommendations
      results.summary = {
        total_data_sources_found: results.found_data.length,
        total_items_discovered: results.total_items_found,
        migration_candidates: results.migration_candidates.length,
        search_completed: true,
        recommendations: []
      };
      
      if (results.migration_candidates.length > 0) {
        results.summary.recommendations.push('Data migration needed - old notes data found');
        results.summary.recommendations.push(`Found ${results.migration_candidates.length} data sources to migrate`);
      } else {
        results.summary.recommendations.push('No old notes data found - can create new boards');
      }
      
      console.log('🔍 Comprehensive search completed:', {
        sources_found: results.found_data.length,
        items_discovered: results.total_items_found,
        migration_targets: results.migration_candidates.length
      });
      
      return c.json({ 
        success: true,
        results
      });

    } catch (error) {
      console.error('🔍 Search keys error:', error);
      return new Response(`Error searching keys: ${error.message}`, { status: 500 });
    }
  });

  // Comprehensive migration endpoint to move old notes data to new format
  app.post('/make-server-ac1075a9/admin/migrate-notes-data', async (c: any) => {
    console.log('🔄 Notes: Migration endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      if (!accessToken || accessToken === 'undefined') {
        return new Response('Unauthorized', { status: 401 });
      }
      
      const { userId, businessId, migrationCandidates } = await c.req.json();
      
      console.log('🔄 Starting migration for:', { userId, businessId, candidateCount: migrationCandidates.length });
      
      const migrationResults = {
        timestamp: new Date().toISOString(),
        user_id: userId,
        business_id: businessId,
        processed_sources: [],
        migrated_boards: [],
        errors: [],
        success_count: 0,
        total_processed: 0
      };
      
      // Check if target already has data (to avoid overwriting)
      const existingBoards = await kv.get(`business:${businessId}:notes:boards`) || [];
      console.log('🔄 Existing boards in target:', existingBoards.length);
      
      let migratedBoards = [...existingBoards];
      
      for (const candidate of migrationCandidates) {
        migrationResults.total_processed++;
        
        try {
          console.log('🔄 Processing migration candidate:', candidate.source_key);
          
          // Get the source data
          const sourceData = await kv.get(candidate.source_key);
          if (!sourceData) {
            migrationResults.errors.push({
              source_key: candidate.source_key,
              error: 'Source data not found'
            });
            continue;
          }
          
          migrationResults.processed_sources.push({
            source_key: candidate.source_key,
            data_structure: candidate.data_structure,
            source_data_type: Array.isArray(sourceData) ? 'array' : 'object'
          });
          
          // Process based on data structure
          if (candidate.data_structure === 'boards_array' && Array.isArray(sourceData)) {
            // Source data is an array of boards
            console.log('🔄 Migrating boards array with', sourceData.length, 'boards');
            
            for (const board of sourceData) {
              if (board && board.id && board.name) {
                // Clean up the board data to match current format
                const cleanBoard = {
                  id: board.id,
                  business_id: businessId,
                  name: board.name,
                  description: board.description || '',
                  color: board.color || 'blue',
                  lists: board.lists || [],
                  created_at: board.created_at || new Date().toISOString(),
                  updated_at: new Date().toISOString()
                };
                
                // Check if board already exists
                const existingBoard = migratedBoards.find((b: any) => b.id === board.id);
                if (!existingBoard) {
                  migratedBoards.push(cleanBoard);
                  migrationResults.migrated_boards.push({
                    board_id: board.id,
                    board_name: board.name,
                    lists_count: board.lists?.length || 0
                  });
                  
                  // Also save individual board data if it has lists/cards
                  if (board.lists && board.lists.length > 0) {
                    await kv.set(`business:${businessId}:notes:board:${board.id}`, cleanBoard);
                  }
                  
                  migrationResults.success_count++;
                }
              }
            }
            
          } else if (candidate.data_structure === 'single_item' && sourceData.boards) {
            // Source data is an object containing a boards array
            console.log('🔄 Migrating single item with boards array');
            
            if (Array.isArray(sourceData.boards)) {
              for (const board of sourceData.boards) {
                if (board && board.id && board.name) {
                  const cleanBoard = {
                    id: board.id,
                    business_id: businessId,
                    name: board.name,
                    description: board.description || '',
                    color: board.color || 'blue',
                    lists: board.lists || [],
                    created_at: board.created_at || new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  };
                  
                  const existingBoard = migratedBoards.find((b: any) => b.id === board.id);
                  if (!existingBoard) {
                    migratedBoards.push(cleanBoard);
                    migrationResults.migrated_boards.push({
                      board_id: board.id,
                      board_name: board.name,
                      lists_count: board.lists?.length || 0
                    });
                    
                    if (board.lists && board.lists.length > 0) {
                      await kv.set(`business:${businessId}:notes:board:${board.id}`, cleanBoard);
                    }
                    
                    migrationResults.success_count++;
                  }
                }
              }
            }
            
          } else if (sourceData.name || sourceData.title) {
            // Source data is a single board/list/card
            console.log('🔄 Migrating single item as board');
            
            const boardId = sourceData.id || `migrated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const cleanBoard = {
              id: boardId,
              business_id: businessId,
              name: sourceData.name || sourceData.title || 'Migrated Board',
              description: sourceData.description || '',
              color: sourceData.color || 'blue',
              lists: sourceData.lists || [],
              created_at: sourceData.created_at || new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            
            const existingBoard = migratedBoards.find((b: any) => b.id === boardId);
            if (!existingBoard) {
              migratedBoards.push(cleanBoard);
              migrationResults.migrated_boards.push({
                board_id: boardId,
                board_name: cleanBoard.name,
                lists_count: cleanBoard.lists?.length || 0
              });
              
              if (cleanBoard.lists && cleanBoard.lists.length > 0) {
                await kv.set(`business:${businessId}:notes:board:${boardId}`, cleanBoard);
              }
              
              migrationResults.success_count++;
            }
          }
          
        } catch (error) {
          console.error('🔄 Migration error for:', candidate.source_key, error);
          migrationResults.errors.push({
            source_key: candidate.source_key,
            error: error.message
          });
        }
      }
      
      // Save the migrated boards array
      await kv.set(`business:${businessId}:notes:boards`, migratedBoards);
      
      console.log('🔄 Migration completed:', {
        total_processed: migrationResults.total_processed,
        success_count: migrationResults.success_count,
        errors: migrationResults.errors.length,
        final_boards_count: migratedBoards.length
      });
      
      return c.json({
        success: true,
        migration_results: migrationResults,
        final_boards_count: migratedBoards.length
      });
      
    } catch (error) {
      console.error('🔄 Migration endpoint error:', error);
      return new Response(`Migration error: ${error.message}`, { status: 500 });
    }
  });

  console.log('📝 Notes endpoints added successfully');
}