import React, { useRef, useState, useEffect, ReactNode } from 'react';
import { Capacitor } from '@capacitor/core';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  disabled?: boolean;
  pullDownThreshold?: number;
  maxPullDown?: number;
}

/**
 * PullToRefresh component with premium liquid droplet animation
 * Features a single droplet that stretches elastically as user pulls
 * Updated with stricter activation to prevent accidental triggers
 */
export function PullToRefresh({ 
  onRefresh, 
  children, 
  disabled = false,
  pullDownThreshold = 150, // Increased from 120 to require much longer pull - prevents accidental triggers
  maxPullDown = 200 // Increased from 180 for better feel
}: PullToRefreshProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const currentY = useRef(0);
  const scrollTop = useRef(0);
  const isDraggingRef = useRef(false); // Use ref to avoid event listener recreation
  const minPullToStart = useRef(40); // Increased from 15 to 40 - need to pull more before activation

  // Enable on mobile devices AND mobile browser view
  const isMobile = Capacitor.isNativePlatform() || 
                   window.innerWidth <= 768 || 
                   /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                   ('ontouchstart' in window);

  useEffect(() => {
    if (disabled || !isMobile) return;

    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Only start if we're EXACTLY at the top (strict check)
      const scrollElement = container;
      scrollTop.current = scrollElement.scrollTop;

      // Must be at absolute top (0) to enable pull-to-refresh
      if (scrollTop.current === 0) {
        startY.current = e.touches[0].clientY;
        currentY.current = startY.current;
        // Don't set isDragging yet - wait for actual pull movement
        console.log('🎨 PullToRefresh: Touch started at top, monitoring for pull...');
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isRefreshing) return;

      // CRITICAL FIX: Check current scroll position, not just initial
      const scrollElement = container;
      const currentScrollTop = scrollElement.scrollTop;
      
      currentY.current = e.touches[0].clientY;
      const distance = currentY.current - startY.current;

      // Only activate if:
      // 1. User is pulling DOWN (positive distance)
      // 2. Currently at the absolute top (not just when touch started)
      // 3. Pull distance exceeds minimum threshold to differentiate from scroll
      // 4. Initial scroll position was at top
      if (distance > minPullToStart.current && 
          scrollTop.current === 0 && 
          currentScrollTop === 0) {
        // Now we're sure user wants to pull-to-refresh
        if (!isDraggingRef.current) {
          isDraggingRef.current = true;
          setIsDragging(true);
          console.log('🎨 PullToRefresh: Pull-to-refresh activated (minimum threshold exceeded)');
        }
        
        // Prevent default scrolling when pulling
        e.preventDefault();
        
        // Apply resistance to the pull (makes it feel more natural)
        const resistance = 0.4; // Increased resistance from 0.5 - harder to pull
        const adjustedDistance = Math.min((distance - minPullToStart.current) * resistance, maxPullDown);
        setPullDistance(adjustedDistance);
        
        if (adjustedDistance > 10) { // Only log significant pulls
          console.log('🎨 PullToRefresh: Pull distance:', adjustedDistance.toFixed(1));
        }
      } else if (distance < 0 || currentScrollTop > 0) {
        // User is scrolling up OR has scrolled down from top - cancel any pull state
        if (isDraggingRef.current) {
          isDraggingRef.current = false;
          setIsDragging(false);
          setPullDistance(0);
          console.log('🎨 PullToRefresh: Pull cancelled (scroll detected or not at top)');
        }
      }
    };

    const handleTouchEnd = () => {
      if (!isDraggingRef.current) return;

      const currentPullDistance = pullDistance;
      console.log('🎨 PullToRefresh: Touch ended, pull distance:', currentPullDistance.toFixed(1));
      isDraggingRef.current = false;
      setIsDragging(false);

      if (currentPullDistance >= pullDownThreshold && !isRefreshing) {
        // Trigger refresh
        console.log('🎨 PullToRefresh: Triggering refresh');
        setIsRefreshing(true);
        setPullDistance(pullDownThreshold); // Lock at threshold during refresh

        onRefresh()
          .then(() => {
            console.log('✅ Pull to refresh completed');
          })
          .catch((error) => {
            console.error('❌ Pull to refresh error:', error);
          })
          .finally(() => {
            setIsRefreshing(false);
            setPullDistance(0);
          });
      } else {
        // Snap back
        console.log('🎨 PullToRefresh: Snapping back');
        setPullDistance(0);
      }
    };

    // Add event listeners
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [disabled, isMobile, isRefreshing, pullDistance, pullDownThreshold, maxPullDown, onRefresh]);

  // Calculate progress (0 to 1)
  const progress = Math.min(pullDistance / pullDownThreshold, 1);
  
  // Droplet morphing calculations
  // Stage 1 (0-0.3): Circle
  // Stage 2 (0.3-0.7): Stretching oval
  // Stage 3 (0.7-1.0): Teardrop shape
  const getDropletPath = () => {
    const baseSize = 24; // Base circle size
    const stretchFactor = progress * 2; // How much to stretch
    
    if (progress < 0.3) {
      // Circle stage
      const radius = baseSize * (0.5 + progress * 0.5);
      return `M ${radius},${radius} m -${radius},0 a ${radius},${radius} 0 1,0 ${radius * 2},0 a ${radius},${radius} 0 1,0 -${radius * 2},0`;
    } else if (progress < 0.7) {
      // Oval stretching stage
      const width = baseSize * 1.2;
      const height = baseSize * (1 + stretchFactor * 0.8);
      const cx = width / 2;
      const cy = height / 2;
      return `M ${cx},0 Q ${width},${cy * 0.3} ${width},${cy} Q ${width},${height * 0.7} ${cx},${height} Q 0,${height * 0.7} 0,${cy} Q 0,${cy * 0.3} ${cx},0`;
    } else {
      // Teardrop stage
      const width = baseSize * 1.1;
      const height = baseSize * (1.5 + stretchFactor * 0.5);
      const cx = width / 2;
      const tipY = height * 0.9;
      const bulbBottom = height * 0.4;
      return `M ${cx},${tipY} Q ${width * 0.9},${bulbBottom} ${width},${bulbBottom * 0.6} Q ${width},${bulbBottom * 0.3} ${cx},0 Q 0,${bulbBottom * 0.3} 0,${bulbBottom * 0.6} Q ${width * 0.1},${bulbBottom} ${cx},${tipY}`;
    }
  };

  // Gradient colors based on toy-box-pop palette
  const getGradientColors = () => {
    if (progress < 0.5) {
      // Purple to cyan transition
      return {
        start: '#4B00FF',
        middle: '#7B3FFF',
        end: '#00E0FF'
      };
    } else if (progress < 0.9) {
      // Cyan dominant
      return {
        start: '#00E0FF',
        middle: '#3DFFEA',
        end: '#6CFF6C'
      };
    } else {
      // Ready to release - vibrant mix
      return {
        start: '#4B00FF',
        middle: '#00E0FF',
        end: '#FFCF00'
      };
    }
  };

  const colors = getGradientColors();
  const dropletOpacity = isDragging ? Math.min(0.3 + progress * 0.7, 1) : 0;
  const dropletScale = isDragging ? 0.8 + progress * 0.4 : 1;

  // Log animation state for debugging
  useEffect(() => {
    if (pullDistance > 0) {
      console.log('🎨 PullToRefresh Animation State:', {
        pullDistance: pullDistance.toFixed(1),
        isDragging,
        progress: progress.toFixed(2),
        dropletOpacity: dropletOpacity.toFixed(2),
        dropletScale: dropletScale.toFixed(2),
        isRefreshing
      });
    }
  }, [pullDistance, isDragging, progress, dropletOpacity, dropletScale, isRefreshing]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full overflow-auto"
      style={{
        // Ensure no boundaries or containers are visible
        background: 'transparent',
      }}
    >
      {/* Pull to Refresh Indicator - Premium Liquid Droplet */}
      {isMobile && (pullDistance > 0 || isRefreshing) && (
        <div
          className="fixed left-0 right-0 flex items-start justify-center pointer-events-none"
          style={{
            top: 'calc(env(safe-area-inset-top, 0px) + 60px)', // Position below top nav bar
            zIndex: 99999, // Ensure it's above everything (increased from 9999)
            overflow: 'visible', // Don't clip the droplet
            // No height constraint - let the droplet position naturally
          }}
        >
          <div 
            className="relative"
            style={{
              paddingTop: `${Math.max(pullDistance * 0.3, 16)}px`,
              transform: `scale(${dropletScale})`,
              transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
              overflow: 'visible', // Ensure droplet isn't clipped
            }}
          >
            {isRefreshing ? (
              /* Refreshing - Pulsing droplet */
              <svg 
                width="48" 
                height="48" 
                viewBox="0 0 48 48"
                style={{
                  opacity: 1,
                }}
              >
                <defs>
                  <linearGradient id="refreshGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#4B00FF" />
                    <stop offset="50%" stopColor="#00E0FF" />
                    <stop offset="100%" stopColor="#6CFF6C" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                <circle 
                  cx="24" 
                  cy="24" 
                  r="18"
                  fill="url(#refreshGradient)"
                  filter="url(#glow)"
                  style={{
                    animation: 'pulse-droplet 1.5s ease-in-out infinite',
                  }}
                />
              </svg>
            ) : (
              /* Pulling - Morphing droplet */
              <svg 
                width="48" 
                height="64" 
                viewBox="0 0 48 64"
                style={{
                  opacity: dropletOpacity,
                  transition: isDragging ? 'none' : 'opacity 0.3s ease-out',
                }}
              >
                <defs>
                  <linearGradient id="dropletGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={colors.start} stopOpacity="0.95" />
                    <stop offset="50%" stopColor={colors.middle} stopOpacity="0.9" />
                    <stop offset="100%" stopColor={colors.end} stopOpacity="0.85" />
                  </linearGradient>
                  <filter id="droplet-glow">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                <g transform="translate(12, 8)">
                  <path
                    d={getDropletPath()}
                    fill="url(#dropletGradient)"
                    filter="url(#droplet-glow)"
                    style={{
                      transition: isDragging ? 'none' : 'd 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}
                  />
                  {/* Highlight for glass effect */}
                  <ellipse
                    cx={progress < 0.7 ? "12" : "10"}
                    cy={progress < 0.3 ? "8" : "6"}
                    rx={6 + progress * 2}
                    ry={4 + progress * 1}
                    fill="white"
                    opacity={0.3 + progress * 0.2}
                    style={{
                      transition: isDragging ? 'none' : 'all 0.3s ease-out',
                    }}
                  />
                </g>
              </svg>
            )}
          </div>
        </div>
      )}

      {/* Main Content - Wrapper that translates down */}
      <div
        style={{
          transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : undefined,
          transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {children}
      </div>
      
      {/* CSS Animations */}
      <style>{`
        @keyframes pulse-droplet {
          0%, 100% {
            transform: scale(1);
            opacity: 0.9;
          }
          50% {
            transform: scale(1.15);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}