import { ItemSkinportPrice } from "@/components/item-skinport-price";
import type { selectSkinportItemPrice } from "@/lib/skinport";
import type { Item } from "@/lib/steam";
import { useEffect } from "react";

export function InventoryItemInfo({
  inventoryItem,
  inventoryItemElement,
  skinportItemPrice,
}: {
  inventoryItem?: Item;
  inventoryItemElement: HTMLElement;
  skinportItemPrice: ReturnType<typeof selectSkinportItemPrice>;
}) {
  useEffect(() => {
    inventoryItemElement.style.borderColor = "#1d1d1d";
    inventoryItemElement.style.borderTopWidth = "2px";
  }, [inventoryItemElement]);

  // @TODO
  // useEffect(() => {
  //   if (inventoryItem) {
  //     inventoryItemElement.style.borderTopColor = inventoryItem.rarityColor;
  //   }
  // }, [inventoryItem, inventoryItemElement]);

  if (inventoryItem?.isMarketable === false) {
    return null;
  }

  return (
    <>
      <div className="absolute left-1.5 bottom-0.5 z-10">
        {inventoryItem?.isStatTrak && (
          <div className="text-2xs text-stattrak font-bold">ST</div>
        )}
        {inventoryItem?.isSouvenir && (
          <div className="text-2xs text-souvenir font-bold">S</div>
        )}
        <ItemSkinportPrice
          price={skinportItemPrice?.price?.suggested}
          currency={skinportItemPrice?.price?.currency}
          size="xs"
          priceTitle="none"
          linkItem={inventoryItem}
          loadingFailed={skinportItemPrice?.isError}
        />
      </div>
    </>
  );
}
