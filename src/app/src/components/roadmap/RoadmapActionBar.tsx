import React from 'react';
import { RefreshCw, GraduationCap, SlidersHorizontal, Sparkles, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RoadmapActionBarProps {
  onRefreshRoadmap?: () => void;
  isRefreshing?: boolean;
}

export function RoadmapActionBar({
  onRefreshRoadmap,
  isRefreshing = false,
}: RoadmapActionBarProps) {
  const navigate = useNavigate();

  return (
    <div
      className="px-4 flex items-center justify-between gap-3"
      style={{
        paddingTop: 'var(--spacing-2, 8px)',
        paddingBottom: 'var(--spacing-2, 8px)',
        background: 'linear-gradient(135deg, var(--card, rgba(255, 255, 255, 0.95)) 0%, var(--muted, rgba(248, 252, 255, 0.9)) 100%)',
        backdropFilter: 'blur(var(--blur-md, 16px))',
        WebkitBackdropFilter: 'blur(var(--blur-md, 16px))',
        borderBottom: '1px solid var(--border, rgba(226, 232, 240, 0.6))',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
      }}
    >
      {/* Page Title */}
      <div className="flex items-center gap-2">
        <div
          className="flex items-center justify-center"
          style={{
            width: 'var(--size-8, 32px)',
            height: 'var(--size-8, 32px)',
            borderRadius: 'var(--radius-lg, 12px)',
            background: 'linear-gradient(135deg, var(--primary, #2F80FF) 0%, var(--primary-hover, #1e6dd8) 100%)',
            boxShadow: '0 4px 12px var(--primary-shadow, rgba(47, 128, 255, 0.3))',
          }}
        >
          <Sparkles
            className="size-4"
            style={{ color: 'var(--primary-foreground, #ffffff)' }}
          />
        </div>
        <h2
          style={{
            fontSize: 'var(--text-lg, 18px)',
            fontWeight: 'var(--font-bold, 700)',
            color: 'var(--foreground, #1e293b)',
            letterSpacing: '-0.02em',
          }}
        >
          Roadmap
        </h2>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Cofounder Quick Action Button */}
        <button
          onClick={onRefreshRoadmap}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-200 active:scale-95"
          style={{
            background: isRefreshing 
              ? 'linear-gradient(135deg, var(--muted, rgba(148, 163, 184, 0.2)) 0%, var(--muted, rgba(148, 163, 184, 0.15)) 100%)'
              : 'linear-gradient(135deg, var(--primary, #2F80FF) 0%, var(--primary-hover, #1e6dd8) 100%)',
            boxShadow: isRefreshing 
              ? 'none'
              : '0 4px 12px var(--primary-shadow, rgba(47, 128, 255, 0.3))',
            border: '2px solid ' + (isRefreshing ? 'var(--border, rgba(226, 232, 240, 0.8))' : 'transparent'),
            cursor: isRefreshing ? 'not-allowed' : 'pointer',
            opacity: isRefreshing ? 0.7 : 1,
          }}
          aria-label="Cofounder Quick Action"
          title="Ask Cofounder to read your roadmap, analyze progress, and update tasks based on where you're at"
        >
          <Sparkles
            className={`size-4 ${isRefreshing ? 'animate-pulse' : ''}`}
            style={{ color: 'var(--primary-foreground, #ffffff)' }}
          />
          <span
            style={{
              fontSize: 'var(--text-sm, 14px)',
              fontWeight: 'var(--font-semibold, 600)',
              color: 'var(--primary-foreground, #ffffff)',
              letterSpacing: '-0.01em',
            }}
          >
            {isRefreshing ? 'Analyzing...' : 'Cofounder'}
          </span>
        </button>

        {/* Mastery Page */}
        <button
          onClick={() => navigate('/mastery-agi')}
          className="hidden md:flex items-center justify-center transition-all duration-200 active:scale-90"
          style={{
            width: 'var(--size-10, 40px)',
            height: 'var(--size-10, 40px)',
            borderRadius: 'var(--radius-full, 9999px)',
            background: 'linear-gradient(135deg, var(--warning-glass, rgba(242, 201, 76, 0.15)) 0%, var(--warning-glass-alt, rgba(255, 220, 120, 0.12)) 100%)',
            border: '2px solid var(--warning, #F2C94C)',
            boxShadow: '0 4px 12px var(--warning-shadow, rgba(242, 201, 76, 0.25))',
          }}
          aria-label="Mastery"
          title="View Mastery Progress"
        >
          <GraduationCap
            className="size-5"
            style={{ color: 'var(--warning, #F2C94C)' }}
          />
        </button>

        {/* Automation Settings */}
        <button
          onClick={() => navigate('/settings')}
          className="flex items-center justify-center transition-all duration-200 active:scale-90"
          style={{
            width: 'var(--size-10, 40px)',
            height: 'var(--size-10, 40px)',
            borderRadius: 'var(--radius-full, 9999px)',
            background: 'linear-gradient(135deg, rgba(100, 116, 139, 0.1) 0%, rgba(148, 163, 184, 0.08) 100%)',
            border: '2px solid var(--muted-foreground, #64748b)',
            boxShadow: '0 2px 8px rgba(100, 116, 139, 0.15)',
          }}
          aria-label="Automation Settings"
          title="Automation Settings"
        >
          <SlidersHorizontal
            className="size-5"
            style={{ color: 'var(--muted-foreground, #64748b)' }}
          />
        </button>
      </div>
    </div>
  );
}