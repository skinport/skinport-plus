import { ItemSkinportPrice } from "@/components/item-skinport-price";
import { selectSkinportItemPrice } from "@/lib/skinport";
import { Item } from "@/lib/steam";
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

  useEffect(() => {
    if (skinportItemPrice?.price?.[2]) {
      inventoryItemElement.style.borderTopColor = skinportItemPrice.price[2];
    }
  }, [skinportItemPrice?.price, inventoryItemElement]);

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
          price={skinportItemPrice?.price?.[1]}
          currency={skinportItemPrice?.currency}
          size="xs"
          priceTitle="none"
          linkItem={inventoryItem}
          loadingFailed={skinportItemPrice?.isError}
        />
      </div>
    </>
  );
}
