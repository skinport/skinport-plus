import { useToast } from "@/components/ui/use-toast";
import type { Options as KyOptions } from "ky";
import useSWR, { type SWRResponse } from "swr";
import browser from "webextension-polyfill";
import { getI18nMessage } from "./i18n";
import {
  type Item,
  getSteamUserWalletCurrency,
  steamAppIdNames,
} from "./steam";

export const SKINPORT_BASE_URL = "https://skinport.com";

export const SKINPORT_SCREENSHOT_BASE_URL = "https://screenshot.skinport.com";

function setUtmParams(url: URL) {
  url.searchParams.set("utm_source", "skinportplus");
}

export function getSkinportItemSlug(itemMarketHashName: string) {
  return decodeURIComponent(itemMarketHashName)
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

export function getSkinportItemUrl(item: Pick<Item, "appId" | "name">) {
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
  prices: {
    [marketHashName: string]: {
      lowest: number;
      suggested: number;
    };
  };
  currency: string;
};

export function createUseSkinportItemPrices(
  marketHashNames:
    | string
    | string[]
    | Set<string>
    | (() =>
        | string
        | string[]
        | Set<string>
        | Promise<string | string[] | Set<string>>), // Item market hash names
  fallbackCurrency = "USD",
  requestItemsLimit = 1000, // If items is more than limit, multiple request are made
) {
  const maybePromiseRequestMarketHashNames =
    typeof marketHashNames === "function" ? marketHashNames() : marketHashNames;

  const steamUserWalletCurrency = getSteamUserWalletCurrency();

  let resolvedRequestMarketHashNames: string | string[] | undefined;

  return () => {
    const { toast } = useToast();

    const swr = useSWR(
      ["v1/extension/prices", marketHashNames, fallbackCurrency],
      async (args) => {
        if (resolvedRequestMarketHashNames === undefined) {
          resolvedRequestMarketHashNames =
            maybePromiseRequestMarketHashNames instanceof Promise
              ? ((await maybePromiseRequestMarketHashNames.then(
                  (marketHashNames) =>
                    marketHashNames instanceof Set
                      ? Array.from(marketHashNames)
                      : marketHashNames,
                )) as string | string[])
              : maybePromiseRequestMarketHashNames instanceof Set
                ? Array.from(maybePromiseRequestMarketHashNames)
                : maybePromiseRequestMarketHashNames;
        }

        if (resolvedRequestMarketHashNames.length === 0) {
          return;
        }

        const getSkinportItemPrices = async (
          requestMarketHashNames: string[],
        ) =>
          skinportApi<SkinportItemPricesResponse>(args[0], {
            method: "post",
            json: {
              market_hash_names: requestMarketHashNames,
              currency: (await steamUserWalletCurrency) || fallbackCurrency,
            },
          });

        if (typeof resolvedRequestMarketHashNames === "string") {
          return getSkinportItemPrices([resolvedRequestMarketHashNames]);
        }

        if (resolvedRequestMarketHashNames.length > requestItemsLimit) {
          const skinportItemPricesRequests: Promise<SkinportItemPricesResponse>[] =
            [];

          for (
            let i = 0;
            i < resolvedRequestMarketHashNames.length;
            i += requestItemsLimit
          ) {
            skinportItemPricesRequests.push(
              getSkinportItemPrices(
                resolvedRequestMarketHashNames.slice(i, i + requestItemsLimit),
              ),
            );
          }

          const skinportItemPrices: SkinportItemPricesResponse = {
            prices: {},
            currency: fallbackCurrency,
          };

          for (const skinportItemPricesRequest of await Promise.all(
            skinportItemPricesRequests,
          )) {
            skinportItemPrices.prices = {
              ...skinportItemPrices.prices,
              ...skinportItemPricesRequest.prices,
            };
            skinportItemPrices.currency = skinportItemPricesRequest.currency;
          }

          return skinportItemPrices;
        }

        return getSkinportItemPrices(resolvedRequestMarketHashNames);
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

export type SelectedSkinportItemPrice = ReturnType<
  typeof selectSkinportItemPrice
>;

export function selectSkinportItemPrice(
  skinportItemPrices: SWRResponse<SkinportItemPricesResponse | undefined>,
  itemMarketHashName?: string,
) {
  if (skinportItemPrices?.error) {
    return {
      error: skinportItemPrices.error,
      isError: true,
      price: null,
    };
  }

  if (
    itemMarketHashName &&
    skinportItemPrices.data?.prices &&
    skinportItemPrices.data.prices[itemMarketHashName] === undefined
  ) {
    return {
      price: null,
      error: undefined,
      isError: false,
    };
  }

  if (
    itemMarketHashName &&
    skinportItemPrices?.data?.prices[itemMarketHashName]
  ) {
    return {
      price: {
        ...skinportItemPrices.data.prices[itemMarketHashName],
        currency: skinportItemPrices.data.currency,
      },
      error: undefined,
      isError: false,
    };
  }
}

export function useSkinportItemPrices(
  marketHashNames: string | string[],
  fallbackCurrency = "USD",
  requestItemsLimit = 1000,
) {
  return createUseSkinportItemPrices(
    marketHashNames,
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
