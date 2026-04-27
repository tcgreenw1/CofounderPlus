import { create } from 'zustand';

/**
 * LayoutStateManager - Preserves layout state across route changes
 * This prevents the navigation menu from flickering when navigating between pages
 */

interface LayoutState {
  // Desktop nav options - persisted across unmounts
  desktopNavOptions: string[];
  desktopNavLoaded: boolean;
  
  // Mobile nav options - persisted across unmounts
  mobileNavItems: any[];
  mobileNavLoaded: boolean;
  
  // Sidebar state
  sidebarOpen: boolean;
  
  // Operations submenu state
  operationsExpanded: boolean;
  
  // Actions
  setDesktopNavOptions: (options: string[]) => void;
  setDesktopNavLoaded: (loaded: boolean) => void;
  setMobileNavItems: (items: any[]) => void;
  setMobileNavLoaded: (loaded: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  setOperationsExpanded: (expanded: boolean) => void;
}

export const useLayoutState = create<LayoutState>((set) => ({
  // Default desktop nav options
  desktopNavOptions: ['dashboard', 'operations-hub', 'cofounder-chat', 'cofounder-make', 'task-automations', 'notes'],
  desktopNavLoaded: false,
  
  // Default mobile nav items
  mobileNavItems: [],
  mobileNavLoaded: false,
  
  // Sidebar state from localStorage
  sidebarOpen: typeof window !== 'undefined' 
    ? localStorage.getItem('cofounder_sidebar_open') === 'true' || localStorage.getItem('cofounder_sidebar_open') === null
    : true,
  
  // Operations submenu starts collapsed
  operationsExpanded: false,
  
  // Actions
  setDesktopNavOptions: (options) => set({ desktopNavOptions: options }),
  setDesktopNavLoaded: (loaded) => set({ desktopNavLoaded: loaded }),
  setMobileNavItems: (items) => set({ mobileNavItems: items }),
  setMobileNavLoaded: (loaded) => set({ mobileNavLoaded: loaded }),
  setSidebarOpen: (open) => {
    set({ sidebarOpen: open });
    if (typeof window !== 'undefined') {
      localStorage.setItem('cofounder_sidebar_open', String(open));
    }
  },
  setOperationsExpanded: (expanded) => set({ operationsExpanded: expanded }),
}));
