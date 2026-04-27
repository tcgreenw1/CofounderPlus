import React from 'react';
import { Lock, Star, Crown, Zap, CheckCircle2 } from 'lucide-react';

/**
 * 1. Timeline / Bar
 * Horizontal frosted glass bar with:
 * - Chapter divider markers
 * - Progress ribbon overlay
 * - Slight iridescent edge
 */

interface TimelineBarProps {
  totalChapters?: number;
  currentChapter?: number;
  progress?: number; // 0-100
  width?: string | number;
  className?: string;
  onChapterClick?: (chapter: number) => void;
}

export function TimelineBar({
  totalChapters = 5,
  currentChapter = 2,
  progress = 40,
  width = '100%',
  className = '',
  onChapterClick,
}: TimelineBarProps) {
  const chapters = Array.from({ length: totalChapters }, (_, i) => i + 1);

  return (
    <div 
      className={`relative ${className}`}
      style={{ width }}
    >
      {/* Main Frosted Glass Bar */}
      <div
        className="relative roadmap-timeline overflow-hidden"
        style={{
          height: '16px',
          borderRadius: '12px',
          background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.15) 0%, rgba(248, 252, 255, 0.2) 100%)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          border: '1px solid rgba(47, 128, 255, 0.2)',
          boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.15), 0 2px 8px rgba(0, 0, 0, 0.08)',
        }}
      >
        {/* Iridescent Edge Top */}
        <div
          className="absolute top-0 left-0 right-0 h-px pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, rgba(47, 128, 255, 0.4) 0%, rgba(108, 92, 231, 0.3) 50%, rgba(47, 128, 255, 0.4) 100%)',
            filter: 'blur(0.5px)',
          }}
        />

        {/* Iridescent Edge Bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, rgba(39, 209, 124, 0.3) 0%, rgba(242, 201, 76, 0.2) 50%, rgba(39, 209, 124, 0.3) 100%)',
            filter: 'blur(0.5px)',
          }}
        />

        {/* Progress Ribbon Overlay */}
        <div
          className="absolute top-0 left-0 h-full transition-all duration-700 ease-out"
          style={{
            width: `${progress}%`,
            background: 'linear-gradient(90deg, rgba(47, 128, 255, 0.35) 0%, rgba(39, 209, 124, 0.35) 100%)',
            borderRadius: '12px',
            boxShadow: '0 0 16px rgba(47, 128, 255, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
          }}
        >
          {/* Animated shimmer effect */}
          <div
            className="absolute inset-0 animate-shimmer"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%)',
              backgroundSize: '200% 100%',
            }}
          />
        </div>

        {/* Chapter Divider Markers */}
        {chapters.map((chapter, index) => {
          if (index === 0) return null; // Skip first marker
          const position = (index / totalChapters) * 100;
          
          return (
            <div
              key={chapter}
              className="absolute top-0 h-full w-0.5 cursor-pointer transition-all duration-200 hover:w-1"
              style={{
                left: `${position}%`,
                background: 'linear-gradient(180deg, rgba(47, 128, 255, 0.4) 0%, rgba(108, 92, 231, 0.3) 100%)',
                boxShadow: '0 0 4px rgba(47, 128, 255, 0.3)',
                transform: 'translateX(-50%)',
              }}
              onClick={() => onChapterClick?.(chapter)}
            />
          );
        })}
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .animate-shimmer {
          animation: shimmer 3s linear infinite;
        }
      `}</style>
    </div>
  );
}

/**
 * Dark Mode Variant
 */
export function TimelineBarDark({
  totalChapters = 5,
  currentChapter = 2,
  progress = 40,
  width = '100%',
  className = '',
  onChapterClick,
}: TimelineBarProps) {
  const chapters = Array.from({ length: totalChapters }, (_, i) => i + 1);

  return (
    <div 
      className={`relative ${className}`}
      style={{ width }}
    >
      <div
        className="relative roadmap-timeline overflow-hidden"
        style={{
          height: '16px',
          borderRadius: '12px',
          background: 'linear-gradient(90deg, rgba(30, 40, 50, 0.4) 0%, rgba(20, 30, 45, 0.5) 100%)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          border: '1px solid rgba(47, 128, 255, 0.3)',
          boxShadow: 'inset 0 1px 2px rgba(47, 128, 255, 0.15), 0 2px 8px rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* Iridescent Edges */}
        <div
          className="absolute top-0 left-0 right-0 h-px pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, rgba(47, 128, 255, 0.6) 0%, rgba(108, 92, 231, 0.5) 50%, rgba(47, 128, 255, 0.6) 100%)',
            filter: 'blur(0.5px)',
          }}
        />

        {/* Progress Ribbon */}
        <div
          className="absolute top-0 left-0 h-full transition-all duration-700 ease-out"
          style={{
            width: `${progress}%`,
            background: 'linear-gradient(90deg, rgba(47, 128, 255, 0.5) 0%, rgba(39, 209, 124, 0.5) 100%)',
            borderRadius: '12px',
            boxShadow: '0 0 20px rgba(47, 128, 255, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
          }}
        >
          <div
            className="absolute inset-0 animate-shimmer"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.2) 50%, transparent 100%)',
              backgroundSize: '200% 100%',
            }}
          />
        </div>

        {/* Chapter Dividers */}
        {chapters.map((chapter, index) => {
          if (index === 0) return null;
          const position = (index / totalChapters) * 100;
          
          return (
            <div
              key={chapter}
              className="absolute top-0 h-full w-0.5 cursor-pointer transition-all duration-200 hover:w-1"
              style={{
                left: `${position}%`,
                background: 'linear-gradient(180deg, rgba(47, 128, 255, 0.6) 0%, rgba(108, 92, 231, 0.5) 100%)',
                boxShadow: '0 0 6px rgba(47, 128, 255, 0.5)',
                transform: 'translateX(-50%)',
              }}
              onClick={() => onChapterClick?.(chapter)}
            />
          );
        })}
      </div>
    </div>
  );
}

/**
 * 2. Timeline / Chapter Marker
 * Variants: Locked, Current, Completed, NextBoss
 */

interface ChapterMarkerProps {
  chapterNumber: number;
  label?: string;
  className?: string;
  onClick?: () => void;
}

// Variant: Locked
export function ChapterMarkerLocked({
  chapterNumber,
  label = 'Locked',
  className = '',
  onClick,
}: ChapterMarkerProps) {
  return (
    <div 
      className={`relative inline-flex flex-col items-center gap-2 cursor-not-allowed ${className}`}
      onClick={onClick}
    >
      {/* Marker Circle */}
      <div
        className="relative w-12 h-12 rounded-full flex items-center justify-center"
        style={{
          background: 'rgba(148, 163, 184, 0.12)',
          backdropFilter: 'blur(16px)',
          border: '2px solid rgba(100, 116, 139, 0.3)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          filter: 'saturate(0.5)',
        }}
      >
        <Lock className="w-5 h-5 text-slate-400" />
      </div>

      {/* Label */}
      <div className="text-xs font-semibold text-slate-400 text-center">
        {label}
      </div>
    </div>
  );
}

// Variant: Current
export function ChapterMarkerCurrent({
  chapterNumber,
  label = 'Current',
  className = '',
  onClick,
}: ChapterMarkerProps) {
  return (
    <div 
      className={`relative inline-flex flex-col items-center gap-2 cursor-pointer ${className}`}
      onClick={onClick}
    >
      {/* Pulsing Glow Ring */}
      <div
        className="absolute top-0 w-12 h-12 rounded-full animate-pulse-glow"
        style={{
          background: 'radial-gradient(circle, rgba(47, 128, 255, 0.4) 0%, transparent 70%)',
          filter: 'blur(12px)',
          transform: 'scale(1.3)',
        }}
      />

      {/* Marker Circle */}
      <div
        className="relative w-12 h-12 rounded-full flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, rgba(47, 128, 255, 0.25) 0%, rgba(180, 220, 255, 0.2) 100%)',
          backdropFilter: 'blur(16px)',
          border: '2.5px solid rgba(47, 128, 255, 0.7)',
          boxShadow: '0 4px 16px rgba(47, 128, 255, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.4)',
        }}
      >
        <span className="text-lg font-bold text-blue-600">{chapterNumber}</span>
        
        {/* Rotating ring */}
        <div
          className="absolute inset-0 rounded-full animate-spin-slow"
          style={{
            background: 'conic-gradient(from 0deg, transparent 0%, rgba(47, 128, 255, 0.4) 50%, transparent 100%)',
          }}
        />
      </div>

      {/* Label */}
      <div className="text-xs font-semibold text-blue-600 text-center">
        {label}
      </div>

      <style>{`
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.6; transform: scale(1.3); }
          50% { opacity: 1; transform: scale(1.5); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
        .animate-spin-slow {
          animation: spin-slow 4s linear infinite;
        }
      `}</style>
    </div>
  );
}

// Variant: Completed
export function ChapterMarkerCompleted({
  chapterNumber,
  label = 'Complete',
  className = '',
  onClick,
}: ChapterMarkerProps) {
  return (
    <div 
      className={`relative inline-flex flex-col items-center gap-2 cursor-pointer ${className}`}
      onClick={onClick}
    >
      {/* Green Glow */}
      <div
        className="absolute top-0 w-12 h-12 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(39, 209, 124, 0.3) 0%, transparent 70%)',
          filter: 'blur(10px)',
          transform: 'scale(1.2)',
        }}
      />

      {/* Marker Circle */}
      <div
        className="relative w-12 h-12 rounded-full flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, rgba(39, 209, 124, 0.3) 0%, rgba(100, 230, 150, 0.25) 100%)',
          backdropFilter: 'blur(16px)',
          border: '2px solid rgba(39, 209, 124, 0.6)',
          boxShadow: '0 3px 12px rgba(39, 209, 124, 0.35), inset 0 1px 2px rgba(255, 255, 255, 0.4)',
        }}
      >
        <CheckCircle2 className="w-6 h-6 text-green-600" />
      </div>

      {/* Label */}
      <div className="text-xs font-semibold text-green-600 text-center">
        {label}
      </div>
    </div>
  );
}

// Variant: NextBoss
export function ChapterMarkerNextBoss({
  chapterNumber,
  label = 'Boss',
  className = '',
  onClick,
}: ChapterMarkerProps) {
  return (
    <div 
      className={`relative inline-flex flex-col items-center gap-2 cursor-pointer ${className}`}
      onClick={onClick}
    >
      {/* Multi-color rotating glow */}
      <div
        className="absolute top-0 w-14 h-14 rounded-full animate-boss-glow"
        style={{
          background: 'radial-gradient(circle, rgba(242, 201, 76, 0.4) 0%, rgba(235, 87, 87, 0.3) 50%, transparent 70%)',
          filter: 'blur(14px)',
          transform: 'scale(1.4)',
        }}
      />

      {/* Marker Circle - Larger */}
      <div
        className="relative w-14 h-14 rounded-full flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, rgba(242, 201, 76, 0.25) 0%, rgba(235, 87, 87, 0.2) 100%)',
          backdropFilter: 'blur(20px)',
          border: '3px solid rgba(242, 201, 76, 0.7)',
          boxShadow: '0 6px 20px rgba(242, 201, 76, 0.5), inset 0 1px 2px rgba(255, 255, 255, 0.5)',
        }}
      >
        <Crown className="w-7 h-7 text-yellow-500 animate-pulse" />
        
        {/* Rotating double ring */}
        <div
          className="absolute inset-0 rounded-full animate-spin-slow"
          style={{
            background: 'conic-gradient(from 0deg, transparent 0%, rgba(242, 201, 76, 0.5) 25%, transparent 50%, rgba(235, 87, 87, 0.4) 75%, transparent 100%)',
          }}
        />
      </div>

      {/* Label */}
      <div className="text-xs font-bold text-yellow-600 text-center uppercase tracking-wide">
        {label}
      </div>

      <style>{`
        @keyframes boss-glow {
          0%, 100% { 
            opacity: 0.7; 
            transform: scale(1.4) rotate(0deg);
          }
          50% { 
            opacity: 1; 
            transform: scale(1.6) rotate(180deg);
          }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-boss-glow {
          animation: boss-glow 3s ease-in-out infinite;
        }
        .animate-spin-slow {
          animation: spin-slow 4s linear infinite;
        }
      `}</style>
    </div>
  );
}

/**
 * 3. Timeline / BossNode
 * Larger node component with:
 * - Dual-layer glass
 * - Stronger glow
 */

interface BossNodeProps {
  icon?: React.ReactNode;
  title?: string;
  subtitle?: string;
  xpBadge?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function TimelineBossNode({
  icon,
  title = "Boss Challenge",
  subtitle = "Epic milestone ahead",
  xpBadge,
  className = '',
  onClick,
}: BossNodeProps) {
  return (
    <div className="relative inline-block" onClick={onClick}>
      {/* Stronger Multi-layer Glow */}
      <div
        className="absolute inset-0 rounded-[32px] animate-boss-node-glow"
        style={{
          background: 'radial-gradient(circle, rgba(242, 201, 76, 0.4) 0%, rgba(235, 87, 87, 0.3) 40%, transparent 70%)',
          filter: 'blur(20px)',
          transform: 'scale(1.15)',
          zIndex: -2,
        }}
      />

      <div
        className="absolute inset-0 rounded-[32px]"
        style={{
          background: 'radial-gradient(circle, rgba(242, 201, 76, 0.25) 0%, transparent 60%)',
          filter: 'blur(30px)',
          transform: 'scale(1.25)',
          zIndex: -3,
        }}
      />

      {/* Outer Glass Layer */}
      <div
        className="relative rounded-[32px] p-1"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 250, 230, 0.15) 100%)',
          backdropFilter: 'blur(32px)',
          border: '2px solid rgba(242, 201, 76, 0.4)',
          boxShadow: '0 8px 32px rgba(242, 201, 76, 0.4), inset 0 1px 3px rgba(255, 255, 255, 0.4)',
        }}
      >
        {/* Inner Glass Layer */}
        <div
          className="relative group rounded-[28px] flex items-center gap-4 px-8 py-6 transition-all duration-300 ease-out cursor-pointer hover:scale-[1.02]"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 245, 220, 0.3) 100%)',
            backdropFilter: 'blur(24px)',
            border: '1.5px solid rgba(242, 201, 76, 0.3)',
            boxShadow: 'inset 0 2px 4px rgba(255, 255, 255, 0.3), 0 4px 16px rgba(0, 0, 0, 0.1)',
          }}
        >
          {/* Specular highlight */}
          <div
            className="absolute inset-0 rounded-[28px] pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, transparent 50%)',
            }}
          />

          {/* Crown Badge */}
          <div className="absolute -top-3 -right-3 z-20 animate-bounce-subtle">
            <div className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white p-2 rounded-full shadow-lg">
              <Crown className="w-5 h-5" />
            </div>
          </div>

          {/* Icon - Larger */}
          <div className="relative z-10 flex-shrink-0">
            {icon || (
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(242, 201, 76, 0.3) 0%, rgba(235, 87, 87, 0.2) 100%)',
                  border: '2px solid rgba(242, 201, 76, 0.5)',
                  boxShadow: '0 4px 12px rgba(242, 201, 76, 0.3)',
                }}
              >
                <Star className="w-8 h-8 text-yellow-600" />
              </div>
            )}
          </div>

          {/* Content - Larger */}
          <div className="relative z-10 flex-1 min-w-0 space-y-1">
            <p className="truncate font-bold text-xl text-amber-900" style={{ letterSpacing: '-0.02em' }}>
              {title}
            </p>
            <p className="text-sm text-amber-700 opacity-90">
              {subtitle}
            </p>
          </div>

          {/* XP Badge - Larger */}
          <div className="relative z-10 flex-shrink-0">
            {xpBadge || (
              <div
                className="px-4 py-2 rounded-full flex items-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, rgba(242, 201, 76, 0.3) 0%, rgba(255, 220, 120, 0.25) 100%)',
                  border: '2px solid rgba(242, 201, 76, 0.5)',
                  backdropFilter: 'blur(12px)',
                  boxShadow: '0 2px 8px rgba(242, 201, 76, 0.3)',
                }}
              >
                <Zap className="w-5 h-5 text-yellow-600" />
                <span className="text-yellow-700 font-bold text-lg">
                  +500
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes boss-node-glow {
          0%, 100% {
            opacity: 0.8;
            transform: scale(1.15);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }
        @keyframes bounce-subtle {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-4px);
          }
        }
        .animate-boss-node-glow {
          animation: boss-node-glow 3s ease-in-out infinite;
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

/**
 * Dark Mode Variant
 */
export function TimelineBossNodeDark({
  icon,
  title = "Boss Challenge",
  subtitle = "Epic milestone ahead",
  xpBadge,
  className = '',
  onClick,
}: BossNodeProps) {
  return (
    <div className="relative inline-block" onClick={onClick}>
      {/* Stronger Glow - Dark */}
      <div
        className="absolute inset-0 rounded-[32px] animate-boss-node-glow"
        style={{
          background: 'radial-gradient(circle, rgba(242, 201, 76, 0.5) 0%, rgba(235, 87, 87, 0.4) 40%, transparent 70%)',
          filter: 'blur(24px)',
          transform: 'scale(1.15)',
          zIndex: -2,
        }}
      />

      {/* Outer Glass Layer - Dark */}
      <div
        className="relative rounded-[32px] p-1"
        style={{
          background: 'linear-gradient(135deg, rgba(60, 50, 30, 0.4) 0%, rgba(50, 40, 20, 0.3) 100%)',
          backdropFilter: 'blur(32px)',
          border: '2px solid rgba(242, 201, 76, 0.5)',
          boxShadow: '0 8px 32px rgba(242, 201, 76, 0.5), inset 0 1px 3px rgba(242, 201, 76, 0.3)',
        }}
      >
        {/* Inner Glass Layer - Dark */}
        <div
          className="relative group rounded-[28px] flex items-center gap-4 px-8 py-6 transition-all duration-300 ease-out cursor-pointer hover:scale-[1.02]"
          style={{
            background: 'linear-gradient(135deg, rgba(50, 45, 30, 0.5) 0%, rgba(40, 35, 20, 0.6) 100%)',
            backdropFilter: 'blur(24px)',
            border: '1.5px solid rgba(242, 201, 76, 0.4)',
            boxShadow: 'inset 0 2px 4px rgba(242, 201, 76, 0.2), 0 4px 16px rgba(0, 0, 0, 0.4)',
          }}
        >
          <div
            className="absolute inset-0 rounded-[28px] pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, rgba(242, 201, 76, 0.15) 0%, transparent 50%)',
            }}
          />

          <div className="absolute -top-3 -right-3 z-20 animate-bounce-subtle">
            <div className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white p-2 rounded-full shadow-lg">
              <Crown className="w-5 h-5" />
            </div>
          </div>

          <div className="relative z-10 flex-shrink-0">
            {icon || (
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(242, 201, 76, 0.4) 0%, rgba(235, 87, 87, 0.3) 100%)',
                  border: '2px solid rgba(242, 201, 76, 0.6)',
                  boxShadow: '0 4px 12px rgba(242, 201, 76, 0.5)',
                }}
              >
                <Star className="w-8 h-8 text-yellow-400" />
              </div>
            )}
          </div>

          <div className="relative z-10 flex-1 min-w-0 space-y-1">
            <p className="truncate font-bold text-xl text-yellow-200" style={{ letterSpacing: '-0.02em' }}>
              {title}
            </p>
            <p className="text-sm text-yellow-300 opacity-90">
              {subtitle}
            </p>
          </div>

          <div className="relative z-10 flex-shrink-0">
            {xpBadge || (
              <div
                className="px-4 py-2 rounded-full flex items-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, rgba(242, 201, 76, 0.4) 0%, rgba(255, 220, 120, 0.35) 100%)',
                  border: '2px solid rgba(242, 201, 76, 0.6)',
                  backdropFilter: 'blur(12px)',
                  boxShadow: '0 2px 8px rgba(242, 201, 76, 0.4)',
                }}
              >
                <Zap className="w-5 h-5 text-yellow-400" />
                <span className="text-yellow-300 font-bold text-lg">
                  +500
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes boss-node-glow {
          0%, 100% {
            opacity: 0.8;
            transform: scale(1.15);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }
        @keyframes bounce-subtle {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-4px);
          }
        }
        .animate-boss-node-glow {
          animation: boss-node-glow 3s ease-in-out infinite;
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}