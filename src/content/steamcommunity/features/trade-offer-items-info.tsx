import { ItemSkinportPrice } from "@/components/item-skinport-price";
import { featureManager } from "@/content/feature-manager";
import { createWidgetElement } from "@/content/widget";
import { useSkinportItemPrices } from "@/lib/skinport";
import { Item, getItemFromSteamMarketUrl } from "@/lib/steam";
import elementReady from "element-ready";
import { $, $$ } from "select-dom";

async function addSkinportItemPrices(itemElements: HTMLElement[]) {
  const skinportItemPriceItems: (Item & { element: HTMLElement })[] = [];

  for (const itemElement of itemElements) {
    await elementReady(".item:not(.unknownItem)", {
      target: itemElement,
      stopOnDomReady: false,
    });

    const itemActionMenuButton = $(".slot_actionmenu_button", itemElement);

    const inventoryItemLink = $(
      ".inventory_item_link",
      itemElement,
    )?.getAttribute("href");

    if (!itemActionMenuButton || !inventoryItemLink) {
      return;
    }

    const itemActionMenuButtonHref = itemActionMenuButton.getAttribute("href");

    itemActionMenuButton.removeAttribute("href");

    itemActionMenuButton.click();

    if (itemActionMenuButtonHref) {
      itemActionMenuButton.setAttribute("href", itemActionMenuButtonHref);
    }

    const itemActionPopupElement = $(
      `#trade_action_popup:has(a[href="${inventoryItemLink}"])`,
    );

    const itemActionViewInMarketHref = $(
      "#trade_action_viewinmarket",
      itemActionPopupElement,
    )?.getAttribute("href");

    if (!itemActionPopupElement || !itemActionViewInMarketHref) {
      return;
    }

    itemActionPopupElement.style.display = "none";

    const item = getItemFromSteamMarketUrl(itemActionViewInMarketHref);

    if (!item) {
      return;
    }

    skinportItemPriceItems.push({
      ...item,
      element: itemElement,
    });
  }

  const skinportItemPriceItemNames = skinportItemPriceItems.map(
    ({ name }) => name,
  );

  for (const skinportItemPriceItem of skinportItemPriceItems) {
    const [skinportItemPriceElement] = createWidgetElement(() => {
      const skinportItemPrices = useSkinportItemPrices(
        skinportItemPriceItemNames,
      );

      const skinportItemPrice =
        skinportItemPrices.data?.items[skinportItemPriceItem.name];

      if (!skinportItemPrice) {
        return;
      }

      return (
        <div className="absolute left-1.5 bottom-0.5 z-10 flex gap-1">
          <ItemSkinportPrice
            price={skinportItemPrice[1]}
            currency={skinportItemPrices.data?.currency}
            size="sm"
            priceTitle="none"
            linkItem={skinportItemPriceItem}
          />
        </div>
      );
    });

    skinportItemPriceItem.element.append(skinportItemPriceElement);

    const itemInnerElement = $(".item", skinportItemPriceItem.element);

    if (itemInnerElement) {
      itemInnerElement.style.borderColor = "rgb(134, 80, 172)";
    }
  }
}

async function steamTradeOfferItemsInfo() {
  for (const tradeOfferSelector of ["#trade_yours", "#trade_theirs"]) {
    const tradeOfferElement = await elementReady(
      `${tradeOfferSelector}.ready`,
      {
        stopOnDomReady: false,
        timeout: 30000,
      },
    );

    const tradeItemElements = $$(".trade_slot.has_item", tradeOfferElement);

    if (tradeItemElements.length === 0) {
      return;
    }

    addSkinportItemPrices(tradeItemElements);
  }
}

featureManager.add(steamTradeOfferItemsInfo, {
  matchPathname: /^\/tradeoffer\//,
  awaitDomReady: true,
});
