import { useEffect } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  description: string;
  action: () => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Guard against undefined event.key
      if (!event.key) return;
      
      // Check if user is typing in an input/textarea
      const target = event.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || 
                       target.tagName === 'TEXTAREA' || 
                       target.isContentEditable;

      for (const shortcut of shortcuts) {
        // Skip if shortcut is disabled
        if (shortcut.enabled === false) continue;

        const matchesKey = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const matchesCtrl = shortcut.ctrlKey ? event.ctrlKey : !event.ctrlKey;
        const matchesMeta = shortcut.metaKey ? event.metaKey : !event.metaKey;
        const matchesShift = shortcut.shiftKey ? event.shiftKey : !event.shiftKey;
        const matchesAlt = shortcut.altKey ? event.altKey : !event.altKey;

        // For modifier shortcuts, allow even when typing
        const shouldTrigger = (shortcut.ctrlKey || shortcut.metaKey) 
          ? matchesKey && matchesCtrl && matchesMeta && matchesShift && matchesAlt
          : !isTyping && matchesKey && matchesCtrl && matchesMeta && matchesShift && matchesAlt;

        if (shouldTrigger) {
          event.preventDefault();
          shortcut.action();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  if (shortcut.ctrlKey || shortcut.metaKey) {
    parts.push(isMac ? '⌘' : 'Ctrl');
  }
  if (shortcut.shiftKey) {
    parts.push(isMac ? '⇧' : 'Shift');
  }
  if (shortcut.altKey) {
    parts.push(isMac ? '⌥' : 'Alt');
  }
  
  parts.push(shortcut.key.toUpperCase());
  
  return parts.join(isMac ? '' : '+');
}
