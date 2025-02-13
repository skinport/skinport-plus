import { SteamItemSkinportActions } from "@/components/steam-item-skinport-actions";
import { SteamItemSkinportPrice } from "@/components/steam-item-skinport-price";
import { featureManager } from "@/content/feature-manager";
import { createWidgetElement } from "@/content/widget";
import {
  selectSkinportItemPrice,
  skinportSupportedSteamApps,
  useSkinportItemPrices,
} from "@/lib/skinport";
import { steamCommunity } from "@/lib/steamCommunity";
import { getPercentageDecrease, parseCurrency } from "@/lib/utils";
import elementReady from "element-ready";
import { useEffect, useState } from "react";
import { $ } from "select-dom";

async function marketItemSkinportPrice() {
  const itemDescriptionElement = $(
    ".market_listing_iteminfo .item_desc_descriptors",
  );

  if (!itemDescriptionElement) {
    return;
  }

  const marketListingElement = $(".market_listing_row[id^='listing_']");

  const marketListingId =
    marketListingElement?.getAttribute("id")?.split("_")[1] || undefined;

  const marketListingItem = await steamCommunity.market.getListingItem({
    listingId: marketListingId,
  });

  const marketListingPriceElementText =
    marketListingElement &&
    $(
      ".market_listing_price.market_listing_price_with_fee",
      marketListingElement,
    )?.innerText;

  const [widgetElement] = createWidgetElement(({ shadowRoot }) => {
    const skinportItemPrices = useSkinportItemPrices(
      marketListingItem.marketHashName,
    );

    const [marketForSalePriceElementText, setMarketForSalePriceElementText] =
      useState<string>();

    useEffect(() => {
      if (!marketListingPriceElementText) {
        const getCommodityItemPrice = async () => {
          const marketForSalePriceElement = await elementReady(
            "#market_commodity_forsale > span:last-child",
            {
              stopOnDomReady: false,
              timeout: 5000,
            },
          );

          if (marketForSalePriceElement) {
            setMarketForSalePriceElementText(
              marketForSalePriceElement.innerText,
            );
          }
        };

        getCommodityItemPrice();
      }
    }, []);

    const skinportItemPrice = selectSkinportItemPrice(
      skinportItemPrices,
      marketListingItem.marketHashName,
    );

    const marketStartingAtPrice =
      (marketListingPriceElementText &&
        parseCurrency(marketListingPriceElementText)) ||
      (marketForSalePriceElementText &&
        parseCurrency(marketForSalePriceElementText));

    const itemSkinportPercentageDecrease =
      marketStartingAtPrice && skinportItemPrice?.data?.lowest
        ? getPercentageDecrease(
            marketStartingAtPrice,
            skinportItemPrice.data.lowest,
          )
        : undefined;

    return (
      <div className="space-y-1 mb-4">
        <SteamItemSkinportPrice
          price={skinportItemPrice}
          discount={itemSkinportPercentageDecrease}
          priceType="lowest"
        />
        <SteamItemSkinportActions
          item={marketListingItem}
          container={shadowRoot}
          actionType="buy"
        />
      </div>
    );
  });

  itemDescriptionElement.insertAdjacentElement("beforebegin", widgetElement);
}

featureManager.add(marketItemSkinportPrice, {
  name: "market-item-skinport-price",
  matchPathname: new RegExp(
    `/market/listings/(${Object.keys(skinportSupportedSteamApps).join(")|(")})`,
  ),
});
