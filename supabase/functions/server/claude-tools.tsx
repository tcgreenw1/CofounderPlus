/**
 * CLAUDE TOOLS FOR COFOUNDER MAKE
 * 
 * Tool definitions and executors for Claude to interact with GitHub repositories
 */

// ============================================================================
// TOOL DEFINITIONS
// ============================================================================

export const CLAUDE_TOOLS = [
  {
    name: 'read_file',
    description: 'Read the contents of a file from the repository. Use this when you need to see the current content of a file.',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'The file path relative to the repository root (e.g., "src/App.tsx")',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'write_file',
    description: 'Create a new file or completely replace an existing file with new content. Use this for new files or complete rewrites.',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'The file path relative to the repository root (e.g., "src/components/NewComponent.tsx")',
        },
        content: {
          type: 'string',
          description: 'The complete file content to write',
        },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'edit_file',
    description: 'Make targeted edits to an existing file by replacing specific content. Best for small, precise changes.',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'The file path relative to the repository root',
        },
        old_content: {
          type: 'string',
          description: 'The exact content to find and replace. Must match exactly including whitespace.',
        },
        new_content: {
          type: 'string',
          description: 'The new content to replace the old content with',
        },
      },
      required: ['path', 'old_content', 'new_content'],
    },
  },
  {
    name: 'list_files',
    description: 'List all files in the repository or in a specific directory.',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Optional directory path to list (defaults to root)',
        },
      },
      required: [],
    },
  },
  {
    name: 'file_search',
    description: 'Search for files by content pattern. Useful for finding where something is used.',
    input_schema: {
      type: 'object',
      properties: {
        pattern: {
          type: 'string',
          description: 'Text or regex pattern to search for in file contents',
        },
        file_pattern: {
          type: 'string',
          description: 'Optional file name pattern to filter (e.g., "*.tsx")',
        },
      },
      required: ['pattern'],
    },
  },
];

// ============================================================================
// TOOL EXECUTORS
// ============================================================================

interface ToolExecutionContext {
  userId: string;
  repoOwner: string;
  repoName: string;
  branch: string;
  githubToken: string;
}

/**
 * Read file from GitHub
 */
export async function executeReadFile(
  input: { path: string },
  context: ToolExecutionContext
): Promise<string> {
  const { repoOwner, repoName, branch, githubToken } = context;
  const { path } = input;

  const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${path}?ref=${branch}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `token ${githubToken}`,
      'Accept': 'application/vnd.github.v3+json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to read file ${path}: ${error}`);
  }

  const data = await response.json();
  
  if (data.type !== 'file') {
    throw new Error(`${path} is not a file`);
  }

  const content = atob(data.content.replace(/\n/g, ''));
  return `File: ${path}\n\nContent:\n\`\`\`\n${content}\n\`\`\``;
}

/**
 * Write file to GitHub
 */
export async function executeWriteFile(
  input: { path: string; content: string },
  context: ToolExecutionContext
): Promise<string> {
  const { repoOwner, repoName, branch, githubToken } = context;
  const { path, content } = input;

  // First, check if file exists to get SHA
  const checkUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${path}?ref=${branch}`;
  const checkResponse = await fetch(checkUrl, {
    headers: {
      'Authorization': `token ${githubToken}`,
      'Accept': 'application/vnd.github.v3+json',
    },
  });

  let sha: string | undefined;
  if (checkResponse.ok) {
    const existingFile = await checkResponse.json();
    sha = existingFile.sha;
  }

  // Create or update the file
  const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${path}`;
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${githubToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: `Update ${path} via Cofounder Make`,
      content: btoa(content),
      branch,
      ...(sha && { sha }),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to write file ${path}: ${error}`);
  }

  return `✅ Successfully ${sha ? 'updated' : 'created'} file: ${path}`;
}

/**
 * Edit file in GitHub
 */
export async function executeEditFile(
  input: { path: string; old_content: string; new_content: string },
  context: ToolExecutionContext
): Promise<string> {
  const { repoOwner, repoName, branch, githubToken } = context;
  const { path, old_content, new_content } = input;

  // Read current file
  const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${path}?ref=${branch}`;
  const response = await fetch(url, {
    headers: {
      'Authorization': `token ${githubToken}`,
      'Accept': 'application/vnd.github.v3+json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to read file ${path}: ${error}`);
  }

  const data = await response.json();
  const currentContent = atob(data.content.replace(/\n/g, ''));

  // Perform replacement
  if (!currentContent.includes(old_content)) {
    throw new Error(`Could not find the specified content in ${path}. Make sure old_content matches exactly.`);
  }

  const updatedContent = currentContent.replace(old_content, new_content);

  // Write back
  const updateUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${path}`;
  const updateResponse = await fetch(updateUrl, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${githubToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: `Edit ${path} via Cofounder Make`,
      content: btoa(updatedContent),
      branch,
      sha: data.sha,
    }),
  });

  if (!updateResponse.ok) {
    const error = await updateResponse.text();
    throw new Error(`Failed to update file ${path}: ${error}`);
  }

  return `✅ Successfully edited file: ${path}`;
}

/**
 * List files in repository
 */
export async function executeListFiles(
  input: { path?: string },
  context: ToolExecutionContext
): Promise<string> {
  const { repoOwner, repoName, branch, githubToken } = context;
  const { path = '' } = input;

  const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${path}?ref=${branch}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `token ${githubToken}`,
      'Accept': 'application/vnd.github.v3+json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to list files in ${path || 'root'}: ${error}`);
  }

  const items = await response.json();
  
  if (!Array.isArray(items)) {
    throw new Error(`${path} is not a directory`);
  }

  const fileList = items
    .map(item => `${item.type === 'dir' ? '📁' : '📄'} ${item.path}`)
    .join('\n');

  return `Files in ${path || 'root'}:\n\n${fileList}`;
}

/**
 * Search files by content
 */
export async function executeFileSearch(
  input: { pattern: string; file_pattern?: string },
  context: ToolExecutionContext
): Promise<string> {
  const { repoOwner, repoName, githubToken } = context;
  const { pattern, file_pattern } = input;

  // Use GitHub search API
  let query = `${pattern} repo:${repoOwner}/${repoName}`;
  if (file_pattern) {
    query += ` filename:${file_pattern}`;
  }

  const url = `https://api.github.com/search/code?q=${encodeURIComponent(query)}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `token ${githubToken}`,
      'Accept': 'application/vnd.github.v3+json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Search failed: ${error}`);
  }

  const data = await response.json();
  
  if (data.total_count === 0) {
    return `No files found matching pattern: ${pattern}`;
  }

  const results = data.items
    .slice(0, 10)
    .map((item: any) => `📄 ${item.path}`)
    .join('\n');

  return `Found ${data.total_count} matches (showing first 10):\n\n${results}`;
}

/**
 * Execute a tool call
 */
export async function executeTool(
  toolName: string,
  toolInput: any,
  context: ToolExecutionContext
): Promise<string> {
  switch (toolName) {
    case 'read_file':
      return await executeReadFile(toolInput, context);
    
    case 'write_file':
      return await executeWriteFile(toolInput, context);
    
    case 'edit_file':
      return await executeEditFile(toolInput, context);
    
    case 'list_files':
      return await executeListFiles(toolInput, context);
    
    case 'file_search':
      return await executeFileSearch(toolInput, context);
    
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}
