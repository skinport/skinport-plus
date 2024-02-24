export interface SteamItem {
  appId: number;
  assetId: string | null;
  classId: string;
  contextId: "2" | "6";
  exterior: string | null;
  inspectIngameLink: string | null;
  isMarketable: boolean;
  isTradable: boolean;
  marketHashName: string;
  ownerSteamId: string;
  quality: string | null;
  qualityColor: string | null;
  rarity: string | null;
  rarityColor: string | null;
}

export function parseSteamItem(
  {
    appid,
    assetid,
    classid,
    contextid,
    market_actions,
    market_hash_name,
    marketable,
    tags,
    tradable,
  }: {
    appid: number;
    assetid?: string;
    classid: string;
    contextid: "2" | "6";
    market_actions?: { link: string; name: string }[];
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
  },
  owner: {
    strSteamId: string;
  },
): SteamItem {
  const qualityTag = tags.find(({ category }) => category === "Quality");
  const rarityTag = tags.find(({ category }) => category === "Rarity");

  return {
    appId: appid,
    assetId: assetid || null,
    classId: classid,
    contextId: contextid,
    exterior:
      tags.find(({ category }) => category === "Exterior")?.internal_name ||
      null,
    inspectIngameLink:
      market_actions?.find(({ name }) => name === "+csgo_econ_action_preview")
        ?.link || null,
    isMarketable: marketable === 1,
    isTradable: tradable === 1,
    marketHashName: market_hash_name,
    ownerSteamId: owner.strSteamId,
    quality: qualityTag?.internal_name || null,
    qualityColor: qualityTag?.color ? `#${qualityTag.color}` : null,
    rarity: rarityTag?.internal_name || null,
    rarityColor: rarityTag?.color ? `#${rarityTag.color}` : null,
  };
}
