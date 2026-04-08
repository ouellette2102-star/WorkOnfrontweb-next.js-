import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[#FF4D1C] text-white hover:bg-[#E8441A] shadow-sm shadow-[#FF4D1C]/20",
        destructive: "bg-[#FF4D1C] text-white hover:bg-[#E8441A]",
        outline: "border border-white/15 bg-transparent hover:bg-white/5",
        secondary: "bg-white/10 text-white hover:bg-white/20",
        ghost: "hover:bg-white/5",
        link: "text-[#FF4D1C] underline-offset-4 hover:underline",
        hero: "bg-[#FF4D1C] text-white hover:bg-[#E8441A] shadow-lg shadow-[#FF4D1C]/30 hover:shadow-[#FF4D1C]/40 transition-all",
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

