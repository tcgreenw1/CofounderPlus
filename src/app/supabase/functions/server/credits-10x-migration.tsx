/**
 * Credits 10x Migration Script
 * 
 * This script multiplies all existing user credits by 10x
 * to match the new pricing model
 */

import { Hono } from 'npm:hono@4';
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as kv from './kv_cache.tsx';

const app = new Hono();

// POST /credits-10x-migration - Multiply all user credits by 10x
app.post('/make-server-373d8b09/credits-10x-migration', async (c) => {
  try {
    console.log('🚀 Starting 10x Credits Migration...');
    
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get all credit entries from KV store
    let allCreditKeys: any[] = [];
    try {
      allCreditKeys = await kv.getByPrefix('credits:');
      console.log(`📊 Migration: Found ${allCreditKeys.length} credit entries to check`);
    } catch (error: any) {
      console.error('❌ Migration: Failed to query credits:', error.message);
      return c.json({ 
        success: false, 
        error: 'Database timeout while querying credits',
        migratedCount: 0,
        skippedCount: 0
      }, 500);
    }
    
    let migratedCount = 0;
    let skippedCount = 0;
    const migrationLog: any[] = [];

    for (const creditValue of allCreditKeys) {
      try {
        // Parse the value to get user info
        const creditStr = typeof creditValue === 'string' ? creditValue : JSON.stringify(creditValue);
        
        // Extract userId from the key pattern
        // Since getByPrefix returns values, we need to scan for actual credit balances
        // This is a simplified approach - we'll iterate through all possible user credit keys
        
        // Get all users from auth (more reliable approach)
        const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
        
        if (usersError) {
          console.error('Error fetching users:', usersError);
          continue;
        }

        for (const authUser of users.users) {
          const userId = authUser.id;
          const creditKey = `credits:${userId}`;
          
          try {
            const currentCredits = await kv.get(creditKey);
            
            if (currentCredits !== null && currentCredits !== undefined) {
              const creditsNum = typeof currentCredits === 'number' ? currentCredits : parseInt(currentCredits);
              
              // Skip if already migrated (credits are very high)
              if (creditsNum > 10000) {
                console.log(`⏭️  Skipping user ${userId} - already has ${creditsNum} credits (likely already migrated)`);
                skippedCount++;
                continue;
              }
              
              // Multiply by 10
              const newCredits = creditsNum * 10;
              await kv.set(creditKey, newCredits);
              
              console.log(`✅ Migrated user ${userId}: ${creditsNum} → ${newCredits} credits`);
              
              migrationLog.push({
                userId,
                oldCredits: creditsNum,
                newCredits,
                timestamp: new Date().toISOString()
              });
              
              migratedCount++;
            }
          } catch (err) {
            console.error(`Error processing user ${userId}:`, err);
            skippedCount++;
          }
        }
        
        // Break after processing users - we don't need to continue the outer loop
        break;
      } catch (err) {
        console.error('Error in migration loop:', err);
        skippedCount++;
      }
    }

    console.log(`✅ Migration complete! Migrated: ${migratedCount}, Skipped: ${skippedCount}`);

    return c.json({
      success: true,
      migratedCount,
      skippedCount,
      migrationLog
    });

  } catch (error: any) {
    console.error('❌ Migration Error:', error);
    return c.json({ 
      error: error.message || 'Internal server error',
      details: error.toString()
    }, 500);
  }
});

export default app;