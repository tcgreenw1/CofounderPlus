/**
 * Theme-aware color utilities
 * Automatically returns pink or cyan based on current theme
 */

export const getThemeColor = (type: 'solid' | 'rgb' = 'solid'): string => {
  const isPinkTheme = document.documentElement.classList.contains('theme-pink');
  
  if (type === 'solid') {
    return isPinkTheme ? '#FF1493' : '#00E0FF';
  } else {
    return isPinkTheme ? '255, 20, 147' : '0, 224, 255';
  }
};

// Specific color getters
export const getPrimaryColor = (): string => {
  return getThemeColor('solid');
};

export const getPrimaryRGB = (): string => {
  return getThemeColor('rgb');
};

// Generate rgba string
export const getPrimaryRGBA = (alpha: number): string => {
  const rgb = getThemeColor('rgb');
  return `rgba(${rgb}, ${alpha})`;
};

// Generate gradient
export const getPrimaryGradient = (opacity1: number = 0.15, opacity2: number = 0.1): string => {
  const rgb = getThemeColor('rgb');
  return `linear-gradient(135deg, rgba(${rgb}, ${opacity1}), rgba(75, 0, 255, ${opacity2}))`;
};

// For borders
export const getPrimaryBorder = (opacity: number = 0.2): string => {
  return getPrimaryRGBA(opacity);
};

// For shadows
export const getPrimaryShadow = (opacity: number = 0.1): string => {
  const rgb = getThemeColor('rgb');
  return `0 8px 32px rgba(${rgb}, ${opacity})`;
};

// Hook to listen for theme changes
export const onThemeChange = (callback: (isPink: boolean) => void) => {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'class') {
        const isPink = document.documentElement.classList.contains('theme-pink');
        callback(isPink);
      }
    });
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class']
  });

  return () => observer.disconnect();
};
