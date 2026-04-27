export interface RoadmapTask {
  id: string;
  title: string;
  whyItMatters: string;
  steps: string[];
  definitionOfDone: string;
  timeEstimate: string;
  tutorialLink?: string;
  xpReward: number;
  isProLocked: boolean;
  completed: boolean;
  completedAt?: Date;
  milestoneId: string;
}

// ============================================================================
// NODE STATE & AGI METADATA
// ============================================================================

export type NodeState = 
  | 'completed' 
  | 'active' 
  | 'available' 
  | 'recommended' 
  | 'blocked' 
  | 'locked' 
  | 'failed';

export interface RoadmapNode {
  id: string;
  title: string;
  description?: string;
  branchId: string;
  xp: number;
  timeEstimate?: string;
  state: NodeState;
  
  // Task/Subtask tracking
  tasks?: NodeTask[];
  progress?: number; // 0-100
  
  // Dependencies
  dependencies?: string[]; // Array of node IDs
  dependenciesMet?: boolean;
  
  // AGI Metadata
  aiInserted?: boolean;
  aiModified?: boolean;
  aiReordered?: boolean;
  aiRecommended?: boolean;
  aiReasoning?: string;
  aiPriority?: number; // 0-100 score
  
  // Kill Rule
  killRule?: {
    type: 'time-based' | 'metric-based' | 'dependency-based';
    threshold: string;
    current: string;
    status: 'safe' | 'warning' | 'critical';
    message?: string;
  };
  
  // Timestamps
  createdAt?: string;
  updatedAt?: string;
  startedAt?: string;
  completedAt?: string;
  failedAt?: string;
  
  // Additional metadata
  category?: string;
  icon?: string;
  color?: string;
  blockedReason?: string;
  order?: number;
}

export interface NodeTask {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: string;
}

export interface DefinitionOfDoneItem {
  text: string;
  met: boolean;
}

// ============================================================================
// BRANCH & ROADMAP STRUCTURE
// ============================================================================

export interface RoadmapBranch {
  id: string;
  label: string;
  color: string;
  icon?: string;
  nodes: RoadmapNode[];
  isLocked?: boolean;
  isCollapsed?: boolean;
  order?: number;
}

export interface Roadmap {
  id: string;
  title: string;
  description?: string;
  businessId: string;
  userId: string;
  
  // Structure
  branches: RoadmapBranch[];
  
  // Progress tracking
  totalNodes: number;
  completedNodes: number;
  activeNodes: number;
  progress: number; // 0-100
  
  // Chapter/Timeline
  currentChapter?: number;
  totalChapters?: number;
  chapterTitle?: string;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  lastActiveDate?: string;
}

// ============================================================================
// AGI CHANGE LOG & REASONING
// ============================================================================

export type AGIChangeType = 'insert' | 'reorder' | 'modify' | 'remove' | 'split' | 'merge';

export interface AGIChangeLogItem {
  id: string;
  type: AGIChangeType;
  nodeId: string;
  nodeName: string;
  timestamp: string;
  reasoning: string;
  reasonTag: {
    label: string;
    type: 'efficiency' | 'opportunity' | 'conversion' | 'risk';
  };
  metadata?: Record<string, any>;
}

export interface AGIRecommendation {
  id: string;
  priority: 'high' | 'medium' | 'low';
  nodeId: string;
  nodeName: string;
  category: string;
  explanation: string;
  expectedImpact?: string;
  timestamp: string;
}

export interface AGIRisk {
  id: string;
  title: string;
  severity: 1 | 2 | 3; // 1=low, 2=medium, 3=high
  nodeId?: string;
  affectedNodes?: string[];
  description?: string;
  suggestedFix?: string;
  timestamp: string;
}

export interface AGIMetadata {
  roadmapId: string;
  businessId: string;
  
  // Latest reasoning
  latestReasoning?: string;
  latestReasoningCause?: {
    label: string;
    type: 'conversion' | 'efficiency' | 'risk' | 'opportunity';
  };
  
  // Change history
  changeLogs: AGIChangeLogItem[];
  
  // Recommendations
  recommendations: AGIRecommendation[];
  
  // Risks & bottlenecks
  risks: AGIRisk[];
  
  // Branch controls
  branchLocks?: Record<string, boolean>;
  masterToggle?: boolean;
  
  // Timestamps
  lastAGIRun?: string;
  lastModified?: string;
}

// ============================================================================
// QUICK WINS MODE
// ============================================================================

export interface QuickWin {
  id: string;
  title: string;
  category: 'Product' | 'Marketing' | 'Sales' | 'Finance' | 'Ops' | 'HR';
  whyMatters: string;
  timeEstimate: string; // e.g., "5 min", "10 min"
  timeMinutes: number; // numeric value for filtering
  xpReward: number;
  completed: boolean;
  completedAt?: string;
  nodeId?: string; // Link to related roadmap node
  agiGenerated: boolean;
  agiReasoning?: string;
}

export interface QuickWinsSession {
  id: string;
  roadmapId: string;
  businessId: string;
  userId: string;
  
  // Quick wins in this session
  quickWins: QuickWin[];
  
  // Session metadata
  trigger: 'manual' | 'agi-stalled' | 'agi-momentum';
  triggerReason?: string;
  startedAt: string;
  completedAt?: string;
  isActive: boolean;
  
  // Progress
  totalWins: number;
  completedWins: number;
}

// ============================================================================
// MASTERY & SKILL PROGRESSION
// ============================================================================

export interface MasteryDomain {
  domain: 'Product' | 'Marketing' | 'Sales' | 'Finance' | 'Ops' | 'HR';
  level: number; // 0-100
  xp: number;
  color: string;
}

export interface MasteryRecentGain {
  id: string;
  domain: 'Product' | 'Marketing' | 'Sales' | 'Finance' | 'Ops' | 'HR';
  xpGained: number;
  from: string; // e.g., "Completed node: User Auth"
  timestamp: string;
}

export interface MasteryBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  glowColor: string;
  requirement?: string;
}

export interface MasteryData {
  roadmapId: string;
  businessId: string;
  userId: string;
  
  // Overall progress
  totalXP: number;
  currentLevel: number;
  levelProgress: number; // XP toward next level
  maxXPForLevel: number;
  
  // Domain mastery
  domains: MasteryDomain[];
  
  // Recent activity
  recentGains: MasteryRecentGain[];
  
  // Badges & achievements
  badges: MasteryBadge[];
  totalBadges: number;
  unlockedBadges: number;
  
  // Weaknesses & suggestions
  weakestDomain?: string;
  suggestions?: string[];
  
  // Timestamps
  lastUpdated: string;
}

// ============================================================================
// CHAPTER & TIMELINE
// ============================================================================

export interface Chapter {
  number: number;
  title: string;
  description?: string;
  status: 'completed' | 'current' | 'boss' | 'locked';
  nodes?: string[]; // Node IDs in this chapter
  progress?: number; // 0-100
}

// ============================================================================
// EXISTING TYPES (kept for compatibility)
// ============================================================================

export interface RoadmapMilestone {
  id: string;
  title: string;
  description: string;
  color: string;
  icon: string;
  tasks: RoadmapTask[];
  completed: boolean;
  xpReward: number;
  order: number;
}

export interface RoadmapTemplate {
  id: string;
  title: string;
  description: string;
  targetAudience: string;
  color: string;
  icon: string;
  milestones: RoadmapMilestone[];
  sprintPlan: SprintDay[];
  tutorials: Tutorial[];
  proLockSteps: number[];
}

export interface SprintDay {
  day: number;
  title: string;
  tasks: string[];
}

export interface Tutorial {
  id: string;
  title: string;
  videoUrl?: string;
  steps: string[];
  template?: string;
  script?: string;
}

export interface UserProgress {
  totalXP: number;
  currentStreak: number;
  longestStreak: number;
  completedTasks: string[];
  completedMilestones: string[];
  currentRoadmap: string;
  lastActiveDate: string;
  achievements: Achievement[];
  roadmapId?: string;
  businessId?: string;
  userId?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Achievement {
  id: string;
  type: string;
  title: string;
  description: string;
  earned_at: string;
  xp_bonus?: number;
}

export interface XPRewards {
  easyTask: number;
  standardTask: number;
  hardTask: number;
  milestone: number;
  streakBonus: number;
  streakThreshold: number;
}

export const XP_REWARDS: XPRewards = {
  easyTask: 15,
  standardTask: 25,
  hardTask: 40,
  milestone: 200,
  streakBonus: 10,
  streakThreshold: 3
};

export const FREE_MILESTONES = ['map', 'setup', 'launch-start'];
export const PRO_MILESTONES = ['monetize', 'scale', 'automate'];