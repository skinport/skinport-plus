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
import { getIsSupportedSteamAppId } from "@/lib/steam";
import { cn } from "@/lib/utils";
import elementReady from "element-ready";
import { AlertCircleIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { ReactNode } from "react";
import { $, $$ } from "select-dom";
import { create } from "zustand";
import { bridge } from "../bridge";
import { ItemInfo } from "../components/item-info";
import { PricingBySkinportPlus } from "../components/pricing-by-skinport-plus";
import { SteamItem } from "../lib/steam";

const tradeOfferItemsInfo: Feature = async ({
  setFeatureAttribute,
  createNotMatchingFeatureAttributeSelector,
  extensionOptions,
}) => {
  const handleInventoryItems = async () => {
    if (!extensionOptions.steamCommunityTradeOffersShowItemPrices) {
      return;
    }

    const inventoriesElement = $("#inventories");

    if (!inventoriesElement) {
      return;
    }

    new MutationObserver(async () => {
      const itemElements = $$(
        createNotMatchingFeatureAttributeSelector(
          "#inventories .inventory_ctn:not([style*='display: none;']) .inventory_page:not([style*='display: none;']) .itemHolder:not(.disabled):not([style*='display: none;']) .item",
        ),
      );

      if (!itemElements.length) {
        return;
      }

      const itemElementsByAssetId: { [assetId: string]: HTMLElement } = {};

      for (const itemElement of itemElements) {
        setFeatureAttribute(itemElement);

        const itemAssetId = itemElement.getAttribute("id")?.split("_")[2];

        if (!itemAssetId) {
          continue;
        }

        itemElementsByAssetId[itemAssetId] = itemElement;
      }

      const { itemsByAssetId } = await bridge.tradeOffer.getItemsByAssetId({
        assetIds: Object.keys(itemElementsByAssetId),
      });

      const useSkinportItemPrices = createUseSkinportItemPrices(() => {
        const itemNames = new Set<string>();

        for (const { appId, marketHashName } of Object.values(itemsByAssetId)) {
          if (getIsSupportedSteamAppId(String(appId))) {
            itemNames.add(marketHashName);
          }
        }

        return itemNames;
      });

      for (const [itemAssetId, itemElement] of Object.entries(
        itemElementsByAssetId,
      )) {
        const item = itemsByAssetId[itemAssetId];

        if (!item) {
          continue;
        }

        const [itemInfoWidget] = createWidgetElement(() => {
          const skinportItemPrice = selectSkinportItemPrice(
            useSkinportItemPrices(),
            item.marketHashName,
          );

          return (
            <ItemInfo
              item={item}
              itemElement={itemElement}
              skinportPrice={skinportItemPrice}
            />
          );
        });

        itemElement.append(itemInfoWidget);
      }
    }).observe(inventoriesElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style"],
    });
  };

  const handleTradeOfferItems = async () => {
    if (
      !extensionOptions.steamCommunityTradeOffersShowItemPrices &&
      !extensionOptions.steamCommunityTradeOffersShowTotalTradeValues
    ) {
      return;
    }

    const tradeSlotElements = $$(".trade_offer .trade_slot.has_item");

    const tradeItemElements = await Promise.all(
      tradeSlotElements.map(async (tradeSlotElement) => {
        const tradeItemElement = await elementReady(".item:not(.unknownItem)", {
          target: tradeSlotElement,
          stopOnDomReady: false,
          timeout: 30000,
        });

        if (!tradeItemElement) {
          throw Error();
        }

        return tradeItemElement;
      }),
    );

    const tradeItems = await bridge.tradeOffer.getTradeItems();

    const useSkinportItemPrices = createUseSkinportItemPrices(() => {
      const itemNames = new Set<string>();

      for (const { appId, marketHashName } of Object.values(tradeItems)) {
        if (getIsSupportedSteamAppId(String(appId))) {
          itemNames.add(marketHashName);
        }
      }

      return itemNames;
    });

    const tradeParties = ["trade_yours", "trade_theirs"] as const;

    const tradeItemsByParty: Record<
      (typeof tradeParties)[number],
      SteamItem[]
    > = {
      trade_yours: [],
      trade_theirs: [],
    };

    for (const tradeItemElement of tradeItemElements) {
      const tradeItemElementId = tradeItemElement.getAttribute("id");

      if (!tradeItemElementId) {
        continue;
      }

      const tradeItem = tradeItems[tradeItemElementId];

      if (!tradeItem) {
        continue;
      }

      const tradeOfferParty = tradeItemElement.parentElement?.parentElement
        ?.getAttribute("id")
        ?.split("_")[0];

      if (tradeOfferParty) {
        tradeItemsByParty[`trade_${tradeOfferParty as "your" | "their"}s`].push(
          tradeItem,
        );
      }

      if (extensionOptions.steamCommunityTradeOffersShowItemPrices) {
        const [tradeItemInfoElement] = createWidgetElement(() => {
          const skinportItemPrices = useSkinportItemPrices();

          const skinportItemPrice = selectSkinportItemPrice(
            skinportItemPrices,
            tradeItem.marketHashName,
          );

          return (
            <ItemInfo
              item={tradeItem}
              itemElement={tradeItemElement}
              skinportPrice={skinportItemPrice}
            />
          );
        });

        tradeItemElement.append(tradeItemInfoElement);
      }
    }

    if (!extensionOptions.steamCommunityTradeOffersShowTotalTradeValues) {
      return;
    }

    const useShowTradeOfferValuePercentage = create<{
      enabled: boolean;
      toggle: () => void;
    }>((set) => ({
      enabled: false,
      toggle: () =>
        set((state) => ({
          enabled: !state.enabled,
        })),
    }));

    for (const tradeParty of tradeParties) {
      const tradePartyItemBoxElement = $(`#${tradeParty} .trade_item_box`);

      if (!tradePartyItemBoxElement) {
        continue;
      }

      const [tradeOfferValueElement] = createWidgetElement(() => {
        const skinportItemPrices = useSkinportItemPrices();

        const showTradeOfferValuePercentage =
          useShowTradeOfferValuePercentage();

        if (!tradeItemsByParty[tradeParty].length) {
          return;
        }

        const render = (children: ReactNode) => (
          <div className="flex justify-end mb-4">
            <div
              className={cn(
                "flex items-center group relative z-10 bg-background px-4 py-3 rounded-md",
                {
                  "gap-1": !skinportItemPrices.error,
                  "gap-1.5": skinportItemPrices.error,
                },
              )}
              onMouseEnter={showTradeOfferValuePercentage.toggle}
              onMouseLeave={showTradeOfferValuePercentage.toggle}
            >
              {children}
            </div>
          </div>
        );

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

        const calculateTradeItemsValue = (tradeItems?: SteamItem[]) => {
          let itemsValue = 0;

          if (tradeItems) {
            for (const tradeOfferItem of tradeItems) {
              const skinportItemPrice = selectSkinportItemPrice(
                skinportItemPrices,
                tradeOfferItem.marketHashName,
              );

              if (skinportItemPrice?.price?.[1]) {
                itemsValue += skinportItemPrice.price[1];
              }
            }
          }

          return itemsValue;
        };

        const currentPartyItemsValue = calculateTradeItemsValue(
          tradeItemsByParty[tradeParty],
        );

        const otherPartyItemsValue = calculateTradeItemsValue(
          tradeItemsByParty[
            tradeParty === tradeParties[0] ? tradeParties[1] : tradeParties[0]
          ],
        );

        const itemsValueDifference =
          otherPartyItemsValue - currentPartyItemsValue;

        const itemsValueDifferencePercentage = (
          (itemsValueDifference / currentPartyItemsValue) *
          100
        ).toFixed(2);

        const ChevronIcon =
          itemsValueDifference > 0 ? ChevronUpIcon : ChevronDownIcon;

        return render(
          <>
            <div>
              <span className="text-white font-semibold">
                {formatPrice(
                  currentPartyItemsValue,
                  skinportItemPrices.data.currency,
                )}
              </span>
            </div>
            {otherPartyItemsValue !== 0 && itemsValueDifference !== 0 && (
              <div
                className={cn("flex items-center text-red-light", {
                  "text-green-light": itemsValueDifference > 0,
                })}
              >
                <ChevronIcon size={20} />
                {showTradeOfferValuePercentage.enabled ? (
                  <>
                    {itemsValueDifference > 0 && "+"}
                    {itemsValueDifferencePercentage}%
                  </>
                ) : (
                  <>
                    {itemsValueDifference > 0 && "+"}
                    {formatPrice(
                      itemsValueDifference,
                      skinportItemPrices.data.currency,
                    )}
                  </>
                )}
              </div>
            )}
          </>,
        );
      });

      tradePartyItemBoxElement.insertAdjacentElement(
        "afterend",
        tradeOfferValueElement,
      );
    }
  };

  const addPricingBySkinportPlus = async () => {
    if (
      extensionOptions.steamCommunityTradeOffersShowItemPrices ||
      extensionOptions.steamCommunityTradeOffersShowTotalTradeValues
    ) {
      const inventoryBoxElement = $("#inventory_box .trade_box_contents");

      if (!inventoryBoxElement) {
        return;
      }

      const [pricingBySkinportPlusElement] = createWidgetElement(() => (
        <div className="flex justify-center">
          <PricingBySkinportPlus />
        </div>
      ));

      inventoryBoxElement.append(pricingBySkinportPlusElement);
    }
  };

  handleInventoryItems();
  handleTradeOfferItems();
  addPricingBySkinportPlus();
};

featureManager.add(tradeOfferItemsInfo, {
  name: "trade-offer-items-info",
  matchPathname: /^\/tradeoffer\/(?:new|\d+)\/$/,
  useBridge: true,
});
