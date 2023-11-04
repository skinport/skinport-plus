import { $, $$ } from "select-dom";
import React from "dom-chef";
import skinportApi from "../lib/skinport-api.js";

(async () => {
  let tradePartnerIsSkinport = false;
  let tradePartnerSteamId: string | undefined;

  for (const scriptElement of $$('script[type="text/javascript"]')) {
    const tradePartnerSteamIdMatch = scriptElement.textContent?.match(
      /var g_ulTradePartnerSteamID = '([0-9]+)'/
    );

    if (tradePartnerSteamIdMatch) {
      tradePartnerSteamId = tradePartnerSteamIdMatch[1];
      break;
    }
  }

  if (tradePartnerSteamId) {
    try {
      const { verified } = await skinportApi(
        `v1/extension/bot/${tradePartnerSteamId}`
      ).json<{ verified: boolean }>();

      if (verified) {
        tradePartnerIsSkinport = true;
      }
    } catch (error) {
      console.error(error);
      // TODO: Handle error with e.g. Sentry
    }
  }

  const traderPartnerVerifiedElement = (
    <div
      className={`${
        tradePartnerIsSkinport ? "sp-bg-green-600" : "sp-bg-red-600"
      } sp-text-white sp-px-4 sp-py-4 sp-mb-4`}
    >
      {tradePartnerIsSkinport
        ? "This is an official Skinport Bot"
        : "This is NOT a Skinport Bot"}
    </div>
  );

  const tradeConfirmBoxElement = $(".trade_confirm_box");

  if (tradeConfirmBoxElement) {
    tradeConfirmBoxElement.prepend(traderPartnerVerifiedElement);
  }
})();
