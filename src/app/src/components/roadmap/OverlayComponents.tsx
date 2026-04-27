import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Info,
  AlertTriangle,
  AlertCircle,
  Sparkles,
  X,
} from 'lucide-react';

/**
 * 1. Overlay / Tooltip
 * Small glass micro-card with minimal border and light shadow
 */

interface TooltipProps {
  content: string | React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export function OverlayTooltip({
  content,
  children,
  position = 'top',
  className = '',
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const positionStyles = {
    top: {
      bottom: 'calc(100% + 8px)',
      left: '50%',
      transform: 'translateX(-50%)',
    },
    bottom: {
      top: 'calc(100% + 8px)',
      left: '50%',
      transform: 'translateX(-50%)',
    },
    left: {
      right: 'calc(100% + 8px)',
      top: '50%',
      transform: 'translateY(-50%)',
    },
    right: {
      left: 'calc(100% + 8px)',
      top: '50%',
      transform: 'translateY(-50%)',
    },
  };

  return (
    <div
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}

      {isVisible && (
        <div
          className="absolute z-[100] pointer-events-none whitespace-nowrap animate-tooltip-fade-in"
          style={{
            ...positionStyles[position],
          }}
        >
          <div
            className="px-3 py-2 text-sm radius-tooltip"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 252, 255, 0.98) 100%)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(47, 128, 255, 0.2)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 2px rgba(255, 255, 255, 0.3)',
              borderRadius: '8px',
            }}
          >
            <div className="text-slate-800 font-medium">{content}</div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes tooltip-fade-in {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
        .animate-tooltip-fade-in {
          animation: tooltip-fade-in 150ms ease-out;
        }
      `}</style>
    </div>
  );
}

/**
 * Enhanced Tooltip with Icon
 */
interface TooltipRichProps extends TooltipProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
}

export function OverlayTooltipRich({
  children,
  icon,
  title,
  description,
  position = 'top',
  className = '',
}: TooltipRichProps) {
  const [isVisible, setIsVisible] = useState(false);

  const positionStyles = {
    top: {
      bottom: 'calc(100% + 12px)',
      left: '50%',
      transform: 'translateX(-50%)',
    },
    bottom: {
      top: 'calc(100% + 12px)',
      left: '50%',
      transform: 'translateX(-50%)',
    },
    left: {
      right: 'calc(100% + 12px)',
      top: '50%',
      transform: 'translateY(-50%)',
    },
    right: {
      left: 'calc(100% + 12px)',
      top: '50%',
      transform: 'translateY(-50%)',
    },
  };

  return (
    <div
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}

      {isVisible && (
        <div
          className="absolute z-[100] pointer-events-none animate-tooltip-fade-in"
          style={{
            ...positionStyles[position],
            minWidth: '200px',
            maxWidth: '280px',
          }}
        >
          <div
            className="p-3 radius-tooltip"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 252, 255, 0.98) 100%)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(47, 128, 255, 0.2)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12), inset 0 1px 2px rgba(255, 255, 255, 0.3)',
              borderRadius: '10px',
            }}
          >
            <div className="flex gap-3">
              {icon && <div className="flex-shrink-0 mt-0.5">{icon}</div>}
              <div className="space-y-1">
                {title && (
                  <div className="font-semibold text-sm text-slate-900">{title}</div>
                )}
                {description && (
                  <div className="text-xs text-slate-600 leading-relaxed">
                    {description}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 2. Overlay / Toast
 * Variants: success, info, warning, danger, aiUpdate
 */

interface ToastProps {
  variant: 'success' | 'info' | 'warning' | 'danger' | 'aiUpdate';
  title: string;
  message?: string;
  icon?: React.ReactNode;
  duration?: number;
  onClose?: () => void;
  isVisible?: boolean;
}

export function OverlayToast({
  variant,
  title,
  message,
  icon,
  duration = 5000,
  onClose,
  isVisible = true,
}: ToastProps) {
  const [show, setShow] = useState(isVisible);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!isVisible) {
      setShow(false);
      return;
    }

    setShow(true);
    setProgress(100);

    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.max(0, prev - (100 / (duration / 50))));
    }, 50);

    const timer = setTimeout(() => {
      setShow(false);
      onClose?.();
    }, duration);

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [isVisible, duration, onClose]);

  const variantConfig = {
    success: {
      icon: <CheckCircle2 className="w-5 h-5 text-green-600" />,
      background: 'linear-gradient(135deg, rgba(39, 209, 124, 0.15) 0%, rgba(100, 230, 150, 0.12) 100%)',
      border: '1.5px solid rgba(39, 209, 124, 0.35)',
      shadow: '0 6px 20px rgba(39, 209, 124, 0.25), inset 0 1px 3px rgba(255, 255, 255, 0.3)',
      progressBar: 'linear-gradient(90deg, rgba(39, 209, 124, 0.8), rgba(100, 230, 150, 0.7))',
      titleColor: '#1a8a52',
      messageColor: '#2d6a4f',
    },
    info: {
      icon: <Info className="w-5 h-5 text-blue-600" />,
      background: 'linear-gradient(135deg, rgba(47, 128, 255, 0.15) 0%, rgba(180, 220, 255, 0.12) 100%)',
      border: '1.5px solid rgba(47, 128, 255, 0.35)',
      shadow: '0 6px 20px rgba(47, 128, 255, 0.25), inset 0 1px 3px rgba(255, 255, 255, 0.3)',
      progressBar: 'linear-gradient(90deg, rgba(47, 128, 255, 0.8), rgba(180, 220, 255, 0.7))',
      titleColor: '#1e5bb8',
      messageColor: '#2563eb',
    },
    warning: {
      icon: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
      background: 'linear-gradient(135deg, rgba(242, 201, 76, 0.15) 0%, rgba(255, 235, 150, 0.12) 100%)',
      border: '1.5px solid rgba(242, 201, 76, 0.35)',
      shadow: '0 6px 20px rgba(242, 201, 76, 0.25), inset 0 1px 3px rgba(255, 255, 255, 0.3)',
      progressBar: 'linear-gradient(90deg, rgba(242, 201, 76, 0.8), rgba(255, 235, 150, 0.7))',
      titleColor: '#b8860b',
      messageColor: '#ca8a04',
    },
    danger: {
      icon: <AlertCircle className="w-5 h-5 text-red-600" />,
      background: 'linear-gradient(135deg, rgba(235, 87, 87, 0.15) 0%, rgba(255, 140, 140, 0.12) 100%)',
      border: '1.5px solid rgba(235, 87, 87, 0.35)',
      shadow: '0 6px 20px rgba(235, 87, 87, 0.25), inset 0 1px 3px rgba(255, 255, 255, 0.3)',
      progressBar: 'linear-gradient(90deg, rgba(235, 87, 87, 0.8), rgba(255, 140, 140, 0.7))',
      titleColor: '#c93636',
      messageColor: '#dc2626',
    },
    aiUpdate: {
      icon: <Sparkles className="w-5 h-5 text-purple-600" />,
      background: 'linear-gradient(135deg, rgba(108, 92, 231, 0.15) 0%, rgba(180, 170, 240, 0.12) 100%)',
      border: '1.5px solid rgba(108, 92, 231, 0.35)',
      shadow: '0 6px 20px rgba(108, 92, 231, 0.25), inset 0 1px 3px rgba(255, 255, 255, 0.3)',
      progressBar: 'linear-gradient(90deg, rgba(108, 92, 231, 0.8), rgba(180, 170, 240, 0.7))',
      titleColor: '#5b21b6',
      messageColor: '#7c3aed',
    },
  };

  const config = variantConfig[variant];

  if (!show) return null;

  return (
    <div
      className="roadmap-toast animate-toast-slide-in"
      style={{
        minWidth: '320px',
        maxWidth: '420px',
        background: config.background,
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: config.border,
        boxShadow: config.shadow,
        borderRadius: '16px',
        overflow: 'hidden',
      }}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 mt-0.5">
            {icon || config.icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-1">
            <h4 className="font-semibold" style={{ color: config.titleColor }}>
              {title}
            </h4>
            {message && (
              <p className="text-sm" style={{ color: config.messageColor, opacity: 0.9 }}>
                {message}
              </p>
            )}
          </div>

          {/* Close Button */}
          {onClose && (
            <button
              onClick={() => {
                setShow(false);
                onClose();
              }}
              className="flex-shrink-0 p-1 rounded-lg hover:bg-black/5 transition-colors"
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div
        className="h-1"
        style={{
          background: 'rgba(0, 0, 0, 0.05)',
        }}
      >
        <div
          className="h-full transition-all duration-50 ease-linear"
          style={{
            width: `${progress}%`,
            background: config.progressBar,
            boxShadow: `0 0 8px ${config.progressBar.match(/rgba\([^)]+\)/)?.[0]}`,
          }}
        />
      </div>

      <style>{`
        @keyframes toast-slide-in {
          from {
            opacity: 0;
            transform: translateX(100%) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
        .animate-toast-slide-in {
          animation: toast-slide-in 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
    </div>
  );
}

/**
 * Toast Container - manages multiple toasts
 */
interface ToastContainerProps {
  toasts: Array<ToastProps & { id: string }>;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export function OverlayToastContainer({
  toasts,
  position = 'top-right',
}: ToastContainerProps) {
  const positionStyles = {
    'top-right': { top: '24px', right: '24px' },
    'top-left': { top: '24px', left: '24px' },
    'bottom-right': { bottom: '24px', right: '24px' },
    'bottom-left': { bottom: '24px', left: '24px' },
  };

  return (
    <div
      className="fixed z-[200] flex flex-col gap-3"
      style={positionStyles[position]}
    >
      {toasts.map((toast) => (
        <OverlayToast key={toast.id} {...toast} />
      ))}
    </div>
  );
}