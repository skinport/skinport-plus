import { Discount } from "@/components/discount";
import { SkinportLogo } from "@/components/skinport-logo";
import { Link } from "@/components/ui/link";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Feature, featureManager } from "@/content/feature-manager";
import { createWidgetElement } from "@/content/widget";
import { formatPrice } from "@/lib/format";
import { getI18nMessage } from "@/lib/i18n";
import { getSkinportItemPrices, getSkinportItemUrl } from "@/lib/skinport";
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

    let skinportItemPrices:
      | Awaited<ReturnType<typeof getSkinportItemPrices>>
      | undefined;

    if (skinportItemPricesItems.length > 0) {
      try {
        skinportItemPrices = await getSkinportItemPrices(
          skinportItemPricesItems,
        );
      } catch (error) {
        console.error(error);
        // TODO: Handle error with e.g. Sentry
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

      const skinportItemPrice =
        marketListing.item &&
        skinportItemPrices?.items[marketListing.item.name];

      const [skinportStartingAtElement] = createWidgetElement(() => {
        if (!marketListing.item || !skinportItemPrices || !skinportItemPrice) {
          return (
            <div className="flex items-center justify-center h-full">–</div>
          );
        }

        const marketListingItemPriceElement = $(
          ".market_table_value .normal_price",
          marketListingColumnsElement,
        );

        const marketListingItemPrice =
          marketListingItemPriceElement?.innerText &&
          parseNumberFromString(marketListingItemPriceElement.innerText);

        const skinportItemPricePercentageDecrease =
          typeof marketListingItemPrice === "number" &&
          getPercentageDecrease(marketListingItemPrice, skinportItemPrice);

        return (
          <div className="h-full flex flex-col justify-center">
            <div className="text-xs text-center">
              {getI18nMessage("common_startingAt")}
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href={getSkinportItemUrl(marketListing.item)}
                  target="_blank"
                  onClick={(event) => {
                    event.stopPropagation();
                  }}
                >
                  <div className="flex justify-center items-center gap-2">
                    <div className="font-semibold">
                      {formatPrice(
                        skinportItemPrice,
                        skinportItemPrices.currency,
                      )}
                    </div>
                    {skinportItemPricePercentageDecrease && (
                      <Discount
                        discount={skinportItemPricePercentageDecrease}
                      />
                    )}
                  </div>
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>{getI18nMessage("common_viewOnSkinport")}</p>
              </TooltipContent>
            </Tooltip>
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
