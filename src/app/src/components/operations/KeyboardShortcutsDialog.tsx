import React from 'react';
import { Keyboard, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { KeyboardShortcut, formatShortcut } from '../../hooks/useKeyboardShortcuts';

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shortcuts: KeyboardShortcut[];
}

export function KeyboardShortcutsDialog({ open, onOpenChange, shortcuts }: KeyboardShortcutsDialogProps) {
  // Group shortcuts by category
  const groupedShortcuts: Record<string, KeyboardShortcut[]> = {
    'Navigation': shortcuts.filter(s => ['r', 'g', 'i', 'm'].includes(s.key.toLowerCase()) && (s.ctrlKey || s.metaKey)),
    'Actions': shortcuts.filter(s => ['n', 'k', '/'].includes(s.key.toLowerCase())),
    'Help': shortcuts.filter(s => s.key === '?'),
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent style={{ maxWidth: '600px' }}>
        <DialogHeader>
          <DialogTitle className="flex items-center" style={{ gap: 'var(--spacing-2)' }}>
            <Keyboard className="size-5" style={{ color: '#8b5cf6' }} />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Use these shortcuts to navigate and perform actions quickly
          </DialogDescription>
        </DialogHeader>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
          {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
            categoryShortcuts.length > 0 && (
              <div key={category}>
                <h3 
                  className="text-sm" 
                  style={{ 
                    fontWeight: 'var(--font-weight-semibold)', 
                    marginBottom: 'var(--spacing-3)',
                    color: 'var(--muted-foreground)',
                    textTransform: 'uppercase',
                    fontSize: '0.75rem',
                    letterSpacing: '0.05em'
                  }}
                >
                  {category}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
                  {categoryShortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                      style={{
                        padding: 'var(--spacing-3)',
                        borderRadius: 'var(--radius)',
                        background: 'var(--muted)',
                      }}
                    >
                      <span className="text-sm">{shortcut.description}</span>
                      <Badge
                        variant="outline"
                        style={{
                          fontFamily: 'monospace',
                          fontSize: '0.75rem',
                          padding: 'var(--spacing-1) var(--spacing-3)',
                          background: 'var(--background)',
                          borderColor: 'var(--border)',
                        }}
                      >
                        {formatShortcut(shortcut)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>

        <div 
          style={{ 
            marginTop: 'var(--spacing-2)',
            padding: 'var(--spacing-3)',
            borderRadius: 'var(--radius)',
            background: 'rgba(139, 92, 246, 0.05)',
            border: '1px solid rgba(139, 92, 246, 0.2)',
          }}
        >
          <p className="text-xs text-muted-foreground">
            💡 <strong>Pro Tip:</strong> Press <kbd style={{ 
              padding: '2px 6px', 
              borderRadius: 'var(--radius-sm)', 
              background: 'var(--background)',
              border: '1px solid var(--border)',
              fontFamily: 'monospace',
              fontSize: '0.75rem'
            }}>?</kbd> anytime to view this help dialog
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
