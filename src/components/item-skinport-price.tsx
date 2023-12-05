import { formatPrice } from "@/lib/format";
import { getI18nMessage } from "@/lib/i18n";
import { getSkinportItemUrl } from "@/lib/skinport";
import { Item } from "@/lib/steam";
import { cn } from "@/lib/utils";
import { VariantProps, cva } from "class-variance-authority";
import { ReactNode } from "react";
import { Discount } from "./discount";
import { InterpolateMessage } from "./interpolate-message";
import { SkinportLogo } from "./skinport-logo";
import { Link } from "./ui/link";
import { Skeleton } from "./ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

const startingAtVariants = cva(undefined, {
  variants: {
    size: {
      sm: "text-xs",
      base: null,
    },
  },
  defaultVariants: {
    size: "base",
  },
});

const priceVariants = cva("font-semibold", {
  variants: {
    size: {
      sm: null,
      base: "text-3xl",
    },
    asLink: {
      true: null,
      false: "text-white",
    },
  },
  defaultVariants: {
    size: "base",
    asLink: false,
  },
});

const skeletonVariants = cva(undefined, {
  variants: {
    size: {
      sm: "w-9 h-3.5 my-[0.1875rem]",
      base: "w-20 h-[1.875rem] my-[0.1875rem]",
    },
  },
  defaultVariants: {
    size: "base",
  },
});

/**
 * Shows a skeleton if `price` and `currency` are `undefined` and loading.
 */
export function ItemSkinportPrice({
  price,
  currency,
  discount,
  size,
  withStartingAt = true,
  className,
  startingAtClassName,
  linkItem,
}: {
  price?: number;
  currency?: string;
  discount?: string;
  withStartingAt?: boolean;
  className?: string;
  startingAtClassName?: string;
  linkItem?: Item;
} & VariantProps<typeof priceVariants>) {
  const linkPriceToItem = (children: ReactNode) =>
    linkItem ? (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={getSkinportItemUrl(linkItem)}
            target="_blank"
            onClick={(event) => {
              event.stopPropagation();
            }}
            className="flex gap-2 items-center"
          >
            {children}
          </Link>
        </TooltipTrigger>
        <TooltipContent className="flex gap-1 items-center">
          <InterpolateMessage
            message={getI18nMessage("common_viewOnSkinport")}
            values={{ skinportLogo: <SkinportLogo size={10} isInverted /> }}
          />
        </TooltipContent>
      </Tooltip>
    ) : (
      children
    );

  const priceElement = (
    <div className={cn("flex gap-2 items-center", className)}>
      {price && currency ? (
        linkPriceToItem(
          <>
            <div
              className={cn(priceVariants({ size, asLink: Boolean(linkItem) }))}
            >
              {formatPrice(price, currency)}
            </div>
            {discount && <Discount discount={discount} />}
          </>,
        )
      ) : (
        <Skeleton className={skeletonVariants({ size })} />
      )}
    </div>
  );

  return withStartingAt ? (
    <div>
      <div className={cn(startingAtVariants({ size }), startingAtClassName)}>
        {getI18nMessage("common_startingAt")}
      </div>
      {priceElement}
    </div>
  ) : (
    priceElement
  );
}
