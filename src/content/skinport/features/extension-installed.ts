import { featureManager } from "@/content/feature-manager";

async function skinportExtensionInstalled() {
  document.body.classList.add("isExtensionInstalled");
}

featureManager.add(skinportExtensionInstalled, { awaitDomReady: true });
