function createBridgeAction<
  RequestData extends Record<string, unknown>,
  ResponseData extends Record<string, unknown>,
>(type: string) {
  return {
    requestType: type,
    responseType: `${type}.response`,
    request(requestData?: RequestData) {
      return new Promise<Omit<ResponseData, "type">>((resolve) => {
        const listener = (event: MessageEvent<ResponseData>) => {
          if (event.source !== window) {
            return;
          }

          if (event.data?.type === this.responseType) {
            window.removeEventListener("message", listener);

            const { type: _, ...data } = event.data;

            resolve(data);
          }
        };

        window.addEventListener("message", listener);

        window.postMessage({
          type: this.requestType,
          ...requestData,
        });
      });
    },
    response(responseData?: ResponseData) {
      window.postMessage({
        type: this.responseType,
        ...responseData,
      });
    },
  };
}

export const bridge = {
  inventoryLoadCompleteInventory: createBridgeAction<
    never,
    { itemsByAssetId: Record<string, RgDescription> }
  >("inventory.loadCompleteInventory"),
};
