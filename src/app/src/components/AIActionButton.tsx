/**
 * AI Action Button Component
 * Wraps AI actions with automatic credit deduction
 */

import React from 'react';
import { Button } from './ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { useCredits } from '../hooks/useCredits';

interface AIActionButtonProps extends React.ComponentPropsWithoutRef<typeof Button> {
  onAIAction: () => Promise<void> | void;
  creditCost?: number;
  actionName?: string;
  isLoading?: boolean;
  showSparkles?: boolean;
  children: React.ReactNode;
}

export function AIActionButton({
  onAIAction,
  creditCost = 1,
  actionName = 'AI Action',
  isLoading = false,
  showSparkles = true,
  children,
  disabled,
  ...props
}: AIActionButtonProps) {
  const { deductCredits, checkCredits } = useCredits();
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Check if user has enough credits
    if (!checkCredits(creditCost)) {
      return;
    }

    setIsProcessing(true);
    
    try {
      // Deduct credits first
      const success = await deductCredits(creditCost, actionName);
      
      if (success) {
        // Execute the AI action
        await onAIAction();
      }
    } catch (error) {
      console.error('AI action failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const isButtonDisabled = disabled || isLoading || isProcessing;

  return (
    <Button
      {...props}
      disabled={isButtonDisabled}
      onClick={handleClick}
    >
      {(isLoading || isProcessing) ? (
        <>
          <Loader2 className="size-4 animate-spin" style={{ marginRight: 'var(--spacing-2)' }} />
          {children}
        </>
      ) : (
        <>
          {showSparkles && <Sparkles className="size-4" style={{ marginRight: 'var(--spacing-2)' }} />}
          {children}
        </>
      )}
    </Button>
  );
}
