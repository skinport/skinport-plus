import { KyOptions } from "ky/distribution/types/options";
import browser from "webextension-polyfill";
import { getSteamUserWalletCurrency, steamAppIdNames } from "./steam";

export function getSkinportItemSlug(itemName: string) {
  return decodeURIComponent(itemName)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getSkinportItemUrl(steamAppId: string, steamItemName: string) {
  const steamAppName =
    steamAppIdNames[steamAppId as keyof typeof steamAppIdNames];

  return `https://skinport.com${
    steamAppName !== "cs2" ? `/${steamAppName}` : ""
  }/item/${getSkinportItemSlug(steamItemName)}`;
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
    items: Record<string, number>;
    currency: string;
  }>("v1/extension/price", {
    searchParams: {
      items: typeof items === "string" ? items : items.join(","),
      currency: currency || getSteamUserWalletCurrency(),
    },
  });
}

export async function getIsSteamIdSkinportVerified(steamId: string) {
  const { verified } = await skinportApi<{ verified: boolean }>(
    `v1/extension/bot/${steamId}`,
  );

  return verified;
}
