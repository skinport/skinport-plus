import { $ } from "select-dom";
import React from "dom-chef";
import skinportApi from "../lib/skinport-api.js";

(async () => {
  let tradePartnerIsSkinport = false;

  const tradePartnerAnchorElement = $(
    '.trade_partner_headline a[href^="https://steamcommunity.com/profiles/"]'
  );

  if (tradePartnerAnchorElement) {
    const tradePartnerId = tradePartnerAnchorElement
      .getAttribute("href")
      ?.split("/")
      .at(-1);

    if (tradePartnerId) {
      try {
        const { verified } = await skinportApi(
          `v1/extension/bot/${tradePartnerId}`
        ).json<{ verified: boolean }>();

        if (verified) {
          tradePartnerIsSkinport = true;
        }
      } catch (error) {
        console.error(error);
        // TODO: Handle error with e.g. Sentry
      }
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
