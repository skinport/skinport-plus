import { selectSkinportItemPrice } from "@/lib/skinport";
import { useEffect } from "react";
import { SteamItem } from "../lib/items";
import {
  ItemSkinportPrice,
  ItemSkinportPriceProps,
} from "./item-skinport-price";

const itemQualityLabels: Record<number, Record<string, string>> = {
  730: {
    strange: "ST",
    tournament: "S",
  },
};

export function ItemInfo({
  item,
  itemElement,
  skinportPrice,
  skinportPriceTooltipType = "view",
}: {
  item: SteamItem;
  itemElement: HTMLElement;
  skinportPrice: ReturnType<typeof selectSkinportItemPrice>;
  skinportPriceTooltipType?: ItemSkinportPriceProps["tooltipType"];
}) {
  useEffect(() => {
    itemElement.style.borderColor = "#1d1d1d";
    itemElement.style.borderTopWidth = "2px";
  }, [itemElement]);

  useEffect(() => {
    if (item.rarityColor) {
      itemElement.style.borderTopColor = item?.rarityColor;
    }
  }, [item, itemElement]);

  const itemQualityLabel =
    item.quality &&
    item.qualityColor &&
    itemQualityLabels[item.appId]?.[item.quality];

  return (
    <>
      <div className="absolute left-1.5 bottom-0.5 z-10">
        {itemQualityLabel && (
          <div
            className="text-2xs font-bold"
            style={item.qualityColor ? { color: item.qualityColor } : undefined}
          >
            {itemQualityLabel}
          </div>
        )}
        <ItemSkinportPrice
          item={item}
          price={skinportPrice?.price?.[1]}
          currency={skinportPrice?.currency}
          tooltipType={skinportPriceTooltipType}
        />
      </div>
    </>
  );
}
