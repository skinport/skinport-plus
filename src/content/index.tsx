import "./features/steam-account-security-check";
import "./features/steam-inventory-item-skinport-link";
import "./features/steam-market-item-skinport-link";
import "./features/steam-trade-offer-check";
import domLoaded from "dom-loaded";
import i18n from "@/lib/i18n";
import featureManager from "./feature-manager";

i18n.setDefaultNamespace("content");

(async () => {
  await Promise.all([featureManager.init(), domLoaded]);

  featureManager.run();
})();
