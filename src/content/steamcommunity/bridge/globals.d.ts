type AppId = number;

type AssetId = string;

type ContextId = "2" | "6";

type ClassId = string;

declare type CPage = {
  m_bImagesLoaded: boolean;
  m_bPageItemsCreated: boolean;
  m_iPage: number;
  EnsurePageItemsCreated(): boolean;
};

type AssetMarketAction = { link: string; name: string };

declare type RgDescription = {
  actions?: AssetMarketAction[];
  appid: AppId;
  classid: ClassId;
  market_hash_name: string;
  marketable: 0 | 1;
  tradable: 0 | 1;
};

declare type RgAsset = {
  amount: string;
  appid: AppId;
  assetid: AssetId;
  classid: string;
  contextid: ContextId;
  description: RgDescription;
};

type RgInventory = {
  [assetId: AssetId]: {
    amount: string;
    appid: AppId;
    classid: string;
    contextid: ContextId;
    id: AssetId;
    market_actions?: AssetMarketAction[];
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
  appid: AppId;
  contextid: string;
  m_appid: AppId;
  m_bFullyLoaded: boolean;
  m_cItems: number;
  m_cPages: number;
  m_contextid: ContextId;
  m_iCurrentPage: number;
  m_rgAssets: RgAsset[];
  m_rgDescriptions: Record<string, RgDescription>;
  m_steamid: string;
  m_strCompositeID: string;
  m_rgPages: CPage[];
  pageCurrent?: number;
  pageList?: HTMLElement[];
  rgInventory?: RgInventory;
  owner: {
    strSteamId: string;
  };
  selectedItem: RgAsset;
  LoadCompleteInventory(): Promise<void>;
  PreloadPageImages(page: number): void;
};

declare type UserYou = {
  strSteamId: string;
  getInventory(appId: AppId, contextId: ContextId): CInventory;
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
    appid: AppId;
    assetid: string;
    contextid: ContextId;
  }[];
};

declare const g_rgCurrentTradeStatus: {
  me: TradeParty;
  them: TradeParty;
};

type AppContextData = {
  [appId: AppId]: {
    appid: AppId;
    asset_count: number;
    name: string;
    rgContexts: {
      [contextId: number]: {
        asset_count: number;
        id: string;
        inventory: null | {
          appid: AppId;
          contextid: ContextId;
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
