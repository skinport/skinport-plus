import { Feature, featureManager } from "@/content/feature-manager";
import { createWidgetElement } from "@/content/widget";
import {
  createUseSkinportItemPrices,
  selectSkinportItemPrice,
} from "@/lib/skinport";
import {
  Item,
  getSteamUserInventory,
  parseSteamItem,
  parseSupportedSteamAppId,
} from "@/lib/steam";
import { wait } from "@/lib/utils";
import { $, $$ } from "select-dom";
import { InventoryItemInfo } from "../components/inventory-item-info";

function getAssetIdFromIdAttribute(element: HTMLElement) {
  return element?.getAttribute("id")?.replace(/^\d+_\d+_/, "");
}

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
      inventoryElement
        .getAttribute("id")
        ?.replace(/^inventory_\d+_(\d+)_\d$/, "$1"),
    );

    if (!inventoryAppId) {
      return;
    }

    await wait(2000);

    const userInventory = await getSteamUserInventory({
      appId: inventoryAppId,
    });

    const userInventoryAssetsByAssetId: Record<
      string,
      (typeof userInventory.assets)[0]
    > = {};

    for (const userInventoryAsset of userInventory.assets) {
      userInventoryAssetsByAssetId[userInventoryAsset.assetid] =
        userInventoryAsset;
    }

    const userInventoryDescriptionsByClassId: Record<
      string,
      (typeof userInventory.descriptions)[0]
    > = {};

    for (const userInventoryDescription of userInventory.descriptions) {
      userInventoryDescriptionsByClassId[userInventoryDescription.classid] =
        userInventoryDescription;
    }

    const addItemsInfo = () => {
      const inventoryItemElements = $$(
        createNotMatchingFeatureAttributeSelector(
          ".itemHolder .item:not(.pendingItem)",
        ),
        inventoryElement,
      );

      const inventoryItems = new Map<HTMLElement, Item>();

      for (const inventoryItemElement of inventoryItemElements) {
        setFeatureAttribute(inventoryItemElement);

        const itemAssetId = getAssetIdFromIdAttribute(inventoryItemElement);

        if (!itemAssetId) {
          continue;
        }

        const itemDescription =
          userInventoryDescriptionsByClassId[
            userInventoryAssetsByAssetId[itemAssetId].classid
          ];

        if (!itemDescription) {
          continue;
        }

        const item = parseSteamItem(
          itemDescription.market_hash_name,
          String(itemDescription.appid),
          itemDescription.marketable === 1,
        );

        if (item) {
          inventoryItems.set(inventoryItemElement, item);
        }
      }

      const useSkinportItemPrices = createUseSkinportItemPrices(
        Array.from(inventoryItems.values()).map(({ name }) => name),
      );

      for (const inventoryItemElement of inventoryItemElements) {
        const [itemInfoElement] = createWidgetElement(() => {
          const inventoryItem = inventoryItems.get(inventoryItemElement);

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
    };

    addItemsInfo();

    const inventoryObserver = new MutationObserver(addItemsInfo);

    inventoryObserver.observe(inventoryElement, {
      childList: true,
    });
  });

  observer.observe(inventoriesElement, { childList: true, subtree: true });
};

featureManager.add(inventoryItemsInfo, {
  name: "inventory-items-info",
  awaitDomReady: true,
  matchPathname: /\/(id|profiles)\/\w+\/inventory/,
});
