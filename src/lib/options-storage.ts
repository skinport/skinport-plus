import OptionsSync from "webext-options-sync";

export const optionsStorageDefaults = {
  checkSteamAccountSecurity: true,
  checkTradeOffer: true,
};

const optionsStorage = new OptionsSync({
  defaults: optionsStorageDefaults,
});

export default optionsStorage;
