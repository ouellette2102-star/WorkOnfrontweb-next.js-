import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[#134021] text-white hover:bg-[#0F3319] shadow-sm shadow-[#134021]/20",
        destructive: "bg-[#B5382A] text-white hover:bg-[#9A2F23]",
        outline: "border border-[#EAE6DF] bg-transparent text-[#1B1A18] hover:bg-[#F0EDE8]",
        secondary: "bg-[#F0EDE8] text-[#1B1A18] hover:bg-[#EAE6DF]",
        ghost: "text-[#706E6A] hover:bg-[#F0EDE8] hover:text-[#1B1A18]",
        link: "text-[#B5382A] underline-offset-4 hover:underline",
        hero: "bg-[#134021] text-white hover:bg-[#0F3319] shadow-lg shadow-[#134021]/30 hover:shadow-[#134021]/40 transition-all",
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

export type ButtonVariant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "hero";
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

