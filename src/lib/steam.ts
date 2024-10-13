import ky from "ky";
import pMemoize from "p-memoize";
import { $$ } from "select-dom";
import { countryCurrencies } from "./country-currencies";

export const steamItemExterior = [
  "Battle-Scarred",
  "Factory New",
  "Field-Tested",
  "Minimal Wear",
  "Well-Worn",
] as const;

const steamItemMarketHashNameExteriorRegExp = new RegExp(
  `(${steamItemExterior.join("|")}$)`,
);

export type SteamItemExterior = (typeof steamItemExterior)[number];

export type SteamItemContextId = "2" | "6";

export type SteamItemAppId = number;

export type SteamItemAssetId = string;

export type SteamItemClassId = string;

export type SteamItem = {
  appId: SteamItemAppId;
  assetId: SteamItemAssetId | null;
  classId: SteamItemClassId;
  contextId: "2" | "6" | null;
  exterior: SteamItemExterior | null;
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
  stickers: { image: string; marketHashName: string }[];
  charms: { image: string; marketHashName: string }[];
};

export function parseSteamItem({
  actions,
  appid,
  assetid,
  classid,
  contextid,
  descriptions,
  market_hash_name,
  marketable,
  tags,
  tradable,
  owner_steamid,
  user_steamid,
}: {
  actions?: { link: string; name: string }[];
  appid: number;
  assetid?: string;
  classid: string;
  contextid?: "2" | "6";
  descriptions?: { type: "html"; value: string }[];
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
  owner_steamid?: string;
  user_steamid?: string;
}): SteamItem {
  const qualityTag = tags?.find(({ category }) => category === "Quality");

  const rarityTag = tags?.find(({ category }) => category === "Rarity");

  const assetId = assetid || null;

  const ownerSteamId = owner_steamid || null;

  const marketHashName = market_hash_name;

  const exterior =
    (marketHashName.match(steamItemMarketHashNameExteriorRegExp)?.[0] as
      | SteamItemExterior
      | undefined) || null;

  let inspectIngameLink =
    actions?.find(
      ({ link }) => link.indexOf("+csgo_econ_action_preview") !== -1,
    )?.link || null;

  if (inspectIngameLink && assetId) {
    inspectIngameLink = inspectIngameLink.replace("%assetid%", assetId);
  }

  if (inspectIngameLink && ownerSteamId) {
    inspectIngameLink = inspectIngameLink.replace(
      "%owner_steamid%",
      ownerSteamId,
    );
  }

  const stickers: SteamItem["stickers"] = [];
  const charms: SteamItem["charms"] = [];

  if (descriptions) {
    for (const { type, value } of descriptions) {
      if (type === "html" && value.indexOf("sticker_info") !== -1) {
        const images = value.match(
          /(https:\/\/steamcdn-a\.akamaihd\.net\/apps\/[\w.\/]+)/g,
        );

        const marketHashNames = value
          .match(/<br>[\w]+: (.+)<\/center>/)?.[1]
          .split(",");

        if (
          images &&
          marketHashNames &&
          images.length === marketHashNames.length
        ) {
          const isCharms = value.indexOf("keychains") !== -1;

          for (let i = 0; i < images.length; i++) {
            (isCharms ? charms : stickers).push({
              image: images[i],
              marketHashName: marketHashNames[i].trim(),
            });
          }
        }
      }
    }
  }

  return {
    appId: appid,
    assetId,
    classId: classid,
    contextId: contextid || null,
    exterior,
    inspectIngameLink,
    isMarketable: marketable === 1,
    isTradable: tradable === 1,
    isStatTrak: /^StatTrak™/.test(market_hash_name),
    isSouvenir: /^Souvenir/.test(market_hash_name),
    isOwner:
      ownerSteamId && user_steamid ? ownerSteamId === user_steamid : false,
    marketHashName: market_hash_name,
    ownerSteamId: ownerSteamId || null,
    quality: qualityTag?.internal_name || null,
    qualityColor: qualityTag?.color ? `#${qualityTag.color}` : null,
    rarity: rarityTag?.internal_name || null,
    rarityColor: rarityTag?.color ? `#${rarityTag.color}` : null,
    stickers,
    charms,
  };
}

function findWalletCountryCode(text: string) {
  const walletCountryCode = text?.match(/"wallet_country":"([A-Z]+)"/)?.[1];

  if (walletCountryCode && countryCurrencies[walletCountryCode]) {
    return countryCurrencies[walletCountryCode];
  }
}

export const getSteamUserWalletCurrency = pMemoize(async () => {
  for (const scriptElement of $$('script[type="text/javascript"]')) {
    const walletCountryCode =
      scriptElement.textContent &&
      findWalletCountryCode(scriptElement.textContent);

    if (walletCountryCode) {
      return walletCountryCode;
    }
  }

  const walletCountryCode = findWalletCountryCode(await ky("/market").text());

  if (walletCountryCode) {
    return walletCountryCode;
  }

  return null;
});
