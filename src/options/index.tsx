import SkinportLogo from "@/components/skinport-logo";
import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import optionsStorage, { optionsStorageDefaults } from "@/lib/options-storage";

function App() {
  const [options, setOptions] = useState<typeof optionsStorageDefaults>();

  useEffect(() => {
    const loadOptions = async () => {
      setOptions(await optionsStorage.getAll());
    };

    loadOptions();
  }, []);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 max-w-screen-md mx-auto">
        <div className="bg-[#232728] border-b-2 border-[#1d2021] px-8 py-6 tracking-widest">
          <div className="flex flex-row gap-4 uppercase text-white font-bold text-xl items-center">
            <a
              href="https://skinport.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <SkinportLogo />
            </a>
            Browser Extension
          </div>
        </div>
      </header>
      <div className="bg-background px-8 py-12 mt-[78px] max-w-screen-md mx-auto">
        <h1 className="text-white text-5xl font-semibold mb-8">Settings</h1>
        {options && (
          <>
            <h2 className="text-white font-semibold mb-5">Steam Community</h2>
            <div className="space-y-0.5">
              <div className="bg-card px-8 py-6 flex flex-row items-center gap-8">
                <div className="space-y-1">
                  <Label htmlFor="steamAccountSecurityCheck">
                    Check for Steam account security vulnerabilities
                  </Label>
                  <p>
                    Lorem ipsum dolor sit amet consectetur adipisicing elit. Qui
                    laborum voluptas corrupti quo suscipit aliquid natus, odit
                    beatae quas dolore harum iusto rerum.
                  </p>
                </div>
                <div>
                  <Switch
                    id="steamAccountSecurityCheck"
                    defaultChecked={options.steamAccountSecurityCheck}
                    onCheckedChange={(checked) =>
                      optionsStorage.set({ steamAccountSecurityCheck: checked })
                    }
                  />
                </div>
              </div>
              <div className="bg-card px-8 py-6 flex flex-row items-center gap-8">
                <div className="space-y-1">
                  <Label htmlFor="steamTradePartnerCheck">
                    Check Trade offer
                  </Label>
                  <p>
                    Lorem ipsum dolor sit amet consectetur adipisicing elit. Qui
                    laborum voluptas corrupti quo suscipit aliquid natus, odit
                    beatae quas dolore harum iusto rerum.
                  </p>
                </div>
                <div>
                  <Switch
                    id="steamTradePartnerCheck"
                    defaultChecked={options.steamTradeOfferCheck}
                    onCheckedChange={(checked) =>
                      optionsStorage.set({ steamTradeOfferCheck: checked })
                    }
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
