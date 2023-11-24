import "./features/account-security-check";
import "./features/inventory-item-skinport-link";
import "./features/market-item-skinport-link";
import "./features/trade-offer-check";
import i18n from "@/lib/i18n";
import featureManager from "@/content/feature-manager";

i18n.setDefaultNamespace("content");

featureManager.run();
