import { projectId } from './supabase/info';

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;
  totalActiveDays: number;
  lastAnimationDate?: string | null;
  shouldShowAnimation?: boolean;
}

export const streakApi = {
  // Get user's current streak
  async getStreak(userId: string, accessToken: string): Promise<StreakData> {
    const url = `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/streak/get`;
    console.log('🔥 StreakAPI: Fetching from:', url);
    
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('🔥 StreakAPI: Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔥 StreakAPI: Error response:', errorText);
        
        // Return fallback data instead of throwing
        console.warn('🔥 StreakAPI: Using fallback streak data');
        return {
          currentStreak: 0,
          longestStreak: 0,
          lastActivityDate: new Date().toISOString().split('T')[0],
          totalActiveDays: 0,
          lastAnimationDate: null,
          shouldShowAnimation: false
        };
      }

      const data = await response.json();
      console.log('🔥 StreakAPI: Data received:', data);
      return data;
    } catch (error: any) {
      // Network errors are expected when server is not deployed yet
      // Silently use fallback data instead of showing errors
      if (error?.name !== 'TypeError' || !error?.message?.includes('Failed to fetch')) {
        console.error('🔥 StreakAPI: Fetch error:', error);
      }
      
      // Return fallback data when server is unreachable
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: new Date().toISOString().split('T')[0],
        totalActiveDays: 0,
        lastAnimationDate: null,
        shouldShowAnimation: false
      };
    }
  },

  // Record activity and update streak
  async recordActivity(
    userId: string, 
    accessToken: string, 
    activityType: string
  ): Promise<StreakData> {
    const url = `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/streak/record`;
    console.log('🔥 StreakAPI: Recording activity to:', url);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ activityType })
      });

      console.log('🔥 StreakAPI: Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔥 StreakAPI: Error response:', errorText);
        throw new Error(`Failed to record activity: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('🔥 StreakAPI: Activity recorded:', data);
      return data;
    } catch (error: any) {
      console.error('🔥 StreakAPI: Record error:', error);
      throw error;
    }
  }
};