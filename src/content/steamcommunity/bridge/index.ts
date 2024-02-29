import { SteamItem } from "../lib/steam";

function createBridgeAction<
  RequestData extends Record<string, unknown>,
  ResponseData extends Record<string, unknown>,
>(type: string) {
  const requestType = type;
  const responseType = `${type}.response` as const;

  const bridgeAction = (requestData?: RequestData) => {
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
      type: responseType,
      ...responseData,
    });
  };

  bridgeAction.responseType = responseType;

  return bridgeAction;
}

export type ParsedRgAsset = Pick<RgAsset, "amount"> &
  Omit<RgDescription, "actions" | "market_hash_name"> & {
    marketHashName: RgDescription["market_hash_name"];
    inspectIngameLink?: string;
    isUserOwner: boolean;
  };

export const bridge = {
  inventory: {
    loadCompleteInventory: createBridgeAction<
      never,
      { itemsByAssetId: Record<string, ParsedRgAsset> }
    >("inventory.loadCompleteInventory"),
    getSelectedItem: createBridgeAction<never, ParsedRgAsset>(
      "inventory.getSelectedItem",
    ),
  },
  wallet: {
    getWalletCountryCode: createBridgeAction<
      never,
      { walletCountryCode: string }
    >("wallet.getWalletCountryCode"),
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
};
