import { Feature, featureManager } from "@/content/feature-manager";
import { InventoryItemInfo } from "@/content/steamcommunity/components/inventory-item-info";
import { createWidgetElement } from "@/content/widget";
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

    const inventory = await bridge.inventoryLoadCompleteInventory.request();

    const skinportItemNames = new Set<string>();

    for (const item of Object.values(inventory.itemsByAssetId)) {
      if (item.marketable === 1) {
        skinportItemNames.add(item.market_hash_name);
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
        inventoryItemDescription.market_hash_name,
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
  });

  observer.observe(inventoriesElement, { childList: true, subtree: true });
};

featureManager.add(inventoryItemsInfo, {
  name: "inventory-items-info",
  awaitDomReady: true,
  matchPathname: /\/(id|profiles)\/\w+\/inventory/,
  withBridge: true,
});
