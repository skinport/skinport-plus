import OptionsSync from "webext-options-sync";

export type Options = typeof optionsStorageDefaults;

export const optionsStorageDefaults = {
  steamCommunityAccountCheckSecurityVulnerabilities: true,
  steamCommunityInventoryShowItemPrices: true,
  steamCommunityTradeOffersVerifyTradePartner: true,
  steamCommunityTradeOffersShowItemPrices: true,
  steamCommunityTradeOffersShowTotalTradeValues: true,
};

export const optionsStorage = new OptionsSync({
  defaults: optionsStorageDefaults,
  migrations: [
    (savedOptions) => {
      // @ts-expect-error
      if (typeof savedOptions.checkSteamAccountSecurity === "boolean") {
        savedOptions.steamCommunityAccountCheckSecurityVulnerabilities =
          // @ts-expect-error
          savedOptions.checkSteamAccountSecurity;

        // @ts-expect-error
        // biome-ignore lint/performance/noDelete:
        delete savedOptions.checkSteamAccountSecurity;
      }

      // @ts-expect-error
      if (typeof savedOptions.checkTradeOffer === "boolean") {
        savedOptions.steamCommunityTradeOffersVerifyTradePartner =
          // @ts-expect-error
          savedOptions.checkTradeOffer;

        // @ts-expect-error
        // biome-ignore lint/performance/noDelete:
        delete savedOptions.checkTradeOffer;
      }
    },
    OptionsSync.migrations.removeUnused,
  ],
});
