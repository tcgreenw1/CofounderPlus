import React from 'react';

interface NodeCoreProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  xpBadge?: React.ReactNode;
  onClick?: () => void;
  onDoubleClick?: () => void;
  className?: string;
  glowColor?: string;
  borderColor?: string;
  backgroundColor?: string;
}

export function NodeCore({
  icon,
  title,
  subtitle,
  xpBadge,
  onClick,
  onDoubleClick,
  className = '',
  glowColor = 'rgba(47, 128, 255, 0.3)',
  borderColor = 'rgba(47, 128, 255, 0.3)',
  backgroundColor = 'linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(248, 252, 255, 0.9) 100%)',
}: NodeCoreProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isPressed, setIsPressed] = React.useState(false);

  const handleClick = (e: React.MouseEvent) => {
    // Squish animation on click
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 150);
    onClick?.();
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onDoubleClick?.();
  };

  return (
    <div
      className={`roadmap-node group inline-block ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      style={{
        cursor: onClick || onDoubleClick ? 'pointer' : 'default',
        transition: 'transform 150ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        // Hover: Lift up 4px
        transform: isHovered && !isPressed ? 'translateY(-4px)' : isPressed ? 'scale(0.96)' : 'none',
      }}
    >
      {/* Glow Ring - Intensifies on Hover */}
      <div
        className="absolute inset-0 rounded-[inherit] -z-10 transition-all duration-300"
        style={{
          background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
          filter: 'blur(16px)',
          opacity: isHovered ? 1 : 0.6,
          transform: isHovered ? 'scale(1.15)' : 'scale(1.05)',
        }}
      />
      
      {/* Core Node Container */}
      <div 
        className={`
          relative group
          roadmap-radius-node roadmap-glass-blur-default roadmap-shadow-node
          flex items-center gap-3
          px-6 py-4
          transition-all duration-300 ease-out
          cursor-pointer
          ${className}
        `}
        style={{
          background: 'rgba(255, 255, 255, 0.14)',
          border: '1.5px solid transparent',
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0.14)),
            linear-gradient(135deg, 
              rgba(255, 255, 255, 0.4) 0%, 
              rgba(255, 255, 255, 0.1) 50%,
              rgba(255, 255, 255, 0.2) 100%
            )
          `,
          backgroundOrigin: 'border-box',
          backgroundClip: 'padding-box, border-box',
          boxShadow: `
            inset 0 1px 2px rgba(255, 255, 255, 0.3),
            0px 4px 12px rgba(0, 0, 0, 0.25)
          `,
        }}
      >
        {/* Soft Inner Glow Layer */}
        <div 
          className="absolute inset-0 roadmap-radius-node pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.08) 0%, transparent 60%)',
            mixBlendMode: 'overlay',
          }}
        />
        
        {/* Icon Placeholder - Left */}
        <div className="relative z-10 flex-shrink-0">
          {icon || (
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
              }}
            >
              <div className="w-5 h-5 rounded-sm bg-white/30" />
            </div>
          )}
        </div>
        
        {/* Title Text - Center Left */}
        <div className="relative z-10 flex-1 min-w-0">
          <p 
            className="truncate"
            style={{
              color: 'rgba(44, 44, 44, 0.95)',
              fontWeight: 600,
              fontSize: '15px',
              letterSpacing: '-0.01em',
            }}
          >
            {title}
          </p>
          {subtitle && (
            <p 
              className="truncate"
              style={{
                color: 'rgba(44, 44, 44, 0.75)',
                fontWeight: 400,
                fontSize: '13px',
                letterSpacing: '-0.01em',
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
        
        {/* XP Badge Placeholder - Right */}
        <div className="relative z-10 flex-shrink-0">
          {xpBadge || (
            <div 
              className="px-3 py-1.5 rounded-full flex items-center gap-1.5"
              style={{
                background: 'rgba(255, 255, 255, 0.25)',
                border: '1px solid rgba(255, 255, 255, 0.35)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <div className="w-3 h-3 rounded-full bg-white/40" />
              <span 
                style={{
                  color: 'rgba(44, 44, 44, 0.9)',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                XP
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Dark Mode Variant
 */
export function NodeCoreDark({ 
  icon, 
  title = "Node Title", 
  xpBadge,
  className = "",
  onClick 
}: NodeCoreProps) {
  return (
    <div className="relative inline-block" onClick={onClick}>
      {/* Glow Ring - Dark Mode */}
      <div 
        className="absolute inset-0 roadmap-radius-node opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: 'radial-gradient(circle, rgba(47, 128, 255, 0.25) 0%, transparent 70%)',
          filter: 'blur(16px)',
          transform: 'scale(1.05)',
          zIndex: -1,
        }}
      />
      
      {/* Core Node Container - Dark */}
      <div 
        className={`
          relative group
          roadmap-radius-node roadmap-glass-blur-default roadmap-shadow-node
          flex items-center gap-3
          px-6 py-4
          transition-all duration-300 ease-out
          cursor-pointer
          ${className}
        `}
        style={{
          background: 'rgba(30, 40, 50, 0.14)',
          border: '1.5px solid transparent',
          backgroundImage: `
            linear-gradient(rgba(30, 40, 50, 0.14), rgba(30, 40, 50, 0.14)),
            linear-gradient(135deg, 
              rgba(47, 128, 255, 0.3) 0%, 
              rgba(47, 128, 255, 0.1) 50%,
              rgba(108, 92, 231, 0.2) 100%
            )
          `,
          backgroundOrigin: 'border-box',
          backgroundClip: 'padding-box, border-box',
          boxShadow: `
            inset 0 1px 2px rgba(47, 128, 255, 0.2),
            0px 4px 12px rgba(0, 0, 0, 0.4)
          `,
        }}
      >
        {/* Soft Inner Glow Layer - Dark */}
        <div 
          className="absolute inset-0 roadmap-radius-node pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 50% 0%, rgba(47, 128, 255, 0.12) 0%, transparent 60%)',
            mixBlendMode: 'overlay',
          }}
        />
        
        {/* Icon Placeholder - Left */}
        <div className="relative z-10 flex-shrink-0">
          {icon || (
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: 'rgba(47, 128, 255, 0.15)',
                border: '1px solid rgba(47, 128, 255, 0.3)',
              }}
            >
              <div className="w-5 h-5 rounded-sm bg-blue-400/30" />
            </div>
          )}
        </div>
        
        {/* Title Text - Center Left */}
        <div className="relative z-10 flex-1 min-w-0">
          <p 
            className="truncate"
            style={{
              color: 'rgba(255, 255, 255, 0.95)',
              fontWeight: 600,
              fontSize: '15px',
              letterSpacing: '-0.01em',
            }}
          >
            {title}
          </p>
        </div>
        
        {/* XP Badge Placeholder - Right */}
        <div className="relative z-10 flex-shrink-0">
          {xpBadge || (
            <div 
              className="px-3 py-1.5 rounded-full flex items-center gap-1.5"
              style={{
                background: 'rgba(47, 128, 255, 0.2)',
                border: '1px solid rgba(47, 128, 255, 0.35)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <div className="w-3 h-3 rounded-full bg-blue-400/40" />
              <span 
                style={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                XP
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}