import { FloatBar } from "@/components/float-bar";
import { SteamItemSkinportActions } from "@/components/steam-item-skinport-actions";
import { SteamItemSkinportPrice } from "@/components/steam-item-skinport-price";
import { featureManager } from "@/content/feature-manager";
import { createWidgetElement } from "@/content/widget";
import {
  getIsSkinportSupportedSteamAppId,
  selectSkinportItemPrice,
  useSkinportItemPrices,
} from "@/lib/skinport";
import { steamCommunity } from "@/lib/steamCommunity";
import elementReady from "element-ready";
import { $ } from "select-dom";

featureManager.add(
  async ({
    createNotMatchingFeatureAttributeSelector,
    setFeatureAttribute,
  }) => {
    let cleanupPreviousItemFns: (() => void)[] = [];

    const cleanupPreviousItem = () => {
      if (cleanupPreviousItemFns.length) {
        for (const cleanupPreviousItemFn of cleanupPreviousItemFns) {
          cleanupPreviousItemFn();
        }

        cleanupPreviousItemFns = [];
      }
    };

    const observer = new MutationObserver(async () => {
      const itemInfoElement = $(
        createNotMatchingFeatureAttributeSelector(
          ".inventory_page_right div[data-featuretarget='iteminfo'][style*='position: static']",
        ),
        inventoryContentElement,
      );

      if (!itemInfoElement) {
        return;
      }

      const itemGameInfoElement = $(
        "div:has(> a[href*='https://store.steampowered.com/app/'])",
        itemInfoElement,
      );

      if (!itemGameInfoElement) {
        return;
      }

      cleanupPreviousItem();

      const { removeFeatureAttribute } = setFeatureAttribute(itemInfoElement);

      cleanupPreviousItemFns.push(removeFeatureAttribute);

      const selectedItem = await steamCommunity.inventory.getSelectedItem();

      if (
        !selectedItem ||
        !getIsSkinportSupportedSteamAppId(selectedItem.appId)
      ) {
        return;
      }

      const [viewOnSkinportElement, removeViewOnSkinportElement] =
        createWidgetElement(({ shadowRoot }) => {
          const skinportItemPrices = useSkinportItemPrices(
            selectedItem.marketHashName,
            selectedItem.ownerSteamId ?? undefined,
          );

          const skinportItemPrice = selectSkinportItemPrice(
            skinportItemPrices,
            selectedItem.marketHashName,
          );

          return (
            <div className="space-y-1 mb-4">
              {selectedItem.float && (
                <FloatBar float={Number(selectedItem.float)} className="mb-2" />
              )}
              <SteamItemSkinportPrice
                price={skinportItemPrice}
                priceType={selectedItem.isOwner ? "suggested" : "lowest"}
              />
              <SteamItemSkinportActions
                item={selectedItem}
                container={shadowRoot}
                actionType={selectedItem.isOwner ? "sell" : "buy"}
              />
            </div>
          );
        });

      cleanupPreviousItemFns.push(removeViewOnSkinportElement);

      itemGameInfoElement.insertAdjacentElement(
        "afterend",
        viewOnSkinportElement,
      );
    });

    const inventoryContentElement = await elementReady(
      "#tabcontent_inventory",
      {
        stopOnDomReady: false,
        timeout: 30000,
      },
    );

    if (!inventoryContentElement) {
      return;
    }

    observer.observe(inventoryContentElement, {
      childList: true,
      subtree: true,
    });
  },
  {
    name: "inventory-item-info",
    matchPathname: /\/(id|profiles)\/\w+\/inventory/,
    extensionOptionsKey: "steamCommunityInventoryShowItemPrices",
  },
);
