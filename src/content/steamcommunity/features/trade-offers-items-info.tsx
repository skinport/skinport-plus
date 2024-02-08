import { InterpolateMessage } from "@/components/interpolate-message";
import { ItemSkinportPrice } from "@/components/item-skinport-price";
import { SkinportPlusLogo } from "@/components/skinport-plus-logo";
import { Skeleton } from "@/components/ui/skeleton";
import { featureManager } from "@/content/feature-manager";
import { createWidgetElement } from "@/content/widget";
import { getSkinportAttribute, setSkinportAttribute } from "@/lib/dom";
import { formatPrice } from "@/lib/format";
import { getI18nMessage } from "@/lib/i18n";
import { useSkinportItemPrices } from "@/lib/skinport";
import { Item, getIsSupportedSteamAppId } from "@/lib/steam";
import { cn } from "@/lib/utils";
import ky from "ky";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { ReactNode } from "react";
import { $, $$ } from "select-dom";
import { create } from "zustand";

function getSkinportAttributeItemNames(tradeOfferItemElements: HTMLElement[]) {
  const itemNames: string[] = [];

  for (const tradeOfferItemElement of tradeOfferItemElements) {
    const itemName = getSkinportAttribute(tradeOfferItemElement, "item-name");

    if (itemName) {
      itemNames.push(itemName);
    }
  }

  return itemNames;
}

async function tradeOffersItemsInfo() {
  const allTradeOfferItems: Record<string, number> = {};

  const tradeOfferItemElements = $$(".tradeoffer .trade_item");

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

    const itemName = JSON.parse(`"${itemInfoMatch[1]}"`);
    const itemAppId = itemInfoMatch[2];

    if (!getIsSupportedSteamAppId(itemAppId)) {
      continue;
    }

    allTradeOfferItems[itemName] += 1;

    setSkinportAttribute(tradeOfferItemElement, "item-name", itemName);
    setSkinportAttribute(tradeOfferItemElement, "item-app-id", itemAppId);
  }

  const allTradeOfferItemNames = Object.keys(allTradeOfferItems);

  for (const tradeOfferItemElement of tradeOfferItemElements) {
    const itemName = getSkinportAttribute(tradeOfferItemElement, "item-name");

    const itemAppId = getSkinportAttribute(
      tradeOfferItemElement,
      "item-app-id",
    ) as Item["appId"];

    if (!itemName || !itemAppId) {
      continue;
    }

    const [itemSkinportPriceElement] = createWidgetElement(() => {
      const skinportItemPrices = useSkinportItemPrices(allTradeOfferItemNames);

      const skinportItemPrice = skinportItemPrices.data?.items[itemName];

      return (
        <div className="absolute left-1.5 bottom-0.5 z-10">
          <ItemSkinportPrice
            price={skinportItemPrice?.[1]}
            currency={skinportItemPrices.data?.currency}
            size="xs"
            priceTitle="none"
            linkItem={{
              name: itemName,
              appId: itemAppId,
            }}
          />
        </div>
      );
    });

    tradeOfferItemElement.append(itemSkinportPriceElement);
  }

  const tradeOfferPartyElements = $$(".tradeoffer .tradeoffer_items");

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
    const tradeOfferOppositePartyElement =
      tradeOfferPartyElement.parentElement?.children[
        tradeOfferPartyElement.classList.contains("primary") ? 3 : 1
      ];

    if (tradeOfferOppositePartyElement) {
      const [skinportItemsValueElement] = createWidgetElement(() => {
        const skinportItemPrices = useSkinportItemPrices(
          allTradeOfferItemNames,
        );

        const showValueDifferencePercentage =
          useShowValueDifferencePercentageStore();

        const render = (children: ReactNode) => (
          <div className="flex justify-end">
            <div
              className="flex gap-1 items-center group relative z-10 bg-background px-4 py-3 rounded-md"
              onMouseEnter={showValueDifferencePercentage.toggle}
              onMouseLeave={showValueDifferencePercentage.toggle}
            >
              {children}
            </div>
          </div>
        );

        if (!skinportItemPrices.data) {
          return render(<Skeleton className="w-28 h-3.5 my-[0.2rem]" />);
        }

        const getSkinportItemsValue = (items: string[]) => {
          let itemsValue = 0;

          if (skinportItemPrices.data) {
            for (const tradeOfferItem of items) {
              const skinportItemPrice =
                skinportItemPrices.data.items[tradeOfferItem];

              if (skinportItemPrice[1]) {
                itemsValue += skinportItemPrice[1];
              }
            }
          }

          return itemsValue;
        };

        const tradeOfferPartyItemsValue = getSkinportItemsValue(
          getSkinportAttributeItemNames(
            $$(".trade_item", tradeOfferPartyElement),
          ),
        );

        const tradeOfferOppositePartyItemsValue = getSkinportItemsValue(
          getSkinportAttributeItemNames(
            $$(".trade_item", tradeOfferOppositePartyElement),
          ),
        );

        const tradeOfferPartyItemsValueDifference =
          tradeOfferOppositePartyItemsValue - tradeOfferPartyItemsValue;

        const tradeOfferPartyItemsValueDifferencePercentage = (
          (tradeOfferPartyItemsValueDifference / tradeOfferPartyItemsValue) *
          100
        ).toFixed(2);

        const ChevronIcon =
          tradeOfferPartyItemsValueDifference > 0
            ? ChevronUpIcon
            : ChevronDownIcon;

        return render(
          <>
            <div>
              <span className="text-white font-semibold">
                {formatPrice(
                  tradeOfferPartyItemsValue,
                  skinportItemPrices.data.currency,
                )}
              </span>
            </div>
            {tradeOfferPartyItemsValueDifference !== 0 && (
              <div
                className={cn("flex items-center text-red-light", {
                  "text-green-light": tradeOfferPartyItemsValueDifference > 0,
                })}
              >
                <ChevronIcon size={20} />
                {showValueDifferencePercentage.enabled ? (
                  <>
                    {tradeOfferPartyItemsValueDifference > 0 && "+"}
                    {tradeOfferPartyItemsValueDifferencePercentage}%
                  </>
                ) : (
                  <>
                    {tradeOfferPartyItemsValueDifference > 0 && "+"}
                    {formatPrice(
                      tradeOfferPartyItemsValueDifference,
                      skinportItemPrices.data.currency,
                    )}
                  </>
                )}
              </div>
            )}
          </>,
        );
      });

      tradeOfferPartyElement.append(skinportItemsValueElement);
    }
  }

  for (const tradeOfferElement of $$(".tradeoffer")) {
    const tradeOfferFooterElement = $(".tradeoffer_footer", tradeOfferElement);

    if (tradeOfferFooterElement) {
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
}

featureManager.add(tradeOffersItemsInfo, {
  name: "trade-offers-items-info",
  matchPathname: /\/tradeoffers\/$/,
  awaitDomReady: true,
});
