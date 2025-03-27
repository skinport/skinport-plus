import { SkinportLogo } from "@/components/skinport-logo";
import { featureManager } from "@/content/feature-manager";
import { createWidgetElement } from "@/content/widget";
import { injectStyle } from "@/lib/dom";
import { SKINPORT_BASE_URL } from "@/lib/skinport";
import { BadgeCheck } from "lucide-react";
import { $, $$ } from "select-dom";

function getResultRootElement(targetElement: HTMLElement) {
  if (
    !targetElement?.parentElement ||
    targetElement.parentElement.classList.contains("v7W49e")
  ) {
    return;
  }

  if (targetElement.parentElement.classList.contains("MjjYud")) {
    return targetElement.parentElement;
  }

  return getResultRootElement(targetElement.parentElement);
}

async function skinportResult() {
  const skinportLinkElements = $$(
    `#search a[href^="${SKINPORT_BASE_URL}"]:has(h3)`,
  );

  if (!skinportLinkElements) {
    return;
  }

  injectStyle(".uEierd { display: none !important; }");

  const isGoogleDarkMode =
    window
      .getComputedStyle(document.body)
      .getPropertyValue("background-color") !== "rgb(255, 255, 255)";

  for (const skinportLinkElement of skinportLinkElements) {
    const skinportResultElement = getResultRootElement(skinportLinkElement);

    if (skinportResultElement) {
      const googleResultsElement = $('div[data-async-context^="query:"]');

      if (googleResultsElement) {
        googleResultsElement.prepend(skinportResultElement);
      }
    }

    const [officialSkinportWebsiteElement] = createWidgetElement(() => {
      return (
        <div className="flex gap-2 text-blue items-center cursor-pointer">
          <SkinportLogo isInverted={!isGoogleDarkMode} />
          <BadgeCheck size={20} />
        </div>
      );
    });

    const skinportLinkInfoElement = $("div", skinportLinkElement);

    if (skinportLinkInfoElement) {
      skinportLinkInfoElement.replaceWith(officialSkinportWebsiteElement);
    }

    const skinportLinkMoreOptionsElement =
      skinportLinkElement.parentElement?.nextElementSibling;

    if (skinportLinkMoreOptionsElement) {
      skinportLinkMoreOptionsElement.remove();
    }
  }
}

featureManager.add(skinportResult, {
  name: "skinport-result",
});
