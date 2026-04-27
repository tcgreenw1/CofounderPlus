// Notes endpoints for Cofounder API Server
import { Hono } from 'npm:hono';
import * as kv from './kv_cache.tsx';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

// Helper function: Retry auth requests with exponential backoff
async function retryAuthRequest<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 500
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error as Error;
      const errorMessage = error?.message || String(error);
      
      // Check if it's a connection error that should be retried
      const shouldRetry = 
        errorMessage.includes('connection reset') ||
        errorMessage.includes('connection error') ||
        errorMessage.includes('ECONNRESET') ||
        errorMessage.includes('socket hang up') ||
        errorMessage.includes('network error') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('503') ||
        errorMessage.includes('502') ||
        errorMessage.includes('500');
      
      if (!shouldRetry || attempt === maxRetries - 1) {
        throw error;
      }
      
      // Exponential backoff
      const delay = initialDelay * Math.pow(2, attempt);
      console.log(`⚠️ Auth request failed (attempt ${attempt + 1}/${maxRetries}), retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError || new Error('Auth request failed after retries');
}

// Helper function to authenticate user tokens
async function authenticateUser(accessToken: string) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase configuration missing');
  }
  
  const authClient = createClient(
    SUPABASE_URL ?? '', 
    SUPABASE_ANON_KEY ?? ''
  );
  
  try {
    const { data: { user }, error: authError } = await retryAuthRequest(() => 
      authClient.auth.getUser(accessToken)
    );
    
    if (authError || !user) {
      console.error('❌ Auth error:', authError?.message);
      
      // Attempt manual JWT decode to see if it's an anon token
      try {
        const parts = accessToken.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          if (payload.role === 'anon') {
             console.error('❌ Anonymous token rejected');
          }
        }
      } catch (e) {
        // Ignore decode errors
      }
      
      return null;
    }
    return user;
  } catch (error: any) {
    console.error('❌ Auth exception:', error.message);
    return null;
  }
}

export function addNotesEndpoints(app: Hono) {
  console.log('📝 Adding notes endpoints...');

  // Get boards for a business
  app.get('/make-server-373d8b09/notes/boards', async (c: any) => {
    console.log('📝 Notes: Get boards endpoint called');
    try {
      const authHeader = c.req.header('Authorization');
      const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
      
      if (!accessToken || accessToken === 'undefined') {
        console.error('❌ No access token provided');
        return c.json({ success: false, error: 'Unauthorized', boards: [] }, 401);
      }
      
      // Get user ID from access token
      const user = await authenticateUser(accessToken);
      if (!user) {
        console.error('❌ Auth error: Invalid or expired token');
        return c.json({ success: false, error: 'Unauthorized', boards: [] }, 401);
      }
      const userId = user.id;
      
      const businessId = c.req.query('businessId');
      if (!businessId) {
        console.error('❌ No business ID provided');
        return c.json({ success: false, error: 'Business ID is required', boards: [] }, 400);
      }

      console.log('📝 Notes: Fetching boards for business:', businessId);
      const boards = await kv.get(`business:${userId}:${businessId}:notes:boards`) || [];
      
      // AUTO-FIX: Clean metadata and ensure detailed data exists
      let needsMetadataCleanup = false;
      let needsPositionFix = false;
      const cleanedBoards = [];
      
      for (let i = 0; i < boards.length; i++) {
        const board = boards[i];
        // Check if board has lists in metadata (corruption indicator)
        if (board.lists && Array.isArray(board.lists)) {
          console.log(`⚠️ Board ${board.id} has lists in metadata (corrupted) - fixing...`);
          needsMetadataCleanup = true;
          
          // Get or create detailed data with the lists
          const detailedData = await kv.get(`business:${userId}:${businessId}:notes:board:${board.id}`);
          if (!detailedData || !detailedData.lists || detailedData.lists.length === 0) {
            console.log(`💾 Restoring ${board.lists.length} lists to board ${board.id} details`);
            await kv.set(`business:${userId}:${businessId}:notes:board:${board.id}`, {
              ...board,
              lists: board.lists
            });
          }
        } else {
          // Ensure detailed data exists even for clean metadata
          const detailedData = await kv.get(`business:${userId}:${businessId}:notes:board:${board.id}`);
          if (!detailedData) {
            console.log(`📝 Notes: Initializing detailed data for board ${board.id}`);
            await kv.set(`business:${userId}:${businessId}:notes:board:${board.id}`, {
              ...board,
              lists: []
            });
          }
        }
        
        // Check if board has a position field, if not, add it based on current index
        const position = board.position !== undefined ? board.position : i;
        if (board.position === undefined) {
          needsPositionFix = true;
        }
        
        // Add clean metadata (no lists)
        cleanedBoards.push({
          id: board.id,
          business_id: board.business_id,
          name: board.name,
          description: board.description || '',
          color: board.color || 'blue',
          created_at: board.created_at,
          updated_at: board.updated_at,
          position: position
        });
      }
      
      // Sort boards by position
      cleanedBoards.sort((a, b) => a.position - b.position);
      
      // Save cleaned metadata if needed
      if (needsMetadataCleanup || needsPositionFix) {
        console.log('🔧 Saving cleaned board metadata (removed lists arrays, added positions)');
        await kv.set(`business:${userId}:${businessId}:notes:boards`, cleanedBoards);
      }
      
      console.log('📝 Notes: Found boards:', cleanedBoards.length);
      return c.json({ 
        success: true,
        boards: cleanedBoards,
        total: cleanedBoards.length,
        fixed: needsMetadataCleanup || needsPositionFix
      });

    } catch (error: any) {
      console.error('📝 Notes: Get boards error:', error);
      return new Response(`Error getting boards: ${error.message}`, { status: 500 });
    }
  });

  // Create a new board
  app.post('/make-server-373d8b09/notes/boards', async (c: any) => {
    console.log('📝 Notes: Create board endpoint called');
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
      
      const boardData = await c.req.json();
      const { businessId, name, description, color } = boardData;
      
      console.log('📝 Notes: Creating board with data:', { userId, businessId, name, description, color });
      
      if (!businessId || !name) {
        console.error('📝 Notes: Missing required fields - businessId:', businessId, 'name:', name);
        return new Response('Business ID and board name are required', { status: 400 });
      }

      const boardId = `board_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Get existing boards metadata to determine position
      const existingBoards = await kv.get(`business:${userId}:${businessId}:notes:boards`) || [];
      console.log('📝 Notes: Existing boards count:', existingBoards.length);
      
      // Create LIGHTWEIGHT metadata for the boards list (no lists array to avoid corruption)
      // New boards are added at position 0 (top of the list)
      const boardMetadata = {
        id: boardId,
        business_id: businessId,
        name: name.trim(),
        description: description?.trim() || '',
        color: color || 'blue',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        position: 0
      };
      
      // Create FULL board data with lists array for detailed storage
      const boardDetails = {
        ...boardMetadata,
        lists: []
      };
      
      // IMPORTANT: Clean existing boards to ensure they don't have lists arrays (prevent corruption)
      // and increment their positions since we're adding a new board at position 0
      const cleanedExistingBoards = existingBoards.map((b: any, index: number) => ({
        id: b.id,
        business_id: b.business_id,
        name: b.name,
        description: b.description || '',
        color: b.color || 'blue',
        created_at: b.created_at,
        updated_at: b.updated_at,
        position: (b.position !== undefined ? b.position : index) + 1
        // Explicitly exclude 'lists' to keep metadata lightweight
      }));
      
      // Add new board metadata to the list
      const updatedBoards = [boardMetadata, ...cleanedExistingBoards];
      
      console.log('📝 Notes: Saving', updatedBoards.length, 'boards to metadata');
      await kv.set(`business:${userId}:${businessId}:notes:boards`, updatedBoards);
      
      // Save the detailed board data with lists array
      console.log('📝 Notes: Saving detailed board data with empty lists array');
      await kv.set(`business:${userId}:${businessId}:notes:board:${boardId}`, boardDetails);
      
      console.log('📝 Notes: Board created successfully:', boardId);
      return c.json({ 
        success: true, 
        board: boardDetails,
        message: 'Board created successfully'
      });

    } catch (error: any) {
      console.error('📝 Notes: Create board error:', error);
      return new Response(`Error creating board: ${error.message}`, { status: 500 });
    }
  });

  // Get board details with lists and cards
  app.get('/make-server-373d8b09/notes/boards/:boardId/details', async (c: any) => {
    console.log('📝 Notes: Get board details endpoint called');
    try {
      const authHeader = c.req.header('Authorization');
      const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
      
      if (!accessToken || accessToken === 'undefined') {
        console.error('❌ No access token provided');
        return c.json({ success: false, error: 'Unauthorized' }, 401);
      }
      
      // Get user ID from access token
      const user = await authenticateUser(accessToken);
      if (!user) {
        console.error('❌ Auth error: Invalid or expired token');
        return c.json({ success: false, error: 'Unauthorized' }, 401);
      }
      const userId = user.id;
      
      const boardId = c.req.param('boardId');
      const businessId = c.req.query('businessId');
      
      if (!businessId) {
        return new Response('Business ID is required', { status: 400 });
      }

      console.log('📝 Notes: Fetching board details for board:', boardId, 'business:', businessId);
      
      // Get board data from database
      let boardData = await kv.get(`business:${userId}:${businessId}:notes:board:${boardId}`);
      
      // If detailed data doesn't exist, create it from metadata
      if (!boardData) {
        console.log('📝 Notes: Board details not found, checking metadata...');
        
        // Check if this is a temporary board (optimistic update)
        if (boardId.startsWith('temp-')) {
          console.log('⚠️ Temporary board detected:', boardId);
          console.log('This is an optimistic update that hasn\'t been saved yet.');
          console.log('Frontend should replace this with real board ID after API call completes.');
          return c.json({
            success: false,
            error: 'Temporary board not yet saved',
            isTemporary: true
          }, 404);
        }
        
        const boards = await kv.get(`business:${userId}:${businessId}:notes:boards`) || [];
        const boardMetadata = boards.find((b: any) => b.id === boardId);
        
        if (!boardMetadata) {
          console.error('❌ Board not found in metadata. BoardId:', boardId, 'BusinessId:', businessId, 'UserId:', userId);
          console.error('Available boards:', boards.map((b: any) => ({ id: b.id, name: b.name })));
          return new Response('Board not found', { status: 404 });
        }
        
        // Create detailed board data from metadata
        console.log('📝 Notes: Creating detailed board data from metadata for board:', boardMetadata.name);
        boardData = {
          ...boardMetadata,
          lists: []
        };
        
        // Save the detailed board data for future use
        await kv.set(`business:${userId}:${businessId}:notes:board:${boardId}`, boardData);
        console.log('✅ Detailed board data created and saved successfully');
      }

      console.log('📝 Notes: Board details found, lists:', boardData.lists?.length || 0);
      
      return c.json({ 
        success: true,
        board: boardData
      });

    } catch (error: any) {
      console.error('📝 Notes: Get board details error:', error);
      return new Response(`Error getting board details: ${error.message}`, { status: 500 });
    }
  });

  // Auto-recovery endpoint
  app.post('/make-server-373d8b09/notes/auto-recover', async (c: any) => {
    console.log('🔄 Notes: Auto-recovery endpoint called');
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
      
      const { businessId } = await c.req.json();
      
      if (!businessId) {
        return new Response('Business ID is required', { status: 400 });
      }

      console.log('🔄 Auto-recovery: Scanning boards for business:', businessId);
      
      // Get all boards for this business
      const boardsData = await kv.get(`business:${userId}:${businessId}:notes:boards`);
      
      if (!boardsData || !Array.isArray(boardsData)) {
        return c.json({ 
          success: false,
          message: 'No boards found for this business'
        });
      }

      const recoveryResults = [];
      let totalRecovered = 0;

      // Check each board for data loss
      for (const boardMeta of boardsData) {
        console.log(`🔍 Checking board: ${boardMeta.name} (${boardMeta.id})`);
        
        // Get current board detailed data
        const boardData = await kv.get(`business:${userId}:${businessId}:notes:board:${boardMeta.id}`);
        
        if (!boardData) {
          console.log(`⚠️ Board detailed data not found for ${boardMeta.id}, checking metadata...`);
          
          // If detailed data is missing but metadata exists, try to restore from metadata
          if (boardMeta.lists && boardMeta.lists.length > 0) {
            console.log(`✅ Found lists in board metadata! Restoring ${boardMeta.lists.length} lists`);
            await kv.set(`business:${userId}:${businessId}:notes:board:${boardMeta.id}`, boardMeta);
            
            totalRecovered++;
            recoveryResults.push({
              boardId: boardMeta.id,
              boardName: boardMeta.name,
              status: 'recovered',
              listsRestored: boardMeta.lists.length,
              cardsRestored: boardMeta.lists.reduce((acc: number, list: any) => 
                acc + (list.cards?.length || 0), 0
              ),
              recoverySource: 'board_metadata'
            });
          }
          continue;
        }

        const currentLists = boardData.lists || [];
        const currentCardCount = currentLists.reduce((acc: number, list: any) => 
          acc + (list.cards?.length || 0), 0
        );
        
        // Also check if metadata has lists that detailed data doesn't
        const metaLists = boardMeta.lists || [];
        const metaCardCount = metaLists.reduce((acc: number, list: any) => 
          acc + (list.cards?.length || 0), 0
        );

        // Check if this board looks corrupted in multiple ways:
        // 1. Detailed data has no lists but metadata has lists
        // 2. Detailed data has no lists but there's a backup with lists
        const detailedDataMissing = currentLists.length === 0 && metaLists.length > 0;
        const probablyCorrupted = currentLists.length === 0 && boardMeta.updated_at;
        
        if (detailedDataMissing) {
          console.log(`🔄 Board ${boardMeta.name} - detailed data missing lists but metadata has ${metaLists.length} lists!`);
          
          // Restore from metadata
          await kv.set(`business:${userId}:${businessId}:notes:board:${boardMeta.id}`, {
            ...boardData,
            lists: metaLists,
            updated_at: new Date().toISOString()
          });
          
          totalRecovered++;
          recoveryResults.push({
            boardId: boardMeta.id,
            boardName: boardMeta.name,
            status: 'recovered',
            listsRestored: metaLists.length,
            cardsRestored: metaCardCount,
            recoverySource: 'board_metadata'
          });
          
        } else if (probablyCorrupted) {
          console.log(`🔄 Board ${boardMeta.name} appears corrupted - attempting recovery from backup`);
          
          // Try to find backup versions
          const backupKey = `business:${userId}:${businessId}:notes:board:${boardMeta.id}:backup`;
          const backupData = await kv.get(backupKey);
          
          if (backupData && backupData.lists && backupData.lists.length > 0) {
            console.log(`✅ Found backup with ${backupData.lists.length} lists!`);
            
            // Restore from backup
            await kv.set(
              `business:${userId}:${businessId}:notes:board:${boardMeta.id}`,
              backupData
            );
            
            totalRecovered++;
            recoveryResults.push({
              boardId: boardMeta.id,
              boardName: boardMeta.name,
              status: 'recovered',
              listsRestored: backupData.lists.length,
              cardsRestored: backupData.lists.reduce((acc: number, list: any) => 
                acc + (list.cards?.length || 0), 0
              ),
              recoverySource: 'backup',
              backupTimestamp: backupData.updated_at
            });
          } else {
            console.log(`❌ No backup found for ${boardMeta.name}`);
            recoveryResults.push({
              boardId: boardMeta.id,
              boardName: boardMeta.name,
              status: 'no_backup',
              message: 'No backup or metadata available to restore from'
            });
          }
        } else {
          console.log(`✅ Board ${boardMeta.name} looks healthy (${currentLists.length} lists, ${currentCardCount} cards)`);
        }
      }

      return c.json({
        success: true,
        boardsScanned: boardsData.length,
        boardsRecovered: totalRecovered,
        results: recoveryResults
      });

    } catch (error: any) {
      console.error('🔄 Auto-recovery error:', error);
      return new Response(`Error during auto-recovery: ${error.message}`, { status: 500 });
    }
  });

  // Reorder boards - MUST be defined before /:boardId routes
  app.put('/make-server-373d8b09/notes/boards/reorder', async (c: any) => {
    console.log('📝 Notes: Reorder boards endpoint called');
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
      
      const { businessId, boardIds } = await c.req.json();
      
      if (!businessId || !boardIds || !Array.isArray(boardIds)) {
        return new Response('Business ID and board IDs array are required', { status: 400 });
      }

      console.log('📝 Notes: Reordering boards for business:', businessId, 'New order:', boardIds);

      // Get existing boards
      const existingBoards = await kv.get(`business:${userId}:${businessId}:notes:boards`) || [];
      
      // Create a map of existing boards for quick lookup
      const boardMap = new Map();
      existingBoards.forEach((board: any) => {
        boardMap.set(board.id, board);
      });
      
      // Reorder boards according to the new order, adding position field
      const reorderedBoards = boardIds.map((boardId: string, index: number) => {
        const board = boardMap.get(boardId);
        if (!board) {
          console.error('📝 Notes: Board not found in reorder:', boardId);
          return null;
        }
        return {
          id: board.id,
          business_id: board.business_id,
          name: board.name,
          description: board.description || '',
          color: board.color || 'blue',
          created_at: board.created_at,
          updated_at: board.updated_at,
          position: index
        };
      }).filter(Boolean); // Remove null entries
      
      console.log('📝 Notes: Saving reordered boards with positions');
      await kv.set(`business:${userId}:${businessId}:notes:boards`, reorderedBoards);
      
      console.log('📝 Notes: Boards reordered successfully');
      return c.json({ 
        success: true, 
        message: 'Boards reordered successfully',
        boards: reorderedBoards
      });

    } catch (error: any) {
      console.error('📝 Notes: Reorder boards error:', error);
      return new Response(`Error reordering boards: ${error.message}`, { status: 500 });
    }
  });

  // Get board with backup history
  app.get('/make-server-373d8b09/notes/boards/:boardId/history', async (c: any) => {
    console.log('📝 Notes: Get board history endpoint called');
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

      console.log('📝 Notes: Fetching board history for board:', boardId);
      
      // Get current board data
      const currentData = await kv.get(`business:${userId}:${businessId}:notes:board:${boardId}`);
      
      // Get backup data
      const backupData = await kv.get(`business:${userId}:${businessId}:notes:board:${boardId}:backup`);
      
      return c.json({
        success: true,
        current: currentData ? {
          lists: currentData.lists?.length || 0,
          cards: currentData.lists?.reduce((acc: number, list: any) => acc + (list.cards?.length || 0), 0) || 0,
          updated_at: currentData.updated_at
        } : null,
        backup: backupData ? {
          lists: backupData.lists?.length || 0,
          cards: backupData.lists?.reduce((acc: number, list: any) => acc + (list.cards?.length || 0), 0) || 0,
          updated_at: backupData.updated_at
        } : null,
        hasBackup: !!backupData
      });

    } catch (error: any) {
      console.error('📝 Notes: Get board history error:', error);
      return new Response(`Error getting board history: ${error.message}`, { status: 500 });
    }
  });

  // Restore board from backup
  app.post('/make-server-373d8b09/notes/boards/:boardId/restore', async (c: any) => {
    console.log('🔄 Notes: Restore board from backup endpoint called');
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
      const { businessId } = await c.req.json();
      
      if (!businessId) {
        return new Response('Business ID is required', { status: 400 });
      }

      console.log('🔄 Restoring board from backup:', boardId);
      
      // Get backup data
      const backupData = await kv.get(`business:${userId}:${businessId}:notes:board:${boardId}:backup`);
      
      if (!backupData) {
        return new Response('No backup found for this board', { status: 404 });
      }

      // Restore from backup
      await kv.set(
        `business:${userId}:${businessId}:notes:board:${boardId}`,
        backupData
      );
      
      console.log('✅ Board restored from backup successfully');
      
      return c.json({
        success: true,
        board: backupData,
        listsRestored: backupData.lists?.length || 0,
        cardsRestored: backupData.lists?.reduce((acc: number, list: any) => acc + (list.cards?.length || 0), 0) || 0
      });

    } catch (error: any) {
      console.error('🔄 Restore board error:', error);
      return new Response(`Error restoring board: ${error.message}`, { status: 500 });
    }
  });

  // Get RAW board data for recovery (includes all data exactly as stored)
  app.get('/make-server-373d8b09/notes/boards/:boardId/raw', async (c: any) => {
    console.log('📝 Notes: Get RAW board data endpoint called');
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

      console.log('📝 Notes: Fetching RAW board data for board:', boardId, 'business:', businessId);
      
      // Get board data from database - EXACTLY as stored
      const boardData = await kv.get(`business:${userId}:${businessId}:notes:board:${boardId}`);
      
      if (!boardData) {
        return new Response('Board not found', { status: 404 });
      }

      console.log('📝 Notes: RAW Board data retrieved');
      console.log('📝 Lists in data:', boardData.lists?.length || 0);
      console.log('📝 Board structure:', Object.keys(boardData));
      
      return c.json({ 
        success: true,
        board: boardData,
        storageKey: `business:${userId}:${businessId}:notes:board:${boardId}`,
        metadata: {
          userId,
          businessId,
          boardId,
          hasLists: !!boardData.lists,
          listsCount: boardData.lists?.length || 0,
          totalCards: boardData.lists?.reduce((acc: number, list: any) => acc + (list.cards?.length || 0), 0) || 0,
        }
      });

    } catch (error: any) {
      console.error('📝 Notes: Get RAW board data error:', error);
      return new Response(`Error getting RAW board data: ${error.message}`, { status: 500 });
    }
  });

  // Create a new list
  app.post('/make-server-373d8b09/notes/lists', async (c: any) => {
    console.log('📝 Notes: Create list endpoint called');
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
      
      const listData = await c.req.json();
      const { businessId, boardId, name, position } = listData;
      
      if (!businessId || !boardId || !name) {
        return new Response('Business ID, board ID, and name are required', { status: 400 });
      }

      const listId = `list_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newList = {
        id: listId,
        boardId,
        name: name.trim(),
        position: position || 0,
        cards: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Get current board data
      const boardData = await kv.get(`business:${userId}:${businessId}:notes:board:${boardId}`) || { lists: [] };
      
      // BACKUP: Save current state before adding list
      const backupKey = `business:${userId}:${businessId}:notes:board:${boardId}:backup`;
      await kv.set(backupKey, {
        ...boardData,
        backedUpAt: new Date().toISOString()
      });
      console.log(`💾 Created backup before adding list to board ${boardId}`);
      
      // Add the new list
      boardData.lists = boardData.lists || [];
      boardData.lists.push(newList);
      boardData.updated_at = new Date().toISOString();
      
      // Save updated board data
      await kv.set(`business:${userId}:${businessId}:notes:board:${boardId}`, boardData);
      
      console.log('📝 Notes: List created successfully:', listId);
      return c.json({ 
        success: true, 
        list: newList,
        message: 'List created successfully'
      });

    } catch (error: any) {
      console.error('📝 Notes: Create list error:', error);
      return new Response(`Error creating list: ${error.message}`, { status: 500 });
    }
  });

  // Create a new card
  app.post('/make-server-373d8b09/notes/cards', async (c: any) => {
    console.log('📝 Notes: Create card endpoint called');
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
      const boardData = await kv.get(`business:${userId}:${businessId}:notes:board:${boardId}`) || { lists: [] };
      
      // Find the target list and add the card
      const listIndex = boardData.lists.findIndex((list: any) => list.id === listId);
      if (listIndex === -1) {
        return new Response('List not found', { status: 404 });
      }
      
      // BACKUP: Save current state before adding card
      const backupKey = `business:${userId}:${businessId}:notes:board:${boardId}:backup`;
      await kv.set(backupKey, {
        ...boardData,
        backedUpAt: new Date().toISOString()
      });
      console.log(`💾 Created backup before adding card to board ${boardId}`);
      
      boardData.lists[listIndex].cards = boardData.lists[listIndex].cards || [];
      boardData.lists[listIndex].cards.push(newCard);
      boardData.lists[listIndex].updated_at = new Date().toISOString();
      boardData.updated_at = new Date().toISOString();
      
      // Save updated board data
      await kv.set(`business:${userId}:${businessId}:notes:board:${boardId}`, boardData);
      
      console.log('📝 Notes: Card created successfully:', cardId);
      return c.json({ 
        success: true, 
        card: newCard,
        message: 'Card created successfully'
      });

    } catch (error: any) {
      console.error('📝 Notes: Create card error:', error);
      return new Response(`Error creating card: ${error.message}`, { status: 500 });
    }
  });

  // Update a card (for drag and drop, completion, etc.)
  app.put('/make-server-373d8b09/notes/cards/:cardId', async (c: any) => {
    console.log('📝 Notes: Update card endpoint called');
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
      
      const cardId = c.req.param('cardId');
      const updateData = await c.req.json();
      const { businessId, boardId, listId } = updateData;
      
      if (!businessId || !boardId) {
        return new Response('Business ID and board ID are required', { status: 400 });
      }

      console.log(`📝 Notes: Updating card ${cardId} - Moving to list ${listId || 'unknown'}`);

      // Get current board data with error handling
      let boardData: any;
      try {
        boardData = await kv.get(`business:${userId}:${businessId}:notes:board:${boardId}`);
      } catch (kvError) {
        console.error(`❌ KV get failed for board ${boardId}:`, kvError);
        boardData = null;
      }
      
      // Ensure board data has proper structure
      if (!boardData || typeof boardData !== 'object') {
        console.error(`📝 Notes: Invalid board data for ${boardId}, initializing empty structure`);
        boardData = { lists: [] };
      }
      
      if (!Array.isArray(boardData.lists)) {
        console.error(`📝 Notes: Board ${boardId} has invalid lists array, initializing`);
        boardData.lists = [];
      }
      
      // Ensure each list has a cards array
      boardData.lists = boardData.lists.map((list: any) => ({
        ...list,
        cards: Array.isArray(list.cards) ? list.cards : []
      }));
      
      // Find the card and remove it from its current list
      let cardToMove: any = null;
      let oldListId: string | null = null;
      
      for (const list of boardData.lists) {
        const cardIndex = list.cards.findIndex((card: any) => card.id === cardId);
        if (cardIndex !== -1) {
          cardToMove = list.cards[cardIndex];
          oldListId = list.id;
          // Remove card from old list
          list.cards.splice(cardIndex, 1);
          console.log(`📝 Notes: Removed card from list ${oldListId}`);
          break;
        }
      }
      
      if (!cardToMove) {
        console.error(`📝 Notes: Card ${cardId} not found in any list`);
        return new Response('Card not found', { status: 404 });
      }
      
      // Update the card with new data
      const updatedCard = {
        ...cardToMove,
        ...updateData,
        id: cardId, // Preserve the original ID
        updated_at: new Date().toISOString()
      };
      
      // Add card to the target list (which might be the same list or a different one)
      const targetListId = listId || oldListId;
      let targetListFound = false;
      
      for (const list of boardData.lists) {
        if (list.id === targetListId) {
          list.cards.push(updatedCard);
          targetListFound = true;
          console.log(`📝 Notes: Added card to list ${targetListId}`);
          break;
        }
      }
      
      if (!targetListFound) {
        console.error(`📝 Notes: Target list ${targetListId} not found`);
        return new Response('Target list not found', { status: 404 });
      }
      
      boardData.updated_at = new Date().toISOString();
      
      // Save updated board data
      await kv.set(`business:${userId}:${businessId}:notes:board:${boardId}`, boardData);
      
      console.log(`📝 Notes: Card ${cardId} successfully moved from ${oldListId} to ${targetListId}`);
      return c.json({ 
        success: true, 
        message: 'Card updated successfully',
        card: updatedCard
      });

    } catch (error: any) {
      console.error('📝 Notes: Update card error:', error);
      return new Response(`Error updating card: ${error.message}`, { status: 500 });
    }
  });

  // Update entire board data (for drag and drop operations)
  app.put('/make-server-373d8b09/notes/boards/:boardId', async (c: any) => {
    console.log('📝 Notes: Update board endpoint called');
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
      const updateData = await c.req.json();
      const { businessId, boardData, name, description, color } = updateData;
      
      if (!businessId) {
        return new Response('Business ID is required', { status: 400 });
      }

      // Get current board data FIRST for backup
      const currentBoardData = await kv.get(`business:${userId}:${businessId}:notes:board:${boardId}`);
      
      // BACKUP: Save current state before updating (if it has data)
      if (currentBoardData && currentBoardData.lists && currentBoardData.lists.length > 0) {
        const backupKey = `business:${userId}:${businessId}:notes:board:${boardId}:backup`;
        await kv.set(backupKey, {
          ...currentBoardData,
          backedUpAt: new Date().toISOString()
        });
        console.log(`💾 Created backup for board ${boardId} with ${currentBoardData.lists.length} lists`);
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
        const existingBoardData = await kv.get(`business:${userId}:${businessId}:notes:board:${boardId}`) || {};
        const existingBoards = await kv.get(`business:${userId}:${businessId}:notes:boards`) || [];
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
        
        // Also update the board in the boards list (keeping metadata lightweight - NO lists array)
        const updatedBoards = existingBoards.map((b: any) => 
          b.id === boardId 
            ? { 
                id: b.id,
                business_id: b.business_id,
                name: updatedBoardData.name, 
                description: updatedBoardData.description, 
                color: updatedBoardData.color, 
                created_at: b.created_at,
                updated_at: updatedBoardData.updated_at
                // Explicitly exclude 'lists' to prevent corruption
              }
            : {
                id: b.id,
                business_id: b.business_id,
                name: b.name,
                description: b.description || '',
                color: b.color || 'blue',
                created_at: b.created_at,
                updated_at: b.updated_at
                // Explicitly exclude 'lists' to prevent corruption
              }
        );
        await kv.set(`business:${userId}:${businessId}:notes:boards`, updatedBoards);
      } else {
        return new Response('Either boardData or board properties (name/description/color) are required', { status: 400 });
      }
      
      // Save updated board data
      await kv.set(`business:${userId}:${businessId}:notes:board:${boardId}`, updatedBoardData);
      
      console.log('📝 Notes: Board updated successfully:', boardId);
      return c.json({ 
        success: true, 
        board: updatedBoardData,
        message: 'Board updated successfully'
      });

    } catch (error: any) {
      console.error('📝 Notes: Update board error:', error);
      return new Response(`Error updating board: ${error.message}`, { status: 500 });
    }
  });

  // Update list (rename)
  app.put('/make-server-373d8b09/notes/lists/:listId', async (c: any) => {
    console.log('📝 Notes: Update list endpoint called');
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
      
      const listId = c.req.param('listId');
      const updateData = await c.req.json();
      const { businessId, boardId, name, position } = updateData;
      
      if (!businessId || !boardId) {
        return new Response('Business ID and board ID are required', { status: 400 });
      }

      // Get current board data
      const boardData = await kv.get(`business:${userId}:${businessId}:notes:board:${boardId}`) || { lists: [] };
      
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
      
      boardData.lists[listIndex].updated_at = new Date().toISOString();
      
      boardData.updated_at = new Date().toISOString();
      
      // Save updated board data
      await kv.set(`business:${userId}:${businessId}:notes:board:${boardId}`, boardData);
      
      console.log('📝 Notes: List updated successfully:', listId);
      return c.json({ 
        success: true, 
        message: 'List updated successfully'
      });

    } catch (error: any) {
      console.error('📝 Notes: Update list error:', error);
      return new Response(`Error updating list: ${error.message}`, { status: 500 });
    }
  });

  // Delete a card
  app.delete('/make-server-373d8b09/notes/cards/:cardId', async (c: any) => {
    console.log('📝 Notes: Delete card endpoint called');
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
      
      const cardId = c.req.param('cardId');
      const businessId = c.req.query('businessId');
      const boardId = c.req.query('boardId');
      
      if (!businessId || !boardId) {
        return new Response('Business ID and board ID are required', { status: 400 });
      }

      // Get current board data
      const boardData = await kv.get(`business:${userId}:${businessId}:notes:board:${boardId}`) || { lists: [] };
      
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
      await kv.set(`business:${userId}:${businessId}:notes:board:${boardId}`, boardData);
      
      console.log('📝 Notes: Card deleted successfully:', cardId);
      return c.json({ 
        success: true, 
        message: 'Card deleted successfully'
      });

    } catch (error: any) {
      console.error('📝 Notes: Delete card error:', error);
      return new Response(`Error deleting card: ${error.message}`, { status: 500 });
    }
  });

  // Delete a list
  app.delete('/make-server-373d8b09/notes/lists/:listId', async (c: any) => {
    console.log('📝 Notes: Delete list endpoint called');
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
      
      const listId = c.req.param('listId');
      const businessId = c.req.query('businessId');
      const boardId = c.req.query('boardId');
      
      if (!businessId || !boardId) {
        return new Response('Business ID and board ID are required', { status: 400 });
      }

      // Get current board data
      const boardData = await kv.get(`business:${userId}:${businessId}:notes:board:${boardId}`) || { lists: [] };
      
      // Find and remove the list
      const listIndex = boardData.lists.findIndex((list: any) => list.id === listId);
      if (listIndex === -1) {
        return new Response('List not found', { status: 404 });
      }
      
      // BACKUP: Save current state before deleting list
      const backupKey = `business:${userId}:${businessId}:notes:board:${boardId}:backup`;
      await kv.set(backupKey, {
        ...boardData,
        backedUpAt: new Date().toISOString()
      });
      console.log(`💾 Created backup before deleting list from board ${boardId}`);
      
      boardData.lists.splice(listIndex, 1);
      boardData.updated_at = new Date().toISOString();
      
      // Save updated board data
      await kv.set(`business:${userId}:${businessId}:notes:board:${boardId}`, boardData);
      
      console.log('📝 Notes: List deleted successfully:', listId);
      return c.json({ 
        success: true, 
        message: 'List deleted successfully'
      });

    } catch (error: any) {
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
}