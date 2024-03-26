import type { SteamItem } from "@/content/steamcommunity/lib/steam";
import { formatPrice } from "@/lib/format";
import { type I18nMessageKey, getI18nMessage } from "@/lib/i18n";
import type { SelectedSkinportItemPrice } from "@/lib/skinport";
import { getSkinportItemUrl } from "@/lib/skinport";
import { cn } from "@/lib/utils";
import { type VariantProps, cva } from "class-variance-authority";
import { AlertCircleIcon } from "lucide-react";
import type { ReactNode } from "react";
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

const alertIconVariants = cva("text-red-light", {
  variants: {
    size: {
      xs: "w-3 h-3 my-0.5",
      sm: "w-3.5 h-3.5 my-[0.1875rem]",
      base: "w-[1.875rem] h-[1.875rem] my-[0.1875rem]",
    },
  },
  defaultVariants: {
    size: "base",
  },
});

type ItemSkinportPriceProps = {
  price: SelectedSkinportItemPrice;
  priceType: "lowest" | "suggested";
  discount?: string;
  className?: string;
  startingAtClassName?: string;
  item?: Pick<SteamItem, "appId" | "marketHashName">;
  hidePriceTitle?: boolean;
  tooltipType?: "view" | "buy" | "sell";
} & VariantProps<typeof priceVariants>;

const tooltipI18nMessageKey = {
  view: "common_viewOnSkinport",
  buy: "common_buyOnSkinport",
  sell: "common_sellOnSkinport",
} as Record<NonNullable<ItemSkinportPriceProps["tooltipType"]>, I18nMessageKey>;

export function ItemSkinportPrice({
  price,
  priceType,
  discount,
  size,
  className,
  startingAtClassName,
  item,
  hidePriceTitle,
  tooltipType = "view",
}: ItemSkinportPriceProps) {
  const renderAsLinkToSkinport = (children: ReactNode) => {
    const skinportItemUrl = item && getSkinportItemUrl(item);

    if (skinportItemUrl) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href={skinportItemUrl}
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
              message={getI18nMessage(tooltipI18nMessageKey[tooltipType])}
              values={{ skinportLogo: <SkinportLogo size={10} isInverted /> }}
            />
          </TooltipContent>
        </Tooltip>
      );
    }

    return children;
  };

  const priceElement = (
    <div
      className={cn(
        "flex items-center",
        {
          "gap-1": size === "xs" || size === "sm",
          "gap-1.5": !size,
        },
        className,
      )}
    >
      {price?.error ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <AlertCircleIcon className={alertIconVariants({ size })} />
          </TooltipTrigger>
          <TooltipContent>
            {getI18nMessage("common_failedLoadingItemPrices")}
          </TooltipContent>
        </Tooltip>
      ) : price?.data !== undefined ? (
        renderAsLinkToSkinport(
          <>
            <div className={cn(priceVariants({ size, asLink: Boolean(item) }))}>
              {price.data !== null
                ? formatPrice(price.data[priceType], price.data.currency)
                : "-"}
            </div>
            {discount && price.data !== null && (
              <Discount discount={discount} />
            )}
          </>,
        )
      ) : (
        <Skeleton className={skeletonVariants({ size })} />
      )}
    </div>
  );

  return hidePriceTitle !== true ? (
    <div>
      <div className={cn(startingAtVariants({ size }), startingAtClassName)}>
        {getI18nMessage(
          priceType === "lowest"
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
