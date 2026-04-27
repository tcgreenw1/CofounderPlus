import { projectId } from './supabase/info';
import { AIFunction, AIFunctionContext } from './aiFunctions';

// ============================================================================
// ANALYTICS & INSIGHTS
// ============================================================================

// Generate business insights
export const generateBusinessInsights: AIFunction = {
  name: "generate_business_insights",
  description: "Generate AI-powered insights about business performance, trends, and recommendations based on all business data",
  parameters: {
    type: "object",
    properties: {
      analysisType: {
        type: "string",
        description: "Type of analysis to perform",
        enum: ["financial", "sales", "marketing", "operations", "overall"]
      },
      timeframe: {
        type: "string",
        description: "Time period for analysis (e.g., 'last_week', 'last_month', 'last_quarter', 'last_year')"
      }
    },
    required: []
  },
  handler: async (params, context) => {
    try {
      if (!context.businessId) {
        return { success: false, error: 'No business selected' };
      }

      const insights: any = {
        analysisType: params.analysisType || 'overall',
        timeframe: params.timeframe || 'last_month',
        insights: [],
        recommendations: [],
        metrics: {}
      };

      // Get financial data
      try {
        const financeResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/finance/overview?businessId=${context.businessId}`, {
          headers: { 'Authorization': `Bearer ${context.accessToken}` }
        });
        if (financeResponse.ok) {
          const financeData = await financeResponse.json();
          insights.metrics.financial = financeData;
          
          if (financeData.totalRevenue && financeData.totalExpenses) {
            const profit = financeData.totalRevenue - financeData.totalExpenses;
            const profitMargin = financeData.totalRevenue > 0 ? (profit / financeData.totalRevenue * 100).toFixed(2) : 0;
            insights.insights.push(`Your profit margin is ${profitMargin}%`);
            
            if (profit < 0) {
              insights.recommendations.push("Consider reviewing expenses and finding ways to increase revenue");
            } else {
              insights.recommendations.push("Maintain healthy profit margins by continuing current practices");
            }
          }
        }
      } catch (e) {
        console.log('Could not fetch financial data for insights');
      }

      // Get sales data
      try {
        const salesResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/sales/leads?businessId=${context.businessId}`, {
          headers: { 'Authorization': `Bearer ${context.accessToken}` }
        });
        if (salesResponse.ok) {
          const salesData = await salesResponse.json();
          insights.metrics.sales = salesData;
          
          const leads = salesData.leads || [];
          const wonLeads = leads.filter((l: any) => l.status === 'won');
          const conversionRate = leads.length > 0 ? (wonLeads.length / leads.length * 100).toFixed(2) : 0;
          
          insights.insights.push(`Your sales conversion rate is ${conversionRate}%`);
          
          if (parseFloat(conversionRate) < 20) {
            insights.recommendations.push("Focus on improving sales follow-up and nurturing leads");
          }
        }
      } catch (e) {
        console.log('Could not fetch sales data for insights');
      }

      // Get product data
      try {
        const productsResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/products?businessId=${context.businessId}`, {
          headers: { 'Authorization': `Bearer ${context.accessToken}` }
        });
        if (productsResponse.ok) {
          const productsData = await productsResponse.json();
          insights.metrics.products = productsData;
          
          const products = productsData.products || [];
          insights.insights.push(`You have ${products.length} product(s) in your catalog`);
          
          if (products.length === 0) {
            insights.recommendations.push("Add products to your catalog to start selling");
          }
        }
      } catch (e) {
        console.log('Could not fetch product data for insights');
      }

      return {
        success: true,
        message: `Generated ${insights.insights.length} insights and ${insights.recommendations.length} recommendations`,
        data: insights
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// Get business metrics summary
export const getBusinessMetrics: AIFunction = {
  name: "get_business_metrics",
  description: "Get a comprehensive summary of all business metrics including financial health, sales performance, and operational efficiency",
  parameters: {
    type: "object",
    properties: {
      includeCharts: {
        type: "boolean",
        description: "Whether to include chart data for visualization"
      }
    },
    required: []
  },
  handler: async (params, context) => {
    try {
      if (!context.businessId) {
        return { success: false, error: 'No business selected' };
      }

      const metrics: any = {
        timestamp: new Date().toISOString(),
        businessId: context.businessId
      };

      // Financial metrics
      try {
        const financeResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/finance/overview?businessId=${context.businessId}`, {
          headers: { 'Authorization': `Bearer ${context.accessToken}` }
        });
        if (financeResponse.ok) {
          metrics.financial = await financeResponse.json();
        }
      } catch (e) {}

      // Sales metrics
      try {
        const salesResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/sales/deals?businessId=${context.businessId}`, {
          headers: { 'Authorization': `Bearer ${context.accessToken}` }
        });
        if (salesResponse.ok) {
          const salesData = await salesResponse.json();
          metrics.sales = {
            totalDeals: salesData.deals?.length || 0,
            activeDeals: salesData.deals?.filter((d: any) => d.status === 'in_progress')?.length || 0,
            wonDeals: salesData.deals?.filter((d: any) => d.status === 'won')?.length || 0
          };
        }
      } catch (e) {}

      // Team metrics
      try {
        const teamResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/team/members?businessId=${context.businessId}`, {
          headers: { 'Authorization': `Bearer ${context.accessToken}` }
        });
        if (teamResponse.ok) {
          const teamData = await teamResponse.json();
          metrics.team = {
            totalMembers: teamData.members?.length || 0,
            activeMembers: teamData.members?.filter((m: any) => m.status === 'active')?.length || 0
          };
        }
      } catch (e) {}

      // Product metrics
      try {
        const productsResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/products?businessId=${context.businessId}`, {
          headers: { 'Authorization': `Bearer ${context.accessToken}` }
        });
        if (productsResponse.ok) {
          const productsData = await productsResponse.json();
          metrics.products = {
            total: productsData.products?.length || 0,
            active: productsData.products?.filter((p: any) => p.status === 'active')?.length || 0
          };
        }
      } catch (e) {}

      return {
        success: true,
        message: 'Business metrics retrieved successfully',
        data: metrics
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// ============================================================================
// GOAL TRACKING & MANAGEMENT
// ============================================================================

// Set business goal
export const setBusinessGoal: AIFunction = {
  name: "set_business_goal",
  description: "Set a new business goal with target metrics and deadline",
  parameters: {
    type: "object",
    properties: {
      title: {
        type: "string",
        description: "Goal title (e.g., 'Reach $10k MRR', 'Acquire 100 customers')"
      },
      description: {
        type: "string",
        description: "Detailed description of the goal"
      },
      category: {
        type: "string",
        description: "Goal category",
        enum: ["revenue", "customers", "products", "team", "operations", "marketing", "other"]
      },
      targetValue: {
        type: "number",
        description: "Target numeric value to achieve"
      },
      currentValue: {
        type: "number",
        description: "Current value (starting point)"
      },
      deadline: {
        type: "string",
        description: "Target completion date (ISO format)"
      },
      unit: {
        type: "string",
        description: "Unit of measurement (e.g., 'dollars', 'customers', 'products')"
      }
    },
    required: ["title", "targetValue"]
  },
  handler: async (params, context) => {
    try {
      if (!context.businessId) {
        return { success: false, error: 'No business selected' };
      }

      const goalData = {
        business_id: context.businessId,
        title: params.title,
        description: params.description || '',
        category: params.category || 'other',
        target_value: params.targetValue,
        current_value: params.currentValue || 0,
        deadline: params.deadline || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        unit: params.unit || 'units',
        status: 'active',
        created_at: new Date().toISOString()
      };

      const goalId = `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const key = `business_${context.businessId}_goal_${goalId}`;

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/kv/set`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${context.accessToken}`
        },
        body: JSON.stringify({ key, value: JSON.stringify({ ...goalData, id: goalId }) })
      });

      if (!response.ok) {
        throw new Error(`Failed to create goal: ${response.status}`);
      }

      return {
        success: true,
        message: `Goal "${params.title}" created successfully!`,
        data: { ...goalData, id: goalId }
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// Get business goals
export const getBusinessGoals: AIFunction = {
  name: "get_business_goals",
  description: "Retrieve all business goals with progress tracking",
  parameters: {
    type: "object",
    properties: {
      status: {
        type: "string",
        description: "Filter by goal status",
        enum: ["active", "completed", "cancelled", "all"]
      }
    },
    required: []
  },
  handler: async (params, context) => {
    try {
      if (!context.businessId) {
        return { success: false, error: 'No business selected' };
      }

      const prefix = `business_${context.businessId}_goal_`;
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/kv/getByPrefix?prefix=${encodeURIComponent(prefix)}`, {
        headers: { 'Authorization': `Bearer ${context.accessToken}` }
      });

      if (!response.ok) {
        throw new Error(`Failed to retrieve goals: ${response.status}`);
      }

      const result = await response.json();
      const allGoals = result.values?.map((v: any) => JSON.parse(v)) || [];
      
      const filteredGoals = params.status && params.status !== 'all'
        ? allGoals.filter((g: any) => g.status === params.status)
        : allGoals;

      const goalsWithProgress = filteredGoals.map((goal: any) => {
        const progress = goal.target_value > 0 
          ? Math.min(100, (goal.current_value / goal.target_value * 100).toFixed(2))
          : 0;
        
        return {
          ...goal,
          progress: parseFloat(progress),
          isOverdue: goal.deadline && new Date(goal.deadline) < new Date()
        };
      });

      return {
        success: true,
        message: `Retrieved ${goalsWithProgress.length} goal(s)`,
        data: goalsWithProgress
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// Update goal progress
export const updateGoalProgress: AIFunction = {
  name: "update_goal_progress",
  description: "Update the current progress value for a business goal",
  parameters: {
    type: "object",
    properties: {
      goalId: {
        type: "string",
        description: "ID of the goal to update"
      },
      currentValue: {
        type: "number",
        description: "New current value"
      },
      notes: {
        type: "string",
        description: "Optional notes about the progress update"
      }
    },
    required: ["goalId", "currentValue"]
  },
  handler: async (params, context) => {
    try {
      if (!context.businessId) {
        return { success: false, error: 'No business selected' };
      }

      const key = `business_${context.businessId}_goal_${params.goalId}`;
      
      const getResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/kv/get?key=${encodeURIComponent(key)}`, {
        headers: { 'Authorization': `Bearer ${context.accessToken}` }
      });

      if (!getResponse.ok) {
        throw new Error('Goal not found');
      }

      const result = await getResponse.json();
      const goal = JSON.parse(result.value);

      goal.current_value = params.currentValue;
      goal.last_updated = new Date().toISOString();
      
      if (params.notes) {
        goal.notes = params.notes;
      }

      if (params.currentValue >= goal.target_value && goal.status === 'active') {
        goal.status = 'completed';
        goal.completed_at = new Date().toISOString();
      }

      const updateResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/kv/set`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${context.accessToken}`
        },
        body: JSON.stringify({ key, value: JSON.stringify(goal) })
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update goal');
      }

      const progress = (params.currentValue / goal.target_value * 100).toFixed(2);

      return {
        success: true,
        message: goal.status === 'completed' 
          ? `🎉 Goal "${goal.title}" completed!` 
          : `Goal progress updated to ${progress}%`,
        data: goal
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// ============================================================================
// SEARCH & DISCOVERY
// ============================================================================

// Search across all business data
export const searchBusinessData: AIFunction = {
  name: "search_business_data",
  description: "Search across all business data including transactions, products, customers, notes, and more",
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search query term"
      },
      categories: {
        type: "array",
        items: { type: "string" },
        description: "Categories to search in (e.g., 'transactions', 'products', 'customers', 'notes', 'employees')"
      },
      limit: {
        type: "number",
        description: "Maximum number of results per category"
      }
    },
    required: ["query"]
  },
  handler: async (params, context) => {
    try {
      if (!context.businessId) {
        return { success: false, error: 'No business selected' };
      }

      const searchResults: any = {
        query: params.query,
        results: {}
      };

      const query = params.query.toLowerCase();
      const categories = params.categories || ['transactions', 'products', 'customers', 'notes', 'employees'];

      if (categories.includes('transactions')) {
        try {
          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/finance/transactions?businessId=${context.businessId}`, {
            headers: { 'Authorization': `Bearer ${context.accessToken}` }
          });
          if (response.ok) {
            const data = await response.json();
            const transactions = data.transactions || [];
            searchResults.results.transactions = transactions.filter((t: any) => 
              t.description?.toLowerCase().includes(query) ||
              t.category?.toLowerCase().includes(query) ||
              t.amount?.toString().includes(query)
            ).slice(0, params.limit || 10);
          }
        } catch (e) {}
      }

      if (categories.includes('products')) {
        try {
          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/products?businessId=${context.businessId}`, {
            headers: { 'Authorization': `Bearer ${context.accessToken}` }
          });
          if (response.ok) {
            const data = await response.json();
            const products = data.products || [];
            searchResults.results.products = products.filter((p: any) => 
              p.name?.toLowerCase().includes(query) ||
              p.description?.toLowerCase().includes(query) ||
              p.category?.toLowerCase().includes(query)
            ).slice(0, params.limit || 10);
          }
        } catch (e) {}
      }

      if (categories.includes('customers')) {
        try {
          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/sales/customers?businessId=${context.businessId}`, {
            headers: { 'Authorization': `Bearer ${context.accessToken}` }
          });
          if (response.ok) {
            const data = await response.json();
            const customers = data.customers || [];
            searchResults.results.customers = customers.filter((c: any) => 
              c.name?.toLowerCase().includes(query) ||
              c.email?.toLowerCase().includes(query) ||
              c.company?.toLowerCase().includes(query)
            ).slice(0, params.limit || 10);
          }
        } catch (e) {}
      }

      if (categories.includes('notes')) {
        try {
          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notes/boards?businessId=${context.businessId}`, {
            headers: { 'Authorization': `Bearer ${context.accessToken}` }
          });
          if (response.ok) {
            const data = await response.json();
            const boards = data.boards || [];
            searchResults.results.notes = boards.filter((b: any) => 
              b.name?.toLowerCase().includes(query) ||
              b.description?.toLowerCase().includes(query)
            ).slice(0, params.limit || 10);
          }
        } catch (e) {}
      }

      const totalResults = Object.values(searchResults.results).reduce((sum: number, arr: any) => sum + arr.length, 0);

      return {
        success: true,
        message: `Found ${totalResults} result(s) for "${params.query}"`,
        data: searchResults
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// ============================================================================
// EXPORT & REPORTING
// ============================================================================

// Generate business report
export const generateBusinessReport: AIFunction = {
  name: "generate_business_report",
  description: "Generate a comprehensive business report for a specific time period",
  parameters: {
    type: "object",
    properties: {
      reportType: {
        type: "string",
        description: "Type of report to generate",
        enum: ["financial", "sales", "operations", "comprehensive"]
      },
      startDate: {
        type: "string",
        description: "Report start date (ISO format)"
      },
      endDate: {
        type: "string",
        description: "Report end date (ISO format)"
      },
      format: {
        type: "string",
        description: "Report format",
        enum: ["summary", "detailed"]
      }
    },
    required: ["reportType"]
  },
  handler: async (params, context) => {
    try {
      if (!context.businessId) {
        return { success: false, error: 'No business selected' };
      }

      const report: any = {
        type: params.reportType,
        generatedAt: new Date().toISOString(),
        period: {
          start: params.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: params.endDate || new Date().toISOString()
        },
        sections: []
      };

      if (['financial', 'comprehensive'].includes(params.reportType)) {
        try {
          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/finance/overview?businessId=${context.businessId}`, {
            headers: { 'Authorization': `Bearer ${context.accessToken}` }
          });
          if (response.ok) {
            const data = await response.json();
            report.sections.push({
              title: 'Financial Overview',
              data: {
                revenue: data.totalRevenue || 0,
                expenses: data.totalExpenses || 0,
                profit: (data.totalRevenue || 0) - (data.totalExpenses || 0),
                profitMargin: data.totalRevenue > 0 ? ((data.totalRevenue - data.totalExpenses) / data.totalRevenue * 100).toFixed(2) + '%' : '0%'
              }
            });
          }
        } catch (e) {}
      }

      if (['sales', 'comprehensive'].includes(params.reportType)) {
        try {
          const leadsResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/sales/leads?businessId=${context.businessId}`, {
            headers: { 'Authorization': `Bearer ${context.accessToken}` }
          });
          const dealsResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/sales/deals?businessId=${context.businessId}`, {
            headers: { 'Authorization': `Bearer ${context.accessToken}` }
          });
          
          const leadsData = leadsResponse.ok ? await leadsResponse.json() : { leads: [] };
          const dealsData = dealsResponse.ok ? await dealsResponse.json() : { deals: [] };
          
          report.sections.push({
            title: 'Sales Performance',
            data: {
              totalLeads: leadsData.leads?.length || 0,
              totalDeals: dealsData.deals?.length || 0,
              wonDeals: dealsData.deals?.filter((d: any) => d.status === 'won')?.length || 0,
              conversionRate: leadsData.leads?.length > 0 
                ? ((leadsData.leads.filter((l: any) => l.status === 'won').length / leadsData.leads.length) * 100).toFixed(2) + '%'
                : '0%'
            }
          });
        } catch (e) {}
      }

      if (['operations', 'comprehensive'].includes(params.reportType)) {
        try {
          const teamResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/team/members?businessId=${context.businessId}`, {
            headers: { 'Authorization': `Bearer ${context.accessToken}` }
          });
          const productsResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/products?businessId=${context.businessId}`, {
            headers: { 'Authorization': `Bearer ${context.accessToken}` }
          });
          
          const teamData = teamResponse.ok ? await teamResponse.json() : { members: [] };
          const productsData = productsResponse.ok ? await productsResponse.json() : { products: [] };
          
          report.sections.push({
            title: 'Operations Overview',
            data: {
              teamSize: teamData.members?.length || 0,
              totalProducts: productsData.products?.length || 0,
              activeProducts: productsData.products?.filter((p: any) => p.status === 'active')?.length || 0
            }
          });
        } catch (e) {}
      }

      return {
        success: true,
        message: `${params.reportType} report generated successfully with ${report.sections.length} section(s)`,
        data: report
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// Export business data
export const exportBusinessData: AIFunction = {
  name: "export_business_data",
  description: "Export business data in various formats (CSV, JSON) for backup or analysis",
  parameters: {
    type: "object",
    properties: {
      dataType: {
        type: "string",
        description: "Type of data to export",
        enum: ["transactions", "products", "customers", "employees", "all"]
      },
      format: {
        type: "string",
        description: "Export format",
        enum: ["json", "csv"]
      },
      startDate: {
        type: "string",
        description: "Filter start date (ISO format)"
      },
      endDate: {
        type: "string",
        description: "Filter end date (ISO format)"
      }
    },
    required: ["dataType"]
  },
  handler: async (params, context) => {
    try {
      if (!context.businessId) {
        return { success: false, error: 'No business selected' };
      }

      const exportData: any = {
        exportedAt: new Date().toISOString(),
        businessId: context.businessId,
        dataType: params.dataType,
        format: params.format || 'json',
        data: {}
      };

      if (['transactions', 'all'].includes(params.dataType)) {
        try {
          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/finance/transactions?businessId=${context.businessId}`, {
            headers: { 'Authorization': `Bearer ${context.accessToken}` }
          });
          if (response.ok) {
            const data = await response.json();
            exportData.data.transactions = data.transactions || [];
          }
        } catch (e) {}
      }

      if (['products', 'all'].includes(params.dataType)) {
        try {
          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/products?businessId=${context.businessId}`, {
            headers: { 'Authorization': `Bearer ${context.accessToken}` }
          });
          if (response.ok) {
            const data = await response.json();
            exportData.data.products = data.products || [];
          }
        } catch (e) {}
      }

      if (['customers', 'all'].includes(params.dataType)) {
        try {
          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/sales/customers?businessId=${context.businessId}`, {
            headers: { 'Authorization': `Bearer ${context.accessToken}` }
          });
          if (response.ok) {
            const data = await response.json();
            exportData.data.customers = data.customers || [];
          }
        } catch (e) {}
      }

      if (['employees', 'all'].includes(params.dataType)) {
        try {
          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/hr/employees?businessId=${context.businessId}`, {
            headers: { 'Authorization': `Bearer ${context.accessToken}` }
          });
          if (response.ok) {
            const data = await response.json();
            exportData.data.employees = data.employees || [];
          }
        } catch (e) {}
      }

      const totalRecords = Object.values(exportData.data).reduce((sum: number, arr: any) => sum + (arr?.length || 0), 0);

      return {
        success: true,
        message: `Exported ${totalRecords} record(s) in ${params.format || 'json'} format`,
        data: exportData
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// ============================================================================
// NOTIFICATIONS & REMINDERS
// ============================================================================

// Create notification/reminder
export const createNotification: AIFunction = {
  name: "create_notification",
  description: "Create a notification or reminder for important business tasks and deadlines",
  parameters: {
    type: "object",
    properties: {
      title: {
        type: "string",
        description: "Notification title"
      },
      message: {
        type: "string",
        description: "Notification message"
      },
      type: {
        type: "string",
        description: "Notification type",
        enum: ["reminder", "alert", "info", "success", "warning"]
      },
      dueDate: {
        type: "string",
        description: "When to trigger the notification (ISO format)"
      },
      priority: {
        type: "string",
        description: "Priority level",
        enum: ["low", "medium", "high", "urgent"]
      }
    },
    required: ["title", "message"]
  },
  handler: async (params, context) => {
    try {
      if (!context.businessId) {
        return { success: false, error: 'No business selected' };
      }

      const notificationData = {
        business_id: context.businessId,
        user_id: context.userId,
        title: params.title,
        message: params.message,
        type: params.type || 'info',
        priority: params.priority || 'medium',
        due_date: params.dueDate || new Date().toISOString(),
        status: 'active',
        created_at: new Date().toISOString()
      };

      const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const key = `business_${context.businessId}_notification_${notificationId}`;

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/kv/set`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${context.accessToken}`
        },
        body: JSON.stringify({ key, value: JSON.stringify({ ...notificationData, id: notificationId }) })
      });

      if (!response.ok) {
        throw new Error('Failed to create notification');
      }

      return {
        success: true,
        message: `Notification "${params.title}" created successfully`,
        data: { ...notificationData, id: notificationId }
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// Get notifications
export const getNotifications: AIFunction = {
  name: "get_notifications",
  description: "Retrieve all notifications and reminders for the business",
  parameters: {
    type: "object",
    properties: {
      status: {
        type: "string",
        description: "Filter by status",
        enum: ["active", "completed", "dismissed", "all"]
      },
      priority: {
        type: "string",
        description: "Filter by priority",
        enum: ["low", "medium", "high", "urgent", "all"]
      }
    },
    required: []
  },
  handler: async (params, context) => {
    try {
      if (!context.businessId) {
        return { success: false, error: 'No business selected' };
      }

      const prefix = `business_${context.businessId}_notification_`;
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/kv/getByPrefix?prefix=${encodeURIComponent(prefix)}`, {
        headers: { 'Authorization': `Bearer ${context.accessToken}` }
      });

      if (!response.ok) {
        throw new Error('Failed to retrieve notifications');
      }

      const result = await response.json();
      let notifications = result.values?.map((v: any) => JSON.parse(v)) || [];

      if (params.status && params.status !== 'all') {
        notifications = notifications.filter((n: any) => n.status === params.status);
      }

      if (params.priority && params.priority !== 'all') {
        notifications = notifications.filter((n: any) => n.priority === params.priority);
      }

      notifications.sort((a: any, b: any) => {
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        if (a.priority !== b.priority) {
          return priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder];
        }
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      });

      return {
        success: true,
        message: `Retrieved ${notifications.length} notification(s)`,
        data: notifications
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// ============================================================================
// PHONE PUSH NOTIFICATIONS
// ============================================================================

// Send phone push notification
export const sendPushNotification: AIFunction = {
  name: "send_push_notification",
  description: "Send an actual push notification to the user's phone for important alerts, reminders, and updates",
  parameters: {
    type: "object",
    properties: {
      title: {
        type: "string",
        description: "Notification title (short and attention-grabbing)"
      },
      body: {
        type: "string",
        description: "Notification message body"
      },
      priority: {
        type: "string",
        description: "Notification priority (affects delivery urgency)",
        enum: ["low", "normal", "high", "urgent"]
      },
      category: {
        type: "string",
        description: "Notification category for grouping",
        enum: ["reminder", "goal", "milestone", "alert", "update", "general"]
      },
      actionUrl: {
        type: "string",
        description: "Deep link URL to open when notification is tapped (e.g., '/roadmap', '/goals')"
      },
      scheduleFor: {
        type: "string",
        description: "Optional: Schedule notification for later (ISO format). If not provided, sends immediately"
      },
      data: {
        type: "object",
        description: "Additional data payload to include with notification"
      }
    },
    required: ["title", "body"]
  },
  handler: async (params, context) => {
    try {
      if (!context.userId) {
        return { success: false, error: 'User not authenticated' };
      }

      // Prepare notification payload
      const notificationPayload = {
        title: params.title,
        body: params.body,
        data: {
          category: params.category || 'general',
          actionUrl: params.actionUrl || '/',
          businessId: context.businessId,
          priority: params.priority || 'normal',
          ...params.data
        },
        recipients: 'specific',
        recipientIds: [context.userId]
      };

      // If scheduled for later, store as pending
      if (params.scheduleFor) {
        const scheduledNotif = {
          ...notificationPayload,
          scheduledFor: params.scheduleFor,
          status: 'scheduled',
          createdAt: new Date().toISOString()
        };

        const scheduleId = `scheduled_push_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const key = `user_${context.userId}_scheduled_notification_${scheduleId}`;

        await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/kv/set`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${context.accessToken}`
          },
          body: JSON.stringify({ key, value: JSON.stringify({ ...scheduledNotif, id: scheduleId }) })
        });

        return {
          success: true,
          message: `Push notification scheduled for ${new Date(params.scheduleFor).toLocaleString()}`,
          data: { scheduleId, scheduledFor: params.scheduleFor }
        };
      }

      // Send immediate push notification
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notifications/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${context.accessToken}`
        },
        body: JSON.stringify(notificationPayload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to send push notification: ${errorText}`);
      }

      const result = await response.json();

      return {
        success: true,
        message: `📱 Push notification sent to your phone!`,
        data: {
          notificationId: result.notificationId,
          recipientCount: result.recipientCount,
          title: params.title
        }
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// Register device for push notifications
export const registerDeviceForNotifications: AIFunction = {
  name: "register_device_for_notifications",
  description: "Register the current device to receive push notifications (called automatically by the app)",
  parameters: {
    type: "object",
    properties: {
      token: {
        type: "string",
        description: "Device push notification token from APNs or FCM"
      },
      platform: {
        type: "string",
        description: "Device platform",
        enum: ["ios", "android"]
      }
    },
    required: ["token", "platform"]
  },
  handler: async (params, context) => {
    try {
      if (!context.userId) {
        return { success: false, error: 'User not authenticated' };
      }

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notifications/register-device`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${context.accessToken}`
        },
        body: JSON.stringify({
          token: params.token,
          platform: params.platform
        })
      });

      if (!response.ok) {
        throw new Error('Failed to register device');
      }

      return {
        success: true,
        message: `✅ Device registered for ${params.platform} push notifications`,
        data: { platform: params.platform }
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// Get scheduled push notifications
export const getScheduledPushNotifications: AIFunction = {
  name: "get_scheduled_push_notifications",
  description: "Get all scheduled push notifications for the user",
  parameters: {
    type: "object",
    properties: {
      upcoming: {
        type: "boolean",
        description: "Only show notifications scheduled for the future"
      }
    },
    required: []
  },
  handler: async (params, context) => {
    try {
      if (!context.userId) {
        return { success: false, error: 'User not authenticated' };
      }

      const prefix = `user_${context.userId}_scheduled_notification_`;
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/kv/getByPrefix?prefix=${encodeURIComponent(prefix)}`, {
        headers: { 'Authorization': `Bearer ${context.accessToken}` }
      });

      if (!response.ok) {
        throw new Error('Failed to retrieve scheduled notifications');
      }

      const result = await response.json();
      let notifications = result.values?.map((v: any) => JSON.parse(v)) || [];

      // Filter upcoming only if requested
      if (params.upcoming) {
        const now = new Date();
        notifications = notifications.filter((n: any) => 
          new Date(n.scheduledFor) > now
        );
      }

      // Sort by scheduled time
      notifications.sort((a: any, b: any) => 
        new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime()
      );

      return {
        success: true,
        message: `Retrieved ${notifications.length} scheduled notification(s)`,
        data: notifications
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};