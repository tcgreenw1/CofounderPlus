"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch@1.1.3";

import { cn } from "./utils";

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer inline-flex h-6 w-11 sm:h-7 sm:w-12 shrink-0 cursor-pointer items-center rounded-full border-2 transition-all outline-none disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=checked]:bg-[#00E0FF] data-[state=unchecked]:bg-gray-200",
        "dark:data-[state=checked]:bg-[#00E0FF] dark:data-[state=unchecked]:bg-gray-700",
        "focus-visible:ring-2 focus-visible:ring-[#00E0FF] focus-visible:ring-offset-2",
        "backdrop-blur-sm bg-opacity-90",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ease-in-out",
          "data-[state=checked]:translate-x-5 sm:data-[state=checked]:translate-x-5",
          "data-[state=unchecked]:translate-x-0.5",
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };