import React from 'react';
import { ZoomIn, ZoomOut, Maximize2, Check } from 'lucide-react';

/**
 * 1. Control / ButtonPrimary
 * Glass button with bold text and edge lighting
 */

interface ButtonPrimaryProps {
  children: React.ReactNode;
  onClick?: () => void;
  icon?: React.ReactNode;
  variant?: 'blue' | 'green' | 'yellow' | 'red' | 'orange';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

export function ControlButtonPrimary({
  children,
  onClick,
  icon,
  variant = 'blue',
  size = 'md',
  disabled = false,
  className = '',
}: ButtonPrimaryProps) {
  const variantStyles = {
    blue: {
      background: 'linear-gradient(135deg, rgba(47, 128, 255, 0.25) 0%, rgba(180, 220, 255, 0.2) 100%)',
      border: '2px solid rgba(47, 128, 255, 0.5)',
      edgeLighting: 'linear-gradient(180deg, rgba(47, 128, 255, 0.6) 0%, transparent 50%)',
      textColor: '#1e5bb8',
      shadow: '0 4px 16px rgba(47, 128, 255, 0.3)',
      hoverShadow: '0 6px 24px rgba(47, 128, 255, 0.45)',
      activeShadow: '0 2px 8px rgba(47, 128, 255, 0.4)',
      glow: 'rgba(47, 128, 255, 0.4)',
    },
    green: {
      background: 'linear-gradient(135deg, rgba(39, 209, 124, 0.25) 0%, rgba(100, 230, 150, 0.2) 100%)',
      border: '2px solid rgba(39, 209, 124, 0.5)',
      edgeLighting: 'linear-gradient(180deg, rgba(39, 209, 124, 0.6) 0%, transparent 50%)',
      textColor: '#1a8a52',
      shadow: '0 4px 16px rgba(39, 209, 124, 0.3)',
      hoverShadow: '0 6px 24px rgba(39, 209, 124, 0.45)',
      activeShadow: '0 2px 8px rgba(39, 209, 124, 0.4)',
      glow: 'rgba(39, 209, 124, 0.4)',
    },
    yellow: {
      background: 'linear-gradient(135deg, rgba(242, 201, 76, 0.25) 0%, rgba(255, 235, 150, 0.2) 100%)',
      border: '2px solid rgba(242, 201, 76, 0.5)',
      edgeLighting: 'linear-gradient(180deg, rgba(242, 201, 76, 0.6) 0%, transparent 50%)',
      textColor: '#b8860b',
      shadow: '0 4px 16px rgba(242, 201, 76, 0.3)',
      hoverShadow: '0 6px 24px rgba(242, 201, 76, 0.45)',
      activeShadow: '0 2px 8px rgba(242, 201, 76, 0.4)',
      glow: 'rgba(242, 201, 76, 0.4)',
    },
    red: {
      background: 'linear-gradient(135deg, rgba(235, 87, 87, 0.25) 0%, rgba(255, 140, 140, 0.2) 100%)',
      border: '2px solid rgba(235, 87, 87, 0.5)',
      edgeLighting: 'linear-gradient(180deg, rgba(235, 87, 87, 0.6) 0%, transparent 50%)',
      textColor: '#c93636',
      shadow: '0 4px 16px rgba(235, 87, 87, 0.3)',
      hoverShadow: '0 6px 24px rgba(235, 87, 87, 0.45)',
      activeShadow: '0 2px 8px rgba(235, 87, 87, 0.4)',
      glow: 'rgba(235, 87, 87, 0.4)',
    },
    orange: {
      background: 'linear-gradient(135deg, rgba(255, 149, 0, 0.25) 0%, rgba(255, 193, 7, 0.2) 100%)',
      border: '2px solid rgba(255, 149, 0, 0.5)',
      edgeLighting: 'linear-gradient(180deg, rgba(255, 149, 0, 0.6) 0%, transparent 50%)',
      textColor: '#c93636',
      shadow: '0 4px 16px rgba(255, 149, 0, 0.3)',
      hoverShadow: '0 6px 24px rgba(255, 149, 0, 0.45)',
      activeShadow: '0 2px 8px rgba(255, 149, 0, 0.4)',
      glow: 'rgba(255, 149, 0, 0.4)',
    },
  };

  const sizeStyles = {
    sm: {
      padding: '8px 16px',
      fontSize: '14px',
      iconSize: 'w-4 h-4',
      gap: 'gap-2',
      borderRadius: '10px',
    },
    md: {
      padding: '12px 24px',
      fontSize: '16px',
      iconSize: 'w-5 h-5',
      gap: 'gap-2',
      borderRadius: '12px',
    },
    lg: {
      padding: '16px 32px',
      fontSize: '18px',
      iconSize: 'w-6 h-6',
      gap: 'gap-3',
      borderRadius: '14px',
    },
  };

  const style = variantStyles[variant];
  const sizing = sizeStyles[size];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`roadmap-control-btn relative group ${sizing.gap} inline-flex items-center justify-center font-bold transition-all duration-200 ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98] cursor-pointer'
      } ${className}`}
      style={{
        padding: sizing.padding,
        fontSize: sizing.fontSize,
        borderRadius: sizing.borderRadius,
        background: style.background,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: style.border,
        boxShadow: style.shadow,
        color: style.textColor,
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.boxShadow = style.hoverShadow;
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.boxShadow = style.shadow;
        }
      }}
      onMouseDown={(e) => {
        if (!disabled) {
          e.currentTarget.style.boxShadow = style.activeShadow;
        }
      }}
      onMouseUp={(e) => {
        if (!disabled) {
          e.currentTarget.style.boxShadow = style.hoverShadow;
        }
      }}
    >
      {/* Edge Lighting - Top */}
      <div
        className="absolute inset-x-0 top-0 h-1/2 pointer-events-none rounded-t-[inherit]"
        style={{
          background: style.edgeLighting,
          opacity: 0.4,
        }}
      />

      {/* Specular Highlight */}
      <div
        className="absolute inset-0 pointer-events-none rounded-[inherit]"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, transparent 50%)',
        }}
      />

      {/* Glow on Hover */}
      <div
        className="absolute inset-0 -z-10 rounded-[inherit] opacity-0 group-hover:opacity-100 transition-opacity duration-200 blur-xl"
        style={{
          background: `radial-gradient(circle, ${style.glow} 0%, transparent 70%)`,
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex items-center gap-inherit">
        {icon && <span className={sizing.iconSize}>{icon}</span>}
        <span>{children}</span>
      </div>
    </button>
  );
}

/**
 * 2. Control / ButtonSecondary
 * Subtle glass variant
 */

interface ButtonSecondaryProps {
  children: React.ReactNode;
  onClick?: () => void;
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

export function ControlButtonSecondary({
  children,
  onClick,
  icon,
  size = 'md',
  disabled = false,
  className = '',
}: ButtonSecondaryProps) {
  const sizeStyles = {
    sm: {
      padding: '8px 16px',
      fontSize: '14px',
      iconSize: 'w-4 h-4',
      gap: 'gap-2',
      borderRadius: '10px',
    },
    md: {
      padding: '12px 24px',
      fontSize: '16px',
      iconSize: 'w-5 h-5',
      gap: 'gap-2',
      borderRadius: '12px',
    },
    lg: {
      padding: '16px 32px',
      fontSize: '18px',
      iconSize: 'w-6 h-6',
      gap: 'gap-3',
      borderRadius: '14px',
    },
  };

  const sizing = sizeStyles[size];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`roadmap-control-btn relative group ${sizing.gap} inline-flex items-center justify-center font-semibold transition-all duration-200 ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98] cursor-pointer'
      } ${className}`}
      style={{
        padding: sizing.padding,
        fontSize: sizing.fontSize,
        borderRadius: sizing.borderRadius,
        background: 'linear-gradient(135deg, rgba(148, 163, 184, 0.12) 0%, rgba(203, 213, 225, 0.1) 100%)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1.5px solid rgba(148, 163, 184, 0.25)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        color: '#475569',
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(148, 163, 184, 0.18) 0%, rgba(203, 213, 225, 0.15) 100%)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.12)';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(148, 163, 184, 0.12) 0%, rgba(203, 213, 225, 0.1) 100%)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
        }
      }}
      onMouseDown={(e) => {
        if (!disabled) {
          e.currentTarget.style.boxShadow = '0 1px 4px rgba(0, 0, 0, 0.12)';
        }
      }}
      onMouseUp={(e) => {
        if (!disabled) {
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.12)';
        }
      }}
    >
      {/* Subtle Highlight */}
      <div
        className="absolute inset-0 pointer-events-none rounded-[inherit]"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, transparent 50%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex items-center gap-inherit">
        {icon && <span className={sizing.iconSize}>{icon}</span>}
        <span>{children}</span>
      </div>
    </button>
  );
}

/**
 * 3. Control / ZoomControls
 * +/- buttons and Reset button
 */

interface ZoomControlsProps {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onReset?: () => void;
  currentZoom?: number;
  minZoom?: number;
  maxZoom?: number;
  className?: string;
}

export function ControlZoomControls({
  onZoomIn,
  onZoomOut,
  onReset,
  currentZoom = 100,
  minZoom = 50,
  maxZoom = 200,
  className = '',
}: ZoomControlsProps) {
  const isMinZoom = currentZoom <= minZoom;
  const isMaxZoom = currentZoom >= maxZoom;

  return (
    <div className={`roadmap-zoom-controls inline-flex items-center gap-2 ${className}`}>
      {/* Zoom Out Button */}
      <button
        onClick={onZoomOut}
        disabled={isMinZoom}
        className="relative group w-10 h-10 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(248, 252, 255, 0.9) 100%)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1.5px solid rgba(47, 128, 255, 0.2)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          opacity: isMinZoom ? 0.5 : 1,
          cursor: isMinZoom ? 'not-allowed' : 'pointer',
        }}
      >
        <div className="absolute inset-0 rounded-[inherit] pointer-events-none" style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, transparent 50%)',
        }} />
        <ZoomOut className="w-5 h-5 text-blue-600 mx-auto relative z-10" />
        
        {!isMinZoom && (
          <div
            className="absolute inset-0 -z-10 rounded-[inherit] opacity-0 group-hover:opacity-100 transition-opacity duration-200 blur-lg"
            style={{
              background: 'radial-gradient(circle, rgba(47, 128, 255, 0.3) 0%, transparent 70%)',
            }}
          />
        )}
      </button>

      {/* Zoom Display / Reset Button */}
      <button
        onClick={onReset}
        className="relative group px-4 h-10 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-105 active:scale-95"
        style={{
          background: 'linear-gradient(135deg, rgba(47, 128, 255, 0.15) 0%, rgba(180, 220, 255, 0.12) 100%)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1.5px solid rgba(47, 128, 255, 0.3)',
          boxShadow: '0 2px 8px rgba(47, 128, 255, 0.15)',
          color: '#1e5bb8',
        }}
      >
        <div className="absolute inset-0 rounded-[inherit] pointer-events-none" style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, transparent 50%)',
        }} />
        <div className="relative z-10 flex items-center gap-2">
          <Maximize2 className="w-4 h-4" />
          <span>{currentZoom}%</span>
        </div>
        
        <div
          className="absolute inset-0 -z-10 rounded-[inherit] opacity-0 group-hover:opacity-100 transition-opacity duration-200 blur-lg"
          style={{
            background: 'radial-gradient(circle, rgba(47, 128, 255, 0.3) 0%, transparent 70%)',
          }}
        />
      </button>

      {/* Zoom In Button */}
      <button
        onClick={onZoomIn}
        disabled={isMaxZoom}
        className="relative group w-10 h-10 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(248, 252, 255, 0.9) 100%)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1.5px solid rgba(47, 128, 255, 0.2)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          opacity: isMaxZoom ? 0.5 : 1,
          cursor: isMaxZoom ? 'not-allowed' : 'pointer',
        }}
      >
        <div className="absolute inset-0 rounded-[inherit] pointer-events-none" style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, transparent 50%)',
        }} />
        <ZoomIn className="w-5 h-5 text-blue-600 mx-auto relative z-10" />
        
        {!isMaxZoom && (
          <div
            className="absolute inset-0 -z-10 rounded-[inherit] opacity-0 group-hover:opacity-100 transition-opacity duration-200 blur-lg"
            style={{
              background: 'radial-gradient(circle, rgba(47, 128, 255, 0.3) 0%, transparent 70%)',
            }}
          />
        )}
      </button>
    </div>
  );
}

/**
 * 4. Control / FilterChip
 * Small glass pill with active/inactive variants
 */

interface FilterChipProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
  icon?: React.ReactNode;
  count?: number;
  color?: 'blue' | 'green' | 'yellow' | 'red';
  size?: 'sm' | 'md';
  disabled?: boolean;
  className?: string;
}

export function ControlFilterChip({
  label,
  active = false,
  onClick,
  icon,
  count,
  color = 'blue',
  size = 'md',
  disabled = false,
  className = '',
}: FilterChipProps) {
  const colorStyles = {
    blue: {
      active: {
        background: 'linear-gradient(135deg, rgba(47, 128, 255, 0.25) 0%, rgba(180, 220, 255, 0.2) 100%)',
        border: '1.5px solid rgba(47, 128, 255, 0.5)',
        color: '#1e5bb8',
        shadow: '0 2px 8px rgba(47, 128, 255, 0.3)',
        glow: 'rgba(47, 128, 255, 0.3)',
      },
      inactive: {
        background: 'rgba(148, 163, 184, 0.08)',
        border: '1.5px solid rgba(148, 163, 184, 0.2)',
        color: '#64748b',
        shadow: 'none',
        glow: 'transparent',
      },
    },
    green: {
      active: {
        background: 'linear-gradient(135deg, rgba(39, 209, 124, 0.25) 0%, rgba(100, 230, 150, 0.2) 100%)',
        border: '1.5px solid rgba(39, 209, 124, 0.5)',
        color: '#1a8a52',
        shadow: '0 2px 8px rgba(39, 209, 124, 0.3)',
        glow: 'rgba(39, 209, 124, 0.3)',
      },
      inactive: {
        background: 'rgba(148, 163, 184, 0.08)',
        border: '1.5px solid rgba(148, 163, 184, 0.2)',
        color: '#64748b',
        shadow: 'none',
        glow: 'transparent',
      },
    },
    yellow: {
      active: {
        background: 'linear-gradient(135deg, rgba(242, 201, 76, 0.25) 0%, rgba(255, 235, 150, 0.2) 100%)',
        border: '1.5px solid rgba(242, 201, 76, 0.5)',
        color: '#b8860b',
        shadow: '0 2px 8px rgba(242, 201, 76, 0.3)',
        glow: 'rgba(242, 201, 76, 0.3)',
      },
      inactive: {
        background: 'rgba(148, 163, 184, 0.08)',
        border: '1.5px solid rgba(148, 163, 184, 0.2)',
        color: '#64748b',
        shadow: 'none',
        glow: 'transparent',
      },
    },
    red: {
      active: {
        background: 'linear-gradient(135deg, rgba(235, 87, 87, 0.25) 0%, rgba(255, 140, 140, 0.2) 100%)',
        border: '1.5px solid rgba(235, 87, 87, 0.5)',
        color: '#c93636',
        shadow: '0 2px 8px rgba(235, 87, 87, 0.3)',
        glow: 'rgba(235, 87, 87, 0.3)',
      },
      inactive: {
        background: 'rgba(148, 163, 184, 0.08)',
        border: '1.5px solid rgba(148, 163, 184, 0.2)',
        color: '#64748b',
        shadow: 'none',
        glow: 'transparent',
      },
    },
  };

  const sizeStyles = {
    sm: {
      padding: '6px 12px',
      fontSize: '12px',
      iconSize: 'w-3 h-3',
      gap: 'gap-1.5',
      borderRadius: '8px',
    },
    md: {
      padding: '8px 16px',
      fontSize: '14px',
      iconSize: 'w-4 h-4',
      gap: 'gap-2',
      borderRadius: '10px',
    },
  };

  const style = active ? colorStyles[color].active : colorStyles[color].inactive;
  const sizing = sizeStyles[size];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`roadmap-filter-chip relative group inline-flex items-center ${sizing.gap} font-semibold transition-all duration-200 ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95 cursor-pointer'
      } ${className}`}
      style={{
        padding: sizing.padding,
        fontSize: sizing.fontSize,
        borderRadius: sizing.borderRadius,
        background: style.background,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: style.border,
        boxShadow: style.shadow,
        color: style.color,
      }}
    >
      {/* Subtle Highlight */}
      <div
        className="absolute inset-0 pointer-events-none rounded-[inherit]"
        style={{
          background: active
            ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, transparent 50%)'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
        }}
      />

      {/* Glow on Active */}
      {active && !disabled && (
        <div
          className="absolute inset-0 -z-10 rounded-[inherit] blur-lg"
          style={{
            background: `radial-gradient(circle, ${style.glow} 0%, transparent 70%)`,
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-10 flex items-center gap-inherit">
        {/* Active Checkmark */}
        {active && !icon && (
          <Check className={`${sizing.iconSize} flex-shrink-0`} />
        )}
        
        {/* Custom Icon */}
        {icon && <span className={`${sizing.iconSize} flex-shrink-0`}>{icon}</span>}
        
        {/* Label */}
        <span className="whitespace-nowrap">{label}</span>
        
        {/* Count Badge */}
        {count !== undefined && (
          <span
            className="px-1.5 py-0.5 text-xs rounded"
            style={{
              background: active ? 'rgba(255, 255, 255, 0.2)' : 'rgba(148, 163, 184, 0.15)',
              fontWeight: 'bold',
            }}
          >
            {count}
          </span>
        )}
      </div>
    </button>
  );
}

/**
 * FilterChip Group - manages multiple filter chips
 */
interface FilterChipGroupProps {
  filters: Array<{
    id: string;
    label: string;
    icon?: React.ReactNode;
    count?: number;
    color?: 'blue' | 'green' | 'yellow' | 'red';
  }>;
  activeFilters: string[];
  onFilterChange: (filters: string[]) => void;
  multiSelect?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function ControlFilterChipGroup({
  filters,
  activeFilters,
  onFilterChange,
  multiSelect = true,
  size = 'md',
  className = '',
}: FilterChipGroupProps) {
  const handleChipClick = (filterId: string) => {
    if (multiSelect) {
      // Toggle filter in multi-select mode
      const newFilters = activeFilters.includes(filterId)
        ? activeFilters.filter((id) => id !== filterId)
        : [...activeFilters, filterId];
      onFilterChange(newFilters);
    } else {
      // Single-select mode
      onFilterChange([filterId]);
    }
  };

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {filters.map((filter) => (
        <ControlFilterChip
          key={filter.id}
          label={filter.label}
          icon={filter.icon}
          count={filter.count}
          color={filter.color || 'blue'}
          size={size}
          active={activeFilters.includes(filter.id)}
          onClick={() => handleChipClick(filter.id)}
        />
      ))}
    </div>
  );
}