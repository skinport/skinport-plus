import OptionsSync from "webext-options-sync";

export type Options = typeof optionsStorageDefaults;

export const optionsStorageDefaults = {
  checkSteamAccountSecurity: true,
  checkTradeOffer: true,
};

export const optionsStorage = new OptionsSync({
  defaults: optionsStorageDefaults,
});
