import { supabase } from './supabase/client';
import { projectId } from './supabase/info';

export interface CreditUsage {
  id: string;
  userId: string;
  businessId?: string;
  feature: 'ai_chat' | 'ai_assistant' | 'content_generation';
  tokensUsed: number;
  requestCount: number;
  estimatedCost: number; // in cents
  model: string;
  timestamp: string;
  metadata?: {
    messageLength?: number;
    responseLength?: number;
    conversationId?: string;
  };
}

export interface CreditsSummary {
  totalCreditsUsed: number;
  totalTokensUsed: number;
  totalRequests: number;
  estimatedCostCents: number;
  monthlyUsage: number;
  dailyUsage: number;
  remainingCredits: number;
  subscriptionPlan: string;
  overageCostPerCredit: number;
  subscriptionLimits: {
    monthlyCredits: number;
    dailyCredits: number;
    overage: boolean;
  };
}

export interface SubscriptionCreditLimits {
  free: {
    monthlyCredits: 100;
    dailyCredits: 10;
    overageCostPerCredit: 0.02; // 2 cents per credit
  };
  creator: {
    monthlyCredits: 1000;
    dailyCredits: 100;
    overageCostPerCredit: 0.015; // 1.5 cents per credit
  };
  builder: {
    monthlyCredits: 5000;
    dailyCredits: 500;
    overageCostPerCredit: 0.01; // 1 cent per credit
  };
  studio: {
    monthlyCredits: 20000;
    dailyCredits: 2000;
    overageCostPerCredit: 0.005; // 0.5 cents per credit
  };
}

// Convert OpenAI tokens to credits (1 credit = ~100 tokens for simplicity)
export const tokensToCredits = (tokens: number): number => {
  return Math.ceil(tokens / 100);
};

// Estimate cost based on OpenAI pricing
export const estimateOpenAICost = (tokens: number, model: string): number => {
  const pricing = {
    'gpt-4o': { input: 0.0025 / 1000, output: 0.01 / 1000 }, // $0.0025/1k input, $0.01/1k output
    'gpt-4': { input: 0.03 / 1000, output: 0.06 / 1000 }, // $0.03/1k input, $0.06/1k output
    'gpt-3.5-turbo': { input: 0.001 / 1000, output: 0.002 / 1000 }, // $0.001/1k input, $0.002/1k output
  };
  
  const modelPricing = pricing[model as keyof typeof pricing] || pricing['gpt-4o'];
  // Assume 70% input tokens, 30% output tokens
  const inputTokens = Math.floor(tokens * 0.7);
  const outputTokens = Math.floor(tokens * 0.3);
  
  const cost = (inputTokens * modelPricing.input) + (outputTokens * modelPricing.output);
  return Math.ceil(cost * 100); // Return cost in cents
};

export const getCreditLimits = (subscriptionPlan: string): SubscriptionCreditLimits[keyof SubscriptionCreditLimits] => {
  const limits: SubscriptionCreditLimits = {
    free: {
      monthlyCredits: 100,
      dailyCredits: 10,
      overageCostPerCredit: 0.02,
    },
    creator: {
      monthlyCredits: 1000,
      dailyCredits: 100,
      overageCostPerCredit: 0.015,
    },
    builder: {
      monthlyCredits: 5000,
      dailyCredits: 500,
      overageCostPerCredit: 0.01,
    },
    studio: {
      monthlyCredits: 20000,
      dailyCredits: 2000,
      overageCostPerCredit: 0.005,
    },
  };

  return limits[subscriptionPlan as keyof SubscriptionCreditLimits] || limits.free;
};

// Track AI usage
export const trackAIUsage = async (usage: Omit<CreditUsage, 'id' | 'timestamp'>): Promise<void> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/credits/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(usage),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to parse error' }));
      throw new Error(errorData.error || `Failed to track usage: ${response.status}`);
    }

    console.log('✅ AI usage tracked successfully');
  } catch (error) {
    console.error('❌ Failed to track AI usage:', error);
    // Don't throw error to avoid breaking the user experience
  }
};

// Get user's credit summary
export const getCreditsSummary = async (businessId?: string): Promise<CreditsSummary> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('User not authenticated');
    }

    const url = new URL(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/credits/summary`);
    if (businessId) {
      url.searchParams.set('businessId', businessId);
    }

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to parse error' }));
      throw new Error(errorData.error || `Failed to get credits summary: ${response.status}`);
    }

    const data = await response.json();
    return data.summary;
  } catch (error) {
    console.error('❌ Failed to get credits summary:', error);
    
    // Return default summary on error
    return {
      totalCreditsUsed: 0,
      totalTokensUsed: 0,
      totalRequests: 0,
      estimatedCostCents: 0,
      monthlyUsage: 0,
      dailyUsage: 0,
      remainingCredits: 100, // Default free tier
      subscriptionPlan: 'free',
      overageCostPerCredit: 0.02,
      subscriptionLimits: {
        monthlyCredits: 100,
        dailyCredits: 10,
        overage: false,
      },
    };
  }
};

// Check if user can make AI request
export const canMakeAIRequest = async (estimatedCredits: number, businessId?: string): Promise<{ 
  allowed: boolean; 
  reason?: string; 
  creditsRemaining: number;
}> => {
  try {
    const summary = await getCreditsSummary(businessId);
    
    // Check daily limit
    if (summary.dailyUsage + estimatedCredits > summary.subscriptionLimits.dailyCredits) {
      return {
        allowed: false,
        reason: 'Daily credit limit exceeded',
        creditsRemaining: summary.remainingCredits,
      };
    }
    
    // Check monthly limit (with small buffer for overage)
    const monthlyBuffer = summary.subscriptionLimits.monthlyCredits * 0.1; // 10% buffer
    if (summary.monthlyUsage + estimatedCredits > summary.subscriptionLimits.monthlyCredits + monthlyBuffer) {
      return {
        allowed: false,
        reason: 'Monthly credit limit exceeded',
        creditsRemaining: summary.remainingCredits,
      };
    }
    
    return {
      allowed: true,
      creditsRemaining: summary.remainingCredits,
    };
  } catch (error) {
    console.error('❌ Failed to check AI request permission:', error);
    
    // Allow request on error to avoid breaking user experience
    return {
      allowed: true,
      creditsRemaining: 0,
    };
  }
};

// Get credit usage history
export const getCreditUsageHistory = async (businessId?: string, days: number = 30): Promise<CreditUsage[]> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('User not authenticated');
    }

    const url = new URL(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/credits/history`);
    if (businessId) {
      url.searchParams.set('businessId', businessId);
    }
    url.searchParams.set('days', days.toString());

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to parse error' }));
      throw new Error(errorData.error || `Failed to get usage history: ${response.status}`);
    }

    const data = await response.json();
    return data.history || [];
  } catch (error) {
    console.error('❌ Failed to get credit usage history:', error);
    return [];
  }
};