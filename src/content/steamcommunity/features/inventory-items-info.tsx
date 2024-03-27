import { SteamInventoryItemInfo } from "@/components/steam-inventory-item-info";
import { Skeleton } from "@/components/ui/skeleton";
import { type Feature, featureManager } from "@/content/feature-manager";
import { createWidgetElement } from "@/content/widget";
import { formatPrice } from "@/lib/format";
import { getI18nMessage } from "@/lib/i18n";
import {
  createUseSkinportItemPrices,
  getIsSkinportSupportedSteamAppId,
  selectSkinportItemPrice,
} from "@/lib/skinport";
import { steamCommunity } from "@/lib/steamCommunity";
import { $, $$ } from "select-dom";

const inventoryItemsInfo: Feature = async ({
  createNotMatchingFeatureAttributeSelector,
  setFeatureAttribute,
  extensionOptions,
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

    const inventoryAppId = inventoryElement.getAttribute("id")?.split("_")[2];

    if (
      !inventoryAppId ||
      !getIsSkinportSupportedSteamAppId(Number(inventoryAppId))
    ) {
      return;
    }

    const inventory = await steamCommunity.inventory.loadCompleteInventory();

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
          <SteamInventoryItemInfo
            inventoryItem={inventoryItem}
            inventoryItemElement={inventoryItemElement}
            skinportItemPrice={skinportItemPrice}
          />
        );
      });

      inventoryItemElement.append(itemInfoElement);
    }

    if (extensionOptions.steamCommunityInventoryShowTotalValue) {
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
                <div>{getI18nMessage("common_totalValue")}</div>
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
    }
  });

  observer.observe(inventoriesElement, { childList: true, subtree: true });
};

featureManager.add(inventoryItemsInfo, {
  name: "inventory-items-info",
  matchPathname: /\/(id|profiles)\/\w+\/inventory/,
  extensionOptionsKey: "steamCommunityInventoryShowItemPrices",
});
