import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { createClient } from 'npm:@supabase/supabase-js';
import { handleUserDataContext } from './user-data-context.tsx';

const app = new Hono();

// CORS middleware
app.use('*', cors({
  origin: '*',
  allowHeaders: ['*'],
  allowMethods: ['*'],
  credentials: false
}));

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// AI Function execution is now handled inline in the main handler

async function addIncomeEntry(params: any, context: any) {
  console.log('🤖 addIncomeEntry called with:', params);
  console.log('🤖 addIncomeEntry context received:', {
    context: context,
    businessId: context?.businessId,
    userId: context?.userId,
    hasAccessToken: !!context?.accessToken,
    projectId: context?.projectId
  });
  
  try {
    const requestBody = {
      amount: params.amount,
      description: params.description,
      category: params.category || 'other',
      date: params.date || new Date().toISOString().split('T')[0],
      businessId: context.businessId
    };
    
    console.log('🤖 addIncomeEntry sending request body:', requestBody);
    
    const response = await fetch(`https://${context.projectId}.supabase.co/functions/v1/make-server-373d8b09/finance/add-income`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${context.accessToken}`
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log('🤖 addIncomeEntry response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('🤖 addIncomeEntry error response:', errorText);
      
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `API request failed with status ${response.status}`);
      } catch (parseError) {
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
      }
    }
    
    const result = await response.json();
    console.log('🤖 addIncomeEntry result:', result);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to add income entry');
    }
    
    return {
      success: true,
      message: `Successfully added income entry: ${params.amount} for ${params.description}`,
      data: result.data
    };
  } catch (error: any) {
    console.error('🤖 addIncomeEntry error:', error);
    throw error;
  }
}

async function addExpenseEntry(params: any, context: any) {
  const response = await fetch(`https://${context.projectId}.supabase.co/functions/v1/make-server-373d8b09/finance/add-expense`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${context.accessToken}`
    },
    body: JSON.stringify({
      amount: params.amount,
      description: params.description,
      category: params.category || 'other',
      date: params.date || new Date().toISOString().split('T')[0],
      businessId: context.businessId
    })
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
    throw new Error(errorData.error || `API request failed with status ${response.status}`);
  }
  
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to add expense entry');
  }
  
  return {
    success: true,
    message: `Successfully added expense entry: ${params.amount} for ${params.description}`,
    data: result.data
  };
}

async function createNote(params: any, context: any) {
  const response = await fetch(`https://${context.projectId}.supabase.co/functions/v1/make-server-373d8b09/notes/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${context.accessToken}`
    },
    body: JSON.stringify({
      title: params.title,
      content: params.content,
      category: params.category || 'general',
      priority: params.priority || 'medium',
      businessId: context.businessId
    })
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
    throw new Error(errorData.error || `API request failed with status ${response.status}`);
  }
  
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to create note');
  }
  
  return {
    success: true,
    message: `Successfully created note: "${params.title}"`,
    data: result.data
  };
}

async function manageBudget(params: any, context: any) {
  const endpoint = params.action === 'create' ? 'create-budget' : 'update-budget';
  const response = await fetch(`https://${context.projectId}.supabase.co/functions/v1/make-server-373d8b09/finance/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${context.accessToken}`
    },
    body: JSON.stringify({
      category: params.category,
      limit: params.limit,
      period: params.period || 'monthly',
      businessId: context.businessId
    })
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
    throw new Error(errorData.error || `API request failed with status ${response.status}`);
  }
  
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to manage budget');
  }
  
  return {
    success: true,
    message: `Successfully ${params.action}d budget for ${params.category}: ${params.limit}`,
    data: result.data
  };
}

async function createInvoice(params: any, context: any) {
  console.log('🧾 createInvoice called with:', params);
  
  try {
    const response = await fetch(`https://${context.projectId}.supabase.co/functions/v1/make-server-373d8b09/finance/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${context.accessToken}`
      },
      body: JSON.stringify({
        businessId: context.businessId,
        clientName: params.clientName,
        clientEmail: params.clientEmail,
        amount: params.amount,
        description: params.description,
        dueDate: params.dueDate,
        status: params.status || 'pending',
        items: params.items || [],
        notes: params.notes
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('🧾 createInvoice error response:', errorText);
      
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `API request failed with status ${response.status}`);
      } catch (parseError) {
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
      }
    }
    
    const result = await response.json();
    console.log('🧾 createInvoice result:', result);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to create invoice');
    }
    
    return {
      success: true,
      message: `Successfully created invoice for ${params.clientName}: ${params.amount}`,
      data: result.data
    };
  } catch (error: any) {
    console.error('🧾 createInvoice error:', error);
    throw error;
  }
}

async function setBankBalance(params: any, context: any) {
  console.log('🏦 setBankBalance called with:', params);
  
  try {
    const response = await fetch(`https://${context.projectId}.supabase.co/functions/v1/make-server-373d8b09/finance/set-bank-balance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${context.accessToken}`
      },
      body: JSON.stringify({
        businessId: context.businessId,
        balance: params.balance,
        accountName: params.accountName || 'Main Account',
        notes: params.notes
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('🏦 setBankBalance error response:', errorText);
      
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `API request failed with status ${response.status}`);
      } catch (parseError) {
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
      }
    }
    
    const result = await response.json();
    console.log('🏦 setBankBalance result:', result);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to set bank balance');
    }
    
    return {
      success: true,
      message: `Successfully set bank balance to ${params.balance}`,
      data: result.data
    };
  } catch (error: any) {
    console.error('🏦 setBankBalance error:', error);
    throw error;
  }
}

async function getFinancialProjections(params: any, context: any) {
  console.log('📊 getFinancialProjections called with:', params);
  
  try {
    const response = await fetch(`https://${context.projectId}.supabase.co/functions/v1/make-server-373d8b09/finance/projections?businessId=${context.businessId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${context.accessToken}`
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('📊 getFinancialProjections error response:', errorText);
      
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `API request failed with status ${response.status}`);
      } catch (parseError) {
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
      }
    }
    
    const result = await response.json();
    console.log('📊 getFinancialProjections result:', result);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to get financial projections');
    }
    
    return {
      success: true,
      message: `Retrieved financial projections for the next ${params.months || 12} months`,
      data: result.data
    };
  } catch (error: any) {
    console.error('📊 getFinancialProjections error:', error);
    throw error;
  }
}

async function addDreamBoardGoal(params: any, context: any) {
  const response = await fetch(`https://${context.projectId}.supabase.co/functions/v1/make-server-373d8b09/dreams`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${context.accessToken}`
    },
    body: JSON.stringify({
      userId: context.userId,
      businessId: context.businessId,
      title: params.title,
      description: params.description,
      category: params.category || 'personal',
      targetDate: params.targetDate,
      targetAmount: params.isFinancial ? params.targetAmount : undefined,
      priority: 'medium'
    })
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
    throw new Error(errorData.error || `API request failed with status ${response.status}`);
  }
  
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to add dream board goal');
  }
  
  return {
    success: true,
    message: `Successfully added goal to dream board: "${params.title}"`,
    data: result.dream
  };
}

async function updateBusinessInfo(params: any, context: any) {
  console.log('🏢 updateBusinessInfo called with:', params);
  
  try {
    const response = await fetch(`https://${context.projectId}.supabase.co/functions/v1/make-server-ac1075a9/businesses/${context.businessId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${context.accessToken}`
      },
      body: JSON.stringify({
        name: params.name,
        description: params.description,
        industry: params.industry,
        stage: params.stage
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('🏢 updateBusinessInfo error response:', errorText);
      
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `API request failed with status ${response.status}`);
      } catch (parseError) {
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
      }
    }
    
    const result = await response.json();
    console.log('🏢 updateBusinessInfo result:', result);
    
    if (!result.business) {
      throw new Error('Failed to update business information');
    }
    
    return {
      success: true,
      message: `Successfully updated business information${params.name ? `: ${params.name}` : ''}`,
      data: result.business
    };
  } catch (error: any) {
    console.error('🏢 updateBusinessInfo error:', error);
    throw error;
  }
}

async function createProduct(params: any, context: any) {
  console.log('🏭 createProduct called with:', params);
  
  try {
    const response = await fetch(`https://${context.projectId}.supabase.co/functions/v1/make-server-373d8b09/products?businessId=${context.businessId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${context.accessToken}`
      },
      body: JSON.stringify({
        name: params.name,
        description: params.description,
        price: params.price,
        category: params.category,
        status: params.status || 'active',
        inventory: params.inventory || 0
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('🏭 createProduct error response:', errorText);
      
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `API request failed with status ${response.status}`);
      } catch (parseError) {
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
      }
    }
    
    const result = await response.json();
    console.log('🏭 createProduct result:', result);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to create product');
    }
    
    return {
      success: true,
      message: `✅ Successfully created product "${params.name}" priced at ${params.price}!\n\n📋 Product Details:\n- Status: ${params.status || 'active'}\n- Category: ${params.category}\n- Inventory: ${params.inventory || 0}\n\n💡 To see your new product:\n1. Go to Operations > Product Operations\n2. Click the "Refresh" button\n3. Your product will appear in the list!\n\n(Note: The page auto-refreshes every 30 seconds, or you can click Refresh manually)`,
      data: result.product
    };
  } catch (error: any) {
    console.error('🏭 createProduct error:', error);
    throw error;
  }
}

async function updateProduct(params: any, context: any) {
  console.log('🏭 updateProduct called with:', params);
  
  try {
    const { productId, ...updateData } = params;
    
    const response = await fetch(`https://${context.projectId}.supabase.co/functions/v1/make-server-373d8b09/products/${productId}?businessId=${context.businessId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${context.accessToken}`
      },
      body: JSON.stringify(updateData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('🏭 updateProduct error response:', errorText);
      
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `API request failed with status ${response.status}`);
      } catch (parseError) {
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
      }
    }
    
    const result = await response.json();
    console.log('🏭 updateProduct result:', result);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to update product');
    }
    
    let updateMessage = 'Successfully updated product';
    if (params.name) updateMessage += ` - Name: ${params.name}`;
    if (params.price !== undefined) updateMessage += ` - Price: ${params.price}`;
    
    return {
      success: true,
      message: updateMessage,
      data: result.product
    };
  } catch (error: any) {
    console.error('🏭 updateProduct error:', error);
    throw error;
  }
}

async function deleteProduct(params: any, context: any) {
  console.log('🏭 deleteProduct called with:', params);
  
  try {
    const response = await fetch(`https://${context.projectId}.supabase.co/functions/v1/make-server-373d8b09/products/${params.productId}?businessId=${context.businessId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${context.accessToken}`
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('🏭 deleteProduct error response:', errorText);
      
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `API request failed with status ${response.status}`);
      } catch (parseError) {
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
      }
    }
    
    const result = await response.json();
    console.log('🏭 deleteProduct result:', result);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to delete product');
    }
    
    return {
      success: true,
      message: 'Successfully deleted the product from your catalog',
      data: result.product
    };
  } catch (error: any) {
    console.error('🏭 deleteProduct error:', error);
    throw error;
  }
}

async function createProduct(params: any, context: any) {
  console.log('🏭 createProduct called with:', params);
  
  try {
    const response = await fetch(`https://${context.projectId}.supabase.co/functions/v1/make-server-373d8b09/products?businessId=${context.businessId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${context.accessToken}`
      },
      body: JSON.stringify({
        name: params.name,
        description: params.description,
        price: params.price,
        category: params.category,
        status: params.status || 'active',
        inventory: params.inventory || 0
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('🏭 createProduct error response:', errorText);
      
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `API request failed with status ${response.status}`);
      } catch (parseError) {
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
      }
    }
    
    const result = await response.json();
    console.log('🏭 createProduct result:', result);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to create product');
    }
    
    return {
      success: true,
      message: `Successfully created product "${params.name}" priced at ${params.price}`,
      data: result.product
    };
  } catch (error: any) {
    console.error('🏭 createProduct error:', error);
    throw error;
  }
}

async function updateProduct(params: any, context: any) {
  console.log('🏭 updateProduct called with:', params);
  
  try {
    const { productId, ...updateData } = params;
    
    const response = await fetch(`https://${context.projectId}.supabase.co/functions/v1/make-server-373d8b09/products/${productId}?businessId=${context.businessId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${context.accessToken}`
      },
      body: JSON.stringify(updateData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('🏭 updateProduct error response:', errorText);
      
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `API request failed with status ${response.status}`);
      } catch (parseError) {
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
      }
    }
    
    const result = await response.json();
    console.log('🏭 updateProduct result:', result);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to update product');
    }
    
    let updateMessage = 'Successfully updated product';
    if (params.name) updateMessage += ` - Name: ${params.name}`;
    if (params.price !== undefined) updateMessage += ` - Price: ${params.price}`;
    
    return {
      success: true,
      message: updateMessage,
      data: result.product
    };
  } catch (error: any) {
    console.error('🏭 updateProduct error:', error);
    throw error;
  }
}

async function deleteProduct(params: any, context: any) {
  console.log('🏭 deleteProduct called with:', params);
  
  try {
    const response = await fetch(`https://${context.projectId}.supabase.co/functions/v1/make-server-373d8b09/products/${params.productId}?businessId=${context.businessId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${context.accessToken}`
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('🏭 deleteProduct error response:', errorText);
      
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `API request failed with status ${response.status}`);
      } catch (parseError) {
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
      }
    }
    
    const result = await response.json();
    console.log('🏭 deleteProduct result:', result);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to delete product');
    }
    
    return {
      success: true,
      message: 'Successfully deleted the product from your catalog',
      data: result.product
    };
  } catch (error: any) {
    console.error('🏭 deleteProduct error:', error);
    throw error;
  }
}

// Your custom assistant ID
const ASSISTANT_ID = 'asst_Wfoh17ScM2gQ2i83sMQn7Z4o';

let supabase: any = null;
if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

// Chat completion endpoint using OpenAI Assistants API
app.post('/chat', async (c) => {
  console.log('🤖 OpenAI: Assistant chat endpoint called');
  
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    const requestBody = await c.req.json();
    console.log('🤖 OpenAI: Request body:', requestBody);
    console.log('🤖 OpenAI: Business context details:', {
      businessContext: requestBody.businessContext,
      businessContextId: requestBody.businessContext?.id,
      businessContextBusinessId: requestBody.businessContext?.businessId,
      businessContextKeys: requestBody.businessContext ? Object.keys(requestBody.businessContext) : 'null',
      businessContextType: typeof requestBody.businessContext,
      directBusinessId: requestBody.businessId,
      businessIdType: typeof requestBody.businessId
    });
    
    const { message, conversationHistory = [], businessContext, threadId, businessId } = requestBody;
    
    if (!message || typeof message !== 'string') {
      console.error('🤖 OpenAI: Invalid message data:', { message });
      return c.json({ success: false, error: 'Valid message is required' }, 400);
    }

    if (!OPENAI_API_KEY) {
      console.error('🤖 OpenAI: OPENAI_API_KEY not configured');
      return c.json({ success: false, error: 'OpenAI API not configured. Please set up your API key.' }, 500);
    }

    if (!accessToken) {
      console.error('🤖 OpenAI: No access token provided');
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    console.log('🤖 OpenAI: Using Assistant ID:', ASSISTANT_ID);
    
    // Validate assistant exists (optional check - comment out if causing issues)
    try {
      const assistantCheckResponse = await fetch(`https://api.openai.com/v1/assistants/${ASSISTANT_ID}`, {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2',
        }
      });
      
      if (!assistantCheckResponse.ok) {
        console.error('🤖 OpenAI: Assistant validation failed:', assistantCheckResponse.status);
        const errorText = await assistantCheckResponse.text();
        console.error('🤖 OpenAI: Assistant error details:', errorText);
        // Don't fail here, just log the warning and continue
        console.warn('🤖 OpenAI: Proceeding without assistant validation');
      } else {
        console.log('🤖 OpenAI: Assistant validated successfully');
      }
    } catch (assistantError) {
      console.warn('🤖 OpenAI: Assistant validation check failed:', assistantError.message);
      // Continue anyway
    }
    
    // Get current user ID for security verification
    let currentUserId = 'unknown';
    if (accessToken) {
      try {
        const payload = decodeJWT(accessToken);
        currentUserId = payload?.sub || payload?.user_id || 'unknown';
      } catch (error) {
        console.warn('🤖 OpenAI: Failed to decode JWT:', error.message);
      }
    }
    
    let currentThreadId = threadId;
    
    // SECURITY: If an existing threadId is provided, verify it belongs to the current user
    if (currentThreadId) {
      console.log('🤖 OpenAI: Verifying thread ownership for thread:', currentThreadId);
      
      try {
        const threadCheckResponse = await fetch(`https://api.openai.com/v1/threads/${currentThreadId}`, {
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'OpenAI-Beta': 'assistants=v2',
          }
        });
        
        if (threadCheckResponse.ok) {
          const threadData = await threadCheckResponse.json();
          const threadUserId = threadData.metadata?.userId;
          
          // Verify the thread belongs to the current user
          if (threadUserId && threadUserId !== currentUserId) {
            console.error('🚨 SECURITY ALERT: User', currentUserId, 'attempted to access thread belonging to user', threadUserId);
            throw new Error('Access denied: This conversation belongs to another user');
          }
          
          console.log('✅ Thread ownership verified for user:', currentUserId);
        } else {
          console.warn('⚠️ Thread verification failed, will create new thread');
          currentThreadId = null; // Force creation of a new thread
        }
      } catch (verifyError) {
        console.error('🤖 OpenAI: Thread verification error:', verifyError.message);
        // If verification fails, create a new thread instead of risking security breach
        currentThreadId = null;
      }
    }
    
    // Create a new thread if we don't have one
    if (!currentThreadId) {
      console.log('🤖 OpenAI: Creating new thread for user:', currentUserId);
      
      const threadRequestBody = {
        metadata: {
          businessContext: businessContext ? JSON.stringify(businessContext) : null,
          userId: currentUserId,
          timestamp: new Date().toISOString()
        }
      };
      
      console.log('🤖 OpenAI: Thread request body:', JSON.stringify(threadRequestBody, null, 2));
      
      const threadResponse = await fetch('https://api.openai.com/v1/threads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2',
        },
        body: JSON.stringify(threadRequestBody)
      });

      console.log('🤖 OpenAI: Thread response status:', threadResponse.status);
      console.log('🤖 OpenAI: Thread response headers:', Object.fromEntries(threadResponse.headers.entries()));

      if (!threadResponse.ok) {
        const errorText = await threadResponse.text();
        console.error('🤖 OpenAI: Failed to create thread - Status:', threadResponse.status);
        console.error('🤖 OpenAI: Failed to create thread - Error:', errorText);
        console.error('🤖 OpenAI: Failed to create thread - API Key valid:', OPENAI_API_KEY ? 'Yes (length: ' + OPENAI_API_KEY.length + ')' : 'No');
        
        // Try to parse the error response
        let errorDetail = errorText;
        try {
          const errorJson = JSON.parse(errorText);
          errorDetail = errorJson.error?.message || errorText;
        } catch (parseError) {
          // Keep the original error text
        }
        
        throw new Error(`Failed to create thread: ${threadResponse.status} - ${errorDetail}`);
      }

      const threadData = await threadResponse.json();
      currentThreadId = threadData.id;
      console.log('🤖 OpenAI: Created thread successfully:', currentThreadId);
    }

    // Add user message to thread
    console.log('🤖 OpenAI: Adding message to thread...');
    const messageResponse = await fetch(`https://api.openai.com/v1/threads/${currentThreadId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify({
        role: 'user',
        content: message,
        metadata: {
          businessName: businessContext?.name || null,
          businessIndustry: businessContext?.industry || null,
        }
      })
    });

    if (!messageResponse.ok) {
      const errorText = await messageResponse.text();
      console.error('🤖 OpenAI: Failed to add message:', messageResponse.status, errorText);
      throw new Error(`Failed to add message: ${messageResponse.status}`);
    }

    // Get comprehensive context for enhanced AI guidance
    console.log('🤖 OpenAI: Gathering app knowledge and user data context...');
    let appKnowledge = '';
    let userDataContext = '';
    
    try {
      // Get app knowledge
      try {
        // Create a simple app knowledge summary directly here to avoid import issues
        appKnowledge = `# Cofounder App Features & Capabilities

## Core Features Available:
• **Main Dashboard** (/dashboard): Central hub showing business overview, key metrics, recent activity, and quick actions
• **Business Management** (/businesses): Create, switch between, and manage multiple businesses with separate data contexts
• **Finance Operations** (/operations/finance): Comprehensive financial management including income tracking, expense management, budgets, invoices, and financial projections
• **Roadmap System** (/roadmap-test): Industry-specific roadmaps with tasks, milestones, tutorials, and progress tracking
• **Cofounder AI Assistant** (/cofounder): AI-powered business assistant that provides personalized guidance and answers questions
• **Cofounder University** (/university): Comprehensive learning platform with tutorials, tracks, progress tracking, and step-by-step guides
• **Dream Board** (/dream-board): Visual goal setting and aspiration tracking with images, goals, and progress tracking
• **Business OS** (/operations): Central operations management including product, marketing, sales, finance, and HR operations
• **Industry Match Quiz** (/quiz): Intelligent quiz system that analyzes your situation and recommends the best industry/business model fit

## Key Capabilities:
• **Financial Tracking**: Track income, expenses, budgets, and financial projections
• **Roadmap Planning**: Create and follow industry-specific business roadmaps  
• **Learning & Education**: Access comprehensive business education through University
• **AI-Powered Guidance**: Get personalized business advice and strategic recommendations
• **Multi-Business Management**: Manage multiple businesses with separate contexts and data
• **Operations Management**: Comprehensive business operations across all departments
• **Goal Setting & Vision**: Visual goal setting and aspiration tracking through Dream Board
• **Progress Tracking**: Monitor progress across all business activities and learning

## When helping users, always:
1. Direct them to existing features within our app rather than external tools
2. Mention specific paths they can navigate to
3. Reference their actual data when giving advice
4. Suggest relevant tutorials from University when applicable
5. Recommend appropriate operations sections for their needs`;
        console.log('🤖 OpenAI: App knowledge loaded');
      } catch (appError) {
        console.warn('🤖 OpenAI: App knowledge fallback used:', appError.message);
      }
      
      // Get user data context
      if (accessToken && businessContext?.id) {
        let payload, userId;
        try {
          payload = decodeJWT(accessToken);
          userId = payload?.sub || payload?.user_id;
        } catch (error) {
          console.warn('🤖 OpenAI: Failed to decode JWT for user context:', error.message);
          payload = null;
          userId = null;
        }
        
        if (userId) {
          const contextRequest = new Request('dummy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              businessId: businessId || businessContext.id || businessContext.businessId
            })
          });
          
          const contextResponse = await handleUserDataContext(contextRequest);
          if (contextResponse.ok) {
            const contextData = await contextResponse.json();
            if (contextData.success && contextData.context) {
              // Format user data context directly
              const context = contextData.context;
              const { 
                user, 
                currentBusiness, 
                businesses, 
                financialData, 
                roadmapProgress, 
                universityProgress, 
                dreamBoard, 
                notes 
              } = context;

              userDataContext = `# User Business Context

## User: ${user.name || user.email}
${businesses.length > 1 ? `**Managing ${businesses.length} businesses:**\n${businesses.map(biz => `• ${biz.name} (${biz.industry}) - ${biz.stage}`).join('\n')}\n` : ''}

${currentBusiness ? `## Current Business: ${currentBusiness.name}
**Industry:** ${currentBusiness.industry}
**Stage:** ${currentBusiness.stage}
**Description:** ${currentBusiness.description}\n` : ''}

## Financial Overview
**Net Income:** ${financialData.netIncome.toLocaleString()} (Income: ${financialData.totalIncome.toLocaleString()}, Expenses: ${financialData.totalExpenses.toLocaleString()})

${financialData.budgets.length > 0 ? `**Budget Status:**\n${financialData.budgets.map(budget => {
  const status = budget.remaining >= 0 ? '✅' : '⚠️';
  return `${status} ${budget.category}: ${budget.spent}/${budget.limit} (${budget.remaining >= 0 ? 'under' : 'over'} by ${Math.abs(budget.remaining)})`;
}).join('\n')}\n` : ''}

${roadmapProgress.currentRoadmap ? `## Business Roadmap Progress
**Current Roadmap:** ${roadmapProgress.currentRoadmap.name} (${roadmapProgress.currentRoadmap.industry})
**Progress:** ${roadmapProgress.currentRoadmap.completedTasks}/${roadmapProgress.currentRoadmap.totalTasks} tasks (${roadmapProgress.currentRoadmap.progressPercent}%)\n` : ''}

${universityProgress.completedTutorials.length > 0 ? `## Learning Progress (University)
**Completed Tutorials:** ${universityProgress.completedTutorials.length}\n` : ''}

${dreamBoard.totalGoals > 0 ? `## Goals & Vision (Dream Board)
**Goals:** ${dreamBoard.completedGoals}/${dreamBoard.totalGoals} completed\n` : ''}

## AI Guidance Notes
When providing advice:
1. Reference this actual data rather than giving generic advice
2. Suggest specific next steps based on current progress
3. Point to relevant features in our app for implementation
4. Consider the business stage and industry context
5. Build upon existing goals, progress, and financial situation`;
              console.log('🤖 OpenAI: User data context loaded');
            }
          }
        }
      }
    } catch (error) {
      console.warn('🤖 OpenAI: Failed to load enhanced context:', error.message);
      // Continue without enhanced context
    }
    
    // Build comprehensive instructions
    let instructions = `You are the Cofounder AI Assistant, helping entrepreneurs build and scale their businesses with personalized, data-driven guidance.

${appKnowledge}

${userDataContext}

## IMPORTANT: You can take actions for users!
You have the ability to directly modify their business data through function calls. When users ask you to add income, create expenses, make notes, update tasks, or manage budgets, you can do this for them automatically.

Available Actions:
• **add_income_entry**: Add income to their financial records
• **add_expense_entry**: Add expenses to their financial records  
• **create_note**: Create business notes and memos
• **update_roadmap_task**: Mark roadmap tasks as completed
• **manage_budget**: Create or update budget categories
• **add_dream_board_goal**: Add goals to their vision board
• **create_invoice**: Create invoices for clients
• **set_bank_balance**: Set or update bank account balance
• **get_financial_projections**: Analyze financial projections and forecasts
• **update_business_info**: Update business information including name, description, industry, or stage
• **create_product**: Create new products for their business catalog
• **update_product**: Update existing product information  
• **delete_product**: Remove products from their catalog

## IMPORTANT: Business Information Updates
When users ask to change their business name, description, industry, or stage, ALWAYS use the update_business_info function immediately. You have full access to modify their business information. Examples:
- "Change my business name to TechCorp" → Use update_business_info with name parameter
- "Update my business description to..." → Use update_business_info with description parameter  
- "My industry should be Technology" → Use update_business_info with industry parameter
- "We're in the growth stage now" → Use update_business_info with stage parameter

## IMPORTANT: Product Management
When users ask to create, update, or delete products, AUTOMATICALLY use the appropriate function:
- "Create a product called Coffee for $5" → Use create_product function
- "Add a new product to my catalog" → Use create_product function  
- "Update product X to cost $10" → Use update_product function
- "Remove product Y" → Use delete_product function

AFTER creating or modifying products, always remind the user to refresh their Products page to see the changes.

When users say things like "I made $100k today" or "I spent $500 on marketing", AUTOMATICALLY use the appropriate function to record this data for them. Don't just give advice - take action!

## Core Guidance Principles:
1. Always reference the user's actual data when giving advice (financial status, roadmap progress, goals, etc.)
2. Take action automatically when users provide data that should be recorded
3. Direct users to specific features within our Cofounder app rather than external tools
4. Provide actionable, specific next steps based on their current business stage and progress
5. When suggesting learning resources, reference specific University tutorials that match their needs
6. Consider their financial situation when making recommendations (be mindful of costs)
7. Build upon their existing goals, progress, and business context
8. If they need features we don't have, suggest workarounds using our available tools

## Current Business Context:
${businessContext ? `Business: ${businessContext.name} (${businessContext.industry})
Description: ${businessContext.description || 'No description provided'}` : 'No specific business context provided'}

## Response Style:
- Be conversational but professional
- Use bullet points and clear structure for actionable advice  
- Reference specific app paths and features when relevant
- Acknowledge their progress and achievements
- Ask clarifying questions when needed to provide better guidance

Remember: You have access to their real business data AND the ability to modify it. Use this power to provide truly helpful, automated assistance that saves them time and effort.`;

    // Run the assistant
    console.log('🤖 OpenAI: Running assistant with enhanced context...');
    const runResponse = await fetch(`https://api.openai.com/v1/threads/${currentThreadId}/runs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify({
        assistant_id: ASSISTANT_ID,
        instructions: instructions,
        tools: [
          {
            type: "function",
            function: {
              name: "add_income_entry",
              description: "Add a new income entry to the user's financial records",
              parameters: {
                type: "object",
                properties: {
                  amount: {
                    type: "number",
                    description: "The income amount in dollars"
                  },
                  description: {
                    type: "string", 
                    description: "Description of the income source"
                  },
                  category: {
                    type: "string",
                    description: "Income category (e.g., 'sales', 'investment', 'other')",
                    enum: ["sales", "investment", "freelance", "salary", "other"]
                  },
                  date: {
                    type: "string",
                    description: "Date of the income in YYYY-MM-DD format (defaults to today if not provided)"
                  }
                },
                required: ["amount", "description"]
              }
            }
          },
          {
            type: "function",
            function: {
              name: "add_expense_entry",
              description: "Add a new expense entry to the user's financial records",
              parameters: {
                type: "object",
                properties: {
                  amount: {
                    type: "number",
                    description: "The expense amount in dollars"
                  },
                  description: {
                    type: "string",
                    description: "Description of the expense"
                  },
                  category: {
                    type: "string", 
                    description: "Expense category (e.g., 'marketing', 'operations', 'travel')",
                    enum: ["marketing", "operations", "travel", "supplies", "software", "rent", "utilities", "other"]
                  },
                  date: {
                    type: "string",
                    description: "Date of the expense in YYYY-MM-DD format (defaults to today if not provided)"
                  }
                },
                required: ["amount", "description"]
              }
            }
          },
          {
            type: "function",
            function: {
              name: "create_note",
              description: "Create a new business note or memo",
              parameters: {
                type: "object",
                properties: {
                  title: {
                    type: "string",
                    description: "Title of the note"
                  },
                  content: {
                    type: "string",
                    description: "Content/body of the note"
                  },
                  category: {
                    type: "string",
                    description: "Note category (e.g., 'meeting', 'idea', 'todo', 'general')",
                    enum: ["meeting", "idea", "todo", "general", "planning", "research"]
                  },
                  priority: {
                    type: "string",
                    description: "Priority level of the note",
                    enum: ["low", "medium", "high"]
                  }
                },
                required: ["title", "content"]
              }
            }
          },
          {
            type: "function",
            function: {
              name: "manage_budget",
              description: "Create a new budget or update an existing budget category",
              parameters: {
                type: "object",
                properties: {
                  category: {
                    type: "string",
                    description: "Budget category name"
                  },
                  limit: {
                    type: "number",
                    description: "Budget limit amount in dollars"
                  },
                  period: {
                    type: "string",
                    description: "Budget period",
                    enum: ["monthly", "quarterly", "yearly"]
                  },
                  action: {
                    type: "string",
                    description: "Whether to create new budget or update existing",
                    enum: ["create", "update"]
                  }
                },
                required: ["category", "limit", "action"]
              }
            }
          },
          {
            type: "function",
            function: {
              name: "add_dream_board_goal",
              description: "Add a new goal to the user's dream board",
              parameters: {
                type: "object",
                properties: {
                  title: {
                    type: "string",
                    description: "Title of the goal"
                  },
                  description: {
                    type: "string",
                    description: "Detailed description of the goal"
                  },
                  category: {
                    type: "string",
                    description: "Goal category",
                    enum: ["financial", "personal", "business", "lifestyle", "health", "other"]
                  },
                  targetDate: {
                    type: "string",
                    description: "Target completion date in YYYY-MM-DD format"
                  },
                  isFinancial: {
                    type: "boolean",
                    description: "Whether this is a financial goal"
                  },
                  targetAmount: {
                    type: "number",
                    description: "Target amount if it's a financial goal"
                  }
                },
                required: ["title", "description"]
              }
            }
          },
          {
            type: "function",
            function: {
              name: "create_invoice",
              description: "Create a new invoice for a client",
              parameters: {
                type: "object",
                properties: {
                  clientName: {
                    type: "string",
                    description: "Name of the client"
                  },
                  clientEmail: {
                    type: "string",
                    description: "Email address of the client"
                  },
                  amount: {
                    type: "number",
                    description: "Total invoice amount in dollars"
                  },
                  description: {
                    type: "string",
                    description: "Description of services or products invoiced"
                  },
                  dueDate: {
                    type: "string",
                    description: "Due date for payment in YYYY-MM-DD format"
                  },
                  status: {
                    type: "string",
                    description: "Invoice status",
                    enum: ["pending", "sent", "paid", "overdue", "cancelled"]
                  },
                  notes: {
                    type: "string",
                    description: "Additional notes for the invoice"
                  }
                },
                required: ["clientName", "amount", "description"]
              }
            }
          },
          {
            type: "function",
            function: {
              name: "set_bank_balance",
              description: "Set or update the current bank account balance",
              parameters: {
                type: "object",
                properties: {
                  balance: {
                    type: "number",
                    description: "Current bank account balance in dollars"
                  },
                  accountName: {
                    type: "string",
                    description: "Name of the bank account (defaults to 'Main Account')"
                  },
                  notes: {
                    type: "string",
                    description: "Notes about the balance update"
                  }
                },
                required: ["balance"]
              }
            }
          },
          {
            type: "function",
            function: {
              name: "get_financial_projections",
              description: "Get financial projections and forecasts based on current data and scheduled transactions",
              parameters: {
                type: "object",
                properties: {
                  months: {
                    type: "number",
                    description: "Number of months to project forward (defaults to 12)"
                  }
                },
                required: []
              }
            }
          },
          {
            type: "function",
            function: {
              name: "create_product",
              description: "Create a new product for the user's business catalog",
              parameters: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                    description: "Name of the product"
                  },
                  description: {
                    type: "string",
                    description: "Detailed description of the product"
                  },
                  price: {
                    type: "number",
                    description: "Price of the product in dollars"
                  },
                  category: {
                    type: "string",
                    description: "Product category",
                    enum: ["software", "service", "electronics", "clothing", "food", "health", "education", "entertainment", "other"]
                  },
                  status: {
                    type: "string",
                    description: "Product status (defaults to 'active')",
                    enum: ["active", "inactive", "development"]
                  },
                  inventory: {
                    type: "number",
                    description: "Initial inventory quantity (defaults to 0)"
                  }
                },
                required: ["name", "description", "price", "category"]
              }
            }
          },
          {
            type: "function",
            function: {
              name: "update_product",
              description: "Update an existing product's information. Requires product ID.",
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
                    description: "New product description"
                  },
                  price: {
                    type: "number",
                    description: "New price in dollars"
                  },
                  category: {
                    type: "string",
                    description: "New product category"
                  },
                  status: {
                    type: "string",
                    description: "New product status",
                    enum: ["active", "inactive", "development"]
                  },
                  inventory: {
                    type: "number",
                    description: "New inventory quantity"
                  }
                },
                required: ["productId"]
              }
            }
          },
          {
            type: "function",
            function: {
              name: "delete_product",
              description: "Delete a product from the user's business catalog. Requires product ID.",
              parameters: {
                type: "object",
                properties: {
                  productId: {
                    type: "string",
                    description: "ID of the product to delete"
                  }
                },
                required: ["productId"]
              }
            }
          }
        ]
      })
    });

    if (!runResponse.ok) {
      const errorText = await runResponse.text();
      console.error('🤖 OpenAI: Failed to run assistant:', runResponse.status, errorText);
      throw new Error(`Failed to run assistant: ${runResponse.status}`);
    }

    const runData = await runResponse.json();
    const runId = runData.id;
    console.log('🤖 OpenAI: Assistant run started:', runId);

    // Poll for completion
    let runStatus = 'in_progress';
    let attempts = 0;
    const maxAttempts = 60; // 60 seconds max wait time to allow for function execution
    
    while (runStatus === 'in_progress' || runStatus === 'queued' || runStatus === 'requires_action') {
      if (attempts >= maxAttempts) {
        throw new Error('Assistant response timeout');
      }

      // Only wait if this isn't the first check
      if (attempts > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      }
      attempts++;

      const statusResponse = await fetch(`https://api.openai.com/v1/threads/${currentThreadId}/runs/${runId}`, {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2',
        }
      });

      if (!statusResponse.ok) {
        throw new Error(`Failed to check run status: ${statusResponse.status}`);
      }

      const statusData = await statusResponse.json();
      runStatus = statusData.status;
      console.log(`🤖 OpenAI: Run status (attempt ${attempts}):`, runStatus);

      if (runStatus === 'failed') {
        console.error('🤖 OpenAI: Assistant run failed:', statusData);
        throw new Error('Assistant run failed');
      }

      if (runStatus === 'requires_action') {
        console.log('🤖 OpenAI: Assistant requires action - handling function calls...');
        
        // Get the run details to see what functions need to be called
        const runDetailsResponse = await fetch(`https://api.openai.com/v1/threads/${currentThreadId}/runs/${runId}`, {
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'OpenAI-Beta': 'assistants=v2',
          }
        });
        
        if (!runDetailsResponse.ok) {
          throw new Error(`Failed to get run details: ${runDetailsResponse.status}`);
        }
        
        const runDetails = await runDetailsResponse.json();
        const toolCalls = runDetails.required_action?.submit_tool_outputs?.tool_calls || [];
        
        console.log('🤖 OpenAI: Processing', toolCalls.length, 'tool calls');
        
        // Process each tool call
        const toolOutputs = [];
        
        for (const toolCall of toolCalls) {
          console.log('🤖 OpenAI: Processing tool call:', toolCall.function.name);
          
          try {
            // Parse function arguments
            const functionArgs = JSON.parse(toolCall.function.arguments);
            console.log('🤖 OpenAI: Function arguments:', functionArgs);
            
            // Get the project ID from environment
            const projectIdMatch = SUPABASE_URL?.match(/https:\/\/([^.]+)/);
            const projectId = projectIdMatch ? projectIdMatch[1] : 'unknown';
            
            // Create context for function execution
            // Extract business ID properly - prioritize direct businessId field
            const extractedBusinessId = businessId || businessContext?.id || businessContext?.businessId;
            
            const functionContext = {
              userId: decodeJWT(accessToken)?.sub || decodeJWT(accessToken)?.user_id,
              businessId: extractedBusinessId,
              accessToken: accessToken,
              projectId: projectId
            };
            
            // Execute the function directly
            console.log('🤖 OpenAI: Executing function:', toolCall.function.name);
            console.log('🤖 OpenAI: Function context:', {
              userId: functionContext.userId,
              businessId: functionContext.businessId,
              hasToken: !!functionContext.accessToken
            });
            console.log('🤖 OpenAI: Business context debug:', {
              originalBusinessContext: businessContext,
              extractedBusinessId: businessContext?.id,
              businessContextBusinessId: businessContext?.businessId,
              businessContextType: typeof businessContext,
              isBusinessContextNull: businessContext === null,
              isBusinessContextUndefined: businessContext === undefined,
              directBusinessId: businessId,
              finalBusinessIdUsed: extractedBusinessId,
              usingDirectBusinessId: !!businessId,
              extractionPath: businessId ? 'direct' : businessContext?.id ? 'context.id' : businessContext?.businessId ? 'context.businessId' : 'none'
            });
            
            let functionResult;
            
            switch (toolCall.function.name) {
              case 'add_income_entry':
                functionResult = await addIncomeEntry(functionArgs, functionContext);
                break;
              case 'add_expense_entry':
                functionResult = await addExpenseEntry(functionArgs, functionContext);
                break;
              case 'create_note':
                functionResult = await createNote(functionArgs, functionContext);
                break;
              case 'manage_budget':
                functionResult = await manageBudget(functionArgs, functionContext);
                break;
              case 'add_dream_board_goal':
                functionResult = await addDreamBoardGoal(functionArgs, functionContext);
                break;
              case 'create_invoice':
                functionResult = await createInvoice(functionArgs, functionContext);
                break;
              case 'set_bank_balance':
                functionResult = await setBankBalance(functionArgs, functionContext);
                break;
              case 'get_financial_projections':
                functionResult = await getFinancialProjections(functionArgs, functionContext);
                break;
              case 'update_business_info':
                functionResult = await updateBusinessInfo(functionArgs, functionContext);
                break;
              case 'create_product':
                functionResult = await createProduct(functionArgs, functionContext);
                break;
              case 'update_product':
                functionResult = await updateProduct(functionArgs, functionContext);
                break;
              case 'delete_product':
                functionResult = await deleteProduct(functionArgs, functionContext);
                break;
              default:
                throw new Error(`Unknown function: ${toolCall.function.name}`);
            }
            
            console.log('🤖 OpenAI: Function result:', functionResult);
            
            // Format the result for the AI
            const output = functionResult.success 
              ? functionResult.message || 'Action completed successfully'
              : `Error: ${functionResult.error || 'Unknown error occurred'}`;
            
            toolOutputs.push({
              tool_call_id: toolCall.id,
              output: output
            });
            
          } catch (error: any) {
            console.error('🤖 OpenAI: Error executing function:', error);
            toolOutputs.push({
              tool_call_id: toolCall.id,
              output: `Error executing function: ${error.message}`
            });
          }
        }
        
        // Submit tool outputs back to OpenAI
        console.log('🤖 OpenAI: Submitting tool outputs...');
        const submitResponse = await fetch(`https://api.openai.com/v1/threads/${currentThreadId}/runs/${runId}/submit_tool_outputs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'OpenAI-Beta': 'assistants=v2',
          },
          body: JSON.stringify({
            tool_outputs: toolOutputs
          })
        });
        
        if (!submitResponse.ok) {
          const errorText = await submitResponse.text();
          console.error('🤖 OpenAI: Failed to submit tool outputs:', submitResponse.status, errorText);
          throw new Error(`Failed to submit tool outputs: ${submitResponse.status}`);
        }
        
        console.log('🤖 OpenAI: Tool outputs submitted, continuing run...');
        // Continue the polling loop
        continue;
      }
    }

    if (runStatus !== 'completed') {
      throw new Error(`Assistant run ended with status: ${runStatus}`);
    }

    // Get the assistant's response
    console.log('🤖 OpenAI: Retrieving assistant response...');
    const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${currentThreadId}/messages?order=desc&limit=1`, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2',
      }
    });

    if (!messagesResponse.ok) {
      throw new Error(`Failed to retrieve messages: ${messagesResponse.status}`);
    }

    const messagesData = await messagesResponse.json();
    const assistantMessage = messagesData.data[0];
    
    if (!assistantMessage || assistantMessage.role !== 'assistant') {
      throw new Error('No assistant response found');
    }

    // Extract text content from the assistant message
    let responseText = 'I apologize, but I encountered an issue processing your request.';
    if (assistantMessage.content && assistantMessage.content.length > 0) {
      const textContent = assistantMessage.content.find((content: any) => content.type === 'text');
      if (textContent && textContent.text) {
        responseText = textContent.text.value;
      }
    }

    console.log('🤖 OpenAI: Assistant response received successfully');
    
    // Track usage for credits system
    const tokensUsed = estimateTokenUsage(message, responseText);
    const estimatedCost = estimateOpenAICost(tokensUsed, 'gpt-5.1'); // Assistants use GPT-5.1
    
    // Store usage tracking (don't await to avoid slowing down response)
    if (tokensUsed > 0 && accessToken) {
      let payload, userId;
      try {
        payload = decodeJWT(accessToken);
        userId = payload?.sub || payload?.user_id;
      } catch (error) {
        console.warn('🤖 OpenAI: Failed to decode JWT for usage tracking:', error.message);
        payload = null;
        userId = null;
      }
      
      if (userId) {
        const usageData = {
          userId,
          businessId: businessId || requestBody.businessContext?.id || requestBody.businessContext?.businessId,
          feature: 'ai_assistant',
          tokensUsed,
          requestCount: 1,
          estimatedCost,
          model: 'gpt-5.1-assistant',
          metadata: {
            messageLength: message.length,
            responseLength: responseText.length,
            threadId: currentThreadId,
            runId: runId,
            assistantId: ASSISTANT_ID,
          },
        };
        
        // Track usage asynchronously
        trackUsageAsync(usageData);
      }
    }
    
    return c.json({
      success: true,
      message: responseText,
      threadId: currentThreadId,
      runId: runId,
      model: 'gpt-5.1-assistant',
      usage: {
        total_tokens: tokensUsed,
        estimated_tokens: tokensUsed // Since we're estimating
      }
    });

  } catch (error) {
    console.error('🤖 OpenAI: Error processing assistant request:', error);
    
    // Ensure we return valid JSON even in error cases
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('🤖 OpenAI: Detailed error:', errorMessage);
    
    return c.json({ 
      success: false, 
      error: `Error processing assistant request: ${errorMessage}` 
    }, 500);
  }
});

// Test endpoint to verify OpenAI Assistant integration
app.get('/test', async (c) => {
  console.log('🤖 OpenAI: Assistant test endpoint called');
  
  if (!OPENAI_API_KEY) {
    return c.json({ 
      success: false, 
      error: 'OpenAI API key not configured' 
    }, 500);
  }

  try {
    // Test creating a thread
    const threadResponse = await fetch('https://api.openai.com/v1/threads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify({
        metadata: { test: 'true' }
      })
    });

    if (!threadResponse.ok) {
      const errorText = await threadResponse.text();
      console.error('🤖 OpenAI: Test thread creation failed:', threadResponse.status, errorText);
      return c.json({ 
        success: false, 
        error: `Thread creation test failed: ${threadResponse.status}`,
        details: errorText
      }, 500);
    }

    const threadData = await threadResponse.json();
    
    // Test retrieving the assistant
    const assistantResponse = await fetch(`https://api.openai.com/v1/assistants/${ASSISTANT_ID}`, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2',
      }
    });

    if (!assistantResponse.ok) {
      const errorText = await assistantResponse.text();
      console.error('🤖 OpenAI: Assistant retrieval failed:', assistantResponse.status, errorText);
      return c.json({ 
        success: false, 
        error: `Assistant retrieval failed: ${assistantResponse.status}`,
        details: errorText
      }, 500);
    }

    const assistantData = await assistantResponse.json();
    
    return c.json({
      success: true,
      message: 'OpenAI Assistant integration is working!',
      assistant: {
        id: assistantData.id,
        name: assistantData.name,
        model: assistantData.model,
        instructions: assistantData.instructions ? assistantData.instructions.substring(0, 100) + '...' : null
      },
      testThread: {
        id: threadData.id,
        created_at: threadData.created_at
      }
    });

  } catch (error) {
    console.error('🤖 OpenAI: Assistant test error:', error);
    return c.json({ 
      success: false, 
      error: `Assistant test failed: ${error.message}` 
    }, 500);
  }
});

// Helper function to estimate token usage for assistants
function estimateTokenUsage(userMessage: string, assistantResponse: string): number {
  // Rough estimation: 1 token ≈ 4 characters for English text
  // Add some overhead for assistant API formatting
  const userTokens = Math.ceil(userMessage.length / 4);
  const assistantTokens = Math.ceil(assistantResponse.length / 4);
  const overhead = Math.ceil((userTokens + assistantTokens) * 0.1); // 10% overhead
  
  return userTokens + assistantTokens + overhead;
}

// Helper function to estimate OpenAI cost
function estimateOpenAICost(tokens: number, model: string): number {
  const pricing = {
    'gpt-5.1': { input: 0.005 / 1000, output: 0.015 / 1000 }, // GPT-5.1 pricing
    'gpt-5.1-assistant': { input: 0.005 / 1000, output: 0.015 / 1000 }, // Same as GPT-5.1
    'gpt-4o': { input: 0.0025 / 1000, output: 0.01 / 1000 }, // GPT-4o pricing (legacy)
    'gpt-4': { input: 0.03 / 1000, output: 0.06 / 1000 },
    'gpt-3.5-turbo': { input: 0.001 / 1000, output: 0.002 / 1000 },
  };
  
  const modelPricing = pricing[model as keyof typeof pricing] || pricing['gpt-5.1'];
  // Assume 30% input tokens, 70% output tokens for assistant responses
  const inputTokens = Math.floor(tokens * 0.3);
  const outputTokens = Math.floor(tokens * 0.7);
  
  const cost = (inputTokens * modelPricing.input) + (outputTokens * modelPricing.output);
  return Math.ceil(cost * 100); // Return cost in cents
}

// Helper function to decode JWT payload (without verification)
function decodeJWT(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }
    
    const payload = parts[1];
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
    const base64 = paddedPayload.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = atob(base64);
    return JSON.parse(jsonPayload);
  } catch (error) {
    throw new Error('Failed to decode JWT payload');
  }
}

// Async function to track usage without blocking response
async function trackUsageAsync(usageData: any) {
  try {
    const usageId = `usage-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const usage = {
      id: usageId,
      ...usageData,
      timestamp: new Date().toISOString(),
      credits: Math.ceil(usageData.tokensUsed / 100),
    };

    // Import kv here to avoid circular imports
    const kv = await import('./kv_store.tsx');
    
    const storageKey = usageData.businessId 
      ? `credit_usage:${usageData.userId}:${usageData.businessId}:${usageId}`
      : `credit_usage:${usageData.userId}:global:${usageId}`;
    
    await kv.set(storageKey, usage);
    
    // Update user's total stats
    const userStatsKey = `credit_stats:${usageData.userId}`;
    const existingStats = await kv.get(userStatsKey) || {
      totalCreditsUsed: 0,
      totalTokensUsed: 0,
      totalRequests: 0,
      totalCostCents: 0,
    };
    
    const updatedStats = {
      ...existingStats,
      totalCreditsUsed: existingStats.totalCreditsUsed + usage.credits,
      totalTokensUsed: existingStats.totalTokensUsed + usage.tokensUsed,
      totalRequests: existingStats.totalRequests + usage.requestCount,
      totalCostCents: existingStats.totalCostCents + usage.estimatedCost,
      lastUpdated: new Date().toISOString(),
    };
    
    await kv.set(userStatsKey, updatedStats);
    
    console.log('💳 OpenAI Assistant: Usage tracked successfully', { 
      credits: usage.credits, 
      tokens: usage.tokensUsed,
      threadId: usage.metadata?.threadId,
    });
  } catch (error) {
    console.error('💳 OpenAI Assistant: Failed to track usage:', error);
  }
}

export default app;