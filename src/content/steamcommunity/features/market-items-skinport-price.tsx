import { ItemSkinportPrice } from "@/components/item-skinport-price";
import { SkinportLogo } from "@/components/skinport-logo";
import { type Feature, featureManager } from "@/content/feature-manager";
import { createWidgetElement } from "@/content/widget";
import {
  createUseSkinportItemPrices,
  selectSkinportItemPrice,
} from "@/lib/skinport";
import { getPercentageDecrease, parseCurrency } from "@/lib/utils";
import { $, $$ } from "select-dom";
import type { SteamItem } from "../lib/steam";

const marketItemsSkinportPrice: Feature = async ({
  createNotMatchingFeatureAttributeSelector,
  setFeatureAttribute,
}) => {
  const addWidgets = async (contextSelector: string) => {
    const marketTableHeaderElement = $(
      createNotMatchingFeatureAttributeSelector(
        `${contextSelector} .market_listing_table_header .market_listing_price_listings_block`,
      ),
    );

    if (marketTableHeaderElement) {
      setFeatureAttribute(marketTableHeaderElement);

      const [marketTableHeaderSkinportColumnElement] = createWidgetElement(
        () => (
          <div className="flex items-center h-full">
            <SkinportLogo style={{ height: 10 }} />
          </div>
        ),
      );

      marketTableHeaderSkinportColumnElement.classList.add(
        "market_listing_right_cell",
      );

      marketTableHeaderSkinportColumnElement.style.width = "120px";
      marketTableHeaderSkinportColumnElement.style.height = "1.9em";

      marketTableHeaderElement.prepend(marketTableHeaderSkinportColumnElement);
    }

    const marketListingElements = $$(
      createNotMatchingFeatureAttributeSelector(
        `${contextSelector} a[href*='/market/listings/'] div[data-appid][data-hash-name]`,
      ),
    );

    if (marketListingElements.length === 0) {
      return;
    }

    const marketListings: {
      item: Pick<SteamItem, "appId" | "marketHashName"> | null;
      element: HTMLElement;
    }[] = [];

    for (const marketListingElement of marketListingElements) {
      setFeatureAttribute(marketListingElement);

      const appId = marketListingElement.getAttribute("data-appid");
      const marketHashName =
        marketListingElement.getAttribute("data-hash-name");

      marketListings.push({
        item:
          appId && marketHashName
            ? { appId: Number(appId), marketHashName }
            : null,
        element: marketListingElement,
      });
    }

    const skinportItemNames: string[] = [];

    for (const { item } of marketListings) {
      if (item) {
        skinportItemNames.push(item.marketHashName);
      }
    }

    const useSkinportItemPrices =
      createUseSkinportItemPrices(skinportItemNames);

    for (const marketListing of marketListings) {
      const marketListingColumnsElement = $(
        ".market_listing_price_listings_block",
        marketListing.element,
      );

      if (!marketListingColumnsElement) {
        continue;
      }

      const [skinportStartingAtElement] = createWidgetElement(() => {
        const skinportItemPrices = useSkinportItemPrices();

        const renderNoPrice = () => (
          <div className="flex items-center justify-center h-full">–</div>
        );

        if (!marketListing.item) {
          return renderNoPrice();
        }

        const skinportItemPrice = selectSkinportItemPrice(
          skinportItemPrices,
          marketListing.item.marketHashName,
        );

        if (!skinportItemPrice) {
          return renderNoPrice();
        }

        const marketListingItemPriceElement = $(
          ".market_table_value .normal_price",
          marketListingColumnsElement,
        );

        const marketListingItemPrice = marketListingItemPriceElement?.innerText
          ? parseCurrency(marketListingItemPriceElement.innerText)
          : undefined;

        const skinportItemPricePercentageDecrease =
          marketListingItemPrice && skinportItemPrice?.data?.lowest
            ? getPercentageDecrease(
                marketListingItemPrice,
                skinportItemPrice.data.lowest,
              )
            : undefined;

        return (
          <div className="h-full flex flex-col justify-center">
            <ItemSkinportPrice
              price={skinportItemPrice}
              priceType="lowest"
              discount={skinportItemPricePercentageDecrease}
              size="sm"
              item={marketListing.item}
              className="justify-center"
              startingAtClassName="text-center"
            />
          </div>
        );
      });

      skinportStartingAtElement.style.width = "120px";
      skinportStartingAtElement.style.height = "73px";
      skinportStartingAtElement.style.float = "right";

      marketListingColumnsElement.prepend(skinportStartingAtElement);
    }
  };

  if (window.location.pathname.includes("/search")) {
    const searchResultsSelector = "#searchResultsTable";
    const searchResultsTable = $(searchResultsSelector);

    if (!searchResultsTable) {
      return;
    }

    return new MutationObserver(() => {
      addWidgets(searchResultsSelector);
    }).observe(searchResultsTable, {
      childList: true,
      subtree: true,
    });
  }

  addWidgets("#sellListings");
};

featureManager.add(marketItemsSkinportPrice, {
  name: "market-items-skinport-price",
  matchPathname: /\/market(?:\/?$|\/search)/,
});
