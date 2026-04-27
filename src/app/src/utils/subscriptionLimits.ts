// Subscription limits and business creation paywall logic

export interface SubscriptionLimits {
  businesses: number;
  operationsAccess: boolean;
  scalingTools: boolean;
  prioritySupport: boolean;
  customBranding: boolean;
}

export const SUBSCRIPTION_LIMITS: Record<string, SubscriptionLimits> = {
  free: {
    businesses: 1,
    operationsAccess: true, // Full operations, but limited items
    scalingTools: false,
    prioritySupport: false,
    customBranding: false,
  },
  starter: {
    businesses: 1,
    operationsAccess: true, // Full operations, but limited items
    scalingTools: false,
    prioritySupport: false,
    customBranding: false,
  },
  creator: {
    businesses: 2,
    operationsAccess: true,
    scalingTools: true,
    prioritySupport: false,
    customBranding: false,
  },
  builder: {
    businesses: 5,
    operationsAccess: true,
    scalingTools: true,
    prioritySupport: true,
    customBranding: false,
  },
  studio: {
    businesses: 10,
    operationsAccess: true,
    scalingTools: true,
    prioritySupport: true,
    customBranding: true,
  },
};

export const SUBSCRIPTION_TIER_NAMES: Record<string, string> = {
  free: 'Free',
  starter: 'Starter',
  creator: 'Launch',
  builder: 'Grow',
  studio: 'Scale',
};

export const SUBSCRIPTION_TIER_PRICES: Record<string, { monthly: number; yearly: number }> = {
  free: { monthly: 0, yearly: 0 },
  starter: { monthly: 0, yearly: 0 },
  creator: { monthly: 19, yearly: 168 }, // $14/month when billed annually
  builder: { monthly: 49, yearly: 468 }, // $39/month when billed annually
  studio: { monthly: 199, yearly: 1908 }, // $159/month when billed annually
};

/**
 * Check if user can create more businesses based on their subscription
 */
export const canCreateMoreBusinesses = (
  currentBusinessCount: number,
  subscriptionTier: string = 'free'
): boolean => {
  const normalizedTier = (subscriptionTier || 'free').toLowerCase().trim();
  const limits = SUBSCRIPTION_LIMITS[normalizedTier] || SUBSCRIPTION_LIMITS.free;
  
  return currentBusinessCount < limits.businesses;
};

/**
 * Get the next subscription tier that allows more businesses
 */
export const getNextTierForBusinesses = (
  currentBusinessCount: number,
  currentTier: string = 'free'
): string | null => {
  const normalizedTier = (currentTier || 'free').toLowerCase().trim();
  const currentLimits = SUBSCRIPTION_LIMITS[normalizedTier] || SUBSCRIPTION_LIMITS.free;
  
  // If current tier already allows enough businesses, return null
  if (currentBusinessCount < currentLimits.businesses) {
    return null;
  }
  
  // Find the next tier that allows more businesses
  const tiers = ['free', 'starter', 'creator', 'builder', 'studio'];
  const currentTierIndex = tiers.indexOf(normalizedTier);
  
  for (let i = currentTierIndex + 1; i < tiers.length; i++) {
    const tierLimits = SUBSCRIPTION_LIMITS[tiers[i]];
    if (tierLimits.businesses > currentBusinessCount) {
      return tiers[i];
    }
  }
  
  return null; // Already at highest tier or no tier allows more
};

/**
 * Get subscription tier display information
 */
export const getSubscriptionTierInfo = (tier: string) => {
  // Normalize tier value and provide fallback
  let normalizedTier = (tier || 'free').toLowerCase().trim();
  
  // Map common variations to standard values
  if (normalizedTier === '' || normalizedTier === 'unknown' || normalizedTier === 'none') {
    normalizedTier = 'free';
  }
  
  const limits = SUBSCRIPTION_LIMITS[normalizedTier] || SUBSCRIPTION_LIMITS.free;
  const name = SUBSCRIPTION_TIER_NAMES[normalizedTier] || SUBSCRIPTION_TIER_NAMES.free;
  const pricing = SUBSCRIPTION_TIER_PRICES[normalizedTier] || SUBSCRIPTION_TIER_PRICES.free;
  
  return {
    tier: normalizedTier,
    name: name,
    limits: limits,
    pricing: pricing,
  };
};

/**
 * Get business limit message for paywall
 */
export const getBusinessLimitMessage = (
  currentCount: number,
  currentTier: string = 'free'
): string => {
  const tierInfo = getSubscriptionTierInfo(currentTier);
  const nextTier = getNextTierForBusinesses(currentCount, currentTier);
  
  if (!nextTier) {
    return `You've reached the maximum number of businesses (${tierInfo.limits.businesses}) for the ${tierInfo.name} plan.`;
  }
  
  const nextTierInfo = getSubscriptionTierInfo(nextTier);
  return `You've reached the limit of ${tierInfo.limits.businesses} ${tierInfo.limits.businesses === 1 ? 'business' : 'businesses'} on the ${tierInfo.name} plan. Upgrade to ${nextTierInfo.name} to create up to ${nextTierInfo.limits.businesses} businesses.`;
};

export default {
  SUBSCRIPTION_LIMITS,
  SUBSCRIPTION_TIER_NAMES,
  SUBSCRIPTION_TIER_PRICES,
  canCreateMoreBusinesses,
  getNextTierForBusinesses,
  getSubscriptionTierInfo,
  getBusinessLimitMessage,
};