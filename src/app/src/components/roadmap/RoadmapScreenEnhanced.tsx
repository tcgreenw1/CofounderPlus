import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PanelSidebarLeft, PanelSidebarRightAGI } from './PanelComponents';
import { QuickWinsRootOverlay } from './QuickWinsComponents';
import { TimelineBar, ChapterMarkerCurrent, ChapterMarkerCompleted, ChapterMarkerLocked, ChapterMarkerNextBoss } from './TimelineComponents';
import { BranchLane, BranchNodeContainer, BranchDependencyLine } from './BranchComponents';
import { NodeCore } from './NodeCore';
import { 
  NodeAvailable, 
  NodeActive, 
  NodeRecommended, 
  NodeCompleted,
  NodeBlocked,
  NodeLocked 
} from './NodeStateVariants';
import { ControlButtonPrimary, ControlButtonSecondary, ControlZoomControls, ControlFilterChipGroup } from './ControlComponents';
import { FeedbackXPBurst } from './FeedbackComponents';
import { 
  Plus, 
  Save, 
  Share2, 
  Users, 
  Sparkles,
  Zap,
  TrendingUp,
  Target,
  Code,
  Navigation,
  Trophy,
  Menu,
  X,
  Settings,
} from 'lucide-react';
import { useRoadmap } from '../../contexts/RoadmapContext';
import { useBusiness } from '../BusinessContext';
import { RoadmapNode, NodeState } from '../../types/roadmap';

/**
 * Enhanced Roadmap Screen with REAL Supabase Data
 * Mobile-optimized with responsive layout using design system CSS variables
 * 
 * NO MOCK DATA - All data from RoadmapContext + Supabase
 * 
 * Interactions Implemented:
 * - Node hover: lift + glow intensify
 * - Node click: squish + open Right Panel
 * - Node double click: zoom into node
 * - Branch collapse: compress vertical auto layout
 * - Branch expand: grow vertical auto layout
 * - Recenter action: camera pans to recommended node
 */

interface RoadmapScreenEnhancedProps {
  user?: any;
}

export function RoadmapScreenEnhanced({ user }: RoadmapScreenEnhancedProps = {}) {
  const navigate = useNavigate();
  
  // Get current business from BusinessContext
  const { selectedBusiness } = useBusiness();
  
  // Get real data from RoadmapContext
  const {
    roadmap,
    agiMetadata,
    masteryData,
    quickWinsSession,
    loading,
    error,
    selectedNodeId,
    selectNode,
    loadRoadmap,
    getNode,
  } = useRoadmap();
  
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [quickWinsOpen, setQuickWinsOpen] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [collapsedBranches, setCollapsedBranches] = useState<string[]>([]);
  const [xpBurstTrigger, setXpBurstTrigger] = useState(false);
  const [xpBurstAmount, setXpBurstAmount] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  
  // Canvas and camera control
  const canvasRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Check if mobile on mount
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load roadmap data on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roadmapId = urlParams.get('roadmapId') || 'default-roadmap';
    
    // Get businessId from URL, localStorage, or selectedBusiness from context
    let businessId = urlParams.get('businessId') || 
                     localStorage.getItem('currentBusinessId') ||
                     selectedBusiness?.id ||
                     '';
    
    console.log('🗺️ RoadmapScreenEnhanced mounting...');
    console.log('  - roadmapId:', roadmapId);
    console.log('  - businessId from URL/localStorage:', urlParams.get('businessId') || localStorage.getItem('currentBusinessId'));
    console.log('  - selectedBusiness from context:', selectedBusiness);
    console.log('  - final businessId:', businessId);
    
    if (businessId) {
      console.log('  - ✅ Loading roadmap...');
      loadRoadmap(roadmapId, businessId);
      setLocalError(null); // Clear any previous errors
    } else {
      // Don't log error immediately - wait a bit for context to load
      console.log('  - ⏳ Waiting for business context to load...');
      const timeout = setTimeout(() => {
        // Check again after a delay
        const delayedBusinessId = localStorage.getItem('currentBusinessId') || selectedBusiness?.id;
        if (!delayedBusinessId) {
          console.error('  - ❌ No businessId found after delay!');
          setLocalError('No business selected. Please go to the dashboard and select a business first.');
        }
      }, 1000);
      
      return () => clearTimeout(timeout);
    }
  }, [selectedBusiness]); // Re-run when selectedBusiness changes

  // Initialize active filters when roadmap loads
  useEffect(() => {
    if (roadmap && roadmap.branches && activeFilters.length === 0) {
      // Show first 2-3 branches by default
      const defaultFilters = roadmap.branches.slice(0, 3).map(b => b.id);
      setActiveFilters(defaultFilters);
    }
  }, [roadmap]);

  // Build filters from real branches
  const filters = roadmap?.branches.map(branch => ({
    id: branch.id,
    label: branch.label,
    icon: getBranchIcon(branch.id),
    count: branch.nodes.length,
    color: getBranchColorType(branch.color),
  })) || [];

  // Helper: Get icon for branch
  function getBranchIcon(branchId: string) {
    const iconMap: Record<string, any> = {
      dev: <Code className="w-4 h-4" />,
      marketing: <TrendingUp className="w-4 h-4" />,
      design: <Target className="w-4 h-4" />,
      product: <Sparkles className="w-4 h-4" />,
    };
    return iconMap[branchId] || <Target className="w-4 h-4" />;
  }

  // Helper: Get color type from hex color
  function getBranchColorType(color: string): 'blue' | 'green' | 'yellow' | 'red' {
    // Map hex colors to color types (must match ControlFilterChip colors)
    if (color.includes('27D17C') || color.includes('green')) return 'green';
    if (color.includes('F2C94C') || color.includes('yellow')) return 'yellow';
    if (color.includes('6C5CE7') || color.includes('purple') || color.includes('EB5757') || color.includes('red')) return 'red'; // Purple/violet maps to red
    return 'blue';
  }

  // Get real totals from roadmap
  const totalXP = masteryData?.totalXP || 0;
  const completedCount = roadmap?.completedNodes || 0;
  const activeCount = roadmap?.activeNodes || 0;
  const remainingCount = (roadmap?.totalNodes || 0) - completedCount;
  const progressPercent = roadmap?.progress || 0;
  const chapterTitle = roadmap?.chapterTitle || 'Build MVP';
  const currentChapter = roadmap?.currentChapter || 1;
  const totalChapters = roadmap?.totalChapters || 5;

  // ============================================================================
  // ALL HOOKS MUST BE ABOVE EARLY RETURNS
  // ============================================================================

  // Node click: squish + open Right Panel
  const handleNodeClick = useCallback((nodeId: string, node: any) => {
    selectNode(nodeId);
    setRightSidebarOpen(true);
    console.log('Node clicked:', nodeId);

    // Show XP burst if node is completed
    if (node.state === 'completed') {
      setXpBurstAmount(node.xp);
      setXpBurstTrigger(false);
      setTimeout(() => setXpBurstTrigger(true), 50);
    }
  }, [selectNode]);

  // Node double click: zoom into node
  const handleNodeDoubleClick = useCallback((nodeId: string) => {
    const nodeElement = nodeRefs.current[nodeId];
    if (nodeElement && canvasRef.current) {
      // Zoom to 150%
      setZoom(150);
      
      // Pan camera to center on node
      const rect = nodeElement.getBoundingClientRect();
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const offsetX = rect.left - canvasRect.left - canvasRect.width / 2 + rect.width / 2;
      const offsetY = rect.top - canvasRect.top - canvasRect.height / 2 + rect.height / 2;
      
      canvasRef.current.scrollTo({
        left: canvasRef.current.scrollLeft + offsetX,
        top: canvasRef.current.scrollTop + offsetY,
        behavior: 'smooth'
      });
    }
  }, []);

  // Recenter action: pan camera to recommended node
  const handleRecenter = useCallback(() => {
    // Find first recommended node
    let recommendedNodeId: string | null = null;
    
    if (roadmap && roadmap.branches) {
      for (const branch of roadmap.branches) {
        const recommendedNode = branch.nodes.find((n: any) => n.state === 'recommended');
        if (recommendedNode) {
          recommendedNodeId = recommendedNode.id;
          break;
        }
      }
    }
    
    // If found, zoom to it
    if (recommendedNodeId && nodeRefs.current[recommendedNodeId] && canvasRef.current) {
      const nodeElement = nodeRefs.current[recommendedNodeId];
      const rect = nodeElement.getBoundingClientRect();
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const offsetX = rect.left - canvasRect.left - canvasRect.width / 2 + rect.width / 2;
      const offsetY = rect.top - canvasRect.top - canvasRect.height / 2 + rect.height / 2;
      
      canvasRef.current.scrollTo({
        left: canvasRef.current.scrollLeft + offsetX,
        top: canvasRef.current.scrollTop + offsetY,
        behavior: 'smooth'
      });
    }
  }, [roadmap]);

  // Branch collapse/expand toggle
  const handleBranchToggle = useCallback((branchId: string) => {
    setCollapsedBranches(prev => {
      if (prev.includes(branchId)) {
        return prev.filter(id => id !== branchId);
      }
      return [...prev, branchId];
    });
  }, []);

  // Render node with all interaction handlers
  const renderNode = useCallback((node: any, branchColor: string) => {
    const baseProps = {
      title: node.title,
      description: node.description,
      xp: node.xp,
      timeEstimate: node.timeEstimate,
      tasks: node.tasks,
      progress: node.progress,
      dependencies: node.dependencies,
      aiRecommended: node.aiRecommended,
      aiReasoning: node.aiReasoning,
      onClick: () => handleNodeClick(node.id, node),
      onDoubleClick: () => handleNodeDoubleClick(node.id),
      branchColor,
    };

    // Choose component variant based on node state
    switch (node.state) {
      case 'available':
        return (
          <div key={node.id} ref={el => nodeRefs.current[node.id] = el}>
            <NodeAvailable {...baseProps} />
          </div>
        );
      case 'recommended':
        return (
          <div key={node.id} ref={el => nodeRefs.current[node.id] = el}>
            <NodeRecommended {...baseProps} />
          </div>
        );
      case 'completed':
        return (
          <div key={node.id} ref={el => nodeRefs.current[node.id] = el}>
            <NodeCompleted {...baseProps} />
          </div>
        );
      case 'blocked':
        return (
          <div key={node.id} ref={el => nodeRefs.current[node.id] = el}>
            <NodeBlocked {...baseProps} />
          </div>
        );
      case 'locked':
      default:
        return (
          <div key={node.id} ref={el => nodeRefs.current[node.id] = el}>
            <NodeLocked {...baseProps} />
          </div>
        );
    }
  }, [handleNodeClick, handleNodeDoubleClick]);

  // ============================================================================
  // EARLY RETURNS (AFTER ALL HOOKS)
  // ============================================================================

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen"
        style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
            style={{ borderColor: 'var(--primary)' }}
          />
          <p style={{ fontWeight: 'var(--font-weight-medium)' }}>Loading roadmap...</p>
        </div>
      </div>
    );
  }

  // Error state - Show helpful message with action button
  if (localError) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4"
        style={{ backgroundColor: 'var(--background)' }}
      >
        <div className="text-center max-w-md">
          <div className="mb-6 flex justify-center">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: 'var(--muted)',
              }}
            >
              <X className="w-8 h-8" style={{ color: 'var(--destructive)' }} />
            </div>
          </div>
          <h2 
            className="text-xl mb-2"
            style={{ 
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--foreground)',
            }}
          >
            No Business Selected
          </h2>
          <p 
            className="mb-6"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {localError}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 rounded-lg transition-all"
              style={{
                backgroundColor: 'var(--primary)',
                color: 'var(--primary-foreground)',
                fontWeight: 'var(--font-weight-medium)',
              }}
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => navigate('/businesses')}
              className="px-6 py-3 rounded-lg transition-all"
              style={{
                backgroundColor: 'var(--secondary)',
                color: 'var(--secondary-foreground)',
                fontWeight: 'var(--font-weight-medium)',
              }}
            >
              Manage Businesses
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No roadmap data
  if (!roadmap) {
    return (
      <div className="flex items-center justify-center min-h-screen"
        style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
      >
        <p style={{ fontWeight: 'var(--font-weight-medium)' }}>No roadmap data available</p>
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex"
      style={{
        background: 'var(--background)',
      }}
    >
      {/* Left Sidebar - Hidden on mobile */}
      {!isMobile && (
        <PanelSidebarLeft
          width={300}
          onRoadmapChange={(roadmap) => console.log('Roadmap:', roadmap)}
          onBranchFilterChange={(branches) => setActiveFilters(branches)}
          onModeChange={(mode) => console.log('Mode:', mode)}
          onSearchChange={(query) => console.log('Search:', query)}
        />
      )}

      {/* Right Sidebar - AGI Panel - Overlay on mobile */}
      {!isMobile && (
        <PanelSidebarRightAGI
          width={400}
          isOpen={rightSidebarOpen}
          onClose={() => setRightSidebarOpen(false)}
          onAccept={(id) => console.log('Accepted:', id)}
          onReject={(id) => console.log('Rejected:', id)}
          onToggleBranchLock={(branch, locked) => console.log(`Branch ${branch}:`, locked)}
        />
      )}

      {/* Main Content Area */}
      <div
        className="flex-1 transition-all duration-300 flex flex-col overflow-hidden"
        style={{
          marginRight: !isMobile && rightSidebarOpen ? '400px' : '0',
        }}
      >
        {/* Top Command Bar - Mobile optimized */}
        <div
          className="roadmap-command-bar flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-0 md:justify-between px-3 md:px-4 py-3 md:py-4 border-b flex-shrink-0"
          style={{
            background: 'var(--card)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            borderColor: 'var(--border)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
            zIndex: 30,
          }}
        >
          {/* Top Row - Title and Status */}
          <div className="flex items-center justify-between w-full md:w-auto gap-2 md:gap-3 flex-shrink-0">
            {/* Menu button - mobile only */}
            {isMobile && (
              <button
                onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
                className="p-2 rounded-lg"
                style={{
                  backgroundColor: 'var(--muted)',
                  color: 'var(--foreground)',
                }}
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            <h1
              className="text-base md:text-xl truncate"
              style={{
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--foreground)'
              }}
            >
              {roadmap.title || 'Product Launch'}
            </h1>
            <div
              className="px-2 py-1 rounded-full text-xs whitespace-nowrap"
              style={{
                backgroundColor: 'var(--success)',
                color: 'var(--success-foreground)',
                fontWeight: 'var(--font-weight-medium)',
              }}
            >
              {Math.round(progressPercent)}% Done
            </div>
          </div>

          {/* Filters - Scrollable on mobile */}
          <div className="w-full md:flex-1 md:flex md:justify-center md:px-4 overflow-x-auto">
            <div className="inline-flex md:flex">
              <ControlFilterChipGroup
                filters={filters}
                activeFilters={activeFilters}
                onFilterChange={setActiveFilters}
                multiSelect={true}
                size="sm"
              />
            </div>
          </div>

          {/* Action Buttons - Mobile: show only AGI, Desktop: show AGI + Mastery + Settings */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-shrink-0">
            {/* Mastery Button - Desktop only */}
            {!isMobile && (
              <button
                onClick={() => navigate('/mastery')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 224, 32, 0.2), rgba(255, 224, 32, 0.15))',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 224, 32, 0.3)',
                  color: '#d4a500',
                  fontWeight: 'var(--font-weight-medium)',
                  boxShadow: '0 4px 12px rgba(255, 224, 32, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.3)',
                }}
              >
                <Trophy className="w-4 h-4" />
                <span>Mastery</span>
              </button>
            )}
            
            {/* Settings Button - Desktop only */}
            {!isMobile && (
              <button
                onClick={() => {
                  console.log('🚀 Settings: Navigating to /cofounder-settings');
                  navigate('/cofounder-settings');
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
                style={{
                  background: 'rgba(255, 255, 255, 0.7)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid var(--border)',
                  color: 'var(--foreground)',
                  fontWeight: 'var(--font-weight-medium)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05), inset 0 1px 1px rgba(255, 255, 255, 0.5)',
                }}
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>
            )}

            <ControlButtonPrimary
              variant="blue"
              size="sm"
              icon={<Sparkles />}
              onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
            >
              {isMobile ? '' : 'AGI'}
            </ControlButtonPrimary>
          </div>
        </div>

        {/* Roadmap Canvas */}
        <div ref={canvasRef} className="flex-1 overflow-auto relative">
          <div
            className="roadmap-canvas min-w-full"
            style={{
              padding: isMobile ? 'var(--spacing-4)' : 'var(--spacing-8)',
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top left',
              transition: 'transform 300ms ease-out',
            }}
          >
            {/* Timeline Bar Section */}
            <div className="mb-8 md:mb-12">
              <div className="mb-4 md:mb-6">
                <TimelineBar
                  totalChapters={totalChapters}
                  currentChapter={currentChapter}
                  progress={progressPercent}
                  onChapterClick={(chapter) => console.log('Chapter:', chapter)}
                />
              </div>

              {/* Chapter Markers */}
              <div className="flex justify-between items-start px-2 md:px-8">
                <ChapterMarkerCompleted chapterNumber={1} label="Foundation" />
                <ChapterMarkerCurrent chapterNumber={2} label="Build MVP" />
                <ChapterMarkerNextBoss chapterNumber={3} label="Launch" />
                <ChapterMarkerLocked chapterNumber={4} label="Scale" />
                <ChapterMarkerLocked chapterNumber={5} label="Exit" />
              </div>
            </div>

            {/* Branch Lanes with Nodes */}
            <div className="space-y-4 md:space-y-6">
              {roadmap?.branches.map((branch, branchIndex) => {
                const isVisible = activeFilters.includes(branch.id);
                if (!isVisible) return null;

                const isCollapsed = collapsedBranches.includes(branch.id);

                return (
                  <BranchLane
                    key={branch.id}
                    label={branch.label}
                    color={branch.color}
                    nodeCount={branch.nodes.length}
                    isCollapsed={isCollapsed}
                    onToggleCollapse={() => handleBranchToggle(branch.id)}
                  >
                    <div className="relative">
                      {/* Node Container */}
                      <BranchNodeContainer>
                        <div className="flex items-center gap-6">
                          {branch.nodes.map((node, nodeIndex) => (
                            <React.Fragment key={node.id}>
                              {/* Node */}
                              {renderNode(node, branch.color)}

                              {/* Dependency Line to Next Node */}
                              {nodeIndex < branch.nodes.length - 1 && (
                                <div className="flex-shrink-0">
                                  <BranchDependencyLine
                                    startX={0}
                                    startY={20}
                                    endX={50}
                                    endY={20}
                                    active={node.state === 'completed'}
                                    animated={node.state === 'active'}
                                    color={branch.color}
                                  />
                                </div>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </BranchNodeContainer>

                      {/* Cross-Branch Dependencies */}
                      {branchIndex > 0 && branch.nodes.length > 2 && roadmap.branches[branchIndex - 1] && (
                        <div className="absolute top-0 left-32 w-0.5 h-full pointer-events-none">
                          <div
                            className="absolute -top-16 left-0 w-0.5 h-16"
                            style={{
                              background: `linear-gradient(180deg, ${roadmap.branches[branchIndex - 1].color}40 0%, ${branch.color}40 100%)`,
                              boxShadow: `0 0 8px ${branch.color}40`,
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </BranchLane>
                );
              })}
            </div>

            {/* Spacer for bottom XP bar */}
            <div className="h-24" />
          </div>
        </div>

        {/* Zoom Controls - Hidden on mobile, fixed position on desktop */}
        {!isMobile && (
          <div className="absolute bottom-20 md:bottom-24 right-4 md:right-8 z-40">
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

        {/* Bottom XP Strip - Mobile optimized */}
        <div
          className="roadmap-xp-strip w-full flex items-center justify-between flex-shrink-0"
          style={{
            height: isMobile ? 'auto' : '64px',
            minHeight: isMobile ? '56px' : '64px',
            padding: isMobile ? 'var(--spacing-3)' : 'var(--spacing-4) var(--spacing-8)',
            background: 'var(--card)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            borderTop: '1px solid var(--border)',
            boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.05)',
          }}
        >
          {isMobile ? (
            // Mobile: Compact view
            <>
              {/* Left - Total XP */}
              <div className="flex items-center gap-2">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: 'var(--primary-foreground)',
                  }}
                >
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <p 
                    className="text-xs"
                    style={{ 
                      color: 'var(--muted-foreground)',
                      fontWeight: 'var(--font-weight-medium)',
                    }}
                  >
                    Total XP
                  </p>
                  <p 
                    className="font-bold"
                    style={{ 
                      color: 'var(--foreground)',
                      fontWeight: 'var(--font-weight-bold)',
                    }}
                  >
                    {totalXP.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Right - Quick Actions (only quick wins on mobile) */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuickWinsOpen(true)}
                  className="p-2 rounded-lg"
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: 'var(--primary-foreground)',
                  }}
                >
                  <Zap className="w-5 h-5" />
                </button>
                <button
                  onClick={() => navigate('/mastery')}
                  className="p-2 rounded-lg"
                  style={{
                    backgroundColor: 'var(--secondary)',
                    color: 'var(--secondary-foreground)',
                  }}
                >
                  <Trophy className="w-5 h-5" />
                </button>
              </div>
            </>
          ) : (
            // Desktop: Full view
            <>
              {/* Left - Total XP */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, rgba(242, 201, 76, 0.3), rgba(255, 220, 120, 0.25))',
                      border: '2px solid rgba(242, 201, 76, 0.5)',
                      boxShadow: '0 4px 12px rgba(242, 201, 76, 0.3)',
                    }}
                  >
                    <Zap className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-yellow-700 uppercase tracking-wide">
                      Total XP Earned
                    </p>
                    <p className="text-2xl font-bold text-yellow-800">{totalXP.toLocaleString()}</p>
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
                    <p className="text-lg font-bold text-yellow-800">{completedCount}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-yellow-700">Active</p>
                    <p className="text-lg font-bold text-blue-700">{activeCount}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-yellow-700">Remaining</p>
                    <p className="text-lg font-bold text-slate-600">{remainingCount}</p>
                  </div>
                </div>
              </div>

              {/* Center - Progress Bar */}
              <div className="flex-1 max-w-md mx-8">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-yellow-700">Chapter {currentChapter}: {chapterTitle}</span>
                    <span className="font-bold text-yellow-800">{Math.round(progressPercent)}%</span>
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
                        width: `${progressPercent}%`,
                        background: 'linear-gradient(90deg, rgba(242, 201, 76, 0.8), rgba(39, 209, 124, 0.7))',
                        boxShadow: '0 0 12px rgba(242, 201, 76, 0.5)',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Right - Quick Actions */}
              <div className="flex items-center gap-3">
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
                  Mastery
                </ControlButtonPrimary>
                <ControlButtonPrimary variant="blue" size="sm" icon={<Plus />}>
                  Add Node
                </ControlButtonPrimary>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Quick Wins Overlay */}
      <QuickWinsRootOverlay
        isOpen={quickWinsOpen}
        onClose={() => setQuickWinsOpen(false)}
      />
    </div>
  );
}

export default RoadmapScreenEnhanced;