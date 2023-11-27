import browser from "webextension-polyfill";

const allUrls = "*://*/*";

export async function getHasAllUrlsPermission() {
  const permissions = await browser.permissions.getAll();

  return permissions.origins?.indexOf(allUrls) !== -1;
}

export function requestAllUrlsPermission() {
  browser.permissions.request({ origins: [allUrls] });
}
