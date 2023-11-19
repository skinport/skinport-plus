import SkinportLogo from "@/components/skinport-logo";
import React, { useState, useEffect, useId } from "react";
import { createRoot } from "react-dom/client";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import optionsStorage, { optionsStorageDefaults } from "@/lib/options-storage";
import { useTranslation } from "react-i18next";
import i18n from "@/lib/i18n";
import "./index.css";

i18n.setDefaultNamespace("options");

function OptionField({
  labelKey,
  descriptionKey,
  ...switchProps
}: {
  labelKey: string;
  descriptionKey?: string;
} & React.ComponentPropsWithoutRef<typeof Switch>) {
  const { t } = useTranslation();
  const id = useId();

  return (
    <div className="bg-card px-8 py-6 flex flex-row items-center gap-8">
      <div className="space-y-1 flex-1">
        <Label htmlFor={id}>{t(labelKey)}</Label>
        {descriptionKey && <p>{t(descriptionKey)}</p>}
      </div>
      <div>
        <Switch {...switchProps} id={id} />
      </div>
    </div>
  );
}

function App() {
  const [options, setOptions] = useState<typeof optionsStorageDefaults>();
  const { t } = useTranslation();

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
            {t("headerTitle")}
          </div>
        </div>
      </header>
      <div className="bg-background px-8 py-12 mt-[78px] max-w-screen-md mx-auto">
        <h1 className="text-white text-5xl font-semibold mb-8">
          {t("pageTitle")}
        </h1>
        {options && (
          <>
            <h2 className="text-white font-semibold mb-5">Steam Community</h2>
            <div className="space-y-0.5">
              <OptionField
                labelKey="checkSteamAccountSecurity.label"
                descriptionKey="checkSteamAccountSecurity.description"
                defaultChecked={options.checkSteamAccountSecurity}
                onCheckedChange={(checked) =>
                  optionsStorage.set({
                    checkSteamAccountSecurity: checked,
                  })
                }
              />
              <OptionField
                labelKey="checkTradeOffer.label"
                descriptionKey="checkTradeOffer.description"
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
