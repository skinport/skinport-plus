import { PriceDiscount } from "@/components/price-discount";
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
import {
  getIsSupportedSteamAppId,
  getItemFromSteamMarketUrl,
} from "@/lib/steam";
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

    const marketListingItems: [string, string, HTMLElement][] = [];

    for (const marketListingElement of marketListingElements) {
      setFeatureAttribute(marketListingElement);

      const marketListingElementHref =
        marketListingElement.getAttribute("href");

      if (!marketListingElementHref) {
        continue;
      }

      const { itemName, appId } = getItemFromSteamMarketUrl(
        marketListingElementHref,
      );

      if (itemName && appId) {
        marketListingItems.push([
          appId,
          decodeURIComponent(itemName),
          marketListingElement,
        ]);
      }
    }

    const skinportSupportedItems: string[] = [];

    for (const [appId, itemName] of marketListingItems) {
      if (getIsSupportedSteamAppId(appId)) {
        skinportSupportedItems.push(itemName);
      }
    }

    let skinportItemPrices:
      | Awaited<ReturnType<typeof getSkinportItemPrices>>
      | undefined;

    if (skinportSupportedItems.length > 0) {
      try {
        skinportItemPrices = await getSkinportItemPrices(
          skinportSupportedItems,
        );
      } catch (error) {
        console.error(error);
        // TODO: Handle error with e.g. Sentry
      }
    }

    for (const [
      marketListingAppId,
      marketListingItemName,
      marketListingElement,
    ] of marketListingItems) {
      const marketListingColumnsElement = $(
        ".market_listing_price_listings_block",
        marketListingElement,
      );

      if (!marketListingColumnsElement) {
        continue;
      }

      const marketListingItemPriceElement = $(
        ".market_table_value .normal_price",
        marketListingColumnsElement,
      );

      const marketListingItemPrice =
        marketListingItemPriceElement?.innerText &&
        parseNumberFromString(marketListingItemPriceElement.innerText);

      const [skinportStartingAtElement] = createWidgetElement(() => {
        if (!skinportItemPrices?.items[marketListingItemName]) {
          return (
            <div className="flex items-center justify-center h-full">–</div>
          );
        }

        const skinportItemPrice =
          skinportItemPrices.items[marketListingItemName];

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
                  href={getSkinportItemUrl(
                    marketListingAppId,
                    marketListingItemName,
                  )}
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
                      <PriceDiscount>
                        {skinportItemPricePercentageDecrease}
                      </PriceDiscount>
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
