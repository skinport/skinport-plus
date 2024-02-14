import { InterpolateMessage } from "@/components/interpolate-message";
import { ItemSkinportPrice } from "@/components/item-skinport-price";
import { SkinportPlusLogo } from "@/components/skinport-plus-logo";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Feature, featureManager } from "@/content/feature-manager";
import { createWidgetElement } from "@/content/widget";
import { formatPrice } from "@/lib/format";
import { getI18nMessage } from "@/lib/i18n";
import {
  createUseSkinportItemPrices,
  selectSkinportItemPrice,
} from "@/lib/skinport";
import { Item, parseSteamItem } from "@/lib/steam";
import { cn } from "@/lib/utils";
import ky from "ky";
import { AlertCircleIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { ReactNode, useEffect, useState } from "react";
import { $, $$ } from "select-dom";
import { StoreApi, UseBoundStore, create } from "zustand";

async function getAllTradeOfferItems(tradeOfferItemElements: HTMLElement[]) {
  const itemInfoRequests = new Map<HTMLElement, Promise<string>>();

  for (const tradeOfferItemElement of tradeOfferItemElements) {
    const dataEconomyItemValue =
      tradeOfferItemElement.getAttribute("data-economy-item");

    if (!dataEconomyItemValue) {
      continue;
    }

    itemInfoRequests.set(
      tradeOfferItemElement,
      ky(
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
      ).text(),
    );
  }

  await Promise.all(itemInfoRequests.values());

  const items = new Map<HTMLElement, Item>();

  for (const [tradeOfferItemElement, itemInfoRequest] of itemInfoRequests) {
    const itemInfoMatches = (await itemInfoRequest).match(
      /"market_hash_name\":"([^"]+)".*"appid":"(\d+)"/,
    );

    if (!itemInfoMatches) {
      continue;
    }

    const item = parseSteamItem(
      JSON.parse(`"${itemInfoMatches[1]}"`),
      itemInfoMatches[2],
    );

    if (!item) {
      continue;
    }

    items.set(tradeOfferItemElement, item);
  }

  return items;
}

const tradeOffersItemsInfo: Feature = async ({ extensionOptions }) => {
  const allTradeOfferItemElements = $$(".tradeoffer .trade_item");

  const allTradeOfferItemRequests = getAllTradeOfferItems(
    allTradeOfferItemElements,
  );

  const useSkinportItemPrices = createUseSkinportItemPrices(async () =>
    Array.from((await allTradeOfferItemRequests).values()).map(
      ({ name }) => name,
    ),
  );

  // Add trade offer item values
  if (extensionOptions.steamCommunityTradeOffersShowItemPrices) {
    for (const tradeOfferItemElement of allTradeOfferItemElements) {
      const [itemSkinportPriceElement] = createWidgetElement(() => {
        const [tradeOfferItem, setTradeOfferItem] = useState<Item>();

        const skinportItemPrices = useSkinportItemPrices();

        const skinportItemPrice = selectSkinportItemPrice(
          skinportItemPrices,
          tradeOfferItem?.name,
        );

        useEffect(() => {
          const getTradeOfferItem = async () => {
            setTradeOfferItem(
              (await allTradeOfferItemRequests).get(tradeOfferItemElement),
            );
          };

          getTradeOfferItem();
        }, []);

        useEffect(() => {
          if (skinportItemPrice?.price?.[2]) {
            tradeOfferItemElement.style.borderColor = "#1d1d1d";
            tradeOfferItemElement.style.borderTopColor =
              skinportItemPrice.price[2];
            tradeOfferItemElement.style.borderTopWidth = "2px";
          }
        }, [skinportItemPrice?.price]);

        return (
          <>
            <div className="absolute left-1.5 bottom-0.5 z-10">
              {tradeOfferItem?.isStatTrak && (
                <div className="text-2xs text-stattrak font-bold">ST</div>
              )}
              {tradeOfferItem?.isSouvenir && (
                <div className="text-2xs text-souvenir font-bold">S</div>
              )}
              <ItemSkinportPrice
                price={skinportItemPrice?.price?.[1]}
                currency={skinportItemPrice?.currency}
                size="xs"
                priceTitle="none"
                linkItem={tradeOfferItem}
                loadingFailed={skinportItemPrice?.isError}
              />
            </div>
          </>
        );
      });

      tradeOfferItemElement.append(itemSkinportPriceElement);
    }
  }

  // Add trade offer total values
  if (extensionOptions.steamCommunityTradeOffersShowTotalTradeValues) {
    type UseShowTradeOffersValuePercentage = {
      enabled: boolean;
      toggle: () => void;
    };

    const useShowTradeOffersValuePercentage = new Map<
      HTMLElement,
      UseBoundStore<StoreApi<UseShowTradeOffersValuePercentage>>
    >();

    for (const tradeOfferElement of $$(".tradeoffer .tradeoffer_items_ctn")) {
      useShowTradeOffersValuePercentage.set(
        tradeOfferElement,
        create((set) => ({
          enabled: false,
          toggle: () =>
            set((state) => ({
              enabled: !state.enabled,
            })),
        })),
      );
    }

    for (const tradeOfferCurrentPartyElement of $$(
      ".tradeoffer .tradeoffer_items",
    )) {
      const tradeOfferPartyParentElement =
        tradeOfferCurrentPartyElement.parentElement;

      const tradeOfferOtherPartyElement =
        tradeOfferPartyParentElement?.children[
          tradeOfferCurrentPartyElement.classList.contains("primary") ? 3 : 1
        ];

      if (!tradeOfferPartyParentElement || !tradeOfferOtherPartyElement) {
        return;
      }

      const useShowTradeOfferValuePercentage =
        useShowTradeOffersValuePercentage.get(
          tradeOfferCurrentPartyElement.parentElement,
        );

      if (!useShowTradeOfferValuePercentage) {
        return;
      }

      const [skinportItemsValueElement] = createWidgetElement(() => {
        const [tradeOfferPartyItems, setTradeOfferPartyItems] = useState<{
          current: Item[];
          other: Item[];
        }>();

        const skinportItemPrices = useSkinportItemPrices();

        const showValueDifferencePercentage =
          useShowTradeOfferValuePercentage();

        useEffect(() => {
          const initTradeOfferItems = async () => {
            const allTradeOfferItems = await allTradeOfferItemRequests;

            const getTradeOfferPartyItems = (
              tradeOfferPartyElement: Element,
            ) => {
              const tradeOfferPartyItems: Item[] = [];

              const tradeOfferPartyItemElements = $$(
                ".trade_item",
                tradeOfferPartyElement,
              );

              for (const tradeOfferPartyItemElement of tradeOfferPartyItemElements) {
                const tradeOfferItem = allTradeOfferItems.get(
                  tradeOfferPartyItemElement,
                );

                if (tradeOfferItem) {
                  tradeOfferPartyItems.push(tradeOfferItem);
                }
              }

              return tradeOfferPartyItems;
            };

            setTradeOfferPartyItems({
              current: getTradeOfferPartyItems(tradeOfferCurrentPartyElement),
              other: getTradeOfferPartyItems(tradeOfferOtherPartyElement),
            });
          };

          initTradeOfferItems();
        }, []);

        const render = (children: ReactNode) => (
          <div className="flex justify-end">
            <div
              className={cn(
                "flex items-center group relative z-10 bg-background px-4 py-3 rounded-md",
                {
                  "gap-1": !skinportItemPrices.error,
                  "gap-1.5": skinportItemPrices.error,
                },
              )}
              onMouseEnter={showValueDifferencePercentage.toggle}
              onMouseLeave={showValueDifferencePercentage.toggle}
            >
              {children}
            </div>
          </div>
        );

        if (!tradeOfferPartyItems?.current.length) {
          return;
        }

        if (skinportItemPrices.error) {
          return render(
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertCircleIcon className="text-red-light" size={16} />
              </TooltipTrigger>
              <TooltipContent>
                {getI18nMessage("common_failedLoadingItemPrices")}
              </TooltipContent>
            </Tooltip>,
          );
        }

        if (!skinportItemPrices.data) {
          return render(<Skeleton className="w-28 h-3.5 my-[0.2rem]" />);
        }

        const calculateItemsValue = (tradeOfferItems?: Item[]) => {
          let itemsValue = 0;

          if (tradeOfferItems) {
            for (const tradeOfferItem of tradeOfferItems) {
              const skinportItemPrice = selectSkinportItemPrice(
                skinportItemPrices,
                tradeOfferItem.name,
              );

              if (skinportItemPrice?.price?.[1]) {
                itemsValue += skinportItemPrice.price[1];
              }
            }
          }

          return itemsValue;
        };

        const tradeOfferCurrentPartyItemsValue = calculateItemsValue(
          tradeOfferPartyItems?.current,
        );

        const tradeOfferOtherPartyItemsValue = calculateItemsValue(
          tradeOfferPartyItems?.other,
        );

        const tradeOfferPartyItemsValueDifference =
          tradeOfferOtherPartyItemsValue - tradeOfferCurrentPartyItemsValue;

        const tradeOfferPartyItemsValueDifferencePercentage = (
          (tradeOfferPartyItemsValueDifference /
            tradeOfferCurrentPartyItemsValue) *
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
                  tradeOfferCurrentPartyItemsValue,
                  skinportItemPrices.data.currency,
                )}
              </span>
            </div>
            {tradeOfferOtherPartyItemsValue !== 0 &&
              tradeOfferPartyItemsValueDifference !== 0 && (
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

      tradeOfferCurrentPartyElement.append(skinportItemsValueElement);
    }
  }

  // Add `Pricing by Skinport+` in trade offer footer
  if (
    extensionOptions.steamCommunityTradeOffersShowItemPrices ||
    extensionOptions.steamCommunityTradeOffersShowTotalTradeValues
  ) {
    for (const tradeOfferElement of $$(".tradeoffer")) {
      const tradeOfferFooterElement = $(
        ".tradeoffer_footer",
        tradeOfferElement,
      );

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

        if (tradeOfferFooterElement.childNodes.length === 5) {
          tradeOfferFooterElement.insertBefore(
            pricingBySkinportPlusElement,
            tradeOfferFooterElement.childNodes[2],
          );
        } else {
          tradeOfferFooterElement.append(pricingBySkinportPlusElement);
        }

        $("div[style='clear: right;']", tradeOfferFooterElement)?.remove();
      }
    }
  }
};

featureManager.add(tradeOffersItemsInfo, {
  name: "trade-offers-items-info",
  matchPathname: /\/tradeoffers\/(sent\/)?$/,
  awaitDomReady: true,
});
