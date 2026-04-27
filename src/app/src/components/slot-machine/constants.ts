export const SLOT_MACHINE_SYMBOLS = ['👑', '💎', '⭐', '🎯', '💰', '🏆', '🎉', '⚡'];

export const WINNING_COMBINATION = ['👑', '👑', '👑'];

export const CONFETTI_COLORS = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];

export const ANIMATION_TIMINGS = {
  SPIN_INTERVAL: 150,
  SPIN_DURATION: 2500,
  CELEBRATION_DELAY: 0.7,
  BUTTONS_DELAY: 1.5,
  CONFETTI_COUNT: 25,
  CONFETTI_DELAY_MULTIPLIER: 0.05
} as const;

export const ANIMATION_VARIANTS = {
  overlay: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.3 }
  },
  container: {
    initial: { scale: 0.5, y: 100 },
    animate: { scale: 1, y: 0 },
    exit: { scale: 0.5, y: 100, opacity: 0 },
    transition: { type: "spring", stiffness: 200, damping: 20 }
  },
  header: {
    initial: { y: -30, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: { delay: 0.3 }
  },
  slotMachine: {
    initial: { scale: 0 },
    animate: { scale: 1 },
    transition: { delay: 0.5, type: "spring", stiffness: 150 }
  },
  celebration: {
    initial: { scale: 0 },
    animate: { scale: [0, 1.1, 1] },
    transition: { delay: ANIMATION_TIMINGS.CELEBRATION_DELAY, type: "spring", stiffness: 200 }
  },
  buttons: {
    initial: { y: 30, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: { delay: ANIMATION_TIMINGS.BUTTONS_DELAY }
  }
} as const;