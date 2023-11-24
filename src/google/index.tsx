import React from "react";
import { createWidgetElement } from "@/content/widget";
import domLoaded from "dom-loaded";
import { $$ } from "select-dom";
import { BadgeCheck } from "lucide-react";
import SkinportLogo from "@/components/skinport-logo";
import { injectStyle } from "@/lib/dom";

(async () => {
  await domLoaded;

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
          Official <SkinportLogo width={77.5} height={10} /> website
        </span>
      </div>
    );
  });

  skinportLinkElements.forEach((skinportLinkElement) => {
    skinportLinkElement.parentElement?.parentElement?.parentElement?.parentElement?.parentElement?.prepend(
      officialSkinportWebsiteElement,
    );
  });
})();
