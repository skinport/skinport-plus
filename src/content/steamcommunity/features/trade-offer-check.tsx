import { ErrorEmoji } from "@/components/icons/error-emoji";
import { SkinportPlusLogo } from "@/components/skinport-plus-logo";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import { featureManager } from "@/content/feature-manager";
import { createWidgetElement } from "@/content/widget";
import { findInScriptElements } from "@/lib/dom";
import { getI18nMessage } from "@/lib/i18n";
import { getSkinportUrl, useSkinportSteamBot } from "@/lib/skinport";
import { cn } from "@/lib/utils";
import elementReady from "element-ready";
import { Loader2, LucideIcon, ShieldAlert, ShieldCheck } from "lucide-react";
import { ReactNode, useEffect } from "react";
import { $, $$ } from "select-dom";

function TradePartnerCheckResult({
  children,
  icon,
  type,
  title,
}: {
  children?: ReactNode;
  icon: LucideIcon | typeof ErrorEmoji;
  type: "loading" | "success" | "danger";
  title: string;
}) {
  const Icon = icon;

  return (
    <div className="flex flex-col items-center gap-4 mb-6 text-center">
      <SkinportPlusLogo />
      <Icon
        size={64}
        className={cn({
          "text-red-light": type === "danger",
          "text-[#00a67c]": type === "success",
          "animate-spin": type === "loading",
        })}
      />
      <div className="space-y-2">
        <h3 className="font-semibold text-lg text-white">{title}</h3>
        {children}
      </div>
    </div>
  );
}

async function tradeOfferCheck() {
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

  const tradePartnerSteamId = findInScriptElements(
    /var g_ulTradePartnerSteamID = '([0-9]+)'/,
  );
  const tradeUserItemBoxElement = $("#trade_yours .trade_item_box");
  const tradeUserConfirmContentsElement = $(".tutorial_arrow_ctn");

  if (
    !tradePartnerSteamId ||
    !tradeUserItemBoxElement ||
    !tradeUserConfirmContentsElement
  ) {
    return;
  }

  const setTradeUserConfirmDisplay = (display: boolean) => {
    tradeUserConfirmContentsElement.style.display = display ? "" : "none";
  };

  setTradeUserConfirmDisplay(false);

  const [widgetElement] = createWidgetElement(({ removeWidgetElement }) => {
    const skinportSteamBot = useSkinportSteamBot(tradePartnerSteamId);

    useEffect(() => {
      if (skinportSteamBot.data?.verified) {
        setTradeUserConfirmDisplay(true);
      }
    }, [skinportSteamBot.data?.verified]);

    const renderContinueTrade = () => (
      <div className="pt-2 space-x-2">
        <Button asChild>
          <Link
            href={getSkinportUrl("blog/how-to-never-get-scammed")}
            target="_blank"
          >
            {getI18nMessage(
              "steamcommunity_traderOfferCheck_tradePartnerUnverified_readSafetyGuide",
            )}
          </Link>
        </Button>
        <Button
          variant="destructive"
          onClick={() => {
            setTradeUserConfirmDisplay(true);
            removeWidgetElement();
          }}
        >
          {getI18nMessage(
            "steamcommunity_traderOfferCheck_tradePartnerUnverified_continueTrade",
          )}
        </Button>
      </div>
    );

    if (skinportSteamBot.error) {
      return (
        <TradePartnerCheckResult
          type="danger"
          icon={ErrorEmoji}
          title={getI18nMessage("common_errorOccurred")}
        >
          <p>
            {getI18nMessage(
              "steamcommunity_traderOfferCheck_error_description",
            )}
          </p>
          <p>
            {getI18nMessage(
              "steamcommunity_traderOfferCheck_tradePartnerUnverified_description_paragraph2",
            )}
          </p>
          {renderContinueTrade()}
        </TradePartnerCheckResult>
      );
    }

    if (!skinportSteamBot.data) {
      return (
        <TradePartnerCheckResult
          type="loading"
          icon={Loader2}
          title="Verifying trade partner"
        />
      );
    }

    if (skinportSteamBot.data.verified) {
      return (
        <TradePartnerCheckResult
          type="success"
          icon={ShieldCheck}
          title={getI18nMessage(
            "steamcommunity_traderOfferCheck_tradePartnerVerified_title",
          )}
        >
          <p>
            {getI18nMessage(
              "steamcommunity_traderOfferCheck_tradePartnerVerified_description_paragraph1",
            )}
          </p>
        </TradePartnerCheckResult>
      );
    }

    return (
      <TradePartnerCheckResult
        icon={ShieldAlert}
        title={getI18nMessage(
          "steamcommunity_traderOfferCheck_tradePartnerUnverified_title",
        )}
        type="danger"
      >
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
        {renderContinueTrade()}
      </TradePartnerCheckResult>
    );
  });

  tradeUserItemBoxElement.insertAdjacentElement("afterend", widgetElement);
}

featureManager.add(tradeOfferCheck, {
  name: "trade-offer-check",
  matchPathname: "/tradeoffer",
  extensionOptionsKey: "steamCommunityAccountTradeOffersVerifyTradePartner",
  awaitDomReady: true,
});
