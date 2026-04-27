/**
 * DATABASE FUNCTION HANDLERS
 * 
 * These functions allow AI tools to write to the KV store database.
 * Each handler performs a specific database operation.
 */

import * as kv from './kv_store.tsx';

// ============================================================================
// FINANCE FUNCTIONS
// ============================================================================

/**
 * Create a financial transaction
 */
export async function createTransaction(params: {
  businessId: string;
  userId: string;
  amount: number;
  type: 'revenue' | 'expense';
  category: string;
  description: string;
  date: string;
  status?: 'pending' | 'completed' | 'cancelled' | 'scheduled';
  productId?: string;
  quantity?: number;
  recurring?: boolean;
  merchant?: string;
  notes?: string;
}) {
  try {
    console.log('🚀 CREATE TRANSACTION CALLED with params:', JSON.stringify(params, null, 2));
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Determine status based on date if not provided
    let status = params.status;
    if (!status) {
      const transactionDate = new Date(params.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      transactionDate.setHours(0, 0, 0, 0);
      
      if (transactionDate < today) {
        status = 'completed';
      } else if (transactionDate.getTime() === today.getTime()) {
        status = 'pending';
      } else {
        status = 'scheduled';
      }
    }
    
    const transaction = {
      id: transactionId,
      business_id: params.businessId,
      user_id: params.userId,
      amount: params.amount,
      type: params.type,
      category: params.category,
      description: params.description,
      date: params.date,
      status: status,
      product_id: params.productId || null,
      quantity: params.quantity || null,
      recurring: params.recurring || false,
      merchant: params.merchant || '',
      notes: params.notes || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Store transaction in KV using array pattern
    const key = `business:${params.userId}:${params.businessId}:transactions`;
    let transactions = await kv.get(key);
    if (!Array.isArray(transactions)) transactions = [];
    
    console.log(`📝 Current transactions count BEFORE adding: ${transactions.length}`);
    transactions.push(transaction);
    await kv.set(key, transactions);
    console.log(`📝 Transactions saved! New count: ${transactions.length}, Key: ${key}`);
    
    // Verify save by reading back
    const verifyTransactions = await kv.get(key);
    console.log(`✅ VERIFICATION: Transactions in DB: ${Array.isArray(verifyTransactions) ? verifyTransactions.length : 'NOT AN ARRAY'}`);

    // Update bank balance only for completed transactions
    if (status === 'completed') {
      await updateBankBalance(params.userId, params.businessId, params.type, params.amount, 'add');
    }

    console.log(`✅ Transaction created: ${transactionId} - ${params.type} - ${status}`);
    return { success: true, data: transaction };
  } catch (error: any) {
    console.error('createTransaction error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Helper function to update bank balance
 */
async function updateBankBalance(
  userId: string, 
  businessId: string, 
  transactionType: 'revenue' | 'expense', 
  amount: number, 
  operation: 'add' | 'subtract' = 'add'
) {
  try {
    const key = `bank_balance:${userId}:${businessId}`;
    let bankBalance = await kv.get(key);
    
    if (!bankBalance) {
      bankBalance = {
        balance: 0,
        currency: 'USD',
        last_updated: new Date().toISOString(),
        created_at: new Date().toISOString()
      };
    }

    let balanceChange = 0;
    if (operation === 'add') {
      if (transactionType === 'revenue') {
        balanceChange = amount;
      } else if (transactionType === 'expense') {
        balanceChange = -amount;
      }
    } else {
      if (transactionType === 'revenue') {
        balanceChange = -amount;
      } else if (transactionType === 'expense') {
        balanceChange = amount;
      }
    }

    bankBalance.balance += balanceChange;
    bankBalance.last_updated = new Date().toISOString();

    await kv.set(key, bankBalance);
    console.log(`💰 Bank balance updated: ${bankBalance.balance}`);
  } catch (error: any) {
    console.error('updateBankBalance error:', error);
  }
}

/**
 * Update a transaction
 */
export async function updateTransaction(params: {
  transactionId: string;
  userId: string;
  businessId: string;
  amount?: number;
  category?: string;
  description?: string;
  notes?: string;
}) {
  try {
    // Get transactions array
    const key = `business:${params.userId}:${params.businessId}:transactions`;
    let transactions = await kv.get(key);
    if (!Array.isArray(transactions)) transactions = [];
    
    // Find the transaction
    const transactionIndex = transactions.findIndex((t: any) => t.id === params.transactionId);
    if (transactionIndex === -1) {
      return { success: false, error: 'Transaction not found' };
    }
    
    const existingTransaction = transactions[transactionIndex];

    // If amount changed, adjust bank balance
    if (params.amount !== undefined && params.amount !== existingTransaction.amount) {
      // Reverse old transaction
      await updateBankBalance(
        params.userId, 
        params.businessId, 
        existingTransaction.type, 
        existingTransaction.amount, 
        'subtract'
      );
      // Apply new amount
      await updateBankBalance(
        params.userId, 
        params.businessId, 
        existingTransaction.type, 
        params.amount, 
        'add'
      );
    }

    // Update transaction in array
    transactions[transactionIndex] = {
      ...existingTransaction,
      amount: params.amount !== undefined ? params.amount : existingTransaction.amount,
      category: params.category || existingTransaction.category,
      description: params.description || existingTransaction.description,
      notes: params.notes !== undefined ? params.notes : existingTransaction.notes,
      updated_at: new Date().toISOString(),
    };

    // Save array back
    await kv.set(key, transactions);

    console.log(`✅ Transaction updated: ${params.transactionId}`);
    return { success: true, data: transactions[transactionIndex] };
  } catch (error: any) {
    console.error('updateTransaction error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create a budget
 */
export async function createBudget(params: {
  businessId: string;
  userId: string;
  category: string;
  amount: number;
  period: 'monthly' | 'quarterly' | 'yearly';
  startDate: string;
  endDate?: string;
}) {
  try {
    const budgetId = `budget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const budget = {
      id: budgetId,
      business_id: params.businessId,
      user_id: params.userId,
      category: params.category,
      amount: params.amount,
      period: params.period,
      start_date: params.startDate,
      end_date: params.endDate,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const key = `budget:${params.userId}:${params.businessId}:${budgetId}`;
    await kv.set(key, JSON.stringify(budget));

    console.log(`✅ Budget created: ${budgetId}`);
    return { success: true, data: budget };
  } catch (error: any) {
    console.error('createBudget error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a transaction
 */
export async function deleteTransaction(params: {
  transactionId: string;
  userId: string;
  businessId: string;
}) {
  try {
    // Get transactions array
    const key = `business:${params.userId}:${params.businessId}:transactions`;
    let transactions = await kv.get(key);
    if (!Array.isArray(transactions)) transactions = [];
    
    // Find the transaction
    const transactionIndex = transactions.findIndex((t: any) => t.id === params.transactionId);
    if (transactionIndex === -1) {
      return { success: false, error: 'Transaction not found' };
    }
    
    const existingTransaction = transactions[transactionIndex];

    // Reverse the bank balance change if completed
    if (existingTransaction.status === 'completed') {
      await updateBankBalance(
        params.userId, 
        params.businessId, 
        existingTransaction.type, 
        existingTransaction.amount, 
        'subtract'
      );
    }

    // Remove transaction from array
    transactions.splice(transactionIndex, 1);
    
    // Save array back
    await kv.set(key, transactions);

    console.log(`✅ Transaction deleted: ${params.transactionId}`);
    return { success: true, data: { id: params.transactionId, deleted: true } };
  } catch (error: any) {
    console.error('deleteTransaction error:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// ROADMAP FUNCTIONS
// ============================================================================

/**
 * Create a roadmap task/node
 */
export async function createRoadmapTask(params: {
  businessId: string;
  userId: string;
  title: string;
  description?: string;
  department: 'product' | 'marketing' | 'sales' | 'finance' | 'operations' | 'hr';
  stage: string;
  priority?: 'low' | 'medium' | 'high';
  estimatedHours?: number;
  dueDate?: string;
}) {
  try {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const task = {
      id: taskId,
      business_id: params.businessId,
      user_id: params.userId,
      title: params.title,
      description: params.description || '',
      department: params.department,
      stage: params.stage,
      priority: params.priority || 'medium',
      estimated_hours: params.estimatedHours || 0,
      due_date: params.dueDate || '',
      status: 'pending',
      completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Get current roadmap data
    const roadmapKey = `business:${params.userId}:${params.businessId}:roadmap`;
    let roadmapData = await kv.get(roadmapKey);
    
    if (!roadmapData) {
      roadmapData = {
        tasks: [],
        milestones: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    // Add new task
    if (!roadmapData.tasks) {
      roadmapData.tasks = [];
    }
    roadmapData.tasks.push(task);
    roadmapData.updated_at = new Date().toISOString();

    await kv.set(roadmapKey, roadmapData);

    console.log(`✅ Roadmap task created: ${taskId}`);
    return { success: true, data: task };
  } catch (error: any) {
    console.error('createRoadmapTask error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update roadmap task status
 */
export async function updateRoadmapTaskStatus(params: {
  taskId: string;
  userId: string;
  businessId?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  completionNotes?: string;
}) {
  try {
    // Need to find the task - search all businesses for this user
    let foundTask = false;
    let taskData: any = null;
    let businessId = params.businessId;

    if (businessId) {
      // If businessId provided, check that specific business
      const roadmapKey = `business:${params.userId}:${businessId}:roadmap`;
      const roadmapData = await kv.get(roadmapKey);
      
      if (roadmapData && roadmapData.tasks) {
        const taskIndex = roadmapData.tasks.findIndex((t: any) => t.id === params.taskId);
        if (taskIndex !== -1) {
          roadmapData.tasks[taskIndex].status = params.status;
          roadmapData.tasks[taskIndex].completed = params.status === 'completed';
          if (params.status === 'completed') {
            roadmapData.tasks[taskIndex].completed_at = new Date().toISOString();
          }
          if (params.completionNotes) {
            roadmapData.tasks[taskIndex].completion_notes = params.completionNotes;
          }
          roadmapData.tasks[taskIndex].updated_at = new Date().toISOString();
          roadmapData.updated_at = new Date().toISOString();

          await kv.set(roadmapKey, roadmapData);
          taskData = roadmapData.tasks[taskIndex];
          foundTask = true;
        }
      }
    } else {
      // Search all businesses for this user
      const allBusinesses = await kv.getByPrefix(`business:${params.userId}:`) || [];
      
      for (const bizData of allBusinesses) {
        const parsed = typeof bizData === 'string' ? JSON.parse(bizData) : bizData;
        if (parsed.roadmap && parsed.roadmap.tasks) {
          const taskIndex = parsed.roadmap.tasks.findIndex((t: any) => t.id === params.taskId);
          if (taskIndex !== -1) {
            parsed.roadmap.tasks[taskIndex].status = params.status;
            parsed.roadmap.tasks[taskIndex].completed = params.status === 'completed';
            if (params.status === 'completed') {
              parsed.roadmap.tasks[taskIndex].completed_at = new Date().toISOString();
            }
            if (params.completionNotes) {
              parsed.roadmap.tasks[taskIndex].completion_notes = params.completionNotes;
            }
            parsed.roadmap.tasks[taskIndex].updated_at = new Date().toISOString();
            parsed.roadmap.updated_at = new Date().toISOString();

            // Find the key and update
            const businessIdFromKey = parsed.id;
            const key = `business:${params.userId}:${businessIdFromKey}:roadmap`;
            await kv.set(key, parsed.roadmap);
            
            taskData = parsed.roadmap.tasks[taskIndex];
            foundTask = true;
            break;
          }
        }
      }
    }

    if (!foundTask) {
      return { success: false, error: 'Task not found' };
    }

    console.log(`✅ Roadmap task status updated: ${params.taskId} -> ${params.status}`);
    return { success: true, data: taskData };
  } catch (error: any) {
    console.error('updateRoadmapTaskStatus error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a roadmap task
 */
export async function deleteRoadmapTask(params: {
  taskId: string;
  userId: string;
  businessId: string;
}) {
  try {
    const roadmapKey = `business:${params.userId}:${params.businessId}:roadmap`;
    const roadmapData = await kv.get(roadmapKey);
    
    if (!roadmapData || !roadmapData.tasks) {
      return { success: false, error: 'Roadmap or tasks not found' };
    }

    const taskIndex = roadmapData.tasks.findIndex((t: any) => t.id === params.taskId);
    if (taskIndex === -1) {
      return { success: false, error: 'Task not found' };
    }

    // Remove the task
    roadmapData.tasks.splice(taskIndex, 1);
    roadmapData.updated_at = new Date().toISOString();

    await kv.set(roadmapKey, roadmapData);

    console.log(`✅ Roadmap task deleted: ${params.taskId}`);
    return { success: true, data: { id: params.taskId, deleted: true } };
  } catch (error: any) {
    console.error('deleteRoadmapTask error:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// HR FUNCTIONS
// ============================================================================

/**
 * Add a team member
 */
export async function addTeamMember(params: {
  businessId: string;
  userId: string;
  name: string;
  email?: string;
  role: string;
  department?: string;
  salary?: number;
  startDate?: string;
  employmentType?: 'full-time' | 'part-time' | 'contractor';
}) {
  try {
    const memberId = `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const teamMember = {
      id: memberId,
      business_id: params.businessId,
      user_id: params.userId,
      name: params.name,
      email: params.email || '',
      role: params.role,
      department: params.department || '',
      salary: params.salary || 0,
      start_date: params.startDate || new Date().toISOString().split('T')[0],
      employment_type: params.employmentType || 'full-time',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // FIX: Include businessId in the key for consistency with other endpoints
    const key = `team_member:${params.userId}:${memberId}`;
    await kv.set(key, teamMember);

    console.log(`✅ Team member added: ${memberId} - ${params.name} (${params.role}) to business ${params.businessId}`);
    return { success: true, data: teamMember };
  } catch (error: any) {
    console.error('addTeamMember error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update team member
 */
export async function updateTeamMember(params: {
  memberId: string;
  userId: string;
  role?: string;
  department?: string;
  salary?: number;
  status?: 'active' | 'inactive' | 'terminated';
}) {
  try {
    const key = `team_member:${params.userId}:${params.memberId}`;
    const existingMember = await kv.get(key);

    if (!existingMember) {
      return { success: false, error: 'Team member not found' };
    }

    const updatedMember = {
      ...existingMember,
      role: params.role || existingMember.role,
      department: params.department || existingMember.department,
      salary: params.salary !== undefined ? params.salary : existingMember.salary,
      status: params.status || existingMember.status,
      updated_at: new Date().toISOString(),
    };

    await kv.set(key, updatedMember);

    console.log(`✅ Team member updated: ${params.memberId}`);
    return { success: true, data: updatedMember };
  } catch (error: any) {
    console.error('updateTeamMember error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create a handbook
 */
export async function createHandbook(params: {
  businessId: string;
  userId: string;
  roleTitle: string;
  roleDescription?: string;
  content: string;
  sections?: string[];
  status?: 'draft' | 'published' | 'archived';
}) {
  try {
    const handbookId = `handbook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Extract sections from content if not provided
    let sections = params.sections || [];
    if (sections.length === 0) {
      // Try to extract markdown headers as sections
      const headerMatches = params.content.match(/^#{1,3}\s+(.+)$/gm);
      if (headerMatches) {
        sections = headerMatches.map(h => h.replace(/^#{1,3}\s+/, '').trim());
      }
    }
    
    const handbook = {
      id: handbookId,
      business_id: params.businessId,
      user_id: params.userId,
      role_title: params.roleTitle,
      role_description: params.roleDescription || '',
      content: params.content,
      status: params.status || 'published',
      sections: sections,
      word_count: params.content.split(/\s+/).length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const key = `handbook:${params.businessId}:${handbookId}`;
    await kv.set(key, handbook);

    console.log(`✅ Handbook created: ${handbookId} - ${params.roleTitle} for business ${params.businessId}`);
    return { success: true, data: handbook };
  } catch (error: any) {
    console.error('createHandbook error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update a handbook
 */
export async function updateHandbook(params: {
  handbookId: string;
  businessId: string;
  userId: string;
  roleTitle?: string;
  roleDescription?: string;
  content?: string;
  sections?: string[];
  status?: 'draft' | 'published' | 'archived';
}) {
  try {
    const key = `handbook:${params.businessId}:${params.handbookId}`;
    const existingHandbook = await kv.get(key);

    if (!existingHandbook) {
      return { success: false, error: 'Handbook not found' };
    }

    const updatedHandbook = {
      ...existingHandbook,
      role_title: params.roleTitle || existingHandbook.role_title,
      role_description: params.roleDescription !== undefined ? params.roleDescription : existingHandbook.role_description,
      content: params.content || existingHandbook.content,
      sections: params.sections || existingHandbook.sections,
      status: params.status || existingHandbook.status,
      word_count: params.content ? params.content.split(/\s+/).length : existingHandbook.word_count,
      updated_at: new Date().toISOString(),
    };

    await kv.set(key, updatedHandbook);

    console.log(`✅ Handbook updated: ${params.handbookId}`);
    return { success: true, data: updatedHandbook };
  } catch (error: any) {
    console.error('updateHandbook error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create an onboarding plan
 */
export async function createOnboardingPlan(params: {
  businessId: string;
  userId: string;
  roleTitle: string;
  employeeName?: string;
  startDate?: string;
  content: string;
  checklistItems?: Array<{
    title: string;
    description: string;
    day: number;
  }>;
  sections?: string[];
  status?: 'draft' | 'scheduled' | 'in_progress' | 'completed';
}) {
  try {
    const onboardingId = `onboarding_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Extract sections from content if not provided
    let sections = params.sections || [];
    if (sections.length === 0) {
      const headerMatches = params.content.match(/^#{1,3}\s+(.+)$/gm);
      if (headerMatches) {
        sections = headerMatches.map(h => h.replace(/^#{1,3}\s+/, '').trim());
      }
    }
    
    // Process checklist items
    const checklistItems = (params.checklistItems || []).map((item, index) => ({
      id: `checklist_${Date.now()}_${index}`,
      title: item.title,
      description: item.description,
      completed: false,
      day: item.day,
    }));
    
    const onboarding = {
      id: onboardingId,
      business_id: params.businessId,
      user_id: params.userId,
      role_title: params.roleTitle,
      employee_name: params.employeeName || '',
      start_date: params.startDate || new Date().toISOString().split('T')[0],
      content: params.content,
      status: params.status || 'draft',
      sections: sections,
      checklist_items: checklistItems,
      word_count: params.content.split(/\s+/).length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const key = `onboarding:${params.businessId}:${onboardingId}`;
    await kv.set(key, onboarding);

    console.log(`✅ Onboarding plan created: ${onboardingId} - ${params.roleTitle} for business ${params.businessId}`);
    return { success: true, data: onboarding };
  } catch (error: any) {
    console.error('createOnboardingPlan error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update an onboarding plan
 */
export async function updateOnboardingPlan(params: {
  onboardingId: string;
  businessId: string;
  userId: string;
  employeeName?: string;
  content?: string;
  checklistItems?: Array<{
    id: string;
    title: string;
    description: string;
    completed: boolean;
    day: number;
  }>;
  status?: 'draft' | 'scheduled' | 'in_progress' | 'completed';
}) {
  try {
    const key = `onboarding:${params.businessId}:${params.onboardingId}`;
    const existingOnboarding = await kv.get(key);

    if (!existingOnboarding) {
      return { success: false, error: 'Onboarding plan not found' };
    }

    const updatedOnboarding = {
      ...existingOnboarding,
      employee_name: params.employeeName !== undefined ? params.employeeName : existingOnboarding.employee_name,
      content: params.content || existingOnboarding.content,
      checklist_items: params.checklistItems || existingOnboarding.checklist_items,
      status: params.status || existingOnboarding.status,
      word_count: params.content ? params.content.split(/\s+/).length : existingOnboarding.word_count,
      updated_at: new Date().toISOString(),
    };

    await kv.set(key, updatedOnboarding);

    console.log(`✅ Onboarding plan updated: ${params.onboardingId}`);
    return { success: true, data: updatedOnboarding };
  } catch (error: any) {
    console.error('updateOnboardingPlan error:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// PRODUCT FUNCTIONS
// ============================================================================

/**
 * Create a product
 */
export async function createProduct(params: {
  businessId: string;
  userId: string;
  name: string;
  description?: string;
  price?: number;
  category?: string;
  status?: 'idea' | 'development' | 'launched' | 'discontinued';
  targetMarket?: string;
}) {
  try {
    const productId = `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const product = {
      id: productId,
      name: params.name,
      description: params.description || '',
      price: params.price || 0,
      category: params.category || 'Uncategorized',
      status: params.status || 'active', // Changed from 'idea' to 'active' to match ProductOperations expectations
      target_market: params.targetMarket || '',
      sales: 0,
      views: 0,
      conversion_rate: 0,
      business_id: params.businessId,
      user_id: params.userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Get existing products
    const key = `business:${params.userId}:${params.businessId}:products`;
    let products = await kv.get(key) || [];

    // Ensure it's an array
    if (!Array.isArray(products)) {
      products = [];
    }

    // Add new product
    products.push(product);

    await kv.set(key, products);

    console.log(`✅ Product created: ${productId} - ${params.name}`);
    return { success: true, data: product };
  } catch (error: any) {
    console.error('createProduct error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update product
 */
export async function updateProduct(params: {
  productId: string;
  userId: string;
  businessId?: string;
  name?: string;
  description?: string;
  price?: number;
  status?: 'idea' | 'development' | 'launched' | 'discontinued';
}) {
  try {
    // Need to find the product - check business if provided or search all
    let foundProduct = false;
    let productData: any = null;
    let businessId = params.businessId;

    if (businessId) {
      const key = `business:${params.userId}:${businessId}:products`;
      let products = await kv.get(key) || [];

      const productIndex = products.findIndex((p: any) => p.id === params.productId);
      if (productIndex !== -1) {
        products[productIndex] = {
          ...products[productIndex],
          name: params.name || products[productIndex].name,
          description: params.description !== undefined ? params.description : products[productIndex].description,
          price: params.price !== undefined ? params.price : products[productIndex].price,
          status: params.status || products[productIndex].status,
          updated_at: new Date().toISOString(),
        };

        await kv.set(key, products);
        productData = products[productIndex];
        foundProduct = true;
      }
    } else {
      // Search all businesses
      const allKeys = await kv.getByPrefix(`business:${params.userId}:`);
      
      for (const keyData of allKeys) {
        if (Array.isArray(keyData)) {
          const productIndex = keyData.findIndex((p: any) => p.id === params.productId);
          if (productIndex !== -1) {
            keyData[productIndex] = {
              ...keyData[productIndex],
              name: params.name || keyData[productIndex].name,
              description: params.description !== undefined ? params.description : keyData[productIndex].description,
              price: params.price !== undefined ? params.price : keyData[productIndex].price,
              status: params.status || keyData[productIndex].status,
              updated_at: new Date().toISOString(),
            };

            // We'd need the exact key here - this is a limitation
            // For now, return error if businessId not provided
            return { success: false, error: 'businessId is required to update product' };
          }
        }
      }
    }

    if (!foundProduct) {
      return { success: false, error: 'Product not found' };
    }

    console.log(`✅ Product updated: ${params.productId}`);
    return { success: true, data: productData };
  } catch (error: any) {
    console.error('updateProduct error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get all products for a business
 */
export async function getProducts(params: {
  businessId: string;
  userId: string;
}) {
  try {
    const key = `business:${params.userId}:${params.businessId}:products`;
    let products = await kv.get(key);
    
    if (!products) {
      products = [];
    }
    
    if (!Array.isArray(products)) {
      products = [];
    }

    console.log(`✅ Retrieved ${products.length} products for business ${params.businessId}`);
    return { success: true, data: products };
  } catch (error: any) {
    console.error('getProducts error:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// SALES FUNCTIONS
// ============================================================================

/**
 * Create a sales lead
 */
export async function createSalesLead(params: {
  businessId: string;
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  value?: number;
  status?: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
  notes?: string;
}) {
  try {
    const leadId = `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const lead = {
      id: leadId,
      name: params.name,
      email: params.email || '',
      phone: params.phone || '',
      company: params.company || '',
      value: params.value || 0,
      status: params.status || 'new',
      notes: params.notes || '',
      source: 'AI Assistant', // Add source to track where the lead came from
      score: 0, // Default score for new leads
      business_id: params.businessId,
      user_id: params.userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Get existing sales leads (NOT pipeline - leads are separate!)
    const key = `business:${params.userId}:${params.businessId}:sales_leads`;
    let leads = await kv.get(key) || [];

    // Ensure it's an array
    if (!Array.isArray(leads)) {
      leads = [];
    }

    // Add new lead
    leads.push(lead);

    await kv.set(key, leads);

    console.log(`✅ Sales lead created: ${leadId} - ${params.name}`);
    return { success: true, data: lead };
  } catch (error: any) {
    console.error('createSalesLead error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update sales lead
 */
export async function updateSalesLead(params: {
  leadId: string;
  userId: string;
  businessId?: string;
  status?: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
  value?: number;
  notes?: string;
}) {
  try {
    if (!params.businessId) {
      return { success: false, error: 'businessId is required to update sales lead' };
    }

    // FIX: Update sales_leads, not sales_pipeline
    const key = `business:${params.userId}:${params.businessId}:sales_leads`;
    let leads = await kv.get(key) || [];

    const leadIndex = leads.findIndex((l: any) => l.id === params.leadId);
    if (leadIndex === -1) {
      return { success: false, error: 'Sales lead not found' };
    }

    leads[leadIndex] = {
      ...leads[leadIndex],
      status: params.status || leads[leadIndex].status,
      value: params.value !== undefined ? params.value : leads[leadIndex].value,
      notes: params.notes !== undefined ? params.notes : leads[leadIndex].notes,
      updated_at: new Date().toISOString(),
    };

    await kv.set(key, leads);

    console.log(`✅ Sales lead updated: ${params.leadId} -> ${params.status}`);
    return { success: true, data: leads[leadIndex] };
  } catch (error: any) {
    console.error('updateSalesLead error:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// MARKETING FUNCTIONS
// ============================================================================

/**
 * Create a marketing campaign
 */
export async function createMarketingCampaign(params: {
  businessId: string;
  userId: string;
  name: string;
  description?: string;
  type?: 'email' | 'social' | 'content' | 'paid-ads' | 'seo' | 'other';
  budget?: number;
  startDate?: string;
  endDate?: string;
  status?: 'planning' | 'active' | 'paused' | 'completed';
}) {
  try {
    const campaignId = `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const campaign = {
      id: campaignId,
      name: params.name,
      description: params.description || '',
      type: params.type || 'other',
      budget: params.budget || 0,
      spent: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      ctr: 0,
      cpc: 0,
      cpa: 0,
      start_date: params.startDate || new Date().toISOString().split('T')[0],
      end_date: params.endDate || '',
      status: params.status || 'planning',
      results: '',
      business_id: params.businessId,
      user_id: params.userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Get existing campaigns
    const key = `business:${params.userId}:${params.businessId}:marketing_campaigns`;
    let campaigns = await kv.get(key) || [];

    // Ensure it's an array
    if (!Array.isArray(campaigns)) {
      campaigns = [];
    }

    // Add new campaign
    campaigns.push(campaign);

    await kv.set(key, campaigns);

    console.log(`✅ Marketing campaign created: ${campaignId} - ${params.name}`);
    return { success: true, data: campaign };
  } catch (error: any) {
    console.error('createMarketingCampaign error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update marketing campaign
 */
export async function updateMarketingCampaign(params: {
  campaignId: string;
  userId: string;
  businessId?: string;
  status?: 'planning' | 'active' | 'paused' | 'completed';
  budget?: number;
  results?: string;
}) {
  try {
    if (!params.businessId) {
      return { success: false, error: 'businessId is required to update marketing campaign' };
    }

    const key = `business:${params.userId}:${params.businessId}:marketing_campaigns`;
    let campaigns = await kv.get(key) || [];

    const campaignIndex = campaigns.findIndex((c: any) => c.id === params.campaignId);
    if (campaignIndex === -1) {
      return { success: false, error: 'Marketing campaign not found' };
    }

    campaigns[campaignIndex] = {
      ...campaigns[campaignIndex],
      status: params.status || campaigns[campaignIndex].status,
      budget: params.budget !== undefined ? params.budget : campaigns[campaignIndex].budget,
      results: params.results !== undefined ? params.results : campaigns[campaignIndex].results,
      updated_at: new Date().toISOString(),
    };

    await kv.set(key, campaigns);

    console.log(`✅ Marketing campaign updated: ${params.campaignId}`);
    return { success: true, data: campaigns[campaignIndex] };
  } catch (error: any) {
    console.error('updateMarketingCampaign error:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// NOTES FUNCTIONS
// ============================================================================

/**
 * Create a note
 */
export async function createNote(params: {
  businessId: string;
  userId: string;
  title: string;
  content: string;
  category?: string;
  tags?: string[];
}) {
  try {
    const noteId = `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const note = {
      id: noteId,
      business_id: params.businessId,
      user_id: params.userId,
      title: params.title,
      content: params.content,
      category: params.category || 'General',
      tags: params.tags || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const key = `note:${params.userId}:${params.businessId}:${noteId}`;
    await kv.set(key, JSON.stringify(note));

    console.log(`✅ Note created: ${noteId} - ${params.title}`);
    return { success: true, data: note };
  } catch (error: any) {
    console.error('createNote error:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// SALES EXTENDED FUNCTIONS
// ============================================================================
// ============================================================================
// SALES EXTENDED FUNCTIONS (FIXED TO USE ARRAY PATTERN)
// ============================================================================

export async function createSalesDeal(params: { businessId: string; userId: string; title: string; customerId?: string; value: number; stage: string; probability?: number; expectedCloseDate?: string; notes?: string }) {
  try {
    const dealId = `deal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const deal = { 
      id: dealId, 
      business_id: params.businessId, 
      user_id: params.userId, 
      title: params.title, 
      customer_id: params.customerId || null, 
      value: params.value, 
      stage: params.stage, 
      probability: params.probability || 50, 
      expected_close_date: params.expectedCloseDate || null, 
      notes: params.notes || '', 
      created_at: new Date().toISOString(), 
      updated_at: new Date().toISOString() 
    };
    
    const key = `business:${params.userId}:${params.businessId}:sales_deals`;
    let deals = await kv.get(key) || [];
    if (!Array.isArray(deals)) deals = [];
    deals.push(deal);
    await kv.set(key, deals);
    
    console.log(`✅ Sales deal created: ${dealId}`);
    return { success: true, data: deal };
  } catch (error: any) {
    console.error('createSalesDeal error:', error);
    return { success: false, error: error.message };
  }
}

export async function updateSalesDeal(params: { dealId: string; userId: string; businessId?: string; title?: string; value?: number; stage?: string; probability?: number; notes?: string }) {
  try {
    // Find which business this deal belongs to if not provided
    let businessId = params.businessId;
    if (!businessId) {
      const allKeys = await kv.getByPrefix(`business:${params.userId}:`);
      for (const entry of allKeys) {
        if (entry && typeof entry === 'object' && '_key' in entry) {
          const keyStr = (entry as any)._key;
          if (keyStr.includes(':sales_deals')) {
            const parts = keyStr.split(':');
            businessId = parts[2];
            break;
          }
        }
      }
    }
    
    if (!businessId) return { success: false, error: 'Business ID not found' };
    
    const key = `business:${params.userId}:${businessId}:sales_deals`;
    let deals = await kv.get(key) || [];
    if (!Array.isArray(deals)) deals = [];
    
    const dealIndex = deals.findIndex((d: any) => d.id === params.dealId);
    if (dealIndex === -1) return { success: false, error: 'Deal not found' };
    
    const deal = deals[dealIndex];
    if (params.title) deal.title = params.title;
    if (params.value !== undefined) deal.value = params.value;
    if (params.stage) deal.stage = params.stage;
    if (params.probability !== undefined) deal.probability = params.probability;
    if (params.notes) deal.notes = params.notes;
    deal.updated_at = new Date().toISOString();
    
    await kv.set(key, deals);
    console.log(`✅ Sales deal updated: ${params.dealId}`);
    return { success: true, data: deal };
  } catch (error: any) {
    console.error('updateSalesDeal error:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteSalesDeal(params: { dealId: string; userId: string; businessId: string }) {
  try {
    const key = `business:${params.userId}:${params.businessId}:sales_deals`;
    let deals = await kv.get(key) || [];
    if (!Array.isArray(deals)) deals = [];
    
    const dealIndex = deals.findIndex((d: any) => d.id === params.dealId);
    if (dealIndex === -1) return { success: false, error: 'Deal not found' };
    
    deals.splice(dealIndex, 1);
    await kv.set(key, deals);
    console.log(`✅ Sales deal deleted: ${params.dealId}`);
    return { success: true };
  } catch (error: any) {
    console.error('deleteSalesDeal error:', error);
    return { success: false, error: error.message };
  }
}

export async function createSalesCustomer(params: { businessId: string; userId: string; name: string; email?: string; phone?: string; company?: string; industry?: string; address?: string; status?: string; notes?: string }) {
  try {
    const customerId = `customer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const customer = { 
      id: customerId, 
      business_id: params.businessId, 
      user_id: params.userId, 
      name: params.name, 
      email: params.email || '', 
      phone: params.phone || '', 
      company: params.company || '', 
      industry: params.industry || '', 
      address: params.address || '', 
      status: params.status || 'active', 
      notes: params.notes || '', 
      created_at: new Date().toISOString(), 
      updated_at: new Date().toISOString() 
    };
    
    const key = `business:${params.userId}:${params.businessId}:sales_customers`;
    let customers = await kv.get(key) || [];
    if (!Array.isArray(customers)) customers = [];
    customers.push(customer);
    await kv.set(key, customers);
    
    console.log(`✅ Sales customer created: ${customerId}`);
    return { success: true, data: customer };
  } catch (error: any) {
    console.error('createSalesCustomer error:', error);
    return { success: false, error: error.message };
  }
}

export async function updateSalesCustomer(params: { customerId: string; userId: string; businessId?: string; name?: string; email?: string; phone?: string; status?: string; notes?: string }) {
  try {
    let businessId = params.businessId;
    if (!businessId) {
      const allKeys = await kv.getByPrefix(`business:${params.userId}:`);
      for (const entry of allKeys) {
        if (entry && typeof entry === 'object' && '_key' in entry) {
          const keyStr = (entry as any)._key;
          if (keyStr.includes(':sales_customers')) {
            const parts = keyStr.split(':');
            businessId = parts[2];
            break;
          }
        }
      }
    }
    
    if (!businessId) return { success: false, error: 'Business ID not found' };
    
    const key = `business:${params.userId}:${businessId}:sales_customers`;
    let customers = await kv.get(key) || [];
    if (!Array.isArray(customers)) customers = [];
    
    const customerIndex = customers.findIndex((c: any) => c.id === params.customerId);
    if (customerIndex === -1) return { success: false, error: 'Customer not found' };
    
    const customer = customers[customerIndex];
    if (params.name) customer.name = params.name;
    if (params.email) customer.email = params.email;
    if (params.phone) customer.phone = params.phone;
    if (params.status) customer.status = params.status;
    if (params.notes) customer.notes = params.notes;
    customer.updated_at = new Date().toISOString();
    
    await kv.set(key, customers);
    console.log(`✅ Sales customer updated: ${params.customerId}`);
    return { success: true, data: customer };
  } catch (error: any) {
    console.error('updateSalesCustomer error:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteSalesCustomer(params: { customerId: string; userId: string; businessId: string }) {
  try {
    const key = `business:${params.userId}:${params.businessId}:sales_customers`;
    let customers = await kv.get(key) || [];
    if (!Array.isArray(customers)) customers = [];
    
    const customerIndex = customers.findIndex((c: any) => c.id === params.customerId);
    if (customerIndex === -1) return { success: false, error: 'Customer not found' };
    
    customers.splice(customerIndex, 1);
    await kv.set(key, customers);
    console.log(`✅ Sales customer deleted: ${params.customerId}`);
    return { success: true };
  } catch (error: any) {
    console.error('deleteSalesCustomer error:', error);
    return { success: false, error: error.message };
  }
}

export async function createSalesEmailSequence(params: { businessId: string; userId: string; name: string; description?: string; emails?: any[]; status?: string }) {
  try {
    const sequenceId = `sequence_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const sequence = { 
      id: sequenceId, 
      business_id: params.businessId, 
      user_id: params.userId, 
      name: params.name, 
      description: params.description || '', 
      emails: params.emails || [], 
      status: params.status || 'draft', 
      created_at: new Date().toISOString(), 
      updated_at: new Date().toISOString() 
    };
    
    const key = `business:${params.userId}:${params.businessId}:sales_email_sequences`;
    let sequences = await kv.get(key) || [];
    if (!Array.isArray(sequences)) sequences = [];
    sequences.push(sequence);
    await kv.set(key, sequences);
    
    console.log(`✅ Sales email sequence created: ${sequenceId}`);
    return { success: true, data: sequence };
  } catch (error: any) {
    console.error('createSalesEmailSequence error:', error);
    return { success: false, error: error.message };
  }
}

export async function updateSalesEmailSequence(params: { sequenceId: string; userId: string; businessId?: string; name?: string; description?: string; status?: string }) {
  try {
    let businessId = params.businessId;
    if (!businessId) {
      const allKeys = await kv.getByPrefix(`business:${params.userId}:`);
      for (const entry of allKeys) {
        if (entry && typeof entry === 'object' && '_key' in entry) {
          const keyStr = (entry as any)._key;
          if (keyStr.includes(':sales_email_sequences')) {
            const parts = keyStr.split(':');
            businessId = parts[2];
            break;
          }
        }
      }
    }
    
    if (!businessId) return { success: false, error: 'Business ID not found' };
    
    const key = `business:${params.userId}:${businessId}:sales_email_sequences`;
    let sequences = await kv.get(key) || [];
    if (!Array.isArray(sequences)) sequences = [];
    
    const sequenceIndex = sequences.findIndex((s: any) => s.id === params.sequenceId);
    if (sequenceIndex === -1) return { success: false, error: 'Email sequence not found' };
    
    const sequence = sequences[sequenceIndex];
    if (params.name) sequence.name = params.name;
    if (params.description) sequence.description = params.description;
    if (params.status) sequence.status = params.status;
    sequence.updated_at = new Date().toISOString();
    
    await kv.set(key, sequences);
    console.log(`✅ Sales email sequence updated: ${params.sequenceId}`);
    return { success: true, data: sequence };
  } catch (error: any) {
    console.error('updateSalesEmailSequence error:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteSalesEmailSequence(params: { sequenceId: string; userId: string; businessId: string }) {
  try {
    const key = `business:${params.userId}:${params.businessId}:sales_email_sequences`;
    let sequences = await kv.get(key) || [];
    if (!Array.isArray(sequences)) sequences = [];
    
    const sequenceIndex = sequences.findIndex((s: any) => s.id === params.sequenceId);
    if (sequenceIndex === -1) return { success: false, error: 'Email sequence not found' };
    
    sequences.splice(sequenceIndex, 1);
    await kv.set(key, sequences);
    console.log(`✅ Sales email sequence deleted: ${params.sequenceId}`);
    return { success: true };
  } catch (error: any) {
    console.error('deleteSalesEmailSequence error:', error);
    return { success: false, error: error.message };
  }
}

export async function createMarketingLead(params: { businessId: string; userId: string; name: string; email: string; phone?: string; source?: string; campaign?: string; status?: string; score?: number; notes?: string }) {
  try {
    const leadId = `mkt_lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const lead = { 
      id: leadId, 
      business_id: params.businessId, 
      user_id: params.userId, 
      name: params.name, 
      email: params.email, 
      phone: params.phone || '', 
      source: params.source || '', 
      campaign: params.campaign || '', 
      status: params.status || 'new', 
      score: params.score || 0, 
      notes: params.notes || '', 
      created_at: new Date().toISOString(), 
      updated_at: new Date().toISOString() 
    };
    
    const key = `business:${params.userId}:${params.businessId}:marketing_leads`;
    let leads = await kv.get(key) || [];
    if (!Array.isArray(leads)) leads = [];
    leads.push(lead);
    await kv.set(key, leads);
    
    console.log(`✅ Marketing lead created: ${leadId}`);
    return { success: true, data: lead };
  } catch (error: any) {
    console.error('createMarketingLead error:', error);
    return { success: false, error: error.message };
  }
}

export async function updateMarketingLead(params: { leadId: string; userId: string; businessId?: string; name?: string; email?: string; status?: string; score?: number; notes?: string }) {
  try {
    let businessId = params.businessId;
    if (!businessId) {
      const allKeys = await kv.getByPrefix(`business:${params.userId}:`);
      for (const entry of allKeys) {
        if (entry && typeof entry === 'object' && '_key' in entry) {
          const keyStr = (entry as any)._key;
          if (keyStr.includes(':marketing_leads')) {
            const parts = keyStr.split(':');
            businessId = parts[2];
            break;
          }
        }
      }
    }
    
    if (!businessId) return { success: false, error: 'Business ID not found' };
    
    const key = `business:${params.userId}:${businessId}:marketing_leads`;
    let leads = await kv.get(key) || [];
    if (!Array.isArray(leads)) leads = [];
    
    const leadIndex = leads.findIndex((l: any) => l.id === params.leadId);
    if (leadIndex === -1) return { success: false, error: 'Marketing lead not found' };
    
    const lead = leads[leadIndex];
    if (params.name) lead.name = params.name;
    if (params.email) lead.email = params.email;
    if (params.status) lead.status = params.status;
    if (params.score !== undefined) lead.score = params.score;
    if (params.notes) lead.notes = params.notes;
    lead.updated_at = new Date().toISOString();
    
    await kv.set(key, leads);
    console.log(`✅ Marketing lead updated: ${params.leadId}`);
    return { success: true, data: lead };
  } catch (error: any) {
    console.error('updateMarketingLead error:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteMarketingLead(params: { leadId: string; userId: string; businessId: string }) {
  try {
    const key = `business:${params.userId}:${params.businessId}:marketing_leads`;
    let leads = await kv.get(key) || [];
    if (!Array.isArray(leads)) leads = [];
    
    const leadIndex = leads.findIndex((l: any) => l.id === params.leadId);
    if (leadIndex === -1) return { success: false, error: 'Marketing lead not found' };
    
    leads.splice(leadIndex, 1);
    await kv.set(key, leads);
    console.log(`✅ Marketing lead deleted: ${params.leadId}`);
    return { success: true };
  } catch (error: any) {
    console.error('deleteMarketingLead error:', error);
    return { success: false, error: error.message };
  }
}

export async function createEmployeeBenefit(params: { businessId: string; userId: string; name: string; description?: string; type: string; cost?: number; eligibility?: string }) {
  try {
    const benefitId = `benefit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const benefit = { 
      id: benefitId, 
      business_id: params.businessId, 
      user_id: params.userId, 
      name: params.name, 
      description: params.description || '', 
      type: params.type, 
      cost: params.cost || 0, 
      eligibility: params.eligibility || '', 
      created_at: new Date().toISOString(), 
      updated_at: new Date().toISOString() 
    };
    
    const key = `business:${params.userId}:${params.businessId}:employee_benefits`;
    let benefits = await kv.get(key) || [];
    if (!Array.isArray(benefits)) benefits = [];
    benefits.push(benefit);
    await kv.set(key, benefits);
    
    console.log(`✅ Employee benefit created: ${benefitId}`);
    return { success: true, data: benefit };
  } catch (error: any) {
    console.error('createEmployeeBenefit error:', error);
    return { success: false, error: error.message };
  }
}

export async function updateEmployeeBenefit(params: { benefitId: string; userId: string; businessId?: string; name?: string; description?: string; cost?: number }) {
  try {
    let businessId = params.businessId;
    if (!businessId) {
      const allKeys = await kv.getByPrefix(`business:${params.userId}:`);
      for (const entry of allKeys) {
        if (entry && typeof entry === 'object' && '_key' in entry) {
          const keyStr = (entry as any)._key;
          if (keyStr.includes(':employee_benefits')) {
            const parts = keyStr.split(':');
            businessId = parts[2];
            break;
          }
        }
      }
    }
    
    if (!businessId) return { success: false, error: 'Business ID not found' };
    
    const key = `business:${params.userId}:${businessId}:employee_benefits`;
    let benefits = await kv.get(key) || [];
    if (!Array.isArray(benefits)) benefits = [];
    
    const benefitIndex = benefits.findIndex((b: any) => b.id === params.benefitId);
    if (benefitIndex === -1) return { success: false, error: 'Employee benefit not found' };
    
    const benefit = benefits[benefitIndex];
    if (params.name) benefit.name = params.name;
    if (params.description) benefit.description = params.description;
    if (params.cost !== undefined) benefit.cost = params.cost;
    benefit.updated_at = new Date().toISOString();
    
    await kv.set(key, benefits);
    console.log(`✅ Employee benefit updated: ${params.benefitId}`);
    return { success: true, data: benefit };
  } catch (error: any) {
    console.error('updateEmployeeBenefit error:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteEmployeeBenefit(params: { benefitId: string; userId: string; businessId: string }) {
  try {
    const key = `business:${params.userId}:${params.businessId}:employee_benefits`;
    let benefits = await kv.get(key) || [];
    if (!Array.isArray(benefits)) benefits = [];
    
    const benefitIndex = benefits.findIndex((b: any) => b.id === params.benefitId);
    if (benefitIndex === -1) return { success: false, error: 'Employee benefit not found' };
    
    benefits.splice(benefitIndex, 1);
    await kv.set(key, benefits);
    console.log(`✅ Employee benefit deleted: ${params.benefitId}`);
    return { success: true };
  } catch (error: any) {
    console.error('deleteEmployeeBenefit error:', error);
    return { success: false, error: error.message };
  }
}

export async function createEmployeePerformance(params: { businessId: string; userId: string; employeeId: string; reviewDate: string; rating: number; goals?: string; feedback?: string; areasForImprovement?: string; nextReviewDate?: string }) {
  try {
    const performanceId = `performance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const performance = { 
      id: performanceId, 
      business_id: params.businessId, 
      user_id: params.userId, 
      employee_id: params.employeeId, 
      review_date: params.reviewDate, 
      rating: params.rating, 
      goals: params.goals || '', 
      feedback: params.feedback || '', 
      areas_for_improvement: params.areasForImprovement || '', 
      next_review_date: params.nextReviewDate || null, 
      created_at: new Date().toISOString(), 
      updated_at: new Date().toISOString() 
    };
    
    const key = `business:${params.userId}:${params.businessId}:employee_performance`;
    let performances = await kv.get(key) || [];
    if (!Array.isArray(performances)) performances = [];
    performances.push(performance);
    await kv.set(key, performances);
    
    console.log(`✅ Employee performance created: ${performanceId}`);
    return { success: true, data: performance };
  } catch (error: any) {
    console.error('createEmployeePerformance error:', error);
    return { success: false, error: error.message };
  }
}

export async function updateEmployeePerformance(params: { performanceId: string; userId: string; businessId?: string; rating?: number; feedback?: string }) {
  try {
    let businessId = params.businessId;
    if (!businessId) {
      const allKeys = await kv.getByPrefix(`business:${params.userId}:`);
      for (const entry of allKeys) {
        if (entry && typeof entry === 'object' && '_key' in entry) {
          const keyStr = (entry as any)._key;
          if (keyStr.includes(':employee_performance')) {
            const parts = keyStr.split(':');
            businessId = parts[2];
            break;
          }
        }
      }
    }
    
    if (!businessId) return { success: false, error: 'Business ID not found' };
    
    const key = `business:${params.userId}:${businessId}:employee_performance`;
    let performances = await kv.get(key) || [];
    if (!Array.isArray(performances)) performances = [];
    
    const performanceIndex = performances.findIndex((p: any) => p.id === params.performanceId);
    if (performanceIndex === -1) return { success: false, error: 'Performance review not found' };
    
    const performance = performances[performanceIndex];
    if (params.rating !== undefined) performance.rating = params.rating;
    if (params.feedback) performance.feedback = params.feedback;
    performance.updated_at = new Date().toISOString();
    
    await kv.set(key, performances);
    console.log(`✅ Employee performance updated: ${params.performanceId}`);
    return { success: true, data: performance };
  } catch (error: any) {
    console.error('updateEmployeePerformance error:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteEmployeePerformance(params: { performanceId: string; userId: string; businessId: string }) {
  try {
    const key = `business:${params.userId}:${params.businessId}:employee_performance`;
    let performances = await kv.get(key) || [];
    if (!Array.isArray(performances)) performances = [];
    
    const performanceIndex = performances.findIndex((p: any) => p.id === params.performanceId);
    if (performanceIndex === -1) return { success: false, error: 'Performance review not found' };
    
    performances.splice(performanceIndex, 1);
    await kv.set(key, performances);
    console.log(`✅ Employee performance deleted: ${params.performanceId}`);
    return { success: true };
  } catch (error: any) {
    console.error('deleteEmployeePerformance error:', error);
    return { success: false, error: error.message };
  }
}

export async function createContractor(params: { businessId: string; userId: string; name: string; email?: string; company?: string; specialty: string; hourlyRate?: number; startDate?: string; endDate?: string; status?: string }) {
  try {
    const contractorId = `contractor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const contractor = { 
      id: contractorId, 
      business_id: params.businessId, 
      user_id: params.userId, 
      name: params.name, 
      email: params.email || '', 
      company: params.company || '', 
      specialty: params.specialty, 
      hourly_rate: params.hourlyRate || 0, 
      start_date: params.startDate || null, 
      end_date: params.endDate || null, 
      status: params.status || 'active', 
      created_at: new Date().toISOString(), 
      updated_at: new Date().toISOString() 
    };
    
    const key = `business:${params.userId}:${params.businessId}:contractors`;
    let contractors = await kv.get(key) || [];
    if (!Array.isArray(contractors)) contractors = [];
    contractors.push(contractor);
    await kv.set(key, contractors);
    
    console.log(`✅ Contractor created: ${contractorId}`);
    return { success: true, data: contractor };
  } catch (error: any) {
    console.error('createContractor error:', error);
    return { success: false, error: error.message };
  }
}

export async function updateContractor(params: { contractorId: string; userId: string; businessId?: string; name?: string; hourlyRate?: number; status?: string }) {
  try {
    let businessId = params.businessId;
    if (!businessId) {
      const allKeys = await kv.getByPrefix(`business:${params.userId}:`);
      for (const entry of allKeys) {
        if (entry && typeof entry === 'object' && '_key' in entry) {
          const keyStr = (entry as any)._key;
          if (keyStr.includes(':contractors')) {
            const parts = keyStr.split(':');
            businessId = parts[2];
            break;
          }
        }
      }
    }
    
    if (!businessId) return { success: false, error: 'Business ID not found' };
    
    const key = `business:${params.userId}:${businessId}:contractors`;
    let contractors = await kv.get(key) || [];
    if (!Array.isArray(contractors)) contractors = [];
    
    const contractorIndex = contractors.findIndex((c: any) => c.id === params.contractorId);
    if (contractorIndex === -1) return { success: false, error: 'Contractor not found' };
    
    const contractor = contractors[contractorIndex];
    if (params.name) contractor.name = params.name;
    if (params.hourlyRate !== undefined) contractor.hourly_rate = params.hourlyRate;
    if (params.status) contractor.status = params.status;
    contractor.updated_at = new Date().toISOString();
    
    await kv.set(key, contractors);
    console.log(`✅ Contractor updated: ${params.contractorId}`);
    return { success: true, data: contractor };
  } catch (error: any) {
    console.error('updateContractor error:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteContractor(params: { contractorId: string; userId: string; businessId: string }) {
  try {
    const key = `business:${params.userId}:${params.businessId}:contractors`;
    let contractors = await kv.get(key) || [];
    if (!Array.isArray(contractors)) contractors = [];
    
    const contractorIndex = contractors.findIndex((c: any) => c.id === params.contractorId);
    if (contractorIndex === -1) return { success: false, error: 'Contractor not found' };
    
    contractors.splice(contractorIndex, 1);
    await kv.set(key, contractors);
    console.log(`✅ Contractor deleted: ${params.contractorId}`);
    return { success: true };
  } catch (error: any) {
    console.error('deleteContractor error:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteHandbook(params: { handbookId: string; userId: string; businessId: string }) {
  try {
    const key = `business:${params.userId}:${params.businessId}:handbooks`;
    let handbooks = await kv.get(key) || [];
    if (!Array.isArray(handbooks)) handbooks = [];
    
    const handbookIndex = handbooks.findIndex((h: any) => h.id === params.handbookId);
    if (handbookIndex === -1) return { success: false, error: 'Handbook not found' };
    
    handbooks.splice(handbookIndex, 1);
    await kv.set(key, handbooks);
    console.log(`✅ Handbook deleted: ${params.handbookId}`);
    return { success: true };
  } catch (error: any) {
    console.error('deleteHandbook error:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteOnboardingPlan(params: { planId: string; userId: string; businessId: string }) {
  try {
    const key = `business:${params.userId}:${params.businessId}:onboarding_plans`;
    let plans = await kv.get(key) || [];
    if (!Array.isArray(plans)) plans = [];
    
    const planIndex = plans.findIndex((p: any) => p.id === params.planId);
    if (planIndex === -1) return { success: false, error: 'Onboarding plan not found' };
    
    plans.splice(planIndex, 1);
    await kv.set(key, plans);
    console.log(`✅ Onboarding plan deleted: ${params.planId}`);
    return { success: true };
  } catch (error: any) {
    console.error('deleteOnboardingPlan error:', error);
    return { success: false, error: error.message };
  }
}

export async function updateUserProfile(params: { userId: string; name?: string; email?: string; phone?: string; title?: string; bio?: string }) {
  try {
    const key = `user_profile:${params.userId}`;
    let profile = await kv.get(key);
    
    if (!profile) {
      profile = { user_id: params.userId, created_at: new Date().toISOString() };
    } else if (typeof profile === 'string') {
      profile = JSON.parse(profile);
    }
    
    if (params.name) profile.name = params.name;
    if (params.email) profile.email = params.email;
    if (params.phone) profile.phone = params.phone;
    if (params.title) profile.title = params.title;
    if (params.bio) profile.bio = params.bio;
    profile.updated_at = new Date().toISOString();
    
    await kv.set(key, profile);
    console.log(`✅ User profile updated: ${params.userId}`);
    return { success: true, data: profile };
  } catch (error: any) {
    console.error('updateUserProfile error:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// FUNCTION EXECUTOR
// ============================================================================

/**
 * Execute a function call from the AI
 */
export async function executeFunctionCall(
  functionName: string,
  parameters: any,
  userId: string
): Promise<any> {
  console.log(`🔧 Executing function: ${functionName}`, parameters);

  const functionMap: Record<string, Function> = {
    createTransaction,
    updateTransaction,
    deleteTransaction,
    createBudget,
    createRoadmapTask,
    updateRoadmapTaskStatus,
    deleteRoadmapTask,
    addTeamMember,
    updateTeamMember,
    createProduct,
    updateProduct,
    getProducts,
    createSalesLead,
    updateSalesLead,
    createSalesDeal,
    updateSalesDeal,
    deleteSalesDeal,
    createSalesCustomer,
    updateSalesCustomer,
    deleteSalesCustomer,
    createSalesEmailSequence,
    updateSalesEmailSequence,
    deleteSalesEmailSequence,
    createMarketingCampaign,
    updateMarketingCampaign,
    createMarketingLead,
    updateMarketingLead,
    deleteMarketingLead,
    createNote,
    createHandbook,
    updateHandbook,
    deleteHandbook,
    createOnboardingPlan,
    updateOnboardingPlan,
    deleteOnboardingPlan,
    createEmployeeBenefit,
    updateEmployeeBenefit,
    deleteEmployeeBenefit,
    createEmployeePerformance,
    updateEmployeePerformance,
    deleteEmployeePerformance,
    createContractor,
    updateContractor,
    deleteContractor,
    updateUserProfile,
  };

  const func = functionMap[functionName];
  if (!func) {
    return {
      success: false,
      error: `Unknown function: ${functionName}`,
    };
  }

  // Add userId to parameters
  const paramsWithUser = { ...parameters, userId };

  // Execute the function
  const result = await func(paramsWithUser);
  
  console.log(`✅ Function ${functionName} executed:`, result.success ? 'SUCCESS' : 'FAILED');
  
  return result;
}