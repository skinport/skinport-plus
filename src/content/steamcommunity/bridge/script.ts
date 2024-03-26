import { bridge } from ".";
import type { SteamItem } from "../lib/steam";

function parseSteamItem({
  actions,
  appid,
  assetid,
  classid,
  contextid,
  market_hash_name,
  marketable,
  tags,
  tradable,
  ownerSteamId,
}: {
  actions?: { link: string; name: string }[];
  appid: number;
  assetid: string;
  classid: string;
  contextid: "2" | "6";
  market_hash_name: string;
  marketable: 0 | 1;
  tags?: {
    internal_name: string;
    name: string;
    category: string;
    category_name: string;
    color?: string;
  }[];
  tradable: 0 | 1;
  ownerSteamId?: string;
}): SteamItem {
  const qualityTag = tags?.find(({ category }) => category === "Quality");
  const rarityTag = tags?.find(({ category }) => category === "Rarity");
  const assetId = assetid;
  const marketHashName = market_hash_name;
  const exterior =
    marketHashName.match(
      /\(Battle-Scarred|Factory New|Field-Tested|Minimal Wear|Well-Worn\)$/,
    )?.[0] || null;

  let inspectIngameLink =
    actions
      ?.find(({ link }) => link.indexOf("+csgo_econ_action_preview") !== -1)
      ?.link.replace("%assetid%", assetId) || null;

  if (inspectIngameLink && ownerSteamId) {
    inspectIngameLink = inspectIngameLink.replace(
      "%owner_steamid%",
      ownerSteamId,
    );
  }

  return {
    appId: appid,
    assetId,
    classId: classid,
    contextId: contextid,
    exterior,
    inspectIngameLink,
    isMarketable: marketable === 1,
    isTradable: tradable === 1,
    isStatTrak: /^StatTrak™/.test(market_hash_name),
    isSouvenir: /^Souvenir/.test(market_hash_name),
    isOwner: ownerSteamId === g_steamID,
    marketHashName: market_hash_name,
    ownerSteamId: ownerSteamId || null,
    quality: qualityTag?.internal_name || null,
    qualityColor: qualityTag?.color ? `#${qualityTag.color}` : null,
    rarity: rarityTag?.internal_name || null,
    rarityColor: rarityTag?.color ? `#${rarityTag.color}` : null,
  };
}

window.addEventListener("message", (event) => {
  if (event.source !== window) {
    return;
  }

  const bridgeActions = {
    [bridge.wallet.getWalletCountryCode.requestType]: () => {
      bridge.wallet.getWalletCountryCode.response({
        walletCountryCode: g_rgWalletInfo.wallet_country,
      });
    },
    [bridge.inventory.loadCompleteInventory.requestType]: async () => {
      await g_ActiveInventory.LoadCompleteInventory();

      for (let i = 0; i < g_ActiveInventory.m_rgPages.length; i++) {
        g_ActiveInventory.m_rgPages[i].EnsurePageItemsCreated();
        g_ActiveInventory.PreloadPageImages(i);
      }

      const inventory: Record<string, SteamItem> = {};

      for (const rgAsset of Object.values(g_ActiveInventory.m_rgAssets)) {
        if (Object.hasOwn(rgAsset, "assetid"))
          inventory[
            `${rgAsset.appid}_${rgAsset.contextid}_${rgAsset.assetid}`
          ] = parseSteamItem({
            ...rgAsset,
            ...rgAsset.description,
            ...g_ActiveInventory.m_owner,
          });
      }

      bridge.inventory.loadCompleteInventory.response(inventory);
    },
    [bridge.inventory.getSelectedItem.requestType]: () => {
      bridge.inventory.getSelectedItem.response(
        parseSteamItem({
          ...g_ActiveInventory.selectedItem,
          ...g_ActiveInventory.selectedItem.description,
          ...g_ActiveInventory.m_owner,
        }),
      );
    },
    [bridge.tradeOffer.getTradeItems.requestType]: () => {
      const tradeItems: Parameters<
        typeof bridge.tradeOffer.getTradeItems.response
      >[0] = {};

      for (const [tradeStatus, appContextData] of [
        [g_rgCurrentTradeStatus.me, g_rgAppContextData],
        [g_rgCurrentTradeStatus.them, g_rgPartnerAppContextData],
      ] as const) {
        for (const tradeAsset of tradeStatus.assets) {
          const inventory =
            appContextData[tradeAsset.appid].rgContexts[tradeAsset.contextid]
              .inventory;

          if (!inventory) {
            continue;
          }

          const inventoryAsset = inventory?.rgInventory[tradeAsset.assetid];

          if (inventoryAsset) {
            tradeItems[
              `item${tradeAsset.appid}_${tradeAsset.contextid}_${tradeAsset.assetid}`
            ] = parseSteamItem({
              ...inventoryAsset,
              assetid: tradeAsset.assetid,
              ownerSteamId: inventory.owner.strSteamId,
            });
          }
        }
      }

      bridge.tradeOffer.getTradeItems.response(tradeItems);
    },
    [bridge.tradeOffer.getItemsByAssetId.requestType]: () => {
      const itemsByAssetId: Record<string, SteamItem> = {};

      if (!g_ActiveInventory.rgInventory) {
        throw new Error();
      }

      const { strSteamId } = g_ActiveInventory.m_owner;

      for (const assetId of event.data.assetIds as string[]) {
        const item = g_ActiveInventory.rgInventory[assetId];

        if (!item) {
          continue;
        }

        itemsByAssetId[assetId] = parseSteamItem({
          ...item,
          assetid: assetId,
          ownerSteamId: strSteamId,
        });
      }

      bridge.tradeOffer.getItemsByAssetId.response({ itemsByAssetId });
    },
    [bridge.market.getListingItem.requestType]: () => {
      const listingInfo = event.data.listingId
        ? g_rgListingInfo?.[event.data.listingId]
        : Object.values(g_rgListingInfo)[0];

      if (!listingInfo) {
        return;
      }

      const item =
        g_rgAssets?.[listingInfo.asset.appid]?.[listingInfo.asset.contextid]?.[
          listingInfo.asset.id
        ];

      if (!item) {
        return;
      }

      bridge.market.getListingItem.response(
        parseSteamItem({ ...item, assetid: item.id }),
      );
    },
  };

  const bridgeAction = bridgeActions[event.data.type];

  if (bridgeAction) {
    bridgeAction();
  }
});
