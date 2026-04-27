"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch@1.1.3";

import { cn } from "./utils";

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  const isChecked = props.checked;
  
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer relative inline-flex shrink-0 cursor-pointer items-center transition-all ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-ring",
        className,
      )}
      style={{ 
        width: '54px', 
        height: '28px',
        transitionDuration: '180ms',
        borderRadius: 'var(--radius-full)',
      }}
      {...props}
    >
      {/* Track Container */}
      <div 
        className={cn(
          "absolute inset-0 transition-all ease-out",
        )}
        style={{
          borderRadius: 'var(--radius-full)',
          transitionDuration: '180ms',
          background: isChecked 
            ? 'var(--success)' 
            : 'var(--switch-background)',
          border: '1px solid var(--border)',
        }}
      />

      {/* Knob */}
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "relative block transition-all ease-out shadow-sm",
        )}
        style={{
          width: '24px',
          height: '24px',
          borderRadius: 'var(--radius-full)',
          transitionDuration: '180ms',
          background: 'var(--background)',
          transform: isChecked ? 'translateX(26px)' : 'translateX(2px)',
        }}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };