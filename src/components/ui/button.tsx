import React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "rounded uppercase font-bold tracking-widest text-xs transition text-white border border-transparent outline-none inline-flex gap-2 items-center justify-center",
  {
    variants: {
      variant: {
        default: "bg-blue hover:bg-blue-dark hover:text-white",
        destructive: "bg-[#e05a59] hover:bg-[#cb3837]",
        ghost: "hover:text-red",
        outline: "border-white hover:bg-white hover:text-background",
      },
      size: {
        default: "py-2 px-4",
        sm: "py-1 px-2",
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
