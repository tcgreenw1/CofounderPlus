/**
 * BACKEND REQUIREMENTS FOR COFOUNDER MAKE v2
 * 
 * 1. Chat Persistence & Context
 *    - Store chat history per project/session in Supabase.
 *    - Implement vector search (RAG) over the codebase for "Explain this code" features.
 *    - Context window management for Claude (summarizing old messages).
 * 
 * 2. File System Operations
 *    - API to Read/Write/Delete/Move files in the virtual workspace.
 *    - File watcher to push updates to connected clients (real-time collaboration).
 *    - Git operations (clone, pull, stage, commit, push) via server-side execution.
 * 
 * 3. AI Agent Orchestration
 *    - Queue system for "AI Automations" (Redis/pg-boss).
 *    - "Supervisor" agent to breakdown high-level tasks into sub-tasks.
 *    - "Coder" agent (Claude 3.5 Sonnet) to write the actual code.
 *    - "Verifier" agent (GPT-4o) to review code and check against constraints.
 *    - Sandbox environment to run/test code safely before committing.
 * 
 * 4. Preview Environment
 *    - Dynamic container provisioning for user apps (WebContainer or Docker based).
 *    - Proxy server to route "preview-*.cofounder.app" to correct containers.
 *    - WebSocket stream for terminal output/logs from the preview container.
 * 
 * 5. Task Queue Management
 *    - API endpoints to CRUD tasks.
 *    - State machine for task transitions (Pending -> Running -> Verifying -> Completed).
 *    - WebSocket events to update frontend on task progress (real-time).
 * 
 * 6. Compiler/Linter Integration
 *    - Server-side TypeScript compiler / ESLint checks.
 *    - Return structured error data (line, column, message) to frontend.
 * 
 * 7. GitHub App Integration
 *    - Complete OAuth flow (already started).
 *    - Webhooks to listen for external pushes/PRs.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatPanel } from './make/ChatPanel';
import { WorkspacePanel, FileNode } from './make/WorkspacePanel';
import { AutomationsPanel, AutomationTask } from './make/AutomationsPanel';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from './ui/resizable';
import { useIsMobile } from './ui/use-mobile';
import { toast } from 'sonner@2.0.3';
import { supabase } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { GitHubConnectionDialog } from './GitHubConnectionDialog';
import { GitHubRepo, GitHubConnection } from '../types/github';

// --- Empty Initial State ---
const INITIAL_FILES: FileNode[] = [];
const INITIAL_TASKS: AutomationTask[] = [];
const INITIAL_MESSAGES = [
  {
    id: 'welcome',
    role: 'assistant' as const,
    content: 'Welcome to Cofounder Make. I can help you build your app. Connect your GitHub repository to get started, or ask me to create a new project.',
    timestamp: new Date().toISOString()
  }
];

export default function CofounderMake() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // State
  const [files, setFiles] = useState<FileNode[]>(INITIAL_FILES);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [tasks, setTasks] = useState<AutomationTask[]>(INITIAL_TASKS);
  
  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [openFiles, setOpenFiles] = useState<string[]>([]);

  const [userId, setUserId] = useState<string | null>(null);
  const [github, setGithub] = useState<GitHubConnection>({ connected: false });
  const [isLoadingGithub, setIsLoadingGithub] = useState(false);
  const [isPullingRepo, setIsPullingRepo] = useState(false);
  const [showGithubDialog, setShowGithubDialog] = useState(false);
  const [repositories, setRepositories] = useState<GitHubRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);

  // --- Effects ---

  useEffect(() => {
    checkUserAndGithub();
  }, []);

  // --- GitHub Handlers ---

  const checkUserAndGithub = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUserId(session.user.id);
      checkGithubStatus(session.user.id);
    }
  };

  const checkGithubStatus = async (uid: string) => {
    try {
      // 1. Check config first (robustness)
      const configRes = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/github/config-test`,
        { headers: { 'Authorization': `Bearer ${publicAnonKey}` } }
      );
      
      if (!configRes.ok) {
        console.debug('GitHub config check failed, might not be configured.');
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/github/status?userId=${uid}`,
        { headers: { 'Authorization': `Bearer ${publicAnonKey}` } }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.connected) {
          setGithub({
            connected: true,
            username: data.username,
            avatarUrl: data.avatarUrl
          });
          fetchRepositories(uid);
        } else {
          setGithub({ connected: false });
        }
      }
    } catch (error) {
      console.error('GitHub status check failed:', error);
    }
  };

  const connectGithub = async () => {
    if (!userId) {
      toast.error('Please log in to connect GitHub');
      return;
    }
    setIsLoadingGithub(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/github/auth-url?userId=${userId}`,
        { headers: { 'Authorization': `Bearer ${publicAnonKey}` } }
      );
      const data = await response.json();
      if (data.success && data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        toast.error('Failed to get GitHub auth URL');
      }
    } catch (error) {
      toast.error('Connection failed');
    } finally {
      setIsLoadingGithub(false);
    }
  };

  const disconnectGithub = async () => {
    if (!userId) return;
    try {
      await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/github/disconnect`,
        {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ userId })
        }
      );
      setGithub({ connected: false });
      setRepositories([]);
      setSelectedRepo(null);
      toast.success('GitHub disconnected');
    } catch (error) {
      toast.error('Failed to disconnect');
    }
  };

  const fetchRepositories = async (uid: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/github/repos?userId=${uid}`,
        { headers: { 'Authorization': `Bearer ${publicAnonKey}` } }
      );
      const data = await response.json();
      if (data.success) {
        const repos = data.repositories.map((r: any) => ({
          id: r.id,
          name: r.name,
          fullName: r.full_name,
          private: r.private,
          htmlUrl: r.html_url,
          defaultBranch: r.default_branch,
          updatedAt: r.updated_at
        }));
        setRepositories(repos);
        setGithub(prev => ({ ...prev, repos }));
      }
    } catch (error) {
      console.error('Failed to fetch repos:', error);
    }
  };

  const pullRepository = async (repo: GitHubRepo) => {
    if (!userId) return;
    
    setIsPullingRepo(true);
    setShowGithubDialog(false);
    setSelectedRepo(repo);
    
    // Clear current workspace
    setFiles([]);
    setSelectedFileId(null);
    setOpenFiles([]);

    try {
      const [owner, repoName] = repo.fullName.split('/');
      
      // 1. Fetch file tree
      const filesResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/github/repos/${owner}/${repoName}/all-files?userId=${userId}&ref=${repo.defaultBranch}`,
        { headers: { 'Authorization': `Bearer ${publicAnonKey}` } }
      );
      
      if (!filesResponse.ok) throw new Error('Failed to fetch files');
      const filesData = await filesResponse.json();
      
      if (filesData.success && filesData.files) {
        // Transform GitHub flat file list to Tree structure
        const tree = buildFileTree(filesData.files);
        setFiles(tree);
        
        // Save to database
        saveFilesToDatabase(filesData.files, repo);
        
        toast.success(`Pulled ${filesData.files.length} files from ${repo.name}`);
        
        // Auto-open README or index file if exists
        // (Logic can be improved to find the best file to open)
      }
    } catch (error) {
      console.error('Pull failed:', error);
      toast.error('Failed to pull repository');
      setFiles([]);
    } finally {
      setIsPullingRepo(false);
    }
  };

  const saveFilesToDatabase = async (flatFiles: any[], repo: GitHubRepo) => {
    // This calls the backend to persist the workspace state
    if (!userId) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/claude-make/save-files`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            files: flatFiles,
            repository: repo
          })
        }
      );
    } catch (e) {
      console.error('Failed to save to DB:', e);
    }
  };

  // Helper to convert GitHub flat list to FileNode tree
  const buildFileTree = (githubFiles: any[]): FileNode[] => {
    const root: FileNode[] = [];
    const map = new Map<string, FileNode>();

    // Sort to ensure folders are created before files if possible, 
    // but we handle out of order anyway.
    githubFiles.sort((a, b) => a.path.localeCompare(b.path));

    githubFiles.forEach(file => {
      const parts = file.path.split('/');
      let currentLevel = root;
      let currentPath = '';

      parts.forEach((part: string, index: number) => {
        const isFile = index === parts.length - 1;
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        
        // Check if node exists at this level
        let existingNode = currentLevel.find(n => n.name === part);

        if (!existingNode) {
          const newNode: FileNode = {
            id: currentPath, // Use path as unique ID
            name: part,
            type: isFile ? 'file' : 'folder',
            children: isFile ? undefined : [],
            // Only add content if it's a file
            content: isFile ? (file.content || '') : undefined,
            language: isFile ? getLanguage(part) : undefined
          };
          
          currentLevel.push(newNode);
          existingNode = newNode;
        }

        if (!isFile && existingNode.children) {
          currentLevel = existingNode.children;
        }
      });
    });

    return root;
  };

  const getLanguage = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'ts': case 'tsx': return 'typescript';
      case 'js': case 'jsx': return 'javascript';
      case 'css': return 'css';
      case 'json': return 'json';
      case 'html': return 'html';
      case 'md': return 'markdown';
      default: return 'plaintext';
    }
  };

  // --- Handlers ---

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const userContent = chatInput;
    setChatInput('');
    setIsSending(true);

    // Add user message to UI
    const userMsg = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: userContent,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMsg]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast.error('Authentication required');
        setIsSending(false);
        return;
      }

      // Prepare context for Claude
      // Convert current file structure to string list
      const fileList = flattenFiles(files).map(f => f.id).join('\n');
      
      // Get content of currently selected file if any
      let currentFileContext = null;
      if (selectedFileId) {
        const selectedNode = flattenFiles(files).find(f => f.id === selectedFileId);
        if (selectedNode && selectedNode.content) {
          currentFileContext = JSON.stringify({
            path: selectedNode.id,
            language: selectedNode.language,
            content: selectedNode.content
          });
        }
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/claude-make/chat`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messages: messages.map(m => ({
              role: m.role,
              content: m.content
            })).concat([{ role: 'user', content: userContent }]),
            context: {
              projectInfo: selectedRepo ? `Repository: ${selectedRepo.fullName}` : 'No repository connected',
              files: fileList,
              currentFile: currentFileContext
            }
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response from Claude');
      }

      // Add AI response
      const aiMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: data.response || 'No response generated.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, aiMsg]);

      // If tools were used, we might want to refresh the file list
      // For now, we can check if the response indicates changes
      // Ideally, the backend would tell us what changed
      // We'll trigger a refresh if connected
      if (selectedRepo && github.connected) {
        // Optional: Re-pull specific files or the whole repo?
        // Re-pulling whole repo might be heavy. 
        // For now, we rely on the user to manually "Refresh" or re-pull if they suspect changes.
        // Or we could implement a lighter "sync" mechanism later.
      }

    } catch (error: any) {
      console.error('Chat error:', error);
      toast.error(error.message || 'Failed to send message');
      
      // Add error message to chat
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: `Error: ${error.message || 'Something went wrong.'}`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const handleAddTask = (newTask: Omit<AutomationTask, 'id' | 'createdAt' | 'status' | 'model'>) => {
    const task: AutomationTask = {
      id: Date.now().toString(),
      ...newTask,
      status: 'pending',
      model: 'claude', // Default to Claude for coding
      createdAt: new Date().toISOString()
    };
    setTasks(prev => [task, ...prev]);
    toast.success('Task added to queue');
  };

  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleFileSelect = (id: string) => {
    setSelectedFileId(id);
    if (!openFiles.includes(id)) {
      setOpenFiles(prev => [...prev, id]);
    }
  };

  const handleFileClose = (id: string) => {
    setOpenFiles(prev => prev.filter(f => f !== id));
    if (selectedFileId === id) {
      setSelectedFileId(null);
    }
  };

  const handleFileChange = (id: string, content: string) => {
    // Deep update files state (recursive)
    const updateNodes = (nodes: FileNode[]): FileNode[] => {
      return nodes.map(node => {
        if (node.id === id) {
          return { ...node, content, isDirty: true };
        }
        if (node.children) {
          return { ...node, children: updateNodes(node.children) };
        }
        return node;
      });
    };
    setFiles(prev => updateNodes(prev));
  };

  const handleSave = async () => {
    if (!selectedRepo) {
      toast.error('No repository selected');
      return;
    }
    
    // Flatten files for saving
    const flatFiles: any[] = [];
    const traverse = (nodes: FileNode[], pathPrefix = '') => {
      nodes.forEach(node => {
        if (node.type === 'file') {
          flatFiles.push({
            name: node.name,
            path: node.id, // ID is the full path in our implementation
            content: node.content || ''
          });
        }
        if (node.children) {
          traverse(node.children);
        }
      });
    };
    traverse(files);

    toast.loading('Saving files...');
    await saveFilesToDatabase(flatFiles, selectedRepo);
    
    // Clear dirty flags
    const clearDirty = (nodes: FileNode[]): FileNode[] => {
      return nodes.map(node => ({
        ...node,
        isDirty: false,
        children: node.children ? clearDirty(node.children) : undefined
      }));
    };
    setFiles(prev => clearDirty(prev));
    toast.dismiss();
    toast.success('Files saved successfully');
  };

  return (
    <div className="h-screen w-full bg-background overflow-hidden flex flex-col">
      {/* Mobile Header (only visible on mobile) */}
      {isMobile && (
        <div className="p-4 border-b flex items-center justify-between">
          <span className="font-bold">Cofounder Make</span>
          {/* Add mobile menu trigger here */}
        </div>
      )}

      {/* Main Three-Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
        {isMobile ? (
          // simplified mobile view (stacked or tabs)
          <WorkspacePanel 
             files={files}
             selectedFileId={selectedFileId}
             openFiles={openFiles}
             onFileSelect={handleFileSelect}
             onFileClose={handleFileClose}
             onFileChange={handleFileChange}
             onBack={() => navigate('/dashboard')}
             githubConnected={github.connected}
             previewReady={!isPullingRepo}
             className="flex-1"
             onGithubClick={() => setShowGithubDialog(true)}
             selectedRepoName={selectedRepo?.name}
             onSave={handleSave}
          />
        ) : (
          <ResizablePanelGroup direction="horizontal">
            {/* Panel 1: Chat (Left) */}
            <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="min-w-[280px]">
              <ChatPanel 
                messages={messages}
                inputValue={chatInput}
                onInputChange={setChatInput}
                onSend={handleSendMessage}
                isSending={isSending}
              />
            </ResizablePanel>
            
            <ResizableHandle className="w-[1px] bg-border/50 hover:bg-primary/50 transition-colors" />

            {/* Panel 2: Workspace (Center) */}
            <ResizablePanel defaultSize={55} minSize={30}>
              <WorkspacePanel 
                files={files}
                selectedFileId={selectedFileId}
                openFiles={openFiles}
                onFileSelect={handleFileSelect}
                onFileClose={handleFileClose}
                onFileChange={handleFileChange}
                onBack={() => navigate('/dashboard')}
                githubConnected={github.connected}
                previewReady={!isPullingRepo}
                onGithubClick={() => setShowGithubDialog(true)}
                selectedRepoName={selectedRepo?.name}
                onSave={handleSave}
              />
            </ResizablePanel>

            <ResizableHandle className="w-[1px] bg-border/50 hover:bg-primary/50 transition-colors" />

            {/* Panel 3: Automations (Right) */}
            <ResizablePanel defaultSize={25} minSize={20} maxSize={35} className="min-w-[300px]">
              <AutomationsPanel 
                tasks={tasks}
                onAddTask={handleAddTask}
                onDeleteTask={handleDeleteTask}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>

      {/* GitHub Dialog Overlay */}
      <GitHubConnectionDialog 
        open={showGithubDialog} 
        onOpenChange={setShowGithubDialog}
        connected={github.connected}
        username={github.username}
        avatarUrl={github.avatarUrl}
        repositories={repositories}
        onConnect={connectGithub}
        onDisconnect={disconnectGithub}
        onSelectRepo={pullRepository}
        isLoading={isLoadingGithub || isPullingRepo}
      />
    </div>
  );
}

// Helper to flatten tree for searching/finding by ID
function flattenFiles(nodes: FileNode[]): FileNode[] {
  let flat: FileNode[] = [];
  for (const node of nodes) {
    flat.push(node);
    if (node.children) {
      flat = flat.concat(flattenFiles(node.children));
    }
  }
  return flat;
}
