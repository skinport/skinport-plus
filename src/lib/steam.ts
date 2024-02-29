import ky, { SearchParamsOption } from "ky";
import pMemoize from "p-memoize";
import { $$ } from "select-dom";
import browser from "webextension-polyfill";
import { countryCurrencies } from "./country-currencies";
import { findInScriptElements } from "./dom";

export const steamAppIdNames = {
  "730": "cs2",
  "440": "tf2",
  "570": "dota2",
  "252490": "rust",
} as const;

export const supportedSteamAppIds = Object.keys(steamAppIdNames);

export type SupportedSteamAppIds = keyof typeof steamAppIdNames;

export function getIsSupportedSteamAppId(appId: string) {
  return Object.hasOwn(steamAppIdNames, appId);
}

export function parseSupportedSteamAppId(appId?: string) {
  if (appId && getIsSupportedSteamAppId(appId)) {
    return appId as SupportedSteamAppIds;
  }
}

export type Item = {
  name: string;
  appId: keyof typeof steamAppIdNames;
  isStatTrak: boolean;
  isSouvenir: boolean;
  isMarketable?: boolean;
  inspectIngameLink?: string;
  hasExterior: boolean;
};

export function parseSteamItem(
  name: string,
  appId: string,
  isMarketable: boolean,
  inspectIngameLink?: string,
) {
  if (Object.hasOwn(steamAppIdNames, appId)) {
    const item: Item = {
      name,
      appId: appId as keyof typeof steamAppIdNames,
      isStatTrak: getIsItemStatTrak(name),
      isSouvenir: getIsItemSouvenir(name),
      isMarketable,
      inspectIngameLink,
      hasExterior: getHasItemExterior(name),
    };

    return item;
  }

  return null;
}

export async function verifyTradingPartner(steamId: string) {
  const { response, error } = await browser.runtime.sendMessage({
    skinportApi: `v1/extension/bot/${steamId}`,
  });

  if (error) {
    throw Error(error);
  }

  return response.verified;
}

export function getHasItemExterior(itemName: string) {
  return /\(Battle-Scarred|Factory New|Field-Tested|Minimal Wear|Well-Worn\)$/.test(
    decodeURIComponent(itemName),
  );
}

export function getIsItemStatTrak(itemName?: string) {
  if (itemName) {
    return /^StatTrak™/.test(decodeURIComponent(itemName));
  }

  return false;
}

export function getIsItemSouvenir(itemName?: string) {
  if (itemName) {
    return /^Souvenir/.test(decodeURIComponent(itemName));
  }

  return false;
}

export function getItemFromSteamMarketUrl(
  url: string = window.location.pathname,
) {
  const paths = url.split("/");
  const name = paths.pop();
  const appId = paths.pop();

  if (!name || !appId || !getIsSupportedSteamAppId(appId)) {
    return;
  }

  return {
    name: decodeURIComponent(name),
    appId,
    isStatTrak: getIsItemStatTrak(name),
    isSouvenir: getIsItemSouvenir(name),
  } as Item;
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

export function getSteamUserSteamId() {
  const userSteamId = findInScriptElements(/g_steamID = "(\d+)"/);

  return userSteamId;
}

export async function getSteamUserInventory({
  steamId,
  appId,
  count = 5000, // Max
  startAssetId, // Pagination (Cursor)
}: {
  steamId?: string;
  appId: SupportedSteamAppIds;
  count?: number;
  startAssetId?: string;
}) {
  const searchParams: SearchParamsOption = { l: "english", count };

  if (startAssetId) {
    searchParams.start_assetid = startAssetId;
  }

  return ky(
    `https://steamcommunity.com/inventory/${
      steamId || getSteamUserSteamId()
    }/${appId}/2`,
    { searchParams, retry: 10 },
  ).json<{
    assets: {
      amount: string;
      appid: number;
      assetid: string;
      classid: string;
      contextid: string;
      instanceid: string;
    }[];
    descriptions: {
      actions: { link: string; name: string }[];
      appid: number;
      background_color: string;
      classid: string;
      commodity: number;
      currency: number;
      descriptions: { type: "html"; value: string }[];
      icon_url: string;
      instanceid: string;
      market_actions: {
        link: string;
        name: string;
      }[];
      market_hash_name: string;
      market_name: string;
      market_tradable_restriction: string;
      marketable: number;
      name: string;
      name_color: string;
      tags: {
        category:
          | "Type"
          | "Weapon"
          | "ItemSet"
          | "Quality"
          | "Rarity"
          | "Exterior";
        internal_name: string;
        localized_category_name: string;
        localized_tag_name: string;
        tradable: number;
        type: string;
      }[];
    }[];
    last_assetid: string;
    more_items: number;
    success: number;
    total_inventory_count: number;
  }>();
}
