import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

/**
 * 1. Branch / Lane
 * Vertical auto layout frame with:
 * - Color-coded left bar (6-8px)
 * - Category label at top
 * - Collapse/Expand toggle
 */

interface BranchLaneOriginalProps {
  categoryLabel: string;
  barColor?: string;
  barWidth?: number;
  children?: React.ReactNode;
  defaultExpanded?: boolean;
  onToggle?: (expanded: boolean) => void;
  className?: string;
}

export function BranchLaneOriginal({
  categoryLabel,
  barColor = '#2F80FF',
  barWidth = 6,
  children,
  defaultExpanded = true,
  onToggle,
  className = '',
}: BranchLaneOriginalProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const handleToggle = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    onToggle?.(newState);
  };

  return (
    <div className={`relative flex ${className}`}>
      {/* Color-coded Left Bar */}
      <div
        className="flex-shrink-0 roadmap-radius-tooltip transition-all duration-300"
        style={{
          width: `${barWidth}px`,
          background: `linear-gradient(180deg, ${barColor} 0%, ${barColor}CC 100%)`,
          boxShadow: `0 0 12px ${barColor}40, inset 0 1px 0 rgba(255, 255, 255, 0.3)`,
          opacity: isExpanded ? 1 : 0.4,
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 ml-4 space-y-4">
        {/* Header with Category Label and Toggle */}
        <div
          className="flex items-center justify-between p-4 roadmap-radius-tooltip cursor-pointer transition-all duration-200 hover:bg-white/30"
          onClick={handleToggle}
          style={{
            background: 'rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          }}
        >
          {/* Category Label */}
          <div className="flex items-center gap-3">
            {/* Color Indicator Dot */}
            <div
              className="w-3 h-3 rounded-full"
              style={{
                background: barColor,
                boxShadow: `0 0 8px ${barColor}60`,
              }}
            />
            <h3
              className="font-semibold"
              style={{
                fontSize: '16px',
                color: 'rgba(44, 44, 44, 0.95)',
                letterSpacing: '-0.01em',
              }}
            >
              {categoryLabel}
            </h3>
          </div>

          {/* Collapse/Expand Toggle */}
          <button
            className="p-2 rounded-lg transition-all duration-200 hover:bg-white/40"
            onClick={handleToggle}
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <ChevronDown className="w-5 h-5 text-slate-600 transition-transform duration-200" />
            ) : (
              <ChevronRight className="w-5 h-5 text-slate-600 transition-transform duration-200" />
            )}
          </button>
        </div>

        {/* Collapsible Content */}
        <div
          className="overflow-hidden transition-all duration-300 ease-out"
          style={{
            maxHeight: isExpanded ? '10000px' : '0',
            opacity: isExpanded ? 1 : 0,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * Dark Mode Variant
 */
export function BranchLaneDark({
  categoryLabel,
  barColor = '#2F80FF',
  barWidth = 6,
  children,
  defaultExpanded = true,
  onToggle,
  className = '',
}: BranchLaneOriginalProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const handleToggle = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    onToggle?.(newState);
  };

  return (
    <div className={`relative flex ${className}`}>
      {/* Color-coded Left Bar - Dark */}
      <div
        className="flex-shrink-0 roadmap-radius-tooltip transition-all duration-300"
        style={{
          width: `${barWidth}px`,
          background: `linear-gradient(180deg, ${barColor} 0%, ${barColor}99 100%)`,
          boxShadow: `0 0 16px ${barColor}60, inset 0 1px 0 ${barColor}40`,
          opacity: isExpanded ? 1 : 0.4,
        }}
      />

      {/* Main Content Area - Dark */}
      <div className="flex-1 ml-4 space-y-4">
        {/* Header - Dark */}
        <div
          className="flex items-center justify-between p-4 roadmap-radius-tooltip cursor-pointer transition-all duration-200 hover:bg-white/10"
          onClick={handleToggle}
          style={{
            background: 'rgba(30, 40, 50, 0.15)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(47, 128, 255, 0.2)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-3 h-3 rounded-full"
              style={{
                background: barColor,
                boxShadow: `0 0 12px ${barColor}80`,
              }}
            />
            <h3
              className="font-semibold"
              style={{
                fontSize: '16px',
                color: 'rgba(255, 255, 255, 0.95)',
                letterSpacing: '-0.01em',
              }}
            >
              {categoryLabel}
            </h3>
          </div>

          <button
            className="p-2 rounded-lg transition-all duration-200 hover:bg-white/10"
            onClick={handleToggle}
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <ChevronDown className="w-5 h-5 text-slate-300 transition-transform duration-200" />
            ) : (
              <ChevronRight className="w-5 h-5 text-slate-300 transition-transform duration-200" />
            )}
          </button>
        </div>

        <div
          className="overflow-hidden transition-all duration-300 ease-out"
          style={{
            maxHeight: isExpanded ? '10000px' : '0',
            opacity: isExpanded ? 1 : 0,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * 2. Branch / NodeContainer
 * Auto Layout: vertical with configurable spacing between nodes
 */

interface BranchNodeContainerProps {
  children: React.ReactNode;
  spacing?: number; // 24-40px
  className?: string;
}

export function BranchNodeContainer({
  children,
  spacing = 32,
  className = '',
}: BranchNodeContainerProps) {
  return (
    <div
      className={`flex flex-col ${className}`}
      style={{
        gap: `${spacing}px`,
      }}
    >
      {children}
    </div>
  );
}

/**
 * 3. Branch / DependencyLine
 * Curved vector line with:
 * - Semi-transparent colored stroke
 * - Soft glow
 * - Animate-able path metadata
 */

interface BranchDependencyLineProps {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color?: string;
  strokeWidth?: number;
  animated?: boolean;
  dashed?: boolean;
  glowIntensity?: number;
  curveIntensity?: number; // 0-1, controls how curved the line is
  className?: string;
}

export function BranchDependencyLine({
  startX,
  startY,
  endX,
  endY,
  color = '#2F80FF',
  strokeWidth = 3,
  animated = false,
  dashed = false,
  glowIntensity = 0.4,
  curveIntensity = 0.5,
  className = '',
}: BranchDependencyLineProps) {
  // Calculate control points for smooth curved path
  const deltaX = endX - startX;
  const deltaY = endY - startY;
  
  // Create smooth S-curve using cubic bezier
  const controlPoint1X = startX + deltaX * curveIntensity;
  const controlPoint1Y = startY;
  const controlPoint2X = endX - deltaX * curveIntensity;
  const controlPoint2Y = endY;

  // SVG path for curved line
  const pathData = `M ${startX} ${startY} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${endX} ${endY}`;

  // Calculate bounding box
  const minX = Math.min(startX, endX, controlPoint1X, controlPoint2X) - 20;
  const minY = Math.min(startY, endY, controlPoint1Y, controlPoint2Y) - 20;
  const width = Math.max(startX, endX, controlPoint1X, controlPoint2X) - minX + 40;
  const height = Math.max(startY, endY, controlPoint1Y, controlPoint2Y) - minY + 40;

  const adjustedPath = `M ${startX - minX} ${startY - minY} C ${controlPoint1X - minX} ${controlPoint1Y - minY}, ${controlPoint2X - minX} ${controlPoint2Y - minY}, ${endX - minX} ${endY - minY}`;

  return (
    <svg
      className={`absolute pointer-events-none ${className}`}
      style={{
        left: minX,
        top: minY,
        width,
        height,
        zIndex: 0,
      }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Glow filter */}
        <filter id={`glow-${color.replace('#', '')}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Arrow marker */}
        <marker
          id={`arrowhead-${color.replace('#', '')}`}
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path
            d="M0,0 L0,6 L9,3 z"
            fill={color}
            opacity={glowIntensity + 0.4}
          />
        </marker>
      </defs>

      {/* Glow layer */}
      <path
        d={adjustedPath}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth + 2}
        opacity={glowIntensity}
        filter={`url(#glow-${color.replace('#', '')})`}
        className={animated ? 'animate-path-glow' : ''}
      />

      {/* Main path */}
      <path
        d={adjustedPath}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={dashed ? '8 4' : 'none'}
        opacity={0.6}
        markerEnd={`url(#arrowhead-${color.replace('#', '')})`}
        className={`roadmap-branch transition-all duration-300 ${
          animated ? 'animate-path-flow' : ''
        }`}
        style={{
          filter: `drop-shadow(0 2px 4px ${color}40)`,
        }}
      />

      <style>{`
        @keyframes path-glow {
          0%, 100% {
            opacity: ${glowIntensity * 0.6};
          }
          50% {
            opacity: ${glowIntensity * 1.2};
          }
        }

        @keyframes path-flow {
          0% {
            stroke-dashoffset: 0;
          }
          100% {
            stroke-dashoffset: ${dashed ? '-12' : '0'};
          }
        }

        .animate-path-glow {
          animation: path-glow 2s ease-in-out infinite;
        }

        .animate-path-flow {
          animation: path-flow 1s linear infinite;
        }
      `}</style>
    </svg>
  );
}

/**
 * Straight dependency line variant (for simple connections)
 */
export function BranchDependencyLineStraight({
  startX,
  startY,
  endX,
  endY,
  color = '#2F80FF',
  strokeWidth = 3,
  animated = false,
  dashed = false,
  glowIntensity = 0.4,
  className = '',
}: BranchDependencyLineProps) {
  const minX = Math.min(startX, endX) - 20;
  const minY = Math.min(startY, endY) - 20;
  const width = Math.abs(endX - startX) + 40;
  const height = Math.abs(endY - startY) + 40;

  return (
    <svg
      className={`absolute pointer-events-none ${className}`}
      style={{
        left: minX,
        top: minY,
        width,
        height,
        zIndex: 0,
      }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id={`glow-straight-${color.replace('#', '')}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <marker
          id={`arrowhead-straight-${color.replace('#', '')}`}
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path
            d="M0,0 L0,6 L9,3 z"
            fill={color}
            opacity={glowIntensity + 0.4}
          />
        </marker>
      </defs>

      {/* Glow layer */}
      <line
        x1={startX - minX}
        y1={startY - minY}
        x2={endX - minX}
        y2={endY - minY}
        stroke={color}
        strokeWidth={strokeWidth + 2}
        opacity={glowIntensity}
        filter={`url(#glow-straight-${color.replace('#', '')})`}
        className={animated ? 'animate-path-glow' : ''}
      />

      {/* Main line */}
      <line
        x1={startX - minX}
        y1={startY - minY}
        x2={endX - minX}
        y2={endY - minY}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={dashed ? '8 4' : 'none'}
        opacity={0.6}
        markerEnd={`url(#arrowhead-straight-${color.replace('#', '')})`}
        className={`roadmap-branch transition-all duration-300 ${
          animated ? 'animate-path-flow' : ''
        }`}
        style={{
          filter: `drop-shadow(0 2px 4px ${color}40)`,
        }}
      />
    </svg>
  );
}

/**
 * 1. Branch / Lane
 * Vertical auto layout frame with:
 * - Color-coded left bar (6-8px)
 * - Category label at top
 * - Collapse/Expand toggle
 */

interface BranchLaneProps {
  label: string;
  color: string;
  nodeCount: number;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  children?: React.ReactNode;
  className?: string;
}

export function BranchLane({
  label,
  color,
  nodeCount,
  isCollapsed = false,
  onToggleCollapse,
  children,
  className = '',
}: BranchLaneProps) {
  return (
    <div className={`roadmap-branch-lane ${className}`}>
      {/* Branch Header */}
      <button
        onClick={onToggleCollapse}
        className="flex items-center gap-3 mb-4 w-full text-left group cursor-pointer transition-all duration-200 hover:scale-[1.01]"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(248, 252, 255, 0.7) 100%)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: '12px',
          padding: '12px 16px',
          border: `2px solid ${color}40`,
          boxShadow: `0 2px 8px ${color}20, inset 0 1px 2px rgba(255, 255, 255, 0.3)`,
        }}
      >
        {/* Color Indicator */}
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{
            background: color,
            boxShadow: `0 0 8px ${color}60`,
          }}
        />

        {/* Label */}
        <span className="flex-1 font-semibold text-slate-800">{label}</span>

        {/* Node Count Badge */}
        <div
          className="px-2 py-1 rounded-full text-xs font-bold"
          style={{
            background: `${color}20`,
            color: color,
            border: `1px solid ${color}40`,
          }}
        >
          {nodeCount}
        </div>

        {/* Chevron */}
        <ChevronDown
          className={`w-5 h-5 text-slate-600 transition-transform duration-300 ${
            isCollapsed ? '-rotate-90' : 'rotate-0'
          }`}
        />
      </button>

      {/* Branch Content - Animated Collapse/Expand */}
      <div
        className="overflow-hidden transition-all duration-500 ease-in-out"
        style={{
          maxHeight: isCollapsed ? '0px' : '1000px',
          opacity: isCollapsed ? 0 : 1,
          transform: isCollapsed ? 'scaleY(0.95)' : 'scaleY(1)',
          transformOrigin: 'top',
        }}
      >
        {children}
      </div>
    </div>
  );
}