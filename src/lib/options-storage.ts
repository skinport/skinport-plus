import OptionsSync from "webext-options-sync";

export const optionsStorageDefaults = {
  steamAccountSecurityCheck: true,
  steamTradeOfferCheck: true,
};

const optionsStorage = new OptionsSync({
  defaults: optionsStorageDefaults,
});

export default optionsStorage;
