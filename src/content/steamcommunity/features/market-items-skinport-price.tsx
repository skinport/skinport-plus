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
import { getPercentageDecrease } from "@/lib/utils";
import { $, $$ } from "select-dom";

const marketItemsSkinportPrice: Feature = async ({
  getNotMatchingFeatureAttributeSelector,
  setFeatureAttribute,
}) => {
  const addSkinportTableHeader = async () => {
    const marketTableHeaderElement = $(
      getNotMatchingFeatureAttributeSelector(
        ".market_listing_table_header .market_listing_price_listings_block",
      ),
    );

    if (!marketTableHeaderElement) {
      return;
    }

    setFeatureAttribute(marketTableHeaderElement);

    const [marketTableHeaderSkinportColumnElement] = createWidgetElement(() => (
      <div className="flex items-center h-full">
        <SkinportLogo style={{ height: 10 }} />
      </div>
    ));

    marketTableHeaderSkinportColumnElement.classList.add(
      "market_listing_right_cell",
    );

    marketTableHeaderSkinportColumnElement.style.width = "120px";
    marketTableHeaderSkinportColumnElement.style.height = "1.9em";

    marketTableHeaderElement.prepend(marketTableHeaderSkinportColumnElement);
  };

  const addSkinportItemPrices = async () => {
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

    const skinportItemPrices =
      skinportSupportedItems.length > 0
        ? await getSkinportItemPrices(skinportSupportedItems)
        : null;

    const setMarketListingCellStyles = (cellElement: HTMLElement) => {
      cellElement.style.width = "120px";
      cellElement.style.height = "73px";
      cellElement.style.float = "right";
    };

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

      if (!skinportItemPrices?.items[marketListingItemName]) {
        const [noPriceElement] = createWidgetElement(() => (
          <div className="flex items-center justify-center h-full">–</div>
        ));

        setMarketListingCellStyles(noPriceElement);

        marketListingColumnsElement.prepend(noPriceElement);

        continue;
      }

      const marketListingItemPriceElement = $(
        ".market_table_value .normal_price",
        marketListingColumnsElement,
      );

      const marketListingItemPrice =
        marketListingItemPriceElement?.innerText &&
        parseFloat(
          marketListingItemPriceElement.innerText.replace(/[^\d.]/g, ""),
        );

      const skinportItemPrice = skinportItemPrices.items[marketListingItemName];

      const skinportItemPricePercentageDecrease =
        typeof marketListingItemPrice === "number" &&
        getPercentageDecrease(marketListingItemPrice, skinportItemPrice);

      const [skinportStartingAtElement] = createWidgetElement(() => (
        <div className="h-full flex flex-col justify-center">
          <div className="text-xs text-center">Starting at</div>
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
                      skinportItemPrices.items[marketListingItemName],
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
      ));

      setMarketListingCellStyles(skinportStartingAtElement);

      marketListingColumnsElement.prepend(skinportStartingAtElement);
    }
  };

  if (window.location.pathname.includes("/search")) {
    const observer = new MutationObserver(() => {
      addSkinportTableHeader();
      addSkinportItemPrices();
    });

    const searchResultsTable = $("#searchResultsTable");

    if (!searchResultsTable) {
      return;
    }

    observer.observe(searchResultsTable, {
      childList: true,
      subtree: true,
    });

    return;
  }

  addSkinportTableHeader();
  addSkinportItemPrices();
};

featureManager.add(marketItemsSkinportPrice, {
  awaitDomReady: true,
  matchPathname: /\/market(?:\/?$|\/search)/,
});
