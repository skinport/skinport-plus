import React from "react";
import { Button } from "@/components/ui/button";
import { createWidgetElement } from "../widget";
import { Link } from "@/components/ui/link";
import { $ } from "select-dom";
import { supportedSteamAppIds } from "@/lib/steam";
import { getSkinportItemUrl } from "@/lib/skinport";
import { useTranslation } from "react-i18next";

export default async function steamMarketItemSkinportLink() {
  const urlPathName = window.location.pathname.split("/");
  const itemName = urlPathName.pop();
  const appId = urlPathName.pop();

  if (!itemName || !(appId && supportedSteamAppIds.includes(appId))) {
    return;
  }

  const [viewOnSkinportButtonElement] = createWidgetElement(() => {
    const { t } = useTranslation();

    return (
      <Button className="mb-4" asChild>
        <Link href={getSkinportItemUrl(appId, itemName)} target="_blank">
          {t("viewOnSkinport")}
        </Link>
      </Button>
    );
  });

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

steamMarketItemSkinportLink.matchPathname = new RegExp(
  `/market/listings/(${supportedSteamAppIds.join(")|(")})`,
);
