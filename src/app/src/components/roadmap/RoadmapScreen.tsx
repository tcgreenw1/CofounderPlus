import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Save, Share2, Users, Sparkles, Zap, TrendingUp, Target, Code, CheckCircle2, Circle, Trophy } from 'lucide-react';
import { useRoadmap } from '../../contexts/RoadmapContext';
import { useBusiness } from '../BusinessContext';
import { RoadmapNode } from '../../types/roadmap';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Import all UI components
import { PanelSidebarLeft } from './PanelComponents';
import {
  AGIPanelRoot,
  AGIPanelHeader,
  AGIPanelSummaryCard,
  AGIPanelSectionHeader,
  AGIPanelChangeLogItem,
  AGIPanelRecommendationItem,
  AGIPanelRiskItem,
  AGIPanelBranchLockList,
} from './AGIPanelComponents';
import {
  NodePanelRoot,
  NodePanelHeader,
  NodePanelProgress,
  NodePanelTaskList,
  NodePanelDefinitionOfDone,
  NodePanelAGIInsightCard,
  NodePanelDependenciesBlock,
  NodePanelKillRuleCard,
  NodePanelFooterActions,
} from './PanelComponents';
import {
  NodeStateCompleted,
  NodeStateActive,
  NodeStateAvailable,
  NodeStateRecommended,
  NodeStateBlocked,
  NodeStateLocked,
  NodeStateFailed,
  NodeAIInserted,
  NodeAIModified,
} from './NodeStateVariants';
import {
  BranchLane,
  BranchNodeContainer,
  BranchDependencyLine,
} from './BranchComponents';
import {
  TimelineBar,
  ChapterMarkerCompleted,
  ChapterMarkerCurrent,
  ChapterMarkerNextBoss,
  ChapterMarkerLocked,
} from './TimelineComponents';
import {
  ControlFilterChipGroup,
  ControlButtonPrimary,
  ControlButtonSecondary,
  ControlZoomControls,
} from './ControlComponents';
import { QuickWinsRootOverlay } from './QuickWinsComponents';

// Import new AGI-enhanced components
import { AGIFloatingBubble } from './AGIFloatingBubble';
import { AGISmartPanel } from './AGISmartPanel';
import { EnhancedNodeCard } from './EnhancedNodeCard';
import { DynamicStageTimeline } from './DynamicStageTimeline';
import { QuickActionsFooter } from './QuickActionsFooter';
import { SmartXPBar } from './SmartXPBar';
import { DraggableNode } from './DraggableNode';
import { MobileStageTimeline } from './MobileStageTimeline';
import { MobileRoadmapHeader } from './MobileRoadmapHeader';
import { MobileProgressBar } from './MobileProgressBar';
import { MobileRoadmapView } from './MobileRoadmapView';

/**
 * Complete Roadmap Screen - NOW WITH LIVE DATA
 * Uses RoadmapContext for all data - no more mock data!
 */
export function RoadmapScreen() {
  const navigate = useNavigate();
  const { selectedBusiness } = useBusiness();
  const {
    roadmap,
    agiMetadata,
    masteryData,
    loading,
    error,
    selectedNodeId,
    selectNode,
    getNode,
    updateNode,
    updateAGI,
    loadRoadmap,
  } = useRoadmap();

  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [quickWinsOpen, setQuickWinsOpen] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [collapsedBranches, setCollapsedBranches] = useState<string[]>([]);
  const [localRoadmap, setLocalRoadmap] = useState(roadmap);
  const [isRefreshingRoadmap, setIsRefreshingRoadmap] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // If mobile, use the new mobile view
  if (isMobile) {
    return <MobileRoadmapView />;
  }

  // Sync local roadmap with context roadmap
  useEffect(() => {
    if (roadmap) {
      setLocalRoadmap(roadmap);
    }
  }, [roadmap]);

  // Load roadmap is now handled by RoadmapWrapper
  // This component assumes roadmap is already loaded

  // Initialize collapsed branches from localStorage
  useEffect(() => {
    if (roadmap && selectedBusiness) {
      const storageKey = `roadmap_collapsed_${selectedBusiness.id}`;
      const stored = localStorage.getItem(storageKey);
      
      if (stored) {
        // Load saved state
        try {
          const savedCollapsed = JSON.parse(stored);
          setCollapsedBranches(savedCollapsed);
        } catch (e) {
          // If parse fails, default to all collapsed
          setCollapsedBranches(roadmap.branches.map(b => b.id));
        }
      } else {
        // First time - collapse all branches by default
        setCollapsedBranches(roadmap.branches.map(b => b.id));
      }
    }
  }, [roadmap, selectedBusiness]);

  // Initialize filters when roadmap loads
  useEffect(() => {
    if (roadmap && activeFilters.length === 0) {
      // Show all branches by default (all 5 departments visible)
      setActiveFilters(roadmap.branches.map(b => b.id));
    }
  }, [roadmap]);

  // Persist collapsed state to localStorage whenever it changes
  useEffect(() => {
    if (selectedBusiness && collapsedBranches.length > 0) {
      const storageKey = `roadmap_collapsed_${selectedBusiness.id}`;
      localStorage.setItem(storageKey, JSON.stringify(collapsedBranches));
    }
  }, [collapsedBranches, selectedBusiness]);

  const handleToggleBranch = async (branchId: string, locked: boolean) => {
    if (!agiMetadata) return;
    
    const updatedLocks = {
      ...agiMetadata.branchLocks,
      [branchId]: locked
    };
    
    await updateAGI({
      branchLocks: updatedLocks
    });
  };

  const handleMasterToggle = async (enabled: boolean) => {
    if (!agiMetadata) return;
    
    await updateAGI({
      masterToggle: enabled
    });
  };

  // Handle node reordering via drag and drop
  const handleMoveNode = async (dragIndex: number, hoverIndex: number, branchId: string) => {
    if (!localRoadmap) return;

    // Find the branch
    const branchIndex = localRoadmap.branches.findIndex(b => b.id === branchId);
    if (branchIndex === -1) return;

    // Create a copy of the roadmap
    const newRoadmap = { ...localRoadmap };
    const branch = { ...newRoadmap.branches[branchIndex] };
    const newNodes = [...branch.nodes];

    // Reorder nodes
    const [draggedNode] = newNodes.splice(dragIndex, 1);
    newNodes.splice(hoverIndex, 0, draggedNode);

    // Update branch
    branch.nodes = newNodes;
    newRoadmap.branches = [...newRoadmap.branches];
    newRoadmap.branches[branchIndex] = branch;

    // Update local state immediately for smooth UX
    setLocalRoadmap(newRoadmap);

    // Persist to backend
    try {
      // Save the new node order to the backend via the context
      // This will depend on your API structure, adjust accordingly
      console.log('Saving node order:', { branchId, nodeOrder: newNodes.map(n => n.id) });
      // You may want to add a method in RoadmapContext for this
    } catch (error) {
      console.error('Failed to save node order:', error);
      // Revert on error
      setLocalRoadmap(localRoadmap);
    }
  };

  // Handle node completion toggle
  const handleToggleNodeComplete = async (nodeId: string) => {
    const node = getNode(nodeId);
    if (!node) return;

    // Toggle between completed and available states
    const newState = node.state === 'completed' ? 'available' : 'completed';

    try {
      await updateNode(nodeId, {
        state: newState,
        ...(newState === 'completed' ? { completedAt: new Date().toISOString() } : {}})
      });
    } catch (error) {
      console.error('Failed to toggle node completion:', error);
    }
  };

  // Handle roadmap refresh - triggers Cofounder to update roadmap
  const handleRefreshRoadmap = async () => {
    setIsRefreshingRoadmap(true);
    
    try {
      // Call AI chat endpoint to refresh roadmap
      // This would trigger questions, validations, new tasks, stage advancement, etc.
      await loadRoadmap(); // Reload the roadmap
      console.log('Roadmap refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh roadmap:', error);
    } finally {
      setIsRefreshingRoadmap(false);
    }
  };

  const selectedNode = selectedNodeId ? getNode(selectedNodeId) : null;

  // Calculate filter chips from branches
  const filters = roadmap?.branches.map(branch => ({
    id: branch.id,
    label: branch.label,
    icon: <Target className="size-4" />,
    count: branch.nodes.length,
    color: 'blue' as const
  })) || [];

  // Render node based on state
  const renderNode = (node: RoadmapNode, branchColor: string) => {
    const baseProps = {
      title: node.title,
      xpBadge: (
        <div
          className="px-2 py-1 rounded-full flex items-center gap-1"
          style={{
            background: 'var(--color-energy-glass, rgba(242, 201, 76, 0.2))',
            border: '1px solid var(--color-energy-border, rgba(242, 201, 76, 0.4))',
            backdropFilter: 'blur(8px)',
          }}
        >
          <Zap className="size-3 text-yellow-600" />
          <span className="text-xs font-bold text-yellow-700">+{node.xp}</span>
        </div>
      ),
      onClick: () => selectNode(node.id),
    };

    // Special handling for AGI-modified nodes
    if (node.aiInserted) {
      return <NodeAIInserted key={node.id} {...baseProps} />;
    }
    if (node.aiModified) {
      return <NodeAIModified key={node.id} {...baseProps} />;
    }

    // Determine which state component to render
    switch (node.state) {
      case 'completed':
        return <NodeStateCompleted key={node.id} {...baseProps} />;
      case 'active':
        return <NodeStateActive key={node.id} {...baseProps} />;
      case 'available':
        return <NodeStateAvailable key={node.id} {...baseProps} />;
      case 'recommended':
        return <NodeStateRecommended key={node.id} {...baseProps} />;
      case 'blocked':
        return <NodeStateBlocked key={node.id} {...baseProps} reason={node.blockedReason || 'Requires previous node'} />;
      case 'locked':
        return <NodeStateLocked key={node.id} {...baseProps} />;
      case 'failed':
        return <NodeStateFailed key={node.id} {...baseProps} />;
      default:
        return <NodeStateAvailable key={node.id} {...baseProps} />;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <div className="text-center">
          <Sparkles className="size-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading roadmap...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <div className="text-center">
          <p className="text-destructive mb-4">Error loading roadmap: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // No roadmap loaded
  if (!roadmap) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <p className="text-muted-foreground">No roadmap data available</p>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="relative size-full h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      
      {/* Mobile-specific Stage Timeline (Vertical on Left) */}
      {isMobile && (
        <MobileStageTimeline
          currentStage={roadmap.currentChapter || 1}
          stages={[
            { number: 1, label: 'Foundation', status: (roadmap.currentChapter || 1) > 1 ? 'completed' : (roadmap.currentChapter || 1) === 1 ? 'current' : 'locked' },
            { number: 2, label: 'MVP', status: (roadmap.currentChapter || 1) > 2 ? 'completed' : (roadmap.currentChapter || 1) === 2 ? 'current' : 'locked' },
            { number: 3, label: 'Launch', status: (roadmap.currentChapter || 1) > 3 ? 'completed' : (roadmap.currentChapter || 1) === 3 ? 'current' : 'locked' },
            { number: 4, label: 'Scale', status: (roadmap.currentChapter || 1) > 4 ? 'completed' : (roadmap.currentChapter || 1) === 4 ? 'current' : 'locked' },
            { number: 5, label: 'Exit', status: (roadmap.currentChapter || 1) > 5 ? 'completed' : (roadmap.currentChapter || 1) === 5 ? 'current' : 'locked' },
          ]}
          onStageClick={(stage) => console.log('Stage clicked:', stage)}
        />
      )}

      {/* Mobile Header with Actions */}
      {isMobile && (
        <div
          className="fixed top-0 z-30"
          style={{
            left: '60px',
            right: 0,
          }}
        >
          <MobileRoadmapHeader
            onRefreshRoadmap={handleRefreshRoadmap}
            isRefreshing={isRefreshingRoadmap}
          />
        </div>
      )}

      {/* AGI Floating Bubble - Hidden on Mobile */}
      {!isMobile && (
        <AGIFloatingBubble
          onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
          isOpen={rightSidebarOpen}
          hasNotification={agiMetadata?.recommendations && agiMetadata.recommendations.length > 0}
        />
      )}

      {/* AGI Smart Panel */}
      <AGISmartPanel
        isOpen={rightSidebarOpen}
        onClose={() => setRightSidebarOpen(false)}
        currentNodeId={selectedNodeId || undefined}
        onAskAboutNode={(nodeId) => selectNode(nodeId)}
      />

      {/* Left Sidebar - Fixed - Hidden on Mobile */}
      {!isMobile && (
        <PanelSidebarLeft
          width={300}
          onRoadmapChange={(roadmap) => console.log('Roadmap:', roadmap)}
          onBranchFilterChange={(branches) => setActiveFilters(branches)}
          onModeChange={(mode) => console.log('Mode:', mode)}
          onSearchChange={(query) => console.log('Search:', query)}
        />
      )}

      {/* Node Panel - Modal Overlay (slides in from left) */}
      {selectedNode && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(8px)',
          }}
          onClick={() => selectNode(null)}
        >
          <div
            className="h-full overflow-auto"
            style={{
              width: '420px',
              maxHeight: '100vh',
              position: 'absolute',
              left: '300px',
              top: 0,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <NodePanelRoot
              width={420}
              isOpen={!!selectedNode}
              onClose={() => selectNode(null)}
            >
              <NodePanelHeader
                nodeName={selectedNode.title}
                category={selectedNode.category || 'General'}
                categoryColor={selectedNode.color || '#2F80FF'}
                xpBadge={
                  <div
                    className="px-3 py-1 rounded-full flex items-center gap-1.5"
                    style={{
                      background: 'var(--color-energy-glass, rgba(242, 201, 76, 0.2))',
                      border: '1.5px solid var(--color-energy-border, rgba(242, 201, 76, 0.4))',
                    }}
                  >
                    <Zap className="size-4 text-yellow-600" />
                    <span className="font-bold text-yellow-700">+{selectedNode.xp}</span>
                  </div>
                }
                stateTag={{
                  label: selectedNode.state.charAt(0).toUpperCase() + selectedNode.state.slice(1),
                  color: selectedNode.color || '#2F80FF',
                }}
                onClose={() => selectNode(null)}
              />

              {selectedNode.progress !== undefined && (
                <NodePanelProgress progress={selectedNode.progress} />
              )}

              {selectedNode.tasks && selectedNode.tasks.length > 0 && (
                <NodePanelTaskList
                  tasks={selectedNode.tasks.map(task => ({
                    taskId: task.id,
                    title: task.title,
                    completed: task.completed,
                    onToggle: async () => {
                      // Toggle task completion
                      const updatedTasks = selectedNode.tasks?.map(t =>
                        t.id === task.id ? { ...t, completed: !t.completed } : t
                      );
                      await updateNode(selectedNode.id, { tasks: updatedTasks });
                    }
                  }))}
                />
              )}

              {selectedNode.aiReasoning && (
                <NodePanelAGIInsightCard
                  insightText={selectedNode.aiReasoning}
                  severity="medium"
                />
              )}

              {selectedNode.dependencies && selectedNode.dependencies.length > 0 && (
                <NodePanelDependenciesBlock
                  dependencies={selectedNode.dependencies.map(depId => {
                    const depNode = getNode(depId);
                    return {
                      nodeName: depNode?.title || 'Unknown',
                      completed: depNode?.state === 'completed'
                    };
                  })}
                />
              )}

              {selectedNode.killRule && (
                <NodePanelKillRuleCard killRule={selectedNode.killRule} />
              )}

              <NodePanelFooterActions
                onComplete={async () => {
                  await updateNode(selectedNode.id, { 
                    state: 'completed',
                    completedAt: new Date().toISOString()
                  });
                  selectNode(null);
                }}
                onSkip={() => selectNode(null)}
                onDelete={async () => {
                  // Handle node deletion
                  console.log('Delete node:', selectedNode.id);
                  selectNode(null);
                }}
              />
            </NodePanelRoot>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div
        className="transition-all duration-300"
        style={{
          marginLeft: isMobile ? '60px' : '300px',
          marginTop: isMobile ? '60px' : '0',
          marginRight: rightSidebarOpen ? '420px' : '0',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Top Command Bar - Hidden on Mobile */}
        {!isMobile && (
          <div
            className="roadmap-command-bar flex items-center justify-between px-8 py-4 border-b"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 252, 255, 0.95) 100%)',
              backdropFilter: 'blur(40px)',
              WebkitBackdropFilter: 'blur(40px)',
              borderBottom: '2px solid rgba(47, 128, 255, 0.15)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
              zIndex: 30,
            }}
          >
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-slate-900">{roadmap.title}</h1>
              <div
                className="px-3 py-1 rounded-full text-sm font-semibold"
                style={{
                  background: 'linear-gradient(135deg, rgba(39, 209, 124, 0.15), rgba(100, 230, 150, 0.12))',
                  border: '1px solid rgba(39, 209, 124, 0.3)',
                  color: '#1a8a52',
                }}
              >
                {Math.round(roadmap.progress)}% Complete
              </div>
            </div>

            <div className="flex-1 flex justify-center px-8">
              <ControlFilterChipGroup
                filters={filters}
                activeFilters={activeFilters}
                onFilterChange={setActiveFilters}
                multiSelect={true}
                size="sm"
              />
            </div>

            <div className="flex items-center gap-3">
              <ControlButtonPrimary 
                variant="yellow" 
                size="sm" 
                icon={<Trophy />}
                onClick={() => navigate('/mastery-agi')}
              >
                Mastery Level
              </ControlButtonPrimary>
              <ControlButtonSecondary size="sm" icon={<Users />}>
                Share
              </ControlButtonSecondary>
              <ControlButtonPrimary 
                variant="blue" 
                size="sm" 
                icon={<Sparkles />}
                onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
              >
                AGI Assistant
              </ControlButtonPrimary>
            </div>
          </div>
        )}

        {/* Roadmap Canvas */}
        <div className="flex-1 overflow-auto relative">
          <div
            ref={canvasRef}
            className="roadmap-canvas min-w-full"
            style={{
              padding: isMobile ? '16px 8px' : '32px',
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top left',
              transition: 'transform 300ms ease-out',
            }}
          >
            {/* Timeline/Chapter Bar - Hidden on Mobile */}
            {!isMobile && roadmap.totalChapters && roadmap.currentChapter && (
              <div className="mb-12">
                <div className="mb-6">
                  <TimelineBar
                    totalChapters={roadmap.totalChapters}
                    currentChapter={roadmap.currentChapter}
                    progress={roadmap.progress}
                    onChapterClick={(chapter) => console.log('Chapter:', chapter)}
                  />
                </div>

                <div className="flex justify-between items-start px-8">
                  {/* Render chapter markers dynamically based on data */}
                  {Array.from({ length: roadmap.totalChapters }, (_, i) => {
                    const chapterNum = i + 1;
                    if (chapterNum < roadmap.currentChapter!) {
                      return <ChapterMarkerCompleted key={chapterNum} chapterNumber={chapterNum} label={`Chapter ${chapterNum}`} />;
                    } else if (chapterNum === roadmap.currentChapter) {
                      return <ChapterMarkerCurrent key={chapterNum} chapterNumber={chapterNum} label={roadmap.chapterTitle || `Chapter ${chapterNum}`} />;
                    } else {
                      return <ChapterMarkerLocked key={chapterNum} chapterNumber={chapterNum} label={`Chapter ${chapterNum}`} />;
                    }
                  })}
                </div>
              </div>
            )}

            {/* Branch Lanes */}
            <div className="space-y-6">
              {roadmap.branches.map((branch, branchIndex) => {
                const isVisible = activeFilters.includes(branch.id);
                if (!isVisible) return null;

                return (
                  <BranchLane
                    key={branch.id}
                    label={branch.label}
                    color={branch.color}
                    nodeCount={branch.nodes.length}
                    isCollapsed={collapsedBranches.includes(branch.id)}
                    onToggleCollapse={() => {
                      if (collapsedBranches.includes(branch.id)) {
                        setCollapsedBranches(collapsedBranches.filter(id => id !== branch.id));
                      } else {
                        setCollapsedBranches([...collapsedBranches, branch.id]);
                      }
                    }}
                  >
                    <div className="relative">
                      <BranchNodeContainer>
                        {/* Mobile: Vertical Stack, Desktop: Horizontal Row */}
                        <div className={isMobile ? "flex flex-col gap-4" : "flex items-center gap-6"}>
                          {branch.nodes.map((node, nodeIndex) => (
                            <React.Fragment key={node.id}>
                              <DraggableNode
                                id={node.id}
                                index={nodeIndex}
                                branchId={branch.id}
                                isCompleted={node.state === 'completed'}
                                onMove={handleMoveNode}
                                onToggleComplete={handleToggleNodeComplete}
                              >
                                {renderNode(node, branch.color)}
                              </DraggableNode>

                              {/* Desktop: Horizontal connector, Mobile: Vertical connector */}
                              {nodeIndex < branch.nodes.length - 1 && (
                                <div className="flex-shrink-0">
                                  {!isMobile ? (
                                    <BranchDependencyLine
                                      active={node.state === 'completed'}
                                      animated={node.state === 'active'}
                                      color={branch.color}
                                    />
                                  ) : (
                                    <div
                                      className="w-full h-8 flex items-center justify-center"
                                      style={{
                                        borderLeft: `2px ${node.state === 'completed' ? 'solid' : 'dashed'} ${branch.color}`,
                                        marginLeft: '50%',
                                      }}
                                    />
                                  )}
                                </div>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </BranchNodeContainer>
                    </div>
                  </BranchLane>
                );
              })}
            </div>

            <div className="h-24" />
          </div>
        </div>

        {/* Zoom Controls - Hidden on Mobile */}
        {!isMobile && (
          <div className="absolute bottom-24 right-8 z-40">
            <ControlZoomControls
              currentZoom={zoom}
              minZoom={50}
              maxZoom={200}
              onZoomIn={() => setZoom(Math.min(200, zoom + 25))}
              onZoomOut={() => setZoom(Math.max(50, zoom - 25))}
              onReset={() => setZoom(100)}
            />
          </div>
        )}
      </div>

      {/* Quick Wins Overlay */}
      <QuickWinsRootOverlay 
        isOpen={quickWinsOpen}
        onClose={() => setQuickWinsOpen(false)}
      />

      {/* Mobile Progress Bar */}
      {isMobile && (
        <MobileProgressBar
          progress={roadmap.progress}
          totalXP={masteryData?.totalXP || 0}
          completedNodes={roadmap.completedNodes}
          totalNodes={roadmap.totalNodes}
          currentStageLabel={roadmap.chapterTitle || `Chapter ${roadmap.currentChapter}`}
        />
      )}

      {/* Desktop XP Strip */}
      {!isMobile && (
        <div
          className="roadmap-xp-strip fixed bottom-0 left-0 right-0 h-16 flex items-center justify-between px-8 z-50"
          style={{
            background: 'linear-gradient(135deg, rgba(242, 201, 76, 0.15) 0%, rgba(255, 235, 150, 0.12) 100%)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            borderTop: '2px solid rgba(242, 201, 76, 0.3)',
            boxShadow: '0 -4px 12px rgba(242, 201, 76, 0.15), inset 0 1px 2px rgba(255, 255, 255, 0.3)',
          }}
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div
                className="size-12 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(242, 201, 76, 0.3), rgba(255, 220, 120, 0.25))',
                  border: '2px solid rgba(242, 201, 76, 0.5)',
                  boxShadow: '0 4px 12px rgba(242, 201, 76, 0.3)',
                }}
              >
                <Zap className="size-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-yellow-700 uppercase tracking-wide">
                  Total XP Earned
                </p>
                <p className="text-2xl font-bold text-yellow-800">
                  {masteryData?.totalXP.toLocaleString() || 0}
                </p>
              </div>
            </div>

            <div
              className="w-px h-8 mx-2"
              style={{
                background: 'linear-gradient(180deg, transparent 0%, rgba(242, 201, 76, 0.3) 50%, transparent 100%)',
              }}
            />

            <div className="flex items-center gap-2">
              <div className="text-center">
                <p className="text-xs text-yellow-700">Completed</p>
                <p className="text-lg font-bold text-yellow-800">{roadmap.completedNodes}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-yellow-700">Active</p>
                <p className="text-lg font-bold text-blue-700">{roadmap.activeNodes}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-yellow-700">Remaining</p>
                <p className="text-lg font-bold text-slate-600">
                  {roadmap.totalNodes - roadmap.completedNodes}
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 max-w-md mx-8">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-yellow-700">
                  {roadmap.chapterTitle || `Chapter ${roadmap.currentChapter}`}
                </span>
                <span className="font-bold text-yellow-800">{Math.round(roadmap.progress)}%</span>
              </div>
              <div
                className="h-3 rounded-full overflow-hidden"
                style={{
                  background: 'rgba(242, 201, 76, 0.15)',
                  border: '1px solid rgba(242, 201, 76, 0.3)',
                }}
              >
                <div
                  className="h-full transition-all duration-700 ease-out"
                  style={{
                    width: `${roadmap.progress}%`,
                    background: 'linear-gradient(90deg, rgba(242, 201, 76, 0.8), rgba(39, 209, 124, 0.7))',
                    boxShadow: '0 0 12px rgba(242, 201, 76, 0.5)',
                  }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ControlButtonSecondary size="sm" icon={<Share2 />}>
              Export
            </ControlButtonSecondary>
            <ControlButtonPrimary 
              variant="orange" 
              size="sm" 
              icon={<Zap />}
              onClick={() => setQuickWinsOpen(true)}
            >
              Quick Wins
            </ControlButtonPrimary>
            <ControlButtonPrimary 
              variant="yellow" 
              size="sm" 
              icon={<Trophy />}
              onClick={() => navigate('/mastery')}
            >
              View Mastery
            </ControlButtonPrimary>
            <ControlButtonPrimary variant="blue" size="sm" icon={<Plus />}>
              Add Node
            </ControlButtonPrimary>
          </div>
        </div>
      )}
    </div>
    </DndProvider>
  );
}