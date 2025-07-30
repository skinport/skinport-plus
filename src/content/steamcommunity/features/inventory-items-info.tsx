import { SteamInventoryItemInfo } from "@/components/steam-inventory-item-info";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { AlertCircleIcon } from "lucide-react";
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
      if (item) {
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

        const renderTotalValue = () => {
          if (skinportItemPrices.error) {
            return (
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertCircleIcon className="text-red-light w-3.5 h-3.5" />
                </TooltipTrigger>
                <TooltipContent>
                  {getI18nMessage("common_failedLoadingItemPrices")}
                </TooltipContent>
              </Tooltip>
            );
          }

          if (!skinportItemNames.size) {
            return <div className="text-white font-semibold">-</div>;
          }

          if (!skinportItemPrices.data) {
            return <Skeleton className="w-14 h-3.5 my-[0.1875rem]" />;
          }

          return (
            <div className="text-white font-semibold">
              {formatPrice(
                Object.values(skinportItemPrices.data.prices).reduce(
                  (acc, { suggested }) => acc + suggested,
                  0,
                ),
                skinportItemPrices.data.currency,
              )}
            </div>
          );
        };

        return (
          <div className="flex gap-2 items-center bg-background px-4 py-3 rounded-md">
            <div>{getI18nMessage("common_totalValue")}</div>
            {renderTotalValue()}
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

      new MutationObserver(() => {
        if (inventoryElement.style.display === "none") {
          totalInventoryValueElement.remove();
        } else {
          inventoryPageControlsElement.prepend(totalInventoryValueElement);
        }
      }).observe(inventoryElement, {
        attributeFilter: ["style"],
        attributes: true,
      });
    }
  });

  observer.observe(inventoriesElement, { childList: true, subtree: true });
};

featureManager.add(inventoryItemsInfo, {
  name: "inventory-items-info",
  matchPathname: /\/(id|profiles)\/\w+\/inventory/,
  extensionOptionsKey: "steamCommunityInventoryShowItemPrices",
});
