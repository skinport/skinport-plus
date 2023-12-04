import { cn } from "@/lib/utils";
import { VariantProps, cva } from "class-variance-authority";

const discountVariants = cva(
  "bg-[linear-gradient(135deg,#0073d5,#fa490a)] skew-x-[-15deg] rounded-[3px] inline-flex items-center text-white",
  {
    variants: {
      size: {
        default: "text-2xs font-semibold px-1 py-0.5",
        lg: "text-xs font-bold px-2 py-1",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

export const Discount = ({
  discount,
  className,
  size,
}: { discount: string } & Omit<
  React.ButtonHTMLAttributes<HTMLDivElement>,
  "children"
> &
  VariantProps<typeof discountVariants>) => (
  <div className={cn(discountVariants({ className, size }))}>
    <span className="skew-x-[15deg]">{discount}</span>
  </div>
);
