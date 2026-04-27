/**
 * CLAUDE MAKE ENDPOINTS
 * 
 * Claude AI integration for Cofounder Make - helps developers build and debug code
 * Uses Claude API with tool calling for file operations
 */

import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { createClient } from 'npm:@supabase/supabase-js';
import { CLAUDE_TOOLS, executeTool } from './claude-tools.tsx';
import * as kv from './kv_store.tsx';

const app = new Hono();

// Add CORS middleware
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600,
  credentials: true,
}));

// ============================================================================
// CLAUDE CONFIGURATION
// ============================================================================

const CLAUDE_CONFIG = {
  model: 'claude-sonnet-4-20250514',
  maxTokens: 4096,
  
  systemPrompt: `You are a Cofounder AI assistant helping developers build applications in Cofounder Make.

Your role:
- Help developers write, debug, and improve their code
- Use tools to read, write, and edit files in their repository
- Provide specific, actionable solutions to coding problems
- Suggest best practices and optimizations
- Understand React, TypeScript, Tailwind CSS, and Supabase
- Be concise but thorough in explanations

Tool usage guidelines:
- ALWAYS use read_file before editing to see the current content
- Use edit_file for small, targeted changes
- Use write_file for new files or complete rewrites
- Use list_files to explore the project structure
- Use file_search to find where code is used

Communication style:
- Be direct and technical when discussing code
- Show what you're doing with tools
- Explain the "why" behind changes
- Never use "AI" terminology - you're their Cofounder tool
- Keep responses focused and actionable

Remember: You're helping build real applications. Prioritize working solutions over theoretical perfection.`,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Verify user authentication
 */
async function verifyUserAccess(accessToken: string) {
  const authClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!
  );
  
  const { data: { user }, error } = await authClient.auth.getUser(accessToken);
  
  if (error || !user) {
    throw new Error('Invalid authorization');
  }
  
  return user;
}

/**
 * Get GitHub context from user's stored settings
 */
async function getGitHubContext(userId: string) {
  const githubSettings = await kv.get(`github_settings:${userId}`);
  
  if (!githubSettings) {
    throw new Error('GitHub not connected. Please connect your GitHub account in settings.');
  }

  // githubSettings is already parsed from JSONB
  const settings = githubSettings;
  
  if (!settings.token || !settings.repository || !settings.branch) {
    throw new Error('GitHub settings incomplete. Please configure your repository.');
  }

  const [repoOwner, repoName] = settings.repository.split('/');
  
  return {
    repoOwner,
    repoName,
    branch: settings.branch,
    githubToken: settings.token,
  };
}

/**
 * Call Claude API with tool support
 */
async function callClaudeAPI(messages: any[], systemPrompt: string, enableTools: boolean = true) {
  const apiKey = Deno.env.get('CLAUDE_API_KEY');
  
  if (!apiKey) {
    throw new Error('Claude API key not configured');
  }

  const requestBody: any = {
    model: CLAUDE_CONFIG.model,
    max_tokens: CLAUDE_CONFIG.maxTokens,
    system: systemPrompt,
    messages: messages,
  };

  // Add tools if enabled
  if (enableTools) {
    requestBody.tools = CLAUDE_TOOLS;
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Claude API error: ${response.status} - ${errorData}`);
  }

  return await response.json();
}

// ============================================================================
// ENDPOINTS
// ============================================================================

/**
 * POST /make-server-373d8b09/claude-make/chat
 * Send a message to Claude and get a response (with tool support)
 */
app.post('/make-server-373d8b09/claude-make/chat', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'No authorization token provided' }, 401);
    }

    // Verify user
    const user = await verifyUserAccess(accessToken);
    
    // Get request body
    const body = await c.req.json();
    const { messages, context } = body;

    if (!messages || !Array.isArray(messages)) {
      return c.json({ error: 'Messages array is required' }, 400);
    }

    // Build system prompt with context
    let systemPrompt = CLAUDE_CONFIG.systemPrompt;
    
    // Add project information
    if (context?.projectInfo) {
      systemPrompt += `\n\n=== PROJECT INFORMATION ===\n${context.projectInfo}`;
    }
    
    // Add available files list
    if (context?.files) {
      systemPrompt += `\n\n=== AVAILABLE FILES ===\nThe project contains the following files:\n${context.files}`;
    }
    
    // Add currently selected file content
    if (context?.currentFile) {
      try {
        const fileData = JSON.parse(context.currentFile);
        systemPrompt += `\n\n=== CURRENTLY SELECTED FILE ===\nPath: ${fileData.path}\n\nContent:\n\`\`\`${fileData.language || ''}\n${fileData.content}\n\`\`\``;
      } catch (e) {
        // If not JSON, treat as plain text
        systemPrompt += `\n\n=== CURRENT FILE CONTEXT ===\n${context.currentFile}`;
      }
    }

    // Get GitHub context for tools (if available)
    let githubContext = null;
    try {
      githubContext = await getGitHubContext(user.id);
    } catch (error) {
      console.log('GitHub context not available:', error.message);
    }

    // Track conversation turns with tool use
    let conversationMessages = [...messages];
    let maxTurns = 5; // Prevent infinite loops
    let turnCount = 0;
    let finalResponse = null;

    while (turnCount < maxTurns) {
      turnCount++;
      console.log(`🔄 Claude turn ${turnCount}/${maxTurns}`);

      // Call Claude
      const claudeResponse = await callClaudeAPI(conversationMessages, systemPrompt, !!githubContext);

      // Check if Claude wants to use tools
      if (claudeResponse.stop_reason === 'tool_use') {
        const toolUses = claudeResponse.content.filter((block: any) => block.type === 'tool_use');
        
        if (!githubContext) {
          return c.json({
            error: 'Claude wants to use tools but GitHub is not connected',
            needsGitHub: true,
          }, 400);
        }

        console.log(`🔧 Claude wants to use ${toolUses.length} tools`);

        // Execute all tool calls
        const toolResults = [];
        for (const toolUse of toolUses) {
          console.log(`🔧 Executing tool: ${toolUse.name}`, toolUse.input);
          
          try {
            const result = await executeTool(
              toolUse.name,
              toolUse.input,
              {
                userId: user.id,
                ...githubContext,
              }
            );
            
            toolResults.push({
              type: 'tool_result',
              tool_use_id: toolUse.id,
              content: result,
            });
          } catch (error: any) {
            console.error(`❌ Tool execution failed:`, error);
            toolResults.push({
              type: 'tool_result',
              tool_use_id: toolUse.id,
              content: `Error: ${error.message}`,
              is_error: true,
            });
          }
        }

        // Add assistant message with tool uses and tool results to conversation
        conversationMessages.push({
          role: 'assistant',
          content: claudeResponse.content,
        });

        conversationMessages.push({
          role: 'user',
          content: toolResults,
        });

        // Continue loop to get Claude's next response
        continue;
      } else {
        // Claude is done, extract text response
        const textContent = claudeResponse.content.find((block: any) => block.type === 'text');
        finalResponse = textContent?.text || 'No response from Claude';
        break;
      }
    }

    if (turnCount >= maxTurns) {
      return c.json({
        error: 'Maximum conversation turns reached',
        details: 'Claude made too many tool calls',
      }, 500);
    }

    return c.json({
      success: true,
      response: finalResponse,
    });

  } catch (error: any) {
    console.error('Claude chat error:', error);
    return c.json({
      error: error.message || 'Failed to process chat request',
      details: error.toString(),
    }, 500);
  }
});

/**
 * POST /make-server-373d8b09/claude-make/save-files
 * Save GitHub files to the database for persistence
 */
app.post('/make-server-373d8b09/claude-make/save-files', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'No authorization token provided' }, 401);
    }

    // Verify user
    const user = await verifyUserAccess(accessToken);
    
    // Get request body
    const body = await c.req.json();
    const { files, repository } = body;

    if (!files || !Array.isArray(files)) {
      return c.json({ error: 'Files array is required' }, 400);
    }

    if (!repository) {
      return c.json({ error: 'Repository information is required' }, 400);
    }

    console.log(`💾 Saving ${files.length} files for user ${user.id} from repo ${repository.fullName}`);

    // Create a unique key for this project
    const projectKey = `cofounder_make_project:${user.id}:${repository.fullName.replace(/\//g, '_')}`;
    
    // Store the files in KV store - split into chunks to avoid timeout
    // Store metadata separately from file content
    const projectMetadata = {
      userId: user.id,
      repository: {
        fullName: repository.fullName,
        name: repository.name,
        defaultBranch: repository.defaultBranch,
        htmlUrl: repository.htmlUrl,
      },
      savedAt: new Date().toISOString(),
      fileCount: files.length,
    };

    // Save metadata first (small, fast)
    await kv.set(`${projectKey}:metadata`, projectMetadata);

    // Split files into chunks of 50 to avoid timeout
    const CHUNK_SIZE = 50;
    const fileChunks = [];
    for (let i = 0; i < files.length; i += CHUNK_SIZE) {
      fileChunks.push(files.slice(i, i + CHUNK_SIZE));
    }

    // Save each chunk separately
    for (let i = 0; i < fileChunks.length; i++) {
      const chunkKey = `${projectKey}:files:chunk_${i}`;
      await kv.set(chunkKey, fileChunks[i]);
    }

    // Save chunk count for retrieval
    await kv.set(`${projectKey}:chunk_count`, fileChunks.length);

    // Also save a reference in the user's projects list
    const userProjectsKey = `cofounder_make_projects:${user.id}`;
    const existingProjectsData = await kv.get(userProjectsKey);
    
    let projects = [];
    if (existingProjectsData) {
      // existingProjectsData is already parsed from JSONB
      projects = Array.isArray(existingProjectsData) ? existingProjectsData : [];
    }

    // Check if this project already exists in the list
    const projectIndex = projects.findIndex((p: any) => p.fullName === repository.fullName);
    
    const projectRef = {
      fullName: repository.fullName,
      name: repository.name,
      savedAt: new Date().toISOString(),
      fileCount: files.length,
    };

    if (projectIndex >= 0) {
      // Update existing project
      projects[projectIndex] = projectRef;
    } else {
      // Add new project
      projects.push(projectRef);
    }

    // Save as JSONB directly
    await kv.set(userProjectsKey, projects);

    console.log(`✅ Successfully saved ${files.length} files to database in ${fileChunks.length} chunks`);

    return c.json({
      success: true,
      message: `Successfully saved ${files.length} files`,
      fileCount: files.length,
      savedAt: projectMetadata.savedAt,
    });

  } catch (error: any) {
    console.error('Save files error:', error);
    return c.json({
      error: error.message || 'Failed to save files',
      details: error.toString(),
    }, 500);
  }
});

/**
 * GET /make-server-373d8b09/claude-make/saved-projects
 * Get list of saved projects for the user
 */
app.get('/make-server-373d8b09/claude-make/saved-projects', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'No authorization token provided' }, 401);
    }

    // Verify user
    const user = await verifyUserAccess(accessToken);

    const userProjectsKey = `cofounder_make_projects:${user.id}`;
    const projectsData = await kv.get(userProjectsKey);

    // projectsData is already parsed from JSONB
    const projects = Array.isArray(projectsData) ? projectsData : [];

    return c.json({
      success: true,
      projects: projects,
    });

  } catch (error: any) {
    console.error('Get saved projects error:', error);
    return c.json({
      error: error.message || 'Failed to get saved projects',
      details: error.toString(),
    }, 500);
  }
});

/**
 * GET /make-server-373d8b09/claude-make/load-project
 * Load a saved project's files from the database
 */
app.get('/make-server-373d8b09/claude-make/load-project', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'No authorization token provided' }, 401);
    }

    // Verify user
    const user = await verifyUserAccess(accessToken);

    const repositoryFullName = c.req.query('repository');
    
    if (!repositoryFullName) {
      return c.json({ error: 'Repository parameter is required' }, 400);
    }

    const projectKey = `cofounder_make_project:${user.id}:${repositoryFullName.replace(/\//g, '_')}`;
    
    // Load metadata
    const projectMetadata = await kv.get(`${projectKey}:metadata`);

    if (!projectMetadata) {
      // Try old format (backward compatibility)
      const oldProjectData = await kv.get(projectKey);
      if (oldProjectData) {
        return c.json({
          success: true,
          project: oldProjectData,
        });
      }
      
      return c.json({ error: 'Project not found' }, 404);
    }

    // Load all file chunks
    const chunkCount = await kv.get(`${projectKey}:chunk_count`);
    const allFiles = [];
    
    for (let i = 0; i < chunkCount; i++) {
      const chunkKey = `${projectKey}:files:chunk_${i}`;
      const chunk = await kv.get(chunkKey);
      if (chunk && Array.isArray(chunk)) {
        allFiles.push(...chunk);
      }
    }

    // Combine metadata and files
    const projectData = {
      ...projectMetadata,
      files: allFiles,
    };

    return c.json({
      success: true,
      project: projectData,
    });

  } catch (error: any) {
    console.error('Load project error:', error);
    return c.json({
      error: error.message || 'Failed to load project',
      details: error.toString(),
    }, 500);
  }
});

export { app as claudeMakeApp };