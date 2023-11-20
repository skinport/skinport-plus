import ky from "ky";

const skinportApi = ky.extend({ prefixUrl: "https://api.skinport.com" });

export default skinportApi;

export function getSkinportItemUrl(game: string, itemName: string) {
  return `https://skinport.com${
    game !== "cs2" ? `/${game}` : ""
  }/item/${decodeURIComponent(itemName)
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")}`;
}
