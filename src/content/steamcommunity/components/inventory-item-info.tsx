import { ItemSkinportPrice } from "@/components/item-skinport-price";
import type { SelectedSkinportItemPrice } from "@/lib/skinport";
import { useEffect } from "react";
import type { SteamItem } from "../lib/steam";

export function InventoryItemInfo({
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
            inventoryItem.qualityColor
              ? { color: inventoryItem.qualityColor }
              : undefined
          }
        >
          {itemQuality}
        </div>
      );
    }
  };

  return (
    <>
      <div className="absolute left-1.5 bottom-0.5 z-10">
        {renderItemQuality()}
        <ItemSkinportPrice
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
