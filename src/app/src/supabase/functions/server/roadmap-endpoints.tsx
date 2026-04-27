import { Hono } from 'npm:hono';
import * as kv from './kv_store.tsx';

export function addRoadmapEndpoints(app: any, verifyUserAccess: any) {
  console.log('Adding roadmap endpoints...');

  // Get user progress for a specific roadmap
  app.get('/make-server-373d8b09/roadmap/progress/:roadmapId', async (c: any) => {
    console.log('Get roadmap progress endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      const roadmapId = c.req.param('roadmapId');
      const businessId = c.req.query('businessId');

      if (!businessId) {
        return new Response('Business ID is required', { status: 400 });
      }

      // Get progress data from KV store
      const progressKey = `roadmap_progress:${user.id}:${businessId}:${roadmapId}`;
      const progress = await kv.get(progressKey);

      if (!progress) {
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

        await kv.set(progressKey, defaultProgress);
        console.log(`Initialized progress for roadmap ${roadmapId}`);
        return c.json(defaultProgress);
      }

      console.log(`Progress loaded for roadmap ${roadmapId}:`, progress);
      return c.json(progress);

    } catch (error) {
      console.error('Get roadmap progress error:', error);
      return new Response(`Error getting roadmap progress: ${error.message}`, { status: 500 });
    }
  });

  // Update user progress for a specific roadmap
  app.put('/make-server-ac1075a9/roadmap/progress/:roadmapId', async (c: any) => {
    console.log('Update roadmap progress endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      const roadmapId = c.req.param('roadmapId');
      const businessId = c.req.query('businessId');

      if (!businessId) {
        return new Response('Business ID is required', { status: 400 });
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

      await kv.set(progressKey, updatedProgress);
      console.log(`Progress updated for roadmap ${roadmapId}:`, updatedProgress);
      return c.json(updatedProgress);

    } catch (error) {
      console.error('Update roadmap progress error:', error);
      return new Response(`Error updating roadmap progress: ${error.message}`, { status: 500 });
    }
  });

  // Complete a task
  app.post('/make-server-ac1075a9/roadmap/complete-task', async (c: any) => {
    console.log('Complete task endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      const { roadmapId, taskId, milestoneId, xpGained, businessId } = await c.req.json();

      if (!businessId || !roadmapId || !taskId) {
        return new Response('Business ID, roadmap ID, and task ID are required', { status: 400 });
      }

      const progressKey = `roadmap_progress:${user.id}:${businessId}:${roadmapId}`;
      const progress = await kv.get(progressKey) || {
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

        await kv.set(progressKey, progress);

        // Log task completion
        const taskCompletionKey = `task_completion:${user.id}:${businessId}:${taskId}:${Date.now()}`;
        await kv.set(taskCompletionKey, {
          userId: user.id,
          businessId,
          roadmapId,
          taskId,
          milestoneId,
          xpGained: xpGained || 25,
          completed_at: new Date().toISOString()
        });

        console.log(`Task ${taskId} completed for user ${user.id} in roadmap ${roadmapId}`);
      }

      return c.json({ 
        success: true, 
        progress, 
        message: 'Task completed successfully' 
      });

    } catch (error) {
      console.error('Complete task error:', error);
      return new Response(`Error completing task: ${error.message}`, { status: 500 });
    }
  });

  // Complete a milestone
  app.post('/make-server-ac1075a9/roadmap/complete-milestone', async (c: any) => {
    console.log('Complete milestone endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      const { roadmapId, milestoneId, xpGained, businessId } = await c.req.json();

      if (!businessId || !roadmapId || !milestoneId) {
        return new Response('Business ID, roadmap ID, and milestone ID are required', { status: 400 });
      }

      const progressKey = `roadmap_progress:${user.id}:${businessId}:${roadmapId}`;
      const progress = await kv.get(progressKey) || {
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

        await kv.set(progressKey, progress);

        // Log milestone completion
        const milestoneCompletionKey = `milestone_completion:${user.id}:${businessId}:${milestoneId}:${Date.now()}`;
        await kv.set(milestoneCompletionKey, {
          userId: user.id,
          businessId,
          roadmapId,
          milestoneId,
          xpGained: xpGained || 200,
          completed_at: new Date().toISOString()
        });

        console.log(`Milestone ${milestoneId} completed for user ${user.id} in roadmap ${roadmapId}`);
      }

      return c.json({ 
        success: true, 
        progress, 
        message: 'Milestone completed successfully' 
      });

    } catch (error) {
      console.error('Complete milestone error:', error);
      return new Response(`Error completing milestone: ${error.message}`, { status: 500 });
    }
  });

  // Get all roadmap data for a business (progress across all roadmaps)
  app.get('/make-server-ac1075a9/roadmap/business-progress', async (c: any) => {
    console.log('Get business roadmap progress endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      const businessId = c.req.query('businessId');

      if (!businessId) {
        return new Response('Business ID is required', { status: 400 });
      }

      // Get all roadmap progress for this business
      const progressData = await kv.getByPrefix(`roadmap_progress:${user.id}:${businessId}:`);
      
      console.log(`Loaded ${progressData?.length || 0} roadmap progress records for business ${businessId}`);
      return c.json({ progressData: progressData || [] });

    } catch (error) {
      console.error('Get business roadmap progress error:', error);
      return new Response(`Error getting business roadmap progress: ${error.message}`, { status: 500 });
    }
  });

  // Undo task completion (for the 10-second undo feature)
  app.post('/make-server-ac1075a9/roadmap/undo-task', async (c: any) => {
    console.log('Undo task completion endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      const { roadmapId, taskId, xpToRemove, businessId } = await c.req.json();

      if (!businessId || !roadmapId || !taskId) {
        return new Response('Business ID, roadmap ID, and task ID are required', { status: 400 });
      }

      const progressKey = `roadmap_progress:${user.id}:${businessId}:${roadmapId}`;
      const progress = await kv.get(progressKey);

      if (!progress) {
        return new Response('Progress not found', { status: 404 });
      }

      // Remove task from completed list
      progress.completedTasks = progress.completedTasks.filter((id: string) => id !== taskId);
      progress.totalXP = Math.max(0, progress.totalXP - (xpToRemove || 25));
      progress.updated_at = new Date().toISOString();

      await kv.set(progressKey, progress);

      console.log(`Task ${taskId} undone for user ${user.id} in roadmap ${roadmapId}`);
      return c.json({ 
        success: true, 
        progress, 
        message: 'Task completion undone successfully' 
      });

    } catch (error) {
      console.error('Undo task error:', error);
      return new Response(`Error undoing task completion: ${error.message}`, { status: 500 });
    }
  });

  // Save proof/evidence for a task
  app.post('/make-server-ac1075a9/roadmap/save-proof', async (c: any) => {
    console.log('Save proof endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      const { roadmapId, taskId, milestoneId, proofData, businessId } = await c.req.json();

      if (!businessId || !roadmapId || !taskId || !proofData) {
        return new Response('Business ID, roadmap ID, task ID, and proof data are required', { status: 400 });
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

      await kv.set(proofKey, proof);

      console.log(`Proof saved for task ${taskId} by user ${user.id}`);
      return c.json({ 
        success: true, 
        proof, 
        message: 'Proof saved successfully' 
      });

    } catch (error) {
      console.error('Save proof error:', error);
      return new Response(`Error saving proof: ${error.message}`, { status: 500 });
    }
  });

  // Get proof/evidence for a task
  app.get('/make-server-ac1075a9/roadmap/proof/:taskId', async (c: any) => {
    console.log('Get proof endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      const taskId = c.req.param('taskId');
      const businessId = c.req.query('businessId');

      if (!businessId) {
        return new Response('Business ID is required', { status: 400 });
      }

      // Get all proof for this task
      const proofData = await kv.getByPrefix(`proof:${user.id}:${businessId}:${taskId}:`);
      
      console.log(`Loaded ${proofData?.length || 0} proof records for task ${taskId}`);
      return c.json({ proofData: proofData || [] });

    } catch (error) {
      console.error('Get proof error:', error);
      return new Response(`Error getting proof: ${error.message}`, { status: 500 });
    }
  });

  // Save focus timer session
  app.post('/make-server-ac1075a9/roadmap/focus-session', async (c: any) => {
    console.log('Save focus session endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      const { roadmapId, taskId, duration, businessId } = await c.req.json();

      if (!businessId || !roadmapId || !duration) {
        return new Response('Business ID, roadmap ID, and duration are required', { status: 400 });
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

      await kv.set(sessionKey, session);

      console.log(`Focus session saved for user ${user.id}: ${duration} seconds`);
      return c.json({ 
        success: true, 
        session, 
        message: 'Focus session saved successfully' 
      });

    } catch (error) {
      console.error('Save focus session error:', error);
      return new Response(`Error saving focus session: ${error.message}`, { status: 500 });
    }
  });

  // Get roadmap analytics/stats
  app.get('/make-server-ac1075a9/roadmap/analytics', async (c: any) => {
    console.log('Get roadmap analytics endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      const businessId = c.req.query('businessId');

      if (!businessId) {
        return new Response('Business ID is required', { status: 400 });
      }

      // Get all progress data
      const progressData = await kv.getByPrefix(`roadmap_progress:${user.id}:${businessId}:`);
      const taskCompletions = await kv.getByPrefix(`task_completion:${user.id}:${businessId}:`);
      const milestoneCompletions = await kv.getByPrefix(`milestone_completion:${user.id}:${businessId}:`);
      const focusSessions = await kv.getByPrefix(`focus_session:${user.id}:${businessId}:`);

      // Calculate analytics
      const totalXP = progressData?.reduce((sum: number, progress: any) => sum + (progress.totalXP || 0), 0) || 0;
      const totalTasks = progressData?.reduce((sum: number, progress: any) => sum + (progress.completedTasks?.length || 0), 0) || 0;
      const totalMilestones = progressData?.reduce((sum: number, progress: any) => sum + (progress.completedMilestones?.length || 0), 0) || 0;
      const totalFocusTime = focusSessions?.reduce((sum: number, session: any) => sum + (session.duration || 0), 0) || 0;

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

    } catch (error) {
      console.error('Get roadmap analytics error:', error);
      return new Response(`Error getting roadmap analytics: ${error.message}`, { status: 500 });
    }
  });

  console.log('✅ Roadmap endpoints added successfully');

  // AI-POWERED ROADMAP GENERATION
  app.post('/make-server-373d8b09/roadmap/ai-generate', async (c: any) => {
    console.log('🤖 AI Roadmap Generation endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      const { businessData, businessId } = await c.req.json();

      if (!businessId) {
        return c.json({ error: 'Business ID is required' }, 400);
      }

      console.log(`🤖 Generating roadmap for business ${businessId}...`);

      // Get business data from KV store
      const businessKey = `business:${businessId}`;
      const storedBusiness = await kv.get(businessKey);

      // Prepare business context for AI
      const businessContext = {
        name: businessData?.name || storedBusiness?.name || 'Your Business',
        industry: businessData?.industry || storedBusiness?.industry,
        stage: businessData?.stage || storedBusiness?.stage || 'idea',
        revenue: businessData?.revenue || storedBusiness?.revenue,
        teamSize: businessData?.teamSize || storedBusiness?.teamSize || 1,
        quizResults: businessData?.quizResults || storedBusiness?.quizResults,
        description: businessData?.description || storedBusiness?.description,
      };

      // AI System Prompt with Cofounder capabilities knowledge
      const systemPrompt = `You are a strategic business advisor that generates actionable roadmaps. Your job is to analyze the business and create specific, actionable tasks organized by department.

# BUSINESS STAGES:
- Foundation: Just starting, setting up basics (legal, banking, planning)
- MVP: Building first product/service, validating market fit
- Growth: Scaling operations, hiring team, expanding market
- Scale: Optimizing systems, expanding into new markets, building for exit

# DEPARTMENT STRUCTURE:
You must organize tasks into these departments:
- Strategy & Planning
- Legal & Compliance  
- Finance & Operations
- Marketing & Brand
- Sales & Revenue
- Product & Development
- HR & Team

# COFOUNDER AI CAPABILITIES:
When creating tasks, if a task can be automated by a Cofounder AI, add "cofounderAction" field with the department name:

**HR Cofounder** can help with:
- Writing job descriptions
- Creating employment contracts
- Onboarding documentation
- Interview question templates
- Employee handbook creation
- Performance review templates
- Team org chart planning

**Marketing Cofounder** can help with:
- Content strategy planning
- Social media post creation
- Email campaign drafting
- Brand messaging development
- Marketing campaign planning
- SEO content optimization
- Ad copy writing

**Sales Cofounder** can help with:
- Sales pitch development
- Email outreach templates
- Lead qualification criteria
- Sales process documentation
- Proposal templates
- Pricing strategy
- Customer persona development

# OUTPUT FORMAT:
Return a JSON object with this structure:
{
  "detectedStage": "foundation" | "mvp" | "growth" | "scale",
  "stageReasoning": "Brief explanation of why this stage",
  "departments": [
    {
      "id": "strategy",
      "name": "Strategy & Planning",
      "icon": "target",
      "color": "#4B00FF",
      "tasks": [
        {
          "id": "unique-task-id",
          "title": "Task title",
          "description": "What needs to be done",
          "priority": "high" | "medium" | "low",
          "timeline": "Week 1" | "Month 1" | "Quarter 1",
          "cofounderAction": "hr" | "marketing" | "sales" | null
        }
      ]
    }
  ]
}

# TASK CREATION RULES:
1. Create 3-5 tasks per department
2. Tasks should be specific and actionable
3. Prioritize based on stage (Foundation = basics first)
4. Include quick wins and long-term strategic tasks
5. If a Cofounder AI can help, mark it with cofounderAction
6. Be realistic about timelines based on team size and resources

Now analyze the business and generate the roadmap.`;

      // Call OpenAI API
      const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
      if (!openaiApiKey) {
        return c.json({ error: 'OpenAI API key not configured' }, 500);
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
            { role: 'system', content: systemPrompt },
            { 
              role: 'user', 
              content: `Generate a detailed roadmap for this business:\n\n${JSON.stringify(businessContext, null, 2)}\n\nAnalyze the stage and create actionable tasks for each department. Remember to mark tasks that Cofounder AI's can help with.`
            }
          ],
          temperature: 0.7,
          response_format: { type: "json_object" }
        }),
      });

      if (!openaiResponse.ok) {
        const error = await openaiResponse.text();
        console.error('❌ OpenAI API error:', error);
        return c.json({ error: 'Failed to generate roadmap' }, 500);
      }

      const openaiData = await openaiResponse.json();
      
      // Clean the AI response - remove markdown code blocks if present
      let aiContent = openaiData.choices[0].message.content;
      if (aiContent.includes('```json')) {
        aiContent = aiContent.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      } else if (aiContent.includes('```')) {
        aiContent = aiContent.replace(/```\s*/g, '');
      }
      
      const roadmapData = JSON.parse(aiContent.trim());

      console.log('✅ Roadmap generated:', roadmapData);

      // Save generated roadmap to KV store
      const roadmapKey = `business:${businessId}:roadmap:generated:${Date.now()}`;
      await kv.set(roadmapKey, {
        ...roadmapData,
        businessId,
        userId: user.id,
        createdAt: new Date().toISOString(),
      });

      // Also save as current roadmap
      const currentRoadmapKey = `business:${businessId}:roadmap:current`;
      await kv.set(currentRoadmapKey, {
        ...roadmapData,
        businessId,
        userId: user.id,
        createdAt: new Date().toISOString(),
      });

      return c.json({
        success: true,
        roadmap: roadmapData,
      });

    } catch (error: any) {
      console.error('❌ AI Roadmap Generation error:', error);
      return c.json({ 
        error: 'Failed to generate roadmap', 
        details: error.message 
      }, 500);
    }
  });

  // Get current roadmap for business
  app.get('/make-server-373d8b09/roadmap/current', async (c: any) => {
    console.log('Get current roadmap endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      const businessId = c.req.query('businessId');

      if (!businessId) {
        return c.json({ error: 'Business ID is required' }, 400);
      }

      const currentRoadmapKey = `business:${businessId}:roadmap:current`;
      const roadmap = await kv.get(currentRoadmapKey);

      if (!roadmap) {
        return c.json({ roadmap: null });
      }

      return c.json({ roadmap });

    } catch (error: any) {
      console.error('Get current roadmap error:', error);
      return c.json({ error: 'Failed to get roadmap' }, 500);
    }
  });

  // INTELLIGENT ROADMAP REFRESH - Comprehensive analysis with stage progression
  app.post('/make-server-373d8b09/roadmap/intelligent-refresh', async (c: any) => {
    console.log('🔄 Intelligent Roadmap Refresh endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      const { businessId, businessData, currentRoadmap } = await c.req.json();

      if (!businessId) {
        return c.json({ error: 'Business ID is required' }, 400);
      }

      console.log(`🔄 Starting intelligent refresh for business ${businessId}`);

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
          // Gather comprehensive business context
          const metricsKey = `business:${businessId}:metrics`;
          const tasksKey = `business:${businessId}:tasks`;
          const milestonesKey = `business:${businessId}:milestones`;
          
          const metrics = await kv.get(metricsKey) || {};
          const tasks = await kv.get(tasksKey) || [];
          const milestones = await kv.get(milestonesKey) || [];

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
          const prompt = `You are an expert business strategist analyzing a business's progress and determining their roadmap.

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
${d.name} (${d.completed}/${d.total} tasks completed - ${d.completionRate}%):
${d.tasks.map((t: any) => `  - [${t.completed ? 'X' : ' '}] ${t.title}: ${t.description}`).join('\\n')}
`).join('\\n')}

YOUR TASK:
1. Analyze the comprehensive department data above to understand ACTUAL business progress
2. For each existing task in the roadmap, determine if it's ACTUALLY COMPLETE based on the department data:
   - If task says "Set up HR documentation" and we have HR documents → mark completed: true
   - If task says "Launch first marketing campaign" and activeCampaigns > 0 → mark completed: true
   - If task says "Make first sale" and wonDeals > 0 → mark completed: true
   - If task says "Create budget" and hasBudget is true → mark completed: true
3. Determine if they're ready to progress to the next stage (foundation → mvp → growth → scale)
4. Unlock new tasks that are appropriate for their current stage and actual progress
5. Name each stage creatively based on their specific business (not just "Foundation", "MVP", etc.)
6. Provide clear, actionable instructions with expected completion timelines
7. Identify which tasks a Cofounder (AI assistant) can help with

RESPONSE FORMAT (JSON only):
{
  "readyForNextStage": boolean,
  "currentStage": "foundation" | "mvp" | "growth" | "scale",
  "customStageName": "Creative name for their current stage",
  "stageReasoning": "2-3 sentences explaining why they're at this stage and what they need to advance",
  "recommendedNextStage": "foundation" | "mvp" | "growth" | "scale",
  "nextStageName": "Creative name for the next stage",
  "autoCompletedCount": number (count of tasks you automatically marked complete),
  "departments": [
    {
      "id": "unique-id",
      "name": "Department Name",
      "icon": "target" | "gavel" | "dollar-sign" | "megaphone" | "shopping-cart" | "code" | "users" | "briefcase",
      "color": "#HEX",
      "tasks": [
        {
          "id": "unique-id",
          "title": "Task title",
          "description": "Clear description of what needs to be done",
          "priority": "high" | "medium" | "low",
          "timeline": "1-2 weeks" | "2-4 weeks" | "1-2 months" | etc.,
          "cofounderAction": "hr" | "marketing" | "sales" | null,
          "completed": true/false (IMPORTANT: Auto-mark as true if department data proves it's done),
          "unlocked": true,
          "unlockedReason": "Why this task is now unlocked based on their progress",
          "autoCompleted": true/false (set to true if you automatically marked it complete based on data)
        }
      ]
    }
  ]
}

CRITICAL AUTO-COMPLETION RULES:
- If department data shows the task is objectively complete, set "completed": true and "autoCompleted": true
- Be intelligent about matching tasks to data (e.g., "hire first employee" = recentHires > 0)
- Preserve user's manual completions (don't un-complete tasks they marked done)
- Only auto-complete tasks that have clear evidence in the department data
- For tasks without clear data indicators, leave them as-is unless unlocking new ones

IMPORTANT GUIDELINES:
- Each department should have 3-7 tasks
- Only mark tasks as "unlocked: true" if they're new or newly relevant
- Include the "unlockedReason" for all unlocked tasks
- Be specific with timelines (e.g., "1-2 weeks", not "soon")
- Only assign cofounderAction if an AI can genuinely help (HR for hiring, Marketing for campaigns, Sales for outreach)
- Make stage names inspiring and specific to their business
- Tasks should be concrete and measurable
- AUTO-COMPLETE tasks that the data proves are done!`;

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

          // Save the refreshed roadmap
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

          // Update notification to "completed" with results
          const completedNotification = {
            ...runningNotification,
            status: 'unread',
            title: refreshedRoadmap.readyForNextStage 
              ? `🎉 Ready for ${refreshedRoadmap.nextStageName}!`
              : 'Roadmap Refreshed Successfully',
            message: refreshedRoadmap.readyForNextStage
              ? `You're ready to advance! ${refreshedRoadmap.departments.reduce((sum: number, d: any) => sum + d.tasks.filter((t: any) => t.unlocked).length, 0)} new tasks unlocked${autoCompletedCount > 0 ? `, ${autoCompletedCount} tasks auto-completed` : ''}.`
              : `${refreshedRoadmap.departments.reduce((sum: number, d: any) => sum + d.tasks.filter((t: any) => t.unlocked).length, 0)} new tasks unlocked${autoCompletedCount > 0 ? `, ${autoCompletedCount} tasks auto-completed` : ''} based on your progress.`,
            priority: refreshedRoadmap.readyForNextStage ? 'high' : 'normal',
            updatedAt: new Date().toISOString(),
            insights: {
              readyForNextStage: refreshedRoadmap.readyForNextStage,
              newTasksUnlocked: refreshedRoadmap.departments.reduce((sum: number, d: any) => 
                sum + d.tasks.filter((t: any) => t.unlocked).length, 0
              ),
              autoCompletedCount,
              currentStageName: refreshedRoadmap.customStageName,
              nextStageName: refreshedRoadmap.nextStageName
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
      return c.json({ 
        error: 'Failed to start roadmap refresh', 
        details: error.message 
      }, 500);
    }
  });

  // ============================================================================
  // MASTERY ENDPOINTS
  // ============================================================================
}