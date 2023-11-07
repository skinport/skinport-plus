import { $, $$ } from "select-dom";
import React, { useState } from "react";
import skinportApi from "../lib/skinport-api";
import { createRootElement } from "./lib/dom";
import SkinportLogo from "../components/skinport-logo";
import { Button } from "../components/ui/button";
import { ShieldCheck, ShieldAlert } from "lucide-react";

function TradePartnerVerified() {
  return (
    <div className="sp-bg-skinport-bg sp-p-4 sp-text-center sp-flex sp-flex-col sp-gap-4 sp-mb-6">
      <div className="sp-flex sp-flex-col sp-items-center">
        <SkinportLogo />
      </div>
      <div className="sp-flex sp-flex-col sp-items-center sp-text-[#00a67c]">
        <ShieldCheck size="64" />
      </div>
      <h3 className="sp-font-semibold sp-text-lg">
        You're trading with Skinport
      </h3>
      <p className="sp-text-skinport-gray">
        This trade offer is oficially from Skinport and the trade partner is a
        verified Skinport bot.
      </p>
      <p className="sp-text-xs sp-text-skinport-gray">
        Security provided by the Skinport browser extension.
      </p>
    </div>
  );
}

function TradePartnerUnverified({
  onContinueTrade,
}: {
  onContinueTrade: () => void;
}) {
  const [isContinuingTrade, setIsContinuingTrade] = useState(false);

  if (isContinuingTrade) {
    return null;
  }

  return (
    <div className="sp-bg-skinport-bg sp-p-4 sp-text-center sp-flex sp-flex-col sp-gap-4">
      <div className="sp-flex sp-flex-col sp-items-center">
        <SkinportLogo />
      </div>
      <div className="sp-flex sp-flex-col sp-items-center sp-text-[#e05a59]">
        <ShieldAlert size="64" />
      </div>
      <h3 className="sp-font-semibold sp-text-lg">
        Could someone be trying to scam you?
      </h3>
      <p className="sp-text-skinport-gray">
        This trade offer doesn't appear to be from Skinport and we couldn't
        verify the trade partner.
      </p>
      <p className="sp-text-skinport-gray">
        We advise you to only continue if you trust the trade partner. You will
        not be able to get your items back.
      </p>
      <Button
        variant="destructive"
        onClick={() => {
          setIsContinuingTrade(true);
          onContinueTrade();
        }}
      >
        Continue trade
      </Button>
      <Button variant="ghost" asChild>
        <a
          href="https://skinport.com/blog/how-to-never-get-scammed"
          rel="noopener noreferrer"
          target="_blank"
        >
          Read safety guide
        </a>
      </Button>
      <p className="sp-text-xs sp-text-skinport-gray">
        Security provided by the Skinport browser extension.
      </p>
    </div>
  );
}

(async () => {
  let tradePartnerIsVerified = false;
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
        tradePartnerIsVerified = true;
      }
    } catch (error) {
      console.error(error);
      // TODO: Handle error with e.g. Sentry
    }
  }

  const tradeBoxElement = $(".trade_right .trade_box_contents");
  const tradeConfirmBoxElement = $(".trade_right .trade_confirm_box");

  if (tradeBoxElement && tradeConfirmBoxElement) {
    if (tradePartnerIsVerified) {
      tradeConfirmBoxElement.prepend(
        createRootElement(<TradePartnerVerified />)
      );

      return;
    }

    tradeConfirmBoxElement.style.display = "none";

    tradeBoxElement.append(
      createRootElement(
        <TradePartnerUnverified
          onContinueTrade={() => {
            tradeConfirmBoxElement.style.display = "";
          }}
        />
      )
    );
  }
})();
