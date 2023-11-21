import ky from "ky";
import { createWidgetElement } from "../widget";
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
import { Trans, useTranslation } from "react-i18next";
import { Link } from "@/components/ui/link";
import featureManager from "../feature-manager";

async function steamAccountSecurityCheck() {
  const webApiKeyRepsonse = await ky("/dev/apikey").text();

  const isWebApiKeyExposed = webApiKeyRepsonse.includes(
    'action="https://steamcommunity.com/dev/revokekey"',
  );

  if (!isWebApiKeyExposed) {
    return;
  }

  const [securityCheckElement] = createWidgetElement(({ shadowRoot }) => {
    const { t } = useTranslation();

    return (
      <div className="bg-[#e05a59] p-2 flex gap-4 justify-center items-center">
        <p className="font-semibold text-white">
          {t("steamAccountSecurityCheck.banner.title")}
        </p>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                {t("steamAccountSecurityCheck.banner.review")}
              </Button>
            </DialogTrigger>
            <DialogContent container={shadowRoot}>
              <SkinportLogo width={96} />
              <DialogHeader>
                <DialogTitle>
                  {t(
                    "steamAccountSecurityCheck.dialog.steamWebApiKeyExposed.title",
                  )}
                </DialogTitle>
                <DialogDescription>
                  {t(
                    "steamAccountSecurityCheck.dialog.steamWebApiKeyExposed.description.paragraph1",
                  )}
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-2">
                <p>
                  {t(
                    "steamAccountSecurityCheck.dialog.steamWebApiKeyExposed.description.paragraph2",
                  )}
                </p>
                <div>
                  <Button asChild>
                    <Link
                      href="https://store.steampowered.com/twofactor/manage"
                      target="_blank"
                    >
                      {t(
                        "steamAccountSecurityCheck.dialog.steamWebApiKeyExposed.deauthorizeAllDevices",
                      )}
                      <ExternalLink className="text-white" size={16} />
                    </Link>
                  </Button>
                </div>
                <p className="mt-2">
                  {t(
                    "steamAccountSecurityCheck.dialog.steamWebApiKeyExposed.description.paragraph3",
                  )}
                </p>
                <div>
                  <Button asChild>
                    <Link
                      href="https://steamcommunity.com/dev/apikey"
                      target="_blank"
                    >
                      {t(
                        "steamAccountSecurityCheck.dialog.steamWebApiKeyExposed.revokeSteamWebApiKey",
                      )}
                      <ExternalLink className="text-white" size={16} />
                    </Link>
                  </Button>
                </div>
                <p>
                  {t(
                    "steamAccountSecurityCheck.dialog.steamWebApiKeyExposed.description.paragraph4",
                  )}
                </p>
                <div>
                  <Button asChild>
                    <Link
                      href="https://help.steampowered.com/en/wizard/HelpChangePassword"
                      target="_blank"
                    >
                      {t(
                        "steamAccountSecurityCheck.dialog.steamWebApiKeyExposed.changePassword",
                      )}
                      <ExternalLink className="text-white" size={16} />
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="font-semibold text-white text-base">
                  {t(
                    "steamAccountSecurityCheck.dialog.steamWebApiKeyExplained.title",
                  )}
                </h3>
                <p>
                  <Trans
                    i18nKey="steamAccountSecurityCheck.dialog.steamWebApiKeyExplained.description"
                    components={[
                      <Link
                        href="https://steamcommunity.com/dev/apiterms"
                        target="_blank"
                      />,
                    ]}
                  />
                </p>
              </div>
              <DialogFooter>
                <p className="text-xs text-[#6b6d6e] flex-1">
                  {t("securityProvidedBySkinportBrowserExtension")}
                </p>
                <DialogClose asChild>
                  <Button variant="ghost">{t("close")}</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  });

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
  host: "steamcommunity.com",
  optionKey: "checkSteamAccountSecurity",
});
