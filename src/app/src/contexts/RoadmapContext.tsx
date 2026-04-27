import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { roadmapAPI } from '../utils/roadmapApi';
import {
  Roadmap,
  RoadmapNode,
  AGIMetadata,
  MasteryData,
  QuickWinsSession,
  RoadmapBranch,
  NodeState
} from '../types/roadmap';

interface RoadmapContextType {
  // Roadmap data
  roadmap: Roadmap | null;
  agiMetadata: AGIMetadata | null;
  masteryData: MasteryData | null;
  quickWinsSession: QuickWinsSession | null;
  
  // Loading states
  loading: boolean;
  error: string | null;
  
  // Current selections
  selectedNodeId: string | null;
  currentRoadmapId: string | null;
  businessId: string | null;
  
  // Actions
  loadRoadmap: (roadmapId: string, businessId: string) => Promise<void>;
  updateNode: (nodeId: string, updates: Partial<RoadmapNode>) => Promise<void>;
  updateAGI: (updates: Partial<AGIMetadata>) => Promise<void>;
  updateMastery: (updates: Partial<MasteryData>) => Promise<void>;
  updateQuickWins: (updates: Partial<QuickWinsSession>) => Promise<void>;
  completeQuickWin: (quickWinId: string, xpGained?: number) => Promise<void>;
  selectNode: (nodeId: string | null) => void;
  refreshAll: () => Promise<void>;
  
  // Helpers
  getNode: (nodeId: string) => RoadmapNode | undefined;
  getBranch: (branchId: string) => RoadmapBranch | undefined;
}

const RoadmapContext = createContext<RoadmapContextType | undefined>(undefined);

interface RoadmapProviderProps {
  children: ReactNode;
}

export function RoadmapProvider({ children }: RoadmapProviderProps) {
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [agiMetadata, setAgiMetadata] = useState<AGIMetadata | null>(null);
  const [masteryData, setMasteryData] = useState<MasteryData | null>(null);
  const [quickWinsSession, setQuickWinsSession] = useState<QuickWinsSession | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [currentRoadmapId, setCurrentRoadmapId] = useState<string | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);

  // Load full roadmap data
  const loadRoadmap = async (roadmapId: string, bId: string) => {
    setLoading(true);
    setError(null);
    setCurrentRoadmapId(roadmapId);
    setBusinessId(bId);
    
    try {
      console.log('🗺️ Loading roadmap:', roadmapId, 'for business:', bId);
      
      // Load all data in parallel with proper error handling
      const [roadmapData, agiData, masteryResponse] = await Promise.all([
        roadmapAPI.getRoadmapStructure(roadmapId, bId).catch(async (err) => {
          // If roadmap doesn't exist, create default one
          if (err.message.includes('404') || err.message.includes('not found') || err.message.includes('Roadmap not found')) {
            console.log('📝 No roadmap found, creating default roadmap structure...');
            const defaultRoadmap = {
              id: roadmapId,
              title: 'Product Launch Roadmap',
              description: 'Your business roadmap',
              businessId: bId,
              userId: '', // Will be set by server
              branches: [
                {
                  id: 'product',
                  label: 'Product',
                  color: '#6C5CE7',
                  icon: 'sparkles',
                  nodes: [
                    {
                      id: 'node-product-1',
                      title: 'Define MVP Features',
                      description: 'Identify core features for your minimum viable product',
                      branchId: 'product',
                      xp: 100,
                      timeEstimate: '2-3 hours',
                      state: 'available' as NodeState,
                      tasks: [],
                      progress: 0,
                      aiRecommended: true,
                      aiReasoning: 'Start by defining what features are essential for your first version',
                      order: 0,
                    },
                    {
                      id: 'node-product-2',
                      title: 'Create Product Mockups',
                      description: 'Design visual mockups of your product',
                      branchId: 'product',
                      xp: 150,
                      timeEstimate: '3-4 hours',
                      state: 'available' as NodeState,
                      tasks: [],
                      progress: 0,
                      dependencies: ['node-product-1'],
                      order: 1,
                    },
                    {
                      id: 'node-product-3',
                      title: 'Build Core Features',
                      description: 'Develop the essential features of your MVP',
                      branchId: 'product',
                      xp: 300,
                      timeEstimate: '1-2 weeks',
                      state: 'available' as NodeState,
                      tasks: [],
                      progress: 0,
                      dependencies: ['node-product-2'],
                      order: 2,
                    }
                  ],
                  order: 0,
                },
                {
                  id: 'marketing',
                  label: 'Marketing',
                  color: '#27D17C',
                  icon: 'trending-up',
                  nodes: [
                    {
                      id: 'node-marketing-1',
                      title: 'Define Target Audience',
                      description: 'Identify who your ideal customers are',
                      branchId: 'marketing',
                      xp: 100,
                      timeEstimate: '1-2 hours',
                      state: 'recommended' as NodeState,
                      tasks: [],
                      progress: 0,
                      aiRecommended: true,
                      aiReasoning: 'Understanding your audience is critical for effective marketing',
                      order: 0,
                    },
                    {
                      id: 'node-marketing-2',
                      title: 'Create Marketing Plan',
                      description: 'Develop a comprehensive marketing strategy',
                      branchId: 'marketing',
                      xp: 150,
                      timeEstimate: '2-3 hours',
                      state: 'available' as NodeState,
                      tasks: [],
                      progress: 0,
                      dependencies: ['node-marketing-1'],
                      order: 1,
                    }
                  ],
                  order: 1,
                },
                {
                  id: 'sales',
                  label: 'Sales',
                  color: '#F2C94C',
                  icon: 'dollar-sign',
                  nodes: [
                    {
                      id: 'node-sales-1',
                      title: 'Set Pricing Strategy',
                      description: 'Determine how much to charge for your product',
                      branchId: 'sales',
                      xp: 100,
                      timeEstimate: '1-2 hours',
                      state: 'available' as NodeState,
                      tasks: [],
                      progress: 0,
                      order: 0,
                    },
                    {
                      id: 'node-sales-2',
                      title: 'Create Sales Process',
                      description: 'Design your sales funnel and process',
                      branchId: 'sales',
                      xp: 150,
                      timeEstimate: '2-3 hours',
                      state: 'available' as NodeState,
                      tasks: [],
                      progress: 0,
                      dependencies: ['node-sales-1'],
                      order: 1,
                    }
                  ],
                  order: 2,
                }
              ],
              totalNodes: 7,
              completedNodes: 0,
              activeNodes: 0,
              progress: 0,
              currentChapter: 1,
              totalChapters: 5,
              chapterTitle: 'Foundation',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            
            const created = await roadmapAPI.updateRoadmapStructure(roadmapId, bId, defaultRoadmap);
            console.log('✅ Default roadmap created successfully');
            return created;
          }
          console.error('❌ Error fetching roadmap:', err.message);
          throw err;
        }),
        roadmapAPI.getAGIMetadata(roadmapId, bId).catch(async (err) => {
          // If AGI metadata doesn't exist, create default
          if (err.message.includes('404') || err.message.includes('not found')) {
            console.log('📝 No AGI metadata found, creating default...');
            const defaultAGI = {
              roadmapId,
              businessId: bId,
              latestReasoning: 'AI is analyzing your roadmap to provide smart recommendations',
              changeLogs: [],
              recommendations: [
                {
                  id: 'rec-1',
                  priority: 'high' as const,
                  nodeId: 'node-product-1',
                  nodeName: 'Define MVP Features',
                  category: 'Product',
                  explanation: 'Start by defining your MVP features to establish a clear product vision',
                  expectedImpact: 'Sets foundation for all product development',
                  timestamp: new Date().toISOString(),
                }
              ],
              risks: [],
              masterToggle: true,
              lastAGIRun: new Date().toISOString(),
            };
            const created = await roadmapAPI.updateAGIMetadata(roadmapId, bId, defaultAGI);
            console.log('✅ Default AGI metadata created');
            return created;
          }
          console.error('❌ Error fetching AGI metadata:', err.message);
          throw err;
        }),
        roadmapAPI.getMasteryData(roadmapId, bId).catch(async (err) => {
          // If mastery data doesn't exist, create default
          if (err.message.includes('404') || err.message.includes('not found')) {
            console.log('📝 No mastery data found, creating default...');
            const defaultMastery = {
              roadmapId,
              businessId: bId,
              userId: '', // Will be set by server
              totalXP: 0,
              currentLevel: 1,
              levelProgress: 0,
              maxXPForLevel: 1000,
              domains: [
                { domain: 'Product', level: 0, xp: 0, color: '#6C5CE7' },
                { domain: 'Marketing', level: 0, xp: 0, color: '#27D17C' },
                { domain: 'Sales', level: 0, xp: 0, color: '#F2C94C' },
                { domain: 'Finance', level: 0, xp: 0, color: '#2B7FFF' },
                { domain: 'Ops', level: 0, xp: 0, color: '#FF6B6B' },
                { domain: 'HR', level: 0, xp: 0, color: '#A855F7' },
              ],
              recentGains: [],
              badges: [],
              totalBadges: 0,
              unlockedBadges: 0,
              lastUpdated: new Date().toISOString(),
            };
            const created = await roadmapAPI.updateMasteryData(roadmapId, bId, defaultMastery);
            console.log('✅ Default mastery data created');
            return created;
          }
          console.error('❌ Error fetching mastery data:', err.message);
          throw err;
        })
      ]);
      
      setRoadmap(roadmapData);
      setAgiMetadata(agiData);
      setMasteryData(masteryResponse);
      
      // Try to load quick wins (may not exist - that's okay)
      try {
        const quickWinsData = await roadmapAPI.getQuickWinsSession(roadmapId, bId);
        setQuickWinsSession(quickWinsData);
        console.log('✅ Quick wins session loaded');
      } catch (err: any) {
        // No active quick wins session - that's okay, it's optional
        // Don't log as error since this is expected when no session exists
        console.log('ℹ️ No active quick wins session (this is normal)');
        setQuickWinsSession(null);
      }
      
      console.log('✅ Roadmap data loaded successfully');
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to load roadmap data';
      setError(errorMsg);
      console.error('❌ Error loading roadmap:', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Update a node
  const updateNode = async (nodeId: string, updates: Partial<RoadmapNode>) => {
    if (!currentRoadmapId || !businessId) {
      throw new Error('No active roadmap');
    }
    
    try {
      const response = await roadmapAPI.updateNode(currentRoadmapId, nodeId, businessId, updates);
      setRoadmap(response.roadmap);
      console.log('✅ Node updated:', nodeId);
    } catch (err: any) {
      setError(err.message || 'Failed to update node');
      console.error('Error updating node:', err);
      throw err;
    }
  };

  // Update AGI metadata
  const updateAGI = async (updates: Partial<AGIMetadata>) => {
    if (!currentRoadmapId || !businessId) {
      throw new Error('No active roadmap');
    }
    
    try {
      const updated = await roadmapAPI.updateAGIMetadata(currentRoadmapId, businessId, updates);
      setAgiMetadata(updated);
      console.log('✅ AGI metadata updated');
    } catch (err: any) {
      setError(err.message || 'Failed to update AGI metadata');
      console.error('Error updating AGI:', err);
      throw err;
    }
  };

  // Update mastery data
  const updateMastery = async (updates: Partial<MasteryData>) => {
    if (!currentRoadmapId || !businessId) {
      throw new Error('No active roadmap');
    }
    
    try {
      const updated = await roadmapAPI.updateMasteryData(currentRoadmapId, businessId, updates);
      setMasteryData(updated);
      console.log('✅ Mastery data updated');
    } catch (err: any) {
      setError(err.message || 'Failed to update mastery data');
      console.error('Error updating mastery:', err);
      throw err;
    }
  };

  // Update quick wins session
  const updateQuickWins = async (updates: Partial<QuickWinsSession>) => {
    if (!currentRoadmapId || !businessId) {
      throw new Error('No active roadmap');
    }
    
    try {
      const updated = await roadmapAPI.updateQuickWinsSession(currentRoadmapId, businessId, updates);
      setQuickWinsSession(updated);
      console.log('✅ Quick wins session updated');
    } catch (err: any) {
      setError(err.message || 'Failed to update quick wins session');
      console.error('Error updating quick wins:', err);
      throw err;
    }
  };

  // Complete a quick win
  const completeQuickWin = async (quickWinId: string, xpGained?: number) => {
    if (!currentRoadmapId || !businessId) {
      throw new Error('No active roadmap');
    }
    
    try {
      const response = await roadmapAPI.completeQuickWin(currentRoadmapId, quickWinId, businessId, xpGained);
      setQuickWinsSession(response.session);
      
      // Refresh mastery data since it was updated
      const updatedMastery = await roadmapAPI.getMasteryData(currentRoadmapId, businessId);
      setMasteryData(updatedMastery);
      
      console.log('✅ Quick win completed:', quickWinId);
    } catch (err: any) {
      setError(err.message || 'Failed to complete quick win');
      console.error('Error completing quick win:', err);
      throw err;
    }
  };

  // Select a node
  const selectNode = (nodeId: string | null) => {
    setSelectedNodeId(nodeId);
  };

  // Refresh all data
  const refreshAll = async () => {
    if (currentRoadmapId && businessId) {
      await loadRoadmap(currentRoadmapId, businessId);
    }
  };

  // Helper: get node by ID
  const getNode = (nodeId: string): RoadmapNode | undefined => {
    if (!roadmap) return undefined;
    
    for (const branch of roadmap.branches) {
      const node = branch.nodes.find(n => n.id === nodeId);
      if (node) return node;
    }
    
    return undefined;
  };

  // Helper: get branch by ID
  const getBranch = (branchId: string): RoadmapBranch | undefined => {
    if (!roadmap) return undefined;
    return roadmap.branches.find(b => b.id === branchId);
  };

  const value: RoadmapContextType = {
    roadmap,
    agiMetadata,
    masteryData,
    quickWinsSession,
    loading,
    error,
    selectedNodeId,
    currentRoadmapId,
    businessId,
    loadRoadmap,
    updateNode,
    updateAGI,
    updateMastery,
    updateQuickWins,
    completeQuickWin,
    selectNode,
    refreshAll,
    getNode,
    getBranch
  };

  return (
    <RoadmapContext.Provider value={value}>
      {children}
    </RoadmapContext.Provider>
  );
}

export function useRoadmap() {
  const context = useContext(RoadmapContext);
  if (context === undefined) {
    throw new Error('useRoadmap must be used within a RoadmapProvider');
  }
  return context;
}