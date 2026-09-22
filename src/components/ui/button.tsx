import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium transition-colors disabled:pointer-events-none disabled:opacity-55",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/88",
        ink: "bg-ink text-ink-foreground hover:bg-ink/88",
        outline: "border border-input text-foreground hover:bg-accent",
        ghost: "text-muted-foreground hover:bg-accent hover:text-foreground",
        onDark: "border border-white/25 text-ink-foreground hover:bg-white/10",
        danger: "border border-destructive/40 text-destructive hover:bg-destructive/10",
      },
      size: {
        sm: "h-8 rounded-sm px-3 text-xs",
        md: "h-10 rounded-sm px-4 text-sm",
        lg: "h-12 rounded-sm px-6 text-sm",
        icon: "size-9 rounded-sm",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
