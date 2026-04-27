import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '../utils/supabase/client';
import { streakApi, StreakData } from '../utils/streakApi';
import StreakFlameAnimation from './StreakFlameAnimation';

interface StreakContextType {
  streakData: StreakData | null;
  recordActivity: (activityType: string) => Promise<void>;
  refreshStreak: () => Promise<void>;
  isLoading: boolean;
}

const StreakContext = createContext<StreakContextType | undefined>(undefined);

export function StreakProvider({ children }: { children: React.ReactNode }) {
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showFlame, setShowFlame] = useState(false);
  const [flameCount, setFlameCount] = useState(0);

  // Load streak on mount
  useEffect(() => {
    loadStreak();
  }, []);

  const loadStreak = async () => {
    try {
      console.log('🔥 StreakContext: Loading streak data...');
      
      // First check if there's a session at all
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!currentSession) {
        console.log('🔥 StreakContext: No session found, using default values');
        setStreakData({
          currentStreak: 0,
          longestStreak: 0,
          lastActivityDate: '',
          totalActiveDays: 0
        });
        setIsLoading(false);
        return;
      }
      
      // Try to refresh the session to get a fresh token
      let session = currentSession;
      try {
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
        if (!refreshError && refreshedSession) {
          session = refreshedSession;
          console.log('🔥 StreakContext: Session refreshed successfully');
        } else if (refreshError) {
          console.log('🔥 StreakContext: Could not refresh session, using current session:', refreshError.message);
        }
      } catch (refreshErr) {
        console.log('🔥 StreakContext: Refresh failed, continuing with current session');
      }
      
      if (!session?.user || !session?.access_token) {
        console.log('🔥 StreakContext: No valid session, using default values');
        setStreakData({
          currentStreak: 0,
          longestStreak: 0,
          lastActivityDate: '',
          totalActiveDays: 0
        });
        setIsLoading(false);
        return;
      }

      console.log('🔥 StreakContext: Fetching streak for user:', session.user.id);
      const data = await streakApi.getStreak(session.user.id, session.access_token);
      console.log('🔥 StreakContext: Streak data loaded:', data);
      setStreakData(data);
    } catch (error: any) {
      console.error('🔥 StreakContext: Failed to load streak:', error);
      console.error('🔥 StreakContext: Error details:', error.message);
      // Set default streak data on error
      setStreakData({
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: '',
        totalActiveDays: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshStreak = useCallback(async () => {
    await loadStreak();
  }, []);

  const recordActivity = useCallback(async (activityType: string) => {
    try {
      // First check if there's a session at all
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!currentSession) {
        console.log('🔥 StreakContext: No session for recording activity');
        return;
      }
      
      // Try to refresh the session to get a fresh token
      let session = currentSession;
      try {
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
        if (!refreshError && refreshedSession) {
          session = refreshedSession;
        } else if (refreshError) {
          console.log('🔥 StreakContext: Could not refresh on record, using current session');
        }
      } catch (refreshErr) {
        console.log('🔥 StreakContext: Refresh failed on record, using current session');
      }
      
      if (!session?.user || !session?.access_token) {
        console.error('🔥 StreakContext: No valid session for recording activity');
        return;
      }

      const data = await streakApi.recordActivity(session.user.id, session.access_token, activityType);
      
      setStreakData(data);

      // Show flame animation only if backend says we should (once per CST day)
      if (data.shouldShowAnimation && data.currentStreak > 0) {
        console.log('🔥 StreakContext: Showing animation for streak:', data.currentStreak);
        setFlameCount(data.currentStreak);
        setShowFlame(true);
      } else {
        console.log('🔥 StreakContext: Not showing animation (already shown today or no streak)');
      }
    } catch (error) {
      console.error('Failed to record activity:', error);
    }
  }, []);

  return (
    <StreakContext.Provider value={{ streakData, recordActivity, refreshStreak, isLoading }}>
      {children}
      {showFlame && (
        <StreakFlameAnimation 
          streakCount={flameCount} 
          onComplete={() => setShowFlame(false)} 
        />
      )}
    </StreakContext.Provider>
  );
}

export function useStreak() {
  const context = useContext(StreakContext);
  if (context === undefined) {
    throw new Error('useStreak must be used within a StreakProvider');
  }
  return context;
}