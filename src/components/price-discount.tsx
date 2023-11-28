import { cn } from "@/lib/utils";
import { VariantProps, cva } from "class-variance-authority";

const priceDiscountVariants = cva(
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

export const PriceDiscount = ({
  children,
  className,
  size,
}: React.ButtonHTMLAttributes<HTMLDivElement> &
  VariantProps<typeof priceDiscountVariants>) => (
  <div className={cn(priceDiscountVariants({ className, size }))}>
    <span className="skew-x-[15deg]">{children}</span>
  </div>
);
