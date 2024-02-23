declare type CPage = {
  m_bImagesLoaded: boolean;
  m_bPageItemsCreated: boolean;
  m_iPage: number;
  EnsurePageItemsCreated(): boolean;
};

declare type RgDescription = {
  actions?: { link: string; name: string }[];
  appid: number;
  classid: string;
  market_hash_name: string;
  marketable: 0 | 1;
  tradable: 0 | 1;
};

declare type RgAsset = {
  amount: string;
  appid: number;
  assetid: string;
  classid: string;
  contextid: string;
  description: RgDescription;
};

declare type CInventory = {
  appid: number;
  contextid: string;
  m_appid: number;
  m_bFullyLoaded: boolean;
  m_cItems: number;
  m_cPages: number;
  m_contextid: string;
  m_iCurrentPage: number;
  m_rgAssets: RgAsset[];
  m_rgDescriptions: Record<string, RgDescription>;
  m_steamid: string;
  m_strCompositeID: string;
  m_rgPages: CPage[];
  selectedItem: RgAsset;
  LoadCompleteInventory(): Promise<void>;
  PreloadPageImages(page: number): void;
};

declare type UserYou = {
  strSteamId: string;
  getInventory(appId: string, contextId: string): CInventory;
};

declare const g_ActiveInventory: CInventory;

declare const g_ActiveUser: UserYou;

declare const g_steamID: string;
