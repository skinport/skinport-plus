import SkinportLogo from "@/components/skinport-logo";
import featureManager from "@/content/feature-manager";
import { createWidgetElement } from "@/content/widget";
import { injectStyle } from "@/lib/dom";
import { BadgeCheck } from "lucide-react";
import React from "react";
import { $, elementExists } from "select-dom";

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

async function googleSkinportResult() {
  const skinportLinkElement = $('#search a[href^="https://skinport.com"]');

  if (!skinportLinkElement) {
    return;
  }

  injectStyle(".uEierd { display: none !important; }");

  const skinportResultElement = getResultRootElement(skinportLinkElement);

  if (skinportResultElement) {
    const googleResultsElement = skinportResultElement.parentElement;

    if (googleResultsElement) {
      googleResultsElement.prepend(skinportResultElement);
    }
  }

  const isGoogleDarkMode = elementExists(
    '[data-darkmode="true"]',
    skinportResultElement,
  );

  const [officialSkinportWebsiteElement] = createWidgetElement(() => {
    return (
      <div className="flex gap-2 text-blue items-center absolute left-0 top-0 cursor-pointer">
        <SkinportLogo isInverted={!isGoogleDarkMode} />
        <BadgeCheck size={20} />
      </div>
    );
  });

  const skinportLinkInfoElement = $("div", skinportLinkElement);

  if (skinportLinkInfoElement) {
    skinportLinkInfoElement.replaceWith(officialSkinportWebsiteElement);
  }

  const skinportLinkHeadingElement = $("h3", skinportLinkElement);

  if (skinportLinkHeadingElement) {
    skinportLinkHeadingElement.style.marginTop = "0px";
  }

  const skinportLinkMoreOptionsElement =
    skinportLinkElement.parentElement?.nextElementSibling;

  if (skinportLinkMoreOptionsElement) {
    skinportLinkMoreOptionsElement.remove();
  }
}

featureManager.add(googleSkinportResult, { awaitDomReady: true });
