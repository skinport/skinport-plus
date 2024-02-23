import { SkinportPlusLogo } from "@/components/skinport-plus-logo";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { DialogHeader } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { I18nMessageKey, getI18nMessage } from "@/lib/i18n";
import { optionsStorage, optionsStorageDefaults } from "@/lib/options-storage";
import {
  getHasAllUrlsPermission,
  requestAllUrlsPermission,
} from "@/lib/permissions";
import { getSkinportUrl } from "@/lib/skinport";
import React, { useEffect, useId, useState } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

function OptionField({
  label,
  labelKey,
  description,
  descriptionKey,
  ...switchProps
}: {
  label?: string;
  labelKey?: I18nMessageKey;
  description?: string;
  descriptionKey?: I18nMessageKey;
} & React.ComponentPropsWithoutRef<typeof Switch>) {
  const id = useId();

  return (
    <div className="bg-card px-8 py-6 flex flex-row items-center gap-8">
      <div className="space-y-1 flex-1">
        <Label htmlFor={id}>
          {labelKey ? getI18nMessage(labelKey) : label}
        </Label>
        {(descriptionKey || description) && (
          <p>{descriptionKey ? getI18nMessage(descriptionKey) : description}</p>
        )}
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
    };

    initOptions();
    initAllUrlsPermission();
  }, []);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 max-w-screen-md mx-auto">
        <div className="bg-[#232728] border-b-2 border-[#1d2021] px-8 py-6 tracking-widest">
          <div className="flex flex-row gap-4 uppercase text-white font-bold text-xl items-baseline">
            <a
              href={getSkinportUrl()}
              target="_blank"
              rel="noopener noreferrer"
            >
              <SkinportPlusLogo />
            </a>
            {getI18nMessage("options_pageTitle")}
          </div>
        </div>
      </header>
      <div className="bg-background px-8 py-12 mt-[78px] max-w-screen-md mx-auto">
        <h1 className="text-white font-semibold mb-8">Steam Community</h1>
        {options && (
          <>
            <div className="space-y-8">
              <div className="space-y-4">
                <h3>{getI18nMessage("options_steamCommunity_account")}</h3>
                <div className="space-y-0.5">
                  <OptionField
                    labelKey="options_steamCommunityAccountCheckSecurityVulnerabilities_label"
                    descriptionKey="options_steamCommunityAccountCheckSecurityVulnerabilities_description"
                    defaultChecked={
                      options.steamCommunityAccountCheckSecurityVulnerabilities
                    }
                    onCheckedChange={(checked) =>
                      optionsStorage.set({
                        steamCommunityAccountCheckSecurityVulnerabilities:
                          checked,
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-4">
                <h3>{getI18nMessage("options_steamCommunity_inventories")}</h3>
                <div className="space-y-0.5">
                  <OptionField
                    labelKey="options_steamCommunityInventoryShowItemPrices_label"
                    descriptionKey="options_steamCommunityInventoryShowItemPrices_description"
                    defaultChecked={
                      options.steamCommunityInventoryShowItemPrices
                    }
                    onCheckedChange={(checked) =>
                      optionsStorage.set({
                        steamCommunityInventoryShowItemPrices: checked,
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-4">
                <h3>{getI18nMessage("options_steamCommunity_tradeOffers")}</h3>
                <div className="space-y-0.5">
                  <OptionField
                    labelKey="options_steamCommunityTradeOffersVerifyTradePartner_label"
                    descriptionKey="options_steamCommunityTradeOffersVerifyTradePartner_description"
                    defaultChecked={
                      options.steamCommunityTradeOffersVerifyTradePartner
                    }
                    onCheckedChange={(checked) =>
                      optionsStorage.set({
                        steamCommunityTradeOffersVerifyTradePartner: checked,
                      })
                    }
                  />
                  <OptionField
                    labelKey="options_steamCommunityTradeOffersShowItemPrices_label"
                    descriptionKey="options_steamCommunityTradeOffersShowItemPrices_description"
                    defaultChecked={
                      options.steamCommunityTradeOffersShowItemPrices
                    }
                    onCheckedChange={(checked) =>
                      optionsStorage.set({
                        steamCommunityTradeOffersShowItemPrices: checked,
                      })
                    }
                  />
                  <OptionField
                    labelKey="options_steamCommunityTradeOffersShowTotalTradeValues_label"
                    descriptionKey="options_steamCommunityTradeOffersShowTotalTradeValues_description"
                    defaultChecked={
                      options.steamCommunityTradeOffersShowTotalTradeValues
                    }
                    onCheckedChange={(checked) =>
                      optionsStorage.set({
                        steamCommunityTradeOffersShowTotalTradeValues: checked,
                      })
                    }
                  />
                </div>
              </div>
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
              onClick={async () => {
                setHasAllUrlsPermission(await requestAllUrlsPermission());
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
