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
import { getPercentageDecrease, parseNumberFromString } from "@/lib/utils";
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
      $(
        ".market_listing_iteminfo a[href*='csgo_econ_action_preview']",
      )?.getAttribute("href")) ||
    undefined;

  const cheapestMarketListingItemElement = $(
    ".market_table_value .market_listing_price_with_fee",
  );

  const [widgetElement] = createWidgetElement(({ shadowRoot }) => {
    const skinportItemPrices = useSkinportItemPrices(item.name);

    const itemSkinportPrice = skinportItemPrices.data?.items[item.name];

    const cheapestMarketListingItemPrice =
      cheapestMarketListingItemElement &&
      parseNumberFromString(cheapestMarketListingItemElement.innerText);

    const itemSkinportPercentageDecrease =
      cheapestMarketListingItemPrice && itemSkinportPrice
        ? getPercentageDecrease(
            cheapestMarketListingItemPrice,
            itemSkinportPrice,
          )
        : undefined;

    return (
      <div className="space-y-1 mb-4">
        <ItemSkinportPrice
          price={itemSkinportPrice}
          currency={skinportItemPrices.data?.currency}
          discount={itemSkinportPercentageDecrease}
        />
        <ItemSkinportActions
          item={item}
          inspectIngameLink={inspectIngameLink}
          container={shadowRoot}
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
