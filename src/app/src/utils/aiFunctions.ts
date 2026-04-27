import { supabase } from './supabase/client';
import { projectId } from './supabase/info';

// Import advanced functions
import {
  generateBusinessInsights,
  getBusinessMetrics,
  setBusinessGoal,
  getBusinessGoals,
  updateGoalProgress,
  searchBusinessData,
  generateBusinessReport,
  exportBusinessData,
  createNotification,
  getNotifications,
  sendPushNotification,
  registerDeviceForNotifications,
  getScheduledPushNotifications
} from './aiAdvancedFunctions';

// Define the available functions the AI can call
export interface AIFunction {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
  handler: (params: any, context: AIFunctionContext) => Promise<any>;
}

export interface AIFunctionContext {
  userId: string;
  businessId?: string;
  accessToken: string;
}

// Function to update business information
const updateBusinessInfo: AIFunction = {
  name: "update_business_info",
  description: "Update business information including name, description, industry, or stage when the user requests changes to their business details",
  parameters: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "New business name to update to"
      },
      description: {
        type: "string", 
        description: "New business description to update to"
      },
      industry: {
        type: "string",
        description: "New business industry to update to"
      },
      stage: {
        type: "string",
        description: "New business stage to update to (e.g., 'idea', 'startup', 'growth', 'mature')"
      }
    },
    required: []
  },
  handler: async (params, context) => {
    try {
      if (!context.businessId) {
        return {
          success: false,
          error: 'No business selected. Please select a business first to update its information.'
        };
      }

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/businesses/${context.businessId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${context.accessToken}`
        },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `API request failed with status ${response.status}`);
      }

      const result = await response.json();

      let updateMessage = 'Successfully updated business information';
      if (params.name) {
        updateMessage += ` - Business name changed to "${params.name}"`;
      }
      if (params.description) {
        updateMessage += ` - Description updated`;
      }
      if (params.industry) {
        updateMessage += ` - Industry set to "${params.industry}"`;
      }
      if (params.stage) {
        updateMessage += ` - Stage set to "${params.stage}"`;
      }

      return {
        success: true,
        message: updateMessage,
        data: result.business || result
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }
};

// Function to create a board
const createBoard: AIFunction = {
  name: "create_board",
  description: "Create a new notes board for organizing tasks, ideas, or information",
  parameters: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Name of the board (e.g., 'Marketing Strategy', 'Product Roadmap')"
      },
      description: {
        type: "string",
        description: "Optional description of the board's purpose"
      },
      color: {
        type: "string",
        description: "Board color (blue, green, red, purple, orange, pink)"
      }
    },
    required: ["name"]
  },
  handler: async (params, context) => {
    try {
      if (!context.businessId) {
        return { success: false, error: 'No business selected' };
      }

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notes/boards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${context.accessToken}`
        },
        body: JSON.stringify({
          businessId: context.businessId,
          name: params.name,
          description: params.description || '',
          color: params.color || 'blue'
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create board: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        message: `Created board "${params.name}" successfully!`,
        data: result.board
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// Function to create a list
const createList: AIFunction = {
  name: "create_list",
  description: "Create a new list within a board to organize cards/tasks",
  parameters: {
    type: "object",
    properties: {
      boardId: {
        type: "string",
        description: "ID of the board to add the list to"
      },
      name: {
        type: "string",
        description: "Name of the list (e.g., 'To Do', 'In Progress', 'Done')"
      }
    },
    required: ["boardId", "name"]
  },
  handler: async (params, context) => {
    try {
      if (!context.businessId) {
        return { success: false, error: 'No business selected' };
      }

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notes/lists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${context.accessToken}`
        },
        body: JSON.stringify({
          businessId: context.businessId,
          boardId: params.boardId,
          name: params.name
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create list: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        message: `Created list "${params.name}" successfully!`,
        data: result.list
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// Function to create a card
const createCard: AIFunction = {
  name: "create_card",
  description: "Create a new card/task/note within a list",
  parameters: {
    type: "object",
    properties: {
      boardId: {
        type: "string",
        description: "ID of the board"
      },
      listId: {
        type: "string",
        description: "ID of the list to add the card to"
      },
      title: {
        type: "string",
        description: "Title of the card/task"
      },
      description: {
        type: "string",
        description: "Optional detailed description or notes"
      },
      priority: {
        type: "string",
        description: "Priority level: low, medium, or high"
      }
    },
    required: ["boardId", "listId", "title"]
  },
  handler: async (params, context) => {
    try {
      if (!context.businessId) {
        return { success: false, error: 'No business selected' };
      }

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notes/cards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${context.accessToken}`
        },
        body: JSON.stringify({
          businessId: context.businessId,
          boardId: params.boardId,
          listId: params.listId,
          title: params.title,
          description: params.description || '',
          priority: params.priority || 'medium'
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create card: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        message: `Created card "${params.title}" successfully!`,
        data: result.card
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// Function to get all boards
const getBoards: AIFunction = {
  name: "get_boards",
  description: "Get all notes boards for the current business to see what boards exist",
  parameters: {
    type: "object",
    properties: {},
    required: []
  },
  handler: async (params, context) => {
    try {
      if (!context.businessId) {
        return { success: false, error: 'No business selected' };
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notes/boards?businessId=${context.businessId}`,
        {
          headers: {
            'Authorization': `Bearer ${context.accessToken}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get boards: ${response.status}`);
      }

      const result = await response.json();
      const boards = result.boards || [];
      
      return {
        success: true,
        message: `Found ${boards.length} board(s)`,
        data: boards.map((b: any) => ({
          id: b.id,
          name: b.name,
          description: b.description,
          color: b.color,
          listsCount: b.lists?.length || 0
        }))
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// Function to get board details
const getBoardDetails: AIFunction = {
  name: "get_board_details",
  description: "Get detailed information about a specific board including all its lists and cards",
  parameters: {
    type: "object",
    properties: {
      boardId: {
        type: "string",
        description: "ID of the board to get details for"
      }
    },
    required: ["boardId"]
  },
  handler: async (params, context) => {
    try {
      if (!context.businessId) {
        return { success: false, error: 'No business selected' };
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notes/boards/${params.boardId}/details?businessId=${context.businessId}`,
        {
          headers: {
            'Authorization': `Bearer ${context.accessToken}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get board details: ${response.status}`);
      }

      const result = await response.json();
      const board = result.board;
      
      return {
        success: true,
        message: `Board "${board.name}" has ${board.lists?.length || 0} list(s)`,
        data: {
          id: board.id,
          name: board.name,
          description: board.description,
          lists: board.lists?.map((list: any) => ({
            id: list.id,
            name: list.name,
            cardsCount: list.cards?.length || 0,
            cards: list.cards?.map((card: any) => ({
              id: card.id,
              title: card.title,
              description: card.description,
              priority: card.priority,
              completed: card.completed
            }))
          }))
        }
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// Function to update a board
const updateBoard: AIFunction = {
  name: "update_board",
  description: "Update a board's name, description, or color",
  parameters: {
    type: "object",
    properties: {
      boardId: {
        type: "string",
        description: "ID of the board to update"
      },
      name: {
        type: "string",
        description: "New name for the board"
      },
      description: {
        type: "string",
        description: "New description for the board"
      },
      color: {
        type: "string",
        description: "New color for the board (blue, green, red, purple, orange, pink)"
      }
    },
    required: ["boardId"]
  },
  handler: async (params, context) => {
    try {
      if (!context.businessId) {
        return { success: false, error: 'No business selected' };
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notes/boards/${params.boardId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${context.accessToken}`
          },
          body: JSON.stringify({
            businessId: context.businessId,
            name: params.name,
            description: params.description,
            color: params.color
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update board: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        message: `Board updated successfully!`,
        data: result.board
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// Function to update a list
const updateList: AIFunction = {
  name: "update_list",
  description: "Update a list's name",
  parameters: {
    type: "object",
    properties: {
      boardId: {
        type: "string",
        description: "ID of the board containing the list"
      },
      listId: {
        type: "string",
        description: "ID of the list to update"
      },
      name: {
        type: "string",
        description: "New name for the list"
      }
    },
    required: ["boardId", "listId", "name"]
  },
  handler: async (params, context) => {
    try {
      if (!context.businessId) {
        return { success: false, error: 'No business selected' };
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notes/lists/${params.listId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${context.accessToken}`
          },
          body: JSON.stringify({
            businessId: context.businessId,
            boardId: params.boardId,
            name: params.name
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update list: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        message: `List renamed to "${params.name}" successfully!`,
        data: result.list
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// Function to update a card
const updateCard: AIFunction = {
  name: "update_card",
  description: "Update a card's title, description, priority, or completion status",
  parameters: {
    type: "object",
    properties: {
      boardId: {
        type: "string",
        description: "ID of the board containing the card"
      },
      cardId: {
        type: "string",
        description: "ID of the card to update"
      },
      title: {
        type: "string",
        description: "New title for the card"
      },
      description: {
        type: "string",
        description: "New description for the card"
      },
      priority: {
        type: "string",
        description: "New priority: low, medium, or high"
      },
      completed: {
        type: "boolean",
        description: "Mark card as completed (true) or incomplete (false)"
      }
    },
    required: ["boardId", "cardId"]
  },
  handler: async (params, context) => {
    try {
      if (!context.businessId) {
        return { success: false, error: 'No business selected' };
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notes/cards/${params.cardId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${context.accessToken}`
          },
          body: JSON.stringify({
            businessId: context.businessId,
            boardId: params.boardId,
            title: params.title,
            description: params.description,
            priority: params.priority,
            completed: params.completed
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update card: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        message: `Card updated successfully!`,
        data: result
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// Function to delete a board
const deleteBoard: AIFunction = {
  name: "delete_board",
  description: "Delete a board and all its lists and cards",
  parameters: {
    type: "object",
    properties: {
      boardId: {
        type: "string",
        description: "ID of the board to delete"
      }
    },
    required: ["boardId"]
  },
  handler: async (params, context) => {
    try {
      if (!context.businessId) {
        return { success: false, error: 'No business selected' };
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notes/boards/${params.boardId}?businessId=${context.businessId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${context.accessToken}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete board: ${response.status}`);
      }

      return {
        success: true,
        message: `Board deleted successfully!`
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// Function to delete a list
const deleteList: AIFunction = {
  name: "delete_list",
  description: "Delete a list and all its cards",
  parameters: {
    type: "object",
    properties: {
      boardId: {
        type: "string",
        description: "ID of the board containing the list"
      },
      listId: {
        type: "string",
        description: "ID of the list to delete"
      }
    },
    required: ["boardId", "listId"]
  },
  handler: async (params, context) => {
    try {
      if (!context.businessId) {
        return { success: false, error: 'No business selected' };
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notes/lists/${params.listId}?businessId=${context.businessId}&boardId=${params.boardId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${context.accessToken}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete list: ${response.status}`);
      }

      return {
        success: true,
        message: `List deleted successfully!`
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// Function to delete a card
const deleteCard: AIFunction = {
  name: "delete_card",
  description: "Delete a card from a list",
  parameters: {
    type: "object",
    properties: {
      boardId: {
        type: "string",
        description: "ID of the board containing the card"
      },
      cardId: {
        type: "string",
        description: "ID of the card to delete"
      }
    },
    required: ["boardId", "cardId"]
  },
  handler: async (params, context) => {
    try {
      if (!context.businessId) {
        return { success: false, error: 'No business selected' };
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notes/cards/${params.cardId}?businessId=${context.businessId}&boardId=${params.boardId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${context.accessToken}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete card: ${response.status}`);
      }

      return {
        success: true,
        message: `Card deleted successfully!`
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// Function to get roadmap progress
const getRoadmapProgress: AIFunction = {
  name: "get_roadmap_progress",
  description: "Get the user's progress on their current business roadmap, including completed tasks, milestones, XP, and current position",
  parameters: {
    type: "object",
    properties: {},
    required: []
  },
  handler: async (params, context) => {
    try {
      if (!context.businessId) {
        return { success: false, error: 'No business selected' };
      }

      // First get the business to find their roadmap ID
      const businessResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/businesses/${context.businessId}`,
        {
          headers: {
            'Authorization': `Bearer ${context.accessToken}`
          }
        }
      );

      if (!businessResponse.ok) {
        throw new Error('Failed to fetch business details');
      }

      const businessData = await businessResponse.json();
      const roadmapId = businessData.business?.industry_id || businessData.business?.industry;

      if (!roadmapId) {
        return {
          success: false,
          error: 'No roadmap assigned to this business yet'
        };
      }

      // Get roadmap progress
      const progressResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/roadmap/progress/${roadmapId}?businessId=${context.businessId}`,
        {
          headers: {
            'Authorization': `Bearer ${context.accessToken}`
          }
        }
      );

      if (!progressResponse.ok) {
        throw new Error('Failed to fetch roadmap progress');
      }

      const progress = await progressResponse.json();

      // Calculate summary stats
      const completedTasksCount = progress.completedTasks?.length || 0;
      const completedMilestonesCount = progress.completedMilestones?.length || 0;
      const totalXP = progress.totalXP || 0;
      const currentStreak = progress.currentStreak || 0;

      return {
        success: true,
        message: `Roadmap progress loaded: ${completedTasksCount} tasks completed, ${completedMilestonesCount} milestones completed, ${totalXP} XP earned`,
        data: {
          roadmapId,
          completedTasks: progress.completedTasks || [],
          completedMilestones: progress.completedMilestones || [],
          totalXP,
          currentStreak,
          longestStreak: progress.longestStreak || 0,
          lastActiveDate: progress.lastActiveDate
        }
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// Function to get proof locker documents
const getProofLockerDocuments: AIFunction = {
  name: "get_proof_locker_documents",
  description: "Get all proof locker documents and evidence for the current business to help reference user's completed tasks, achievements, and uploaded documents",
  parameters: {
    type: "object",
    properties: {},
    required: []
  },
  handler: async (params, context) => {
    try {
      if (!context.businessId) {
        return { 
          success: false, 
          error: 'No business selected. Please select a business first to view proof locker documents.' 
        };
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/user-evidence/${context.businessId}`,
        {
          headers: {
            'Authorization': `Bearer ${context.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch proof locker documents: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success || !result.evidence) {
        return {
          success: true,
          message: 'No proof locker documents found yet',
          data: {
            documents: [],
            count: 0
          }
        };
      }

      // Convert evidence to a more readable format
      const documents: any[] = [];
      Object.entries(result.evidence).forEach(([taskId, evidenceFiles]: [string, any[]]) => {
        evidenceFiles.forEach((evidence) => {
          documents.push({
            taskId,
            fileName: evidence.fileName,
            fileType: evidence.fileType,
            fileSize: evidence.fileSize,
            evidenceType: evidence.evidenceType,
            uploadedAt: evidence.uploadedAt,
            url: evidence.signedUrl
          });
        });
      });

      return {
        success: true,
        message: `Found ${documents.length} proof locker document${documents.length !== 1 ? 's' : ''}`,
        data: {
          documents,
          count: documents.length,
          businessId: context.businessId
        }
      };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message 
      };
    }
  }
};

// Function to get all available roadmaps
const getAllRoadmaps: AIFunction = {
  name: "get_all_roadmaps",
  description: "Get information about all available business roadmaps to provide recommendations and advice",
  parameters: {
    type: "object",
    properties: {},
    required: []
  },
  handler: async (params, context) => {
    try {
      // Import roadmap data dynamically
      const roadmaps = [
        { id: 'dropshipping-ecommerce', title: 'Dropshipping & E-commerce', description: 'Start an online store without inventory', difficulty: 'beginner' },
        { id: 'beauty-wellness', title: 'Beauty & Wellness', description: 'Beauty products and wellness services', difficulty: 'beginner' },
        { id: 'jewelry-luxury', title: 'Jewelry & Luxury', description: 'High-end jewelry and luxury goods', difficulty: 'intermediate' },
        { id: 'subscription-box', title: 'Subscription Box', description: 'Curated subscription box service', difficulty: 'intermediate' },
        { id: 'food-truck', title: 'Food Truck', description: 'Mobile food service business', difficulty: 'intermediate' },
        { id: 'real-estate', title: 'Real Estate', description: 'Property investment and rental', difficulty: 'advanced' },
        { id: 'automotive-mobile', title: 'Automotive Mobile Services', description: 'Mobile car repair and detailing', difficulty: 'intermediate' },
        { id: 'it-msp', title: 'IT & Managed Services', description: 'Technology services for businesses', difficulty: 'advanced' },
        { id: 'pet-grooming', title: 'Pet Grooming', description: 'Pet care and grooming services', difficulty: 'beginner' },
        { id: 'courier-logistics', title: 'Courier & Logistics', description: 'Delivery and logistics services', difficulty: 'intermediate' },
        { id: 'smma-lite', title: 'Social Media Marketing Agency', description: 'Digital marketing for small businesses', difficulty: 'beginner' },
        { id: 'airbnb-cohost', title: 'Airbnb Co-hosting', description: 'Short-term rental management', difficulty: 'beginner' },
        { id: 'online-tutoring', title: 'Online Tutoring', description: 'Virtual education services', difficulty: 'beginner' },
        { id: 'bookkeeping-tax', title: 'Bookkeeping & Tax', description: 'Financial services for small businesses', difficulty: 'intermediate' },
        { id: 'legal-document', title: 'Legal Document Services', description: 'Document preparation and paralegal work', difficulty: 'intermediate' },
        { id: 'import-export', title: 'Import/Export Trading', description: 'International product trading', difficulty: 'advanced' },
        { id: 'saas', title: 'SaaS Software', description: 'Software as a service business', difficulty: 'advanced' },
        { id: 'online-course-creator', title: 'Online Course Creator', description: 'Create and sell educational content', difficulty: 'beginner' },
        { id: 'mobile-mechanic', title: 'Mobile Mechanic', description: 'On-site vehicle repair services', difficulty: 'intermediate' }
      ];

      return {
        success: true,
        message: `Found ${roadmaps.length} available roadmaps`,
        data: {
          roadmaps,
          count: roadmaps.length,
          categories: ['E-commerce', 'Services', 'Professional Services', 'Technology', 'Retail', 'Manufacturing']
        }
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// ============================================================================
// FINANCE OPERATIONS - Full bookkeeping automation
// ============================================================================

// Create transaction
const createTransaction: AIFunction = {
  name: "create_transaction",
  description: "Create a financial transaction (income or expense) for bookkeeping",
  parameters: {
    type: "object",
    properties: {
      type: {
        type: "string",
        description: "Transaction type: 'income' or 'expense'",
        enum: ["income", "expense"]
      },
      amount: {
        type: "number",
        description: "Transaction amount in dollars (positive number)"
      },
      category: {
        type: "string",
        description: "Transaction category (e.g., 'Sales', 'Marketing', 'Payroll', 'Office Supplies')"
      },
      description: {
        type: "string",
        description: "Description of the transaction"
      },
      date: {
        type: "string",
        description: "Transaction date in YYYY-MM-DD format (defaults to today if not provided)"
      },
      recurring: {
        type: "boolean",
        description: "Whether this is a recurring transaction"
      },
      recurringFrequency: {
        type: "string",
        description: "Frequency if recurring: 'daily', 'weekly', 'monthly', 'yearly'",
        enum: ["daily", "weekly", "monthly", "yearly"]
      }
    },
    required: ["type", "amount", "category", "description"]
  },
  handler: async (params, context) => {
    try {
      if (!context.businessId) {
        return { success: false, error: 'No business selected' };
      }

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/finance/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${context.accessToken}`
        },
        body: JSON.stringify({
          businessId: context.businessId,
          ...params,
          date: params.date || new Date().toISOString().split('T')[0]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed with status ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        message: `Created ${params.type} transaction for $${params.amount} - ${params.description}`,
        data: result.transaction
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// Get transactions
const getTransactions: AIFunction = {
  name: "get_transactions",
  description: "Retrieve all financial transactions with optional filtering by type, category, or date range",
  parameters: {
    type: "object",
    properties: {
      type: {
        type: "string",
        description: "Filter by transaction type: 'income' or 'expense'",
        enum: ["income", "expense"]
      },
      category: {
        type: "string",
        description: "Filter by specific category"
      },
      startDate: {
        type: "string",
        description: "Start date for filtering (YYYY-MM-DD format)"
      },
      endDate: {
        type: "string",
        description: "End date for filtering (YYYY-MM-DD format)"
      }
    },
    required: []
  },
  handler: async (params, context) => {
    try {
      if (!context.businessId) {
        return { success: false, error: 'No business selected' };
      }

      const queryParams = new URLSearchParams({
        businessId: context.businessId,
        ...params
      });

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/finance/transactions?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${context.accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed with status ${response.status}`);
      }

      const result = await response.json();
      const transactions = result.transactions || [];
      
      return {
        success: true,
        message: `Retrieved ${transactions.length} transaction(s)`,
        data: transactions
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// Get financial overview
const getFinancialOverview: AIFunction = {
  name: "get_financial_overview",
  description: "Get complete financial dashboard with total income, expenses, profit, and breakdown by category",
  parameters: {
    type: "object",
    properties: {
      startDate: {
        type: "string",
        description: "Start date for the report period (YYYY-MM-DD format)"
      },
      endDate: {
        type: "string",
        description: "End date for the report period (YYYY-MM-DD format)"
      }
    },
    required: []
  },
  handler: async (params, context) => {
    try {
      if (!context.businessId) {
        return { success: false, error: 'No business selected' };
      }

      const queryParams = new URLSearchParams({
        businessId: context.businessId,
        ...params
      });

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/finance/overview?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${context.accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed with status ${response.status}`);
      }

      const result = await response.json();
      
      return {
        success: true,
        message: `Financial Overview - Income: $${result.totalIncome || 0}, Expenses: $${result.totalExpenses || 0}, Profit: $${result.profit || 0}`,
        data: result
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// Create budget
const createBudget: AIFunction = {
  name: "create_budget",
  description: "Set a budget limit for a specific category to track spending",
  parameters: {
    type: "object",
    properties: {
      category: {
        type: "string",
        description: "Budget category name (e.g., 'Marketing', 'Payroll', 'Office Supplies')"
      },
      amount: {
        type: "number",
        description: "Budget amount limit in dollars"
      },
      period: {
        type: "string",
        description: "Budget period: 'monthly', 'quarterly', or 'yearly'",
        enum: ["monthly", "quarterly", "yearly"]
      }
    },
    required: ["category", "amount", "period"]
  },
  handler: async (params, context) => {
    try {
      if (!context.businessId) {
        return { success: false, error: 'No business selected' };
      }

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/finance/budgets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${context.accessToken}`
        },
        body: JSON.stringify({
          businessId: context.businessId,
          ...params
        })
      });

      if (!response.ok) {
        throw new Error(`Failed with status ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        message: `Created ${params.period} budget for ${params.category}: $${params.amount}`,
        data: result.budget
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// Get budgets
const getBudgets: AIFunction = {
  name: "get_budgets",
  description: "Retrieve all budget allocations and their current spending status",
  parameters: {
    type: "object",
    properties: {},
    required: []
  },
  handler: async (params, context) => {
    try {
      if (!context.businessId) {
        return { success: false, error: 'No business selected' };
      }

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/finance/budgets?businessId=${context.businessId}`, {
        headers: {
          'Authorization': `Bearer ${context.accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed with status ${response.status}`);
      }

      const result = await response.json();
      const budgets = result.budgets || [];
      
      return {
        success: true,
        message: `Retrieved ${budgets.length} budget(s)`,
        data: budgets
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// ============================================================================
// PRODUCT OPERATIONS - Product/service management
// ============================================================================

// Create product
const createProduct: AIFunction = {
  name: "create_product",
  description: "Create a new product or service offering",
  parameters: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Product or service name"
      },
      description: {
        type: "string",
        description: "Product description"
      },
      price: {
        type: "number",
        description: "Product price in dollars"
      },
      cost: {
        type: "number",
        description: "Cost to produce/deliver (optional)"
      },
      status: {
        type: "string",
        description: "Product status",
        enum: ["idea", "development", "active", "discontinued"]
      },
      inventory: {
        type: "number",
        description: "Current inventory quantity (for physical products)"
      },
      category: {
        type: "string",
        description: "Product category"
      }
    },
    required: ["name", "price"]
  },
  handler: async (params, context) => {
    try {
      if (!context.businessId) {
        return { success: false, error: 'No business selected' };
      }

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${context.accessToken}`
        },
        body: JSON.stringify({
          businessId: context.businessId,
          ...params,
          status: params.status || 'active'
        })
      });

      if (!response.ok) {
        throw new Error(`Failed with status ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        message: `Created product "${params.name}" at $${params.price}`,
        data: result.product
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// Get products
const getProducts: AIFunction = {
  name: "get_products",
  description: "Retrieve all products/services with optional filtering by status or category",
  parameters: {
    type: "object",
    properties: {
      status: {
        type: "string",
        description: "Filter by status",
        enum: ["idea", "development", "active", "discontinued"]
      },
      category: {
        type: "string",
        description: "Filter by category"
      }
    },
    required: []
  },
  handler: async (params, context) => {
    try {
      if (!context.businessId) {
        return { success: false, error: 'No business selected' };
      }

      const queryParams = new URLSearchParams({
        businessId: context.businessId,
        ...params
      });

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/products?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${context.accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed with status ${response.status}`);
      }

      const result = await response.json();
      const products = result.products || [];
      
      return {
        success: true,
        message: `Retrieved ${products.length} product(s)`,
        data: products
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// Update product
const updateProduct: AIFunction = {
  name: "update_product",
  description: "Update product details including name, price, inventory, or status",
  parameters: {
    type: "object",
    properties: {
      productId: {
        type: "string",
        description: "ID of the product to update"
      },
      name: {
        type: "string",
        description: "New product name"
      },
      description: {
        type: "string",
        description: "New description"
      },
      price: {
        type: "number",
        description: "New price"
      },
      cost: {
        type: "number",
        description: "New cost"
      },
      status: {
        type: "string",
        description: "New status",
        enum: ["idea", "development", "active", "discontinued"]
      },
      inventory: {
        type: "number",
        description: "New inventory quantity"
      }
    },
    required: ["productId"]
  },
  handler: async (params, context) => {
    try {
      if (!context.businessId) {
        return { success: false, error: 'No business selected' };
      }

      const { productId, ...updates } = params;

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${context.accessToken}`
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error(`Failed with status ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        message: `Updated product successfully`,
        data: result.product
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// ============================================================================
// HR OPERATIONS - Employee & payroll management
// ============================================================================

// Create employee
const createEmployee: AIFunction = {
  name: "create_employee",
  description: "Add a new employee to the HR system",
  parameters: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Employee full name"
      },
      email: {
        type: "string",
        description: "Employee email address"
      },
      position: {
        type: "string",
        description: "Job title/position"
      },
      department: {
        type: "string",
        description: "Department (e.g., 'Sales', 'Engineering', 'Marketing')"
      },
      salary: {
        type: "number",
        description: "Annual salary in dollars"
      },
      hourlyRate: {
        type: "number",
        description: "Hourly rate (if hourly employee)"
      },
      startDate: {
        type: "string",
        description: "Employment start date (YYYY-MM-DD format)"
      },
      employmentType: {
        type: "string",
        description: "Employment type",
        enum: ["full-time", "part-time", "contractor", "intern"]
      }
    },
    required: ["name", "position"]
  },
  handler: async (params, context) => {
    try {
      if (!context.businessId) {
        return { success: false, error: 'No business selected' };
      }

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/hr/employees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${context.accessToken}`
        },
        body: JSON.stringify({
          businessId: context.businessId,
          ...params,
          startDate: params.startDate || new Date().toISOString().split('T')[0]
        })
      });

      if (!response.ok) {
        throw new Error(`Failed with status ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        message: `Added employee ${params.name} as ${params.position}`,
        data: result.employee
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// Get employees
const getEmployees: AIFunction = {
  name: "get_employees",
  description: "Retrieve all employees with optional filtering by department or employment type",
  parameters: {
    type: "object",
    properties: {
      department: {
        type: "string",
        description: "Filter by department"
      },
      employmentType: {
        type: "string",
        description: "Filter by employment type",
        enum: ["full-time", "part-time", "contractor", "intern"]
      }
    },
    required: []
  },
  handler: async (params, context) => {
    try {
      if (!context.businessId) {
        return { success: false, error: 'No business selected' };
      }

      const queryParams = new URLSearchParams({
        businessId: context.businessId,
        ...params
      });

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/hr/employees?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${context.accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed with status ${response.status}`);
      }

      const result = await response.json();
      const employees = result.employees || [];
      
      return {
        success: true,
        message: `Retrieved ${employees.length} employee(s)`,
        data: employees
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// Get payroll summary
const getPayrollSummary: AIFunction = {
  name: "get_payroll_summary",
  description: "Get total payroll costs and breakdown by department",
  parameters: {
    type: "object",
    properties: {
      period: {
        type: "string",
        description: "Payroll period: 'monthly' or 'yearly'",
        enum: ["monthly", "yearly"]
      }
    },
    required: []
  },
  handler: async (params, context) => {
    try {
      if (!context.businessId) {
        return { success: false, error: 'No business selected' };
      }

      const queryParams = new URLSearchParams({
        businessId: context.businessId,
        period: params.period || 'monthly'
      });

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/hr/payroll/summary?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${context.accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed with status ${response.status}`);
      }

      const result = await response.json();
      
      return {
        success: true,
        message: `Payroll Summary - Total: $${result.totalPayroll || 0} ${params.period || 'monthly'}`,
        data: result
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// ============================================================================
// BUSINESS MANAGEMENT - Create, switch, and manage multiple businesses
// ============================================================================

// Create new business
const createBusiness: AIFunction = {
  name: "create_business",
  description: "Create a new business to manage multiple companies or projects",
  parameters: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Business name (required)"
      },
      description: {
        type: "string",
        description: "Business description (optional)"
      },
      industry: {
        type: "string",
        description: "Business industry (optional)"
      },
      stage: {
        type: "string",
        description: "Business stage: 'idea', 'startup', 'growth', 'mature' (optional)",
        enum: ["idea", "startup", "growth", "mature"]
      }
    },
    required: ["name"]
  },
  handler: async (params, context) => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/businesses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${context.accessToken}`
        },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed with status ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        message: `Successfully created business "${params.name}"`,
        data: result.business
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// Get all businesses
const getAllBusinesses: AIFunction = {
  name: "get_all_businesses",
  description: "Retrieve all businesses owned by the user",
  parameters: {
    type: "object",
    properties: {},
    required: []
  },
  handler: async (params, context) => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/businesses`, {
        headers: {
          'Authorization': `Bearer ${context.accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed with status ${response.status}`);
      }

      const result = await response.json();
      const businesses = result.businesses || [];
      
      return {
        success: true,
        message: `Retrieved ${businesses.length} business(es)`,
        data: businesses
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// Delete business
const deleteBusiness: AIFunction = {
  name: "delete_business",
  description: "Delete a business and all associated data (CAUTION: This is permanent)",
  parameters: {
    type: "object",
    properties: {
      businessId: {
        type: "string",
        description: "ID of the business to delete"
      },
      confirmDelete: {
        type: "boolean",
        description: "Confirmation flag - must be true to delete"
      }
    },
    required: ["businessId", "confirmDelete"]
  },
  handler: async (params, context) => {
    try {
      if (!params.confirmDelete) {
        return {
          success: false,
          error: 'Deletion not confirmed. Set confirmDelete to true to proceed.'
        };
      }

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/businesses/${params.businessId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${context.accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed with status ${response.status}`);
      }

      return {
        success: true,
        message: `Business deleted successfully`,
        data: { deletedBusinessId: params.businessId }
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// ============================================================================
// SUPPORT SYSTEM - Create and manage support tickets
// ============================================================================

// Create support ticket
const createSupportTicket: AIFunction = {
  name: "create_support_ticket",
  description: "Submit a support ticket for technical issues, billing questions, or feature requests",
  parameters: {
    type: "object",
    properties: {
      subject: {
        type: "string",
        description: "Support ticket subject/title"
      },
      message: {
        type: "string",
        description: "Detailed description of the issue or request"
      },
      type: {
        type: "string",
        description: "Ticket type",
        enum: [
          "technical-issue",
          "billing-question",
          "feature-request",
          "account-help",
          "roadmap-question",
          "business-setup",
          "operations-help",
          "general-inquiry",
          "bug-report",
          "partnership-inquiry"
        ]
      },
      priority: {
        type: "string",
        description: "Priority level: 'low', 'medium', 'high', 'urgent'",
        enum: ["low", "medium", "high", "urgent"]
      }
    },
    required: ["subject", "message", "type"]
  },
  handler: async (params, context) => {
    try {
      // Get user email from session
      const userResponse = await supabase.auth.getUser(context.accessToken);
      const userEmail = userResponse.data?.user?.email || 'unknown@email.com';

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/support/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${context.accessToken}`
        },
        body: JSON.stringify({
          ...params,
          userEmail,
          userId: context.userId,
          priority: params.priority || 'medium'
        })
      });

      if (!response.ok) {
        throw new Error(`Failed with status ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        message: `Support ticket created successfully! Ticket ID: ${result.ticket?.id || 'N/A'}`,
        data: result.ticket
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// Get support tickets
const getSupportTickets: AIFunction = {
  name: "get_support_tickets",
  description: "Retrieve all support tickets for the current user with optional status filtering",
  parameters: {
    type: "object",
    properties: {
      status: {
        type: "string",
        description: "Filter by ticket status",
        enum: ["open", "in-progress", "waiting-for-user", "resolved", "closed"]
      }
    },
    required: []
  },
  handler: async (params, context) => {
    try {
      const queryParams = new URLSearchParams({
        userId: context.userId,
        ...(params.status && { status: params.status })
      });

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/support/tickets?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${context.accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed with status ${response.status}`);
      }

      const result = await response.json();
      const tickets = result.tickets || [];
      
      return {
        success: true,
        message: `Retrieved ${tickets.length} support ticket(s)`,
        data: tickets
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// ============================================================================
// MARKETING OPERATIONS - Campaign management
// ============================================================================

// Create marketing campaign
const createMarketingCampaign: AIFunction = {
  name: "create_marketing_campaign",
  description: "Create a new marketing campaign to track promotional activities",
  parameters: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Campaign name"
      },
      description: {
        type: "string",
        description: "Campaign description and goals"
      },
      type: {
        type: "string",
        description: "Campaign type",
        enum: ["email", "social-media", "content", "paid-ads", "seo", "influencer", "event", "other"]
      },
      budget: {
        type: "number",
        description: "Campaign budget in dollars"
      },
      startDate: {
        type: "string",
        description: "Campaign start date (YYYY-MM-DD)"
      },
      endDate: {
        type: "string",
        description: "Campaign end date (YYYY-MM-DD)"
      },
      status: {
        type: "string",
        description: "Campaign status",
        enum: ["planning", "active", "paused", "completed", "cancelled"]
      },
      targetAudience: {
        type: "string",
        description: "Target audience description"
      },
      goals: {
        type: "string",
        description: "Campaign goals and KPIs"
      }
    },
    required: ["name", "type"]
  },
  handler: async (params, context) => {
    try {
      if (!context.businessId) {
        return { success: false, error: 'No business selected' };
      }

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/marketing/campaigns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${context.accessToken}`
        },
        body: JSON.stringify({
          businessId: context.businessId,
          ...params,
          status: params.status || 'planning'
        })
      });

      if (!response.ok) {
        throw new Error(`Failed with status ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        message: `Created marketing campaign "${params.name}"`,
        data: result.campaign
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// Get marketing campaigns
const getMarketingCampaigns: AIFunction = {
  name: "get_marketing_campaigns",
  description: "Retrieve all marketing campaigns with optional filtering by status or type",
  parameters: {
    type: "object",
    properties: {
      status: {
        type: "string",
        description: "Filter by campaign status",
        enum: ["planning", "active", "paused", "completed", "cancelled"]
      },
      type: {
        type: "string",
        description: "Filter by campaign type",
        enum: ["email", "social-media", "content", "paid-ads", "seo", "influencer", "event", "other"]
      }
    },
    required: []
  },
  handler: async (params, context) => {
    try {
      if (!context.businessId) {
        return { success: false, error: 'No business selected' };
      }

      const queryParams = new URLSearchParams({
        businessId: context.businessId,
        ...params
      });

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/marketing/campaigns?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${context.accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed with status ${response.status}`);
      }

      const result = await response.json();
      const campaigns = result.campaigns || [];
      
      return {
        success: true,
        message: `Retrieved ${campaigns.length} marketing campaign(s)`,
        data: campaigns
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// Update marketing campaign
const updateMarketingCampaign: AIFunction = {
  name: "update_marketing_campaign",
  description: "Update marketing campaign details, budget, status, or results",
  parameters: {
    type: "object",
    properties: {
      campaignId: {
        type: "string",
        description: "ID of the campaign to update"
      },
      name: {
        type: "string",
        description: "New campaign name"
      },
      description: {
        type: "string",
        description: "New description"
      },
      status: {
        type: "string",
        description: "New status",
        enum: ["planning", "active", "paused", "completed", "cancelled"]
      },
      budget: {
        type: "number",
        description: "Updated budget"
      },
      actualSpend: {
        type: "number",
        description: "Actual amount spent"
      },
      results: {
        type: "string",
        description: "Campaign results and metrics"
      }
    },
    required: ["campaignId"]
  },
  handler: async (params, context) => {
    try {
      if (!context.businessId) {
        return { success: false, error: 'No business selected' };
      }

      const { campaignId, ...updates } = params;

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/marketing/campaigns/${campaignId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${context.accessToken}`
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error(`Failed with status ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        message: `Updated marketing campaign successfully`,
        data: result.campaign
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// ============================================================================
// CUSTOMIZATION SETTINGS - Theme and navigation preferences
// ============================================================================

// Get customization settings
const getCustomizationSettings: AIFunction = {
  name: "get_customization_settings",
  description: "Retrieve user's customization preferences including navigation items and theme settings",
  parameters: {
    type: "object",
    properties: {},
    required: []
  },
  handler: async (params, context) => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/customization/preferences`, {
        headers: {
          'Authorization': `Bearer ${context.accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed with status ${response.status}`);
      }

      const result = await response.json();
      
      return {
        success: true,
        message: `Retrieved customization settings`,
        data: result.preferences
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// Update customization settings
const updateCustomizationSettings: AIFunction = {
  name: "update_customization_settings",
  description: "Update navigation items and customization preferences (max 7 nav items)",
  parameters: {
    type: "object",
    properties: {
      navItems: {
        type: "array",
        description: "Array of navigation items with id, label, and icon properties (max 7)",
        items: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Navigation item ID (e.g., 'cofounder-agi', 'roadmap', 'notes')"
            },
            label: {
              type: "string",
              description: "Display label"
            },
            icon: {
              type: "string",
              description: "Icon name"
            }
          }
        }
      }
    },
    required: ["navItems"]
  },
  handler: async (params, context) => {
    try {
      if (!Array.isArray(params.navItems) || params.navItems.length > 7) {
        return {
          success: false,
          error: 'navItems must be an array with maximum 7 items'
        };
      }

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/customization/preferences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${context.accessToken}`
        },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        throw new Error(`Failed with status ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        message: `Updated customization settings successfully`,
        data: result.preferences
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// ============================================================================
// SALES OPERATIONS - CRM and lead management
// ============================================================================

// Create sales lead
const createSalesLead: AIFunction = {
  name: "create_sales_lead",
  description: "Add a new sales lead to the CRM pipeline",
  parameters: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Lead name or company name"
      },
      email: {
        type: "string",
        description: "Contact email"
      },
      phone: {
        type: "string",
        description: "Contact phone number"
      },
      status: {
        type: "string",
        description: "Lead status",
        enum: ["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"]
      },
      value: {
        type: "number",
        description: "Estimated deal value in dollars"
      },
      source: {
        type: "string",
        description: "Lead source (e.g., 'Website', 'Referral', 'Cold Call')"
      },
      notes: {
        type: "string",
        description: "Additional notes about the lead"
      }
    },
    required: ["name"]
  },
  handler: async (params, context) => {
    try {
      if (!context.businessId) {
        return { success: false, error: 'No business selected' };
      }

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/sales/leads?businessId=${context.businessId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${context.accessToken}`
        },
        body: JSON.stringify({
          ...params,
          status: params.status || 'new'
        })
      });

      if (!response.ok) {
        throw new Error(`Failed with status ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        message: `Created sales lead "${params.name}"`,
        data: result.lead
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// Get sales leads
const getSalesLeads: AIFunction = {
  name: "get_sales_leads",
  description: "Retrieve all sales leads with optional status filtering",
  parameters: {
    type: "object",
    properties: {
      status: {
        type: "string",
        description: "Filter by lead status",
        enum: ["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"]
      }
    },
    required: []
  },
  handler: async (params, context) => {
    try {
      if (!context.businessId) {
        return { success: false, error: 'No business selected' };
      }

      const queryParams = new URLSearchParams({
        businessId: context.businessId,
        ...params
      });

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/sales/data?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${context.accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed with status ${response.status}`);
      }

      const result = await response.json();
      const leads = result.leads || [];
      
      return {
        success: true,
        message: `Retrieved ${leads.length} sales lead(s)`,
        data: leads
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// Update sales lead
const updateSalesLead: AIFunction = {
  name: "update_sales_lead",
  description: "Update lead information, status, or notes",
  parameters: {
    type: "object",
    properties: {
      leadId: {
        type: "string",
        description: "ID of the lead to update"
      },
      status: {
        type: "string",
        description: "Updated status",
        enum: ["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"]
      },
      value: {
        type: "number",
        description: "Updated deal value"
      },
      notes: {
        type: "string",
        description: "Updated notes"
      }
    },
    required: ["leadId"]
  },
  handler: async (params, context) => {
    try {
      if (!context.businessId) {
        return { success: false, error: 'No business selected' };
      }

      const { leadId, ...updates } = params;

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/sales/leads/${leadId}?businessId=${context.businessId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${context.accessToken}`
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error(`Failed with status ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        message: `Updated sales lead successfully`,
        data: result.lead
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// ============================================================================
// DREAM BOARD - Vision board and goal tracking
// ============================================================================

// Create dream board item
const createDreamItem: AIFunction = {
  name: "create_dream_item",
  description: "Add a new goal or dream to the vision board",
  parameters: {
    type: "object",
    properties: {
      title: {
        type: "string",
        description: "Dream/goal title"
      },
      description: {
        type: "string",
        description: "Detailed description of the dream"
      },
      category: {
        type: "string",
        description: "Dream category",
        enum: ["financial", "lifestyle", "career", "personal", "travel", "family"]
      },
      targetAmount: {
        type: "number",
        description: "Target amount if financial goal (in dollars)"
      },
      targetDate: {
        type: "string",
        description: "Target achievement date (YYYY-MM-DD)"
      },
      priority: {
        type: "string",
        description: "Priority level",
        enum: ["low", "medium", "high"]
      }
    },
    required: ["title", "category"]
  },
  handler: async (params, context) => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/dream-board/dreams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${context.accessToken}`
        },
        body: JSON.stringify({
          ...params,
          userId: context.userId,
          businessId: context.businessId,
          priority: params.priority || 'medium',
          progress: 0,
          isCompleted: false
        })
      });

      if (!response.ok) {
        throw new Error(`Failed with status ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        message: `Created dream "${params.title}" on your vision board`,
        data: result.dream
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// Get dream board items
const getDreamItems: AIFunction = {
  name: "get_dream_items",
  description: "Retrieve all dreams/goals from the vision board",
  parameters: {
    type: "object",
    properties: {
      category: {
        type: "string",
        description: "Filter by category",
        enum: ["financial", "lifestyle", "career", "personal", "travel", "family"]
      },
      completed: {
        type: "boolean",
        description: "Filter by completion status"
      }
    },
    required: []
  },
  handler: async (params, context) => {
    try {
      const queryParams = new URLSearchParams({
        userId: context.userId,
        ...(context.businessId && { businessId: context.businessId }),
        ...params
      });

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/dream-board/dreams?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${context.accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed with status ${response.status}`);
      }

      const result = await response.json();
      const dreams = result.dreams || [];
      
      return {
        success: true,
        message: `Retrieved ${dreams.length} dream(s) from vision board`,
        data: dreams
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// Update dream item
const updateDreamItem: AIFunction = {
  name: "update_dream_item",
  description: "Update dream progress, status, or details",
  parameters: {
    type: "object",
    properties: {
      dreamId: {
        type: "string",
        description: "ID of the dream to update"
      },
      progress: {
        type: "number",
        description: "Progress percentage (0-100)"
      },
      isCompleted: {
        type: "boolean",
        description: "Mark dream as completed"
      },
      title: {
        type: "string",
        description: "Updated title"
      },
      description: {
        type: "string",
        description: "Updated description"
      }
    },
    required: ["dreamId"]
  },
  handler: async (params, context) => {
    try {
      const { dreamId, ...updates } = params;

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/dream-board/dreams/${dreamId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${context.accessToken}`
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error(`Failed with status ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        message: `Updated dream successfully`,
        data: result.dream
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// ============================================================================
// TEAM MANAGEMENT - Team member invitations and management
// ============================================================================

// Invite team member
const inviteTeamMember: AIFunction = {
  name: "invite_team_member",
  description: "Send an invitation to join the team with specified role and permissions",
  parameters: {
    type: "object",
    properties: {
      email: {
        type: "string",
        description: "Email address of the person to invite"
      },
      role: {
        type: "string",
        description: "Team member role",
        enum: ["admin", "member", "viewer"]
      },
      message: {
        type: "string",
        description: "Optional personal message to include in the invitation"
      }
    },
    required: ["email", "role"]
  },
  handler: async (params, context) => {
    try {
      if (!context.businessId) {
        return { success: false, error: 'No business selected' };
      }

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/team/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${context.accessToken}`
        },
        body: JSON.stringify({
          ...params,
          businessId: context.businessId,
          inviterId: context.userId
        })
      });

      if (!response.ok) {
        throw new Error(`Failed with status ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        message: `Team invitation sent to ${params.email}`,
        data: result.invitation
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// Get team members
const getTeamMembers: AIFunction = {
  name: "get_team_members",
  description: "Retrieve all team members for the current business",
  parameters: {
    type: "object",
    properties: {},
    required: []
  },
  handler: async (params, context) => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/users/team`, {
        headers: {
          'Authorization': `Bearer ${context.accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed with status ${response.status}`);
      }

      const result = await response.json();
      const teamMembers = result.teamUsers || [];
      
      return {
        success: true,
        message: `Retrieved ${teamMembers.length} team member(s)`,
        data: teamMembers
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// ============================================================================
// ROADMAP TASK MANAGEMENT - Track and complete roadmap tasks
// ============================================================================

// Complete roadmap task
const completeRoadmapTask: AIFunction = {
  name: "complete_roadmap_task",
  description: "Mark a roadmap task as complete and update progress",
  parameters: {
    type: "object",
    properties: {
      taskId: {
        type: "string",
        description: "ID of the task to complete"
      },
      notes: {
        type: "string",
        description: "Optional completion notes or learnings"
      }
    },
    required: ["taskId"]
  },
  handler: async (params, context) => {
    try {
      if (!context.businessId) {
        return { success: false, error: 'No business selected' };
      }

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/roadmap/tasks/${params.taskId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${context.accessToken}`
        },
        body: JSON.stringify({
          businessId: context.businessId,
          notes: params.notes
        })
      });

      if (!response.ok) {
        throw new Error(`Failed with status ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        message: `Task completed successfully!`,
        data: result
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// Get roadmap tasks
const getRoadmapTasks: AIFunction = {
  name: "get_roadmap_tasks",
  description: "Retrieve all tasks for the current roadmap with optional filtering",
  parameters: {
    type: "object",
    properties: {
      status: {
        type: "string",
        description: "Filter by task status",
        enum: ["pending", "in-progress", "completed"]
      },
      milestoneId: {
        type: "string",
        description: "Filter by specific milestone"
      }
    },
    required: []
  },
  handler: async (params, context) => {
    try {
      if (!context.businessId) {
        return { success: false, error: 'No business selected' };
      }

      const queryParams = new URLSearchParams({
        businessId: context.businessId,
        ...params
      });

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/roadmap/tasks?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${context.accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed with status ${response.status}`);
      }

      const result = await response.json();
      const tasks = result.tasks || [];
      
      return {
        success: true,
        message: `Retrieved ${tasks.length} roadmap task(s)`,
        data: tasks
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// ============================================================================
// UNIVERSITY PROGRESS - Track learning progress
// ============================================================================

// Get university tracks
const getUniversityTracks: AIFunction = {
  name: "get_university_tracks",
  description: "Retrieve all available University tutorial tracks",
  parameters: {
    type: "object",
    properties: {},
    required: []
  },
  handler: async (params, context) => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/university/tracks`, {
        headers: {
          'Authorization': `Bearer ${context.accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed with status ${response.status}`);
      }

      const result = await response.json();
      const tracks = result.tracks || [];
      
      return {
        success: true,
        message: `Retrieved ${tracks.length} University track(s)`,
        data: tracks
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// Get track progress
const getTrackProgress: AIFunction = {
  name: "get_track_progress",
  description: "View completion progress for a specific University track",
  parameters: {
    type: "object",
    properties: {
      trackId: {
        type: "string",
        description: "ID of the track to check progress for"
      }
    },
    required: ["trackId"]
  },
  handler: async (params, context) => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/university/tracks/${params.trackId}/progress?userId=${context.userId}`, {
        headers: {
          'Authorization': `Bearer ${context.accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed with status ${response.status}`);
      }

      const result = await response.json();
      
      return {
        success: true,
        message: `Track progress: ${result.completedCount || 0}/${result.totalTutorials || 0} completed`,
        data: result
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// Mark tutorial complete
const markTutorialComplete: AIFunction = {
  name: "mark_tutorial_complete",
  description: "Mark a University tutorial as completed",
  parameters: {
    type: "object",
    properties: {
      tutorialId: {
        type: "string",
        description: "ID of the tutorial to mark complete"
      },
      trackId: {
        type: "string",
        description: "ID of the track the tutorial belongs to"
      }
    },
    required: ["tutorialId", "trackId"]
  },
  handler: async (params, context) => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/university/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${context.accessToken}`
        },
        body: JSON.stringify({
          ...params,
          userId: context.userId
        })
      });

      if (!response.ok) {
        throw new Error(`Failed with status ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        message: `Tutorial marked as complete!`,
        data: result
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// ============================================================================
// FILE UPLOADS - Document and evidence management
// ============================================================================

// Upload file
const uploadFile: AIFunction = {
  name: "upload_file",
  description: "Upload documents, images, or files to the Proof Locker",
  parameters: {
    type: "object",
    properties: {
      fileName: {
        type: "string",
        description: "Name of the file to upload"
      },
      fileType: {
        type: "string",
        description: "MIME type (e.g., 'image/jpeg', 'application/pdf')"
      },
      category: {
        type: "string",
        description: "File category",
        enum: ["business-document", "proof-of-work", "invoice", "receipt", "contract", "certificate", "other"]
      },
      taskId: {
        type: "string",
        description: "Optional: Associate with a roadmap task"
      },
      description: {
        type: "string",
        description: "File description or notes"
      }
    },
    required: ["fileName", "fileType"]
  },
  handler: async (params, context) => {
    try {
      if (!context.businessId) {
        return { success: false, error: 'No business selected' };
      }

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/files/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${context.accessToken}`
        },
        body: JSON.stringify({
          ...params,
          businessId: context.businessId,
          userId: context.userId,
          category: params.category || 'other'
        })
      });

      if (!response.ok) {
        throw new Error(`Failed with status ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        message: `File "${params.fileName}" uploaded to Proof Locker`,
        data: result.file
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// Get uploaded files
const getUploadedFiles: AIFunction = {
  name: "get_uploaded_files",
  description: "Retrieve all uploaded files from the Proof Locker",
  parameters: {
    type: "object",
    properties: {
      category: {
        type: "string",
        description: "Filter by category",
        enum: ["business-document", "proof-of-work", "invoice", "receipt", "contract", "certificate", "other"]
      },
      taskId: {
        type: "string",
        description: "Filter by associated task ID"
      }
    },
    required: []
  },
  handler: async (params, context) => {
    try {
      if (!context.businessId) {
        return { success: false, error: 'No business selected' };
      }

      const queryParams = new URLSearchParams({
        businessId: context.businessId,
        userId: context.userId,
        ...params
      });

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/files?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${context.accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed with status ${response.status}`);
      }

      const result = await response.json();
      const files = result.files || [];
      
      return {
        success: true,
        message: `Retrieved ${files.length} file(s) from Proof Locker`,
        data: files
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// Delete file
const deleteFile: AIFunction = {
  name: "delete_file",
  description: "Remove a file from the Proof Locker",
  parameters: {
    type: "object",
    properties: {
      fileId: {
        type: "string",
        description: "ID of the file to delete"
      },
      confirmDelete: {
        type: "boolean",
        description: "Confirmation flag - must be true to delete"
      }
    },
    required: ["fileId", "confirmDelete"]
  },
  handler: async (params, context) => {
    try {
      if (!params.confirmDelete) {
        return {
          success: false,
          error: 'Deletion not confirmed. Set confirmDelete to true to proceed.'
        };
      }

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/files/${params.fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${context.accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed with status ${response.status}`);
      }

      return {
        success: true,
        message: `File deleted successfully`,
        data: { deletedFileId: params.fileId }
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// ============================================================================
// STREAK SYSTEM - Gamification and activity tracking
// ============================================================================

// Get streak data
const getStreakData: AIFunction = {
  name: "get_streak_data",
  description: "Retrieve current streak, longest streak, and total active days",
  parameters: {
    type: "object",
    properties: {},
    required: []
  },
  handler: async (params, context) => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/streak/get`, {
        headers: {
          'Authorization': `Bearer ${context.accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed with status ${response.status}`);
      }

      const result = await response.json();
      
      return {
        success: true,
        message: `Current streak: ${result.currentStreak || 0} days | Longest: ${result.longestStreak || 0} days`,
        data: result
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// Record activity
const recordActivity: AIFunction = {
  name: "record_activity",
  description: "Log user activity to maintain streak (automatically called on task completion)",
  parameters: {
    type: "object",
    properties: {
      activityType: {
        type: "string",
        description: "Type of activity",
        enum: ["task_completion", "login", "tutorial_complete", "milestone_complete", "note_created"]
      },
      description: {
        type: "string",
        description: "Activity description"
      }
    },
    required: ["activityType"]
  },
  handler: async (params, context) => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/streak/record`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${context.accessToken}`
        },
        body: JSON.stringify({
          userId: context.userId,
          ...params
        })
      });

      if (!response.ok) {
        throw new Error(`Failed with status ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        message: `Activity recorded! Current streak: ${result.currentStreak || 0} days`,
        data: result
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// ============================================================================
// SALES DEALS - Deal pipeline management
// ============================================================================

// Create sales deal
const createSalesDeal: AIFunction = {
  name: "create_sales_deal",
  description: "Create a new sales deal/opportunity in the pipeline",
  parameters: {
    type: "object",
    properties: {
      title: {
        type: "string",
        description: "Deal title or name"
      },
      company: {
        type: "string",
        description: "Company name"
      },
      value: {
        type: "number",
        description: "Deal value in dollars"
      },
      stage: {
        type: "string",
        description: "Deal stage",
        enum: ["prospecting", "qualification", "proposal", "negotiation", "closed-won", "closed-lost"]
      },
      probability: {
        type: "number",
        description: "Win probability (0-100)"
      },
      expectedCloseDate: {
        type: "string",
        description: "Expected close date (YYYY-MM-DD)"
      },
      contactName: {
        type: "string",
        description: "Primary contact name"
      },
      notes: {
        type: "string",
        description: "Deal notes"
      }
    },
    required: ["title", "value"]
  },
  handler: async (params, context) => {
    try {
      if (!context.businessId) {
        return { success: false, error: 'No business selected' };
      }

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/sales/deals?businessId=${context.businessId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${context.accessToken}`
        },
        body: JSON.stringify({
          ...params,
          stage: params.stage || 'prospecting',
          probability: params.probability || 50
        })
      });

      if (!response.ok) {
        throw new Error(`Failed with status ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        message: `Created sales deal "${params.title}" worth $${params.value}`,
        data: result.deal
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// Get sales deals
const getSalesDeals: AIFunction = {
  name: "get_sales_deals",
  description: "Retrieve all sales deals with optional stage filtering",
  parameters: {
    type: "object",
    properties: {
      stage: {
        type: "string",
        description: "Filter by deal stage",
        enum: ["prospecting", "qualification", "proposal", "negotiation", "closed-won", "closed-lost"]
      }
    },
    required: []
  },
  handler: async (params, context) => {
    try {
      if (!context.businessId) {
        return { success: false, error: 'No business selected' };
      }

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/sales/data?businessId=${context.businessId}`, {
        headers: {
          'Authorization': `Bearer ${context.accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed with status ${response.status}`);
      }

      const result = await response.json();
      let deals = result.deals || [];
      
      // Filter by stage if provided
      if (params.stage) {
        deals = deals.filter((deal: any) => deal.stage === params.stage);
      }
      
      return {
        success: true,
        message: `Retrieved ${deals.length} sales deal(s)`,
        data: deals
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// Update sales deal
const updateSalesDeal: AIFunction = {
  name: "update_sales_deal",
  description: "Update deal stage, value, probability, or close date",
  parameters: {
    type: "object",
    properties: {
      dealId: {
        type: "string",
        description: "ID of the deal to update"
      },
      stage: {
        type: "string",
        description: "Updated stage",
        enum: ["prospecting", "qualification", "proposal", "negotiation", "closed-won", "closed-lost"]
      },
      value: {
        type: "number",
        description: "Updated deal value"
      },
      probability: {
        type: "number",
        description: "Updated win probability (0-100)"
      },
      expectedCloseDate: {
        type: "string",
        description: "Updated close date (YYYY-MM-DD)"
      },
      notes: {
        type: "string",
        description: "Updated notes"
      }
    },
    required: ["dealId"]
  },
  handler: async (params, context) => {
    try {
      if (!context.businessId) {
        return { success: false, error: 'No business selected' };
      }

      const { dealId, ...updates } = params;

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/sales/deals/${dealId}?businessId=${context.businessId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${context.accessToken}`
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error(`Failed with status ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        message: `Updated sales deal successfully`,
        data: result.deal
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// ============================================================================
// CUSTOMER MANAGEMENT - Track customer interactions
// ============================================================================

// Create customer
const createCustomer: AIFunction = {
  name: "create_customer",
  description: "Add a new customer to the CRM",
  parameters: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Customer name or company name"
      },
      email: {
        type: "string",
        description: "Customer email"
      },
      phone: {
        type: "string",
        description: "Customer phone"
      },
      company: {
        type: "string",
        description: "Company name"
      },
      status: {
        type: "string",
        description: "Customer status",
        enum: ["prospect", "active", "inactive", "churned"]
      },
      lifetimeValue: {
        type: "number",
        description: "Customer lifetime value in dollars"
      },
      notes: {
        type: "string",
        description: "Customer notes"
      }
    },
    required: ["name"]
  },
  handler: async (params, context) => {
    try {
      if (!context.businessId) {
        return { success: false, error: 'No business selected' };
      }

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/sales/customers?businessId=${context.businessId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${context.accessToken}`
        },
        body: JSON.stringify({
          ...params,
          status: params.status || 'prospect'
        })
      });

      if (!response.ok) {
        throw new Error(`Failed with status ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        message: `Added customer "${params.name}" to CRM`,
        data: result.customer
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// Get customers
const getCustomers: AIFunction = {
  name: "get_customers",
  description: "Retrieve all customers with optional status filtering",
  parameters: {
    type: "object",
    properties: {
      status: {
        type: "string",
        description: "Filter by customer status",
        enum: ["prospect", "active", "inactive", "churned"]
      }
    },
    required: []
  },
  handler: async (params, context) => {
    try {
      if (!context.businessId) {
        return { success: false, error: 'No business selected' };
      }

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/sales/data?businessId=${context.businessId}`, {
        headers: {
          'Authorization': `Bearer ${context.accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed with status ${response.status}`);
      }

      const result = await response.json();
      let customers = result.customers || [];
      
      // Filter by status if provided
      if (params.status) {
        customers = customers.filter((customer: any) => customer.status === params.status);
      }
      
      return {
        success: true,
        message: `Retrieved ${customers.length} customer(s)`,
        data: customers
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// Log customer interaction
const logCustomerInteraction: AIFunction = {
  name: "log_customer_interaction",
  description: "Record a customer interaction (call, meeting, email, etc.)",
  parameters: {
    type: "object",
    properties: {
      customerId: {
        type: "string",
        description: "ID of the customer"
      },
      type: {
        type: "string",
        description: "Interaction type",
        enum: ["call", "email", "meeting", "demo", "support", "follow-up", "other"]
      },
      subject: {
        type: "string",
        description: "Interaction subject"
      },
      notes: {
        type: "string",
        description: "Detailed notes about the interaction"
      },
      duration: {
        type: "number",
        description: "Duration in minutes (optional)"
      },
      outcome: {
        type: "string",
        description: "Interaction outcome or next steps"
      }
    },
    required: ["customerId", "type", "notes"]
  },
  handler: async (params, context) => {
    try {
      if (!context.businessId) {
        return { success: false, error: 'No business selected' };
      }

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/sales/customers/${params.customerId}/interactions?businessId=${context.businessId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${context.accessToken}`
        },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        throw new Error(`Failed with status ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        message: `Customer interaction logged successfully`,
        data: result.interaction
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// Registry of all available functions
export const AI_FUNCTIONS: AIFunction[] = [
  updateBusinessInfo,
  createBoard,
  createList,
  createCard,
  getBoards,
  getBoardDetails,
  updateBoard,
  updateList,
  updateCard,
  deleteBoard,
  deleteList,
  deleteCard,
  getRoadmapProgress,
  getAllRoadmaps,
  getProofLockerDocuments,
  // Finance Operations
  createTransaction,
  getTransactions,
  getFinancialOverview,
  createBudget,
  getBudgets,
  // Product Operations
  createProduct,
  getProducts,
  updateProduct,
  // HR Operations
  createEmployee,
  getEmployees,
  getPayrollSummary,
  // Business Management
  createBusiness,
  getAllBusinesses,
  deleteBusiness,
  // Support System
  createSupportTicket,
  getSupportTickets,
  // Marketing Operations
  createMarketingCampaign,
  getMarketingCampaigns,
  updateMarketingCampaign,
  // Customization
  getCustomizationSettings,
  updateCustomizationSettings,
  // Sales Operations
  createSalesLead,
  getSalesLeads,
  updateSalesLead,
  // Dream Board
  createDreamItem,
  getDreamItems,
  updateDreamItem,
  // Team Management
  inviteTeamMember,
  getTeamMembers,
  // Roadmap Tasks
  completeRoadmapTask,
  getRoadmapTasks,
  // University Progress
  getUniversityTracks,
  getTrackProgress,
  markTutorialComplete,
  // File Uploads
  uploadFile,
  getUploadedFiles,
  deleteFile,
  // Streak System
  getStreakData,
  recordActivity,
  // Sales Deals
  createSalesDeal,
  getSalesDeals,
  updateSalesDeal,
  // Customer Management
  createCustomer,
  getCustomers,
  logCustomerInteraction,
  // Advanced Analytics & Insights
  generateBusinessInsights,
  getBusinessMetrics,
  // Goal Tracking
  setBusinessGoal,
  getBusinessGoals,
  updateGoalProgress,
  // Search & Discovery
  searchBusinessData,
  // Reporting & Export
  generateBusinessReport,
  exportBusinessData,
  // Notifications & Reminders
  createNotification,
  getNotifications,
  // Phone Push Notifications
  sendPushNotification,
  registerDeviceForNotifications,
  getScheduledPushNotifications
];

// Helper function to get function by name
export function getAIFunction(name: string): AIFunction | undefined {
  return AI_FUNCTIONS.find(func => func.name === name);
}

// Convert AI functions to OpenAI function format
export function getOpenAIFunctions() {
  return AI_FUNCTIONS.map(func => ({
    name: func.name,
    description: func.description,
    parameters: func.parameters
  }));
}

// Execute an AI function
export async function executeAIFunction(
  functionName: string, 
  parameters: any, 
  context: AIFunctionContext
): Promise<any> {
  const func = getAIFunction(functionName);
  
  if (!func) {
    throw new Error(`Unknown function: ${functionName}`);
  }

  try {
    return await func.handler(parameters, context);
  } catch (error: any) {
    console.error(`Error executing AI function ${functionName}:`, error);
    throw error;
  }
}

// Function to validate function parameters
export function validateFunctionCall(functionName: string, parameters: any): boolean {
  const func = getAIFunction(functionName);
  
  if (!func) {
    return false;
  }

  // Check required parameters
  const required = func.parameters.required || [];
  for (const param of required) {
    if (!(param in parameters)) {
      console.error(`Missing required parameter: ${param}`);
      return false;
    }
  }

  return true;
}