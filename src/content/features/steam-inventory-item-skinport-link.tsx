import { supportedSteamAppIds } from "@/lib/steam";
import { $ } from "select-dom";
import { createWidgetElement, widgetElementExists } from "../widget";
import { getSkinportItemUrl } from "@/lib/skinport";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import React from "react";
import elementReady from "element-ready";
import { useTranslation } from "react-i18next";
import featureManager from "../feature-manager";

async function steamInventoryItemSkinportLink() {
  const inventoryContentElement = await elementReady("#tabcontent_inventory", {
    stopOnDomReady: false,
    timeout: 30000,
  });

  if (!inventoryContentElement) {
    return;
  }

  const removeViewOnSkinportElementFns: (() => void)[] = [];

  const removeViewOnSkinportElements = () =>
    removeViewOnSkinportElementFns.forEach((removeElement) => removeElement());

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

    removeViewOnSkinportElementFns.forEach((removeElement) => removeElement());

    const [viewOnSkinportElement, removeViewOnSkinportElement] =
      createWidgetElement(() => {
        const { t } = useTranslation();

        return (
          <Button className="mb-4" asChild>
            <Link href={skinportItemUrl} target="_blank">
              {t("viewOnSkinport")}
            </Link>
          </Button>
        );
      }, widgetName);

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
  host: "steamcommunity.com",
  matchPathname: /\/(id|profiles)\/\w+\/inventory/,
});
