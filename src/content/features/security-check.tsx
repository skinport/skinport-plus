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

export default async function securityCheck() {
  const webApiKeyRepsonse = await ky("/dev/apikey").text();

  const isWebApiKeyExposed = webApiKeyRepsonse.includes(
    'action="https://steamcommunity.com/dev/revokekey"'
  );

  if (!isWebApiKeyExposed) {
    return;
  }

  const [securityCheckElement, removeSecurityCheckElement] =
    createWidgetElement((shadowRoot) => (
      <div className="bg-skinport-bg p-4 fixed right-4 bottom-4 w-96 flex flex-col gap-4 z-[1000] shadow-xl rounded animate-in fade-in slide-in-from-bottom-4 duration-500">
        <SkinportLogo width={96} />
        <div className="flex flex-col gap-2">
          <h2 className="font-semibold text-skinport-white text-lg">
            Security vulnerabilities detected on your Steam account
          </h2>
          <p>
            We've detected one or more security vulnerabilities on your Steam
            account that can be exploited to access to your account and
            inventory unknowingly by malicious actors.
          </p>
          <p>
            We recommend you to review them and take actions immediately to keep
            your account and inventory safe.
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button>Review</Button>
            </DialogTrigger>
            <DialogContent container={shadowRoot}>
              <SkinportLogo width={96} />
              <DialogHeader>
                <DialogTitle>
                  Review your Steam account security vulnerabilities
                </DialogTitle>
                <DialogDescription>
                  Lorem ipsum, dolor sit amet consectetur adipisicing elit.
                  Expedita autem sint quisquam, eligendi itaque sit! Placeat in
                  quam, illo commodi unde explicabo minima fugit veritatis,
                  eveniet tenetur maxime? Saepe, quam.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-2">
                <h3 className="font-semibold text-skinport-white text-base">
                  Steam Web API Key exposed
                </h3>
                <p>
                  A Steam Web API Key has been detected on your account, which
                  can be used by a malicious actor to control your account and
                  inventory, such as accepting or declining trade offers. It's
                  commonly used as part of phishing attacks to steal
                  inventories.
                </p>
                <p>
                  If you haven't registered a Steam Web API Key yourself, please
                  revoke it immediately.
                </p>
                <div>
                  <Button asChild>
                    <a
                      href="https://steamcommunity.com/dev/apikey"
                      target="_blank"
                      className="inline-flex gap-2 items-center"
                    >
                      Revoke Steam Web API Key{" "}
                      <ExternalLink className="text-white" size={16} />
                    </a>
                  </Button>
                </div>
                <p className="mt-2">
                  We also highly recommend to change your password and
                  deauthorize all devices, to log out any malicious actor.
                </p>
                <p>
                  If you haven't registered a Steam Web API Key yourself, please
                  change your password and deauthorize all devices immediately.
                </p>
                <div>
                  <Button asChild>
                    <a
                      href="https://help.steampowered.com/en/wizard/HelpChangePassword"
                      target="_blank"
                      className="inline-flex gap-2 items-center"
                    >
                      Change password
                      <ExternalLink className="text-white" size={16} />
                    </a>
                  </Button>
                </div>
                <div>
                  <Button asChild>
                    <a
                      href="https://store.steampowered.com/twofactor/manage"
                      target="_blank"
                      className="inline-flex gap-2 items-center"
                    >
                      Deauthorize all devices{" "}
                      <ExternalLink className="text-white" size={16} />
                    </a>
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <p className="text-xs text-[#6b6d6e] flex-1">
                  Security provided by Skinport browser extension
                </p>
                <DialogClose asChild>
                  <Button variant="ghost">Close</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="ghost" onClick={() => removeSecurityCheckElement()}>
            Dismiss
          </Button>
        </div>
        <p className="text-xs text-[#6b6d6e]">
          Security provided by Skinport browser extension
        </p>
      </div>
    ));

  document.body.append(securityCheckElement);
}
