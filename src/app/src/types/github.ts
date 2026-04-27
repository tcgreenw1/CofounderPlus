export interface GitHubRepo {
  id: number;
  name: string;
  fullName: string;
  private: boolean;
  htmlUrl: string;
  defaultBranch: string;
  updatedAt: string;
}

export interface GitHubConnection {
  connected: boolean;
  username?: string;
  avatarUrl?: string;
  repos?: GitHubRepo[];
}
