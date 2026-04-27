/**
 * Roadmap Design System - Component Library
 * Complete Apple Liquid Glass aesthetic with Toy Box Pop colors
 */

// Core Components
export { NodeCore } from './NodeCore';

// Node State Variants
export {
  NodeAvailable,
  NodeActive,
  NodeRecommended,
  NodeAIInserted,
  NodeAIModified,
  NodeBlocked,
  NodeLocked,
  NodeFailed,
  NodeCompleted,
} from './NodeStateVariants';

// Branch / Structure Components
export { 
  BranchLane,
  BranchLaneOriginal,
  BranchLaneDark,
  BranchNodeContainer,
  BranchDependencyLine,
  BranchDependencyLineStraight
} from './BranchComponents';

// Timeline Components
export {
  TimelineBar,
  TimelineBarDark,
  ChapterMarkerLocked,
  ChapterMarkerCurrent,
  ChapterMarkerCompleted,
  ChapterMarkerNextBoss,
  TimelineBossNode,
  TimelineBossNodeDark,
} from './TimelineComponents';

// Panel Components
export {
  PanelSidebarLeft,
  PanelSidebarRightAGI,
  PanelCard,
  NodePanelRoot,
  NodePanelHeader,
  NodePanelProgress,
  NodePanelTaskItem,
  NodePanelDefinitionOfDone,
  NodePanelTaskList,
  NodePanelAGIInsightCard,
  NodePanelFooterActions,
  NodePanelDependenciesBlock,
  NodePanelKillRuleCard,
} from './PanelComponents';

// AGI Panel Components
export {
  AGIPanelRoot,
  AGIPanelHeader,
  AGIPanelSummaryCard,
  AGIPanelChangeLogItem,
  AGIPanelRecommendationItem,
  AGIPanelRiskItem,
  AGIPanelBranchLockToggle,
  AGIPanelBranchLockList,
  AGIPanelSectionHeader,
} from './AGIPanelComponents';

// Overlay Components
export {
  OverlayTooltip,
  OverlayTooltipRich,
  OverlayToast,
  OverlayToastContainer,
} from './OverlayComponents';

// Feedback Components
export {
  FeedbackXPBurst,
  FeedbackPathHighlight,
  FeedbackPathHighlightStraight,
  FeedbackMultiPathHighlight,
} from './FeedbackComponents';

// Control Components
export {
  ControlButtonPrimary,
  ControlButtonSecondary,
  ControlZoomControls,
  ControlFilterChip,
  ControlFilterChipGroup,
} from './ControlComponents';

// Complete Roadmap Screen
export { RoadmapScreen } from './RoadmapScreen';
export { RoadmapScreenEnhanced } from './RoadmapScreenEnhanced';

// Interaction Metadata
export { default as InteractionMetadata, ANIMATION_TIMINGS, TRANSFORM_PRESETS, GLOW_INTENSITIES } from './InteractionMetadata';

// Animation Components
export {
  NodeSpawnAnimation,
  AGIInsertAnimation,
  AGIReorderAnimation,
  AGIRemovalAnimation,
  TimelineRibbonSweep,
  ANIMATION_METADATA,
} from './AnimationComponents';

// Showcase Components (for development/testing)
export { NodeCoreShowcase } from './NodeCoreShowcase';
export { NodeStatesShowcase } from './NodeStatesShowcase';
export { BranchComponentsShowcase } from './BranchComponentsShowcase';
export { TimelineShowcase } from './TimelineShowcase';
export { PanelShowcase } from './PanelShowcase';
export { OverlayFeedbackShowcase } from './OverlayFeedbackShowcase';
export { ControlShowcase } from './ControlShowcase';
export { AnimationShowcase } from './AnimationShowcase';
export { NodePanelShowcase } from './NodePanelShowcase';
export { AGIPanelShowcase } from './AGIPanelShowcase';
export { MasteryShowcase } from './MasteryShowcase';

// Mastery Dashboard Components
export {
  MasteryLevelRing,
  MasterySkillBar,
  MasteryHexChart,
  MasteryWeaknessItem,
  MasterySuggestionCard,
  MasteryGainsItem,
  MasteryBadgeItem,
  MasterySectionHeader,
} from './MasteryComponents';

// Screens
export { RoadmapScreen } from './RoadmapScreen';
export { MasteryScreen } from './MasteryScreen';
export { AGILogicEngineBlueprint } from './AGILogicEngineBlueprint';

// Quick Wins Components
export {
  QuickWinsRootOverlay,
  QuickWinsHeader,
  QuickWinsExplanationStrip,
  QuickWinsFilterRow,
  QuickWinsCard,
  QuickWinsProgressBar,
  QuickWinsFooterActions,
} from './QuickWinsComponents';