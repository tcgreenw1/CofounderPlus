// Utility functions for user data handling

interface SupabaseUser {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    name?: string;
    first_name?: string;
    last_name?: string;
    given_name?: string;
    family_name?: string;
    // OAuth provider specific fields
    avatar_url?: string;
    picture?: string;
  };
  app_metadata?: any;
}

/**
 * Extract the user's display name from Supabase user object
 * Prioritizes actual name fields over email-derived names
 */
export const getUserDisplayName = (user: SupabaseUser | null | undefined): string => {
  if (!user) return 'User';

  const metadata = user.user_metadata || {};
  
  // Priority order for name extraction:
  // 1. full_name (most complete)
  // 2. name (common field)
  // 3. first_name + last_name combination
  // 4. given_name + family_name (OAuth common)
  // 5. first_name only
  // 6. given_name only
  // 7. email prefix (fallback)
  
  if (metadata.full_name?.trim()) {
    return metadata.full_name.trim();
  }
  
  if (metadata.name?.trim()) {
    return metadata.name.trim();
  }
  
  // Try to combine first and last name
  const firstName = metadata.first_name?.trim() || metadata.given_name?.trim();
  const lastName = metadata.last_name?.trim() || metadata.family_name?.trim();
  
  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }
  
  if (firstName) {
    return firstName;
  }
  
  // Fallback to email prefix if no name metadata is available
  if (user.email) {
    return user.email.split('@')[0];
  }
  
  return 'User';
};

/**
 * Extract the user's first name for casual greetings
 */
export const getUserFirstName = (user: SupabaseUser | null | undefined): string => {
  if (!user) return 'there';

  const metadata = user.user_metadata || {};
  
  // Priority order for first name:
  // 1. first_name field
  // 2. given_name field (OAuth)
  // 3. Extract first word from full_name
  // 4. Extract first word from name
  // 5. email prefix (fallback)
  
  if (metadata.first_name?.trim()) {
    return metadata.first_name.trim();
  }
  
  if (metadata.given_name?.trim()) {
    return metadata.given_name.trim();
  }
  
  // Extract first word from full name
  if (metadata.full_name?.trim()) {
    return metadata.full_name.trim().split(' ')[0];
  }
  
  if (metadata.name?.trim()) {
    return metadata.name.trim().split(' ')[0];
  }
  
  // Fallback to email prefix
  if (user.email) {
    return user.email.split('@')[0];
  }
  
  return 'there';
};

/**
 * Get user's initials for avatar fallbacks
 */
export const getUserInitials = (user: SupabaseUser | null | undefined): string => {
  if (!user) return 'U';

  const displayName = getUserDisplayName(user);
  
  // Split name into words and take first letter of each
  const words = displayName.split(' ').filter(word => word.length > 0);
  
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }
  
  if (words.length === 1) {
    return words[0][0].toUpperCase();
  }
  
  return 'U';
};

/**
 * Check if user has profile name information (not just email-derived)
 */
export const hasUserProfileName = (user: SupabaseUser | null | undefined): boolean => {
  if (!user?.user_metadata) return false;
  
  const metadata = user.user_metadata;
  
  return !!(
    metadata.full_name?.trim() ||
    metadata.name?.trim() ||
    metadata.first_name?.trim() ||
    metadata.given_name?.trim()
  );
};

/**
 * Get user's profile picture URL
 */
export const getUserAvatarUrl = (user: SupabaseUser | null | undefined): string | null => {
  if (!user?.user_metadata) return null;
  
  const metadata = user.user_metadata;
  
  return metadata.avatar_url || metadata.picture || null;
};

/**
 * Format user name for different contexts
 */
export const formatUserName = (user: SupabaseUser | null | undefined, format: 'full' | 'first' | 'initials' = 'full'): string => {
  switch (format) {
    case 'first':
      return getUserFirstName(user);
    case 'initials':
      return getUserInitials(user);
    case 'full':
    default:
      return getUserDisplayName(user);
  }
};

/**
 * Get a friendly greeting with the user's name
 */
export const getUserGreeting = (user: SupabaseUser | null | undefined, timeOfDay?: 'morning' | 'afternoon' | 'evening'): string => {
  const firstName = getUserFirstName(user);
  
  if (timeOfDay) {
    const greetings = {
      morning: 'Good morning',
      afternoon: 'Good afternoon', 
      evening: 'Good evening'
    };
    return `${greetings[timeOfDay]}, ${firstName}!`;
  }
  
  return `Welcome back, ${firstName}!`;
};

/**
 * Auto-detect time of day for greetings
 */
export const getTimeBasedGreeting = (user: SupabaseUser | null | undefined): string => {
  const hour = new Date().getHours();
  let timeOfDay: 'morning' | 'afternoon' | 'evening';
  
  if (hour < 12) {
    timeOfDay = 'morning';
  } else if (hour < 17) {
    timeOfDay = 'afternoon';
  } else {
    timeOfDay = 'evening';
  }
  
  return getUserGreeting(user, timeOfDay);
};