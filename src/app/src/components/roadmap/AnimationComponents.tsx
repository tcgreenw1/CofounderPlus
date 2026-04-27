import React, { useEffect, useState } from 'react';
import { Sparkles, Edit3, Trash2 } from 'lucide-react';

/**
 * Animation Components Library
 * 
 * Complete set of prototype animations for roadmap interactions:
 * 1. Node Spawn - Bounce
 * 2. AGI Insert - Drop-in
 * 3. AGI Reorder - Slide Path
 * 4. AGI Removal - Fade/Dissolve
 * 5. Node Complete - Burst + Particles (already in FeedbackComponents)
 * 6. Path Highlight - Neon Pulse (already in FeedbackComponents)
 * 7. Timeline Progress - Ribbon Sweep
 */

// ============================================================================
// 1. NODE SPAWN - BOUNCE
// ============================================================================

interface NodeSpawnAnimationProps {
  children: React.ReactNode;
  trigger: boolean;
  delay?: number;
  onComplete?: () => void;
}

/**
 * Node Spawn Animation - Bounce
 * 
 * Metadata:
 * - Duration: 600ms
 * - Easing: cubic-bezier(0.68, -0.55, 0.265, 1.55) (elastic)
 * - Effect: Scale 0 → 1.1 → 1 with rotation
 * - Opacity: 0 → 1
 */
export function NodeSpawnAnimation({
  children,
  trigger,
  delay = 0,
  onComplete,
}: NodeSpawnAnimationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (trigger) {
      setTimeout(() => {
        setIsVisible(true);
        setTimeout(() => {
          onComplete?.();
        }, 600);
      }, delay);
    }
  }, [trigger, delay, onComplete]);

  return (
    <div
      style={{
        animation: isVisible ? 'nodeSpawnBounce 600ms cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards' : 'none',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'none' : 'scale(0) rotate(-12deg)',
      }}
    >
      {children}
      
      <style>{`
        @keyframes nodeSpawnBounce {
          0% {
            transform: scale(0) rotate(-12deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.1) rotate(4deg);
            opacity: 1;
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// 2. AGI INSERT - DROP-IN
// ============================================================================

interface AGIInsertAnimationProps {
  children: React.ReactNode;
  trigger: boolean;
  delay?: number;
  onComplete?: () => void;
}

/**
 * AGI Insert Animation - Drop-in
 * 
 * Metadata:
 * - Duration: 500ms
 * - Easing: cubic-bezier(0.34, 1.56, 0.64, 1) (bouncy)
 * - Effect: Drop from above (-80px) with bounce
 * - Glow: Purple AGI glow appears
 * - Badge: AGI sparkle badge floats in
 */
export function AGIInsertAnimation({
  children,
  trigger,
  delay = 0,
  onComplete,
}: AGIInsertAnimationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (trigger) {
      setTimeout(() => {
        setIsVisible(true);
        setTimeout(() => {
          onComplete?.();
        }, 500);
      }, delay);
    }
  }, [trigger, delay, onComplete]);

  return (
    <div className="relative">
      {/* AGI Glow Ring */}
      <div
        className="absolute inset-0 -z-10 rounded-[inherit]"
        style={{
          background: 'radial-gradient(circle, rgba(108, 92, 231, 0.4) 0%, transparent 70%)',
          filter: 'blur(20px)',
          animation: isVisible ? 'agiGlowFadeIn 500ms ease-out forwards' : 'none',
          opacity: 0,
        }}
      />

      {/* Node Content */}
      <div
        style={{
          animation: isVisible ? 'agiDropIn 500ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards' : 'none',
          transform: isVisible ? 'translateY(0)' : 'translateY(-80px)',
          opacity: isVisible ? 1 : 0,
        }}
      >
        {children}
      </div>

      {/* AGI Badge */}
      {isVisible && (
        <div
          className="absolute -top-2 -right-2 z-10"
          style={{
            animation: 'agiBadgeFloat 500ms cubic-bezier(0.34, 1.56, 0.64, 1) 200ms forwards',
            opacity: 0,
            transform: 'scale(0) rotate(-45deg)',
          }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(108, 92, 231, 0.9), rgba(130, 110, 255, 0.95))',
              border: '2px solid rgba(255, 255, 255, 0.4)',
              boxShadow: '0 4px 12px rgba(108, 92, 231, 0.5), inset 0 1px 2px rgba(255, 255, 255, 0.3)',
            }}
          >
            <Sparkles className="w-4 h-4 text-white" />
          </div>
        </div>
      )}

      <style>{`
        @keyframes agiDropIn {
          0% {
            transform: translateY(-80px);
            opacity: 0;
          }
          60% {
            transform: translateY(8px);
            opacity: 1;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes agiGlowFadeIn {
          0% {
            opacity: 0;
            transform: scale(0.8);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes agiBadgeFloat {
          0% {
            opacity: 0;
            transform: scale(0) rotate(-45deg);
          }
          70% {
            opacity: 1;
            transform: scale(1.15) rotate(5deg);
          }
          100% {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// 3. AGI REORDER - SLIDE PATH
// ============================================================================

interface AGIReorderAnimationProps {
  children: React.ReactNode;
  trigger: boolean;
  fromX?: number;
  fromY?: number;
  toX?: number;
  toY?: number;
  duration?: number;
  onComplete?: () => void;
}

/**
 * AGI Reorder Animation - Slide Path
 * 
 * Metadata:
 * - Duration: 800ms
 * - Easing: cubic-bezier(0.4, 0.0, 0.2, 1) (Material)
 * - Effect: Slide along path with trail
 * - Trail: Purple glow follows node
 * - Badge: Edit icon indicates modification
 */
export function AGIReorderAnimation({
  children,
  trigger,
  fromX = 0,
  fromY = 0,
  toX = 0,
  toY = 0,
  duration = 800,
  onComplete,
}: AGIReorderAnimationProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (trigger) {
      setIsAnimating(true);
      setTimeout(() => {
        setIsAnimating(false);
        onComplete?.();
      }, duration);
    }
  }, [trigger, duration, onComplete]);

  return (
    <div className="relative">
      {/* Motion Trail */}
      {isAnimating && (
        <div
          className="absolute inset-0 -z-10 rounded-[inherit] pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(108, 92, 231, 0.3) 50%, transparent 100%)',
            filter: 'blur(16px)',
            animation: `slideTrail ${duration}ms linear`,
          }}
        />
      )}

      {/* Node Content */}
      <div
        style={{
          transform: isAnimating 
            ? `translate(${toX - fromX}px, ${toY - fromY}px)` 
            : 'translate(0, 0)',
          transition: isAnimating ? `transform ${duration}ms cubic-bezier(0.4, 0.0, 0.2, 1)` : 'none',
          position: 'relative',
          zIndex: isAnimating ? 100 : 'auto',
        }}
      >
        {children}
      </div>

      {/* Edit Badge */}
      {isAnimating && (
        <div
          className="absolute -top-2 -right-2 z-[101]"
          style={{
            animation: `editBadgePulse ${duration}ms ease-in-out infinite`,
          }}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(108, 92, 231, 0.9), rgba(130, 110, 255, 0.95))',
              border: '2px solid rgba(255, 255, 255, 0.4)',
              boxShadow: '0 4px 12px rgba(108, 92, 231, 0.5)',
            }}
          >
            <Edit3 className="w-3.5 h-3.5 text-white" />
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideTrail {
          0% {
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }

        @keyframes editBadgePulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// 4. AGI REMOVAL - FADE/DISSOLVE
// ============================================================================

interface AGIRemovalAnimationProps {
  children: React.ReactNode;
  trigger: boolean;
  onComplete?: () => void;
}

/**
 * AGI Removal Animation - Fade/Dissolve
 * 
 * Metadata:
 * - Duration: 600ms
 * - Easing: ease-out
 * - Effect: Dissolve into particles that float up
 * - Opacity: 1 → 0
 * - Scale: 1 → 0.8
 * - Particles: 8-12 small circles float upward
 */
export function AGIRemovalAnimation({
  children,
  trigger,
  onComplete,
}: AGIRemovalAnimationProps) {
  const [isRemoving, setIsRemoving] = useState(false);
  const [particles] = useState(() => 
    Array.from({ length: 10 }, (_, i) => ({
      id: i,
      angle: (Math.PI * 2 * i) / 10,
      distance: 60 + Math.random() * 40,
      delay: i * 50,
      duration: 500 + Math.random() * 200,
    }))
  );

  useEffect(() => {
    if (trigger) {
      setIsRemoving(true);
      setTimeout(() => {
        onComplete?.();
      }, 600);
    }
  }, [trigger, onComplete]);

  return (
    <div className="relative">
      {/* Dissolving Particles */}
      {isRemoving && particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full pointer-events-none"
          style={{
            background: 'rgba(235, 87, 87, 0.6)',
            boxShadow: '0 0 8px rgba(235, 87, 87, 0.4)',
            animation: `particleDissolve ${particle.duration}ms ease-out ${particle.delay}ms forwards`,
            '--angle': `${particle.angle}rad`,
            '--distance': `${particle.distance}px`,
          } as React.CSSProperties}
        />
      ))}

      {/* Removal Badge */}
      {isRemoving && (
        <div
          className="absolute -top-2 -right-2 z-10"
          style={{
            animation: 'removalBadgeFade 600ms ease-out forwards',
          }}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(235, 87, 87, 0.9), rgba(255, 100, 100, 0.95))',
              border: '2px solid rgba(255, 255, 255, 0.4)',
              boxShadow: '0 4px 12px rgba(235, 87, 87, 0.5)',
            }}
          >
            <Trash2 className="w-3.5 h-3.5 text-white" />
          </div>
        </div>
      )}

      {/* Node Content - Fading */}
      <div
        style={{
          animation: isRemoving ? 'nodeFadeDissolve 600ms ease-out forwards' : 'none',
          opacity: isRemoving ? 0 : 1,
        }}
      >
        {children}
      </div>

      <style>{`
        @keyframes nodeFadeDissolve {
          0% {
            opacity: 1;
            transform: scale(1) rotate(0deg);
            filter: blur(0px);
          }
          100% {
            opacity: 0;
            transform: scale(0.8) rotate(-8deg);
            filter: blur(4px);
          }
        }

        @keyframes particleDissolve {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) translate(0, 0) scale(0);
          }
          30% {
            opacity: 1;
            transform: translate(-50%, -50%) 
                       translate(
                         calc(cos(var(--angle)) * var(--distance) * 0.3),
                         calc(sin(var(--angle)) * var(--distance) * 0.3)
                       ) 
                       scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) 
                       translate(
                         calc(cos(var(--angle)) * var(--distance)),
                         calc(sin(var(--angle)) * var(--distance))
                       ) 
                       scale(0.5);
          }
        }

        @keyframes removalBadgeFade {
          0% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
          100% {
            opacity: 0;
            transform: scale(0.5);
          }
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// 7. TIMELINE PROGRESS - RIBBON SWEEP
// ============================================================================

interface TimelineRibbonSweepProps {
  progress: number; // 0-100
  color?: string;
  duration?: number;
  trigger?: boolean;
}

/**
 * Timeline Progress - Ribbon Sweep
 * 
 * Metadata:
 * - Duration: 1200ms
 * - Easing: cubic-bezier(0.4, 0.0, 0.2, 1) (Material)
 * - Effect: Shimmering ribbon sweeps across
 * - Gradient: Iridescent multi-color
 * - Particles: Trailing sparkles
 */
export function TimelineRibbonSweep({
  progress,
  color = '#2F80FF',
  duration = 1200,
  trigger = false,
}: TimelineRibbonSweepProps) {
  const [isSweeping, setIsSweeping] = useState(false);

  useEffect(() => {
    if (trigger) {
      setIsSweeping(true);
      setTimeout(() => {
        setIsSweeping(false);
      }, duration);
    }
  }, [trigger, duration]);

  return (
    <div className="relative w-full h-full overflow-hidden rounded-[inherit]">
      {/* Base Progress Fill */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(90deg, ${color}60 0%, ${color}40 100%)`,
          width: `${progress}%`,
          transition: 'width 700ms ease-out',
        }}
      />

      {/* Ribbon Sweep Effect */}
      {isSweeping && (
        <>
          {/* Main Ribbon */}
          <div
            className="absolute inset-y-0 left-0 w-64 pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.6) 50%, transparent 100%)',
              animation: `ribbonSweep ${duration}ms cubic-bezier(0.4, 0.0, 0.2, 1) forwards`,
              mixBlendMode: 'overlay',
            }}
          />

          {/* Iridescent Layer */}
          <div
            className="absolute inset-y-0 left-0 w-48 pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(108, 92, 231, 0.4) 30%, rgba(47, 128, 255, 0.4) 50%, rgba(39, 209, 124, 0.4) 70%, transparent 100%)',
              animation: `ribbonSweep ${duration}ms cubic-bezier(0.4, 0.0, 0.2, 1) 100ms forwards`,
              filter: 'blur(8px)',
            }}
          />

          {/* Trailing Sparkles */}
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute top-1/2 w-1.5 h-1.5 rounded-full pointer-events-none"
              style={{
                background: 'rgba(255, 255, 255, 0.8)',
                boxShadow: '0 0 8px rgba(255, 255, 255, 0.6)',
                animation: `sparkleTrail ${duration}ms cubic-bezier(0.4, 0.0, 0.2, 1) ${i * 80}ms forwards`,
                animationDelay: `${i * 80}ms`,
              }}
            />
          ))}
        </>
      )}

      <style>{`
        @keyframes ribbonSweep {
          0% {
            transform: translateX(-100%);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          80% {
            opacity: 1;
          }
          100% {
            transform: translateX(calc(100vw + 100%));
            opacity: 0;
          }
        }

        @keyframes sparkleTrail {
          0% {
            left: -10px;
            opacity: 0;
            transform: translateY(-50%) scale(0);
          }
          30% {
            opacity: 1;
            transform: translateY(-50%) scale(1);
          }
          70% {
            opacity: 1;
          }
          100% {
            left: calc(100% + 10px);
            opacity: 0;
            transform: translateY(-50%) scale(0.5);
          }
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// ANIMATION METADATA EXPORT
// ============================================================================

export const ANIMATION_METADATA = {
  nodeSpawn: {
    name: 'Node Spawn - Bounce',
    duration: 600,
    easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    effect: 'Scale 0 → 1.1 → 1 with rotation',
    trigger: 'New node added to roadmap',
  },
  agiInsert: {
    name: 'AGI Insert - Drop-in',
    duration: 500,
    easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    effect: 'Drop from above with purple glow',
    trigger: 'AGI suggests new node',
  },
  agiReorder: {
    name: 'AGI Reorder - Slide Path',
    duration: 800,
    easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    effect: 'Slide along path with trail',
    trigger: 'AGI reorders nodes',
  },
  agiRemoval: {
    name: 'AGI Removal - Fade/Dissolve',
    duration: 600,
    easing: 'ease-out',
    effect: 'Dissolve into particles',
    trigger: 'AGI removes node',
  },
  nodeComplete: {
    name: 'Node Complete - Burst + Particles',
    duration: '800-1200',
    easing: 'ease-out',
    effect: 'XP burst with particles',
    trigger: 'Node marked as complete',
    component: 'FeedbackXPBurst',
  },
  pathHighlight: {
    name: 'Path Highlight - Neon Pulse',
    duration: 2000,
    easing: 'linear',
    effect: 'Gradient pulse along path',
    trigger: 'Show dependency path',
    component: 'FeedbackPathHighlight',
  },
  timelineProgress: {
    name: 'Timeline Progress - Ribbon Sweep',
    duration: 1200,
    easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    effect: 'Iridescent ribbon sweep',
    trigger: 'Progress update',
  },
};

export default {
  NodeSpawnAnimation,
  AGIInsertAnimation,
  AGIReorderAnimation,
  AGIRemovalAnimation,
  TimelineRibbonSweep,
  ANIMATION_METADATA,
};
