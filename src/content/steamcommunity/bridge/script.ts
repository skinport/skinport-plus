import { bridge } from ".";
import type { SteamItem } from "../lib/steam";

export function parseSteamItem({
  actions,
  appid,
  assetid,
  classid,
  contextid,
  market_hash_name,
  marketable,
  tags,
  tradable,
  strSteamId: ownerSteamId,
}: {
  actions?: { link: string; name: string }[];
  appid: number;
  assetid?: string;
  classid: string;
  contextid: "2" | "6";
  market_hash_name: string;
  marketable: 0 | 1;
  tags: {
    internal_name: string;
    name: string;
    category: string;
    category_name: string;
    color?: string;
  }[];
  tradable: 0 | 1;
  strSteamId: string;
}): SteamItem {
  const qualityTag = tags.find(({ category }) => category === "Quality");
  const rarityTag = tags.find(({ category }) => category === "Rarity");
  const assetId = assetid || null;

  return {
    appId: appid,
    assetId,
    classId: classid,
    contextId: contextid,
    exterior:
      tags.find(({ category }) => category === "Exterior")?.internal_name ||
      null,
    inspectIngameLink:
      (assetId &&
        ownerSteamId &&
        actions
          ?.find(({ link }) => link.indexOf("+csgo_econ_action_preview") !== -1)
          ?.link.replace("%assetid%", assetId)
          .replace("%owner_steamid%", ownerSteamId)) ||
      null,
    isMarketable: marketable === 1,
    isTradable: tradable === 1,
    isStatTrak: /^StatTrak™/.test(market_hash_name),
    isSouvenir: /^Souvenir/.test(market_hash_name),
    isOwner: ownerSteamId === g_steamID,
    marketHashName: market_hash_name,
    ownerSteamId: ownerSteamId,
    quality: qualityTag?.internal_name || null,
    qualityColor: qualityTag?.color ? `#${qualityTag.color}` : null,
    rarity: rarityTag?.internal_name || null,
    rarityColor: rarityTag?.color ? `#${rarityTag.color}` : null,
  };
}

window.addEventListener("message", async (event) => {
  if (event.source !== window) {
    return;
  }

  switch (event.data.type) {
    case bridge.wallet.getWalletCountryCode.requestType: {
      bridge.wallet.getWalletCountryCode.response({
        walletCountryCode: g_rgWalletInfo.wallet_country,
      });

      return;
    }
    case bridge.inventory.loadCompleteInventory.requestType: {
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

      return;
    }
    case bridge.inventory.getSelectedItem.requestType: {
      bridge.inventory.getSelectedItem.response(
        parseSteamItem({
          ...g_ActiveInventory.selectedItem,
          ...g_ActiveInventory.selectedItem.description,
          ...g_ActiveInventory.m_owner,
        }),
      );

      return;
    }
    case bridge.tradeOffer.getTradeItems.requestType: {
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
            ] = parseSteamItem({ ...inventoryAsset, ...inventory.owner });
          }
        }
      }

      bridge.tradeOffer.getTradeItems.response(tradeItems);

      return;
    }
    case bridge.tradeOffer.getItemsByAssetId.requestType: {
      const itemsByAssetId: Record<string, SteamItem> = {};

      if (!g_ActiveInventory.rgInventory) {
        throw new Error();
      }

      const { strSteamId } = g_ActiveInventory.m_owner;

      for (const assetId of event.data.assetIds) {
        const item = g_ActiveInventory.rgInventory[assetId];

        if (!item) {
          continue;
        }

        itemsByAssetId[assetId] = parseSteamItem({ strSteamId, ...item });
      }

      bridge.tradeOffer.getItemsByAssetId.response({ itemsByAssetId });

      return;
    }
  }
});
