import { $, $$ } from "select-dom";
import React, { useState } from "react";
import { ShieldCheck, ShieldAlert } from "lucide-react";
import skinportApi from "@/lib/skinport-api";
import SkinportLogo from "@/components/skinport-logo";
import { Button } from "@/components/ui/button";
import { createWidgetElement } from "../widget";
import elementReady from "element-ready";

function TradePartnerVerified() {
  return (
    <div className="p-4 text-center flex flex-col gap-4 mb-6">
      <div className="flex flex-col items-center">
        <SkinportLogo />
      </div>
      <div className="flex flex-col items-center text-[#00a67c]">
        <ShieldCheck size="64" />
      </div>
      <h3 className="font-semibold text-lg text-white">
        You're trading with Skinport
      </h3>
      <p className="text-text-foreground">
        This trade offer is oficially from Skinport and the trade partner is a
        verified Skinport bot.
      </p>
      <p className="text-xs text-text-foreground">
        Security provided by the Skinport browser extension
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
    <div className="p-4 text-center flex flex-col gap-4">
      <div className="flex flex-col items-center">
        <SkinportLogo />
      </div>
      <div className="flex flex-col items-center text-[#e05a59]">
        <ShieldAlert size="64" />
      </div>
      <h3 className="font-semibold text-lg text-white">
        Could someone be trying to scam you?
      </h3>
      <p className="text-text-foreground">
        This trade offer doesn't appear to be from Skinport and we couldn't
        verify the trade partner.
      </p>
      <p className="text-text-foreground">
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
      <p className="text-xs text-text-foreground">
        Security provided by the Skinport browser extension
      </p>
    </div>
  );
}

export default async function steamTradeOfferCheck() {
  if (!window.location.pathname.startsWith("/tradeoffer")) {
    return;
  }

  const tradeYoursReadyElement = await elementReady("#trade_yours.ready", {
    stopOnDomReady: false,
    timeout: 30000,
  });

  if (!tradeYoursReadyElement) {
    return;
  }

  const tradeYoursItemElements = $$("#your_slots .has_item");

  if (tradeYoursItemElements.length === 0) {
    return;
  }

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

  const tradeYoursElement = $("#trade_yours");
  const tradeConfirmYourContentsElement = $(".tutorial_arrow_ctn");

  if (tradeYoursElement && tradeConfirmYourContentsElement) {
    if (tradePartnerIsVerified) {
      const [tradePartnerVerifiedElement] = createWidgetElement(
        <TradePartnerVerified />
      );

      tradeConfirmYourContentsElement.prepend(tradePartnerVerifiedElement);
    } else {
      tradeConfirmYourContentsElement.style.display = "none";

      const [TradePartnerUnverifiedElement] = createWidgetElement(
        <TradePartnerUnverified
          onContinueTrade={() => {
            tradeConfirmYourContentsElement.style.display = "";
          }}
        />
      );

      tradeYoursElement.append(TradePartnerUnverifiedElement);
    }
  }
}
