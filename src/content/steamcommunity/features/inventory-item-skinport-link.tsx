import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import { featureManager } from "@/content/feature-manager";
import { createWidgetElement, widgetElementExists } from "@/content/widget";
import { getI18nMessage } from "@/lib/i18n";
import { getSkinportItemUrl } from "@/lib/skinport";
import { supportedSteamAppIds } from "@/lib/steam";
import elementReady from "element-ready";
import React from "react";
import { $ } from "select-dom";

async function steamInventoryItemSkinportLink() {
  const inventoryContentElement = await elementReady("#tabcontent_inventory", {
    stopOnDomReady: false,
    timeout: 30000,
  });

  if (!inventoryContentElement) {
    return;
  }

  const removeViewOnSkinportElementFns: (() => void)[] = [];

  const removeViewOnSkinportElements = () => {
    for (const removeViewOnSkinportElementFn of removeViewOnSkinportElementFns) {
      removeViewOnSkinportElementFn();
    }
  };

  const observer = new MutationObserver(() => {
    const itemInfoElement = $(
      ".inventory_page_right .inventory_iteminfo[style*='z-index: 1']",
      inventoryContentElement,
    );

    if (!itemInfoElement) {
      removeViewOnSkinportElements();

      return;
    }

    const marketLinkElement = $(
      ".item_market_actions a[href*='/market/listings/']",
      itemInfoElement,
    );

    if (!marketLinkElement) {
      removeViewOnSkinportElements();

      return;
    }

    const urlPathName = marketLinkElement.getAttribute("href")?.split("/");
    const itemName = urlPathName?.pop();
    const appId = urlPathName?.pop();

    if (!itemName || !(appId && supportedSteamAppIds.includes(appId))) {
      removeViewOnSkinportElements();

      return;
    }

    const skinportItemUrl = getSkinportItemUrl(appId, itemName);
    const widgetName = `steam-inventory-item-skinport-link-${skinportItemUrl
      .split("/")
      .pop()}`;

    if (widgetElementExists(widgetName, itemInfoElement)) {
      return;
    }

    removeViewOnSkinportElements();

    const [viewOnSkinportElement, removeViewOnSkinportElement] =
      createWidgetElement(
        () => (
          <Button className="mb-4" asChild>
            <Link href={skinportItemUrl} target="_blank">
              {getI18nMessage("common_viewOnSkinport")}
            </Link>
          </Button>
        ),
        widgetName,
      );

    removeViewOnSkinportElementFns.push(removeViewOnSkinportElement);

    const itemDescriptorsElement = $(".item_desc_descriptors", itemInfoElement);

    if (!itemDescriptorsElement) {
      return;
    }

    itemDescriptorsElement.insertAdjacentElement(
      "beforebegin",
      viewOnSkinportElement,
    );
  });

  observer.observe(inventoryContentElement, {
    childList: true,
    subtree: true,
  });
}

featureManager.add(steamInventoryItemSkinportLink, {
  matchPathname: /\/(id|profiles)\/\w+\/inventory/,
  awaitDomReady: true,
});
