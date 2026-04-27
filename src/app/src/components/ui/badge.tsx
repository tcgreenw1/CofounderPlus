import * as React from "react";
import { Slot } from "@radix-ui/react-slot@1.1.2";
import { cva, type VariantProps } from "class-variance-authority@0.7.1";

import { cn } from "./utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-xl border-2 px-2.5 py-1 text-xs font-semibold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-all duration-300 overflow-hidden shadow-md",
  {
    variants: {
      variant: {
        default:
          "border-accent/40 bg-primary text-primary-foreground [a&]:hover:bg-primary/90 [a&]:hover:border-accent/60 [a&]:hover:shadow-lg",
        secondary:
          "border-primary/30 bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90 [a&]:hover:border-primary/50 [a&]:hover:shadow-lg",
        destructive:
          "border-energy/40 bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 [a&]:hover:border-energy/60 [a&]:hover:shadow-lg",
        outline:
          "text-foreground border-accent/40 [a&]:hover:bg-accent/10 [a&]:hover:text-accent-foreground [a&]:hover:border-primary/50 [a&]:hover:shadow-lg",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };