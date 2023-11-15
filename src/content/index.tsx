import domLoaded from "dom-loaded";
import tradeOfferChcek from "./features/steam-trade-offer-check";
import securityCheck from "./features/steam-account-security-check";
import optionsStorage from "@/lib/options-storage";

(async () => {
  const [options] = await Promise.all([optionsStorage.getAll(), domLoaded]);

  if (options.steamAccountSecurityCheck) {
    securityCheck();
  }

  if (options.steamTradeOfferCheck) {
    tradeOfferChcek();
  }
})();
