import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

// Singleton Supabase client instance
let supabaseInstance: ReturnType<typeof createClient> | null = null;

/**
 * Get or create the singleton Supabase client instance.
 * This prevents multiple GoTrueClient instances warning.
 */
export function getSupabaseClient() {
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      `https://${projectId}.supabase.co`,
      publicAnonKey
    );
  }
  return supabaseInstance;
}

// Export singleton instance as default
export const supabase = getSupabaseClient();
