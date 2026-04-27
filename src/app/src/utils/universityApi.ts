import { projectId, publicAnonKey } from './supabase/info';
import { supabase } from './supabase/client';

class UniversityAPI {
  private baseUrl: string;
  
  constructor() {
    this.baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/university`;
  }

  private async getHeaders(user?: any, accessToken?: string): Promise<Record<string, string>> {
    let authToken = publicAnonKey;
    
    console.log('🎓 UNIVERSITY API: Getting headers for user:', user?.email || 'none');
    console.log('🎓 UNIVERSITY API: Access token provided:', !!accessToken);
    
    // Use provided access token first
    if (accessToken) {
      authToken = accessToken;
      console.log('🎓 UNIVERSITY API: Using provided access token, length:', authToken.length);
      
      // Validate token format
      const tokenParts = accessToken.split('.');
      if (tokenParts.length === 3) {
        try {
          const payload = JSON.parse(atob(tokenParts[1]));
          const now = Math.floor(Date.now() / 1000);
          console.log('🎓 UNIVERSITY API: Token expires at:', new Date(payload.exp * 1000).toISOString());
          console.log('🎓 UNIVERSITY API: Token valid:', payload.exp > now);
          console.log('🎓 UNIVERSITY API: Token email:', payload.email);
        } catch (e) {
          console.warn('🎓 UNIVERSITY API: Could not parse token payload');
        }
      } else {
        console.warn('🎓 UNIVERSITY API: Invalid JWT format, parts:', tokenParts.length);
      }
    } else if (user) {
      try {
        // Fallback to getting access token from current session
        console.log('🎓 UNIVERSITY API: Getting session...');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.access_token) {
          authToken = session.access_token;
          console.log('🎓 UNIVERSITY API: Using session access token, length:', authToken.length);
        } else {
          console.log('🎓 UNIVERSITY API: No session access token, using anon key');
        }
      } catch (error) {
        console.warn('🎓 UNIVERSITY API: Failed to get session:', error);
      }
    } else {
      console.log('🎓 UNIVERSITY API: No user or token provided, using anon key');
    }
    
    return {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };
  }

  async getTracks(user?: any, accessToken?: string) {
    console.log('🎓 UNIVERSITY API: getTracks called');
    console.log('🎓 UNIVERSITY API: Base URL:', this.baseUrl);
    console.log('🎓 UNIVERSITY API: Full tracks URL:', `${this.baseUrl}/tracks`);
    
    const headers = await this.getHeaders(user, accessToken);
    console.log('🎓 UNIVERSITY API: Request headers prepared');
    
    console.log('🎓 UNIVERSITY API: Making fetch request...');
    const response = await fetch(`${this.baseUrl}/tracks`, {
      headers
    });
    
    console.log('🎓 UNIVERSITY API: Response received');
    console.log('🎓 UNIVERSITY API: Response status:', response.status);
    console.log('🎓 UNIVERSITY API: Response ok:', response.ok);
    console.log('🎓 UNIVERSITY API: Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('🎓 UNIVERSITY API: Error response body:', errorText);
      throw new Error(`Failed to fetch tracks: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    console.log('🎓 UNIVERSITY API: Parsing JSON response...');
    const jsonData = await response.json();
    console.log('🎓 UNIVERSITY API: ✅ JSON parsed successfully');
    console.log('🎓 UNIVERSITY API: Response data structure:', {
      hasTracksProperty: 'tracks' in jsonData,
      tracksType: typeof jsonData.tracks,
      tracksLength: jsonData.tracks?.length,
      topLevelKeys: Object.keys(jsonData)
    });
    console.log('🎓 UNIVERSITY API: Full response data:', jsonData);
    
    return jsonData;
  }

  async getTrack(slug: string, user?: any, accessToken?: string) {
    const response = await fetch(`${this.baseUrl}/track/${slug}`, {
      headers: await this.getHeaders(user, accessToken)
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch track');
    }
    
    return response.json();
  }

  async getTutorial(slug: string, user?: any, accessToken?: string) {
    const response = await fetch(`${this.baseUrl}/tutorial/${slug}`, {
      headers: await this.getHeaders(user, accessToken)
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch tutorial');
    }
    
    return response.json();
  }

  async search(params: {
    q?: string;
    category?: string;
    difficulty?: string;
    hasTemplates?: boolean;
  }, user?: any, accessToken?: string) {
    console.log('🔍 UNIVERSITY API: Starting search with params:', params);
    
    const searchParams = new URLSearchParams();
    
    if (params.q) searchParams.append('q', params.q);
    if (params.category) searchParams.append('category', params.category);
    if (params.difficulty) searchParams.append('difficulty', params.difficulty);
    if (params.hasTemplates) searchParams.append('hasTemplates', params.hasTemplates.toString());

    const searchUrl = `${this.baseUrl}/search?${searchParams}`;
    console.log('🔍 UNIVERSITY API: Search URL:', searchUrl);

    try {
      const headers = await this.getHeaders(user, accessToken);
      console.log('🔍 UNIVERSITY API: Request headers prepared');
      
      const response = await fetch(searchUrl, { headers });
      
      console.log('🔍 UNIVERSITY API: Response received');
      console.log('🔍 UNIVERSITY API: Response status:', response.status);
      console.log('🔍 UNIVERSITY API: Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔍 UNIVERSITY API: Error response body:', errorText);
        throw new Error(`Search failed: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      const jsonData = await response.json();
      console.log('🔍 UNIVERSITY API: ✅ Search successful');
      console.log('🔍 UNIVERSITY API: Results count:', jsonData.results?.length || 0);
      
      // Ensure we always return a valid structure
      return {
        results: Array.isArray(jsonData.results) ? jsonData.results : [],
        ...jsonData
      };
      
    } catch (error) {
      console.error('🔍 UNIVERSITY API: ❌ Search error:', error);
      
      // Return empty results on error to prevent UI crashes
      return {
        results: [],
        error: error.message
      };
    }
  }

  async updateProgress(tutorialSlug: string, progressData: {
    completed?: boolean;
    percent?: number;
    lastStepIndex?: number;
  }, user: any, accessToken?: string) {
    if (!user) throw new Error('Authentication required');

    const response = await fetch(`${this.baseUrl}/progress/${tutorialSlug}`, {
      method: 'POST',
      headers: await this.getHeaders(user, accessToken),
      body: JSON.stringify(progressData)
    });
    
    if (!response.ok) {
      throw new Error('Failed to update progress');
    }
    
    return response.json();
  }

  async updateChecklist(tutorialSlug: string, stepIndex: number, checked: boolean, user: any, accessToken?: string) {
    if (!user) throw new Error('Authentication required');

    const response = await fetch(`${this.baseUrl}/checklist/${tutorialSlug}/${stepIndex}`, {
      method: 'POST',
      headers: await this.getHeaders(user, accessToken),
      body: JSON.stringify({ checked })
    });
    
    if (!response.ok) {
      throw new Error('Failed to update checklist');
    }
    
    return response.json();
  }

  async toggleBookmark(tutorialSlug: string, user: any, accessToken?: string) {
    if (!user) throw new Error('Authentication required');

    const response = await fetch(`${this.baseUrl}/bookmark/${tutorialSlug}`, {
      method: 'POST',
      headers: await this.getHeaders(user, accessToken)
    });
    
    if (!response.ok) {
      throw new Error('Failed to toggle bookmark');
    }
    
    return response.json();
  }

  async getProgress(user: any, accessToken?: string) {
    if (!user) throw new Error('Authentication required');

    const response = await fetch(`${this.baseUrl}/progress`, {
      headers: await this.getHeaders(user, accessToken)
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch progress');
    }
    
    return response.json();
  }

  async getBookmarks(user: any, accessToken?: string) {
    if (!user) throw new Error('Authentication required');

    const response = await fetch(`${this.baseUrl}/bookmarks`, {
      headers: await this.getHeaders(user, accessToken)
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch bookmarks');
    }
    
    return response.json();
  }

  async trackDownload(assetId: string, user?: any, accessToken?: string) {
    const response = await fetch(`${this.baseUrl}/download/${assetId}`, {
      method: 'POST',
      headers: await this.getHeaders(user, accessToken)
    });
    
    if (!response.ok) {
      throw new Error('Failed to track download');
    }
    
    return response.json();
  }

  async autoSeedData(user: any, accessToken?: string) {
    if (!user) throw new Error('Authentication required');

    console.log('🎓 UNIVERSITY API: Auto-seeding data for user:', user.email);
    console.log('🎓 UNIVERSITY API: Access token provided:', !!accessToken);
    
    // Get headers and log for debugging
    const headers = await this.getHeaders(user, accessToken);
    console.log('🎓 UNIVERSITY API: Request headers prepared');
    
    const response = await fetch(`${this.baseUrl}/auto-seed`, {
      method: 'POST',
      headers
    });
    
    console.log('🎓 UNIVERSITY API: Response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('🎓 UNIVERSITY API: Auto-seed failed:', errorData);
      throw new Error(errorData.error || 'Failed to auto-seed data');
    }
    
    const result = await response.json();
    console.log('🎓 UNIVERSITY API: Auto-seed result:', result);
    return result;
  }

  async seedData(user: any, accessToken?: string) {
    if (!user) throw new Error('Authentication required');

    console.log('🎓 UNIVERSITY API: Seeding data for user:', user.email);
    console.log('🎓 UNIVERSITY API: Access token provided:', !!accessToken);
    
    // Get headers and log for debugging
    const headers = await this.getHeaders(user, accessToken);
    console.log('🎓 UNIVERSITY API: Request headers prepared');
    
    const response = await fetch(`${this.baseUrl}/admin/seed`, {
      method: 'POST',
      headers
    });
    
    console.log('🎓 UNIVERSITY API: Response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('🎓 UNIVERSITY API: Seed failed:', errorData);
      throw new Error(errorData.error || 'Failed to seed data');
    }
    
    const result = await response.json();
    console.log('🎓 UNIVERSITY API: Seed successful:', result);
    return result;
  }

  async completeTutorial(tutorialId: string, trackId: string, user: any, accessToken?: string) {
    if (!user) throw new Error('Authentication required');

    console.log('🎓 UNIVERSITY API: Completing tutorial:', tutorialId, 'in track:', trackId);
    
    const headers = await this.getHeaders(user, accessToken);
    
    const response = await fetch(`${this.baseUrl}/complete-tutorial`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ 
        tutorialId, 
        trackId,
        completedAt: new Date().toISOString()
      })
    });
    
    console.log('🎓 UNIVERSITY API: Complete tutorial response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to complete tutorial' }));
      console.error('🎓 UNIVERSITY API: Complete tutorial failed:', errorData);
      throw new Error(errorData.error || 'Failed to complete tutorial');
    }
    
    const result = await response.json();
    console.log('🎓 UNIVERSITY API: Tutorial completed successfully:', result);
    return result;
  }

  async getUserStats(user: any, accessToken?: string) {
    if (!user) throw new Error('Authentication required');

    const headers = await this.getHeaders(user, accessToken);
    
    const response = await fetch(`${this.baseUrl}/user-stats`, {
      headers
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch user stats');
    }
    
    return response.json();
  }

  async trackTutorialCompletion(tutorialId: string, trackId: string, user: any, accessToken?: string) {
    if (!user) throw new Error('Authentication required');

    console.log('🎓 UNIVERSITY API: Tracking tutorial completion:', { tutorialId, trackId });
    
    const headers = await this.getHeaders(user, accessToken);
    
    const response = await fetch(`${this.baseUrl}/track-completion`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ tutorialId, trackId })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to track completion' }));
      console.error('🎓 UNIVERSITY API: Track completion failed:', errorData);
      throw new Error(errorData.error || 'Failed to track completion');
    }
    
    const result = await response.json();
    console.log('🎓 UNIVERSITY API: Tutorial completion tracked:', result);
    return result;
  }

  async awardBadge(trackId: string, badgeType: string, score: number, user: any, accessToken?: string) {
    if (!user) throw new Error('Authentication required');

    console.log('🏆 UNIVERSITY API: Awarding badge:', { trackId, badgeType, score });
    
    const headers = await this.getHeaders(user, accessToken);
    
    const response = await fetch(`${this.baseUrl}/award-badge`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ trackId, badgeType, score })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to award badge' }));
      console.error('🏆 UNIVERSITY API: Award badge failed:', errorData);
      throw new Error(errorData.error || 'Failed to award badge');
    }
    
    const result = await response.json();
    console.log('🏆 UNIVERSITY API: Badge awarded:', result);
    return result;
  }

  async getUserTrackProgress(user: any, accessToken?: string) {
    if (!user) throw new Error('Authentication required');

    const headers = await this.getHeaders(user, accessToken);
    
    const response = await fetch(`${this.baseUrl}/user-track-progress`, {
      headers
    });
    
    if (!response.ok) {
      console.error('🎓 UNIVERSITY API: Failed to get track progress');
      // Return empty progress instead of throwing
      return { progress: {} };
    }
    
    const result = await response.json();
    console.log('🎓 UNIVERSITY API: Track progress fetched:', result);
    return result;
  }
}

export const universityApi = new UniversityAPI();