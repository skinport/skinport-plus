import OptionsSync from "webext-options-sync";

export type Options = typeof optionsStorageDefaults;

export const optionsStorageDefaults = {
  checkSteamAccountSecurity: true,
  checkTradeOffer: true,
};

const optionsStorage = new OptionsSync({
  defaults: optionsStorageDefaults,
});

export default optionsStorage;
