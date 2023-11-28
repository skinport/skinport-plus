import { $$ } from "select-dom";
import browser from "webextension-polyfill";
import { countryCurrencies } from "./country-currencies";

export const steamAppIdNames = {
  "730": "cs2",
  "440": "tf2",
  "570": "dota2",
  "252490": "rust",
} as const;

export const supportedSteamAppIds = Object.keys(steamAppIdNames);

export function getIsSupportedSteamAppId(appId: string) {
  return Object.hasOwn(steamAppIdNames, appId);
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

export function getItemFromSteamMarketUrl(
  url: string = window.location.pathname,
) {
  const paths = url.split("/");
  const itemName = paths.pop();

  return {
    itemName: itemName && decodeURIComponent(itemName),
    appId: paths.pop(),
  };
}

export function getSteamUserWalletCurrency(defaultCurrency = "USD") {
  let steamUserWalletCurrency = defaultCurrency;

  for (const scriptElement of $$('script[type="text/javascript"]')) {
    const walletCountryCode = scriptElement.textContent?.match(
      /"wallet_country":"([A-Z]+)"/,
    )?.[1];

    if (walletCountryCode && countryCurrencies[walletCountryCode]) {
      steamUserWalletCurrency = countryCurrencies[walletCountryCode];
      break;
    }
  }

  return steamUserWalletCurrency;
}
