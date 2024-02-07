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
      xs: "text-xs",
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
      xs: "text-xs",
      sm: "text-sm",
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
      xs: "w-8 h-3 my-0.5",
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
  className,
  startingAtClassName,
  linkItem,
  priceTitle = "starting_at",
}: {
  price?: number | null;
  currency?: string;
  discount?: string;
  className?: string;
  startingAtClassName?: string;
  linkItem?: Item;
  priceTitle?: "starting_at" | "suggested_price" | "none";
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
            message={getI18nMessage(
              priceTitle === "starting_at"
                ? "common_buyOnSkinport"
                : "common_viewOnSkinport",
            )}
            values={{ skinportLogo: <SkinportLogo size={10} isInverted /> }}
          />
        </TooltipContent>
      </Tooltip>
    ) : (
      children
    );

  const priceElement = (
    <div className={cn("flex gap-2 items-center", className)}>
      {price !== undefined && currency ? (
        linkPriceToItem(
          <>
            <div
              className={cn(priceVariants({ size, asLink: Boolean(linkItem) }))}
            >
              {typeof price === "number" ? formatPrice(price, currency) : "-"}
            </div>
            {discount && typeof price === "number" && (
              <Discount discount={discount} />
            )}
          </>,
        )
      ) : (
        <Skeleton className={skeletonVariants({ size })} />
      )}
    </div>
  );

  return priceTitle !== "none" ? (
    <div>
      <div className={cn(startingAtVariants({ size }), startingAtClassName)}>
        {getI18nMessage(
          priceTitle === "starting_at"
            ? "common_startingAt"
            : "common_suggestedPrice",
        )}
      </div>
      {priceElement}
    </div>
  ) : (
    priceElement
  );
}
