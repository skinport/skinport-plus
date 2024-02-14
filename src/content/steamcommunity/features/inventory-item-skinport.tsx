import { ItemSkinportActions } from "@/components/item-skinport-actions";
import { ItemSkinportPrice } from "@/components/item-skinport-price";
import { Feature, featureManager } from "@/content/feature-manager";
import { createWidgetElement } from "@/content/widget";
import { selectSkinportItemPrice, useSkinportItemPrices } from "@/lib/skinport";
import { getHasItemExterior, getItemFromSteamMarketUrl } from "@/lib/steam";
import elementReady from "element-ready";
import { $ } from "select-dom";

const inventoryItemSkinport: Feature = async ({
  getHasFeatureAttribute,
  setFeatureAttribute,
}) => {
  const cleanupItemFns: (() => void)[] = [];

  const cleanupPreviousItem = () => {
    for (const cleanupItemFn of cleanupItemFns) {
      cleanupItemFn();
    }
  };

  const addWidgetElements = async () => {
    const itemInfoElement = $(
      ".inventory_page_right .inventory_iteminfo[style*='z-index: 1']",
      inventoryContentElement,
    );

    if (!itemInfoElement || getHasFeatureAttribute(itemInfoElement)) {
      return;
    }

    cleanupPreviousItem();

    const { removeFeatureAttribute } = setFeatureAttribute(itemInfoElement);

    cleanupItemFns.push(removeFeatureAttribute);

    const marketLinkElement = $(
      ".item_market_actions a[href*='/market/listings/']",
      itemInfoElement,
    );
    const marketLinkElementHref = marketLinkElement?.getAttribute("href");

    if (!marketLinkElement || !marketLinkElementHref) {
      return;
    }

    const item = getItemFromSteamMarketUrl(marketLinkElementHref);

    if (!item) {
      return;
    }

    const inspectIngameLink =
      (getHasItemExterior(item.name) &&
        (
          await elementReady("a[href*='csgo_econ_action_preview']", {
            target: itemInfoElement,
            stopOnDomReady: false,
            timeout: 5000,
          })
        )?.getAttribute("href")) ||
      undefined;

    const [viewOnSkinportElement, removeViewOnSkinportElement] =
      createWidgetElement(({ shadowRoot }) => {
        const skinportItemPrices = useSkinportItemPrices(item.name);

        const skinportItemPrice = selectSkinportItemPrice(
          skinportItemPrices,
          item.name,
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
              item={item}
              inspectIngameLink={inspectIngameLink}
              container={shadowRoot}
              action="sell"
            />
          </div>
        );
      });

    cleanupItemFns.push(removeViewOnSkinportElement);

    const itemDescriptorsElement = $(".item_desc_descriptors", itemInfoElement);

    if (!itemDescriptorsElement) {
      return;
    }

    itemDescriptorsElement.insertAdjacentElement(
      "beforebegin",
      viewOnSkinportElement,
    );
  };

  const observer = new MutationObserver(() => {
    addWidgetElements();
  });

  const inventoryContentElement = await elementReady("#tabcontent_inventory", {
    stopOnDomReady: false,
    timeout: 30000,
  });

  if (!inventoryContentElement) {
    return;
  }

  observer.observe(inventoryContentElement, {
    childList: true,
    subtree: true,
  });
};

featureManager.add(inventoryItemSkinport, {
  name: "inventory-item-skinport",
  matchPathname: /\/(id|profiles)\/\w+\/inventory/,
  awaitDomReady: true,
});
