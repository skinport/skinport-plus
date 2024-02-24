import { ParsedRgAsset, bridge } from ".";

function parseRgAsset(rgAsset: RgAsset, mSteamId: string) {
  const parsedRgAsset: ParsedRgAsset = {
    amount: rgAsset.amount,
    appid: rgAsset.description.appid,
    classid: rgAsset.description.classid,
    inspectIngameLink: rgAsset.description.actions?.find(({ link }) =>
      link.includes("+csgo_econ_action_preview"),
    )?.link,
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
  }
});
