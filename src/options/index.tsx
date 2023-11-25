import SkinportLogo from "@/components/skinport-logo";
import React, { useState, useEffect, useId } from "react";
import { createRoot } from "react-dom/client";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import optionsStorage, { optionsStorageDefaults } from "@/lib/options-storage";
import browser from "webextension-polyfill";
import "./index.css";

function OptionField({
  labelKey,
  descriptionKey,
  ...switchProps
}: {
  labelKey: string;
  descriptionKey?: string;
} & React.ComponentPropsWithoutRef<typeof Switch>) {
  const id = useId();

  return (
    <div className="bg-card px-8 py-6 flex flex-row items-center gap-8">
      <div className="space-y-1 flex-1">
        <Label htmlFor={id}>{browser.i18n.getMessage(labelKey)}</Label>
        {descriptionKey && <p>{browser.i18n.getMessage(descriptionKey)}</p>}
      </div>
      <div>
        <Switch {...switchProps} id={id} />
      </div>
    </div>
  );
}

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
            {browser.i18n.getMessage("options_headerTitle")}
          </div>
        </div>
      </header>
      <div className="bg-background px-8 py-12 mt-[78px] max-w-screen-md mx-auto">
        <h1 className="text-white text-5xl font-semibold mb-8">
          {browser.i18n.getMessage("options_pageTitle")}
        </h1>
        {options && (
          <>
            <h2 className="text-white font-semibold mb-5">Steam Community</h2>
            <div className="space-y-0.5">
              <OptionField
                labelKey="options_checkSteamAccountSecurity_label"
                descriptionKey="options_checkSteamAccountSecurity_description"
                defaultChecked={options.checkSteamAccountSecurity}
                onCheckedChange={(checked) =>
                  optionsStorage.set({
                    checkSteamAccountSecurity: checked,
                  })
                }
              />
              <OptionField
                labelKey="options_checkTradeOffer_label"
                descriptionKey="options_checkTradeOffer_description"
                defaultChecked={options.checkTradeOffer}
                onCheckedChange={(checked) =>
                  optionsStorage.set({ checkTradeOffer: checked })
                }
              />
            </div>
          </>
        )}
      </div>
    </>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
