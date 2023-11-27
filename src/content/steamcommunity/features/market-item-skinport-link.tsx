import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import { featureManager } from "@/content/feature-manager";
import { createWidgetElement } from "@/content/widget";
import { getI18nMessage } from "@/lib/i18n";
import { getSkinportItemUrl } from "@/lib/skinport";
import { supportedSteamAppIds } from "@/lib/steam";
import { $ } from "select-dom";

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
        {getI18nMessage("common_viewOnSkinport")}
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
