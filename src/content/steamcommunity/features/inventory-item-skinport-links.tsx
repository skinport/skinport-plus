import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "@/components/ui/link";
import { Feature, featureManager } from "@/content/feature-manager";
import { createWidgetElement, widgetElementExists } from "@/content/widget";
import { getI18nMessage } from "@/lib/i18n";
import { getSkinportItemUrl } from "@/lib/skinport";
import { getHasItemExterior, supportedSteamAppIds } from "@/lib/steam";
import elementReady from "element-ready";
import { ChevronDown } from "lucide-react";
import { $ } from "select-dom";

const steamInventoryItemSkinportLinks: Feature = async ({
  getHasFeatureAttribute,
  setFeatureAttribute,
}) => {
  const cleanupItemFns: (() => void)[] = [];

  const cleanupPreviousItem = () => {
    for (const cleanupItemFn of cleanupItemFns) {
      cleanupItemFn();
    }
  };

  const addWidgetElements = () => {
    const itemInfoElement = $(
      ".inventory_page_right .inventory_iteminfo[style*='z-index: 1']",
      inventoryContentElement,
    );

    if (!itemInfoElement || getHasFeatureAttribute(itemInfoElement)) {
      return;
    }

    cleanupPreviousItem();

    const { removeFeatureAttribute } = setFeatureAttribute(itemInfoElement);

    cleanupItemFns.push(removeFeatureAttribute);

    const marketLinkElement = $(
      ".item_market_actions a[href*='/market/listings/']",
      itemInfoElement,
    );

    if (!marketLinkElement) {
      return;
    }

    const urlPathName = marketLinkElement.getAttribute("href")?.split("/");
    const itemName = urlPathName?.pop();
    const appId = urlPathName?.pop();

    if (!itemName || !(appId && supportedSteamAppIds.includes(appId))) {
      return;
    }

    const skinportItemUrl = getSkinportItemUrl(appId, itemName);
    const widgetName = `steam-inventory-item-skinport-link-${skinportItemUrl
      .split("/")
      .pop()}`;

    if (widgetElementExists(widgetName, itemInfoElement)) {
      return;
    }

    const inspectIngameElementHref =
      getHasItemExterior(itemName) &&
      $("a[href*='csgo_econ_action_preview']", itemInfoElement)?.getAttribute(
        "href",
      );

    const [viewOnSkinportElement, removeViewOnSkinportElement] =
      createWidgetElement(({ shadowRoot }) => {
        const viewOnSkinportButton = (
          <Button
            className={!inspectIngameElementHref ? "mb-4" : undefined}
            asChild
          >
            <Link href={skinportItemUrl} target="_blank">
              {getI18nMessage("common_viewOnSkinport")}
            </Link>
          </Button>
        );

        if (inspectIngameElementHref)
          return (
            <div className="flex mb-4 [&>*:first-child]:rounded-tr-none [&>*:first-child]:rounded-br-none [&>*:not(:first-child)]:rounded-tl-none [&>*:not(:first-child)]:rounded-bl-none [&>*:not(:first-child)]:border-l [&>*:not(:first-child)]:border-l-background">
              {viewOnSkinportButton}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="py-2 px-2">
                    <ChevronDown size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent container={shadowRoot}>
                  <DropdownMenuItem asChild>
                    <Link
                      href={`https://screenshot.skinport.com/direct?link=${inspectIngameElementHref}`}
                      target="_blank"
                    >
                      {getI18nMessage(
                        "steamcommunity_inventoryItemSkinportLinks_viewScreenshot",
                      )}
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );

        return viewOnSkinportButton;
      }, widgetName);

    cleanupItemFns.push(removeViewOnSkinportElement);

    const itemDescriptorsElement = $(".item_desc_descriptors", itemInfoElement);

    if (!itemDescriptorsElement) {
      return;
    }

    itemDescriptorsElement.insertAdjacentElement(
      "beforebegin",
      viewOnSkinportElement,
    );
  };

  const observer = new MutationObserver(() => {
    addWidgetElements();
  });

  const inventoryContentElement = await elementReady("#tabcontent_inventory", {
    stopOnDomReady: false,
    timeout: 30000,
  });

  if (!inventoryContentElement) {
    return;
  }

  observer.observe(inventoryContentElement, {
    childList: true,
    subtree: true,
  });
};

featureManager.add(steamInventoryItemSkinportLinks, {
  matchPathname: /\/(id|profiles)\/\w+\/inventory/,
  awaitDomReady: true,
});
