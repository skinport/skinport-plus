import { InterpolateMessage } from "@/components/interpolate-message";
import { SkinportLogo } from "@/components/skinport-logo";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Link } from "@/components/ui/link";
import { featureManager } from "@/content/feature-manager";
import { createWidgetElement, widgetElementExists } from "@/content/widget";
import { getI18nMessage } from "@/lib/i18n";
import { ExternalLink } from "lucide-react";
import { $ } from "select-dom";

const WIDGET_NAME = "account-security-check";

async function accountSecurityCheck() {
  if (widgetElementExists(WIDGET_NAME)) {
    return;
  }

  const webApiKeyRepsonse = await fetch("/dev/apikey").then((response) => {
    if (!response.ok) {
      throw new Error(response.statusText);
    }

    return response.text();
  });

  const isWebApiKeyExposed =
    webApiKeyRepsonse.indexOf(
      'action="https://steamcommunity.com/dev/revokekey"',
    ) !== -1;

  if (!isWebApiKeyExposed) {
    return;
  }

  const [securityCheckElement] = createWidgetElement(
    ({ shadowRoot }) => (
      <div className="bg-[#e05a59] p-2 flex gap-4 justify-center items-center">
        <p className="font-semibold text-white">
          {getI18nMessage("steamcommunity_accountSecurityCheck_banner_title")}
        </p>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                {getI18nMessage(
                  "steamcommunity_accountSecurityCheck_banner_review",
                )}
              </Button>
            </DialogTrigger>
            <DialogContent container={shadowRoot}>
              <SkinportLogo width={96} />
              <DialogHeader>
                <DialogTitle>
                  {getI18nMessage(
                    "steamcommunity_accountSecurityCheck_dialog_steamWebApiKeyExposed_title",
                  )}
                </DialogTitle>
                <DialogDescription>
                  {getI18nMessage(
                    "steamcommunity_accountSecurityCheck_dialog_steamWebApiKeyExposed_description_paragraph1",
                  )}
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-2">
                <p>
                  {getI18nMessage(
                    "steamcommunity_accountSecurityCheck_dialog_steamWebApiKeyExposed_description_paragraph2",
                  )}
                </p>
                <div>
                  <Button asChild>
                    <Link
                      href="https://store.steampowered.com/twofactor/manage"
                      target="_blank"
                    >
                      {getI18nMessage(
                        "steamcommunity_accountSecurityCheck_dialog_steamWebApiKeyExposed_deauthorizeAllDevices",
                      )}
                      <ExternalLink className="text-white" size={16} />
                    </Link>
                  </Button>
                </div>
                <p className="mt-2">
                  {getI18nMessage(
                    "steamcommunity_accountSecurityCheck_dialog_steamWebApiKeyExposed_description_paragraph3",
                  )}
                </p>
                <div>
                  <Button asChild>
                    <Link
                      href="https://steamcommunity.com/dev/apikey"
                      target="_blank"
                    >
                      {getI18nMessage(
                        "steamcommunity_accountSecurityCheck_dialog_steamWebApiKeyExposed_revokeSteamWebApiKey",
                      )}
                      <ExternalLink className="text-white" size={16} />
                    </Link>
                  </Button>
                </div>
                <p>
                  {getI18nMessage(
                    "steamcommunity_accountSecurityCheck_dialog_steamWebApiKeyExposed_description_paragraph4",
                  )}
                </p>
                <div>
                  <Button asChild>
                    <Link
                      href="https://help.steampowered.com/en/wizard/HelpChangePassword"
                      target="_blank"
                    >
                      {getI18nMessage(
                        "steamcommunity_accountSecurityCheck_dialog_steamWebApiKeyExposed_changePassword",
                      )}
                      <ExternalLink className="text-white" size={16} />
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="font-semibold text-white text-base">
                  {getI18nMessage(
                    "steamcommunity_accountSecurityCheck_dialog_steamWebApiKeyExplained_title",
                  )}
                </h3>
                <p>
                  <InterpolateMessage
                    message={getI18nMessage(
                      "steamcommunity_accountSecurityCheck_dialog_steamWebApiKeyExplained_description",
                    )}
                    values={{
                      0: (
                        <Link
                          href="https://steamcommunity.com/dev/apiterms"
                          target="_blank"
                        />
                      ),
                    }}
                  />
                </p>
              </div>
              <DialogFooter>
                <p className="text-xs text-[#6b6d6e] flex-1">
                  {getI18nMessage("common_securityProvidedBySkinportPlus")}
                </p>
                <DialogClose asChild>
                  <Button variant="ghost">
                    {getI18nMessage("common_close")}
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    ),
    WIDGET_NAME,
  );

  if (document.body.classList.contains("headerless_page")) {
    document.body.prepend(securityCheckElement);

    return;
  }

  const globalHeaderElement = $("#global_header");

  if (globalHeaderElement) {
    globalHeaderElement.insertAdjacentElement("afterend", securityCheckElement);
  }
}

featureManager.add(accountSecurityCheck, {
  name: "account-security-check",
  optionKey: "checkSteamAccountSecurity",
  awaitDomReady: true,
});
