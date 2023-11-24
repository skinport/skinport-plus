import React from "react";
import { Button } from "@/components/ui/button";
import { createWidgetElement } from "@/content/widget";
import { Link } from "@/components/ui/link";
import { $ } from "select-dom";
import { supportedSteamAppIds } from "@/lib/steam";
import { getSkinportItemUrl } from "@/lib/skinport";
import featureManager from "@/content/feature-manager";
import browser from "webextension-polyfill";

async function steamMarketItemSkinportLink() {
  const urlPathName = window.location.pathname.split("/");
  const itemName = urlPathName.pop();
  const appId = urlPathName.pop();

  if (!itemName || !(appId && supportedSteamAppIds.includes(appId))) {
    return;
  }

  const [viewOnSkinportButtonElement] = createWidgetElement(() => (
    <Button className="mb-4" asChild>
      <Link href={getSkinportItemUrl(appId, itemName)} target="_blank">
        {browser.i18n.getMessage("common_viewOnSkinport")}
      </Link>
    </Button>
  ));

  const itemDescriptionElement = $(
    ".market_listing_iteminfo .item_desc_descriptors",
  );

  if (!itemDescriptionElement) {
    return;
  }

  itemDescriptionElement.insertAdjacentElement(
    "beforebegin",
    viewOnSkinportButtonElement,
  );
}

featureManager.add(steamMarketItemSkinportLink, {
  matchPathname: new RegExp(
    `/market/listings/(${supportedSteamAppIds.join(")|(")})`,
  ),
  awaitDomReady: true,
});
