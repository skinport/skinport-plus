import { KyOptions } from "ky/distribution/types/options";
import useSWR from "swr";
import browser from "webextension-polyfill";
import {
  Item,
  getSteamUserWalletCurrencyFromMarket,
  getSteamUserWalletCurrencyFromPage,
  steamAppIdNames,
} from "./steam";

export const SKINPORT_BASE_URL = "https://skinport.com";

export const SKINPORT_SCREENSHOT_BASE_URL = "https://screenshot.skinport.com";

function setUtmParams(url: URL) {
  url.searchParams.set("utm_source", "skinportplus");
}

export function getSkinportItemSlug(itemName: string) {
  return decodeURIComponent(itemName)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getSkinportUrl(input?: string) {
  const url = new URL(input || SKINPORT_BASE_URL, input && SKINPORT_BASE_URL);

  setUtmParams(url);

  return url.toString();
}

export function getSkinportItemUrl(item: Item) {
  const steamAppName = steamAppIdNames[item.appId];

  return getSkinportUrl(
    `${
      steamAppName !== "cs2" ? `/${steamAppName}` : ""
    }/item/${getSkinportItemSlug(item.name)}`,
  );
}

export function getSkinportScreenshotUrl(input?: string) {
  const url = new URL(
    input || SKINPORT_SCREENSHOT_BASE_URL,
    input && SKINPORT_SCREENSHOT_BASE_URL,
  );

  setUtmParams(url);

  return url.toString();
}

export async function skinportApi<ResponseBody>(
  input: string,
  options?: KyOptions,
) {
  const { body, error }: { body: ResponseBody; error: string } =
    await browser.runtime.sendMessage({
      skinportApi: input,
      options,
    });

  if (error) {
    throw Error(error);
  }

  return body;
}

export type SkinportItemPricesResponse = {
  items: Record<string, [number | null, number | null]>; // [lowestPrice, suggestedPrice]
  currency: string;
};

export const SKINPORT_ITEM_PRICES_REQUEST_LIMIT = 50;

export const SKINPORT_ITEM_PRICES_FALLBACK_CURRENCY = "USD";

export async function getSkinportItemPrices(
  items: string | string[], // Item market hash names
  fallbackCurrency = SKINPORT_ITEM_PRICES_FALLBACK_CURRENCY,
) {
  return skinportApi<SkinportItemPricesResponse>("v1/extension/prices", {
    searchParams: [
      ...(typeof items === "string" ? [items] : items).map((item) => [
        "items[]",
        item,
      ]),
      [
        "currency",
        getSteamUserWalletCurrencyFromPage() ||
          (await getSteamUserWalletCurrencyFromMarket()) ||
          fallbackCurrency,
      ],
    ],
  });
}

export function useSkinportApi<ResponseBody>(
  input: string,
  options?: KyOptions,
) {
  return useSWR([input, options], async (args) =>
    skinportApi<ResponseBody>(args[0], args[1]),
  );
}

export function useSkinportItemPrices(
  items: string | string[], // Item market hash names
  fallbackCurrency = SKINPORT_ITEM_PRICES_FALLBACK_CURRENCY,
) {
  return useSkinportApi<SkinportItemPricesResponse>("v1/extension/prices", {
    searchParams: [
      ...(typeof items === "string" ? [items] : items).map((item) => [
        "items[]",
        item,
      ]),
      ["currency", getSteamUserWalletCurrencyFromPage() || fallbackCurrency],
    ],
  });
}

export async function getSkinportSteamBot(steamId: string) {
  return skinportApi<{ verified: boolean }>(`v1/extension/bot/${steamId}`);
}

export function useSkinportSteamBot(steamId: string) {
  return useSkinportApi<{ verified: boolean }>(`v1/extension/bot/${steamId}`);
}
