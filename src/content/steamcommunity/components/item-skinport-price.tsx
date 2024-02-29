import { InterpolateMessage } from "@/components/interpolate-message";
import { SkinportLogo } from "@/components/skinport-logo";
import { Link } from "@/components/ui/link";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatPrice } from "@/lib/format";
import { I18nMessageKey, getI18nMessage } from "@/lib/i18n";
import { getSkinportItemUrl } from "@/lib/skinport";
import { SteamItem } from "../lib/steam";

export interface ItemSkinportPriceProps {
  item: SteamItem;
  price?: number | null;
  currency?: string;
  tooltipType: "view" | "buy" | "sell";
}

const tooltipI18nMessageKey = {
  view: "common_viewOnSkinport",
  buy: "common_buyOnSkinport",
  sell: "common_sellOnSkinport",
} as Record<ItemSkinportPriceProps["tooltipType"], I18nMessageKey>;

export function ItemSkinportPrice({
  item,
  price,
  currency,
  tooltipType,
}: ItemSkinportPriceProps) {
  if (!item.isMarketable) {
    return;
  }

  if (price === undefined || !currency) {
    return <Skeleton className="w-8 h-3 my-0.5" />;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={getSkinportItemUrl({
            name: item.marketHashName,
            // @ts-expect-error
            appId: String(item.appId),
          })}
          target="_blank"
          onClick={(event) => {
            event.stopPropagation();
          }}
          className="flex gap-2 items-center"
        >
          <div className="text-xs font-semibold">
            {typeof price === "number" ? formatPrice(price, currency) : "-"}
          </div>
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
