import { SteamItemSkinportActions } from "@/components/steam-item-skinport-actions";
import { SteamItemSkinportPrice } from "@/components/steam-item-skinport-price";
import { featureManager } from "@/content/feature-manager";
import { createWidgetElement } from "@/content/widget";
import { selectSkinportItemPrice, useSkinportItemPrices } from "@/lib/skinport";
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
          ".inventory_page_right .inventory_iteminfo[style*='z-index: 1']",
        ),
        inventoryContentElement,
      );

      if (!itemInfoElement) {
        return;
      }

      cleanupPreviousItem();

      const { removeFeatureAttribute } = setFeatureAttribute(itemInfoElement);

      cleanupPreviousItemFns.push(removeFeatureAttribute);

      const selectedItem = await steamCommunity.inventory.getSelectedItem();

      if (!selectedItem) {
        return;
      }

      const [viewOnSkinportElement, removeViewOnSkinportElement] =
        createWidgetElement(({ shadowRoot }) => {
          const skinportItemPrices = useSkinportItemPrices(
            selectedItem.marketHashName,
          );

          const skinportItemPrice = selectSkinportItemPrice(
            skinportItemPrices,
            selectedItem.marketHashName,
          );

          return (
            <div className="space-y-1 mb-4">
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

      const itemDescriptorsElement = $(
        ".item_desc_descriptors",
        itemInfoElement,
      );

      if (!itemDescriptorsElement) {
        return;
      }

      itemDescriptorsElement.insertAdjacentElement(
        "beforebegin",
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
