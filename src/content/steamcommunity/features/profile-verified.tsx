import { SkinportFish } from "@/components/icons/skinport-fish";
import { Tooltip, TooltipContent } from "@/components/ui/tooltip";
import { featureManager } from "@/content/feature-manager";
import { createWidgetElement } from "@/content/widget";
import { findInScriptElements } from "@/lib/dom";
import { getI18nMessage } from "@/lib/i18n";
import { getSkinportSteamBot } from "@/lib/skinport";
import { TooltipTrigger } from "@radix-ui/react-tooltip";
import { BadgeCheck } from "lucide-react";
import { $ } from "select-dom";

async function profileVerified() {
  const profileSteamId = findInScriptElements(/steamid":"(\d+)","personaname"/);

  if (!profileSteamId) {
    return;
  }

  const skinportSteamBot = await getSkinportSteamBot(profileSteamId);

  if (!skinportSteamBot.verified) {
    return;
  }

  const profileNameElement = $(".actual_persona_name");

  if (!profileNameElement) {
    return;
  }

  const [widgetElement] = createWidgetElement(() => (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex gap-1">
          <BadgeCheck className="text-blue" />
          <div className="rounded bg-background p-1">
            <SkinportFish size={16} />
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        {getI18nMessage("steamcommunity_profileVerified_verifiedSkinportBot")}
      </TooltipContent>
    </Tooltip>
  ));

  const personaNameContainerElement = $(".persona_name");

  if (personaNameContainerElement) {
    personaNameContainerElement.style.overflow = "visible";
  }

  profileNameElement.style.display = "inline-flex";
  profileNameElement.style.alignItems = "center";
  profileNameElement.style.gap = "8px";
  profileNameElement.style.gap = "8px";

  profileNameElement.append(widgetElement);
}

featureManager.add(profileVerified, {
  name: "profile-verified",
  matchPathname: /\/(id|profiles)\/[\w]+/,
  awaitDomReady: true,
});
