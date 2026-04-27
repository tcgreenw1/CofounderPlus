import React, { useState, useEffect, useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { 
  Sparkles, 
  Package, 
  TrendingUp, 
  DollarSign, 
  Users,
  Target,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { useRoadmap } from '../../contexts/RoadmapContext';
import { useBusiness } from '../BusinessContext';
import { useCredits } from '../../hooks/useCredits';
import { useNotifications } from '../../contexts/NotificationContext';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { getSupabaseClient } from '../../utils/supabase/client';
import { RoadmapActionBar } from './RoadmapActionBar';
import { DepartmentSection } from './DepartmentSection';
import { TaskCard } from './TaskCard';
import { DraggableTaskCard } from './DraggableTaskCard';
import { MobileStageTimeline } from './MobileStageTimeline';
import { MobileProgressBar } from './MobileProgressBar';
import { RoadmapAssessmentModal } from './RoadmapAssessmentModal';
import type { RoadmapNode, RoadmapBranch } from '../../types/roadmap';

/**
 * Mobile Roadmap View
 * - Standard app header (same as all other pages)
 * - Roadmap action bar positioned just below header
 * - Cofounder quick action button triggers AI roadmap analysis
 * - Collapsible department sections (default collapsed)
 * - Manual task completion with check circles
 * - Drag-and-drop sorting within departments
 * - Vertical stage timeline on left
 * - Bottom progress bar
 * 
 * Developer Notes - AI Endpoint Control:
 * The Cofounder AI interacts with the roadmap through these endpoints:
 * 
 * - POST /ai/roadmap/generate - Generate initial roadmap tasks for all departments
 * - POST /ai/roadmap/validate - Validate current task states and dependencies
 * - POST /ai/roadmap/refresh - Regenerate or expand tasks based on progress
 * - POST /ai/roadmap/advance-stage - Move user between stages (Foundation → MVP → Launch → Scale → Exit)
 * - POST /ai/roadmap/update-order - Persist user's drag-and-drop task order
 * - POST /ai/roadmap/mark-complete - Mark task as completed and update mastery
 * 
 * AI Capabilities:
 * - Generate tasks dynamically for all 5 departments
 * - Validate task completion and unlock dependencies
 * - Add/remove tasks based on business context
 * - Reorder tasks based on priority and dependencies
 * - Advance user through business stages
 * - Interpret user input (check-offs, reordering) as feedback
 * - Regenerate roadmap when Cofounder button is tapped
 */
export function MobileRoadmapView() {
  const {
    roadmap,
    masteryData,
    loading,
    error,
    updateNode,
    selectNode,
    loadRoadmap,
    currentRoadmapId,
    businessId,
  } = useRoadmap();

  const { selectedBusiness } = useBusiness();
  const { credits, deductCredits } = useCredits();
  const { addNotification } = useNotifications();

  const [collapsedDepartments, setCollapsedDepartments] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [localRoadmap, setLocalRoadmap] = useState(roadmap);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [assessmentData, setAssessmentData] = useState<any>(null);
  const [currentNotificationId, setCurrentNotificationId] = useState<string | null>(null);

  // Track active polling intervals to prevent multiple simultaneous refreshes
  const pollingIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const pollingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Detect touch device for DnD backend
  const isTouchDevice = 'ontouchstart' in window;
  const Backend = isTouchDevice ? TouchBackend : HTML5Backend;

  // Helper to get auth token
  const getAuthToken = async () => {
    const supabase = getSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || publicAnonKey;
  };

  // Sync local roadmap with context
  useEffect(() => {
    if (roadmap) {
      setLocalRoadmap(roadmap);
    }
  }, [roadmap]);

  // Initialize all departments as collapsed
  useEffect(() => {
    if (roadmap && collapsedDepartments.length === 0) {
      setCollapsedDepartments(roadmap.branches.map(b => b.id));
    }
  }, [roadmap]);

  // Cleanup polling intervals on component unmount
  useEffect(() => {
    return () => {
      // Clear any active polling when component unmounts
      if (pollingIntervalRef.current) {
        console.log('🧹 Cleaning up polling interval on unmount');
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      if (pollingTimeoutRef.current) {
        console.log('🧹 Cleaning up polling timeout on unmount');
        clearTimeout(pollingTimeoutRef.current);
        pollingTimeoutRef.current = null;
      }
    };
  }, []);

  // Handle department toggle
  const handleToggleDepartment = (departmentId: string) => {
    setCollapsedDepartments(prev =>
      prev.includes(departmentId)
        ? prev.filter(id => id !== departmentId)
        : [...prev, departmentId]
    );
  };

  // Handle task completion toggle
  const handleTaskCheck = async (taskId: string) => {
    const task = findTaskById(taskId);
    if (!task) return;

    const newState = task.state === 'completed' ? 'available' : 'completed';
    
    // Optimistic UI update - update local state immediately
    if (localRoadmap) {
      const updatedRoadmap = { ...localRoadmap };
      updatedRoadmap.branches = updatedRoadmap.branches.map(branch => {
        const taskIndex = branch.nodes.findIndex(n => n.id === taskId);
        if (taskIndex !== -1) {
          const updatedNodes = [...branch.nodes];
          updatedNodes[taskIndex] = {
            ...updatedNodes[taskIndex],
            state: newState,
            ...(newState === 'completed' ? { completedAt: new Date().toISOString() } : {}),
          };
          return { ...branch, nodes: updatedNodes };
        }
        return branch;
      });
      
      // Update completed nodes count
      if (newState === 'completed') {
        updatedRoadmap.completedNodes = (updatedRoadmap.completedNodes || 0) + 1;
      } else {
        updatedRoadmap.completedNodes = Math.max(0, (updatedRoadmap.completedNodes || 0) - 1);
      }
      
      // Apply optimistic update immediately
      setLocalRoadmap(updatedRoadmap);
    }
    
    // Then make the backend call in the background
    try {
      await updateNode(taskId, {
        state: newState,
        ...(newState === 'completed' ? { completedAt: new Date().toISOString() } : {}),
      });
      
      // Dispatch custom events for other components
      window.dispatchEvent(new CustomEvent('roadmapTaskCompleted', { 
        detail: { taskId, newState } 
      }));
      window.dispatchEvent(new CustomEvent('roadmapProgressUpdated'));
    } catch (error) {
      console.error('Failed to toggle task completion:', error);
      toast.error('Failed to update task. Please try again.');
      
      // Revert optimistic update on error
      if (localRoadmap) {
        const revertedRoadmap = { ...localRoadmap };
        revertedRoadmap.branches = revertedRoadmap.branches.map(branch => {
          const taskIndex = branch.nodes.findIndex(n => n.id === taskId);
          if (taskIndex !== -1) {
            const revertedNodes = [...branch.nodes];
            revertedNodes[taskIndex] = {
              ...revertedNodes[taskIndex],
              state: task.state, // Revert to original state
              completedAt: task.completedAt,
            };
            return { ...branch, nodes: revertedNodes };
          }
          return branch;
        });
        
        // Revert completed nodes count
        if (newState === 'completed') {
          revertedRoadmap.completedNodes = Math.max(0, (revertedRoadmap.completedNodes || 0) - 1);
        } else {
          revertedRoadmap.completedNodes = (revertedRoadmap.completedNodes || 0) + 1;
        }
        
        setLocalRoadmap(revertedRoadmap);
      }
    }
  };

  // Handle task reordering via drag-and-drop
  const handleMoveTask = useCallback((dragIndex: number, hoverIndex: number, departmentId: string) => {
    if (!localRoadmap) return;

    const branchIndex = localRoadmap.branches.findIndex(b => b.id === departmentId);
    if (branchIndex === -1) return;

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

    // Update local state immediately
    setLocalRoadmap(newRoadmap);

    // TODO: Persist to backend
    console.log('Task reordered:', { departmentId, dragIndex, hoverIndex });
  }, [localRoadmap]);

  // Handle roadmap refresh - triggers Cofounder AI analysis
  const handleRefreshRoadmap = async () => {
    if (!currentRoadmapId || !businessId || !selectedBusiness) {
      console.error('Cannot refresh: No roadmap ID, business ID, or selected business');
      toast.error('Unable to refresh roadmap');
      return;
    }

    // Prevent multiple simultaneous refreshes
    if (isRefreshing) {
      console.log('⚠️ Refresh already in progress, ignoring duplicate request');
      toast.info('Roadmap refresh already in progress');
      return;
    }

    // Check if there's already an active polling interval
    if (pollingIntervalRef.current) {
      console.log('⚠️ Active polling detected, clearing before starting new refresh');
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    if (pollingTimeoutRef.current) {
      console.log('⚠️ Active timeout detected, clearing before starting new refresh');
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }

    // Check credits
    if (credits < 1) {
      toast.error('You do not have enough credits. Please purchase more credits.');
      return;
    }
    
    setIsRefreshing(true);
    
    // Add local notification for immediate feedback
    addNotification({
      title: 'Roadmap Analysis Started',
      message: 'Cofounder is analyzing your roadmap...',
      type: 'info',
      category: 'operations'
    });
    
    try {
      console.log('🤖 Cofounder: Starting intelligent roadmap analysis...');
      const authToken = await getAuthToken();
      
      // Call the intelligent refresh endpoint
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/roadmap/intelligent-refresh`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            businessId: selectedBusiness.id,
            businessData: selectedBusiness,
            currentRoadmap: localRoadmap,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to refresh roadmap');
      }

      const data = await response.json();
      console.log('✅ Roadmap refresh started:', data);

      // Store the notification ID for later matching
      setCurrentNotificationId(data.notificationId);

      // Show success toast - processing in background
      toast.success('Roadmap refresh started! Analysis in progress...');
      
      // After 10 seconds, log all notifications for debugging
      setTimeout(async () => {
        try {
          const authToken = await getAuthToken();
          const notificationResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notifications/list`,
            {
              headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json',
              },
            }
          );
          if (notificationResponse.ok) {
            const notifData = await notificationResponse.json();
            console.log('🔍 DEBUG: All notifications after 10s:', notifData.notifications);
          }
        } catch (error) {
          console.error('Error fetching debug notifications:', error);
        }
      }, 10000);
      
      // Don't deduct credits here - will be deducted based on altered tasks count after completion

      // Poll for updates by checking the updatedAt timestamp
      let lastUpdatedAt = localRoadmap?.updatedAt;
      console.log('🔍 Starting to poll for roadmap updates. Last updated at:', lastUpdatedAt);
      
      const checkForUpdates = setInterval(async () => {
        console.log('📡 Polling for roadmap updates...');
        try {
          // Fetch roadmap data directly without triggering full context reload
          const authToken = await getAuthToken();
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/roadmap/structure/${currentRoadmapId}?businessId=${businessId}`,
            {
              headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json',
              },
            }
          );

          if (response.ok) {
            const updatedRoadmap = await response.json();
            console.log('📊 Roadmap check - Current updatedAt:', updatedRoadmap.updatedAt, 'Last known:', lastUpdatedAt);
            
            // Check if the roadmap has been updated
            if (updatedRoadmap.updatedAt && updatedRoadmap.updatedAt !== lastUpdatedAt) {
              console.log('🎉 Roadmap updated! Reloading...');
              lastUpdatedAt = updatedRoadmap.updatedAt;
              
              // Fetch the completion notification to get altered task count
              const notificationResponse = await fetch(
                `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notifications/list`,
                {
                  headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json',
                  },
                }
              );

              if (notificationResponse.ok) {
                const notifData = await notificationResponse.json();
                const notifications = notifData.notifications || [];
                
                // Find THIS SPECIFIC roadmap refresh notification by ID
                console.log('🔍 Looking for notification ID:', data.notificationId);
                const roadmapNotif = notifications.find((n: any) => 
                  n.id === data.notificationId
                );

                if (roadmapNotif && roadmapNotif.insights) {
                  console.log('✨ Found notification with insights:', roadmapNotif.insights);
                  
                  // Deduct credits if tasks were altered
                  if (roadmapNotif.insights.totalAlteredTasks > 0) {
                    const creditsToDeduct = roadmapNotif.insights.totalAlteredTasks * 5;
                    console.log(`💎 Deducting ${creditsToDeduct} credits for ${roadmapNotif.insights.totalAlteredTasks} altered tasks`);
                    deductCredits(creditsToDeduct);
                  }
                  
                  // ALWAYS show assessment modal - even if no tasks were altered
                  setAssessmentData(roadmapNotif.insights);
                  setShowAssessmentModal(true);
                } else {
                  console.log('⚠️ Notification found but no insights yet');
                }
              }
              
              // Only reload when we detect an actual change
              await loadRoadmap(currentRoadmapId, businessId);
              
              // Add completion notification locally
              addNotification({
                title: 'Roadmap Updated',
                message: 'Analysis complete. Roadmap has been updated.',
                type: 'success',
                category: 'operations'
              });
              
              // Stop polling after successful update
              clearInterval(checkForUpdates);
              setIsRefreshing(false);
              toast.success('Roadmap updated successfully!');
            }
          }
        } catch (error) {
          console.error('Error checking for roadmap updates:', error);
        }
      }, 3000);

      // Store the interval reference
      pollingIntervalRef.current = checkForUpdates;

      // Stop checking after 60 seconds and check for notifications
      const timeout = setTimeout(async () => {
        console.log('⏱️ Polling timeout reached - checking for error notification');
        clearInterval(checkForUpdates);
        setIsRefreshing(false);
        
        // Check if there's an error notification
        try {
          const authToken = await getAuthToken();
          const notificationResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notifications/list`,
            {
              headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json',
              },
            }
          );

          if (notificationResponse.ok) {
            const notifData = await notificationResponse.json();
            const notifications = notifData.notifications || [];
            console.log('📬 Notifications found:', notifications.length);
            
            // Find the roadmap refresh notification
            const roadmapNotif = notifications.find((n: any) => 
              n.type === 'roadmap_refresh' && n.id === data.notificationId
            );

            if (roadmapNotif) {
              console.log('📋 Roadmap notification status:', roadmapNotif.status);
              if (roadmapNotif.status === 'running') {
                toast.warning('Roadmap refresh is still processing. This may take a while for complex analyses.');
              } else if (roadmapNotif.status === 'unread' && roadmapNotif.insights) {
                // It completed but we missed the update - show the assessment
                setAssessmentData(roadmapNotif.insights);
                setShowAssessmentModal(true);
                
                if (roadmapNotif.insights.totalAlteredTasks > 0) {
                  const creditsToDeduct = roadmapNotif.insights.totalAlteredTasks * 5;
                  console.log(`💎 Deducting ${creditsToDeduct} credits for ${roadmapNotif.insights.totalAlteredTasks} altered tasks`);
                  deductCredits(creditsToDeduct);
                }
                
                // Force reload the roadmap
                await loadRoadmap(currentRoadmapId, businessId);
                toast.success('Roadmap updated successfully!');
              } else {
                toast.error(roadmapNotif.message || 'Roadmap refresh timed out');
              }
            } else {
              toast.warning('Roadmap refresh timed out. Please try again.');
            }
          }
        } catch (error) {
          console.error('Error checking timeout notification:', error);
          toast.error('Roadmap refresh timed out');
        }
      }, 60000);

      // Store the timeout reference
      pollingTimeoutRef.current = timeout;

    } catch (error: any) {
      console.error('❌ Roadmap refresh error:', error);
      toast.error(error.message || 'Failed to start roadmap refresh');
      setIsRefreshing(false);
    }
  };

  // Helper to find task by ID
  const findTaskById = (taskId: string): RoadmapNode | undefined => {
    if (!localRoadmap) return undefined;
    
    for (const branch of localRoadmap.branches) {
      const task = branch.nodes.find(n => n.id === taskId);
      if (task) return task;
    }
    return undefined;
  };

  // Get department icon
  const getDepartmentIcon = (label: string) => {
    const icons: Record<string, React.ReactNode> = {
      'Product': <Package className="size-5" />,
      'Marketing': <TrendingUp className="size-5" />,
      'Sales': <Target className="size-5" />,
      'Finance': <DollarSign className="size-5" />,
      'HR': <Users className="size-5" />,
    };
    return icons[label] || <Sparkles className="size-5" />;
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
          <p className="text-destructive mb-4">Error: {error}</p>
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

  // No roadmap
  if (!localRoadmap) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <p className="text-muted-foreground">No roadmap data available</p>
      </div>
    );
  }

  // Ensure Finance and HR departments exist in roadmap
  const allDepartments = ['Product', 'Marketing', 'Sales', 'Finance', 'HR'];
  const departmentColors: Record<string, string> = {
    'Product': '#9D4EDD',    // Purple
    'Marketing': '#27D17C',  // Green
    'Sales': '#F2C94C',      // Yellow
    'Finance': '#2F80FF',    // Blue
    'HR': '#FF6B9D',         // Red
  };

  // Create a complete list of departments, adding placeholders for missing ones
  const completeBranches = allDepartments.map(deptName => {
    const existing = localRoadmap.branches.find(b => b.label === deptName);
    if (existing) return existing;

    // Create placeholder department
    return {
      id: `dept-${deptName.toLowerCase()}`,
      label: deptName,
      color: departmentColors[deptName] || '#64748b',
      nodes: [],
    };
  });

  return (
    <DndProvider backend={Backend}>
      <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        {/* Roadmap Action Bar - Flush against app header with minimal 1px gap */}
        <div className="sticky top-0 z-40" style={{ marginTop: '1px' }}>
          <RoadmapActionBar
            onRefreshRoadmap={handleRefreshRoadmap}
            isRefreshing={isRefreshing}
          />
          
          {/* Cost Indicator - Subtle info banner */}
          <div 
            className="px-4 py-2 flex items-center justify-center gap-2"
            style={{
              background: 'linear-gradient(135deg, var(--muted, rgba(248, 252, 255, 0.8)) 0%, var(--card, rgba(255, 255, 255, 0.6)) 100%)',
              borderBottom: '1px solid var(--border, rgba(226, 232, 240, 0.4))',
            }}
          >
            <Sparkles className="size-3.5" style={{ color: 'var(--primary, #2F80FF)' }} />
            <span
              style={{
                fontSize: 'var(--text-xs, 12px)',
                fontWeight: 'var(--font-medium, 500)',
                color: 'var(--muted-foreground, #64748b)',
                letterSpacing: '-0.01em',
              }}
            >
              Cofounder costs 5 credits per task altered
            </span>
          </div>
        </div>

        {/* Vertical Stage Timeline (Left Side) */}
        <MobileStageTimeline
          currentStage={localRoadmap.currentChapter || 1}
          stages={[
            { 
              number: 1, 
              label: 'Foundation', 
              status: (localRoadmap.currentChapter || 1) > 1 ? 'completed' : (localRoadmap.currentChapter || 1) === 1 ? 'current' : 'locked' 
            },
            { 
              number: 2, 
              label: 'MVP', 
              status: (localRoadmap.currentChapter || 1) > 2 ? 'completed' : (localRoadmap.currentChapter || 1) === 2 ? 'current' : 'locked' 
            },
            { 
              number: 3, 
              label: 'Launch', 
              status: (localRoadmap.currentChapter || 1) > 3 ? 'completed' : (localRoadmap.currentChapter || 1) === 3 ? 'current' : 'locked' 
            },
            { 
              number: 4, 
              label: 'Scale', 
              status: (localRoadmap.currentChapter || 1) > 4 ? 'completed' : (localRoadmap.currentChapter || 1) === 4 ? 'current' : 'locked' 
            },
            { 
              number: 5, 
              label: 'Exit', 
              status: (localRoadmap.currentChapter || 1) === 5 ? 'current' : 'locked' 
            },
          ]}
          onStageClick={(stage) => console.log('Stage clicked:', stage)}
        />

        {/* Main Content - Department Sections with proper spacing */}
        <div
          className="pb-24 px-3"
          style={{
            marginLeft: '60px', // Account for vertical timeline
            paddingTop: '14px', // 14px margin under roadmap header to prevent collision
          }}
        >
          <div className="space-y-5">
            {completeBranches.map((department) => {
              const completedTasks = department.nodes.filter(n => n.state === 'completed').length;
              
              return (
                <DepartmentSection
                  key={department.id}
                  id={department.id}
                  title={department.label}
                  color={department.color}
                  icon={getDepartmentIcon(department.label)}
                  taskCount={department.nodes.length}
                  completedCount={completedTasks}
                  isCollapsed={collapsedDepartments.includes(department.id)}
                  onToggle={() => handleToggleDepartment(department.id)}
                >
                  {/* Task Cards with Drag-and-Drop */}
                  {department.nodes.map((task, index) => {
                    const taskStatus = task.state === 'completed' 
                      ? 'completed' 
                      : 'unlocked'; // All tasks are always unlocked, never locked

                    return (
                      <DraggableTaskCard
                        key={task.id}
                        id={task.id}
                        index={index}
                        departmentId={department.id}
                        canDrag={true} // All tasks can be dragged
                        onMove={handleMoveTask}
                      >
                        <TaskCard
                          id={task.id}
                          title={task.title}
                          description={task.description}
                          xpReward={task.xp}
                          timeEstimate={task.timeEstimate}
                          status={taskStatus}
                          departmentColor={department.color}
                          isAIGenerated={task.aiInserted || task.aiModified}
                          autoCompleted={task.metadata?.autoCompleted || false}
                          autoCompletedReason={task.metadata?.autoCompletedReason || ''}
                          onCheck={() => handleTaskCheck(task.id)}
                          onClick={() => selectNode(task.id)}
                        />
                      </DraggableTaskCard>
                    );
                  })}
                </DepartmentSection>
              );
            })}
          </div>
        </div>

        {/* Bottom Progress Bar */}
        <MobileProgressBar
          progress={localRoadmap.progress}
          totalXP={masteryData?.totalXP || 0}
          completedNodes={localRoadmap.completedNodes}
          totalNodes={localRoadmap.totalNodes}
          currentStageLabel={localRoadmap.chapterTitle || `Chapter ${localRoadmap.currentChapter}`}
        />

        {/* Assessment Modal */}
        {assessmentData && (
          <RoadmapAssessmentModal
            isOpen={showAssessmentModal}
            onClose={() => setShowAssessmentModal(false)}
            assessment={assessmentData}
          />
        )}
      </div>
    </DndProvider>
  );
}