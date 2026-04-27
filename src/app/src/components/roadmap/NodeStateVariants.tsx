import React from 'react';
import { Lock, Sparkles, CheckCircle2, AlertCircle, Zap } from 'lucide-react';

interface NodeStateProps {
  icon?: React.ReactNode;
  title?: string;
  xpBadge?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

/**
 * 1. Node / State / Available
 * Subtle blue edge with low glow
 */
export function NodeAvailable({ 
  icon, 
  title = "Available Node", 
  xpBadge,
  className = "",
  onClick 
}: NodeStateProps) {
  return (
    <div className="relative inline-block" onClick={onClick}>
      {/* Low Glow Ring */}
      <div 
        className="absolute inset-0 roadmap-radius-node opacity-40"
        style={{
          background: 'radial-gradient(circle, rgba(47, 128, 255, 0.08) 0%, transparent 70%)',
          filter: 'blur(8px)',
          transform: 'scale(1.03)',
          zIndex: -1,
        }}
      />
      
      <div 
        className={`relative group roadmap-radius-node roadmap-glass-blur-default flex items-center gap-3 px-6 py-4 transition-all duration-300 ease-out cursor-pointer ${className}`}
        style={{
          background: 'rgba(255, 255, 255, 0.14)',
          border: '1.5px solid rgba(47, 128, 255, 0.25)',
          boxShadow: `
            inset 0 1px 2px rgba(255, 255, 255, 0.3),
            0px 4px 12px rgba(0, 0, 0, 0.25),
            0 0 0 1px rgba(47, 128, 255, 0.15)
          `,
        }}
      >
        <div className="relative z-10 flex-shrink-0">{icon}</div>
        <div className="relative z-10 flex-1 min-w-0">
          <p className="truncate font-semibold text-slate-800">{title}</p>
        </div>
        <div className="relative z-10 flex-shrink-0">{xpBadge}</div>
      </div>
    </div>
  );
}

/**
 * 2. Node / State / Active
 * Strong blue glow with breathing pulse and scale-up
 */
export function NodeActive({ 
  icon, 
  title = "Active Node", 
  xpBadge,
  className = "",
  onClick 
}: NodeStateProps) {
  return (
    <div className="relative inline-block" onClick={onClick}>
      {/* Strong Breathing Glow Ring */}
      <div 
        className="absolute inset-0 roadmap-radius-node animate-breathing-glow roadmap-shadow-node-active"
        style={{
          background: 'radial-gradient(circle, rgba(47, 128, 255, 0.3) 0%, rgba(47, 128, 255, 0.1) 50%, transparent 70%)',
          filter: 'blur(16px)',
          transform: 'scale(1.08)',
          zIndex: -1,
        }}
      />
      
      <div 
        className={`relative group roadmap-radius-node roadmap-glass-blur-default flex items-center gap-3 px-6 py-4 transition-all duration-300 ease-out cursor-pointer ${className}`}
        style={{
          background: 'linear-gradient(135deg, rgba(47, 128, 255, 0.2) 0%, rgba(180, 220, 255, 0.15) 100%)',
          border: '2px solid rgba(47, 128, 255, 0.6)',
          boxShadow: `
            inset 0 1px 2px rgba(255, 255, 255, 0.4),
            0px 6px 18px rgba(47, 128, 255, 0.45),
            0 0 20px rgba(47, 128, 255, 0.3)
          `,
          transform: 'scale(1.02)',
          animation: 'gentle-pulse 3s ease-in-out infinite',
        }}
      >
        <div className="relative z-10 flex-shrink-0">{icon}</div>
        <div className="relative z-10 flex-1 min-w-0">
          <p className="truncate font-semibold text-blue-900">{title}</p>
        </div>
        <div className="relative z-10 flex-shrink-0">{xpBadge}</div>
      </div>
      
      <style>{`
        @keyframes breathing-glow {
          0%, 100% { opacity: 0.6; transform: scale(1.08); }
          50% { opacity: 1; transform: scale(1.12); }
        }
        @keyframes gentle-pulse {
          0%, 100% { transform: scale(1.02); }
          50% { transform: scale(1.03); }
        }
        .animate-breathing-glow {
          animation: breathing-glow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

/**
 * 3. Node / State / Recommended
 * Yellow halo ring with ripple animation and Z-lift
 */
export function NodeRecommended({ 
  icon, 
  title = "Recommended Node", 
  xpBadge,
  className = "",
  onClick 
}: NodeStateProps) {
  return (
    <button
      onClick={onClick}
      className="node-state-recommended relative transition-all duration-200 hover:scale-105 active:scale-95"
      style={{
        width: '180px',
        height: '120px',
        borderRadius: '16px',
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        border: '3px solid rgba(108, 92, 231, 0.6)',
        boxShadow: '0 0 40px rgba(108, 92, 231, 0.5), 0 4px 16px rgba(108, 92, 231, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px',
        gap: '8px',
        position: 'relative',
        overflow: 'visible',
      }}
    >
      {/* Glow Ring */}
      <div
        className="absolute inset-0 rounded-2xl animate-pulse"
        style={{
          background: 'transparent',
          border: '3px solid rgba(108, 92, 231, 0.4)',
          filter: 'blur(8px)',
          pointerEvents: 'none',
        }}
      />

      {/* AGI Recommended Badge */}
      <div
        className="absolute -top-3 -right-3 px-2 py-1 rounded-full flex items-center gap-1 z-10"
        style={{
          background: 'linear-gradient(135deg, rgba(108, 92, 231, 0.95), rgba(147, 51, 234, 0.95))',
          border: '2px solid rgba(255, 255, 255, 0.8)',
          boxShadow: '0 4px 12px rgba(108, 92, 231, 0.5)',
        }}
      >
        <Sparkles className="size-3 text-white" />
        <span className="text-xs font-bold text-white">AGI</span>
      </div>

      {/* Title */}
      <div className="text-center">
        <div className="font-bold text-purple-900 text-sm leading-tight">{title}</div>
      </div>

      {/* XP Badge */}
      {xpBadge}

      {/* Sparkle Icon */}
      <Sparkles className="size-6 text-purple-600 animate-pulse" />
    </button>
  );
}

/**
 * 4. Node / State / AI Inserted
 * Purple tint with glitter micro-particles and bounce-drop
 */
export function NodeAIInserted({ 
  icon, 
  title = "AI Inserted", 
  xpBadge,
  className = "",
  onClick 
}: NodeStateProps) {
  return (
    <div className="relative inline-block animate-bounce-drop" onClick={onClick}>
      {/* Purple Glow */}
      <div 
        className="absolute inset-0 roadmap-radius-node roadmap-shadow-node-ai"
        style={{
          background: 'radial-gradient(circle, rgba(108, 92, 231, 0.25) 0%, transparent 70%)',
          filter: 'blur(14px)',
          transform: 'scale(1.06)',
          zIndex: -1,
        }}
      />
      
      {/* Glitter Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden roadmap-radius-node">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-purple-400 rounded-full animate-glitter"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.2}s`,
              animationDuration: `${2 + Math.random()}s`,
            }}
          />
        ))}
      </div>
      
      <div 
        className={`relative group roadmap-radius-node roadmap-glass-blur-default flex items-center gap-3 px-6 py-4 transition-all duration-300 ease-out cursor-pointer ${className}`}
        style={{
          background: 'linear-gradient(135deg, rgba(108, 92, 231, 0.18) 0%, rgba(180, 170, 240, 0.15) 100%)',
          border: '2px solid rgba(108, 92, 231, 0.5)',
          boxShadow: `
            inset 0 1px 2px rgba(255, 255, 255, 0.35),
            0px 6px 18px rgba(108, 92, 231, 0.45),
            0 0 15px rgba(108, 92, 231, 0.25)
          `,
        }}
      >
        {/* AI Badge */}
        <div className="absolute -top-2 -right-2 z-20">
          <div className="bg-purple-500 text-white px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            AI
          </div>
        </div>
        
        <div className="relative z-10 flex-shrink-0">{icon}</div>
        <div className="relative z-10 flex-1 min-w-0">
          <p className="truncate font-semibold text-purple-900">{title}</p>
        </div>
        <div className="relative z-10 flex-shrink-0">{xpBadge}</div>
      </div>
      
      <style>{`
        @keyframes bounce-drop {
          0% { transform: translateY(-20px); opacity: 0; }
          50% { transform: translateY(0); }
          65% { transform: translateY(-8px); }
          80% { transform: translateY(0); }
          90% { transform: translateY(-4px); }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes glitter {
          0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
          50% { opacity: 1; transform: scale(1.5) rotate(180deg); }
        }
        .animate-bounce-drop {
          animation: bounce-drop 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .animate-glitter {
          animation: glitter 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

/**
 * 5. Node / State / AI Modified
 * Blue update badge with glow pulse
 */
export function NodeAIModified({ 
  icon, 
  title = "AI Modified", 
  xpBadge,
  className = "",
  onClick 
}: NodeStateProps) {
  return (
    <div className="relative inline-block" onClick={onClick}>
      {/* Pulsing Glow */}
      <div 
        className="absolute inset-0 roadmap-radius-node animate-glow-pulse"
        style={{
          background: 'radial-gradient(circle, rgba(47, 128, 255, 0.2) 0%, transparent 70%)',
          filter: 'blur(12px)',
          transform: 'scale(1.05)',
          zIndex: -1,
        }}
      />
      
      <div 
        className={`relative group roadmap-radius-node roadmap-glass-blur-default flex items-center gap-3 px-6 py-4 transition-all duration-300 ease-out cursor-pointer ${className}`}
        style={{
          background: 'linear-gradient(135deg, rgba(47, 128, 255, 0.12) 0%, rgba(180, 220, 255, 0.1) 100%)',
          border: '2px solid rgba(47, 128, 255, 0.4)',
          boxShadow: `
            inset 0 1px 2px rgba(255, 255, 255, 0.3),
            0px 4px 12px rgba(47, 128, 255, 0.3)
          `,
        }}
      >
        {/* Update Badge */}
        <div className="absolute -top-2 -right-2 z-20 animate-pulse">
          <div className="bg-blue-500 text-white px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Updated
          </div>
        </div>
        
        <div className="relative z-10 flex-shrink-0">{icon}</div>
        <div className="relative z-10 flex-1 min-w-0">
          <p className="truncate font-semibold text-blue-900">{title}</p>
        </div>
        <div className="relative z-10 flex-shrink-0">{xpBadge}</div>
      </div>
      
      <style>{`
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        .animate-glow-pulse {
          animation: glow-pulse 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

/**
 * 6. Node / State / Blocked
 * Desaturated with lock icon and dashed dependency texture
 */
export function NodeBlocked({ 
  icon, 
  title = "Blocked Node", 
  xpBadge,
  className = "",
  onClick 
}: NodeStateProps) {
  return (
    <div className="relative inline-block" onClick={onClick}>
      {/* Dashed Dependency Lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: -1 }}>
        <rect
          x="2"
          y="2"
          width="calc(100% - 4px)"
          height="calc(100% - 4px)"
          rx="28"
          fill="none"
          stroke="rgba(235, 87, 87, 0.3)"
          strokeWidth="2"
          strokeDasharray="8 4"
          className="animate-dash-flow"
        />
      </svg>
      
      <div 
        className={`relative group roadmap-radius-node roadmap-glass-blur-default flex items-center gap-3 px-6 py-4 transition-all duration-300 ease-out cursor-not-allowed ${className}`}
        style={{
          background: 'rgba(200, 200, 200, 0.15)',
          border: '1.5px solid rgba(235, 87, 87, 0.35)',
          boxShadow: `
            inset 0 1px 2px rgba(0, 0, 0, 0.1),
            0px 4px 12px rgba(0, 0, 0, 0.2)
          `,
          filter: 'saturate(0.3)',
        }}
      >
        {/* Lock Icon */}
        <div className="absolute -top-2 -right-2 z-20">
          <div className="bg-red-500 text-white p-1.5 rounded-full">
            <Lock className="w-3 h-3" />
          </div>
        </div>
        
        <div className="relative z-10 flex-shrink-0 opacity-50">{icon}</div>
        <div className="relative z-10 flex-1 min-w-0">
          <p className="truncate font-semibold text-slate-500">{title}</p>
        </div>
        <div className="relative z-10 flex-shrink-0 opacity-50">{xpBadge}</div>
      </div>
      
      <style>{`
        @keyframes dash-flow {
          to { stroke-dashoffset: -12; }
        }
        .animate-dash-flow {
          animation: dash-flow 1s linear infinite;
        }
      `}</style>
    </div>
  );
}

/**
 * 7. Node / State / Locked
 * Gray-blue static border with lock badge
 */
export function NodeLocked({ 
  icon, 
  title = "Locked Node", 
  xpBadge,
  className = "",
  onClick 
}: NodeStateProps) {
  return (
    <div className="relative inline-block" onClick={onClick}>
      <div 
        className={`relative group roadmap-radius-node roadmap-glass-blur-default flex items-center gap-3 px-6 py-4 transition-all duration-300 ease-out cursor-not-allowed ${className}`}
        style={{
          background: 'rgba(148, 163, 184, 0.12)',
          border: '2px solid rgba(100, 116, 139, 0.4)',
          boxShadow: `
            inset 0 1px 2px rgba(0, 0, 0, 0.08),
            0px 4px 12px rgba(0, 0, 0, 0.15)
          `,
          filter: 'saturate(0.5)',
        }}
      >
        {/* Lock Badge */}
        <div className="absolute -top-2 -right-2 z-20">
          <div className="bg-slate-500 text-white p-1.5 rounded-full">
            <Lock className="w-3 h-3" />
          </div>
        </div>
        
        <div className="relative z-10 flex-shrink-0 opacity-40">{icon}</div>
        <div className="relative z-10 flex-1 min-w-0">
          <p className="truncate font-semibold text-slate-400">{title}</p>
        </div>
        <div className="relative z-10 flex-shrink-0 opacity-40">{xpBadge}</div>
      </div>
    </div>
  );
}

/**
 * 8. Node / State / Failed
 * Matte red glass with crack texture and shake animation
 */
export function NodeFailed({ 
  icon, 
  title = "Failed Node", 
  xpBadge,
  className = "",
  onClick 
}: NodeStateProps) {
  return (
    <div className="relative inline-block animate-shake" onClick={onClick}>
      {/* Red Glow */}
      <div 
        className="absolute inset-0 roadmap-radius-node"
        style={{
          background: 'radial-gradient(circle, rgba(235, 87, 87, 0.2) 0%, transparent 70%)',
          filter: 'blur(10px)',
          transform: 'scale(1.04)',
          zIndex: -1,
        }}
      />
      
      {/* Crack Texture Overlay */}
      <div 
        className="absolute inset-0 roadmap-radius-node pointer-events-none overflow-hidden"
        style={{
          background: `
            linear-gradient(135deg, transparent 45%, rgba(235, 87, 87, 0.1) 46%, rgba(235, 87, 87, 0.1) 54%, transparent 55%),
            linear-gradient(45deg, transparent 45%, rgba(235, 87, 87, 0.1) 46%, rgba(235, 87, 87, 0.1) 54%, transparent 55%)
          `,
          backgroundSize: '20px 20px',
        }}
      />
      
      <div 
        className={`relative group roadmap-radius-node roadmap-glass-blur-default flex items-center gap-3 px-6 py-4 transition-all duration-300 ease-out cursor-pointer ${className}`}
        style={{
          background: 'linear-gradient(135deg, rgba(235, 87, 87, 0.25) 0%, rgba(255, 150, 150, 0.2) 100%)',
          border: '2px solid rgba(235, 87, 87, 0.6)',
          boxShadow: `
            inset 0 1px 2px rgba(235, 87, 87, 0.2),
            0px 4px 12px rgba(235, 87, 87, 0.4)
          `,
          backdropFilter: 'blur(28px) saturate(80%)',
        }}
      >
        {/* Error Icon */}
        <div className="absolute -top-2 -right-2 z-20">
          <div className="bg-red-500 text-white p-1.5 rounded-full">
            <AlertCircle className="w-4 h-4" />
          </div>
        </div>
        
        <div className="relative z-10 flex-shrink-0">{icon}</div>
        <div className="relative z-10 flex-1 min-w-0">
          <p className="truncate font-semibold text-red-900">{title}</p>
        </div>
        <div className="relative z-10 flex-shrink-0">{xpBadge}</div>
      </div>
      
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}

/**
 * 9. Node / State / Completed
 * Bright green with checkmark and XP burst
 */
export function NodeCompleted({ 
  icon, 
  title = "Completed", 
  xpBadge,
  className = "",
  onClick 
}: NodeStateProps) {
  return (
    <div className="relative inline-block" onClick={onClick}>
      {/* Green Glow */}
      <div 
        className="absolute inset-0 roadmap-radius-node"
        style={{
          background: 'radial-gradient(circle, rgba(39, 209, 124, 0.25) 0%, transparent 70%)',
          filter: 'blur(14px)',
          transform: 'scale(1.06)',
          zIndex: -1,
        }}
      />
      
      {/* XP Burst Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-visible">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute text-yellow-400 font-bold text-xs animate-xp-burst"
            style={{
              left: '50%',
              top: '50%',
              animationDelay: `${i * 0.08}s`,
              '--burst-angle': `${(i * 30)}deg`,
            } as React.CSSProperties}
          >
            +
          </div>
        ))}
      </div>
      
      <div 
        className={`relative group roadmap-radius-node roadmap-glass-blur-default flex items-center gap-3 px-6 py-4 transition-all duration-300 ease-out cursor-pointer ${className}`}
        style={{
          background: 'linear-gradient(135deg, rgba(39, 209, 124, 0.25) 0%, rgba(100, 230, 150, 0.2) 100%)',
          border: '2px solid rgba(39, 209, 124, 0.6)',
          boxShadow: `
            inset 0 1px 2px rgba(255, 255, 255, 0.4),
            0px 6px 18px rgba(39, 209, 124, 0.4),
            0 0 20px rgba(39, 209, 124, 0.2)
          `,
        }}
      >
        {/* Checkmark Badge */}
        <div className="absolute -top-2 -right-2 z-20">
          <div className="bg-green-500 text-white p-1.5 rounded-full">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        
        <div className="relative z-10 flex-shrink-0">{icon}</div>
        <div className="relative z-10 flex-1 min-w-0">
          <p className="truncate font-semibold text-green-900">{title}</p>
        </div>
        <div className="relative z-10 flex-shrink-0">{xpBadge}</div>
      </div>
      
      <style>{`
        @keyframes xp-burst {
          0% {
            transform: translate(-50%, -50%) rotate(var(--burst-angle)) translateY(0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) rotate(var(--burst-angle)) translateY(-40px) scale(0.5);
            opacity: 0;
          }
        }
        .animate-xp-burst {
          animation: xp-burst 1s ease-out forwards;
        }
      `}</style>
    </div>
  );
}