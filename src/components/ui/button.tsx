import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-workon-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-workon-primary text-white shadow-sm shadow-workon-primary/20 hover:-translate-y-0.5 hover:bg-workon-primary-hover hover:shadow-md hover:shadow-workon-primary/20",
        destructive: "bg-workon-accent text-white hover:-translate-y-0.5 hover:bg-workon-accent-hover",
        outline: "border border-workon-border bg-transparent text-workon-ink hover:border-workon-stone-subtle hover:bg-workon-bg-cream",
        secondary: "bg-workon-bg-cream text-workon-ink hover:bg-workon-border",
        ghost: "text-workon-gray hover:bg-workon-bg-cream hover:text-workon-ink",
        link: "text-workon-accent underline-offset-4 hover:underline",
        hero: "bg-workon-primary text-white shadow-lg shadow-workon-primary/30 hover:-translate-y-0.5 hover:bg-workon-primary-hover hover:shadow-workon-primary/40 rounded-2xl",
        premium: "bg-workon-surface-dark text-white shadow-lg shadow-workon-primary/25 hover:-translate-y-0.5 hover:bg-workon-forest hover:shadow-xl hover:shadow-workon-primary/20",
        copper: "bg-workon-copper text-white shadow-md shadow-workon-copper/20 hover:-translate-y-0.5 hover:bg-workon-copper-hover hover:shadow-lg hover:shadow-workon-copper/20",
        inverse: "border border-white/15 bg-white/10 text-white hover:bg-white/15",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        hero: "h-14 px-10 text-base font-semibold rounded-xl",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export type ButtonVariant =
  | "default"
  | "destructive"
  | "outline"
  | "secondary"
  | "ghost"
  | "link"
  | "hero"
  | "premium"
  | "copper"
  | "inverse";
export type ButtonSize = "default" | "sm" | "lg" | "hero" | "icon";

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "size"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
