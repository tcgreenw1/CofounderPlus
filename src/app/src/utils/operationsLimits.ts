// Centralized operations limits configuration
export const OPERATION_LIMITS = {
  free: {
    products: 1,
    campaigns: 1,
    deals: 1,
    leads: 1,
    transactions: 3,
    budgets: 1,
    aiMessages: 50,
    bankBalance: true
  },
  creator: {
    products: 4,
    campaigns: 2,
    deals: 10,
    leads: 100,
    transactions: 20,
    budgets: 10,
    aiMessages: 200,
    bankBalance: true
  },
  builder: {
    products: 15,
    campaigns: 10,
    deals: 50,
    leads: 250,
    transactions: 100,
    budgets: 30,
    aiMessages: 2000,
    bankBalance: true
  },
  studio: {
    products: 50,
    campaigns: 30,
    deals: 200,
    leads: 1000,
    transactions: 1000,
    budgets: 100,
    aiMessages: 20000,
    bankBalance: true
  }
};

export type SubscriptionTier = keyof typeof OPERATION_LIMITS;
export type OperationType = keyof Omit<typeof OPERATION_LIMITS.free, 'bankBalance'>;

// Helper function to get subscription tier from subscription data
export const getSubscriptionTier = (subscription: any, subscriptionStatus: string): SubscriptionTier => {
  if (!subscription || subscriptionStatus !== 'active') {
    // Also check for 'subscribed' status which is used in CloudSubscriptionContext
    if (!subscription || (subscriptionStatus !== 'subscribed' && subscriptionStatus !== 'trial')) {
      return 'free';
    }
  }
  
  // The subscription.plan field contains lowercase tier names (creator, builder, studio)
  // Map directly since they already match our tier names
  const plan = subscription.plan?.toLowerCase();
  
  if (plan === 'creator' || plan === 'builder' || plan === 'studio') {
    return plan as SubscriptionTier;
  }
  
  return 'free';
};

// Helper function to get limits for a specific tier
export const getLimitsForTier = (tier: SubscriptionTier) => {
  return OPERATION_LIMITS[tier];
};

// Helper function to check if an operation is allowed
export const isOperationAllowed = (
  tier: SubscriptionTier,
  operationType: OperationType,
  currentUsage: number
): boolean => {
  const limits = OPERATION_LIMITS[tier];
  const limit = limits[operationType];
  
  if (typeof limit === 'boolean') return limit;
  return currentUsage < limit;
};

// Helper function to get next tier suggestion
export const getNextTier = (currentTier: SubscriptionTier): SubscriptionTier | null => {
  const tiers: SubscriptionTier[] = ['free', 'creator', 'builder', 'studio'];
  const currentIndex = tiers.indexOf(currentTier);
  return currentIndex < tiers.length - 1 ? tiers[currentIndex + 1] : null;
};

// Helper function to get tier display name
export const getTierDisplayName = (tier: SubscriptionTier): string => {
  const displayNames: Record<SubscriptionTier, string> = {
    free: 'Free',
    creator: 'Creator',
    builder: 'Builder',
    studio: 'Studio'
  };
  
  return displayNames[tier];
};

// Helper function to get usage percentage
export const getUsagePercentage = (
  tier: SubscriptionTier,
  operationType: OperationType,
  currentUsage: number
): number => {
  const limits = OPERATION_LIMITS[tier];
  const limit = limits[operationType];
  
  if (typeof limit === 'boolean') return 0;
  return Math.min((currentUsage / limit) * 100, 100);
};

// Helper function to format limit display
export const formatLimitDisplay = (limit: number | boolean): string => {
  if (typeof limit === 'boolean') {
    return limit ? 'Unlimited' : 'Not available';
  }
  return limit.toString();
};

// AI-specific helper functions
export const getAIMessageLimit = (tier: SubscriptionTier): number => {
  return OPERATION_LIMITS[tier].aiMessages;
};

// Helper to process monthly credits (called whenever we check balance)
const processMonthlyCredits = (businessId: string, tier: SubscriptionTier): void => {
  try {
    const monthlyAllocation = getAIMessageLimit(tier);
    const maxBalance = monthlyAllocation * 2; // Cap at 2 months
    
    const lastCreditDateKey = `ai_last_credit_date_${businessId}`;
    const remainingKey = `ai_messages_remaining_${businessId}`;
    
    const lastCreditDate = localStorage.getItem(lastCreditDateKey);
    const currentRemaining = parseInt(localStorage.getItem(remainingKey) || monthlyAllocation.toString(), 10);
    
    const now = new Date();
    
    // Initialize if first time
    if (!lastCreditDate) {
      console.log('🎁 AI CREDITS: Initializing credits for business', businessId, 'with', monthlyAllocation, 'messages');
      localStorage.setItem(remainingKey, monthlyAllocation.toString());
      localStorage.setItem(lastCreditDateKey, now.toISOString());
      return;
    }
    
    // Check if 30 days have passed since last credit
    const lastCredit = new Date(lastCreditDate);
    const daysSinceCredit = (now.getTime() - lastCredit.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceCredit >= 30) {
      // Calculate how many 30-day periods have passed
      const periodsPassed = Math.floor(daysSinceCredit / 30);
      const creditsToAdd = periodsPassed * monthlyAllocation;
      
      // Add credits but cap at maximum
      const newBalance = Math.min(currentRemaining + creditsToAdd, maxBalance);
      
      console.log('🎁 AI CREDITS: Adding', creditsToAdd, 'messages (', periodsPassed, 'periods). New balance:', newBalance, '(capped at', maxBalance + ')');
      
      localStorage.setItem(remainingKey, newBalance.toString());
      // Update last credit date by the number of periods processed
      const newLastCreditDate = new Date(lastCredit.getTime() + (periodsPassed * 30 * 24 * 60 * 60 * 1000));
      localStorage.setItem(lastCreditDateKey, newLastCreditDate.toISOString());
    }
  } catch (error) {
    console.error('Error processing monthly credits:', error);
  }
};

export const checkAIMessageLimit = async (
  userId: string,
  businessId: string,
  tier: SubscriptionTier
): Promise<{ allowed: boolean; remaining: number; monthlyAllocation: number; tier: string }> => {
  try {
    // Process any pending monthly credits
    processMonthlyCredits(businessId, tier);
    
    const remainingKey = `ai_messages_remaining_${businessId}`;
    const monthlyAllocation = getAIMessageLimit(tier);
    const remaining = parseInt(localStorage.getItem(remainingKey) || monthlyAllocation.toString(), 10);
    
    return {
      allowed: remaining > 0,
      remaining,
      monthlyAllocation,
      tier
    };
  } catch (error) {
    console.error('Error checking AI message limit:', error);
    // In case of error, allow the message but log it
    const monthlyAllocation = getAIMessageLimit(tier);
    return {
      allowed: true,
      remaining: monthlyAllocation,
      monthlyAllocation,
      tier
    };
  }
};

export const updateAIMessageUsage = (businessId: string, tier: SubscriptionTier): void => {
  try {
    // Process any pending monthly credits first
    processMonthlyCredits(businessId, tier);
    
    const remainingKey = `ai_messages_remaining_${businessId}`;
    const monthlyAllocation = getAIMessageLimit(tier);
    const currentRemaining = parseInt(localStorage.getItem(remainingKey) || monthlyAllocation.toString(), 10);
    
    if (currentRemaining > 0) {
      const newRemaining = currentRemaining - 1;
      localStorage.setItem(remainingKey, newRemaining.toString());
      console.log('💬 AI MESSAGE: Used 1 message. Remaining:', newRemaining);
    }
  } catch (error) {
    console.error('Error updating AI message usage:', error);
  }
};

export const getAIMessageRemaining = (businessId: string, tier: SubscriptionTier): number => {
  try {
    // Process any pending monthly credits first
    processMonthlyCredits(businessId, tier);
    
    const remainingKey = `ai_messages_remaining_${businessId}`;
    const monthlyAllocation = getAIMessageLimit(tier);
    const remaining = parseInt(localStorage.getItem(remainingKey) || monthlyAllocation.toString(), 10);
    return remaining;
  } catch (error) {
    console.error('Error getting AI message remaining:', error);
    const monthlyAllocation = getAIMessageLimit(tier);
    return monthlyAllocation;
  }
};

// Legacy function for backwards compatibility - now returns remaining instead of usage
export const getAIMessageUsage = (businessId: string): number => {
  try {
    const remainingKey = `ai_messages_remaining_${businessId}`;
    return parseInt(localStorage.getItem(remainingKey) || '0', 10);
  } catch (error) {
    console.error('Error getting AI message usage:', error);
    return 0;
  }
};