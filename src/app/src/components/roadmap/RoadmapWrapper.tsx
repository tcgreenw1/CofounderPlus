import React, { useState, useEffect } from 'react';
import { useRoadmap } from '../../contexts/RoadmapContext';
import { useBusiness } from '../BusinessContext';
import { RoadmapScreen } from './RoadmapScreen';
import { AGIOnboarding } from './AGIOnboarding';
import { Loader2 } from 'lucide-react';

/**
 * RoadmapWrapper - Checks if roadmap exists and shows onboarding if needed
 */
export function RoadmapWrapper() {
  const { selectedBusiness } = useBusiness();
  const { roadmap, loading, loadRoadmap } = useRoadmap();
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkRoadmapStatus();
  }, [selectedBusiness]);

  const checkRoadmapStatus = async () => {
    if (!selectedBusiness?.id) {
      setChecking(false);
      return;
    }

    setChecking(true);
    
    try {
      // Try to load existing roadmap
      const roadmapId = `roadmap-${selectedBusiness.id}`;
      await loadRoadmap(roadmapId, selectedBusiness.id);
      
      // If we get here and no roadmap loaded, show onboarding
      setNeedsOnboarding(!roadmap);
    } catch (error: any) {
      // If roadmap doesn't exist, show onboarding
      if (error.message?.includes('404') || error.message?.includes('not found')) {
        setNeedsOnboarding(true);
      }
    } finally {
      setChecking(false);
    }
  };

  const handleRoadmapGenerated = () => {
    // Reload the roadmap after generation
    setNeedsOnboarding(false);
    checkRoadmapStatus();
  };

  // Loading state
  if (checking || loading) {
    return (
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          flexDirection: 'column',
          gap: 'var(--spacing-4)',
        }}
      >
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--primary)' }} />
        <p style={{ color: 'var(--muted-foreground)' }}>
          Loading your roadmap...
        </p>
      </div>
    );
  }

  // No business selected
  if (!selectedBusiness) {
    return (
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: 'var(--spacing-4)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ marginBottom: 'var(--spacing-2)' }}>No Business Selected</h2>
          <p style={{ color: 'var(--muted-foreground)' }}>
            Please select a business to view your roadmap
          </p>
        </div>
      </div>
    );
  }

  // Show onboarding if needed
  if (needsOnboarding || !roadmap) {
    return (
      <AGIOnboarding
        businessId={selectedBusiness.id}
        businessName={selectedBusiness.name}
        onRoadmapGenerated={handleRoadmapGenerated}
      />
    );
  }

  // Show roadmap screen
  return <RoadmapScreen />;
}
