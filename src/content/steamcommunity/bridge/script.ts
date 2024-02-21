import { bridge } from ".";

window.addEventListener("message", async (event) => {
  if (event.source !== window) {
    return;
  }

  switch (event.data.type) {
    case bridge.inventoryLoadCompleteInventory.requestType: {
      await g_ActiveInventory.LoadCompleteInventory();

      for (let i = 0; i < g_ActiveInventory.m_rgPages.length; i++) {
        g_ActiveInventory.m_rgPages[i].EnsurePageItemsCreated();
        g_ActiveInventory.PreloadPageImages(i);
      }

      const itemsByAssetId: Record<string, RgDescription> = {};

      for (const asset of Object.values(g_ActiveInventory.m_rgAssets)) {
        if (Object.hasOwn(asset, "assetid"))
          itemsByAssetId[asset.assetid] = {
            appid: asset.description.appid,
            classid: asset.description.classid,
            market_hash_name: asset.description.market_hash_name,
            marketable: asset.description.marketable,
            tradable: asset.description.tradable,
          };
      }

      bridge.inventoryLoadCompleteInventory.response({
        itemsByAssetId,
      });

      break;
    }
    default:
  }
});
