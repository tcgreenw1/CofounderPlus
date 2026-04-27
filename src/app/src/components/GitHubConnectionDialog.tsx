import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from './ui/dialog';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Input } from './ui/input';
import { 
  Github, 
  Search, 
  GitBranch, 
  Clock, 
  Lock, 
  Unlock,
  LogOut,
  RefreshCw,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';
import { GitHubRepo } from '../types/github';
import { formatDistanceToNow } from 'date-fns';

interface GitHubConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connected: boolean;
  username?: string;
  avatarUrl?: string;
  repositories: GitHubRepo[];
  onConnect: () => void;
  onDisconnect: () => void;
  onSelectRepo: (repo: GitHubRepo) => void;
  isLoading: boolean;
}

export function GitHubConnectionDialog({
  open,
  onOpenChange,
  connected,
  username,
  avatarUrl,
  repositories,
  onConnect,
  onDisconnect,
  onSelectRepo,
  isLoading
}: GitHubConnectionDialogProps) {
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredRepos = repositories.filter(repo => 
    (repo.fullName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isValidDate = (dateString: string) => {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Github className="w-5 h-5" />
            GitHub Integration
          </DialogTitle>
          <DialogDescription>
            Connect your repositories to sync code with Cofounder Make.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden p-0">
          {!connected ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-2">
                <Github className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold">Connect to GitHub</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Grant access to your repositories to enable code import, automatic commits, and pull requests.
              </p>
              <Button onClick={onConnect} disabled={isLoading} className="gap-2 mt-2">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Github className="w-4 h-4" />}
                Authorize with GitHub
              </Button>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* User Profile Bar */}
              <div className="px-6 py-4 bg-muted/20 flex items-center justify-between border-b">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border">
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback>{username?.[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium leading-none">{username}</p>
                    <p className="text-xs text-muted-foreground mt-1">Connected</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={onDisconnect} className="gap-2 h-8 text-xs">
                  <LogOut className="w-3.5 h-3.5" />
                  Disconnect
                </Button>
              </div>

              {/* Repo List */}
              <div className="flex-1 flex flex-col min-h-[300px]">
                <div className="p-4 pb-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search repositories..." 
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                
                <ScrollArea className="flex-1 px-4">
                  <div className="space-y-1 pb-4">
                    {isLoading ? (
                      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                         <Loader2 className="w-8 h-8 animate-spin mb-2 opacity-50" />
                         <p className="text-xs">Loading repositories...</p>
                      </div>
                    ) : filteredRepos.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <p>No repositories found</p>
                      </div>
                    ) : (
                      filteredRepos.map((repo) => (
                        <div
                          key={repo.id}
                          className="flex items-center justify-between p-3 rounded-lg border border-transparent hover:bg-muted/50 hover:border-border transition-all cursor-pointer group"
                          onClick={() => onSelectRepo(repo)}
                        >
                          <div className="flex-1 min-w-0 mr-4">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm truncate">{repo.fullName}</span>
                              {repo.private ? (
                                <Lock className="w-3 h-3 text-muted-foreground opacity-70" />
                              ) : (
                                <Unlock className="w-3 h-3 text-muted-foreground opacity-70" />
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <GitBranch className="w-3 h-3" />
                                {repo.defaultBranch}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {repo.updatedAt && isValidDate(repo.updatedAt) 
                                  ? formatDistanceToNow(new Date(repo.updatedAt), { addSuffix: true }) 
                                  : 'Unknown'}
                              </span>
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            variant="secondary"
                            className="opacity-0 group-hover:opacity-100 transition-opacity gap-1 h-8"
                          >
                            Import <ExternalLink className="w-3 h-3" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
