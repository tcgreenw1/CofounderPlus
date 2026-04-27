import { Hono } from 'npm:hono';
import * as kv from './kv_store.tsx';

export function addGitHubOAuthEndpoints(app: any) {
  console.log('🔧 Adding GitHub OAuth endpoints...');

  const GITHUB_CLIENT_ID = Deno.env.get('GITHUB_CLIENT_ID');
  const GITHUB_CLIENT_SECRET = Deno.env.get('GITHUB_CLIENT_SECRET');
  const GITHUB_REDIRECT_URI = 'https://www.cofounderplus.com/cofounder-make/github-callback'; // Frontend callback URL

  // Log the configuration on startup for debugging
  console.log('🔍 GitHub OAuth Configuration:');
  console.log('   Client ID:', GITHUB_CLIENT_ID ? `${GITHUB_CLIENT_ID.substring(0, 8)}...` : 'NOT SET');
  console.log('   Client Secret:', GITHUB_CLIENT_SECRET ? `${GITHUB_CLIENT_SECRET.substring(0, 8)}...` : 'NOT SET');
  console.log('   Redirect URI:', GITHUB_REDIRECT_URI);

  // Test endpoint to verify OAuth configuration
  app.get('/make-server-373d8b09/github/config-test', async (c: any) => {
    try {
      return c.json({
        success: true,
        configured: {
          hasClientId: !!GITHUB_CLIENT_ID,
          hasClientSecret: !!GITHUB_CLIENT_SECRET,
          redirectUri: GITHUB_REDIRECT_URI,
          clientIdPrefix: GITHUB_CLIENT_ID ? GITHUB_CLIENT_ID.substring(0, 8) + '...' : 'NOT SET',
        },
        message: (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) 
          ? '⚠️ Missing OAuth credentials. Please set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in Supabase environment variables.'
          : '✅ OAuth credentials configured correctly!'
      });
    } catch (error: any) {
      return c.json({ error: error.message }, 500);
    }
  });

  // Helper to get user's access token
  async function getUserAccessToken(userId: string) {
    const tokenData = await kv.get(`github_oauth:${userId}`);
    return tokenData;
  }

  // Helper to refresh access token if needed (GitHub tokens don't expire but can be revoked)
  async function refreshAccessToken(userId: string, refreshToken: string) {
    try {
      const response = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_id: GITHUB_CLIENT_ID!,
          client_secret: GITHUB_CLIENT_SECRET!,
          refresh_token: refreshToken,
          grant_type: 'refresh_token'
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to refresh token: ${response.status}`);
      }

      const data = await response.json();

      // Store new tokens
      await kv.set(`github_oauth:${userId}`, {
        access_token: data.access_token,
        refresh_token: data.refresh_token || refreshToken,
        token_type: data.token_type,
        scope: data.scope
      });

      return data.access_token;
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  }

  // Helper to make authenticated GitHub API calls with user's token
  async function githubRequest(userId: string, endpoint: string, options: any = {}) {
    const tokenData = await getUserAccessToken(userId);

    if (!tokenData) {
      throw new Error('User not connected to GitHub. Please authorize first.');
    }

    let accessToken = tokenData.access_token;

    const url = endpoint.startsWith('http') ? endpoint : `https://api.github.com${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Cofounder-Plus-App',
      ...options.headers
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`GitHub API error (${endpoint}):`, errorText);
        
        // If 401, token might be invalid
        if (response.status === 401) {
          console.log('🔄 Got 401, token may be revoked. User needs to reconnect.');
          throw new Error('GitHub token is invalid or revoked. Please reconnect.');
        }

        // Rate limit check
        if (response.status === 403) {
          const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
          if (rateLimitRemaining === '0') {
            const resetTime = response.headers.get('X-RateLimit-Reset');
            throw new Error(`GitHub API rate limit exceeded. Resets at ${new Date(parseInt(resetTime!) * 1000).toLocaleTimeString()}`);
          }
        }

        throw new Error(`GitHub API error: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error: any) {
      // Enhance error message for network issues
      if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        throw new Error('Network error connecting to GitHub. Please check your connection.');
      }
      throw error;
    }
  }

  // Get OAuth authorization URL
  app.get('/make-server-373d8b09/github/auth-url', async (c: any) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        return c.json({ error: 'Authorization required' }, 401);
      }

      if (!GITHUB_CLIENT_ID) {
        return c.json({ 
          error: 'GitHub OAuth not configured. Please add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET environment variables.' 
        }, 500);
      }

      const userId = c.req.query('userId');
      if (!userId) {
        return c.json({ error: 'User ID is required' }, 400);
      }

      // Build OAuth authorization URL
      // Scopes: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps
      const scopes = [
        'repo',           // Full control of private repositories
        'read:user',      // Read user profile data
        'user:email',     // Read user email addresses
        'read:org',       // Read org and team membership
        'workflow'        // Update GitHub Actions workflows
      ];

      const authUrl = new URL('https://github.com/login/oauth/authorize');
      authUrl.searchParams.set('client_id', GITHUB_CLIENT_ID);
      authUrl.searchParams.set('redirect_uri', GITHUB_REDIRECT_URI);
      authUrl.searchParams.set('scope', scopes.join(' '));
      authUrl.searchParams.set('state', userId); // Pass userId as state for callback
      authUrl.searchParams.set('allow_signup', 'false'); // Don't allow new signups during OAuth

      console.log('🔗 Generated GitHub OAuth URL:');
      console.log('   Client ID:', GITHUB_CLIENT_ID ? `${GITHUB_CLIENT_ID.substring(0, 8)}...` : 'NOT SET');
      console.log('   Redirect URI being sent:', GITHUB_REDIRECT_URI);
      console.log('   Scopes:', scopes.join(' '));
      console.log('   Full Auth URL:', authUrl.toString());

      return c.json({
        success: true,
        authUrl: authUrl.toString(),
        redirectUri: GITHUB_REDIRECT_URI // Add this for debugging
      });

    } catch (error: any) {
      console.error('Get auth URL error:', error);
      return c.json({ error: error.message }, 500);
    }
  });

  // OAuth callback handler
  app.get('/make-server-373d8b09/github/callback', async (c: any) => {
    try {
      const code = c.req.query('code');
      const state = c.req.query('state'); // This is the userId
      const error = c.req.query('error');

      if (error) {
        console.error('OAuth error:', error);
        return c.json({ error: `GitHub authorization failed: ${error}` }, 400);
      }

      if (!code || !state) {
        return c.json({ error: 'Invalid callback parameters' }, 400);
      }

      const userId = state;

      console.log(`🔑 Exchanging code for access token for user ${userId}...`);

      // Exchange authorization code for access token
      const response = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_id: GITHUB_CLIENT_ID!,
          client_secret: GITHUB_CLIENT_SECRET!,
          code: code,
          redirect_uri: GITHUB_REDIRECT_URI
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Token exchange error:', errorText);
        return c.json({ error: 'Failed to exchange authorization code' }, 500);
      }

      const data = await response.json();

      if (data.error) {
        console.error('GitHub OAuth error:', data.error_description || data.error);
        return c.json({ 
          error: `GitHub OAuth error: ${data.error_description || data.error}` 
        }, 400);
      }

      // Fetch user info
      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${data.access_token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Cofounder-Plus-App'
        }
      });

      const userData = await userResponse.json();

      // Store tokens for this user
      await kv.set(`github_oauth:${userId}`, {
        access_token: data.access_token,
        token_type: data.token_type,
        scope: data.scope,
        refresh_token: data.refresh_token,
        username: userData.login,
        avatar_url: userData.avatar_url,
        name: userData.name,
        connected_at: new Date().toISOString()
      });

      console.log(`✅ GitHub connected successfully for user ${userId}, Username: ${userData.login}`);

      return c.json({
        success: true,
        message: 'GitHub account connected successfully!',
        username: userData.login,
        name: userData.name,
        avatarUrl: userData.avatar_url
      });

    } catch (error: any) {
      console.error('OAuth callback error:', error);
      return c.json({ error: error.message }, 500);
    }
  });

  // Check connection status
  app.get('/make-server-373d8b09/github/status', async (c: any) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        return c.json({ error: 'Authorization required' }, 401);
      }

      const userId = c.req.query('userId');
      if (!userId) {
        return c.json({ error: 'User ID is required' }, 400);
      }

      const tokenData = await getUserAccessToken(userId);

      if (!tokenData) {
        return c.json({
          connected: false,
          message: 'Not connected to GitHub'
        });
      }

      // Verify token is still valid by making a test request
      try {
        const userData = await githubRequest(userId, '/user');
        
        return c.json({
          connected: true,
          username: userData.login,
          name: userData.name,
          avatarUrl: userData.avatar_url,
          profileUrl: userData.html_url,
          connectedAt: tokenData.connected_at
        });
      } catch (error) {
        // Token invalid or expired
        return c.json({
          connected: false,
          message: 'GitHub connection expired or revoked. Please reconnect.'
        });
      }

    } catch (error: any) {
      console.error('Status check error:', error);
      return c.json({ error: error.message }, 500);
    }
  });

  // Disconnect GitHub
  app.post('/make-server-373d8b09/github/disconnect', async (c: any) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        return c.json({ error: 'Authorization required' }, 401);
      }

      const body = await c.req.json();
      const userId = body.userId;

      if (!userId) {
        return c.json({ error: 'User ID is required' }, 400);
      }

      // Delete stored tokens
      await kv.del(`github_oauth:${userId}`);

      console.log(`🔌 GitHub disconnected for user ${userId}`);

      return c.json({
        success: true,
        message: 'GitHub disconnected successfully'
      });

    } catch (error: any) {
      console.error('Disconnect error:', error);
      return c.json({ error: error.message }, 500);
    }
  });

  // Get user's repositories
  app.get('/make-server-373d8b09/github/repos', async (c: any) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        return c.json({ error: 'Authorization required' }, 401);
      }

      const userId = c.req.query('userId');
      if (!userId) {
        return c.json({ error: 'User ID is required' }, 400);
      }

      console.log(`📦 Fetching GitHub repositories for user ${userId}...`);

      // Fetch user's repos (up to 100)
      const repos = await githubRequest(
        userId,
        '/user/repos?sort=updated&per_page=100&affiliation=owner,collaborator'
      );

      const repositories = repos.map((repo: any) => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description || '',
        private: repo.private,
        htmlUrl: repo.html_url,
        language: repo.language,
        stargazersCount: repo.stargazers_count,
        forksCount: repo.forks_count,
        defaultBranch: repo.default_branch,
        createdAt: repo.created_at,
        updatedAt: repo.updated_at,
        pushedAt: repo.pushed_at
      }));

      console.log(`✅ Fetched ${repositories.length} repositories`);

      return c.json({
        success: true,
        repositories,
        total: repositories.length
      });

    } catch (error: any) {
      console.error('Get repos error:', error);
      return c.json({ error: error.message }, 500);
    }
  });

  // Get repository details
  app.get('/make-server-373d8b09/github/repos/:owner/:repo', async (c: any) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        return c.json({ error: 'Authorization required' }, 401);
      }

      const userId = c.req.query('userId');
      if (!userId) {
        return c.json({ error: 'User ID is required' }, 400);
      }

      const owner = c.req.param('owner');
      const repo = c.req.param('repo');

      console.log(`📦 Fetching repository details for ${owner}/${repo}...`);

      const repoData = await githubRequest(userId, `/repos/${owner}/${repo}`);

      return c.json({
        success: true,
        repository: {
          id: repoData.id,
          name: repoData.name,
          fullName: repoData.full_name,
          description: repoData.description || '',
          private: repoData.private,
          htmlUrl: repoData.html_url,
          language: repoData.language,
          stargazersCount: repoData.stargazers_count,
          forksCount: repoData.forks_count,
          defaultBranch: repoData.default_branch,
          createdAt: repoData.created_at,
          updatedAt: repoData.updated_at
        }
      });

    } catch (error: any) {
      console.error('Get repo details error:', error);
      return c.json({ error: error.message }, 500);
    }
  });

  // Get repository branches
  app.get('/make-server-373d8b09/github/repos/:owner/:repo/branches', async (c: any) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        return c.json({ error: 'Authorization required' }, 401);
      }

      const userId = c.req.query('userId');
      if (!userId) {
        return c.json({ error: 'User ID is required' }, 400);
      }

      const owner = c.req.param('owner');
      const repo = c.req.param('repo');

      console.log(`🌿 Fetching branches for ${owner}/${repo}...`);

      const branches = await githubRequest(userId, `/repos/${owner}/${repo}/branches`);

      const branchList = branches.map((branch: any) => ({
        name: branch.name,
        protected: branch.protected,
        commit: {
          sha: branch.commit.sha,
          url: branch.commit.url
        }
      }));

      return c.json({
        success: true,
        branches: branchList,
        total: branchList.length
      });

    } catch (error: any) {
      console.error('Get branches error:', error);
      return c.json({ error: error.message }, 500);
    }
  });

  // Get repository commits
  app.get('/make-server-373d8b09/github/repos/:owner/:repo/commits', async (c: any) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        return c.json({ error: 'Authorization required' }, 401);
      }

      const userId = c.req.query('userId');
      const branch = c.req.query('branch') || 'main';
      
      if (!userId) {
        return c.json({ error: 'User ID is required' }, 400);
      }

      const owner = c.req.param('owner');
      const repo = c.req.param('repo');

      console.log(`📝 Fetching commits for ${owner}/${repo} (branch: ${branch})...`);

      const commits = await githubRequest(
        userId, 
        `/repos/${owner}/${repo}/commits?sha=${branch}&per_page=20`
      );

      const commitList = commits.map((commit: any) => ({
        sha: commit.sha,
        message: commit.commit.message,
        author: {
          name: commit.commit.author.name,
          email: commit.commit.author.email,
          date: commit.commit.author.date
        },
        committer: {
          name: commit.commit.committer.name,
          date: commit.commit.committer.date
        },
        htmlUrl: commit.html_url
      }));

      return c.json({
        success: true,
        commits: commitList,
        total: commitList.length
      });

    } catch (error: any) {
      console.error('Get commits error:', error);
      return c.json({ error: error.message }, 500);
    }
  });

  // Get repository contents/files
  app.get('/make-server-373d8b09/github/repos/:owner/:repo/contents', async (c: any) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        return c.json({ error: 'Authorization required' }, 401);
      }

      const userId = c.req.query('userId');
      if (!userId) {
        return c.json({ error: 'User ID is required' }, 400);
      }

      const owner = c.req.param('owner');
      const repo = c.req.param('repo');
      const path = c.req.query('path') || ''; // Root directory by default
      const ref = c.req.query('ref'); // Optional branch/commit ref

      console.log(`📁 Fetching contents for ${owner}/${repo} at path: ${path || '/'}`);

      let endpoint = `/repos/${owner}/${repo}/contents/${path}`;
      if (ref) {
        endpoint += `?ref=${ref}`;
      }

      const contents = await githubRequest(userId, endpoint);

      return c.json({
        success: true,
        contents: Array.isArray(contents) ? contents.map((item: any) => ({
          name: item.name,
          path: item.path,
          type: item.type, // file, dir, symlink, submodule
          size: item.size,
          sha: item.sha,
          url: item.url,
          htmlUrl: item.html_url,
          downloadUrl: item.download_url
        })) : {
          name: contents.name,
          path: contents.path,
          type: contents.type,
          size: contents.size,
          sha: contents.sha,
          content: contents.content, // Base64 encoded for files
          encoding: contents.encoding,
          downloadUrl: contents.download_url
        }
      });

    } catch (error: any) {
      console.error('Get repository contents error:', error);
      return c.json({ error: error.message }, 500);
    }
  });

  // Optimized helper to fetch all files using Git Trees API (much faster!)
  async function fetchAllFilesOptimized(userId: string, owner: string, repo: string, ref?: string): Promise<any[]> {
    try {
      // Step 1: Get the default branch's SHA if ref not provided
      let treeSha = ref;
      if (!treeSha) {
        console.log(`Getting default branch for ${owner}/${repo}...`);
        const repoData = await githubRequest(userId, `/repos/${owner}/${repo}`);
        treeSha = repoData.default_branch;
      }

      // Step 2: Get the commit to find the tree SHA
      console.log(`Getting commit for ref: ${treeSha}...`);
      const commitData = await githubRequest(userId, `/repos/${owner}/${repo}/commits/${treeSha}`);
      const treeShaTrunk = commitData.commit.tree.sha;

      // Step 3: Use Git Trees API to get ALL files in one call - MUCH faster!
      console.log(`Fetching tree recursively for ${owner}/${repo}...`);
      const treeData = await githubRequest(userId, `/repos/${owner}/${repo}/git/trees/${treeShaTrunk}?recursive=1`);

      // Filter to only files (not trees/directories)
      const fileNodes = treeData.tree.filter((item: any) => item.type === 'blob');
      console.log(`Found ${fileNodes.length} files in repository tree`);

      // Step 4: Filter to only code files we care about to reduce API calls
      const codeFileExtensions = ['.tsx', '.ts', '.jsx', '.js', '.css', '.html', '.json', '.md', '.yml', '.yaml', '.txt', '.py', '.java', '.go', '.rs', '.xml', '.env'];
      const codeFileNodes = fileNodes.filter((file: any) => 
        codeFileExtensions.some(ext => file.path.endsWith(ext))
      );

      console.log(`Filtered to ${codeFileNodes.length} code files, fetching contents...`);

      // Step 5: Batch fetch file contents (limit to reasonable number to avoid timeout)
      const MAX_FILES = 1000; // Increased limit - we need all files for build preview
      const filesToFetch = codeFileNodes.slice(0, MAX_FILES);
      
      if (codeFileNodes.length > MAX_FILES) {
        console.warn(`⚠️ Repository has ${codeFileNodes.length} code files, limiting to ${MAX_FILES} to prevent timeout`);
      }

      const allFiles: any[] = [];

      // Fetch in smaller batches to avoid overwhelming the API
      const BATCH_SIZE = 50; // Increased batch size for better performance
      for (let i = 0; i < filesToFetch.length; i += BATCH_SIZE) {
        const batch = filesToFetch.slice(i, i + BATCH_SIZE);
        console.log(`Fetching batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(filesToFetch.length / BATCH_SIZE)}...`);
        
        const batchPromises = batch.map(async (file: any) => {
          try {
            // Use blob API which is faster than contents API
            const blobData = await githubRequest(userId, `/repos/${owner}/${repo}/git/blobs/${file.sha}`);
            
            return {
              name: file.path.split('/').pop(),
              path: file.path,
              type: 'file',
              size: file.size,
              sha: file.sha,
              url: `https://api.github.com/repos/${owner}/${repo}/contents/${file.path}`,
              htmlUrl: `https://github.com/${owner}/${repo}/blob/${treeSha}/${file.path}`,
              downloadUrl: `https://raw.githubusercontent.com/${owner}/${repo}/${treeSha}/${file.path}`,
              content: blobData.content, // Base64 encoded content
              encoding: blobData.encoding
            };
          } catch (error: any) {
            console.error(`Error fetching blob for ${file.path}:`, error.message);
            return null;
          }
        });

        const batchResults = await Promise.all(batchPromises);
        allFiles.push(...batchResults.filter(f => f !== null));
      }

      console.log(`✅ Successfully fetched ${allFiles.length} files`);
      return allFiles;

    } catch (error: any) {
      console.error(`Error in optimized fetch:`, error.message);
      throw error;
    }
  }

  // Get ALL files from repository recursively
  app.get('/make-server-373d8b09/github/repos/:owner/:repo/all-files', async (c: any) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        return c.json({ error: 'Authorization required' }, 401);
      }

      const userId = c.req.query('userId');
      if (!userId) {
        return c.json({ error: 'User ID is required' }, 400);
      }

      const owner = c.req.param('owner');
      const repo = c.req.param('repo');
      const ref = c.req.query('ref'); // Optional branch/commit ref

      console.log(`📦 Fetching ALL files for ${owner}/${repo}${ref ? ` (ref: ${ref})` : ''}...`);

      const allFiles = await fetchAllFilesOptimized(userId, owner, repo, ref);

      console.log(`✅ Fetched ${allFiles.length} total files from ${owner}/${repo}`);

      return c.json({
        success: true,
        files: allFiles,
        total: allFiles.length
      });

    } catch (error: any) {
      console.error('Get all repository files error:', error);
      return c.json({ error: error.message }, 500);
    }
  });

  // Get user's GitHub profile
  app.get('/make-server-373d8b09/github/user', async (c: any) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        return c.json({ error: 'Authorization required' }, 401);
      }

      const userId = c.req.query('userId');
      if (!userId) {
        return c.json({ error: 'User ID is required' }, 400);
      }

      console.log(`👤 Fetching GitHub user profile for user ${userId}...`);

      const userData = await githubRequest(userId, '/user');

      return c.json({
        success: true,
        user: {
          login: userData.login,
          name: userData.name,
          email: userData.email,
          avatarUrl: userData.avatar_url,
          bio: userData.bio,
          company: userData.company,
          location: userData.location,
          blog: userData.blog,
          htmlUrl: userData.html_url,
          publicRepos: userData.public_repos,
          followers: userData.followers,
          following: userData.following,
          createdAt: userData.created_at
        }
      });

    } catch (error: any) {
      console.error('Get user profile error:', error);
      return c.json({ error: error.message }, 500);
    }
  });

  // Save GitHub settings (repo, branch) for Claude tool use
  app.post('/make-server-373d8b09/github/settings', async (c: any) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        return c.json({ error: 'Authorization required' }, 401);
      }

      const userId = c.req.query('userId');
      if (!userId) {
        return c.json({ error: 'User ID is required' }, 400);
      }

      const body = await c.req.json();
      const { repository, branch } = body;

      if (!repository || !branch) {
        return c.json({ error: 'Repository and branch are required' }, 400);
      }

      // Get existing token
      const tokenData = await getUserAccessToken(userId);
      if (!tokenData) {
        return c.json({ error: 'GitHub not connected' }, 401);
      }

      const token = tokenData.access_token;

      // Save settings
      await kv.set(`github_settings:${userId}`, JSON.stringify({
        repository,
        branch,
        token,
        updatedAt: new Date().toISOString(),
      }));

      return c.json({
        success: true,
        message: 'GitHub settings saved',
      });
    } catch (error: any) {
      console.error('GitHub settings save error:', error);
      return c.json({ error: error.message }, 500);
    }
  });

  console.log('✅ GitHub OAuth endpoints added successfully');
}