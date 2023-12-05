import { InterpolateMessage } from "@/components/interpolate-message";
import { SkinportLogo } from "@/components/skinport-logo";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import { getI18nMessage } from "@/lib/i18n";
import { getSkinportUrl } from "@/lib/skinport";
import { ShieldAlert } from "lucide-react";
import { createRoot } from "react-dom/client";
import browser from "webextension-polyfill";
import "./index.css";

function App() {
  const blockedUrl = new URLSearchParams(window.location.search).get(
    "blockedUrl",
  );
  const blockedHost = blockedUrl && new URL(blockedUrl).host;

  return (
    <div className="h-screen flex justify-center items-center px-8">
      <div className="flex flex-col items-center gap-4 text-center max-w-3xl">
        <div className="flex flex-col items-center">
          <SkinportLogo />
        </div>
        <div className="flex flex-col items-center text-[#e05a59]">
          <ShieldAlert size="64" />
        </div>
        <div className="space-y-2">
          <h1 className="font-semibold text-lg text-white">
            {getI18nMessage("phishingBlocker_title")}
          </h1>
          <p>
            <InterpolateMessage
              message={getI18nMessage("phishingBlocker_description_paragraph1")}
              values={{ blockedHost }}
            />
          </p>
          <p>
            <InterpolateMessage
              message={getI18nMessage("phishingBlocker_description_paragraph2")}
              values={{
                skinportLink: (
                  <Link
                    className="text-white hover:text-red transition-colors"
                    href={getSkinportUrl()}
                  />
                ),
              }}
            />
          </p>
        </div>
        <Button asChild>
          <Link href={getSkinportUrl()}>
            {getI18nMessage("phishingBlocker_goToSkinport")}
          </Link>
        </Button>
        {blockedHost && blockedUrl && (
          <p className="text-xs">
            <InterpolateMessage
              message={getI18nMessage(
                "phishingBlocker_visitPotentiallyUnsafeSite",
              )}
              values={{
                potentiallyUnsafeSiteLink: (
                  <Link
                    onClick={async (event) => {
                      event.preventDefault();

                      const sessionRules =
                        await browser.declarativeNetRequest.getSessionRules();

                      await browser.declarativeNetRequest.updateSessionRules({
                        addRules: [
                          {
                            id: sessionRules.length + 1,
                            priority: 1,
                            action: {
                              type: "allow",
                            },
                            condition: {
                              resourceTypes: ["main_frame", "sub_frame"],
                              requestDomains: [blockedHost],
                            },
                          },
                        ],
                      });

                      window.location.href = blockedUrl;
                    }}
                    href={blockedUrl}
                  />
                ),
              }}
            />
          </p>
        )}
      </div>
    </div>
  );
}

const rootElement = document.getElementById("root");

if (rootElement) {
  createRoot(rootElement).render(<App />);
}
