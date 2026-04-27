import { useEffect, useRef } from 'react';

/**
 * Component that replaces hardcoded cyan colors with pink when theme-pink is active
 * This handles inline styles that can't be overridden with CSS
 */
export function ThemeColorReplacer() {
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    const lastThemeRef = { current: document.documentElement.classList.contains('theme-pink') };
    
    const replaceCyanColors = () => {
      const isPinkTheme = document.documentElement.classList.contains('theme-pink');
      
      // Only log if theme actually changed
      if (lastThemeRef.current !== isPinkTheme) {
        console.log(`🎨 ThemeColorReplacer: Theme changed to ${isPinkTheme ? 'PINK' : 'CYAN'}`);
        lastThemeRef.current = isPinkTheme;
      }

      // Get all elements in the document
      const allElements = document.querySelectorAll('*');
      let replacedCount = 0;
      
      allElements.forEach((element) => {
        const htmlElement = element as HTMLElement;
        
        // Check inline styles
        const currentStyle = htmlElement.getAttribute('style');
        if (currentStyle) {
          let newStyle = currentStyle;
          let changed = false;
          
          if (isPinkTheme) {
            // Replace hex cyan with pink
            if (newStyle.includes('#00E0FF') || newStyle.includes('#00e0ff')) {
              newStyle = newStyle.split('#00E0FF').join('#FF1493');
              newStyle = newStyle.split('#00e0ff').join('#FF1493');
              changed = true;
            }
            
            // Replace rgb/rgba cyan with pink
            if (newStyle.includes('rgb(0, 224, 255') || newStyle.includes('rgba(0, 224, 255')) {
              newStyle = newStyle.split('rgb(0, 224, 255').join('rgb(255, 20, 147');
              newStyle = newStyle.split('rgba(0, 224, 255').join('rgba(255, 20, 147');
              changed = true;
            }
            
            // Replace lighter cyan variants
            if (newStyle.includes('#0099CC') || newStyle.includes('#00A0CC') || newStyle.includes('#00A0C8')) {
              newStyle = newStyle.split('#0099CC').join('#FF1493');
              newStyle = newStyle.split('#00a0cc').join('#FF1493');
              newStyle = newStyle.split('#00A0CC').join('#FF1493');
              newStyle = newStyle.split('#00A0C8').join('#FF1493');
              newStyle = newStyle.split('#00a0c8').join('#FF1493');
              changed = true;
            }
          } else {
            // Restore cyan from pink
            if (newStyle.includes('#FF1493') || newStyle.includes('#ff1493')) {
              newStyle = newStyle.split('#FF1493').join('#00E0FF');
              newStyle = newStyle.split('#ff1493').join('#00E0FF');
              changed = true;
            }
            
            // Restore rgb/rgba cyan from pink
            if (newStyle.includes('rgb(255, 20, 147') || newStyle.includes('rgba(255, 20, 147')) {
              newStyle = newStyle.split('rgb(255, 20, 147').join('rgb(0, 224, 255');
              newStyle = newStyle.split('rgba(255, 20, 147').join('rgba(0, 224, 255');
              changed = true;
            }
          }
          
          if (changed) {
            htmlElement.setAttribute('style', newStyle);
            replacedCount++;
          }
        }
        
        // Check Tailwind classes
        const classList = htmlElement.classList;
        if (classList.length > 0) {
          const classArray = Array.from(classList);
          let classChanged = false;
          
          classArray.forEach(className => {
            if (isPinkTheme) {
              // Replace cyan Tailwind classes
              if (className.includes('[#00E0FF]') || className.includes('[#00e0ff]')) {
                const newClassName = className.replace(/#00E0FF/gi, '#FF1493');
                htmlElement.classList.remove(className);
                htmlElement.classList.add(newClassName);
                classChanged = true;
              }
            } else {
              // Restore cyan classes
              if (className.includes('[#FF1493]') || className.includes('[#ff1493]')) {
                const newClassName = className.replace(/#FF1493/gi, '#00E0FF');
                htmlElement.classList.remove(className);
                htmlElement.classList.add(newClassName);
                classChanged = true;
              }
            }
          });
          
          if (classChanged) {
            replacedCount++;
          }
        }
      });
      
      // Only log if we actually replaced something
      if (replacedCount > 0) {
        console.log(`🎨 ThemeColorReplacer: Updated ${replacedCount} elements`);
      }
    };
    
    // Debounced version for DOM changes
    const debouncedReplace = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(replaceCyanColors, 200);
    };

    // Initial replacement
    replaceCyanColors();

    // Watch for theme class changes on document element ONLY
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const isPinkTheme = document.documentElement.classList.contains('theme-pink');
          // Only run if theme actually changed
          if (lastThemeRef.current !== isPinkTheme) {
            lastThemeRef.current = isPinkTheme;
            console.log('🎨 ThemeColorReplacer: Theme toggled, updating colors...');
            setTimeout(replaceCyanColors, 50);
          }
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    // Debounced DOM observer for new elements (much less aggressive)
    const domObserver = new MutationObserver(debouncedReplace);

    domObserver.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      observer.disconnect();
      domObserver.disconnect();
    };
  }, []);

  return null; // This component doesn't render anything
}