import { Skeleton } from "@/components/ui/skeleton";
import { type Feature, featureManager } from "@/content/feature-manager";
import { InventoryItemInfo } from "@/content/steamcommunity/components/inventory-item-info";
import { createWidgetElement } from "@/content/widget";
import { formatPrice } from "@/lib/format";
import { getI18nMessage } from "@/lib/i18n";
import {
  createUseSkinportItemPrices,
  selectSkinportItemPrice,
} from "@/lib/skinport";
import { parseSteamItem, parseSupportedSteamAppId } from "@/lib/steam";
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

    for (const item of Object.values(inventory.itemsByAssetId)) {
      if (item.marketable === 1) {
        skinportItemNames.add(item.marketHashName);
      }
    }

    const useSkinportItemPrices = createUseSkinportItemPrices(
      Array.from(skinportItemNames),
    );

    const inventoryItemElements = $$(".itemHolder .item", inventoryElement);

    for (const inventoryItemElement of inventoryItemElements) {
      const inventoryItemAssetId = inventoryItemElement
        .getAttribute("id")
        ?.split("_")[2];

      if (!inventoryItemAssetId) {
        continue;
      }

      const inventoryItemDescription =
        inventory.itemsByAssetId[inventoryItemAssetId];

      if (!inventoryItemDescription) {
        continue;
      }

      const inventoryItem = parseSteamItem(
        inventoryItemDescription.marketHashName,
        String(inventoryItemDescription.appid),
        inventoryItemDescription.marketable === 1,
      );

      if (!inventoryItem) {
        continue;
      }

      const [itemInfoElement] = createWidgetElement(() => {
        const skinportItemPrices = useSkinportItemPrices();

        const skinportItemPrice = selectSkinportItemPrice(
          skinportItemPrices,
          inventoryItem?.name,
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

      const totalInventoryValue =
        skinportItemPrices.data &&
        Object.values(skinportItemPrices.data.prices).reduce(
          (acc, { suggested }) => acc + suggested,
          0,
        );

      return (
        <div className="flex gap-2 bg-background px-4 py-3 rounded-md">
          {totalInventoryValue ? (
            <>
              <div>{getI18nMessage("common_totalValue")}</div>
              <div className="text-white font-semibold">
                {formatPrice(
                  totalInventoryValue,
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
