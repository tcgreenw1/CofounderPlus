import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MasteryLevelRing,
  MasterySkillBar,
  MasteryHexChart,
  MasteryWeaknessItem,
  MasterySuggestionCard,
  MasteryGainsItem,
  MasteryBadgeItem,
  MasterySectionHeader,
} from './MasteryComponents';
import { Zap, Trophy, Star, Target, Award, Crown, ChevronLeft, ArrowLeft, Sparkles } from 'lucide-react';
import { useRoadmap } from '../../contexts/RoadmapContext';

/**
 * Mastery Dashboard Screen - NOW WITH LIVE DATA
 * Uses RoadmapContext for real mastery progression
 */
export function MasteryScreen() {
  const navigate = useNavigate();
  const { masteryData, loading, error, loadRoadmap } = useRoadmap();

  // Load roadmap/mastery data on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roadmapId = urlParams.get('roadmapId') || 'default-roadmap';
    const businessId = urlParams.get('businessId') || localStorage.getItem('currentBusinessId');
    
    if (businessId) {
      loadRoadmap(roadmapId, businessId);
    }
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <div className="text-center">
          <Sparkles className="size-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading mastery data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <div className="text-center">
          <p className="text-destructive mb-4">Error loading mastery: {error}</p>
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

  // No data
  if (!masteryData) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <p className="text-muted-foreground">No mastery data available</p>
      </div>
    );
  }

  // Convert domains array to object for hex chart
  const domainValues = masteryData.domains.reduce((acc, domain) => {
    acc[domain.domain] = domain.level;
    return acc;
  }, {} as Record<string, number>);

  // Find weakest domain
  const sortedDomains = [...masteryData.domains].sort((a, b) => a.level - b.level);
  const weakestDomain = sortedDomains[0];
  const strongestDomain = sortedDomains[sortedDomains.length - 1];
  const averageLevel = masteryData.domains.reduce((sum, d) => sum + d.level, 0) / masteryData.domains.length;

  return (
    <div className="size-full min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* ============================================================================ */}
        {/* APPLE-STYLE BACK BUTTON */}
        {/* ============================================================================ */}
        <button
          onClick={() => navigate('/roadmap')}
          className="flex items-center gap-2 mb-8 text-blue-600 hover:text-blue-700 transition-colors duration-200 group"
        >
          <ChevronLeft className="size-5 group-hover:-translate-x-1 transition-transform duration-200" />
          <span className="font-semibold">Roadmap</span>
        </button>

        {/* ============================================================================ */}
        {/* HEADER */}
        {/* ============================================================================ */}
        <div className="flex items-start justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">
              Mastery Dashboard
            </h1>
            <p className="text-lg text-slate-600">
              Your skill progression across all business domains
            </p>
          </div>

          {/* XP Badge */}
          <div
            className="px-6 py-3 rounded-2xl flex items-center gap-3"
            style={{
              background: 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(40px)',
              WebkitBackdropFilter: 'blur(40px)',
              border: '2px solid var(--color-energy-border, rgba(242, 201, 76, 0.4))',
              boxShadow: '0 4px 16px rgba(242, 201, 76, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.5)',
            }}
          >
            <div
              className="size-12 rounded-xl flex items-center justify-center"
              style={{
                background: 'var(--color-energy-glass, rgba(242, 201, 76, 0.2))',
                border: '2px solid var(--color-energy-border, rgba(242, 201, 76, 0.4))',
              }}
            >
              <Zap className="size-6 text-yellow-600" />
            </div>
            <div>
              <div className="text-sm font-semibold text-yellow-700 uppercase tracking-wide">
                Total XP
              </div>
              <div className="text-2xl font-bold text-yellow-800">
                {masteryData.totalXP.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================================ */}
        {/* LEVEL RING - Centered */}
        {/* ============================================================================ */}
        <div className="flex justify-center mb-16">
          <MasteryLevelRing
            currentLevel={masteryData.currentLevel}
            currentXP={masteryData.levelProgress}
            maxXP={masteryData.maxXPForLevel}
            size={220}
          />
        </div>

        {/* ============================================================================ */}
        {/* SKILL TRACKS */}
        {/* ============================================================================ */}
        <MasterySectionHeader label="Skill Tracks" />
        
        <div className="space-y-4 mb-16">
          {masteryData.domains.map(domain => (
            <MasterySkillBar
              key={domain.domain}
              category={domain.domain}
              progress={domain.level}
              level={Math.floor(domain.level / 10)} // Convert 0-100 to level
            />
          ))}
        </div>

        {/* ============================================================================ */}
        {/* STRENGTH PROFILE */}
        {/* ============================================================================ */}
        <MasterySectionHeader label="Strength Profile" />
        
        <div className="flex justify-center mb-16">
          <MasteryHexChart data={domainValues} size={450} />
        </div>

        {/* ============================================================================ */}
        {/* WEAKNESS ALERTS */}
        {/* ============================================================================ */}
        <MasterySectionHeader label="Weakness Alerts" />
        
        <div className="space-y-4 mb-16">
          {weakestDomain && weakestDomain.level < averageLevel - 20 && (
            <MasteryWeaknessItem
              title={`${weakestDomain.domain} skills are lagging behind other domains by ${Math.round(averageLevel - weakestDomain.level)}%`}
              severity="high"
              onFix={() => console.log(`Fix ${weakestDomain.domain} weakness`)}
            />
          )}
          
          {sortedDomains.slice(0, 2).map(domain => {
            if (domain.level < 50) {
              return (
                <MasteryWeaknessItem
                  key={domain.domain}
                  title={`${domain.domain} mastery needs attention to unlock next chapter`}
                  severity={domain.level < 30 ? 'high' : 'medium'}
                  onFix={() => console.log(`Fix ${domain.domain} weakness`)}
                />
              );
            }
            return null;
          })}

          {masteryData.suggestions && masteryData.suggestions.map((suggestion, idx) => (
            <MasteryWeaknessItem
              key={idx}
              title={suggestion}
              severity="low"
              onFix={() => console.log('Fix suggestion:', suggestion)}
            />
          ))}
        </div>

        {/* ============================================================================ */}
        {/* RECENT GAINS */}
        {/* ============================================================================ */}
        {masteryData.recentGains && masteryData.recentGains.length > 0 && (
          <>
            <MasterySectionHeader label="Recent Gains" />
            
            <div className="space-y-3 mb-16">
              {masteryData.recentGains.slice(0, 5).map(gain => (
                <MasteryGainsItem
                  key={gain.id}
                  title={gain.from}
                  xpGained={gain.xpGained}
                  domain={gain.domain}
                  timestamp={gain.timestamp}
                />
              ))}
            </div>
          </>
        )}

        {/* ============================================================================ */}
        {/* BADGES & ACHIEVEMENTS */}
        {/* ============================================================================ */}
        {masteryData.badges && masteryData.badges.length > 0 && (
          <>
            <MasterySectionHeader label="Badges & Achievements" />
            
            <div className="grid grid-cols-5 gap-6 mb-16">
              {masteryData.badges.map(badge => (
                <MasteryBadgeItem
                  key={badge.id}
                  title={badge.title}
                  icon={<Trophy className="size-6" />}
                  unlocked={badge.unlocked}
                  glowColor={badge.glowColor}
                />
              ))}
            </div>
          </>
        )}

        {/* ============================================================================ */}
        {/* PERSONALIZED SUGGESTIONS */}
        {/* ============================================================================ */}
        <MasterySectionHeader label="Personalized Suggestions" />
        
        <div className="space-y-4">
          {weakestDomain && (
            <MasterySuggestionCard
              title={`Focus on ${weakestDomain.domain} to balance your skills`}
              description={`Complete more ${weakestDomain.domain} nodes to bring this domain up to speed with your other skills.`}
              actionLabel={`View ${weakestDomain.domain} Nodes`}
              onAction={() => navigate('/roadmap?filter=' + weakestDomain.domain.toLowerCase())}
            />
          )}
          
          {strongestDomain && strongestDomain.level > 80 && (
            <MasterySuggestionCard
              title={`You're a ${strongestDomain.domain} expert!`}
              description={`Your ${strongestDomain.domain} mastery is exceptional. Consider mentoring others or taking on advanced challenges.`}
              actionLabel="View Advanced Nodes"
              onAction={() => navigate('/roadmap?difficulty=advanced')}
            />
          )}
          
          {masteryData.levelProgress / masteryData.maxXPForLevel > 0.8 && (
            <MasterySuggestionCard
              title="Almost at the next level!"
              description={`You're ${Math.round((1 - masteryData.levelProgress / masteryData.maxXPForLevel) * masteryData.maxXPForLevel)} XP away from level ${masteryData.currentLevel + 1}. Keep going!`}
              actionLabel="View Available Nodes"
              onAction={() => navigate('/roadmap')}
            />
          )}
        </div>
      </div>
    </div>
  );
}