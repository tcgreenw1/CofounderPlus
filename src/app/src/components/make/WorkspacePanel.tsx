import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Github, 
  Monitor, 
  Code2, 
  Search, 
  Folder, 
  FolderOpen, 
  FileCode, 
  FileJson, 
  FileText,
  File,
  X,
  AlertCircle,
  CheckCircle2,
  Terminal,
  ChevronDown
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';

// --- Types ---
export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  content?: string; // For files
  language?: string;
  isDirty?: boolean;
}

interface WorkspacePanelProps {
  files: FileNode[];
  selectedFileId: string | null;
  openFiles: string[]; // IDs of open files
  onFileSelect: (id: string) => void;
  onFileClose: (id: string) => void;
  onFileChange: (id: string, content: string) => void;
  onBack: () => void;
  githubConnected: boolean;
  previewReady: boolean;
  className?: string;
  onGithubClick?: () => void;
  selectedRepoName?: string;
  onSave?: () => void;
}

// --- Components ---

// 1. File Explorer
const FileExplorer = ({ 
  files, 
  selectedId, 
  onSelect,
  searchQuery 
}: { 
  files: FileNode[], 
  selectedId: string | null, 
  onSelect: (id: string) => void,
  searchQuery: string
}) => {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['root']));

  const toggleFolder = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newExpanded = new Set(expanded);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpanded(newExpanded);
  };

  const renderTree = (nodes: FileNode[], depth = 0) => {
    return nodes.map(node => {
      // Simple search filter
      if (searchQuery && !node.name.toLowerCase().includes(searchQuery.toLowerCase()) && node.type === 'file') {
        return null;
      }

      const isFolder = node.type === 'folder';
      const isExpanded = expanded.has(node.id);
      const isSelected = selectedId === node.id;
      const Icon = isFolder 
        ? (isExpanded ? FolderOpen : Folder) 
        : getFileIcon(node.name);

      return (
        <div key={node.id}>
          <div 
            className={cn(
              "flex items-center gap-2 py-1.5 px-2 cursor-pointer transition-colors text-sm rounded-md mx-2",
              isSelected ? "bg-primary/10 text-primary" : "hover:bg-muted/50 text-muted-foreground hover:text-foreground",
              depth > 0 && "ml-" + (depth * 3 + 2) // Indentation hack
            )}
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
            onClick={(e) => isFolder ? toggleFolder(node.id, e) : onSelect(node.id)}
          >
            <Icon className={cn("w-4 h-4 shrink-0", isFolder ? "text-blue-400" : "opacity-70")} />
            <span className="truncate flex-1">{node.name}</span>
            {isFolder && node.children && (
              <span className="text-[10px] opacity-50">{node.children.length}</span>
            )}
            {node.isDirty && (
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            )}
          </div>
          {isFolder && isExpanded && node.children && (
            <div>{renderTree(node.children, depth + 1)}</div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="py-2">
      {renderTree(files)}
    </div>
  );
};

const getFileIcon = (name: string) => {
  if (name.endsWith('.tsx') || name.endsWith('.ts')) return FileCode;
  if (name.endsWith('.json')) return FileJson;
  if (name.endsWith('.css')) return FileText;
  return File;
};


// 2. Code Editor Placeholder
const CodeEditor = ({ 
  file, 
  onChange 
}: { 
  file: FileNode, 
  onChange: (content: string) => void 
}) => {
  return (
    <div className="h-full flex flex-col bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm relative">
      <div className="flex-1 relative overflow-auto">
        <div className="absolute top-0 left-0 bottom-0 w-12 bg-[#1e1e1e] border-r border-[#333] flex flex-col items-end pr-2 py-4 text-xs text-[#858585] select-none">
          {Array.from({ length: 50 }).map((_, i) => (
            <div key={i} className="leading-6">{i + 1}</div>
          ))}
        </div>
        <textarea 
          className="absolute inset-0 left-12 w-[calc(100%-3rem)] h-full bg-transparent border-none outline-none resize-none p-4 leading-6 text-sm text-[#d4d4d4] font-mono"
          value={file.content || ''}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
        />
      </div>
    </div>
  );
};


// --- Main Panel Component ---
export const WorkspacePanel: React.FC<WorkspacePanelProps> = ({
  files,
  selectedFileId,
  openFiles,
  onFileSelect,
  onFileClose,
  onFileChange,
  onBack,
  githubConnected,
  previewReady,
  className,
  onGithubClick,
  selectedRepoName,
  onSave
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('code');
  const [fileSearch, setFileSearch] = useState('');

  const selectedFile = flattenFiles(files).find(f => f.id === selectedFileId);
  const openFileNodes = flattenFiles(files).filter(f => openFiles.includes(f.id));

  // Handle Ctrl+S
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        onSave?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSave]);

  return (
    <div className={cn("flex flex-col h-full bg-background/50 backdrop-blur-xl", className)}>
      {/* Navbar */}
      <div className="h-14 border-b border-border/40 flex items-center justify-between px-4 bg-background/30">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="h-8 w-8 -ml-2" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex flex-col cursor-pointer" onClick={onGithubClick}>
             <div className="flex items-center gap-1.5">
               <span className="font-semibold text-sm leading-none">Cofounder Make</span>
               <ChevronDown className="w-3 h-3 text-muted-foreground opacity-50" />
             </div>
             <span className="text-[10px] text-muted-foreground mt-1">
               {selectedRepoName ? `Repo: ${selectedRepoName}` : 'No Repository Selected'}
             </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onSave && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onSave}
              className="h-7 px-2.5 text-xs text-muted-foreground hover:text-primary gap-1.5 hidden sm:flex"
            >
               Save
               <kbd className="pointer-events-none inline-flex h-4 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                 <span className="text-xs">⌘</span>S
               </kbd>
            </Button>
          )}

          <Badge variant="outline" className="h-6 gap-1.5 bg-background/50">
            <Terminal className="w-3 h-3 text-primary" />
            <span className="hidden sm:inline">AI Dev Console</span>
          </Badge>
          
          {previewReady ? (
            <Badge variant="outline" className="h-6 gap-1.5 bg-green-500/10 text-green-600 border-green-200 dark:border-green-900">
              <CheckCircle2 className="w-3 h-3" />
              <span className="hidden sm:inline">Preview Ready</span>
            </Badge>
          ) : (
             <Badge variant="outline" className="h-6 gap-1.5 bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-900">
              <AlertCircle className="w-3 h-3" />
              <span className="hidden sm:inline">Building...</span>
            </Badge>
          )}

          <Button 
            variant="ghost" 
            size="sm"
            onClick={onGithubClick}
            className={cn(
              "h-7 px-2.5 gap-1.5 text-xs rounded-full border transition-all",
              githubConnected 
                ? "bg-slate-900/5 border-slate-200 text-slate-900 dark:text-slate-100 dark:bg-slate-100/10 dark:border-slate-800" 
                : "bg-muted/50 border-transparent text-muted-foreground hover:bg-muted"
            )}
          >
            <Github className="w-3 h-3" />
            <span className="hidden sm:inline">{githubConnected ? 'Connected' : 'Connect GitHub'}</span>
          </Button>
        </div>
      </div>

      {/* Tabs & Content */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col overflow-hidden">
        <div className="px-4 py-2 border-b border-border/40 bg-muted/20 flex justify-between items-center">
           <TabsList className="h-8 bg-background/50">
            <TabsTrigger value="preview" className="text-xs h-7 px-3 gap-2">
              <Monitor className="w-3.5 h-3.5" /> Preview
            </TabsTrigger>
            <TabsTrigger value="code" className="text-xs h-7 px-3 gap-2">
              <Code2 className="w-3.5 h-3.5" /> Code 
              <span className="ml-1 opacity-50 tabular-nums">({flattenFiles(files).length})</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 flex overflow-hidden">
           {/* Preview Tab Content */}
           <TabsContent value="preview" className="flex-1 m-0 p-0 relative bg-white dark:bg-black/20">
              <div className="absolute inset-0 flex items-center justify-center">
                 {/* This would be the actual preview URL in production */}
                 <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                    <Monitor className="w-16 h-16 opacity-20 mb-4" />
                    <p>Preview Environment</p>
                    <p className="text-xs opacity-60 max-w-md text-center mt-2 px-4">
                      In a production environment, this would render the live application running in a containerized sandbox.
                    </p>
                 </div>
                 
                 {/* Overlay if building */}
                 {!previewReady && (
                   <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
                     <div className="text-center space-y-3">
                       <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin mx-auto" />
                       <p className="text-sm font-medium">Compiling preview...</p>
                     </div>
                   </div>
                 )}
              </div>
           </TabsContent>

           {/* Code Tab Content - Split View */}
           <TabsContent value="code" className="flex-1 m-0 p-0 flex data-[state=inactive]:hidden">
              {/* File Explorer Column */}
              <div className="w-64 border-r border-border/40 flex flex-col bg-muted/10">
                <div className="p-3 border-b border-border/40">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input 
                      placeholder="Search files..." 
                      className="h-8 pl-8 bg-background/50 border-border/50 text-xs"
                      value={fileSearch}
                      onChange={(e) => setFileSearch(e.target.value)}
                    />
                  </div>
                </div>
                <ScrollArea className="flex-1">
                   {files.length > 0 ? (
                     <FileExplorer 
                       files={files} 
                       selectedId={selectedFileId} 
                       onSelect={onFileSelect}
                       searchQuery={fileSearch}
                     />
                   ) : (
                     <div className="flex flex-col items-center justify-center h-40 text-center px-4">
                       <p className="text-xs text-muted-foreground">No files loaded</p>
                       <Button 
                         variant="link" 
                         className="text-xs h-auto p-0 mt-1 text-primary"
                         onClick={onGithubClick}
                       >
                         Pull from GitHub
                       </Button>
                     </div>
                   )}
                </ScrollArea>
              </div>

              {/* Editor Column */}
              <div className="flex-1 flex flex-col bg-[#1e1e1e] overflow-hidden">
                {/* Editor Tabs */}
                 {openFiles.length > 0 ? (
                    <>
                      <div className="flex bg-[#252526] overflow-x-auto scrollbar-hide">
                        {openFileNodes.map(file => (
                          <div 
                            key={file.id}
                            className={cn(
                              "flex items-center gap-2 px-3 py-2 text-xs border-r border-[#333] cursor-pointer min-w-[120px] max-w-[200px] group select-none",
                              file.id === selectedFileId 
                                ? "bg-[#1e1e1e] text-[#fff]" 
                                : "text-[#969696] hover:bg-[#2a2d2e]"
                            )}
                            onClick={() => onFileSelect(file.id)}
                          >
                            <span className={cn(
                              "w-2 h-2 rounded-full shrink-0",
                              file.isDirty ? "bg-amber-500" : "bg-transparent"
                            )} />
                            <span className="truncate flex-1">{file.name}</span>
                            <div 
                              className="opacity-0 group-hover:opacity-100 hover:bg-[#404040] rounded p-0.5"
                              onClick={(e) => {
                                e.stopPropagation();
                                onFileClose(file.id);
                              }}
                            >
                              <X className="w-3 h-3" />
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Editor Content */}
                      <div className="flex-1 relative">
                        {selectedFile ? (
                          <CodeEditor 
                            file={selectedFile} 
                            onChange={(content) => onFileChange(selectedFile.id, content)} 
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-[#555]">
                             <p>Select a file to edit</p>
                          </div>
                        )}
                      </div>
                    </>
                 ) : (
                   <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-4">
                     <FileCode className="w-16 h-16 opacity-20" />
                     <div className="text-center space-y-1">
                       <p className="font-medium">No files open</p>
                       <p className="text-xs opacity-60">Select a file from the explorer to view code</p>
                     </div>
                   </div>
                 )}
              </div>
           </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

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
