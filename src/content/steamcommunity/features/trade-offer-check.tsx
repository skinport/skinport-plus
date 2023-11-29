import { SkinportLogo } from "@/components/skinport-logo";
import { Button } from "@/components/ui/button";
import { featureManager } from "@/content/feature-manager";
import { createWidgetElement } from "@/content/widget";
import { getI18nMessage } from "@/lib/i18n";
import { verifyTradingPartner } from "@/lib/steam";
import elementReady from "element-ready";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { $, $$ } from "select-dom";

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
        {getI18nMessage(
          "steamcommunity_traderOfferCheck_tradePartnerVerified_title",
        )}
      </h3>
      <p className="text-text-foreground">
        {getI18nMessage(
          "steamcommunity_traderOfferCheck_tradePartnerVerified_description_paragraph1",
        )}
      </p>
      <p className="text-xs text-[#6b6d6e]">
        {getI18nMessage("common_securityProvidedBySkinportPlus")}
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
        {getI18nMessage(
          "steamcommunity_traderOfferCheck_tradePartnerUnverified_title",
        )}
      </h3>
      <p className="text-text-foreground">
        {getI18nMessage(
          "steamcommunity_traderOfferCheck_tradePartnerUnverified_description_paragraph1",
        )}
      </p>
      <p className="text-text-foreground">
        {getI18nMessage(
          "steamcommunity_traderOfferCheck_tradePartnerUnverified_description_paragraph2",
        )}
      </p>
      <Button
        variant="destructive"
        onClick={() => {
          setIsContinuingTrade(true);
          onContinueTrade();
        }}
      >
        {getI18nMessage(
          "steamcommunity_traderOfferCheck_tradePartnerUnverified_continueTrade",
        )}
      </Button>
      <Button variant="ghost" asChild>
        <a
          href="https://skinport.com/blog/how-to-never-get-scammed"
          rel="noopener noreferrer"
          target="_blank"
        >
          {getI18nMessage(
            "steamcommunity_traderOfferCheck_tradePartnerUnverified_readSafetyGuide",
          )}
        </a>
      </Button>
      <p className="text-xs text-[#6b6d6e]">
        {getI18nMessage("common_securityProvidedBySkinportPlus")}
      </p>
    </div>
  );
}

async function steamTradeOfferCheck() {
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
      /var g_ulTradePartnerSteamID = '([0-9]+)'/,
    );

    if (tradePartnerSteamIdMatch) {
      tradePartnerSteamId = tradePartnerSteamIdMatch[1];
      break;
    }
  }

  if (tradePartnerSteamId) {
    try {
      tradePartnerIsVerified = await verifyTradingPartner(tradePartnerSteamId);
    } catch (error) {
      console.error(error);
      // TODO: Handle error with e.g. Sentry
      return;
    }
  }

  const tradeYoursElement = $("#trade_yours");
  const tradeConfirmYourContentsElement = $(".tutorial_arrow_ctn");

  if (tradeYoursElement && tradeConfirmYourContentsElement) {
    if (tradePartnerIsVerified) {
      const [tradePartnerVerifiedElement] =
        createWidgetElement(TradePartnerVerified);

      tradeConfirmYourContentsElement.prepend(tradePartnerVerifiedElement);
    } else {
      tradeConfirmYourContentsElement.style.display = "none";

      const [TradePartnerUnverifiedElement] = createWidgetElement(() => (
        <TradePartnerUnverified
          onContinueTrade={() => {
            tradeConfirmYourContentsElement.style.display = "";
          }}
        />
      ));

      tradeYoursElement.append(TradePartnerUnverifiedElement);
    }
  }
}

featureManager.add(steamTradeOfferCheck, {
  matchPathname: "/tradeoffer",
  optionKey: "checkTradeOffer",
  awaitDomReady: true,
});
