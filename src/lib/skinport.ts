import { steamAppIdNames } from "./steam";

export function getSkinportItemSlug(itemName: string) {
  return decodeURIComponent(itemName)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getSkinportItemUrl(steamAppId: string, steamItemName: string) {
  const steamAppName =
    steamAppIdNames[steamAppId as keyof typeof steamAppIdNames];

  return `https://skinport.com${
    steamAppName !== "cs2" ? `/${steamAppName}` : ""
  }/item/${getSkinportItemSlug(steamItemName)}`;
}
