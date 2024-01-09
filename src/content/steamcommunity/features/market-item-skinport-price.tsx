import { ItemSkinportActions } from "@/components/item-skinport-actions";
import { ItemSkinportPrice } from "@/components/item-skinport-price";
import { featureManager } from "@/content/feature-manager";
import { createWidgetElement } from "@/content/widget";
import { useSkinportItemPrices } from "@/lib/skinport";
import {
  getHasItemExterior,
  getItemFromSteamMarketUrl,
  supportedSteamAppIds,
} from "@/lib/steam";
import { getPercentageDecrease, parseCurrency } from "@/lib/utils";
import elementReady from "element-ready";
import { useEffect, useState } from "react";
import { $ } from "select-dom";

async function marketItemSkinportPrice() {
  const item = getItemFromSteamMarketUrl();

  if (!item) {
    return;
  }

  const itemDescriptionElement = $(
    ".market_listing_iteminfo .item_desc_descriptors",
  );

  if (!itemDescriptionElement) {
    return;
  }

  const inspectIngameLink =
    (getHasItemExterior(item.name) &&
      (
        await elementReady("a[href*='csgo_econ_action_preview']", {
          stopOnDomReady: false,
          timeout: 5000,
        })
      )?.getAttribute("href")) ||
    undefined;

  const [widgetElement] = createWidgetElement(({ shadowRoot }) => {
    const skinportItemPrices = useSkinportItemPrices(item.name);
    const [marketForSalePriceElementText, setMarketForSalePriceElementText] =
      useState<string>();

    useEffect(() => {
      (async () => {
        const marketForSalePriceElement = await elementReady(
          "#market_commodity_forsale > span:last-child",
          {
            stopOnDomReady: false,
            timeout: 5000,
          },
        );

        if (marketForSalePriceElement) {
          setMarketForSalePriceElementText(marketForSalePriceElement.innerText);
        }
      })();
    }, []);

    const itemSkinportPrice = skinportItemPrices.data?.items[item.name];

    const marketStartingAtPrice =
      marketForSalePriceElementText &&
      parseCurrency(marketForSalePriceElementText);

    const itemSkinportPercentageDecrease =
      marketStartingAtPrice && itemSkinportPrice?.[0]
        ? getPercentageDecrease(marketStartingAtPrice, itemSkinportPrice[0])
        : undefined;

    return (
      <div className="space-y-1 mb-4">
        <ItemSkinportPrice
          price={itemSkinportPrice?.[0]}
          currency={skinportItemPrices.data?.currency}
          discount={itemSkinportPercentageDecrease}
          priceTitle="starting_at"
        />
        <ItemSkinportActions
          item={item}
          inspectIngameLink={inspectIngameLink}
          container={shadowRoot}
          action="buy"
        />
      </div>
    );
  });

  itemDescriptionElement.insertAdjacentElement("beforebegin", widgetElement);
}

featureManager.add(marketItemSkinportPrice, {
  matchPathname: new RegExp(
    `/market/listings/(${supportedSteamAppIds.join(")|(")})`,
  ),
  awaitDomReady: true,
});
