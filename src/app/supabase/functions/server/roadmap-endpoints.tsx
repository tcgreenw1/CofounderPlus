import { Hono } from 'npm:hono';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import * as kv from './kv_cache.tsx';

export function addRoadmapEndpoints(app: any, verifyUserAccess: any) {
  console.log('Adding roadmap endpoints...');

  // Get dashboard progress for a specific business (all incomplete tasks)
  app.get('/make-server-373d8b09/roadmap/:businessId/progress', async (c: any) => {
    console.log('Get dashboard roadmap progress endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      const businessId = c.req.param('businessId');

      if (!businessId) {
        return c.json({ error: 'Business ID is required' }, 400);
      }

      // Get all roadmap progress for this business
      let progressData: any[] = [];
      try {
        progressData = await kv.getByPrefix(`roadmap_progress:${user.id}:${businessId}:`);
      } catch (kvError: any) {
        console.error('KV getByPrefix error:', kvError);
        // Return empty data if KV fails instead of erroring
        progressData = [];
      }
      
      // Get all roadmap task data for this business
      let allRoadmaps: any[] = [];
      try {
        allRoadmaps = await kv.getByPrefix(`roadmap_data:${user.id}:${businessId}:`);
      } catch (kvError: any) {
        console.error('KV getByPrefix error for roadmaps:', kvError);
        allRoadmaps = [];
      }

      // Aggregate incomplete tasks across all roadmaps
      const allTasks: any[] = [];
      let totalCompleted = 0;
      let totalTasks = 0;

      for (const roadmapStr of allRoadmaps) {
        try {
          const roadmap = typeof roadmapStr === 'string' ? JSON.parse(roadmapStr) : roadmapStr;
          
          // Find the corresponding progress
          const progressStr = progressData.find((p: any) => {
            const progress = typeof p === 'string' ? JSON.parse(p) : p;
            return progress.roadmapId === roadmap.id;
          });
          
          const progress = progressStr ? (typeof progressStr === 'string' ? JSON.parse(progressStr) : progressStr) : null;
          const completedTaskIds = progress?.completedTasks || [];

          // Extract tasks from roadmap
          if (roadmap.milestones && Array.isArray(roadmap.milestones)) {
            for (const milestone of roadmap.milestones) {
              if (milestone.tasks && Array.isArray(milestone.tasks)) {
                for (const task of milestone.tasks) {
                  const isCompleted = completedTaskIds.includes(task.id);
                  totalTasks++;
                  if (isCompleted) {
                    totalCompleted++;
                  } else {
                    allTasks.push({
                      id: task.id,
                      title: task.title || task.name || 'Untitled Task',
                      department: milestone.department || roadmap.department || 'General',
                      completed: false
                    });
                  }
                }
              }
            }
          }
        } catch (parseError) {
          console.error('Error parsing roadmap data:', parseError);
        }
      }

      console.log(`Loaded ${allTasks.length} incomplete tasks from ${allRoadmaps.length} roadmaps for business ${businessId}`);
      
      return c.json({ 
        tasks: allTasks,
        completedCount: totalCompleted,
        totalCount: totalTasks
      });

    } catch (error: any) {
      console.error('Get dashboard roadmap progress error:', error);
      return c.json({ 
        tasks: [],
        completedCount: 0,
        totalCount: 0,
        error: `Error getting roadmap progress: ${error.message}` 
      }, 500);
    }
  });

  // Get user progress for a specific roadmap
  app.get('/make-server-373d8b09/roadmap/progress/:roadmapId', async (c: any) => {
    console.log('Get roadmap progress endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      const roadmapId = c.req.param('roadmapId');
      const businessId = c.req.query('businessId');

      if (!businessId) {
        return c.json({ error: 'Business ID is required' }, 400);
      }

      // Get progress data from KV store
      const progressKey = `roadmap_progress:${user.id}:${businessId}:${roadmapId}`;
      const progressStr = await kv.get(progressKey);

      if (!progressStr) {
        // Initialize default progress structure
        const defaultProgress = {
          roadmapId,
          businessId,
          userId: user.id,
          totalXP: 0,
          currentStreak: 0,
          longestStreak: 0,
          completedTasks: [],
          completedMilestones: [],
          currentRoadmap: roadmapId,
          lastActiveDate: new Date().toISOString(),
          achievements: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        await kv.set(progressKey, JSON.stringify(defaultProgress));
        console.log(`Initialized progress for roadmap ${roadmapId}`);
        return c.json(defaultProgress);
      }

      const progress = JSON.parse(progressStr);
      console.log(`Progress loaded for roadmap ${roadmapId}:`, progress);
      return c.json(progress);

    } catch (error: any) {
      console.error('Get roadmap progress error:', error);
      return c.json({ error: `Error getting roadmap progress: ${error.message}` }, 500);
    }
  });

  // Update user progress for a specific roadmap
  app.put('/make-server-373d8b09/roadmap/progress/:roadmapId', async (c: any) => {
    console.log('Update roadmap progress endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      const roadmapId = c.req.param('roadmapId');
      const businessId = c.req.query('businessId');

      if (!businessId) {
        return c.json({ error: 'Business ID is required' }, 400);
      }

      const progressData = await c.req.json();
      const progressKey = `roadmap_progress:${user.id}:${businessId}:${roadmapId}`;

      // Ensure required fields
      const updatedProgress = {
        ...progressData,
        roadmapId,
        businessId,
        userId: user.id,
        updated_at: new Date().toISOString()
      };

      await kv.set(progressKey, JSON.stringify(updatedProgress));
      console.log(`Progress updated for roadmap ${roadmapId}:`, updatedProgress);
      return c.json(updatedProgress);

    } catch (error: any) {
      console.error('Update roadmap progress error:', error);
      return c.json({ error: `Error updating roadmap progress: ${error.message}` }, 500);
    }
  });

  // Complete a task
  app.post('/make-server-373d8b09/roadmap/complete-task', async (c: any) => {
    console.log('Complete task endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      const { roadmapId, taskId, milestoneId, xpGained, businessId } = await c.req.json();

      if (!businessId || !roadmapId || !taskId) {
        return c.json({ error: 'Business ID, roadmap ID, and task ID are required' }, 400);
      }

      const progressKey = `roadmap_progress:${user.id}:${businessId}:${roadmapId}`;
      const progressStr = await kv.get(progressKey);
      const progress = progressStr ? JSON.parse(progressStr) : {
        roadmapId,
        businessId,
        userId: user.id,
        totalXP: 0,
        currentStreak: 0,
        longestStreak: 0,
        completedTasks: [],
        completedMilestones: [],
        currentRoadmap: roadmapId,
        lastActiveDate: new Date().toISOString(),
        achievements: [],
        created_at: new Date().toISOString()
      };

      // Add task to completed list if not already completed
      if (!progress.completedTasks.includes(taskId)) {
        progress.completedTasks.push(taskId);
        progress.totalXP += xpGained || 25;
        progress.lastActiveDate = new Date().toISOString();
        progress.updated_at = new Date().toISOString();

        // Update streak
        const today = new Date().toDateString();
        const lastActiveDate = new Date(progress.lastActiveDate).toDateString();
        if (lastActiveDate === today) {
          // Same day, no streak change
        } else {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          if (lastActiveDate === yesterday.toDateString()) {
            progress.currentStreak += 1;
          } else {
            progress.currentStreak = 1; // Reset streak
          }
        }

        if (progress.currentStreak > progress.longestStreak) {
          progress.longestStreak = progress.currentStreak;
        }

        await kv.set(progressKey, JSON.stringify(progress));

        // Log task completion
        const taskCompletionKey = `task_completion:${user.id}:${businessId}:${taskId}:${Date.now()}`;
        await kv.set(taskCompletionKey, JSON.stringify({
          userId: user.id,
          businessId,
          roadmapId,
          taskId,
          milestoneId,
          xpGained: xpGained || 25,
          completed_at: new Date().toISOString()
        }));

        console.log(`Task ${taskId} completed for user ${user.id} in roadmap ${roadmapId}`);
      }

      return c.json({ 
        success: true, 
        progress, 
        message: 'Task completed successfully' 
      });

    } catch (error: any) {
      console.error('Complete task error:', error);
      return c.json({ error: `Error completing task: ${error.message}` }, 500);
    }
  });

  // Complete a milestone
  app.post('/make-server-373d8b09/roadmap/complete-milestone', async (c: any) => {
    console.log('Complete milestone endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      const { roadmapId, milestoneId, xpGained, businessId } = await c.req.json();

      if (!businessId || !roadmapId || !milestoneId) {
        return c.json({ error: 'Business ID, roadmap ID, and milestone ID are required' }, 400);
      }

      const progressKey = `roadmap_progress:${user.id}:${businessId}:${roadmapId}`;
      const progressStr = await kv.get(progressKey);
      const progress = progressStr ? JSON.parse(progressStr) : {
        roadmapId,
        businessId,
        userId: user.id,
        totalXP: 0,
        currentStreak: 0,
        longestStreak: 0,
        completedTasks: [],
        completedMilestones: [],
        currentRoadmap: roadmapId,
        lastActiveDate: new Date().toISOString(),
        achievements: [],
        created_at: new Date().toISOString()
      };

      // Add milestone to completed list if not already completed
      if (!progress.completedMilestones.includes(milestoneId)) {
        progress.completedMilestones.push(milestoneId);
        progress.totalXP += xpGained || 200;
        progress.lastActiveDate = new Date().toISOString();
        progress.updated_at = new Date().toISOString();

        // Add achievement
        progress.achievements.push({
          id: `milestone-${milestoneId}-${Date.now()}`,
          type: 'milestone_completed',
          title: `Milestone Completed`,
          description: `Completed milestone ${milestoneId}`,
          earned_at: new Date().toISOString(),
          xp_bonus: xpGained || 200
        });

        await kv.set(progressKey, JSON.stringify(progress));

        // Log milestone completion
        const milestoneCompletionKey = `milestone_completion:${user.id}:${businessId}:${milestoneId}:${Date.now()}`;
        await kv.set(milestoneCompletionKey, JSON.stringify({
          userId: user.id,
          businessId,
          roadmapId,
          milestoneId,
          xpGained: xpGained || 200,
          completed_at: new Date().toISOString()
        }));

        console.log(`Milestone ${milestoneId} completed for user ${user.id} in roadmap ${roadmapId}`);
      }

      return c.json({ 
        success: true, 
        progress, 
        message: 'Milestone completed successfully' 
      });

    } catch (error: any) {
      console.error('Complete milestone error:', error);
      return c.json({ error: `Error completing milestone: ${error.message}` }, 500);
    }
  });

  // Get all roadmap data for a business (progress across all roadmaps)
  app.get('/make-server-373d8b09/roadmap/business-progress', async (c: any) => {
    console.log('Get business roadmap progress endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      const businessId = c.req.query('businessId');

      if (!businessId) {
        return c.json({ error: 'Business ID is required' }, 400);
      }

      // Get all roadmap progress for this business
      const progressData = await kv.getByPrefix(`roadmap_progress:${user.id}:${businessId}:`);
      
      console.log(`Loaded ${progressData?.length || 0} roadmap progress records for business ${businessId}`);
      return c.json({ progressData: progressData || [] });

    } catch (error: any) {
      console.error('Get business roadmap progress error:', error);
      return c.json({ error: `Error getting business roadmap progress: ${error.message}` }, 500);
    }
  });

  // Undo task completion (for the 10-second undo feature)
  app.post('/make-server-373d8b09/roadmap/undo-task', async (c: any) => {
    console.log('Undo task completion endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      const { roadmapId, taskId, xpToRemove, businessId } = await c.req.json();

      if (!businessId || !roadmapId || !taskId) {
        return c.json({ error: 'Business ID, roadmap ID, and task ID are required' }, 400);
      }

      const progressKey = `roadmap_progress:${user.id}:${businessId}:${roadmapId}`;
      const progressStr = await kv.get(progressKey);

      if (!progressStr) {
        return c.json({ error: 'Progress not found' }, 404);
      }

      const progress = JSON.parse(progressStr);

      // Remove task from completed list
      progress.completedTasks = progress.completedTasks.filter((id: string) => id !== taskId);
      progress.totalXP = Math.max(0, progress.totalXP - (xpToRemove || 25));
      progress.updated_at = new Date().toISOString();

      await kv.set(progressKey, JSON.stringify(progress));

      console.log(`Task ${taskId} undone for user ${user.id} in roadmap ${roadmapId}`);
      return c.json({ 
        success: true, 
        progress, 
        message: 'Task completion undone successfully' 
      });

    } catch (error: any) {
      console.error('Undo task error:', error);
      return c.json({ error: `Error undoing task completion: ${error.message}` }, 500);
    }
  });

  // Save proof/evidence for a task
  app.post('/make-server-373d8b09/roadmap/save-proof', async (c: any) => {
    console.log('Save proof endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      const { roadmapId, taskId, milestoneId, proofData, businessId } = await c.req.json();

      if (!businessId || !roadmapId || !taskId || !proofData) {
        return c.json({ error: 'Business ID, roadmap ID, task ID, and proof data are required' }, 400);
      }

      const proofKey = `proof:${user.id}:${businessId}:${taskId}:${Date.now()}`;
      const proof = {
        userId: user.id,
        businessId,
        roadmapId,
        taskId,
        milestoneId,
        ...proofData,
        created_at: new Date().toISOString()
      };

      await kv.set(proofKey, JSON.stringify(proof));

      console.log(`Proof saved for task ${taskId} by user ${user.id}`);
      return c.json({ 
        success: true, 
        proof, 
        message: 'Proof saved successfully' 
      });

    } catch (error: any) {
      console.error('Save proof error:', error);
      return c.json({ error: `Error saving proof: ${error.message}` }, 500);
    }
  });

  // Get proof/evidence for a task
  app.get('/make-server-373d8b09/roadmap/proof/:taskId', async (c: any) => {
    console.log('Get proof endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      const taskId = c.req.param('taskId');
      const businessId = c.req.query('businessId');

      if (!businessId) {
        return c.json({ error: 'Business ID is required' }, 400);
      }

      // Get all proof for this task
      const proofData = await kv.getByPrefix(`proof:${user.id}:${businessId}:${taskId}:`);
      
      console.log(`Loaded ${proofData?.length || 0} proof records for task ${taskId}`);
      return c.json({ proofData: proofData || [] });

    } catch (error: any) {
      console.error('Get proof error:', error);
      return c.json({ error: `Error getting proof: ${error.message}` }, 500);
    }
  });

  // Save focus timer session
  app.post('/make-server-373d8b09/roadmap/focus-session', async (c: any) => {
    console.log('Save focus session endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      const { roadmapId, taskId, duration, businessId } = await c.req.json();

      if (!businessId || !roadmapId || !duration) {
        return c.json({ error: 'Business ID, roadmap ID, and duration are required' }, 400);
      }

      const sessionKey = `focus_session:${user.id}:${businessId}:${Date.now()}`;
      const session = {
        userId: user.id,
        businessId,
        roadmapId,
        taskId,
        duration,
        completed_at: new Date().toISOString()
      };

      await kv.set(sessionKey, JSON.stringify(session));

      console.log(`Focus session saved for user ${user.id}: ${duration} seconds`);
      return c.json({ 
        success: true, 
        session, 
        message: 'Focus session saved successfully' 
      });

    } catch (error: any) {
      console.error('Save focus session error:', error);
      return c.json({ error: `Error saving focus session: ${error.message}` }, 500);
    }
  });

  // Get roadmap analytics/stats
  app.get('/make-server-373d8b09/roadmap/analytics', async (c: any) => {
    console.log('Get roadmap analytics endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      const businessId = c.req.query('businessId');

      if (!businessId) {
        return c.json({ error: 'Business ID is required' }, 400);
      }

      // Get all progress data
      const progressData = await kv.getByPrefix(`roadmap_progress:${user.id}:${businessId}:`);
      const taskCompletions = await kv.getByPrefix(`task_completion:${user.id}:${businessId}:`);
      const milestoneCompletions = await kv.getByPrefix(`milestone_completion:${user.id}:${businessId}:`);
      const focusSessions = await kv.getByPrefix(`focus_session:${user.id}:${businessId}:`);

      // Calculate analytics
      const totalXP = progressData?.reduce((sum: number, progressStr: string) => {
        const progress = JSON.parse(progressStr);
        return sum + (progress.totalXP || 0);
      }, 0) || 0;
      const totalTasks = progressData?.reduce((sum: number, progressStr: string) => {
        const progress = JSON.parse(progressStr);
        return sum + (progress.completedTasks?.length || 0);
      }, 0) || 0;
      const totalMilestones = progressData?.reduce((sum: number, progressStr: string) => {
        const progress = JSON.parse(progressStr);
        return sum + (progress.completedMilestones?.length || 0);
      }, 0) || 0;
      const totalFocusTime = focusSessions?.reduce((sum: number, sessionStr: string) => {
        const session = JSON.parse(sessionStr);
        return sum + (session.duration || 0);
      }, 0) || 0;

      const analytics = {
        totalXP,
        totalTasks,
        totalMilestones,
        totalFocusTime,
        activeRoadmaps: progressData?.length || 0,
        recentActivity: {
          tasks: taskCompletions?.slice(-10) || [],
          milestones: milestoneCompletions?.slice(-5) || [],
          focusSessions: focusSessions?.slice(-10) || []
        }
      };

      console.log(`Analytics loaded for business ${businessId}:`, analytics);
      return c.json(analytics);

    } catch (error: any) {
      console.error('Get roadmap analytics error:', error);
      return c.json({ error: `Error getting roadmap analytics: ${error.message}` }, 500);
    }
  });

  // ============================================================================
  // NEW: ROADMAP STRUCTURE ENDPOINTS
  // ============================================================================

  // Get full roadmap with branches and nodes
  app.get('/make-server-373d8b09/roadmap/structure/:roadmapId', async (c: any) => {
    console.log('Get roadmap structure endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      const roadmapId = c.req.param('roadmapId');
      const businessId = c.req.query('businessId');

      if (!businessId) {
        return c.json({ error: 'Business ID is required' }, 400);
      }

      const roadmapKey = `roadmap_structure:${user.id}:${businessId}:${roadmapId}`;
      const roadmapStr = await kv.get(roadmapKey);

      if (!roadmapStr) {
        return c.json({ error: 'Roadmap not found' }, 404);
      }

      const roadmap = JSON.parse(roadmapStr);
      console.log(`Roadmap structure loaded for ${roadmapId}`);
      return c.json(roadmap);

    } catch (error: any) {
      console.error('Get roadmap structure error:', error);
      return c.json({ error: `Error getting roadmap structure: ${error.message}` }, 500);
    }
  });

  // Save/update full roadmap structure
  app.put('/make-server-373d8b09/roadmap/structure/:roadmapId', async (c: any) => {
    console.log('Update roadmap structure endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      const roadmapId = c.req.param('roadmapId');
      const businessId = c.req.query('businessId');

      if (!businessId) {
        return c.json({ error: 'Business ID is required' }, 400);
      }

      const roadmapData = await c.req.json();
      const roadmapKey = `roadmap_structure:${user.id}:${businessId}:${roadmapId}`;

      const updatedRoadmap = {
        ...roadmapData,
        id: roadmapId,
        businessId,
        userId: user.id,
        updatedAt: new Date().toISOString()
      };

      await kv.set(roadmapKey, JSON.stringify(updatedRoadmap));
      console.log(`Roadmap structure updated for ${roadmapId}`);
      return c.json(updatedRoadmap);

    } catch (error: any) {
      console.error('Update roadmap structure error:', error);
      return c.json({ error: `Error updating roadmap structure: ${error.message}` }, 500);
    }
  });

  // Update a specific node
  app.patch('/make-server-373d8b09/roadmap/node/:roadmapId/:nodeId', async (c: any) => {
    console.log('Update node endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      const roadmapId = c.req.param('roadmapId');
      const nodeId = c.req.param('nodeId');
      const businessId = c.req.query('businessId');

      if (!businessId) {
        return c.json({ error: 'Business ID is required' }, 400);
      }

      const nodeUpdates = await c.req.json();
      const roadmapKey = `roadmap_structure:${user.id}:${businessId}:${roadmapId}`;
      const roadmapStr = await kv.get(roadmapKey);

      if (!roadmapStr) {
        return c.json({ error: 'Roadmap not found' }, 404);
      }

      const roadmap = JSON.parse(roadmapStr);
      
      // Find and update the node
      let nodeFound = false;
      for (const branch of roadmap.branches) {
        const nodeIndex = branch.nodes.findIndex((n: any) => n.id === nodeId);
        if (nodeIndex !== -1) {
          branch.nodes[nodeIndex] = {
            ...branch.nodes[nodeIndex],
            ...nodeUpdates,
            updatedAt: new Date().toISOString()
          };
          nodeFound = true;
          break;
        }
      }

      if (!nodeFound) {
        return c.json({ error: 'Node not found' }, 404);
      }

      roadmap.updatedAt = new Date().toISOString();
      await kv.set(roadmapKey, JSON.stringify(roadmap));

      console.log(`Node ${nodeId} updated in roadmap ${roadmapId}`);
      return c.json({ success: true, roadmap });

    } catch (error: any) {
      console.error('Update node error:', error);
      return c.json({ error: `Error updating node: ${error.message}` }, 500);
    }
  });

  // ============================================================================
  // AGI METADATA ENDPOINTS
  // ============================================================================

  // Get AGI metadata for a roadmap
  app.get('/make-server-373d8b09/roadmap/agi/:roadmapId', async (c: any) => {
    console.log('Get AGI metadata endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      const roadmapId = c.req.param('roadmapId');
      const businessId = c.req.query('businessId');

      if (!businessId) {
        return c.json({ error: 'Business ID is required' }, 400);
      }

      const agiKey = `roadmap_agi:${user.id}:${businessId}:${roadmapId}`;
      const agiStr = await kv.get(agiKey);

      if (!agiStr) {
        // Return default AGI metadata
        const defaultAGI = {
          roadmapId,
          businessId,
          changeLogs: [],
          recommendations: [],
          risks: [],
          branchLocks: {},
          masterToggle: false
        };
        return c.json(defaultAGI);
      }

      const agiMetadata = JSON.parse(agiStr);
      console.log(`AGI metadata loaded for ${roadmapId}`);
      return c.json(agiMetadata);

    } catch (error: any) {
      console.error('Get AGI metadata error:', error);
      return c.json({ error: `Error getting AGI metadata: ${error.message}` }, 500);
    }
  });

  // Update AGI metadata
  app.put('/make-server-373d8b09/roadmap/agi/:roadmapId', async (c: any) => {
    console.log('Update AGI metadata endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      const roadmapId = c.req.param('roadmapId');
      const businessId = c.req.query('businessId');

      if (!businessId) {
        return c.json({ error: 'Business ID is required' }, 400);
      }

      const agiData = await c.req.json();
      const agiKey = `roadmap_agi:${user.id}:${businessId}:${roadmapId}`;

      const updatedAGI = {
        ...agiData,
        roadmapId,
        businessId,
        lastModified: new Date().toISOString()
      };

      await kv.set(agiKey, JSON.stringify(updatedAGI));
      console.log(`AGI metadata updated for ${roadmapId}`);
      return c.json(updatedAGI);

    } catch (error: any) {
      console.error('Update AGI metadata error:', error);
      return c.json({ error: `Error updating AGI metadata: ${error.message}` }, 500);
    }
  });

  // ============================================================================
  // MASTERY ENDPOINTS
  // ============================================================================

  // Get mastery data
  app.get('/make-server-373d8b09/roadmap/mastery/:roadmapId', async (c: any) => {
    console.log('Get mastery data endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      const roadmapId = c.req.param('roadmapId');
      const businessId = c.req.query('businessId');

      if (!businessId) {
        return c.json({ error: 'Business ID is required' }, 400);
      }

      const masteryKey = `roadmap_mastery:${user.id}:${businessId}:${roadmapId}`;
      const masteryStr = await kv.get(masteryKey);

      if (!masteryStr) {
        // Return default mastery data
        const defaultMastery = {
          roadmapId,
          businessId,
          userId: user.id,
          totalXP: 0,
          currentLevel: 1,
          levelProgress: 0,
          maxXPForLevel: 1000,
          domains: [
            { domain: 'Product', level: 0, xp: 0, color: '#6C5CE7' },
            { domain: 'Marketing', level: 0, xp: 0, color: '#27D17C' },
            { domain: 'Sales', level: 0, xp: 0, color: '#F2C94C' },
            { domain: 'Finance', level: 0, xp: 0, color: '#2F80FF' },
            { domain: 'Ops', level: 0, xp: 0, color: '#FF6B35' },
            { domain: 'HR', level: 0, xp: 0, color: '#EB5757' }
          ],
          recentGains: [],
          badges: [],
          totalBadges: 0,
          unlockedBadges: 0,
          lastUpdated: new Date().toISOString()
        };
        await kv.set(masteryKey, JSON.stringify(defaultMastery));
        return c.json(defaultMastery);
      }

      const masteryData = JSON.parse(masteryStr);
      console.log(`Mastery data loaded for ${roadmapId}`);
      return c.json(masteryData);

    } catch (error: any) {
      console.error('Get mastery data error:', error);
      return c.json({ error: `Error getting mastery data: ${error.message}` }, 500);
    }
  });

  // Update mastery data
  app.put('/make-server-373d8b09/roadmap/mastery/:roadmapId', async (c: any) => {
    console.log('Update mastery data endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      const roadmapId = c.req.param('roadmapId');
      const businessId = c.req.query('businessId');

      if (!businessId) {
        return c.json({ error: 'Business ID is required' }, 400);
      }

      const masteryData = await c.req.json();
      const masteryKey = `roadmap_mastery:${user.id}:${businessId}:${roadmapId}`;

      const updatedMastery = {
        ...masteryData,
        roadmapId,
        businessId,
        userId: user.id,
        lastUpdated: new Date().toISOString()
      };

      await kv.set(masteryKey, JSON.stringify(updatedMastery));
      console.log(`Mastery data updated for ${roadmapId}`);
      return c.json(updatedMastery);

    } catch (error: any) {
      console.error('Update mastery data error:', error);
      return c.json({ error: `Error updating mastery data: ${error.message}` }, 500);
    }
  });

  // ============================================================================
  // QUICK WINS ENDPOINTS
  // ============================================================================

  // Get active quick wins session
  app.get('/make-server-373d8b09/roadmap/quick-wins/:roadmapId', async (c: any) => {
    console.log('Get quick wins session endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      const roadmapId = c.req.param('roadmapId');
      const businessId = c.req.query('businessId');

      if (!businessId) {
        return c.json({ error: 'Business ID is required' }, 400);
      }

      const quickWinsKey = `roadmap_quick_wins:${user.id}:${businessId}:${roadmapId}`;
      const quickWinsStr = await kv.get(quickWinsKey);

      if (!quickWinsStr) {
        return c.json({ error: 'No active quick wins session' }, 404);
      }

      const quickWinsSession = JSON.parse(quickWinsStr);
      console.log(`Quick wins session loaded for ${roadmapId}`);
      return c.json(quickWinsSession);

    } catch (error: any) {
      console.error('Get quick wins session error:', error);
      return c.json({ error: `Error getting quick wins session: ${error.message}` }, 500);
    }
  });

  // Create/update quick wins session
  app.put('/make-server-373d8b09/roadmap/quick-wins/:roadmapId', async (c: any) => {
    console.log('Update quick wins session endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      const roadmapId = c.req.param('roadmapId');
      const businessId = c.req.query('businessId');

      if (!businessId) {
        return c.json({ error: 'Business ID is required' }, 400);
      }

      const sessionData = await c.req.json();
      const quickWinsKey = `roadmap_quick_wins:${user.id}:${businessId}:${roadmapId}`;

      const updatedSession = {
        ...sessionData,
        roadmapId,
        businessId,
        userId: user.id
      };

      await kv.set(quickWinsKey, JSON.stringify(updatedSession));
      console.log(`Quick wins session updated for ${roadmapId}`);
      return c.json(updatedSession);

    } catch (error: any) {
      console.error('Update quick wins session error:', error);
      return c.json({ error: `Error updating quick wins session: ${error.message}` }, 500);
    }
  });

  // Complete a quick win
  app.post('/make-server-373d8b09/roadmap/quick-wins/:roadmapId/complete', async (c: any) => {
    console.log('Complete quick win endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      const roadmapId = c.req.param('roadmapId');
      const businessId = c.req.query('businessId');

      if (!businessId) {
        return c.json({ error: 'Business ID is required' }, 400);
      }

      const { quickWinId, xpGained } = await c.req.json();
      const quickWinsKey = `roadmap_quick_wins:${user.id}:${businessId}:${roadmapId}`;
      const quickWinsStr = await kv.get(quickWinsKey);

      if (!quickWinsStr) {
        return c.json({ error: 'No active quick wins session' }, 404);
      }

      const session = JSON.parse(quickWinsStr);
      const quickWin = session.quickWins.find((qw: any) => qw.id === quickWinId);
      
      if (!quickWin) {
        return c.json({ error: 'Quick win not found' }, 404);
      }

      quickWin.completed = true;
      quickWin.completedAt = new Date().toISOString();
      session.completedWins = session.quickWins.filter((qw: any) => qw.completed).length;

      await kv.set(quickWinsKey, JSON.stringify(session));

      // Also update mastery XP
      const masteryKey = `roadmap_mastery:${user.id}:${businessId}:${roadmapId}`;
      const masteryStr = await kv.get(masteryKey);
      if (masteryStr) {
        const mastery = JSON.parse(masteryStr);
        mastery.totalXP += xpGained || quickWin.xpReward || 0;
        
        // Add to recent gains
        mastery.recentGains = mastery.recentGains || [];
        mastery.recentGains.unshift({
          id: `qw-${Date.now()}`,
          domain: quickWin.category,
          xpGained: xpGained || quickWin.xpReward,
          from: `Quick Win: ${quickWin.title}`,
          timestamp: new Date().toISOString()
        });
        mastery.recentGains = mastery.recentGains.slice(0, 10); // Keep last 10
        
        await kv.set(masteryKey, JSON.stringify(mastery));
      }

      console.log(`Quick win ${quickWinId} completed in roadmap ${roadmapId}`);
      return c.json({ success: true, session });

    } catch (error: any) {
      console.error('Complete quick win error:', error);
      return c.json({ error: `Error completing quick win: ${error.message}` }, 500);
    }
  });

  // ============================================================================
  // CUSTOM TASKS ENDPOINT (for AI-created tasks)
  // ============================================================================
  
  // Get custom roadmap tasks (created by AI functions)
  app.get('/make-server-373d8b09/roadmap/custom-tasks', async (c: any) => {
    console.log('Get custom roadmap tasks endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      const businessId = c.req.query('businessId');

      if (!businessId) {
        return c.json({ error: 'Business ID is required' }, 400);
      }

      // Get tasks from the simple roadmap structure (used by AI functions)
      const roadmapKey = `business:${user.id}:${businessId}:roadmap`;
      const roadmapData = await kv.get(roadmapKey);

      if (!roadmapData) {
        return c.json({ tasks: [], milestones: [] });
      }

      console.log(`Custom tasks loaded for business ${businessId}:`, roadmapData.tasks?.length || 0, 'tasks');
      return c.json({
        tasks: roadmapData.tasks || [],
        milestones: roadmapData.milestones || []
      });

    } catch (error: any) {
      console.error('Get custom tasks error:', error);
      return c.json({ error: `Error getting custom tasks: ${error.message}` }, 500);
    }
  });

  // ============================================================================
  // INTELLIGENT ROADMAP REFRESH WITH AUTO-COMPLETION
  // ============================================================================
  
  app.post('/make-server-373d8b09/roadmap/intelligent-refresh', async (c: any) => {
    console.log('🔄 Intelligent Roadmap Refresh endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      
      console.log('🔍 Verifying user access...');
      const user = await verifyUserAccess(accessToken);
      console.log(`✅ User verified: ${user.id}`);
      
      console.log('🔍 Parsing request body...');
      const { businessId, businessData, currentRoadmap: rawRoadmap } = await c.req.json();
      console.log(`📦 Request data: businessId=${businessId}, hasBusinessData=${!!businessData}, hasCurrentRoadmap=${!!rawRoadmap}`);

      if (!businessId) {
        console.error('❌ Missing businessId in request');
        return c.json({ error: 'Business ID is required' }, 400);
      }

      console.log(`🔄 Starting intelligent refresh for business ${businessId}`);

      // Convert roadmap structure if needed (branches/nodes -> departments/tasks for compatibility)
      let currentRoadmap = rawRoadmap;
      if (rawRoadmap?.branches) {
        console.log('🔄 Converting branches/nodes format to departments/tasks format for analysis');
        currentRoadmap = {
          id: rawRoadmap.id,
          detectedStage: rawRoadmap.currentChapter === 1 ? 'foundation' : rawRoadmap.currentChapter === 2 ? 'mvp' : rawRoadmap.currentChapter === 3 ? 'growth' : 'scale',
          customStageName: rawRoadmap.chapterTitle,
          departments: rawRoadmap.branches.map((branch: any) => ({
            id: branch.id,
            name: branch.label,
            icon: branch.icon,
            color: branch.color,
            tasks: branch.nodes.map((node: any) => ({
              id: node.id,
              title: node.title,
              description: node.description,
              priority: node.metadata?.priority || 'medium',
              timeline: node.timeEstimate || '1-2 weeks',
              cofounderAction: node.metadata?.cofounderAction || null,
              completed: node.state === 'completed',
              unlocked: node.aiInserted || false,
              autoCompleted: node.metadata?.autoCompleted || false,
              autoCompletedReason: node.metadata?.autoCompletedReason || ''
            }))
          }))
        };
        console.log(`✅ Converted ${rawRoadmap.branches.length} branches to departments`);
      }

      // Create "running" notification immediately
      const notificationId = `automation_notification:${user.id}:${businessId}:roadmap-refresh:${Date.now()}`;
      const runningNotification = {
        id: notificationId,
        type: 'roadmap_refresh',
        businessId,
        title: 'Roadmap Refresh in Progress',
        message: 'Analyzing your business progress and unlocking new tasks...',
        priority: 'normal',
        category: 'general',
        status: 'running',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      };
      
      await kv.set(notificationId, runningNotification);
      console.log(`📬 Created running notification: ${notificationId}`);

      // Process in the background (async without await in the response)
      (async () => {
        try {
          // Load ALL department data to understand progress comprehensively
          console.log('📊 Loading comprehensive department data for analysis...');
          
          // HR Department Data
          const hrDocuments = await kv.get(`business:${user.id}:${businessId}:hr_documents`) || [];
          const hrJobs = await kv.get(`business:${user.id}:${businessId}:hr_jobs`) || [];
          const hrCandidates = await kv.get(`business:${user.id}:${businessId}:hr_candidates`) || [];
          const hrOnboarding = await kv.get(`business:${user.id}:${businessId}:hr_onboarding`) || [];
          
          // Marketing Department Data
          const marketingCampaigns = await kv.get(`business:${user.id}:${businessId}:marketing_campaigns`) || [];
          const marketingLeads = await kv.get(`business:${user.id}:${businessId}:marketing_leads`) || [];
          const marketingMetrics = await kv.get(`business:${user.id}:${businessId}:marketing_metrics`) || {};
          const marketingContent = await kv.get(`business:${user.id}:${businessId}:marketing_content`) || [];
          
          // Sales Department Data
          const salesPipeline = await kv.get(`business:${user.id}:${businessId}:sales_pipeline`) || [];
          const salesLeads = await kv.get(`business:${user.id}:${businessId}:sales_leads`) || [];
          const salesSequences = await kv.get(`business:${user.id}:${businessId}:sales_sequences`) || [];
          const salesMetrics = await kv.get(`business:${user.id}:${businessId}:sales_metrics`) || {};
          
          // Finance Department Data
          const financeTransactions = await kv.get(`business:${user.id}:${businessId}:finance_transactions`) || [];
          const financeMetrics = await kv.get(`business:${user.id}:${businessId}:finance_metrics`) || {};
          const financeBudgets = await kv.get(`business:${user.id}:${businessId}:finance_budgets`) || [];
          
          // Operations Department Data
          const operationsProjects = await kv.get(`business:${user.id}:${businessId}:operations_projects`) || [];
          const operationsTasks = await kv.get(`business:${user.id}:${businessId}:operations_tasks`) || [];
          const operationsMetrics = await kv.get(`business:${user.id}:${businessId}:operations_metrics`) || {};
          
          // Product/Development Data
          const productFeatures = await kv.get(`business:${user.id}:${businessId}:product_features`) || [];
          const productRoadmap = await kv.get(`business:${user.id}:${businessId}:product_roadmap`) || [];
          const developmentTasks = await kv.get(`business:${user.id}:${businessId}:development_tasks`) || [];

          // Compile department summaries for AI analysis
          const departmentContext = {
            hr: {
              documentsCount: hrDocuments.length,
              activeJobs: hrJobs.filter((j: any) => j.status === 'active').length,
              candidatesCount: hrCandidates.length,
              onboardingCount: hrOnboarding.length,
              hasEmployeeHandbook: hrDocuments.some((d: any) => d.type === 'handbook'),
              hasOfferLetters: hrDocuments.some((d: any) => d.type === 'offer_letter'),
              recentHires: hrCandidates.filter((c: any) => c.status === 'hired').length
            },
            marketing: {
              activeCampaigns: marketingCampaigns.filter((c: any) => c.status === 'active').length,
              totalCampaigns: marketingCampaigns.length,
              leadsGenerated: marketingLeads.length,
              contentPieces: marketingContent.length,
              metrics: marketingMetrics,
              hasWebsite: marketingCampaigns.some((c: any) => c.channel === 'website'),
              hasSocialMedia: marketingCampaigns.some((c: any) => c.channel === 'social'),
              hasEmailMarketing: marketingCampaigns.some((c: any) => c.channel === 'email')
            },
            sales: {
              totalDeals: salesPipeline.length,
              activeDeals: salesPipeline.filter((d: any) => d.stage !== 'closed-won' && d.stage !== 'closed-lost').length,
              wonDeals: salesPipeline.filter((d: any) => d.stage === 'closed-won').length,
              leadsCount: salesLeads.length,
              sequencesCount: salesSequences.length,
              metrics: salesMetrics,
              pipelineValue: salesPipeline.reduce((sum: number, d: any) => sum + (d.value || 0), 0)
            },
            finance: {
              transactionsCount: financeTransactions.length,
              revenue: financeTransactions.filter((t: any) => t.type === 'income').reduce((sum: number, t: any) => sum + (t.amount || 0), 0),
              expenses: financeTransactions.filter((t: any) => t.type === 'expense').reduce((sum: number, t: any) => sum + (t.amount || 0), 0),
              budgetsCount: financeBudgets.length,
              metrics: financeMetrics,
              hasBudget: financeBudgets.length > 0,
              profitMargin: financeMetrics.profitMargin || 0
            },
            operations: {
              activeProjects: operationsProjects.filter((p: any) => p.status === 'in-progress').length,
              completedProjects: operationsProjects.filter((p: any) => p.status === 'completed').length,
              totalTasks: operationsTasks.length,
              completedTasks: operationsTasks.filter((t: any) => t.completed).length,
              metrics: operationsMetrics
            },
            product: {
              featuresCount: productFeatures.length,
              completedFeatures: productFeatures.filter((f: any) => f.status === 'completed').length,
              roadmapItemsCount: productRoadmap.length,
              developmentTasksCount: developmentTasks.length
            }
          };

          console.log('📊 Department context loaded:', {
            hr: `${departmentContext.hr.documentsCount} docs, ${departmentContext.hr.activeJobs} active jobs`,
            marketing: `${departmentContext.marketing.totalCampaigns} campaigns, ${departmentContext.marketing.leadsGenerated} leads`,
            sales: `${departmentContext.sales.totalDeals} deals, ${departmentContext.sales.wonDeals} won`,
            finance: `$${departmentContext.finance.revenue} revenue, $${departmentContext.finance.expenses} expenses`,
            operations: `${departmentContext.operations.activeProjects} projects, ${departmentContext.operations.completedTasks}/${departmentContext.operations.totalTasks} tasks done`,
            product: `${departmentContext.product.featuresCount} features, ${departmentContext.product.completedFeatures} completed`
          });

          // Calculate task completion rates per department with full task details
          const departmentProgress = currentRoadmap?.departments?.map((dept: any) => ({
            name: dept.name,
            completed: dept.tasks.filter((t: any) => t.completed).length,
            total: dept.tasks.length,
            completionRate: dept.tasks.length > 0 ? (dept.tasks.filter((t: any) => t.completed).length / dept.tasks.length * 100).toFixed(1) : 0,
            tasks: dept.tasks.map((t: any) => ({
              id: t.id,
              title: t.title,
              completed: t.completed,
              description: t.description
            }))
          })) || [];

          // Build comprehensive prompt for GPT-4o
          const prompt = `You are an expert business strategist and Cofounder AI analyzing a business's progress across all departments.

BUSINESS CONTEXT:
- Business Name: ${businessData?.name || 'Unknown'}
- Industry: ${businessData?.industry || 'Not specified'}
- Stage: ${businessData?.stage || 'Not specified'}
- Current Detected Stage: ${currentRoadmap?.detectedStage || 'foundation'}

COMPREHENSIVE DEPARTMENT DATA & ACTIVITY:

HR Department:
- Total Documents: ${departmentContext.hr.documentsCount}
- Active Job Postings: ${departmentContext.hr.activeJobs}
- Candidates in Pipeline: ${departmentContext.hr.candidatesCount}
- Recent Hires: ${departmentContext.hr.recentHires}
- Has Employee Handbook: ${departmentContext.hr.hasEmployeeHandbook ? 'Yes' : 'No'}
- Has Offer Letter Templates: ${departmentContext.hr.hasOfferLetters ? 'Yes' : 'No'}

Marketing Department:
- Total Campaigns: ${departmentContext.marketing.totalCampaigns}
- Active Campaigns: ${departmentContext.marketing.activeCampaigns}
- Leads Generated: ${departmentContext.marketing.leadsGenerated}
- Content Pieces Created: ${departmentContext.marketing.contentPieces}
- Has Website Presence: ${departmentContext.marketing.hasWebsite ? 'Yes' : 'No'}
- Has Social Media: ${departmentContext.marketing.hasSocialMedia ? 'Yes' : 'No'}
- Has Email Marketing: ${departmentContext.marketing.hasEmailMarketing ? 'Yes' : 'No'}

Sales Department:
- Total Deals: ${departmentContext.sales.totalDeals}
- Active Deals: ${departmentContext.sales.activeDeals}
- Won Deals: ${departmentContext.sales.wonDeals}
- Leads in CRM: ${departmentContext.sales.leadsCount}
- Email Sequences: ${departmentContext.sales.sequencesCount}
- Pipeline Value: $${departmentContext.sales.pipelineValue}

Finance Department:
- Total Revenue: $${departmentContext.finance.revenue}
- Total Expenses: $${departmentContext.finance.expenses}
- Net Profit: $${departmentContext.finance.revenue - departmentContext.finance.expenses}
- Transactions Tracked: ${departmentContext.finance.transactionsCount}
- Has Budget System: ${departmentContext.finance.hasBudget ? 'Yes' : 'No'}

Operations Department:
- Active Projects: ${departmentContext.operations.activeProjects}
- Completed Projects: ${departmentContext.operations.completedProjects}
- Tasks Completed: ${departmentContext.operations.completedTasks}/${departmentContext.operations.totalTasks}

Product/Development:
- Total Features: ${departmentContext.product.featuresCount}
- Completed Features: ${departmentContext.product.completedFeatures}
- Roadmap Items: ${departmentContext.product.roadmapItemsCount}
- Development Tasks: ${departmentContext.product.developmentTasksCount}

CURRENT ROADMAP TASKS (with completion status):
${departmentProgress.map((d: any) => `
${d.name} (${d.completed}/${d.total} tasks completed - ${d.completionRate}%)
${d.tasks.map((t: any) => `  - [${t.completed ? 'X' : ' '}] ${t.title}: ${t.description}`).join('\\n')}
`).join('\\n')}

YOUR TASK AS COFOUNDER AI:

You are analyzing the ENTIRE business across all departments. Your job is to:

1. COMPREHENSIVE ANALYSIS: Look at ALL department data to understand true business progress
   - Don't just look at task checkboxes - examine actual business activity
   - Consider cross-department dependencies (marketing generates leads → sales converts them)
   - Identify gaps where departments are lagging

2. INTELLIGENT AUTO-COMPLETION: Mark tasks complete if department data proves they're done
   - "Set up HR documentation" + hrDocuments.length > 0 = COMPLETE
   - "Launch first marketing campaign" + activeCampaigns > 0 = COMPLETE  
   - "Make first sale" + wonDeals > 0 = COMPLETE
   - "Create budget system" + hasBudget = true = COMPLETE
   - "Hire first team member" + recentHires > 0 = COMPLETE

3. STAGE PROGRESSION: Determine if ready for next business stage
   - Foundation → MVP: Basic operations, some early traction
   - MVP → Growth: Product validated, consistent revenue, processes in place
   - Growth → Scale: Strong revenue, team built, systems automated

4. CREATIVE STAGE NAMING: Name stages specifically for THEIR business
   - Not just "Foundation" - use "Laying the Groundwork" or "Building Your Base"
   - Not just "MVP" - use "Launching Your Vision" or "First Customer Wins"

5. TASK UNLOCKING & CREATION: Add tasks appropriate for their progress
   - Unlock when prerequisites met (e.g., "scale marketing" after "first campaign")
   - Add 3-7 tasks per department relevant to their stage
   - Clear title, specific description, realistic timeline, priority

6. CLEAR INSTRUCTIONS: Every task needs actionable steps and realistic timelines

RESPONSE FORMAT (JSON only, no markdown):
{
  "readyForNextStage": boolean,
  "currentStage": "foundation" | "mvp" | "growth" | "scale",
  "customStageName": "Creative, inspiring name for current stage",
  "stageReasoning": "3-4 sentences: (1) why at this stage (2) what accomplished (3) what needed to advance (4) specific gaps",
  "recommendedNextStage": "foundation" | "mvp" | "growth" | "scale",
  "nextStageName": "Creative name for next stage",
  "progressInsights": "2-3 sentences about business health and strongest/weakest departments",
  "autoCompletedTasks": [
    { "departmentName": "string", "taskTitle": "string", "reason": "Specific data proving completion" }
  ],
  "unlockedTasks": [
    { "departmentName": "string", "taskTitle": "string", "reason": "Why now relevant" }
  ],
  "departments": [
    {
      "id": "unique-id",
      "name": "HR" | "Marketing" | "Sales" | "Finance" | "Operations" | "Product",
      "icon": "users" | "megaphone" | "shopping-cart" | "dollar-sign" | "briefcase" | "code",
      "color": "#HEX",
      "departmentHealth": "healthy" | "needs-attention" | "critical",
      "healthReason": "1 sentence about department status",
      "tasks": [
        {
          "id": "unique-id",
          "title": "Specific, actionable task",
          "description": "Clear steps and expected outcome",
          "priority": "high" | "medium" | "low",
          "timeline": "1-2 weeks" | "2-4 weeks" | "1-2 months" | "2-3 months",
          "cofounderAction": "hr" | "marketing" | "sales" | null,
          "completed": boolean,
          "unlocked": boolean,
          "unlockedReason": "Why unlocked (if new)",
          "autoCompleted": boolean,
          "autoCompletedReason": "Data proving completion (if auto-completed)",
          "blockedBy": ["task-id"] or null,
          "blocks": ["task-id"] or null
        }
      ]
    }
  ]
}

CRITICAL RULES:
✅ AUTO-COMPLETE tasks with clear evidence
✅ Only unlock/add tasks appropriate for stage
✅ Preserve user's manual completions
✅ Be specific with timelines and instructions
✅ Name stages creatively for their business
✅ Analyze ALL departments holistically
✅ Return ONLY valid JSON, no markdown`;

          console.log('🤖 Calling GPT-4o for intelligent roadmap analysis with auto-completion...');

          const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
          if (!openaiApiKey) {
            throw new Error('OPENAI_API_KEY is not configured');
          }

          const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${openaiApiKey}`,
            },
            body: JSON.stringify({
              model: 'gpt-4o',
              messages: [
                {
                  role: 'system',
                  content: 'You are an expert business strategist who provides detailed, actionable roadmaps. Always respond with valid JSON only.'
                },
                {
                  role: 'user',
                  content: prompt
                }
              ],
              temperature: 0.7,
              max_tokens: 4000,
            }),
          });

          if (!openaiResponse.ok) {
            const error = await openaiResponse.text();
            throw new Error(`OpenAI API error: ${error}`);
          }

          const openaiData = await openaiResponse.json();
          
          // Clean the AI response - remove markdown code blocks if present
          let aiContent = openaiData.choices[0].message.content;
          if (aiContent.includes('```json')) {
            aiContent = aiContent.replace(/```json\s*/g, '').replace(/```\s*/g, '');
          } else if (aiContent.includes('```')) {
            aiContent = aiContent.replace(/```\s*/g, '');
          }
          
          const refreshedRoadmap = JSON.parse(aiContent.trim());

          console.log('✅ Intelligent refresh completed:', {
            readyForNextStage: refreshedRoadmap.readyForNextStage,
            currentStage: refreshedRoadmap.currentStage,
            customStageName: refreshedRoadmap.customStageName,
            departmentsCount: refreshedRoadmap.departments.length,
            newTasksUnlocked: refreshedRoadmap.departments.reduce((sum: number, d: any) => 
              sum + d.tasks.filter((t: any) => t.unlocked).length, 0
            )
          });

          // Count auto-completed tasks
          const autoCompletedCount = refreshedRoadmap.departments.reduce((sum: number, d: any) => 
            sum + d.tasks.filter((t: any) => t.autoCompleted === true).length, 0
          );

          // Save the refreshed roadmap in OLD FORMAT (for RoadmapPage.tsx)
          const currentRoadmapKey = `business:${businessId}:roadmap:current`;
          const roadmapData = {
            detectedStage: refreshedRoadmap.currentStage,
            customStageName: refreshedRoadmap.customStageName,
            stageReasoning: refreshedRoadmap.stageReasoning,
            readyForNextStage: refreshedRoadmap.readyForNextStage,
            recommendedNextStage: refreshedRoadmap.recommendedNextStage,
            nextStageName: refreshedRoadmap.nextStageName,
            departments: refreshedRoadmap.departments,
            businessId,
            userId: user.id,
            lastRefreshed: new Date().toISOString(),
          };

          await kv.set(currentRoadmapKey, roadmapData);

          // Also save to history
          const historyKey = `business:${businessId}:roadmap:refresh:${Date.now()}`;
          await kv.set(historyKey, roadmapData);

          // CRITICAL: Also save in NEW FORMAT (branches/nodes) for MobileRoadmapView
          // Convert departments -> branches and tasks -> nodes
          const roadmapId = currentRoadmap?.id || `roadmap-${businessId}`;
          const structureKey = `roadmap_structure:${user.id}:${businessId}:${roadmapId}`;
          
          const roadmapStructure = {
            id: roadmapId,
            title: `${businessData?.name || 'Business'} Roadmap`,
            description: refreshedRoadmap.stageReasoning,
            businessId,
            userId: user.id,
            currentChapter: refreshedRoadmap.currentStage === 'foundation' ? 1 : refreshedRoadmap.currentStage === 'mvp' ? 2 : refreshedRoadmap.currentStage === 'growth' ? 3 : 4,
            chapterTitle: refreshedRoadmap.customStageName,
            branches: refreshedRoadmap.departments.map((dept: any, index: number) => ({
              id: dept.id,
              label: dept.name,
              color: dept.color,
              icon: dept.icon,
              order: index,
              nodes: dept.tasks.map((task: any, taskIndex: number) => ({
                id: task.id,
                title: task.title,
                description: task.description,
                branchId: dept.id,
                xp: task.priority === 'high' ? 200 : task.priority === 'medium' ? 100 : 50,
                timeEstimate: task.timeline,
                state: task.completed ? 'completed' : 'available', // All tasks are always available, never locked
                tasks: [],
                progress: task.completed ? 100 : 0,
                aiRecommended: task.unlocked || false,
                aiReasoning: task.unlockedReason || task.autoCompletedReason || '',
                aiInserted: task.unlocked || false,
                aiModified: task.autoCompleted || false,
                completedAt: task.completed ? new Date().toISOString() : undefined,
                order: taskIndex,
                dependencies: task.blockedBy || [],
                metadata: {
                  autoCompleted: task.autoCompleted || false,
                  autoCompletedReason: task.autoCompletedReason || '',
                  cofounderAction: task.cofounderAction,
                  priority: task.priority
                }
              }))
            })),
            totalNodes: refreshedRoadmap.departments.reduce((sum: number, d: any) => sum + d.tasks.length, 0),
            completedNodes: refreshedRoadmap.departments.reduce((sum: number, d: any) => sum + d.tasks.filter((t: any) => t.completed).length, 0),
            progress: 0, // Will be calculated
            createdAt: currentRoadmap?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          // Calculate progress percentage
          roadmapStructure.progress = roadmapStructure.totalNodes > 0 
            ? Math.round((roadmapStructure.completedNodes / roadmapStructure.totalNodes) * 100) 
            : 0;

          await kv.set(structureKey, JSON.stringify(roadmapStructure));
          console.log(`✅ Saved roadmap in BOTH formats - OLD (departments/tasks) and NEW (branches/nodes)`);

          // Count unlocked tasks
          const unlockedCount = refreshedRoadmap.departments.reduce((sum: number, d: any) => 
            sum + d.tasks.filter((t: any) => t.unlocked).length, 0
          );

          // Calculate total altered tasks (both auto-completed and unlocked are considered alterations)
          const totalAlteredTasks = autoCompletedCount + unlockedCount;

          // Build detailed message
          let detailedMessage = '';
          if (refreshedRoadmap.readyForNextStage) {
            detailedMessage = `🎉 Congratulations! You're ready to advance to ${refreshedRoadmap.nextStageName}!\\n\\n`;
          }
          
          if (autoCompletedCount > 0) {
            detailedMessage += `✅ ${autoCompletedCount} task${autoCompletedCount > 1 ? 's' : ''} auto-completed based on your department progress\\n`;
          }
          
          if (unlockedCount > 0) {
            detailedMessage += `🔓 ${unlockedCount} new task${unlockedCount > 1 ? 's' : ''} unlocked across departments\\n`;
          }

          if (totalAlteredTasks > 0) {
            detailedMessage += `\\n💎 ${totalAlteredTasks * 5} credits deducted (5 per altered task)`;
          }
          
          if (refreshedRoadmap.progressInsights) {
            detailedMessage += `\\n\\n📊 ${refreshedRoadmap.progressInsights}`;
          }

          // Update notification to "completed" with results
          const completedNotification = {
            ...runningNotification,
            status: 'unread',
            title: refreshedRoadmap.readyForNextStage 
              ? `🎉 Ready for ${refreshedRoadmap.nextStageName}!`
              : 'Roadmap Refreshed Successfully',
            message: detailedMessage.trim() || `Roadmap analysis complete. Check your updated tasks.`,
            priority: refreshedRoadmap.readyForNextStage ? 'high' : 'normal',
            updatedAt: new Date().toISOString(),
            insights: {
              readyForNextStage: refreshedRoadmap.readyForNextStage,
              newTasksUnlocked: unlockedCount,
              autoCompletedCount,
              totalAlteredTasks, // Added for credit charging
              currentStageName: refreshedRoadmap.customStageName,
              nextStageName: refreshedRoadmap.nextStageName,
              progressInsights: refreshedRoadmap.progressInsights,
              autoCompletedTasks: refreshedRoadmap.autoCompletedTasks || [],
              unlockedTasks: refreshedRoadmap.unlockedTasks || [],
              departmentHealth: refreshedRoadmap.departments.map((d: any) => ({
                name: d.name,
                health: d.departmentHealth,
                reason: d.healthReason
              }))
            }
          };

          await kv.set(notificationId, completedNotification);
          console.log(`✅ Updated notification to completed: ${notificationId}`);

        } catch (error: any) {
          console.error('❌ Background refresh error:', error);
          
          // Update notification to error state
          const errorNotification = {
            ...runningNotification,
            status: 'unread',
            title: 'Roadmap Refresh Failed',
            message: `Failed to refresh roadmap: ${error.message}`,
            priority: 'high',
            updatedAt: new Date().toISOString()
          };

          await kv.set(notificationId, errorNotification);
          console.log(`❌ Updated notification to error: ${notificationId}`);
        }
      })();

      // Return immediately with notification ID
      return c.json({
        success: true,
        message: 'Roadmap refresh started in the background',
        notificationId
      });

    } catch (error: any) {
      console.error('❌ Intelligent Roadmap Refresh error:', error);
      console.error('Error stack:', error.stack);
      return c.json({ 
        error: `Failed to start roadmap refresh: ${error.message}`, 
        details: error.message,
        stack: error.stack 
      }, 500);
    }
  });

  console.log('Roadmap endpoints added successfully');
}