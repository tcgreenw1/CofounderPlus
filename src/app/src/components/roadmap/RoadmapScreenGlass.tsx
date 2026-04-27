import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassRoadmapNode } from './GlassRoadmapNode';
import { GlassSidebar } from './GlassSidebar';
import { GlassToolbar } from './GlassToolbar';
import { GlassStageRail } from './GlassStageRail';
import { GlassRoadmapSection, SectionType } from './GlassRoadmapSection';
import { useRoadmap } from '../../contexts/RoadmapContext';
import { useBusiness } from '../BusinessContext';
import { X, Trophy, Settings } from 'lucide-react';

// Import new AGI-enhanced components
import { AGIFloatingBubble } from './AGIFloatingBubble';
import { AGISmartPanel } from './AGISmartPanel';
import { EnhancedNodeCard } from './EnhancedNodeCard';
import { DynamicStageTimeline } from './DynamicStageTimeline';
import { QuickActionsFooter } from './QuickActionsFooter';
import { SmartXPBar } from './SmartXPBar';
import { MobileStageTimeline } from './MobileStageTimeline';
import { MobileRoadmapView } from './MobileRoadmapView';

/**
 * Roadmap Screen - Apple Liquid Glass Edition
 * 
 * Premium, unified design with:
 * - Floating glass sidebar
 * - Unified top toolbar
 * - Thin stage progress rail
 * - Glass roadmap nodes with consistent spacing
 * - Branch sections with color coding
 * 
 * Uses only Toy Box Pop colors: blue, green, yellow, red
 * All styling uses CSS variables from design system
 */

interface RoadmapScreenGlassProps {
  user?: any;
}

export function RoadmapScreenGlass({ user }: RoadmapScreenGlassProps = {}) {
  const navigate = useNavigate();
  
  // Get current business from BusinessContext
  const { selectedBusiness } = useBusiness();
  
  // Get real data from RoadmapContext
  const {
    roadmap,
    agiMetadata,
    masteryData,
    loading,
    error,
    selectedNodeId,
    selectNode,
    loadRoadmap,
  } = useRoadmap();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
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

  // Load roadmap data on mount
  useEffect(() => {
    const initRoadmap = async () => {
      setIsInitializing(true);
      
      const urlParams = new URLSearchParams(window.location.search);
      const roadmapId = urlParams.get('roadmapId') || 'default-roadmap';
      
      // Try multiple sources for businessId
      let businessId = urlParams.get('businessId') || 
                       localStorage.getItem('currentBusinessId') ||
                       selectedBusiness?.id ||
                       '';
      
      // If no businessId yet, wait a moment for BusinessContext to initialize
      if (!businessId) {
        await new Promise(resolve => setTimeout(resolve, 500));
        businessId = localStorage.getItem('currentBusinessId') || selectedBusiness?.id || '';
      }
      
      if (businessId) {
        try {
          await loadRoadmap(roadmapId, businessId);
          setLocalError(null);
        } catch (err: any) {
          console.error('Failed to load roadmap:', err);
          setLocalError('Failed to load roadmap. Please try refreshing the page.');
        }
      } else {
        setLocalError('No business selected. Please go to the dashboard and select a business first.');
      }
      
      setIsInitializing(false);
    };
    
    initRoadmap();
  }, [selectedBusiness?.id]); // Only re-run if selectedBusiness changes

  // Handlers
  const handleRecenter = useCallback(() => {
    console.log('Recenter clicked');
    // Could implement smooth scroll to recommended node
  }, []);

  const handleShare = useCallback(() => {
    console.log('Share clicked');
    // Implement share functionality
  }, []);

  const handleAGI = useCallback(() => {
    console.log('AGI clicked');
    // Open AGI panel
  }, []);

  const handleSave = useCallback(() => {
    console.log('Save clicked');
    // Save roadmap state
  }, []);

  const handleNodeClick = useCallback((nodeId: string) => {
    selectNode(nodeId);
    console.log('Node clicked:', nodeId);
  }, [selectNode]);

  // Map branch IDs to section types
  const getSectionType = (branchId: string): SectionType => {
    if (branchId.toLowerCase().includes('product') || branchId.toLowerCase().includes('dev')) {
      return 'product';
    }
    if (branchId.toLowerCase().includes('marketing')) {
      return 'marketing';
    }
    return 'sales';
  };

  // Map branch colors to Toy Box Pop colors
  const getBranchColor = (color: string): 'blue' | 'green' | 'yellow' | 'red' => {
    if (color.includes('27D17C') || color.includes('green')) return 'green';
    if (color.includes('F2C94C') || color.includes('yellow') || color.includes('ffe020')) return 'yellow';
    if (color.includes('6C5CE7') || color.includes('purple') || color.includes('EB5757') || color.includes('red')) return 'red';
    return 'blue';
  };

  // Loading state
  if (loading || isInitializing) {
    return (
      <div 
        className="flex items-center justify-center min-h-screen"
        style={{ 
          background: 'linear-gradient(135deg, #f0f4ff 0%, #e0f0ff 50%, #f0fff4 100%)',
        }}
      >
        <div className="text-center">
          <div 
            className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
            style={{ borderColor: '#2b7fff' }}
          />
          <p style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)' }}>
            Loading roadmap...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (localError) {
    return (
      <div 
        className="flex items-center justify-center min-h-screen p-4"
        style={{ 
          background: 'linear-gradient(135deg, #f0f4ff 0%, #e0f0ff 50%, #f0fff4 100%)',
        }}
      >
        <div className="text-center max-w-md">
          <div className="mb-6 flex justify-center">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--muted)' }}
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
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 rounded-lg transition-all"
            style={{
              backgroundColor: '#2b7fff',
              color: 'white',
              fontWeight: 'var(--font-weight-medium)',
            }}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // No roadmap data
  if (!roadmap) {
    return (
      <div 
        className="flex items-center justify-center min-h-screen"
        style={{ 
          background: 'linear-gradient(135deg, #f0f4ff 0%, #e0f0ff 50%, #f0fff4 100%)',
        }}
      >
        <p style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)' }}>
          No roadmap data available
        </p>
      </div>
    );
  }

  // Use mobile-specific view on mobile devices
  if (isMobile) {
    return <MobileRoadmapView />;
  }

  return (
    <div 
      className="relative overflow-auto pink-mode-roadmap-bg dark:bg-gradient-to-br dark:from-[#0a0f1a] dark:via-[#0d1521] dark:to-[#0a1410]"
      style={{
        background: 'linear-gradient(135deg, #f0f4ff 0%, #e0f0ff 50%, #f0fff4 100%)',
        minHeight: '100vh',
      }}
    >
      {/* AGI Floating Bubble */}
      <AGIFloatingBubble
        onClick={() => {
          // Toggle AGI panel open state
          setSidebarOpen(true);
        }}
        isOpen={sidebarOpen}
        hasNotification={agiMetadata?.recommendations && agiMetadata.recommendations.length > 0}
      />

      {/* AGI Smart Panel */}
      <AGISmartPanel
        isOpen={sidebarOpen && selectedNodeId === null}
        onClose={() => setSidebarOpen(false)}
        currentNodeId={selectedNodeId || undefined}
        onAskAboutNode={(nodeId) => selectNode(nodeId)}
      />

      {/* Top Right Action Buttons */}
      {window.innerWidth >= 768 && (
        <div 
          style={{
            position: 'fixed',
            top: 'var(--spacing-6)',
            right: 'var(--spacing-6)',
            zIndex: 40,
            display: 'flex',
            gap: 'var(--spacing-2)',
          }}
        >
          {/* Mastery Button */}
          <button
            onClick={() => navigate('/mastery-agi')}
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
          
          {/* Settings Button */}
          <button
            onClick={() => {
              console.log('🚀 RoadmapScreenGlass: Navigating to /cofounder-settings');
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
        </div>
      )}

      {/* Glass Sidebar */}
      <GlassSidebar
        isOpen={false}
        onClose={() => {}}
        currentPath="/roadmap"
      />

      {/* Main Content Container - 8-point grid system */}
      <div
        style={{
          maxWidth: '100%',
          // 16px outer margins on mobile, standard desktop padding
          paddingLeft: window.innerWidth < 768 ? 'var(--spacing-4)' : 'var(--spacing-6)',
          paddingRight: window.innerWidth < 768 ? 'var(--spacing-4)' : 'var(--spacing-6)',
          paddingTop: window.innerWidth < 768 ? 'var(--spacing-3)' : 'var(--spacing-6)', // 12px mobile, 24px desktop
          paddingBottom: window.innerWidth < 768 ? 'var(--spacing-2)' : 'var(--spacing-6)',
        }}
      >
        {/* Stage Timeline - Use new mobile-optimized component on mobile */}
        <div style={{ marginBottom: window.innerWidth < 768 ? 'var(--spacing-4)' : 'var(--spacing-6)' }}>
          {window.innerWidth < 768 ? (
            <MobileStageTimeline
              currentStage={roadmap.currentChapter || 0}
              stages={['Foundation', 'MVP', 'Launch', 'Scale', 'Exit']}
            />
          ) : (
            <GlassStageRail
              currentStage={roadmap.currentChapter || 0}
              stages={['Foundation', 'MVP', 'Launch', 'Scale', 'Exit']}
            />
          )}
        </div>

        {/* Chapter Title - Improved hierarchy */}
        <div 
          style={{
            textAlign: 'center',
            marginBottom: window.innerWidth < 768 ? 'var(--spacing-6)' : 'var(--spacing-8)', // 20px mobile, 32px desktop
          }}
        >
          <h1
            style={{
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--foreground)',
              fontSize: window.innerWidth < 768 ? '24px' : '32px',
              lineHeight: '1.3',
              marginBottom: 'var(--spacing-1)',
            }}
          >
            {roadmap.chapterTitle || 'Product Launch Roadmap'}
          </h1>
          <p
            style={{
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--muted-foreground)',
              fontSize: window.innerWidth < 768 ? '13px' : '14px',
            }}
          >
            Chapter {roadmap.currentChapter || 1} of {roadmap.totalChapters || 5}
          </p>
        </div>

        {/* Roadmap Branches - Professional spacing */}
        <div style={{ paddingBottom: window.innerWidth < 768 ? 'var(--spacing-4)' : 'var(--spacing-8)' }}>
          {roadmap.branches && roadmap.branches.length > 0 ? (
            roadmap.branches.map((branch) => {
              const sectionType = getSectionType(branch.id);
              const branchColor = getBranchColor(branch.color);
              
              return (
                <GlassRoadmapSection
                  key={branch.id}
                  type={sectionType}
                  label={branch.label}
                  nodeCount={branch.nodes.length}
                >
                  {branch.nodes.map((node: any) => (
                    <GlassRoadmapNode
                      key={node.id}
                      title={node.title}
                      description={node.description}
                      xp={node.xp}
                      timeEstimate={node.timeEstimate}
                      state={node.state}
                      branchColor={branchColor}
                      aiRecommended={node.aiRecommended}
                      onClick={() => handleNodeClick(node.id)}
                      onDoubleClick={() => console.log('Double click:', node.id)}
                    />
                  ))}
                </GlassRoadmapSection>
              );
            })
          ) : (
            <div className="text-center py-20">
              <p style={{ color: 'var(--muted-foreground)' }}>
                No branches available
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}