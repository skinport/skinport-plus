export type SteamAppId =
  | 730 // cs2
  | 440 // tf2
  | 570 // dota2
  | 252490; // rust

export type SteamItem = {
  appId: number;
  assetId: string | null;
  classId: string;
  contextId: "2" | "6";
  exterior: string | null;
  inspectIngameLink: string | null;
  isMarketable: boolean;
  isTradable: boolean;
  isStatTrak: boolean;
  isSouvenir: boolean;
  isOwner: boolean;
  marketHashName: string;
  ownerSteamId: string | null;
  quality: string | null;
  qualityColor: string | null;
  rarity: string | null;
  rarityColor: string | null;
};
