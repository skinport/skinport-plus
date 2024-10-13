import type { SteamItem } from "./steam";

function createBridgeAction<
  RequestData extends Record<string, unknown>,
  ResponseData extends Record<string, unknown>,
>(type: string) {
  const requestType = type;
  const responseType = `${type}.response` as const;

  const bridgeAction = (
    ...args: [RequestData] extends [never] ? [] : [requestData: RequestData]
  ) => {
    const [requestData] = args;

    return new Promise<Omit<ResponseData, "type">>((resolve) => {
      const listener = (event: MessageEvent<ResponseData>) => {
        if (event.source !== window) {
          return;
        }

        if (event.data?.type === responseType) {
          window.removeEventListener("message", listener);

          const { type: _, ...data } = event.data;

          resolve(data);
        }
      };

      window.addEventListener("message", listener);

      window.postMessage({
        type: requestType,
        ...requestData,
      });
    });
  };

  bridgeAction.requestType = requestType;

  bridgeAction.response = (responseData: ResponseData) => {
    window.postMessage({
      ...responseData,
      type: responseType,
    });
  };

  bridgeAction.responseType = responseType;

  return bridgeAction;
}

export type SteamCommunityBridgeAction = ReturnType<typeof createBridgeAction>;

export const steamCommunity = {
  inventory: {
    loadCompleteInventory: createBridgeAction<
      never,
      Partial<{ [elementId: string]: SteamItem }>
    >("inventory.loadCompleteInventory"),
    getSelectedItem: createBridgeAction<never, SteamItem>(
      "inventory.getSelectedItem",
    ),
  },
  wallet: {
    getWallet: createBridgeAction<never, { countryCode: string }>(
      "wallet.getWallet",
    ),
  },
  tradeOffer: {
    getTradeItems: createBridgeAction<never, Record<string, SteamItem>>(
      "tradeOffer.getTradeItems",
    ),
    getItemsByAssetId: createBridgeAction<
      { assetIds: string[] },
      { itemsByAssetId: Record<string, SteamItem> }
    >("tradeOffer.getInventoryItems"),
  },
  market: {
    getListingItem: createBridgeAction<
      { listingId?: string } | never,
      SteamItem
    >("market.getListingItem"),
  },
};
