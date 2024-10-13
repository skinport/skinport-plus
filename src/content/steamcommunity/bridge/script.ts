import {
  type SteamItem,
  type SteamItemAppId,
  type SteamItemAssetId,
  type SteamItemClassId,
  type SteamItemContextId,
  parseSteamItem,
} from "@/lib/steam";
import { steamCommunity } from "@/lib/steamCommunity";

declare type CPage = {
  m_bImagesLoaded: boolean;
  m_bPageItemsCreated: boolean;
  m_iPage: number;
  EnsurePageItemsCreated(): boolean;
};

type MarketAction = { link: string; name: string };

type Tag = {
  internal_name: string;
  name: string;
  category: string;
  category_name: string;
  color?: string;
};

declare type RgDescription = {
  actions?: MarketAction[];
  appid: SteamItemAppId;
  classid: SteamItemClassId;
  descriptions: { type: "html"; value: string }[];
  market_hash_name: string;
  marketable: 0 | 1;
  tradable: 0 | 1;
  tags: Tag[];
};

declare type RgAsset = {
  amount: string;
  appid: SteamItemAppId;
  assetid: SteamItemAssetId;
  classid: string;
  contextid: SteamItemContextId;
  description: RgDescription;
};

type RgInventory = {
  [assetId: SteamItemAssetId]: {
    actions?: MarketAction[];
    amount: string;
    appid: SteamItemAppId;
    classid: string;
    contextid: SteamItemContextId;
    id: SteamItemAssetId;
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
  };
};

declare type CInventory = {
  appid: SteamItemAppId;
  contextid: string;
  m_appid: SteamItemAppId;
  m_bFullyLoaded: boolean;
  m_cItems: number;
  m_cPages: number;
  m_contextid: SteamItemContextId;
  m_iCurrentPage: number;
  m_rgAssets: RgAsset[];
  m_rgDescriptions: Record<string, RgDescription>;
  m_steamid: string;
  m_strCompositeID: string;
  m_rgPages: CPage[];
  pageCurrent?: number;
  pageList?: HTMLElement[];
  rgInventory?: RgInventory;
  m_owner?: {
    strSteamId: string;
  };
  owner?: {
    strSteamId: string;
  };
  selectedItem: RgAsset;
  LoadCompleteInventory(): Promise<void>;
  PreloadPageImages(page: number): void;
};

declare type UserYou = {
  strSteamId: string;
  getInventory(
    appId: SteamItemAppId,
    contextId: SteamItemContextId,
  ): CInventory;
};

declare const g_ActiveInventory: CInventory;

declare const g_ActiveUser: UserYou;

declare const g_steamID: string;

declare const g_rgWalletInfo: {
  wallet_country: string;
};

type TradeParty = {
  assets: {
    amount: string;
    appid: SteamItemAppId;
    assetid: string;
    contextid: SteamItemContextId;
  }[];
};

declare const g_rgCurrentTradeStatus: {
  me: TradeParty;
  them: TradeParty;
};

type AppContextData = {
  [appId: SteamItemAppId]: {
    appid: SteamItemAppId;
    asset_count: number;
    name: string;
    rgContexts: {
      [contextId: number]: {
        asset_count: number;
        id: string;
        inventory: null | {
          appid: SteamItemAppId;
          contextid: SteamItemContextId;
          initialized: boolean;
          owner: {
            strSteamId: string;
          };
          rgInventory: RgInventory;
        };
        name: "Backpack";
      };
    };
  };
};

declare const g_rgAppContextData: AppContextData;

declare const g_rgPartnerAppContextData: AppContextData;

declare const g_rgAssets: Partial<{
  [appId: string]: Partial<{
    [contextId: string]: Partial<{
      [assetId: string]: {
        actions: MarketAction[];
        amount: number;
        appid: SteamItemAppId;
        classid: string;
        contextid: SteamItemContextId;
        id: string;
        market_hash_name: string;
        marketable: 0 | 1;
        tradable: 0 | 1;
      };
    }>;
  }>;
}>;

declare const g_rgListingInfo: Partial<{
  [listingId: string]: {
    asset: {
      amount: string;
      appid: SteamItemAppId;
      contextid: SteamItemContextId;
      currency: number;
      id: string;
      market_actions: MarketAction[];
    };
    listingid: string;
  };
}>;

const user_steamid = g_steamID;

const bridgeActionHandlers = {
  [steamCommunity.wallet.getWallet.requestType]: () => {
    steamCommunity.wallet.getWallet.response({
      countryCode: g_rgWalletInfo.wallet_country,
    });
  },
  [steamCommunity.inventory.loadCompleteInventory.requestType]: async () => {
    await g_ActiveInventory.LoadCompleteInventory();

    for (let i = 0; i < g_ActiveInventory.m_rgPages.length; i++) {
      g_ActiveInventory.m_rgPages[i].EnsurePageItemsCreated();
      g_ActiveInventory.PreloadPageImages(i);
    }

    const inventory: Record<string, SteamItem> = {};

    for (const rgAsset of Object.values(g_ActiveInventory.m_rgAssets)) {
      if (Object.hasOwn(rgAsset, "assetid"))
        inventory[`${rgAsset.appid}_${rgAsset.contextid}_${rgAsset.assetid}`] =
          parseSteamItem({
            ...rgAsset,
            ...rgAsset.description,
            owner_steamid: g_ActiveInventory.m_owner?.strSteamId,
            user_steamid,
          });
    }

    steamCommunity.inventory.loadCompleteInventory.response(inventory);
  },
  [steamCommunity.inventory.getSelectedItem.requestType]: () => {
    steamCommunity.inventory.getSelectedItem.response(
      parseSteamItem({
        ...g_ActiveInventory.selectedItem,
        ...g_ActiveInventory.selectedItem.description,
        owner_steamid: g_ActiveInventory.m_owner?.strSteamId,
        user_steamid,
      }),
    );
  },
  [steamCommunity.tradeOffer.getTradeItems.requestType]: () => {
    const tradeItems: Parameters<
      typeof steamCommunity.tradeOffer.getTradeItems.response
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
            owner_steamid: inventory.owner.strSteamId,
            user_steamid,
          });
        }
      }
    }

    steamCommunity.tradeOffer.getTradeItems.response(tradeItems);
  },
  [steamCommunity.tradeOffer.getItemsByAssetId.requestType]: (
    requestData: Parameters<
      typeof steamCommunity.tradeOffer.getItemsByAssetId
    >[0],
  ) => {
    const itemsByAssetId: Record<string, SteamItem> = {};

    if (!g_ActiveInventory.rgInventory) {
      throw new Error();
    }

    for (const assetId of requestData.assetIds as string[]) {
      const item = g_ActiveInventory.rgInventory[assetId];

      if (!item) {
        continue;
      }

      itemsByAssetId[assetId] = parseSteamItem({
        ...item,
        assetid: assetId,
        owner_steamid: g_ActiveInventory.owner?.strSteamId,
        user_steamid,
      });
    }

    steamCommunity.tradeOffer.getItemsByAssetId.response({ itemsByAssetId });
  },
  [steamCommunity.market.getListingItem.requestType]: (
    requestData: Parameters<typeof steamCommunity.market.getListingItem>[0],
  ) => {
    const listingInfo = requestData.listingId
      ? g_rgListingInfo?.[requestData.listingId]
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

    steamCommunity.market.getListingItem.response(
      parseSteamItem({ ...item, assetid: item.id }),
    );
  },
};

window.addEventListener("message", (event) => {
  if (event.source !== window || !event.data.type) {
    return;
  }

  const { type: actionType, ...requestData } = event.data;

  const bridgeActionHandler = bridgeActionHandlers[actionType];

  if (bridgeActionHandler) {
    bridgeActionHandler(requestData);
  }
});
