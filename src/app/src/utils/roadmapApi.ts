import { supabase } from './supabase/client';
import { projectId } from './supabase/info';
import { 
  UserProgress,
  Roadmap,
  RoadmapNode,
  AGIMetadata,
  MasteryData,
  QuickWinsSession
} from '../types/roadmap';

class RoadmapAPI {
  private async getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('No valid session found');
    }
    
    return {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    };
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09${endpoint}`,
      {
        ...options,
        headers: { ...headers, ...options.headers }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      
      // Only log as error if it's not an expected 404
      const isExpected404 = response.status === 404 && (
        endpoint.includes('/quick-wins/') || 
        endpoint.includes('/roadmap/structure/') ||
        endpoint.includes('/roadmap/agi/') ||
        endpoint.includes('/roadmap/mastery/') ||
        errorText.includes('No active quick wins session') ||
        errorText.includes('Roadmap not found') ||
        errorText.includes('AGI metadata not found') ||
        errorText.includes('Mastery data not found')
      );
      
      if (!isExpected404) {
        console.error('❌ API Request Failed:', {
          endpoint,
          status: response.status,
          statusText: response.statusText,
          errorText,
        });
      }
      
      throw new Error(`API request failed (${response.status}): ${errorText || response.statusText}`);
    }

    return response.json();
  }

  // ============================================================================
  // ROADMAP STRUCTURE
  // ============================================================================

  // Get full roadmap structure with branches and nodes
  async getRoadmapStructure(roadmapId: string, businessId: string): Promise<Roadmap> {
    const data = await this.makeRequest(`/roadmap/structure/${roadmapId}?businessId=${businessId}`);
    return data;
  }

  // Update full roadmap structure
  async updateRoadmapStructure(roadmapId: string, businessId: string, roadmap: Partial<Roadmap>): Promise<Roadmap> {
    const data = await this.makeRequest(`/roadmap/structure/${roadmapId}?businessId=${businessId}`, {
      method: 'PUT',
      body: JSON.stringify(roadmap)
    });
    return data;
  }

  // Update a specific node
  async updateNode(roadmapId: string, nodeId: string, businessId: string, nodeUpdates: Partial<RoadmapNode>) {
    const data = await this.makeRequest(`/roadmap/node/${roadmapId}/${nodeId}?businessId=${businessId}`, {
      method: 'PATCH',
      body: JSON.stringify(nodeUpdates)
    });
    return data;
  }

  // ============================================================================
  // AGI METADATA
  // ============================================================================

  // Get AGI metadata for a roadmap
  async getAGIMetadata(roadmapId: string, businessId: string): Promise<AGIMetadata> {
    const data = await this.makeRequest(`/roadmap/agi/${roadmapId}?businessId=${businessId}`);
    return data;
  }

  // Update AGI metadata
  async updateAGIMetadata(roadmapId: string, businessId: string, agiData: Partial<AGIMetadata>): Promise<AGIMetadata> {
    const data = await this.makeRequest(`/roadmap/agi/${roadmapId}?businessId=${businessId}`, {
      method: 'PUT',
      body: JSON.stringify(agiData)
    });
    return data;
  }

  // ============================================================================
  // MASTERY
  // ============================================================================

  // Get mastery data for a roadmap
  async getMasteryData(roadmapId: string, businessId: string): Promise<MasteryData> {
    const data = await this.makeRequest(`/roadmap/mastery/${roadmapId}?businessId=${businessId}`);
    return data;
  }

  // Update mastery data
  async updateMasteryData(roadmapId: string, businessId: string, masteryData: Partial<MasteryData>): Promise<MasteryData> {
    const data = await this.makeRequest(`/roadmap/mastery/${roadmapId}?businessId=${businessId}`, {
      method: 'PUT',
      body: JSON.stringify(masteryData)
    });
    return data;
  }

  // ============================================================================
  // QUICK WINS
  // ============================================================================

  // Get active quick wins session
  async getQuickWinsSession(roadmapId: string, businessId: string): Promise<QuickWinsSession> {
    try {
      const data = await this.makeRequest(`/roadmap/quick-wins/${roadmapId}?businessId=${businessId}`);
      return data;
    } catch (error) {
      // Don't log error for 404 - it's normal to not have an active session
      // Just re-throw and let the caller handle it
      throw error;
    }
  }

  // Create/update quick wins session
  async updateQuickWinsSession(roadmapId: string, businessId: string, session: Partial<QuickWinsSession>): Promise<QuickWinsSession> {
    try {
      const data = await this.makeRequest(`/roadmap/quick-wins/${roadmapId}?businessId=${businessId}`, {
        method: 'PUT',
        body: JSON.stringify(session)
      });
      return data;
    } catch (error) {
      console.error('Error updating quick wins session:', error);
      throw error;
    }
  }

  // Complete a quick win
  async completeQuickWin(roadmapId: string, quickWinId: string, businessId: string, xpGained?: number) {
    try {
      const data = await this.makeRequest(`/roadmap/quick-wins/${roadmapId}/complete?businessId=${businessId}`, {
        method: 'POST',
        body: JSON.stringify({ quickWinId, xpGained })
      });
      return data;
    } catch (error) {
      console.error('Error completing quick win:', error);
      throw error;
    }
  }

  // ============================================================================
  // LEGACY PROGRESS ENDPOINTS (kept for compatibility)
  // ============================================================================

  // Get roadmap progress for a specific roadmap
  async getRoadmapProgress(roadmapId: string, businessId: string): Promise<UserProgress> {
    try {
      const data = await this.makeRequest(`/roadmap/progress/${roadmapId}?businessId=${businessId}`);
      return data;
    } catch (error) {
      console.error('Error fetching roadmap progress:', error);
      throw error;
    }
  }

  // Update roadmap progress
  async updateRoadmapProgress(roadmapId: string, businessId: string, progress: UserProgress): Promise<UserProgress> {
    try {
      const data = await this.makeRequest(`/roadmap/progress/${roadmapId}?businessId=${businessId}`, {
        method: 'PUT',
        body: JSON.stringify(progress)
      });
      return data;
    } catch (error) {
      console.error('Error updating roadmap progress:', error);
      throw error;
    }
  }

  // Complete a task
  async completeTask(roadmapId: string, taskId: string, milestoneId: string, xpGained: number, businessId: string) {
    try {
      const data = await this.makeRequest('/roadmap/complete-task', {
        method: 'POST',
        body: JSON.stringify({
          roadmapId,
          taskId,
          milestoneId,
          xpGained,
          businessId
        })
      });
      return data;
    } catch (error) {
      console.error('Error completing task:', error);
      throw error;
    }
  }

  // Complete a milestone
  async completeMilestone(roadmapId: string, milestoneId: string, xpGained: number, businessId: string) {
    try {
      const data = await this.makeRequest('/roadmap/complete-milestone', {
        method: 'POST',
        body: JSON.stringify({
          roadmapId,
          milestoneId,
          xpGained,
          businessId
        })
      });
      return data;
    } catch (error) {
      console.error('Error completing milestone:', error);
      throw error;
    }
  }

  // Undo task completion
  async undoTask(roadmapId: string, taskId: string, xpToRemove: number, businessId: string) {
    try {
      const data = await this.makeRequest('/roadmap/undo-task', {
        method: 'POST',
        body: JSON.stringify({
          roadmapId,
          taskId,
          xpToRemove,
          businessId
        })
      });
      return data;
    } catch (error) {
      console.error('Error undoing task:', error);
      throw error;
    }
  }

  // Save proof for a task
  async saveProof(roadmapId: string, taskId: string, milestoneId: string, proofData: any, businessId: string) {
    try {
      const data = await this.makeRequest('/roadmap/save-proof', {
        method: 'POST',
        body: JSON.stringify({
          roadmapId,
          taskId,
          milestoneId,
          proofData,
          businessId
        })
      });
      return data;
    } catch (error) {
      console.error('Error saving proof:', error);
      throw error;
    }
  }

  // Get proof for a task
  async getProof(taskId: string, businessId: string) {
    try {
      const data = await this.makeRequest(`/roadmap/proof/${taskId}?businessId=${businessId}`);
      return data;
    } catch (error) {
      console.error('Error fetching proof:', error);
      throw error;
    }
  }

  // Save focus session
  async saveFocusSession(roadmapId: string, taskId: string, duration: number, businessId: string) {
    try {
      const data = await this.makeRequest('/roadmap/focus-session', {
        method: 'POST',
        body: JSON.stringify({
          roadmapId,
          taskId,
          duration,
          businessId
        })
      });
      return data;
    } catch (error) {
      console.error('Error saving focus session:', error);
      throw error;
    }
  }

  // Get business roadmap progress (all roadmaps)
  async getBusinessProgress(businessId: string) {
    try {
      const data = await this.makeRequest(`/roadmap/business-progress?businessId=${businessId}`);
      return data;
    } catch (error) {
      console.error('Error fetching business progress:', error);
      throw error;
    }
  }

  // Get roadmap analytics
  async getAnalytics(businessId: string) {
    try {
      const data = await this.makeRequest(`/roadmap/analytics?businessId=${businessId}`);
      return data;
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw error;
    }
  }

  // Local storage fallback for offline functionality
  saveProgressToLocal(roadmapId: string, businessId: string, progress: UserProgress) {
    try {
      const key = `roadmap_progress_${businessId}_${roadmapId}`;
      localStorage.setItem(key, JSON.stringify(progress));
    } catch (error) {
      console.warn('Could not save progress to localStorage:', error);
    }
  }

  getProgressFromLocal(roadmapId: string, businessId: string): UserProgress | null {
    try {
      const key = `roadmap_progress_${businessId}_${roadmapId}`;
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn('Could not load progress from localStorage:', error);
      return null;
    }
  }

  // Sync local progress with server (for offline/online sync)
  async syncProgress(roadmapId: string, businessId: string) {
    try {
      const localProgress = this.getProgressFromLocal(roadmapId, businessId);
      if (localProgress) {
        await this.updateRoadmapProgress(roadmapId, businessId, localProgress);
        console.log('Progress synced from local storage');
      }
    } catch (error) {
      console.error('Error syncing progress:', error);
    }
  }
}

export const roadmapAPI = new RoadmapAPI();