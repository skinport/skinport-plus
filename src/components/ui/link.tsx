import { cn } from "@/lib/utils";
import React from "react";

const Link = React.forwardRef<
  HTMLAnchorElement,
  React.AnchorHTMLAttributes<HTMLAnchorElement>
>(({ className, ...props }, ref) => (
  <a
    {...props}
    ref={ref}
    rel={props.target === "_blank" ? "noopener noreferrer" : undefined}
    className={cn("text-white hover:text-red transition-colors", className)}
  />
));

export { Link };
