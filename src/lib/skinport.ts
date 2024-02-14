import { useToast } from "@/components/ui/use-toast";
import type { Options as KyOptions } from "ky";
import useSWR, { SWRResponse } from "swr";
import browser from "webextension-polyfill";
import { getI18nMessage } from "./i18n";
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

export function useSkinportApi<ResponseBody>(
  input: string,
  options?: KyOptions,
) {
  return useSWR([input, options], async (args) =>
    skinportApi<ResponseBody>(args[0], args[1]),
  );
}

type SkinportItemPricesResponse = {
  items: Record<string, [number | null, number | null, string | null]>; // [lowestPrice, suggestedPrice, exteriorColor]
  currency: string;
};

export function createUseSkinportItemPrices(
  itemNames: string | string[] | (() => Promise<string | string[]>), // Item market hash names
  fallbackCurrency = "USD",
  requestItemsLimit = 50, // If items is more than limit, multiple request are made
) {
  const maybePromiseRequestItemNames =
    typeof itemNames === "function" ? itemNames() : itemNames;

  const steamUserWalletCurrency = getSteamUserWalletCurrency();

  let resolvedRequestItems: string | string[] | undefined;

  return () => {
    const { toast } = useToast();

    const swr = useSWR(
      ["v1/extension/prices", itemNames, fallbackCurrency],
      async (args) => {
        if (resolvedRequestItems === undefined) {
          resolvedRequestItems =
            maybePromiseRequestItemNames instanceof Promise
              ? await maybePromiseRequestItemNames
              : maybePromiseRequestItemNames;
        }

        const currencySearchParam = [
          "currency",
          (await steamUserWalletCurrency) || fallbackCurrency,
        ];

        const getSkinportItemPrices = async (requestItems: string[]) =>
          skinportApi<SkinportItemPricesResponse>(args[0], {
            searchParams: [
              ...requestItems.map((item) => ["items[]", item]),
              currencySearchParam,
            ],
          });

        if (typeof resolvedRequestItems === "string") {
          return getSkinportItemPrices([resolvedRequestItems]);
        }

        if (resolvedRequestItems.length > requestItemsLimit) {
          const skinportItemPricesRequests: Promise<SkinportItemPricesResponse>[] =
            [];

          for (
            let i = 0;
            i < resolvedRequestItems.length;
            i += requestItemsLimit
          ) {
            skinportItemPricesRequests.push(
              getSkinportItemPrices(
                resolvedRequestItems.slice(i, i + requestItemsLimit),
              ),
            );
          }

          const skinportItemPrices: SkinportItemPricesResponse = {
            items: {},
            currency: fallbackCurrency,
          };

          for (const skinportItemPricesRequest of await Promise.all(
            skinportItemPricesRequests,
          )) {
            skinportItemPrices.items = {
              ...skinportItemPrices.items,
              ...skinportItemPricesRequest.items,
            };
            skinportItemPrices.currency = skinportItemPricesRequest.currency;
          }

          return skinportItemPrices;
        }

        return getSkinportItemPrices(resolvedRequestItems);
      },
      {
        onError: () => {
          toast({
            title: getI18nMessage("common_errorOccurred"),
            description: getI18nMessage("common_failedLoadingItemPrices"),
          });
        },
      },
    );

    return swr;
  };
}

export function selectSkinportItemPrice(
  skinportItemPrices: SWRResponse<SkinportItemPricesResponse>,
  itemName?: string,
):
  | { error: unknown; isError: true; price: undefined; currency: undefined }
  | {
      price: [number | null, number | null, string | null];
      currency: string;
      error: undefined;
      isError: false;
    }
  | undefined {
  if (skinportItemPrices.error) {
    return {
      error: skinportItemPrices.error,
      isError: true,
      price: undefined,
      currency: undefined,
    };
  }

  if (itemName && skinportItemPrices.data?.items[itemName]) {
    return {
      price: skinportItemPrices.data.items[itemName],
      currency: skinportItemPrices.data.currency,
      error: undefined,
      isError: false,
    };
  }
}

export function useSkinportItemPrices(
  itemNames: string | string[], // Item market hash names
  fallbackCurrency = "USD",
  requestItemsLimit = 50, // If items is more than limit, multiple request are made
) {
  return createUseSkinportItemPrices(
    itemNames,
    fallbackCurrency,
    requestItemsLimit,
  )();
}

export async function getSkinportSteamBot(steamId: string) {
  return skinportApi<{ verified: boolean }>(`v1/extension/bot/${steamId}`);
}

export function useSkinportSteamBot(steamId: string) {
  return useSkinportApi<{ verified: boolean }>(`v1/extension/bot/${steamId}`);
}
