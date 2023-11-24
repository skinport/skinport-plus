import { createWidgetElement } from "@/content/widget";
import React from "react";
import SkinportLogo from "@/components/skinport-logo";
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
import { ExternalLink } from "lucide-react";
import { $ } from "select-dom";
import { Trans } from "react-i18next";
import { Link } from "@/components/ui/link";
import featureManager from "@/content/feature-manager";
import browser from "webextension-polyfill";

async function steamAccountSecurityCheck() {
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

  const [securityCheckElement] = createWidgetElement(({ shadowRoot }) => (
    <div className="bg-[#e05a59] p-2 flex gap-4 justify-center items-center">
      <p className="font-semibold text-white">
        {browser.i18n.getMessage(
          "steamcommunity_accountSecurityCheck_banner_title",
        )}
      </p>
      <div className="flex gap-2">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              {browser.i18n.getMessage(
                "steamcommunity_accountSecurityCheck_banner_review",
              )}
            </Button>
          </DialogTrigger>
          <DialogContent container={shadowRoot}>
            <SkinportLogo width={96} />
            <DialogHeader>
              <DialogTitle>
                {browser.i18n.getMessage(
                  "steamcommunity_accountSecurityCheck_dialog_steamWebApiKeyExposed_title",
                )}
              </DialogTitle>
              <DialogDescription>
                {browser.i18n.getMessage(
                  "steamcommunity_accountSecurityCheck_dialog_steamWebApiKeyExposed_description_paragraph1",
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              <p>
                {browser.i18n.getMessage(
                  "steamcommunity_accountSecurityCheck_dialog_steamWebApiKeyExposed_description_paragraph2",
                )}
              </p>
              <div>
                <Button asChild>
                  <Link
                    href="https://store.steampowered.com/twofactor/manage"
                    target="_blank"
                  >
                    {browser.i18n.getMessage(
                      "steamcommunity_accountSecurityCheck_dialog_steamWebApiKeyExposed_deauthorizeAllDevices",
                    )}
                    <ExternalLink className="text-white" size={16} />
                  </Link>
                </Button>
              </div>
              <p className="mt-2">
                {browser.i18n.getMessage(
                  "steamcommunity_accountSecurityCheck_dialog_steamWebApiKeyExposed_description_paragraph3",
                )}
              </p>
              <div>
                <Button asChild>
                  <Link
                    href="https://steamcommunity.com/dev/apikey"
                    target="_blank"
                  >
                    {browser.i18n.getMessage(
                      "steamcommunity_accountSecurityCheck_dialog_steamWebApiKeyExposed_revokeSteamWebApiKey",
                    )}
                    <ExternalLink className="text-white" size={16} />
                  </Link>
                </Button>
              </div>
              <p>
                {browser.i18n.getMessage(
                  "steamcommunity_accountSecurityCheck_dialog_steamWebApiKeyExposed_description_paragraph4",
                )}
              </p>
              <div>
                <Button asChild>
                  <Link
                    href="https://help.steampowered.com/en/wizard/HelpChangePassword"
                    target="_blank"
                  >
                    {browser.i18n.getMessage(
                      "steamcommunity_accountSecurityCheck_dialog_steamWebApiKeyExposed_changePassword",
                    )}
                    <ExternalLink className="text-white" size={16} />
                  </Link>
                </Button>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="font-semibold text-white text-base">
                {browser.i18n.getMessage(
                  "steamcommunity_accountSecurityCheck_dialog_steamWebApiKeyExplained_title",
                )}
              </h3>
              <p>
                <Trans
                  components={[
                    <Link
                      href="https://steamcommunity.com/dev/apiterms"
                      target="_blank"
                    />,
                  ]}
                >
                  {browser.i18n.getMessage(
                    "steamcommunity_accountSecurityCheck_dialog_steamWebApiKeyExplained_description",
                  )}
                </Trans>
              </p>
            </div>
            <DialogFooter>
              <p className="text-xs text-[#6b6d6e] flex-1">
                {browser.i18n.getMessage(
                  "common_securityProvidedBySkinportPlus",
                )}
              </p>
              <DialogClose asChild>
                <Button variant="ghost">
                  {browser.i18n.getMessage("common_close")}
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  ));

  if (document.body.classList.contains("headerless_page")) {
    document.body.prepend(securityCheckElement);

    return;
  }

  const globalHeaderElement = $("#global_header");

  if (globalHeaderElement) {
    globalHeaderElement.insertAdjacentElement("afterend", securityCheckElement);
  }
}

featureManager.add(steamAccountSecurityCheck, {
  optionKey: "checkSteamAccountSecurity",
  awaitDomReady: true,
});
