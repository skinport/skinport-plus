import { KyOptions } from "ky/distribution/types/options";
import browser from "webextension-polyfill";
import { Item, getSteamUserWalletCurrency, steamAppIdNames } from "./steam";

export function getSkinportItemSlug(itemName: string) {
  return decodeURIComponent(itemName)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getSkinportItemUrl(item: Item) {
  const steamAppName = steamAppIdNames[item.appId];

  return `https://skinport.com${
    steamAppName !== "cs2" ? `/${steamAppName}` : ""
  }/item/${getSkinportItemSlug(item.name)}`;
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

export function getSkinportItemPrices(
  items: string | string[],
  currency?: string,
) {
  return skinportApi<{
    items: Partial<Record<string, number>>;
    currency: string;
  }>("v1/extension/price", {
    searchParams: [
      ...(typeof items === "string" ? [items] : items).map((item) => [
        "items[]",
        item,
      ]),
      ["currency", currency || getSteamUserWalletCurrency()],
    ],
  });
}

export async function getIsSteamIdSkinportVerified(steamId: string) {
  const { verified } = await skinportApi<{ verified: boolean }>(
    `v1/extension/bot/${steamId}`,
  );

  return verified;
}
