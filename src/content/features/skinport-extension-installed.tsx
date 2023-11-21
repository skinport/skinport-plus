import featureManager from "../feature-manager";

async function skinportExtensionInstalled() {
  document.body.classList.add("isExtensionInstalled");
}

featureManager.add(skinportExtensionInstalled, { host: "skinport.com" });
