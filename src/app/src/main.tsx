import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import "./styles/globals.css";
  import "./styles/mobile-navigation.css";

  // iOS FIX: Prevent rubber-banding/overscroll behavior
  const preventOverscroll = () => {
    // Prevent default touch behavior that causes rubber-banding
    let lastTouchY = 0;
    let preventPullToRefresh = false;

    document.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1) return;
      lastTouchY = e.touches[0].clientY;
      preventPullToRefresh = window.pageYOffset === 0;
    }, { passive: false });

    document.addEventListener('touchmove', (e) => {
      const touchY = e.touches[0].clientY;
      const touchYDelta = touchY - lastTouchY;
      lastTouchY = touchY;

      if (preventPullToRefresh && touchYDelta > 0) {
        e.preventDefault();
        return;
      }

      // Prevent overscroll at top and bottom
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;

      if ((scrollTop === 0 && touchYDelta > 0) || 
          (scrollTop + clientHeight >= scrollHeight && touchYDelta < 0)) {
        e.preventDefault();
      }
    }, { passive: false });
  };

  // Apply iOS fixes on load
  if ('ontouchstart' in window) {
    preventOverscroll();
  }

  const rootElement = document.getElementById("root");
  
  if (!rootElement) {
    console.error('Failed to find root element');
  } else {
    try {
      createRoot(rootElement).render(<App />);
    } catch (error) {
      console.error('Failed to render app:', error);
      // Clear any error messages that might be showing
      rootElement.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: system-ui, sans-serif;"><div style="text-align: center;"><h1 style="margin-bottom: 16px;">Loading Cofounder+...</h1><p style="color: #666;">If this message persists, try refreshing the page.</p></div></div>';
    }
  }