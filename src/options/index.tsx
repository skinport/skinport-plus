import SkinportLogo from "@/components/skinport-logo";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { DialogHeader } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { I18nMessageKey, getI18nMessage } from "@/lib/i18n";
import optionsStorage, { optionsStorageDefaults } from "@/lib/options-storage";
import {
  getHasAllUrlsPermission,
  requestAllUrlsPermission,
} from "@/lib/permissions";
import React, { useEffect, useId, useState } from "react";
import { createRoot } from "react-dom/client";
import Browser from "webextension-polyfill";
import "./index.css";

function OptionField({
  labelKey,
  descriptionKey,
  ...switchProps
}: {
  labelKey: I18nMessageKey;
  descriptionKey?: I18nMessageKey;
} & React.ComponentPropsWithoutRef<typeof Switch>) {
  const id = useId();

  return (
    <div className="bg-card px-8 py-6 flex flex-row items-center gap-8">
      <div className="space-y-1 flex-1">
        <Label htmlFor={id}>{getI18nMessage(labelKey)}</Label>
        {descriptionKey && <p>{getI18nMessage(descriptionKey)}</p>}
      </div>
      <div>
        <Switch {...switchProps} id={id} />
      </div>
    </div>
  );
}

function App() {
  const [options, setOptions] = useState<typeof optionsStorageDefaults>();
  const [hasAllUrlsPermissions, setHasAllUrlsPermission] = useState(true);

  useEffect(() => {
    const initOptions = async () => {
      setOptions(await optionsStorage.getAll());
    };

    const initAllUrlsPermission = async () => {
      setHasAllUrlsPermission(await getHasAllUrlsPermission());

      setInterval(async () => {
        setHasAllUrlsPermission(await getHasAllUrlsPermission());
      }, 1000);
    };

    initOptions();
    initAllUrlsPermission();
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
            {getI18nMessage("options_headerTitle")}
          </div>
        </div>
      </header>
      <div className="bg-background px-8 py-12 mt-[78px] max-w-screen-md mx-auto">
        <h1 className="text-white text-5xl font-semibold mb-8">
          {getI18nMessage("options_pageTitle")}
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
      <Dialog open={!hasAllUrlsPermissions}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {getI18nMessage("options_permissionsRequired_title")}
            </DialogTitle>
          </DialogHeader>
          <p>
            {getI18nMessage(
              "options_permissionsRequired_description_paragraph1",
            )}
          </p>
          <p>
            {getI18nMessage(
              "options_permissionsRequired_description_paragraph2",
            )}
          </p>
          <DialogFooter>
            <Button
              onClick={() => {
                requestAllUrlsPermission();
              }}
            >
              {getI18nMessage("options_permissionsRequired_grantPermission")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

const rootElement = document.getElementById("root");

if (rootElement) {
  createRoot(rootElement).render(<App />);
}
