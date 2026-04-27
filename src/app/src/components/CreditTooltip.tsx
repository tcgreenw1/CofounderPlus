/**
 * Credit Tooltip Component
 * Shows credit cost in a tooltip for AI features
 */

import React from 'react';
import { Sparkles } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

interface CreditTooltipProps {
  credits: number;
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

export function CreditTooltip({ credits, children, side = 'top' }: CreditTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent 
          side={side}
          style={{
            background: 'var(--popover)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--spacing-2) var(--spacing-3)',
          }}
        >
          <div className="flex items-center" style={{ gap: 'var(--spacing-2)' }}>
            <Sparkles className="size-3" style={{ color: 'var(--primary)' }} />
            <span style={{ fontSize: '0.75rem' }}>
              <strong>{credits}</strong> {credits === 1 ? 'credit' : 'credits'}
            </span>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
