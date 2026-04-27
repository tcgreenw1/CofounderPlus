/**
 * AGI Floating Bubble
 * VisionOS-style floating assistant bubble with pulsing animation
 * Uses design system colors: blues, greens, yellows, and reds only
 */

import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AGIFloatingBubbleProps {
  onClick: () => void;
  isOpen: boolean;
  hasNotification?: boolean;
}

export function AGIFloatingBubble({ onClick, isOpen, hasNotification }: AGIFloatingBubbleProps) {
  const isMobile = window.innerWidth < 768;
  const navigate = useNavigate();
  
  const handleClick = () => {
    if (isMobile) {
      // On mobile, route to the Cofounder AI page
      navigate('/cofounder-ai');
    } else {
      // On desktop, toggle the panel
      onClick();
    }
  };
  
  return (
    <motion.button
      onClick={handleClick}
      className="group relative"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      style={{
        position: 'fixed',
        // Improved positioning - anchor above tab bar with more spacing for iOS
        bottom: isMobile ? 'calc(env(safe-area-inset-bottom) + 120px)' : '24px', // 120px = 60px tab bar + 60px spacing for better visibility on iOS
        right: isMobile ? '16px' : '24px', // Consistent 16px on mobile
        zIndex: 100,
      }}
    >
      {/* Pulsing Glow Effect - Using blue from design system */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle, #2b7fff 0%, transparent 70%)',
          filter: 'blur(20px)',
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Main Bubble - Reduced size by 12.5% (64px -> 56px on mobile, slightly smaller on desktop) */}
      <div
        className="relative rounded-full flex items-center justify-center overflow-hidden"
        style={{
          width: isMobile ? '56px' : '60px', // Reduced by ~12.5%
          height: isMobile ? '56px' : '60px',
          background: 'linear-gradient(135deg, #2b7fff 0%, #1e5dd9 100%)',
          backdropFilter: 'blur(20px)',
          border: '2px solid rgba(255, 255, 255, 0.3)',
          boxShadow: `
            0 8px 32px rgba(43, 127, 255, 0.4),
            inset 0 1px 3px rgba(255, 255, 255, 0.5),
            inset 0 -1px 3px rgba(0, 0, 0, 0.2)
          `,
        }}
      >
        {/* Liquid Glass Highlight */}
        <div
          className="absolute top-0 left-0 right-0 h-1/2"
          style={{
            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.4) 0%, transparent 100%)',
            borderRadius: '50% 50% 0 0',
          }}
        />

        {/* Icon */}
        <motion.div
          animate={{
            rotate: isOpen ? 180 : 0,
          }}
          transition={{ duration: 0.3 }}
        >
          {isOpen ? (
            <MessageCircle className="size-8 text-white drop-shadow-lg" strokeWidth={2.5} />
          ) : (
            <Sparkles className="size-8 text-white drop-shadow-lg" strokeWidth={2.5} />
          )}
        </motion.div>

        {/* Breathing Animation Overlay */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(255, 255, 255, 0.3), transparent 60%)',
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* Notification Dot - Using red from design system */}
      {hasNotification && !isOpen && (
        <motion.div
          className="absolute top-0 right-0 size-4 rounded-full"
          style={{
            background: '#ff4f50',
            border: '2px solid white',
            boxShadow: '0 2px 8px rgba(255, 79, 80, 0.5)',
          }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500 }}
        />
      )}

      {/* Tooltip */}
      <motion.div
        className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-2 rounded-lg whitespace-nowrap pointer-events-none"
        style={{
          background: 'rgba(0, 0, 0, 0.9)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        }}
        initial={{ opacity: 0, x: 10 }}
        whileHover={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
      >
        <span className="text-xs font-medium text-white">
          {isOpen ? 'Close AGI Assistant' : 'Ask AGI Assistant'}
        </span>
        <div
          className="absolute left-full top-1/2 -translate-y-1/2 w-0 h-0"
          style={{
            borderTop: '6px solid transparent',
            borderBottom: '6px solid transparent',
            borderLeft: '6px solid rgba(0, 0, 0, 0.9)',
          }}
        />
      </motion.div>
    </motion.button>
  );
}