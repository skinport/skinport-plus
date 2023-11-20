import domLoaded from "dom-loaded";
import tradeOfferCheck from "./features/steam-trade-offer-check";
import steamAccountSecurityCheck from "./features/steam-account-security-check";
import optionsStorage from "@/lib/options-storage";
import i18n from "@/lib/i18n";
import steamMarketItemSkinportLink from "./features/steam-market-item-skinport-link";

i18n.setDefaultNamespace("content");

(async () => {
  const [options] = await Promise.all([optionsStorage.getAll(), domLoaded]);

  const runFeature = (feature: {
    (): Promise<void>;
    matchPathname?: string | RegExp;
    optionKey?: keyof typeof options;
  }) => {
    if (
      (feature.matchPathname &&
        feature.matchPathname instanceof RegExp &&
        !feature.matchPathname.test(window.location.pathname)) ||
      (typeof feature.matchPathname === "string" &&
        window.location.pathname.startsWith(feature.matchPathname))
    ) {
      return;
    }

    if (feature.optionKey && options[feature.optionKey] === false) {
      return;
    }

    try {
      feature();
    } catch (error) {
      console.error(error);
    }
  };

  [
    steamAccountSecurityCheck,
    tradeOfferCheck,
    steamMarketItemSkinportLink,
  ].forEach(runFeature);
})();
