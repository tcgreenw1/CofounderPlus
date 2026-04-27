import React, { useState } from 'react';
import { RefreshCw, Trophy, Settings, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MobileRoadmapHeaderProps {
  onRefreshRoadmap?: () => void;
  isRefreshing?: boolean;
}

export function MobileRoadmapHeader({
  onRefreshRoadmap,
  isRefreshing = false,
}: MobileRoadmapHeaderProps) {
  const navigate = useNavigate();

  return (
    <div
      className="w-full flex items-center justify-between gap-2 px-4 py-3"
      style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 252, 255, 0.98) 100%)',
        backdropFilter: 'blur(var(--blur-xl, 40px))',
        WebkitBackdropFilter: 'blur(var(--blur-xl, 40px))',
        borderBottom: '2px solid var(--border, rgba(226, 232, 240, 0.8))',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
      }}
    >
      {/* Roadmap Refresh Button */}
      <button
        onClick={onRefreshRoadmap}
        disabled={isRefreshing}
        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 transition-all duration-200 active:scale-95"
        style={{
          background: isRefreshing
            ? 'linear-gradient(135deg, var(--primary-glass, rgba(47, 128, 255, 0.15)) 0%, var(--primary-glass-alt, rgba(100, 150, 255, 0.12)) 100%)'
            : 'linear-gradient(135deg, var(--primary, #2F80FF) 0%, var(--primary-hover, #1e6dd8) 100%)',
          borderRadius: 'var(--radius-lg, 12px)',
          border: isRefreshing
            ? '2px solid var(--primary, #2F80FF)'
            : 'none',
          boxShadow: isRefreshing
            ? 'inset 0 2px 4px rgba(0, 0, 0, 0.1)'
            : '0 4px 12px var(--primary-shadow, rgba(47, 128, 255, 0.3))',
          cursor: isRefreshing ? 'not-allowed' : 'pointer',
          opacity: isRefreshing ? 0.7 : 1,
        }}
      >
        <RefreshCw
          className={`size-4 ${isRefreshing ? 'animate-spin' : ''}`}
          style={{
            color: isRefreshing
              ? 'var(--primary, #2F80FF)'
              : 'var(--primary-foreground, #ffffff)',
          }}
        />
        <span
          style={{
            fontSize: 'var(--text-sm, 14px)',
            fontWeight: 'var(--font-semibold, 600)',
            color: isRefreshing
              ? 'var(--primary, #2F80FF)'
              : 'var(--primary-foreground, #ffffff)',
          }}
        >
          {isRefreshing ? 'Updating...' : 'Refresh Roadmap'}
        </span>
        <Sparkles
          className="size-3"
          style={{
            color: isRefreshing
              ? 'var(--primary, #2F80FF)'
              : 'var(--primary-foreground, #ffffff)',
          }}
        />
      </button>

      {/* Mastery Button */}
      <button
        onClick={() => navigate('/mastery-agi')}
        className="flex items-center justify-center px-4 py-3 transition-all duration-200 active:scale-95"
        style={{
          background: 'linear-gradient(135deg, var(--warning-glass, rgba(242, 201, 76, 0.15)) 0%, var(--warning-glass-alt, rgba(255, 220, 120, 0.12)) 100%)',
          borderRadius: 'var(--radius-lg, 12px)',
          border: '2px solid var(--warning, #F2C94C)',
          boxShadow: '0 2px 8px var(--warning-shadow, rgba(242, 201, 76, 0.2))',
        }}
      >
        <Trophy
          className="size-5"
          style={{ color: 'var(--warning, #F2C94C)' }}
        />
      </button>

      {/* Automation Settings Button */}
      <button
        onClick={() => navigate('/settings')}
        className="flex items-center justify-center px-4 py-3 transition-all duration-200 active:scale-95"
        style={{
          background: 'linear-gradient(135deg, rgba(100, 116, 139, 0.1) 0%, rgba(148, 163, 184, 0.08) 100%)',
          borderRadius: 'var(--radius-lg, 12px)',
          border: '2px solid var(--muted-foreground, #64748b)',
          boxShadow: '0 2px 8px rgba(100, 116, 139, 0.15)',
        }}
      >
        <Settings
          className="size-5"
          style={{ color: 'var(--muted-foreground, #64748b)' }}
        />
      </button>
    </div>
  );
}
