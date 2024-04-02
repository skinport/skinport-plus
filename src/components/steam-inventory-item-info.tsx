import { SteamItemSkinportPrice } from "@/components/steam-item-skinport-price";
import type { SelectedSkinportItemPrice } from "@/lib/skinport";
import type { SteamItem } from "@/lib/steam";
import { useEffect } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export function SteamInventoryItemInfo({
  inventoryItem,
  inventoryItemElement,
  skinportItemPrice,
}: {
  inventoryItem?: SteamItem;
  inventoryItemElement: HTMLElement;
  skinportItemPrice: SelectedSkinportItemPrice;
}) {
  useEffect(() => {
    inventoryItemElement.style.borderColor = "#1d1d1d";
    inventoryItemElement.style.borderTopWidth = "2px";
  }, [inventoryItemElement]);

  useEffect(() => {
    if (inventoryItem?.rarityColor) {
      inventoryItemElement.style.borderTopColor = inventoryItem.rarityColor;
    }
  }, [inventoryItem, inventoryItemElement]);

  if (inventoryItem?.isMarketable === false) {
    return null;
  }

  const renderItemQuality = () => {
    const itemQuality = inventoryItem?.isStatTrak
      ? "ST"
      : inventoryItem?.isSouvenir
        ? "S"
        : null;

    if (itemQuality) {
      return (
        <div
          className="text-2xs font-bold"
          style={
            inventoryItem?.qualityColor
              ? { color: inventoryItem.qualityColor }
              : undefined
          }
        >
          {itemQuality}
        </div>
      );
    }
  };

  const renderItemStickers = () => {
    if (inventoryItem?.stickers) {
      return (
        <div className="absolute top-1.5 right-0.5 z-10 flex flex-col gap-1">
          {inventoryItem.stickers.map(({ image, marketHashName }, index) => (
            <Tooltip key={`${index}_${marketHashName}`}>
              <TooltipTrigger>
                <img src={image} alt={marketHashName} className="w-4" />
              </TooltipTrigger>
              <TooltipContent side="left">{marketHashName}</TooltipContent>
            </Tooltip>
          ))}
        </div>
      );
    }
  };

  return (
    <>
      {renderItemStickers()}
      <div className="absolute left-1.5 bottom-0.5 z-10">
        {renderItemQuality()}
        <SteamItemSkinportPrice
          price={skinportItemPrice}
          priceType="suggested"
          size="xs"
          item={inventoryItem}
          hidePriceTitle
        />
      </div>
    </>
  );
}
