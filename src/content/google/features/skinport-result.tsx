import { InterpolateMessage } from "@/components/interpolate-message";
import SkinportLogo from "@/components/skinport-logo";
import featureManager from "@/content/feature-manager";
import { createWidgetElement } from "@/content/widget";
import { injectStyle } from "@/lib/dom";
import { BadgeCheck } from "lucide-react";
import React from "react";
import { $$ } from "select-dom";
import browser from "webextension-polyfill";

async function googleSkinportResult() {
  const skinportLinkElements = $$('a[href^="https://skinport.com/"]');

  if (skinportLinkElements.length === 0) {
    return;
  }

  injectStyle(".uEierd { display: none !important; }");

  const [officialSkinportWebsiteElement] = createWidgetElement(() => {
    return (
      <div className="inline-flex gap-2 rounded bg-blue p-2 text-xs text-white font-semibold uppercase items-center mb-2 tracking-widest">
        <BadgeCheck size={16} />
        <span className="inline-flex gap-1.5 items-center">
          <InterpolateMessage
            message={browser.i18n.getMessage("google_officialSkinportWebsite")}
            values={{
              skinportLogo: <SkinportLogo width={77.5} height={10} />,
            }}
          />
        </span>
      </div>
    );
  });

  for (const skinportLinkElement of skinportLinkElements) {
    skinportLinkElement.parentElement?.parentElement?.parentElement?.parentElement?.parentElement?.prepend(
      officialSkinportWebsiteElement,
    );
  }
}

featureManager.add(googleSkinportResult, { awaitDomReady: true });
