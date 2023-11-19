import domLoaded from "dom-loaded";
import tradeOfferCheck from "./features/steam-trade-offer-check";
import steamAccountSecurityCheck from "./features/steam-account-security-check";
import optionsStorage from "@/lib/options-storage";
import i18n from "@/lib/i18n";

i18n.setDefaultNamespace("content");

(async () => {
  const [options] = await Promise.all([optionsStorage.getAll(), domLoaded]);

  if (options.checkSteamAccountSecurity) {
    steamAccountSecurityCheck();
  }

  if (options.checkTradeOffer) {
    tradeOfferCheck();
  }
})();
