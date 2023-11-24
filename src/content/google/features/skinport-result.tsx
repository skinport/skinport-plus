import React from "react";
import { createWidgetElement } from "@/content/widget";
import { $$ } from "select-dom";
import { BadgeCheck } from "lucide-react";
import SkinportLogo from "@/components/skinport-logo";
import { injectStyle } from "@/lib/dom";
import featureManager from "@/content/feature-manager";
import browser from "webextension-polyfill";
import { Trans } from "react-i18next";

async function googleSkinportResult() {
  const skinportLinkElements = $$('a[href="https://skinport.com/"]');

  if (skinportLinkElements.length === 0) {
    return;
  }

  injectStyle(`.uEierd { display: none !important; }`);

  const [officialSkinportWebsiteElement] = createWidgetElement(() => {
    return (
      <div className="inline-flex gap-2 rounded bg-blue p-2 text-xs text-white font-semibold uppercase items-center mb-2 tracking-widest">
        <BadgeCheck size={16} />
        <span className="inline-flex gap-1.5 items-center">
          <Trans
            components={{
              skinportLogo: <SkinportLogo width={77.5} height={10} />,
            }}
          >
            {browser.i18n.getMessage("google_officialSkinportWebsite")}
          </Trans>
        </span>
      </div>
    );
  });

  skinportLinkElements.forEach((skinportLinkElement) => {
    skinportLinkElement.parentElement?.parentElement?.parentElement?.parentElement?.parentElement?.prepend(
      officialSkinportWebsiteElement,
    );
  });
}

featureManager.add(googleSkinportResult, { awaitDomReady: true });
