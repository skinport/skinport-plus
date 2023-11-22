import ky from "ky";
import { steamAppIdNames } from "./steam";

const skinportApi = ky.extend({ prefixUrl: "https://api.skinport.com" });

export default skinportApi;

export function getSkinportItemUrl(steamAppId: string, steamItemName: string) {
  const steamAppName =
    steamAppIdNames[steamAppId as keyof typeof steamAppIdNames];

  return `https://skinport.com${
    steamAppName !== "cs2" ? `/${steamAppName}` : ""
  }/item/${decodeURIComponent(steamItemName)
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")}`;
}