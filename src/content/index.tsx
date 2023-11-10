import domLoaded from "dom-loaded";
import tradeOfferVerification from "./features/trade-offer-verification";
import securityCheck from "./features/security-check";

(async () => {
  await domLoaded;

  tradeOfferVerification();
  securityCheck();
})();
