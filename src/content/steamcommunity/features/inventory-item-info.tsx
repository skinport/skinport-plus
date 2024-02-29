import { ItemSkinportActions } from "@/components/item-skinport-actions";
import { ItemSkinportPrice } from "@/components/item-skinport-price";
import { featureManager } from "@/content/feature-manager";
import { createWidgetElement } from "@/content/widget";
import { selectSkinportItemPrice, useSkinportItemPrices } from "@/lib/skinport";
import { parseSteamItem } from "@/lib/steam";
import elementReady from "element-ready";
import { $ } from "select-dom";
import { bridge } from "../bridge";

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

      const selectedItem = await bridge.inventory.getSelectedItem();

      const parsedSelectedItem = parseSteamItem(
        selectedItem.marketHashName,
        String(selectedItem.appid),
        selectedItem.marketable === 1,
        selectedItem.inspectIngameLink,
      );

      if (!parsedSelectedItem || !parsedSelectedItem.isMarketable) {
        return;
      }

      const [viewOnSkinportElement, removeViewOnSkinportElement] =
        createWidgetElement(({ shadowRoot }) => {
          const skinportItemPrices = useSkinportItemPrices(
            parsedSelectedItem.name,
          );

          const skinportItemPrice = selectSkinportItemPrice(
            skinportItemPrices,
            parsedSelectedItem.name,
          );

          return (
            <div className="space-y-1 mb-4">
              <ItemSkinportPrice
                price={skinportItemPrice?.price?.[1]}
                priceTitle="suggested_price"
                currency={skinportItemPrice?.currency}
                loadingFailed={skinportItemPrice?.isError}
              />
              <ItemSkinportActions
                item={parsedSelectedItem}
                container={shadowRoot}
                action={selectedItem.isUserOwner ? "sell" : "buy"}
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
    useBridge: true,
    extensionOptionsKey: "steamCommunityInventoryShowItemPrices",
  },
);
