import { featureManager } from "@/content/feature-manager";
import { addToaster } from "@/content/toaster";
import "./features/account-security-check";
import "./features/inventory-item-info";
import "./features/market-item-skinport-price";
import "./features/market-items-skinport-price";
import "./features/profile-verified";
import "./features/trade-offer-check";
import "./features/trade-offers-items-info";

addToaster();
featureManager.run();
