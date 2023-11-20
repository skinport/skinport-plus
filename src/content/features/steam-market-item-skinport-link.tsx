import React from "react";
import { Button } from "@/components/ui/button";
import { createWidgetElement } from "../widget";
import { Link } from "@/components/ui/link";
import { $ } from "select-dom";
import { steamAppIdNames, supportedSteamAppIds } from "@/lib/steam";
import { getSkinportItemUrl } from "@/lib/skinport-api";

export default async function steamMarketItemSkinportLink() {
  const urlPathName = window.location.pathname.split("/");
  const itemName = urlPathName.pop();
  const appId = urlPathName.pop();

  if (!itemName || !(appId && supportedSteamAppIds.includes(appId))) {
    return;
  }

  const [buyOnSkinportButtonElement] = createWidgetElement(() => (
    <Button className="mb-4" asChild>
      <Link
        href={getSkinportItemUrl(
          steamAppIdNames[appId as keyof typeof steamAppIdNames],
          itemName,
        )}
        target="_blank"
      >
        View on Skinport
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
    buyOnSkinportButtonElement,
  );
}

steamMarketItemSkinportLink.matchPathname = new RegExp(
  `/market/listings/(${supportedSteamAppIds.join(")|(")})`,
);
