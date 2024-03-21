import { Skeleton } from "@/components/ui/skeleton";
import { type Feature, featureManager } from "@/content/feature-manager";
import { InventoryItemInfo } from "@/content/steamcommunity/components/inventory-item-info";
import { createWidgetElement } from "@/content/widget";
import { formatPrice } from "@/lib/format";
import {
  createUseSkinportItemPrices,
  selectSkinportItemPrice,
} from "@/lib/skinport";
import { parseSupportedSteamAppId } from "@/lib/steam";
import { $, $$ } from "select-dom";
import { bridge } from "../bridge";

const inventoryItemsInfo: Feature = async ({
  createNotMatchingFeatureAttributeSelector,
  setFeatureAttribute,
}) => {
  const inventoriesElement = $("#inventories");

  if (!inventoriesElement) {
    return;
  }

  const observer = new MutationObserver(async () => {
    const inventoryElement = $(
      createNotMatchingFeatureAttributeSelector(
        "div[id*='inventory']:is([style*='display: block'], [style=''])",
      ),
      inventoriesElement,
    );

    if (!inventoryElement) {
      return;
    }

    setFeatureAttribute(inventoryElement);

    const inventoryAppId = parseSupportedSteamAppId(
      inventoryElement.getAttribute("id")?.split("_")[2],
    );

    if (!inventoryAppId) {
      return;
    }

    const inventory = await bridge.inventory.loadCompleteInventory();

    const skinportItemNames = new Set<string>();

    for (const item of Object.values(inventory)) {
      if (item?.isMarketable) {
        skinportItemNames.add(item.marketHashName);
      }
    }

    const useSkinportItemPrices = createUseSkinportItemPrices(
      Array.from(skinportItemNames),
    );

    const inventoryItemElements = $$(".itemHolder .item", inventoryElement);

    for (const inventoryItemElement of inventoryItemElements) {
      const inventoryItemElementId = inventoryItemElement.getAttribute("id");

      if (!inventoryItemElementId) {
        continue;
      }

      const inventoryItem = inventory[inventoryItemElementId];

      if (!inventoryItem) {
        continue;
      }

      const [itemInfoElement] = createWidgetElement(() => {
        const skinportItemPrices = useSkinportItemPrices();

        const skinportItemPrice = selectSkinportItemPrice(
          skinportItemPrices,
          inventoryItem?.marketHashName,
        );

        return (
          <InventoryItemInfo
            inventoryItem={inventoryItem}
            inventoryItemElement={inventoryItemElement}
            skinportItemPrice={skinportItemPrice}
          />
        );
      });

      inventoryItemElement.append(itemInfoElement);
    }

    const inventoryPageControlsElement = $("#inventory_pagecontrols");

    if (!inventoryPageControlsElement) {
      return;
    }

    const [totalInventoryValueElement] = createWidgetElement(() => {
      const skinportItemPrices = useSkinportItemPrices();

      return (
        <div className="flex gap-2 bg-background px-4 py-3 rounded-md">
          {skinportItemPrices.data ? (
            <>
              <div>Total value</div>
              <div className="text-white font-semibold">
                {formatPrice(
                  Object.values(skinportItemPrices.data.prices).reduce(
                    (acc, { suggested }) => acc + suggested,
                    0,
                  ),
                  skinportItemPrices.data.currency,
                )}
              </div>
            </>
          ) : (
            <Skeleton className="w-28 h-3.5 my-[0.2rem]" />
          )}
        </div>
      );
    });

    inventoryPageControlsElement.style.float = "none";
    inventoryPageControlsElement.style.display = "flex";
    inventoryPageControlsElement.style.justifyContent = "space-between";

    const pageControlsContainer = document.createElement("div");

    pageControlsContainer.append(...inventoryPageControlsElement.children);

    inventoryPageControlsElement.append(pageControlsContainer);

    inventoryPageControlsElement.prepend(totalInventoryValueElement);
  });

  observer.observe(inventoriesElement, { childList: true, subtree: true });
};

featureManager.add(inventoryItemsInfo, {
  name: "inventory-items-info",
  matchPathname: /\/(id|profiles)\/\w+\/inventory/,
  useBridge: true,
  extensionOptionsKey: "steamCommunityInventoryShowItemPrices",
});
