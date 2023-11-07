import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "sp-rounded sp-uppercase sp-font-bold sp-tracking-widest sp-text-sm sp-transition",
  {
    variants: {
      variant: {
        default: "sp-bg-[#4db5da] hover:sp-bg-[#36809a]",
        destructive: "sp-bg-[#e05a59] hover:sp-bg-[#cb3837]",
        ghost: "hover:sp-text-[#fa490a]",
      },
      size: {
        default: "sp-py-4 sp-px-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
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
