import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import SkinportLogo from "@/components/skinport-logo";
import { ShieldAlert } from "lucide-react";
import { Link } from "@/components/ui/link";
import { Button } from "@/components/ui/button";
import browser from "webextension-polyfill";

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
            Potential Skinport phishing site ahead
          </h1>
          <p>
            Skinport extension has blocked access to{" "}
            {blockedHost ? <strong>{blockedHost}</strong> : "the website"},
            because it potentially pretends to be Skinport and may trick you
            into doing something dangerous like revealing your Steam account
            information such as email, password and Steam Web API key.
          </p>
          <p>
            Please make sure to only visit our official website{" "}
            <Link
              className="text-white hover:text-red transition-colors"
              href="https://skinport.com"
            >
              skinport.com
            </Link>
          </p>
        </div>
        <Button asChild>
          <Link href="https://skinport.com">Go to Skinport.com</Link>
        </Button>
        {blockedHost && blockedUrl && (
          <p className="text-xs">
            If you understand the risks to your security, visit{" "}
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
            >
              this potentially unsafe site
            </Link>
            .
          </p>
        )}
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
