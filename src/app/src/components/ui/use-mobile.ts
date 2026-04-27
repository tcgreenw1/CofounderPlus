import * as React from "react";
import { Capacitor } from '@capacitor/core';

const MOBILE_BREAKPOINT = 768;

/**
 * Enhanced mobile detection hook
 * 
 * CRITICAL FOR APPLE APP STORE REVIEW:
 * - If running in iOS/Android Capacitor app → ALWAYS return true (force mobile view)
 * - If running in browser → Use responsive width detection
 * 
 * This ensures Apple Connect reviewers see mobile view regardless of their viewport size,
 * while browser users get proper responsive behavior.
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined,
  );

  React.useEffect(() => {
    // PRIORITY 1: Check if we're in a Capacitor native app (iOS/Android)
    // If yes, ALWAYS use mobile view regardless of screen size
    const isNativeApp = Capacitor.isNativePlatform();
    
    if (isNativeApp) {
      // Force mobile view for native apps (iOS/Android)
      setIsMobile(true);
      return; // Don't set up resize listeners for native apps
    }

    // PRIORITY 2: For browser/web, use responsive width detection
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}
