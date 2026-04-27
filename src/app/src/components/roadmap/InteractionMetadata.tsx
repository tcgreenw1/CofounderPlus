import React from 'react';

/**
 * Interaction Metadata Documentation
 * 
 * This file documents all interaction patterns used in the roadmap system
 */

export interface InteractionMetadata {
  // Node Interactions
  node: {
    hover: {
      transform: 'translateY(-4px)';
      glowIntensity: 'scale(1.15) opacity(1)';
      duration: '300ms';
      easing: 'ease-out';
    };
    click: {
      transform: 'scale(0.96)';
      duration: '150ms';
      easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)';
      action: 'Open Right Panel';
    };
    doubleClick: {
      action: 'Zoom into node';
      zoomLevel: '150%';
      cameraTransition: '600ms ease-in-out';
    };
  };

  // Branch Interactions
  branch: {
    collapse: {
      maxHeight: '0px';
      opacity: 0;
      transform: 'scaleY(0.95)';
      duration: '500ms';
      easing: 'ease-in-out';
      action: 'Compress vertical auto layout';
    };
    expand: {
      maxHeight: '1000px';
      opacity: 1;
      transform: 'scaleY(1)';
      duration: '500ms';
      easing: 'ease-in-out';
      action: 'Grow vertical auto layout';
    };
  };

  // Camera Interactions
  camera: {
    recenter: {
      action: 'Pan to recommended node';
      duration: '800ms';
      easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)';
      smoothScroll: true;
    };
    zoomToNode: {
      action: 'Zoom and center on specific node';
      zoomLevel: '150%';
      duration: '600ms';
      easing: 'ease-in-out';
    };
  };

  // Button Interactions
  button: {
    hover: {
      scale: 1.02;
      shadow: 'enhanced';
      glowOpacity: 1;
      duration: '200ms';
    };
    active: {
      scale: 0.98;
      shadow: 'reduced';
      duration: '150ms';
    };
  };
}

/**
 * Animation Timings Reference
 */
export const ANIMATION_TIMINGS = {
  // Instant (< 100ms)
  instant: {
    duration: 50,
    easing: 'linear',
  },

  // Quick (100-200ms)
  quick: {
    duration: 150,
    easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // Bouncy
  },

  // Normal (200-400ms)
  normal: {
    duration: 300,
    easing: 'ease-out',
  },

  // Smooth (400-600ms)
  smooth: {
    duration: 500,
    easing: 'ease-in-out',
  },

  // Slow (600-1000ms)
  slow: {
    duration: 800,
    easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)', // Material Design Standard
  },
};

/**
 * Transform Presets
 */
export const TRANSFORM_PRESETS = {
  // Lift on hover
  lift: {
    hover: 'translateY(-4px)',
    rest: 'translateY(0)',
  },

  // Squish on click
  squish: {
    active: 'scale(0.96)',
    rest: 'scale(1)',
  },

  // Grow on hover
  grow: {
    hover: 'scale(1.02)',
    rest: 'scale(1)',
  },

  // Shrink on click
  shrink: {
    active: 'scale(0.98)',
    rest: 'scale(1)',
  },

  // Rotate chevron
  chevronCollapsed: 'rotate(-90deg)',
  chevronExpanded: 'rotate(0deg)',

  // Branch collapse
  branchCollapsed: 'scaleY(0.95)',
  branchExpanded: 'scaleY(1)',
};

/**
 * Glow Intensity Levels
 */
export const GLOW_INTENSITIES = {
  rest: {
    opacity: 0.6,
    scale: 1.05,
    blur: '16px',
  },
  hover: {
    opacity: 1,
    scale: 1.15,
    blur: '20px',
  },
  active: {
    opacity: 0.8,
    scale: 1.1,
    blur: '18px',
  },
};

/**
 * Usage Examples
 */

// Example 1: Node with hover/click interactions
export function InteractiveNodeExample() {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isPressed, setIsPressed] = React.useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      style={{
        transform: isHovered && !isPressed 
          ? TRANSFORM_PRESETS.lift.hover 
          : isPressed 
          ? TRANSFORM_PRESETS.squish.active 
          : 'none',
        transition: `transform ${ANIMATION_TIMINGS.normal.duration}ms ${ANIMATION_TIMINGS.normal.easing}`,
      }}
    >
      {/* Node content */}
    </div>
  );
}

// Example 2: Branch collapse/expand
export function InteractiveBranchExample() {
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  return (
    <div
      style={{
        maxHeight: isCollapsed ? '0px' : '1000px',
        opacity: isCollapsed ? 0 : 1,
        transform: isCollapsed 
          ? TRANSFORM_PRESETS.branchCollapsed 
          : TRANSFORM_PRESETS.branchExpanded,
        transformOrigin: 'top',
        transition: `all ${ANIMATION_TIMINGS.smooth.duration}ms ${ANIMATION_TIMINGS.smooth.easing}`,
        overflow: 'hidden',
      }}
    >
      {/* Branch content */}
    </div>
  );
}

// Example 3: Camera pan to node
export function CameraPanExample() {
  const scrollToNode = (nodeElement: HTMLElement) => {
    nodeElement.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'center',
    });
  };

  return null; // Function only
}

/**
 * Interaction State Machine
 */
export type NodeInteractionState = 
  | 'idle'
  | 'hovering'
  | 'pressing'
  | 'selected'
  | 'zoomed';

export type BranchInteractionState = 
  | 'expanded'
  | 'collapsing'
  | 'collapsed'
  | 'expanding';

export type CameraInteractionState = 
  | 'idle'
  | 'panning'
  | 'zooming'
  | 'recentering';

/**
 * Keyboard Shortcuts
 */
export const KEYBOARD_SHORTCUTS = {
  // Navigation
  'Arrow Up': 'Move to previous node',
  'Arrow Down': 'Move to next node',
  'Arrow Left': 'Move to previous branch',
  'Arrow Right': 'Move to next branch',
  
  // Actions
  'Enter': 'Select/activate node',
  'Space': 'Toggle branch collapse',
  'Escape': 'Deselect / Close panel',
  
  // Zoom
  '+': 'Zoom in',
  '-': 'Zoom out',
  '0': 'Reset zoom',
  
  // Camera
  'Home': 'Recenter to recommended node',
  'F': 'Focus on selected node',
};

/**
 * Accessibility Metadata
 */
export const ACCESSIBILITY_METADATA = {
  node: {
    role: 'button',
    ariaLabel: (title: string) => `Node: ${title}`,
    ariaPressed: (isSelected: boolean) => isSelected,
    tabIndex: 0,
  },
  branch: {
    role: 'region',
    ariaLabel: (label: string) => `Branch: ${label}`,
    ariaExpanded: (isExpanded: boolean) => isExpanded,
  },
  button: {
    role: 'button',
    ariaLabel: (action: string) => action,
    ariaDisabled: (isDisabled: boolean) => isDisabled,
  },
};

/**
 * Touch Gestures (for future mobile support)
 */
export const TOUCH_GESTURES = {
  tap: 'Select node',
  doubleTap: 'Zoom into node',
  longPress: 'Open context menu',
  swipeLeft: 'Collapse branch',
  swipeRight: 'Expand branch',
  pinchIn: 'Zoom out',
  pinchOut: 'Zoom in',
  twoFingerTap: 'Recenter view',
};

/**
 * Performance Considerations
 */
export const PERFORMANCE_NOTES = {
  useWillChange: [
    'transform', // For hover/click animations
    'opacity', // For fade animations
  ],
  useGPUAcceleration: [
    'translateZ(0)', // Force GPU rendering
    'transform: translate3d()', // 3D transforms
  ],
  debounce: {
    zoom: 100, // ms
    search: 300, // ms
    resize: 150, // ms
  },
  throttle: {
    scroll: 16, // ~60fps
    pan: 16, // ~60fps
  },
};

export default InteractionMetadata;
