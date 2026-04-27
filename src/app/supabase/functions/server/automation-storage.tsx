/**
 * Automation Storage Helper
 * Handles storing automation results in appropriate structures
 * Version: 1.0
 */

import * as kv from './kv_store.tsx';

/**
 * Storage configuration for each automation type
 * Defines where and how results should be stored
 */
const AUTOMATION_STORAGE_CONFIG: Record<string, {
  storage: 'report' | 'data' | 'tasks' | 'insights';
  category: string;
  format: 'markdown' | 'json' | 'structured';
  retention: number; // days
}> = {
  // PRODUCT AUTOMATIONS
  'product-market-monitoring': {
    storage: 'report',
    category: 'product',
    format: 'markdown',
    retention: 90
  },
  'feature-prioritization': {
    storage: 'data',
    category: 'product',
    format: 'structured',
    retention: 365
  },
  'user-feedback-synthesis': {
    storage: 'report',
    category: 'product',
    format: 'markdown',
    retention: 90
  },
  'roadmap-health-check': {
    storage: 'report',
    category: 'product',
    format: 'markdown',
    retention: 90
  },

  // SALES AUTOMATIONS
  'lead-scoring-refresh': {
    storage: 'data',
    category: 'sales',
    format: 'structured',
    retention: 180
  },
  'pipeline-forecast-analysis': {
    storage: 'report',
    category: 'sales',
    format: 'structured',
    retention: 180
  },
  'outreach-performance-review': {
    storage: 'report',
    category: 'sales',
    format: 'markdown',
    retention: 90
  },
  'stalled-deal-detection': {
    storage: 'tasks',
    category: 'sales',
    format: 'structured',
    retention: 60
  },
  'follow-up-queue-builder': {
    storage: 'tasks',
    category: 'sales',
    format: 'structured',
    retention: 30
  },

  // MARKETING AUTOMATIONS
  'campaign-performance-audit': {
    storage: 'report',
    category: 'marketing',
    format: 'structured',
    retention: 180
  },
  'competitive-intelligence': {
    storage: 'report',
    category: 'marketing',
    format: 'markdown',
    retention: 365
  },
  'content-calendar-generator': {
    storage: 'data',
    category: 'marketing',
    format: 'structured',
    retention: 90
  },
  'seo-content-suggestions': {
    storage: 'insights',
    category: 'marketing',
    format: 'structured',
    retention: 180
  },
  'marketing-metrics-digest': {
    storage: 'report',
    category: 'marketing',
    format: 'structured',
    retention: 90
  },

  // FINANCE AUTOMATIONS
  'expense-review-categorization': {
    storage: 'data',
    category: 'finance',
    format: 'structured',
    retention: 2555 // 7 years for tax purposes
  },
  'cash-runway-forecast': {
    storage: 'report',
    category: 'finance',
    format: 'structured',
    retention: 365
  },
  'invoice-collection-monitor': {
    storage: 'tasks',
    category: 'finance',
    format: 'structured',
    retention: 365
  },
  'financial-statement-generator': {
    storage: 'report',
    category: 'finance',
    format: 'structured',
    retention: 2555 // 7 years for accounting
  },
  'budget-variance-tracking': {
    storage: 'report',
    category: 'finance',
    format: 'structured',
    retention: 365
  },
  'tax-optimization-scanner': {
    storage: 'report',
    category: 'finance',
    format: 'structured',
    retention: 2555 // 7 years for tax purposes
  },

  // HR AUTOMATIONS
  'policy-compliance-check': {
    storage: 'report',
    category: 'hr',
    format: 'markdown',
    retention: 2555 // 7 years for compliance
  },
  'onboarding-readiness-check': {
    storage: 'data',
    category: 'hr',
    format: 'structured',
    retention: 365
  },
  'performance-review-prep': {
    storage: 'data',
    category: 'hr',
    format: 'structured',
    retention: 2555 // 7 years for HR records
  },
  'team-engagement-insights': {
    storage: 'insights',
    category: 'hr',
    format: 'structured',
    retention: 365
  },

  // GENERAL AUTOMATIONS
  'daily-business-brief': {
    storage: 'report',
    category: 'general',
    format: 'markdown',
    retention: 30
  },
  'missing-task-identifier': {
    storage: 'tasks',
    category: 'general',
    format: 'structured',
    retention: 60
  },
  'deadline-risk-scanner': {
    storage: 'insights',
    category: 'general',
    format: 'structured',
    retention: 90
  },
  'cross-department-sync': {
    storage: 'insights',
    category: 'general',
    format: 'structured',
    retention: 90
  }
};

/**
 * Store automation result with proper categorization
 */
export async function storeAutomationResult(
  userId: string,
  businessId: string,
  automationId: string,
  result: any,
  userInput: any = {}
): Promise<string> {
  const config = AUTOMATION_STORAGE_CONFIG[automationId];
  
  if (!config) {
    console.warn(`⚠️ No storage config for automation: ${automationId}, using default`);
  }

  // Infer category from automation ID if no config exists
  let category = config?.category;
  if (!category) {
    if (automationId.includes('product') || automationId.includes('feature') || automationId.includes('roadmap') || automationId.includes('feedback')) {
      category = 'product';
    } else if (automationId.includes('sales') || automationId.includes('lead') || automationId.includes('deal') || automationId.includes('pipeline')) {
      category = 'sales';
    } else if (automationId.includes('marketing') || automationId.includes('campaign') || automationId.includes('content') || automationId.includes('seo')) {
      category = 'marketing';
    } else if (automationId.includes('finance') || automationId.includes('expense') || automationId.includes('cash') || automationId.includes('invoice') || automationId.includes('budget') || automationId.includes('tax')) {
      category = 'finance';
    } else if (automationId.includes('hr') || automationId.includes('handbook') || automationId.includes('onboarding') || automationId.includes('performance')) {
      category = 'hr';
    } else {
      category = 'general';
    }
    console.log(`📝 Inferred category "${category}" for automation: ${automationId}`);
  }

  const timestamp = Date.now();
  const expiresAt = new Date(timestamp + ((config?.retention || 90) * 24 * 60 * 60 * 1000)).toISOString();
  const storageType = config?.storage || 'report';

  // Store automation report using the same pattern as other business data
  // Pattern: business:${userId}:${businessId}:automation:${category}:${automationId}:${timestamp}
  const reportKey = `business:${userId}:${businessId}:automation:${category}:${automationId}:${timestamp}`;
  
  const reportData = {
    automationId,
    automationTitle: formatAutomationTitle(automationId),
    category: category,
    storageType: storageType,
    format: config?.format || 'markdown',
    data: result,
    userInput,
    createdAt: new Date(timestamp).toISOString(),
    expiresAt
  };
  
  console.log(`💾 Storing automation result with key: ${reportKey}`);
  console.log(`📊 Report data:`, {
    automationId: reportData.automationId,
    category: reportData.category,
    storageType: reportData.storageType,
    hasData: !!reportData.data,
    createdAt: reportData.createdAt
  });
  
  await kv.set(reportKey, reportData);
  
  console.log(`✅ Successfully stored automation result: ${reportKey}`);

  return reportKey;
}

/**
 * Get automation results by category and storage type
 */
export async function getAutomationResultsByCategory(
  userId: string,
  businessId: string,
  category: string,
  storageType?: 'report' | 'data' | 'tasks' | 'insights'
): Promise<any[]> {
  // Use the correct prefix pattern that matches how data is stored
  // Pattern: business:${userId}:${businessId}:automation:${category}:
  const prefix = `business:${userId}:${businessId}:automation:${category}:`;
  
  console.log(`🔍 Searching for automation results with prefix: ${prefix}`);
  
  const results = await kv.getByPrefix(prefix);
  
  console.log(`📦 Found ${results?.length || 0} automation results for category: ${category}`);
  
  if (!results || results.length === 0) {
    console.log(`⚠️ No results found for prefix: ${prefix}`);
    return [];
  }

  // Note: getByPrefix returns an array of values directly (not {key, value} objects)
  const parsed = results
    .map(item => {
      // item is already the value from the kv store
      if (typeof item === 'object' && item !== null) {
        return item;
      }
      try {
        return typeof item === 'string' ? JSON.parse(item) : item;
      } catch {
        console.error('Failed to parse item:', item);
        return null;
      }
    })
    .filter(item => {
      if (!item) return false;
      // Filter by storage type if specified
      if (storageType && item.storageType !== storageType) {
        return false;
      }
      return true;
    })
    .sort((a: any, b: any) => {
      const aTime = new Date(a.createdAt || 0).getTime();
      const bTime = new Date(b.createdAt || 0).getTime();
      return bTime - aTime;
    });

  console.log(`✅ Returning ${parsed.length} filtered and sorted results`);
  return parsed;
}

/**
 * Get latest automation result for specific automation
 */
export async function getLatestAutomationResult(
  userId: string,
  businessId: string,
  automationId: string
): Promise<any | null> {
  const prefix = `automation_result:${userId}:${businessId}:${automationId}`;
  const results = await kv.getByPrefix(prefix);

  if (!results || results.length === 0) {
    return null;
  }

  // Sort by timestamp and return most recent
  const sorted = results
    .map(item => {
      if (typeof item.value === 'object') {
        return item.value;
      }
      try {
        return JSON.parse(item.value);
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .sort((a: any, b: any) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

  return sorted[0] || null;
}

/**
 * Clean up expired automation results
 */
export async function cleanupExpiredResults(userId: string, businessId: string): Promise<number> {
  const now = new Date();
  let deletedCount = 0;

  // Get all automation results for user/business using the correct prefix
  const prefix = `business:${userId}:${businessId}:automation:`;
  const results = await kv.getByPrefix(prefix);
  
  if (!results) return 0;

  for (const item of results) {
    try {
      const data = typeof item.value === 'object' ? item.value : JSON.parse(item.value);
      const expiresAt = new Date(data.expiresAt);
      
      if (expiresAt < now) {
        await kv.del(item.key);
        deletedCount++;
      }
    } catch (error) {
      console.error(`Failed to process item ${item.key}:`, error);
    }
  }

  console.log(`🗑️ Cleaned up ${deletedCount} expired automation results`);
  return deletedCount;
}

/**
 * Format automation title for display
 */
function formatAutomationTitle(automationId: string): string {
  const titles: Record<string, string> = {
    // Product automations
    'product-market-monitoring': 'Market & Trend Monitoring',
    'feature-prioritization': 'Feature Prioritization',
    'user-feedback-synthesis': 'User Feedback Synthesis',
    'roadmap-health-check': 'Roadmap Health Check',
    
    // Sales automations
    'lead-scoring-refresh': 'Lead Scoring & Prioritization',
    'pipeline-forecast-analysis': 'Pipeline Analysis & Forecasting',
    'outreach-performance-review': 'Outreach Performance Review',
    'stalled-deal-detection': 'Stalled Deal Detection',
    'follow-up-queue-builder': 'Follow-up Queue Builder',
    
    // Marketing automations
    'campaign-performance-audit': 'Campaign Performance Audit',
    'competitive-intelligence': 'Competitive Intelligence Report',
    'content-calendar-generator': 'Content Calendar Generator',
    'seo-content-suggestions': 'SEO & Content Recommendations',
    'marketing-metrics-digest': 'Marketing Metrics Digest',
    
    // Finance automations
    'expense-review-categorization': 'Expense Review & Categorization',
    'cash-runway-forecast': 'Cash Flow & Runway Analysis',
    'invoice-collection-monitor': 'Invoice & Collections Monitor',
    'financial-statement-generator': 'Financial Statement Generator',
    'budget-variance-tracking': 'Budget Variance Analysis',
    'tax-optimization-scanner': 'Tax Deduction Scanner',
    
    // HR automations
    'policy-compliance-check': 'HR Policy Compliance Review',
    'onboarding-readiness-check': 'New Hire Onboarding Prep',
    'performance-review-prep': 'Performance Review Preparation',
    'team-engagement-insights': 'Team Health & Engagement Insights',
    
    // General automations
    'daily-business-brief': 'Daily Business Brief',
    'missing-task-identifier': 'Task Gap Analysis',
    'deadline-risk-scanner': 'Deadline Risk Scanner',
    'cross-department-sync': 'Cross-Department Sync Check'
  };

  return titles[automationId] || automationId.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}