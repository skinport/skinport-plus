import { ParsedRgAsset, bridge } from ".";
import { SteamItem, parseSteamItem } from "../lib/steam";

function parseRgAsset(rgAsset: RgAsset, mSteamId: string) {
  const assetid = rgAsset.assetid;

  const parsedRgAsset: ParsedRgAsset = {
    amount: rgAsset.amount,
    appid: rgAsset.description.appid,
    assetid,
    classid: rgAsset.description.classid,
    inspectIngameLink: rgAsset.description.actions
      ?.find(({ link }) => link.includes("+csgo_econ_action_preview"))
      ?.link.replace("%assetid%", assetid)
      .replace("%owner_steamid%", mSteamId),
    marketHashName: rgAsset.description.market_hash_name,
    marketable: rgAsset.description.marketable,
    tradable: rgAsset.description.tradable,
    isUserOwner: mSteamId === g_steamID,
  };

  return parsedRgAsset;
}

window.addEventListener("message", async (event) => {
  if (event.source !== window) {
    return;
  }

  switch (event.data.type) {
    case bridge.inventory.loadCompleteInventory.requestType: {
      await g_ActiveInventory.LoadCompleteInventory();

      for (let i = 0; i < g_ActiveInventory.m_rgPages.length; i++) {
        g_ActiveInventory.m_rgPages[i].EnsurePageItemsCreated();
        g_ActiveInventory.PreloadPageImages(i);
      }

      const itemsByAssetId: Record<string, ParsedRgAsset> = {};

      for (const rgAsset of Object.values(g_ActiveInventory.m_rgAssets)) {
        if (Object.hasOwn(rgAsset, "assetid"))
          itemsByAssetId[rgAsset.assetid] = parseRgAsset(
            rgAsset,
            g_ActiveInventory.m_steamid,
          );
      }

      bridge.inventory.loadCompleteInventory.response({
        itemsByAssetId,
      });

      break;
    }
    case bridge.inventory.getSelectedItem.requestType: {
      bridge.inventory.getSelectedItem.response(
        parseRgAsset(
          g_ActiveInventory.selectedItem,
          g_ActiveInventory.m_steamid,
        ),
      );

      break;
    }
    case bridge.wallet.getWalletCountryCode.requestType: {
      bridge.wallet.getWalletCountryCode.response({
        walletCountryCode: g_rgWalletInfo.wallet_country,
      });

      break;
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
            ] = parseSteamItem(inventoryAsset, inventory.owner);
          }
        }
      }

      bridge.tradeOffer.getTradeItems.response(tradeItems);

      break;
    }
    case bridge.tradeOffer.getItemsByAssetId.requestType: {
      const itemsByAssetId: Record<string, SteamItem> = {};

      if (!g_ActiveInventory.rgInventory) {
        throw new Error();
      }

      for (const assetId of event.data.assetIds) {
        const item = g_ActiveInventory.rgInventory[assetId];

        if (!item) {
          continue;
        }

        itemsByAssetId[assetId] = parseSteamItem(item, g_ActiveInventory.owner);
      }

      bridge.tradeOffer.getItemsByAssetId.response({ itemsByAssetId });

      break;
    }
  }
});
