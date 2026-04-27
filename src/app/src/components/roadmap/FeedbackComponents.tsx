import React, { useState, useEffect } from 'react';

/**
 * 3. Feedback / XPBurst
 * 10-14 particle shapes with fade + drift animation
 */

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  rotation: number;
  delay: number;
  duration: number;
  shape: 'circle' | 'square' | 'star' | 'diamond' | 'plus';
  color: string;
}

interface XPBurstProps {
  xpAmount?: number;
  particleCount?: number;
  colors?: string[];
  onComplete?: () => void;
  trigger?: boolean;
  className?: string;
}

export function FeedbackXPBurst({
  xpAmount = 100,
  particleCount = 12,
  colors = ['#2F80FF', '#27D17C', '#F2C94C', '#EB5757'],
  onComplete,
  trigger = false,
  className = '',
}: XPBurstProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!trigger) return;

    // Generate particles
    const newParticles: Particle[] = Array.from({ length: particleCount }, (_, i) => {
      const angle = (360 / particleCount) * i;
      const distance = 80 + Math.random() * 40;
      const x = Math.cos((angle * Math.PI) / 180) * distance;
      const y = Math.sin((angle * Math.PI) / 180) * distance;

      const shapes: Particle['shape'][] = ['circle', 'square', 'star', 'diamond', 'plus'];
      
      return {
        id: i,
        x,
        y,
        size: 8 + Math.random() * 8,
        rotation: Math.random() * 360,
        delay: Math.random() * 100,
        duration: 800 + Math.random() * 400,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        color: colors[Math.floor(Math.random() * colors.length)],
      };
    });

    setParticles(newParticles);
    setIsActive(true);

    // Clean up after animation
    const maxDuration = Math.max(...newParticles.map((p) => p.duration + p.delay));
    const timer = setTimeout(() => {
      setIsActive(false);
      onComplete?.();
    }, maxDuration);

    return () => clearTimeout(timer);
  }, [trigger, particleCount]); // Removed colors and onComplete from dependencies

  if (!isActive) return null;

  return (
    <div className={`absolute inset-0 pointer-events-none z-50 ${className}`}>
      {/* Central XP Label */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-xp-label"
        style={{
          animation: 'xp-label 1000ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <div
          className="px-4 py-2 rounded-full font-bold text-lg"
          style={{
            background: 'linear-gradient(135deg, rgba(242, 201, 76, 0.3), rgba(255, 220, 120, 0.25))',
            border: '2px solid rgba(242, 201, 76, 0.6)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 4px 16px rgba(242, 201, 76, 0.4)',
            color: '#b8860b',
          }}
        >
          +{xpAmount} XP
        </div>
      </div>

      {/* Particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            animation: `particle-drift ${particle.duration}ms ease-out forwards`,
            animationDelay: `${particle.delay}ms`,
            '--drift-x': `${particle.x}px`,
            '--drift-y': `${particle.y}px`,
          } as React.CSSProperties}
        >
          <ParticleShape
            shape={particle.shape}
            size={particle.size}
            rotation={particle.rotation}
            color={particle.color}
          />
        </div>
      ))}

      <style>{`
        @keyframes xp-label {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.5);
          }
          50% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.1);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -80%) scale(0.8);
          }
        }

        @keyframes particle-drift {
          0% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1) rotate(0deg);
          }
          100% {
            opacity: 0;
            transform: translate(
              calc(-50% + var(--drift-x)),
              calc(-50% + var(--drift-y))
            ) scale(0.3) rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Particle Shape Component
 */
interface ParticleShapeProps {
  shape: 'circle' | 'square' | 'star' | 'diamond' | 'plus';
  size: number;
  rotation: number;
  color: string;
}

function ParticleShape({ shape, size, rotation, color }: ParticleShapeProps) {
  const shapeStyles = {
    circle: {
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: '50%',
      background: color,
      boxShadow: `0 0 ${size}px ${color}40`,
    },
    square: {
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: '2px',
      background: color,
      transform: `rotate(${rotation}deg)`,
      boxShadow: `0 0 ${size}px ${color}40`,
    },
    diamond: {
      width: `${size}px`,
      height: `${size}px`,
      background: color,
      transform: 'rotate(45deg)',
      boxShadow: `0 0 ${size}px ${color}40`,
    },
    plus: {},
    star: {},
  };

  if (shape === 'plus') {
    return (
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          position: 'relative',
          transform: `rotate(${rotation}deg)`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '30%',
            top: '35%',
            background: color,
            boxShadow: `0 0 ${size}px ${color}40`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: '30%',
            height: '100%',
            left: '35%',
            background: color,
            boxShadow: `0 0 ${size}px ${color}40`,
          }}
        />
      </div>
    );
  }

  if (shape === 'star') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={color}
        style={{
          filter: `drop-shadow(0 0 ${size / 2}px ${color}40)`,
          transform: `rotate(${rotation}deg)`,
        }}
      >
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
      </svg>
    );
  }

  return <div style={shapeStyles[shape]} />;
}

/**
 * 4. Feedback / PathHighlight
 * Neon line with animated pulse
 */

interface PathHighlightProps {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color?: string;
  thickness?: number;
  pulseSpeed?: number;
  glowIntensity?: number;
  dashed?: boolean;
  animated?: boolean;
  className?: string;
}

export function FeedbackPathHighlight({
  startX,
  startY,
  endX,
  endY,
  color = '#2F80FF',
  thickness = 3,
  pulseSpeed = 2000,
  glowIntensity = 20,
  dashed = false,
  animated = true,
  className = '',
}: PathHighlightProps) {
  // Calculate control points for curved path
  const deltaX = endX - startX;
  const deltaY = endY - startY;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  
  // Create a smooth curve
  const controlX1 = startX + deltaX * 0.25;
  const controlY1 = startY - distance * 0.15;
  const controlX2 = startX + deltaX * 0.75;
  const controlY2 = endY - distance * 0.15;

  const pathData = `M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`;

  // Calculate viewBox to contain the entire path
  const padding = glowIntensity * 2;
  const minX = Math.min(startX, endX, controlX1, controlX2) - padding;
  const minY = Math.min(startY, endY, controlY1, controlY2) - padding;
  const maxX = Math.max(startX, endX, controlX1, controlX2) + padding;
  const maxY = Math.max(startY, endY, controlY1, controlY2) + padding;
  const viewBox = `${minX} ${minY} ${maxX - minX} ${maxY - minY}`;

  return (
    <svg
      className={`absolute inset-0 pointer-events-none ${className}`}
      viewBox={viewBox}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'visible',
      }}
    >
      <defs>
        {/* Glow filter */}
        <filter id={`path-glow-${color.replace('#', '')}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={glowIntensity / 2} result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Gradient for pulse effect */}
        {animated && (
          <linearGradient id={`path-gradient-${color.replace('#', '')}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3">
              <animate
                attributeName="stop-opacity"
                values="0.3;1;0.3"
                dur={`${pulseSpeed}ms`}
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="50%" stopColor={color} stopOpacity="1">
              <animate
                attributeName="offset"
                values="0;1;0"
                dur={`${pulseSpeed}ms`}
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="100%" stopColor={color} stopOpacity="0.3">
              <animate
                attributeName="stop-opacity"
                values="0.3;1;0.3"
                dur={`${pulseSpeed}ms`}
                repeatCount="indefinite"
              />
            </stop>
          </linearGradient>
        )}
      </defs>

      {/* Base glow layer */}
      <path
        d={pathData}
        stroke={color}
        strokeWidth={thickness + 4}
        fill="none"
        opacity="0.3"
        filter={`url(#path-glow-${color.replace('#', '')})`}
        strokeDasharray={dashed ? '10 5' : 'none'}
      />

      {/* Main path */}
      <path
        d={pathData}
        stroke={animated ? `url(#path-gradient-${color.replace('#', '')})` : color}
        strokeWidth={thickness}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={dashed ? '10 5' : 'none'}
        filter={`url(#path-glow-${color.replace('#', '')})`}
      />

      {/* Animated dots traveling along path */}
      {animated && (
        <>
          <circle r={thickness + 2} fill={color} opacity="0.8">
            <animateMotion dur={`${pulseSpeed}ms`} repeatCount="indefinite">
              <mpath href={`#motion-path-${color.replace('#', '')}`} />
            </animateMotion>
          </circle>
          <path id={`motion-path-${color.replace('#', '')}`} d={pathData} fill="none" />
        </>
      )}
    </svg>
  );
}

/**
 * PathHighlight Straight Line Variant
 */
export function FeedbackPathHighlightStraight({
  startX,
  startY,
  endX,
  endY,
  color = '#2F80FF',
  thickness = 3,
  pulseSpeed = 2000,
  glowIntensity = 20,
  dashed = false,
  animated = true,
  className = '',
}: PathHighlightProps) {
  const pathData = `M ${startX} ${startY} L ${endX} ${endY}`;

  const padding = glowIntensity * 2;
  const minX = Math.min(startX, endX) - padding;
  const minY = Math.min(startY, endY) - padding;
  const maxX = Math.max(startX, endX) + padding;
  const maxY = Math.max(startY, endY) + padding;
  const viewBox = `${minX} ${minY} ${maxX - minX} ${maxY - minY}`;

  return (
    <svg
      className={`absolute inset-0 pointer-events-none ${className}`}
      viewBox={viewBox}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'visible',
      }}
    >
      <defs>
        <filter id={`path-glow-straight-${color.replace('#', '')}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={glowIntensity / 2} result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {animated && (
          <linearGradient id={`path-gradient-straight-${color.replace('#', '')}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="50%" stopColor={color} stopOpacity="1">
              <animate
                attributeName="offset"
                values="0;1;0"
                dur={`${pulseSpeed}ms`}
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="100%" stopColor={color} stopOpacity="0.4" />
          </linearGradient>
        )}
      </defs>

      {/* Glow layer */}
      <path
        d={pathData}
        stroke={color}
        strokeWidth={thickness + 6}
        fill="none"
        opacity="0.25"
        filter={`url(#path-glow-straight-${color.replace('#', '')})`}
        strokeDasharray={dashed ? '8 4' : 'none'}
      />

      {/* Main path */}
      <path
        d={pathData}
        stroke={animated ? `url(#path-gradient-straight-${color.replace('#', '')})` : color}
        strokeWidth={thickness}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={dashed ? '8 4' : 'none'}
        filter={`url(#path-glow-straight-${color.replace('#', '')})`}
      />

      {/* Animated pulse dot */}
      {animated && (
        <circle r={thickness + 3} fill={color} opacity="0.9">
          <animateMotion dur={`${pulseSpeed}ms`} repeatCount="indefinite">
            <mpath href={`#motion-path-straight-${color.replace('#', '')}`} />
          </animateMotion>
        </circle>
      )}
      <path id={`motion-path-straight-${color.replace('#', '')}`} d={pathData} fill="none" style={{ display: 'none' }} />
    </svg>
  );
}

/**
 * Multi-Path Highlight - for showing multiple connections
 */
interface MultiPathHighlightProps {
  paths: Array<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    color?: string;
  }>;
  thickness?: number;
  pulseSpeed?: number;
  glowIntensity?: number;
  staggerDelay?: number;
  className?: string;
}

export function FeedbackMultiPathHighlight({
  paths,
  thickness = 3,
  pulseSpeed = 2000,
  glowIntensity = 20,
  staggerDelay = 200,
  className = '',
}: MultiPathHighlightProps) {
  return (
    <div className={`absolute inset-0 ${className}`}>
      {paths.map((path, index) => (
        <div
          key={index}
          style={{
            animationDelay: `${index * staggerDelay}ms`,
          }}
        >
          <FeedbackPathHighlight
            startX={path.startX}
            startY={path.startY}
            endX={path.endX}
            endY={path.endY}
            color={path.color || '#2F80FF'}
            thickness={thickness}
            pulseSpeed={pulseSpeed}
            glowIntensity={glowIntensity}
            animated={true}
          />
        </div>
      ))}
    </div>
  );
}