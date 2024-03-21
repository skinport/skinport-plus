import { getI18nMessage } from "@/lib/i18n";
import { getSkinportItemUrl, getSkinportScreenshotUrl } from "@/lib/skinport";
import type { SteamItem } from "@/lib/steam";
import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { InterpolateMessage } from "./interpolate-message";
import { SkinportLogo } from "./skinport-logo";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Link } from "./ui/link";

export function SteamItemSkinportActions({
  item,
  className,
  container,
  children,
  actionType = "view",
}: {
  item: Pick<
    SteamItem,
    "appId" | "marketHashName" | "inspectIngameLink" | "exterior"
  >;
  className?: string;
  container: HTMLElement;
  children?: ReactNode;
  actionType?: "view" | "buy" | "sell";
}) {
  const itemSkinportLink = getSkinportItemUrl(item);

  if (!itemSkinportLink) {
    return;
  }

  const viewOnSkinportButton = (
    <Button className={className} asChild>
      <Link href={itemSkinportLink} target="_blank">
        <InterpolateMessage
          message={getI18nMessage(`common_${actionType}OnSkinport`)}
          values={{
            skinportLogo: <SkinportLogo size={10} />,
          }}
        />
      </Link>
    </Button>
  );

  const itemSkinportScreenshotUrl =
    item.inspectIngameLink &&
    item.exterior &&
    getSkinportScreenshotUrl(`direct?link=${item.inspectIngameLink}`);

  if (itemSkinportScreenshotUrl || children) {
    return (
      <div className="flex mb-4 [&>*:first-child]:rounded-tr-none [&>*:first-child]:rounded-br-none [&>*:not(:first-child)]:rounded-tl-none [&>*:not(:first-child)]:rounded-bl-none [&>*:not(:first-child)]:border-l [&>*:not(:first-child)]:border-l-background">
        {viewOnSkinportButton}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="py-2 px-2">
              <ChevronDown size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent container={container}>
            {itemSkinportScreenshotUrl && (
              <DropdownMenuItem asChild>
                <Link href={itemSkinportScreenshotUrl} target="_blank">
                  {getI18nMessage(
                    "steamcommunity_inventoryItemSkinportLinks_viewScreenshot",
                  )}
                </Link>
              </DropdownMenuItem>
            )}
            {children}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return viewOnSkinportButton;
}
