import { InterpolateMessage } from "@/components/interpolate-message";
import { ItemSkinportPrice } from "@/components/item-skinport-price";
import { SkinportPlusLogo } from "@/components/skinport-plus-logo";
import { featureManager } from "@/content/feature-manager";
import { createWidgetElement } from "@/content/widget";
import { getSkinportAttribute, setSkinportAttribute } from "@/lib/dom";
import { formatPrice } from "@/lib/format";
import { getI18nMessage } from "@/lib/i18n";
import {
  SKINPORT_ITEM_PRICES_FALLBACK_CURRENCY,
  SKINPORT_ITEM_PRICES_REQUEST_LIMIT,
  SkinportItemPricesResponse,
  getSkinportItemPrices,
} from "@/lib/skinport";
import { Item, getIsSupportedSteamAppId } from "@/lib/steam";
import { cn } from "@/lib/utils";
import ky from "ky";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { $, $$ } from "select-dom";
import { create } from "zustand";

async function tradeOffersItemsInfo() {
  const tradeOfferItemElements = $$(
    ".tradeoffer .trade_item[data-economy-item]",
  );

  if (tradeOfferItemElements.length === 0) {
    return;
  }

  const tradeOfferItems: Record<string, Item["appId"]> = {};

  for (const tradeOfferItemElement of tradeOfferItemElements) {
    const dataEconomyItemValue =
      tradeOfferItemElement.getAttribute("data-economy-item");

    if (!dataEconomyItemValue) {
      return;
    }

    const itemInfoMatch = (
      await ky(
        `https://steamcommunity.com/economy/${dataEconomyItemValue.replace(
          "classinfo",
          "itemclasshover",
        )}`,
        {
          searchParams: {
            content_only: 1,
            l: "english",
          },
        },
      ).text()
    ).match(/"market_hash_name\":"([^"]+)".*"appid":"(\d+)"/);

    if (!itemInfoMatch) {
      continue;
    }

    const itemMarketHashName = JSON.parse(`"${itemInfoMatch[1]}"`);
    const itemAppId = itemInfoMatch[2];

    if (!getIsSupportedSteamAppId(itemAppId)) {
      continue;
    }

    tradeOfferItems[itemMarketHashName] = itemAppId as Item["appId"];

    setSkinportAttribute(
      tradeOfferItemElement,
      "item-market-hash-name",
      itemMarketHashName,
    );
  }

  const tradeOfferItemMarketHashNames = Object.keys(tradeOfferItems);

  const skinportItemPricesRequests: ReturnType<typeof getSkinportItemPrices>[] =
    [];

  for (
    let i = 0;
    i < tradeOfferItemMarketHashNames.length;
    i += SKINPORT_ITEM_PRICES_REQUEST_LIMIT
  ) {
    skinportItemPricesRequests.push(
      getSkinportItemPrices(
        tradeOfferItemMarketHashNames.slice(
          i,
          i + SKINPORT_ITEM_PRICES_REQUEST_LIMIT,
        ),
      ),
    );
  }

  const skinportItemPrices: SkinportItemPricesResponse = {
    items: {},
    currency: SKINPORT_ITEM_PRICES_FALLBACK_CURRENCY,
  };

  for (const { items, currency } of await Promise.all(
    skinportItemPricesRequests,
  )) {
    skinportItemPrices.items = { ...skinportItemPrices.items, ...items };
    skinportItemPrices.currency = currency;
  }

  if (Object.keys(skinportItemPrices.items).length === 0) {
    return;
  }

  for (const tradeOfferElement of $$(".tradeoffer")) {
    const tradeOfferPartyElements = $$(".tradeoffer_items", tradeOfferElement);

    const totalTradeOfferItemsValues = { primary: 0, secondary: 0 };

    for (const tradeOfferPartyElement of tradeOfferPartyElements) {
      const tradeOfferParty = tradeOfferPartyElement.classList.contains(
        "primary",
      )
        ? "primary"
        : "secondary";

      for (const tradeOfferItemElement of $$(
        ".trade_item",
        tradeOfferPartyElement,
      )) {
        const itemMarketHashName = getSkinportAttribute(
          tradeOfferItemElement,
          "item-market-hash-name",
        );

        if (!itemMarketHashName) {
          continue;
        }

        const skinportItemPrice = skinportItemPrices.items[itemMarketHashName];

        if (!skinportItemPrice[1]) {
          continue;
        }

        const [itemSkinportPriceElement] = createWidgetElement(() => {
          return (
            <div className="absolute left-1.5 bottom-0.5 z-10">
              <ItemSkinportPrice
                price={skinportItemPrice[1]}
                currency={skinportItemPrices.currency}
                size="xs"
                priceTitle="none"
                linkItem={{
                  name: itemMarketHashName,
                  appId: tradeOfferItems[itemMarketHashName],
                }}
              />
            </div>
          );
        });

        tradeOfferItemElement.append(itemSkinportPriceElement);

        totalTradeOfferItemsValues[tradeOfferParty] += skinportItemPrice[1];
      }
    }

    const useShowValueDifferencePercentageStore = create<{
      enabled: boolean;
      toggle: () => void;
    }>((set) => ({
      enabled: false,
      toggle: () =>
        set((state) => ({
          enabled: !state.enabled,
        })),
    }));

    for (const tradeOfferPartyElement of tradeOfferPartyElements) {
      const tradeOfferParty = tradeOfferPartyElement.classList.contains(
        "primary",
      )
        ? "primary"
        : "secondary";

      const totalTradeOfferItemsValue =
        totalTradeOfferItemsValues[tradeOfferParty];

      const otherTotalTradeOfferItemsValue =
        totalTradeOfferItemsValues[
          tradeOfferParty === "primary" ? "secondary" : "primary"
        ];

      const totalTradeOfferItemsValueDifference =
        otherTotalTradeOfferItemsValue - totalTradeOfferItemsValue;

      const totalTradeOfferItemsValueDifferencePercentage = (
        (totalTradeOfferItemsValueDifference / totalTradeOfferItemsValue) *
        100
      ).toFixed(2);

      const ChevronIcon =
        totalTradeOfferItemsValueDifference > 0
          ? ChevronUpIcon
          : ChevronDownIcon;

      const [totalSkinportItemsPriceElement] = createWidgetElement(() => {
        const showValueDifferencePercentage =
          useShowValueDifferencePercentageStore();

        return (
          <div className="flex justify-end">
            <div
              className="flex gap-1 items-center group relative z-10 bg-background px-4 py-3 rounded-md"
              onMouseEnter={showValueDifferencePercentage.toggle}
              onMouseLeave={showValueDifferencePercentage.toggle}
            >
              <div>
                <span className="text-white font-semibold">
                  {formatPrice(
                    totalTradeOfferItemsValue,
                    skinportItemPrices.currency,
                  )}
                </span>
              </div>
              {totalTradeOfferItemsValueDifference !== 0 && (
                <div
                  className={cn("flex items-center text-red-light", {
                    "text-green-light": totalTradeOfferItemsValueDifference > 0,
                  })}
                >
                  <ChevronIcon size={20} />
                  {showValueDifferencePercentage.enabled ? (
                    <>
                      {totalTradeOfferItemsValueDifference > 0 && "+"}
                      {totalTradeOfferItemsValueDifferencePercentage}%
                    </>
                  ) : (
                    <>
                      {totalTradeOfferItemsValueDifference > 0 && "+"}
                      {formatPrice(
                        totalTradeOfferItemsValueDifference,
                        skinportItemPrices.currency,
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      });

      tradeOfferPartyElement.append(totalSkinportItemsPriceElement);
    }

    const tradeOfferFooterElement = $(".tradeoffer_footer", tradeOfferElement);

    if (!tradeOfferFooterElement) {
      continue;
    }

    const [pricingBySkinportPlusElement] = createWidgetElement(() => (
      <div className="flex gap-1 text-xs items-baseline">
        <InterpolateMessage
          message={getI18nMessage("common_pricingBySkinportPlus")}
          values={{
            skinportPlusLogo: <SkinportPlusLogo className="h-4 w-auto" />,
          }}
        />
      </div>
    ));

    tradeOfferFooterElement.style.display = "flex";
    tradeOfferFooterElement.style.flexDirection = "row-reverse";
    tradeOfferFooterElement.style.justifyContent = "space-between";
    tradeOfferFooterElement.style.marginTop = "4px";

    tradeOfferFooterElement.insertBefore(
      pricingBySkinportPlusElement,
      tradeOfferFooterElement.childNodes[2],
    );

    tradeOfferFooterElement.lastElementChild?.remove();
  }
}

featureManager.add(tradeOffersItemsInfo, {
  name: "trade-offers-items-info",
  matchPathname: /\/tradeoffers\/$/,
  awaitDomReady: true,
});
