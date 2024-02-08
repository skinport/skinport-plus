import type { Options as KyOptions } from "ky";
import useSWR from "swr";
import browser from "webextension-polyfill";
import { Item, getSteamUserWalletCurrency, steamAppIdNames } from "./steam";

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
  fallbackCurrency = "USD",
  requestItemsLimit = 50, // If items is more than limit, multiple request are made
) {
  return useSWR(
    ["v1/extension/prices", items, fallbackCurrency],
    async (args) => {
      const currency = (await getSteamUserWalletCurrency()) || fallbackCurrency;

      type SkinportItemPricesResponse = {
        items: Record<string, [number | null, number | null]>; // [lowestPrice, suggestedPrice]
        currency: string;
      };

      const getSkinportItemPrices = (requestItems: string[]) =>
        skinportApi<SkinportItemPricesResponse>(args[0], {
          searchParams: [
            ...requestItems.map((item) => ["items[]", item]),
            ["currency", currency],
          ],
        });

      if (typeof items === "string") {
        return getSkinportItemPrices([items]);
      }

      if (items.length > requestItemsLimit) {
        const skinportItemPricesRequests: Promise<SkinportItemPricesResponse>[] =
          [];

        for (let i = 0; i < items.length; i += requestItemsLimit) {
          skinportItemPricesRequests.push(
            getSkinportItemPrices(items.slice(i, i + requestItemsLimit)),
          );
        }

        const skinportItemPrices: SkinportItemPricesResponse = {
          items: {},
          currency: fallbackCurrency,
        };

        for (const { items, currency } of await Promise.all(
          skinportItemPricesRequests,
        )) {
          skinportItemPrices.items = { ...skinportItemPrices.items, ...items };
          skinportItemPrices.currency = currency;
        }

        return skinportItemPrices;
      }

      return getSkinportItemPrices(items);
    },
  );
}

export async function getSkinportSteamBot(steamId: string) {
  return skinportApi<{ verified: boolean }>(`v1/extension/bot/${steamId}`);
}

export function useSkinportSteamBot(steamId: string) {
  return useSkinportApi<{ verified: boolean }>(`v1/extension/bot/${steamId}`);
}
