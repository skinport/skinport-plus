import { getI18nMessage } from "@/lib/i18n";
import { getSkinportItemUrl, getSkinportScreenshotUrl } from "@/lib/skinport";
import { Item } from "@/lib/steam";
import { ChevronDown } from "lucide-react";
import { ReactNode } from "react";
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

export function ItemSkinportActions({
  item,
  inspectIngameLink,
  className,
  container,
  children,
  action = "view",
}: {
  item: Item;
  inspectIngameLink?: string;
  className?: string;
  container: HTMLElement;
  children?: ReactNode;
  action?: "view" | "buy" | "sell";
}) {
  const viewOnSkinportButton = (
    <Button className={className} asChild>
      <Link href={getSkinportItemUrl(item)} target="_blank">
        <InterpolateMessage
          message={getI18nMessage(`common_${action}OnSkinport`)}
          values={{
            skinportLogo: <SkinportLogo size={10} />,
          }}
        />
      </Link>
    </Button>
  );

  if (inspectIngameLink || children)
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
            {inspectIngameLink && (
              <DropdownMenuItem asChild>
                <Link
                  href={getSkinportScreenshotUrl(
                    `direct?link=${inspectIngameLink}`,
                  )}
                  target="_blank"
                >
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

  return viewOnSkinportButton;
}
