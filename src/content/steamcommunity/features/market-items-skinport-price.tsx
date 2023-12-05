import { ItemSkinportPrice } from "@/components/item-skinport-price";
import { SkinportLogo } from "@/components/skinport-logo";
import { Feature, featureManager } from "@/content/feature-manager";
import { createWidgetElement } from "@/content/widget";
import { useSkinportItemPrices } from "@/lib/skinport";
import { getItemFromSteamMarketUrl } from "@/lib/steam";
import { getPercentageDecrease, parseNumberFromString } from "@/lib/utils";
import { $, $$ } from "select-dom";

const marketItemsSkinportPrice: Feature = async ({
  getNotMatchingFeatureAttributeSelector,
  setFeatureAttribute,
}) => {
  const addWidgets = async () => {
    const marketTableHeaderElement = $(
      getNotMatchingFeatureAttributeSelector(
        ".market_listing_table_header .market_listing_price_listings_block",
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
      getNotMatchingFeatureAttributeSelector("a[href*='/market/listings/']"),
    );

    if (marketListingElements.length === 0) {
      return;
    }

    const marketListings: {
      item: ReturnType<typeof getItemFromSteamMarketUrl>;
      element: HTMLElement;
    }[] = [];

    for (const marketListingElement of marketListingElements) {
      setFeatureAttribute(marketListingElement);

      const marketListingElementHref =
        marketListingElement.getAttribute("href");

      if (!marketListingElementHref) {
        continue;
      }

      const item = getItemFromSteamMarketUrl(marketListingElementHref);

      marketListings.push({ item, element: marketListingElement });
    }

    const skinportItemPricesItems: string[] = [];

    for (const { item } of marketListings) {
      if (item) {
        skinportItemPricesItems.push(item.name);
      }
    }

    for (const marketListing of marketListings) {
      const marketListingColumnsElement = $(
        ".market_listing_price_listings_block",
        marketListing.element,
      );

      if (!marketListingColumnsElement) {
        continue;
      }

      const [skinportStartingAtElement] = createWidgetElement(() => {
        const skinportItemPrices = useSkinportItemPrices(
          skinportItemPricesItems,
        );

        const skinportItemPrice =
          marketListing.item &&
          skinportItemPrices.data?.items[marketListing.item.name];

        if (
          !marketListing.item ||
          (!skinportItemPrices.isLoading && !skinportItemPrice)
        ) {
          return (
            <div className="flex items-center justify-center h-full">–</div>
          );
        }

        const marketListingItemPriceElement = $(
          ".market_table_value .normal_price",
          marketListingColumnsElement,
        );

        const marketListingItemPrice = marketListingItemPriceElement?.innerText
          ? parseNumberFromString(marketListingItemPriceElement.innerText)
          : undefined;

        const skinportItemPricePercentageDecrease =
          marketListingItemPrice && skinportItemPrice
            ? getPercentageDecrease(marketListingItemPrice, skinportItemPrice)
            : undefined;

        return (
          <div className="h-full flex flex-col justify-center">
            <ItemSkinportPrice
              price={skinportItemPrice}
              currency={skinportItemPrices.data?.currency}
              discount={skinportItemPricePercentageDecrease}
              size="sm"
              linkItem={marketListing.item}
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
    const searchResultsTable = $("#searchResultsTable");

    if (!searchResultsTable) {
      return;
    }

    return new MutationObserver(() => {
      addWidgets();
    }).observe(searchResultsTable, {
      childList: true,
      subtree: true,
    });
  }

  addWidgets();
};

featureManager.add(marketItemsSkinportPrice, {
  awaitDomReady: true,
  matchPathname: /\/market(?:\/?$|\/search)/,
});
