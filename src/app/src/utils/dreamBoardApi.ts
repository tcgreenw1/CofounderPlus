import { projectId, publicAnonKey } from './supabase/info';

export interface Dream {
  id: string;
  title: string;
  description: string;
  targetAmount?: number;
  category: 'financial' | 'lifestyle' | 'career' | 'personal' | 'travel' | 'family';
  targetDate?: string;
  priority: 'low' | 'medium' | 'high';
  imageUrl?: string;
  progress: number; // 0-100
  isCompleted: boolean;
  createdAt: string;
  userId: string;
  businessId?: string;
}

export interface CreateDreamRequest {
  userId: string;
  businessId?: string;
  title: string;
  description?: string;
  targetAmount?: number;
  category: Dream['category'];
  targetDate?: string;
  priority?: Dream['priority'];
  imageUrl?: string;
}

export interface UpdateDreamRequest {
  title?: string;
  description?: string;
  targetAmount?: number;
  category?: Dream['category'];
  targetDate?: string;
  priority?: Dream['priority'];
  imageUrl?: string;
  progress?: number;
  isCompleted?: boolean;
}

// Get authorization header
const getAuthHeader = (accessToken?: string) => {
  return accessToken ? `Bearer ${accessToken}` : `Bearer ${publicAnonKey}`;
};

// Get all dreams for a user
export const getDreams = async (userId: string, businessId?: string, accessToken?: string): Promise<Dream[]> => {
  try {
    console.log('🎯 Dream Board API: Getting dreams for user:', userId, 'business:', businessId);
    
    const params = new URLSearchParams({ userId });
    if (businessId) {
      params.append('businessId', businessId);
    }

    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/dreams?${params}`,
      {
        headers: {
          'Authorization': getAuthHeader(accessToken),
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to get dreams');
    }

    console.log('🎯 Dream Board API: Retrieved dreams:', data.dreams?.length || 0);
    return data.dreams || [];

  } catch (error: any) {
    console.error('🎯 Dream Board API: Error getting dreams:', error);
    throw error;
  }
};

// Create a new dream
export const createDream = async (dreamData: CreateDreamRequest, accessToken?: string): Promise<Dream> => {
  try {
    console.log('🎯 Dream Board API: Creating dream:', dreamData.title);

    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/dreams`,
      {
        method: 'POST',
        headers: {
          'Authorization': getAuthHeader(accessToken),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dreamData),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to create dream');
    }

    console.log('🎯 Dream Board API: Created dream:', data.dream.id);
    return data.dream;

  } catch (error: any) {
    console.error('🎯 Dream Board API: Error creating dream:', error);
    throw error;
  }
};

// Update a dream
export const updateDream = async (dreamId: string, updates: UpdateDreamRequest, accessToken?: string): Promise<Dream> => {
  try {
    console.log('🎯 Dream Board API: Updating dream:', dreamId);

    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/dreams/${dreamId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': getAuthHeader(accessToken),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to update dream');
    }

    console.log('🎯 Dream Board API: Updated dream:', dreamId);
    return data.dream;

  } catch (error: any) {
    console.error('🎯 Dream Board API: Error updating dream:', error);
    throw error;
  }
};

// Delete a dream
export const deleteDream = async (dreamId: string, userId: string, businessId?: string, accessToken?: string): Promise<void> => {
  try {
    console.log('🎯 Dream Board API: Deleting dream:', dreamId);

    const params = new URLSearchParams({ userId });
    if (businessId) {
      params.append('businessId', businessId);
    }

    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/dreams/${dreamId}?${params}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': getAuthHeader(accessToken),
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to delete dream');
    }

    console.log('🎯 Dream Board API: Deleted dream:', dreamId);

  } catch (error: any) {
    console.error('🎯 Dream Board API: Error deleting dream:', error);
    throw error;
  }
};

// Get the #1 goal for dashboard display
export const getTopGoal = async (userId: string, businessId?: string, accessToken?: string): Promise<string | null> => {
  try {
    console.log('🎯 Dream Board API: Getting #1 goal for user:', userId, 'business:', businessId);
    
    const params = new URLSearchParams({ userId });
    if (businessId) {
      params.append('businessId', businessId);
    }

    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/number-one-goal?${params}`,
      {
        headers: {
          'Authorization': getAuthHeader(accessToken),
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.log('🎯 Dream Board API: No #1 goal set (non-error):', errorData);
      return null;
    }

    const data = await response.json();
    
    if (!data.success || !data.goalId) {
      console.log('🎯 Dream Board API: No #1 goal set');
      return null;
    }

    console.log('🎯 Dream Board API: Retrieved #1 goal ID:', data.goalId);
    return data.goalId;

  } catch (error: any) {
    console.error('🎯 Dream Board API: Error getting #1 goal:', error);
    return null;
  }
};

// Set #1 goal for user
export const setNumberOneGoal = async (userId: string, dreamId: string | null, accessToken?: string): Promise<void> => {
  try {
    console.log('🎯 Dream Board API: Setting #1 goal for user:', userId, 'dream:', dreamId);

    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/number-one-goal`,
      {
        method: 'POST',
        headers: {
          'Authorization': getAuthHeader(accessToken),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, dreamId }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to set #1 goal');
    }

    console.log('🎯 Dream Board API: Set #1 goal:', dreamId);

  } catch (error: any) {
    console.error('🎯 Dream Board API: Error setting #1 goal:', error);
    throw error;
  }
};