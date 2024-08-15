import { ENABLE_LOGGING } from "../consts.ts";
import { ServerEventContext } from "../services/events.ts";

interface MarketplaceData {
  wasPurchased: boolean;
}

interface BundlePurchase extends MarketplaceData {
  bundleId: number;
}

interface GamePassPurchase extends MarketplaceData {
  gamePassId: number;
}

interface PromptPurchase extends MarketplaceData {
  assetId: number;
}

interface ProcessReceipt extends MarketplaceData {
  currencySpent: number;
  productId: number;
  purchaseId: number;
  placeId: number;
  wasPurchased: boolean;
}

type MarketplaceEventData = BundlePurchase | GamePassPurchase | PromptPurchase | ProcessReceipt;

function handleBundlePurchase(event: ServerEventContext<BundlePurchase>) {
  if (ENABLE_LOGGING)
    console.log(event.data)
}

function handleGamePassPurchase(event: ServerEventContext<GamePassPurchase>) {
  if (ENABLE_LOGGING)
    console.log(event.data)
}

function handlePromptPurchase(event: ServerEventContext<PromptPurchase>) {
  if (ENABLE_LOGGING)
    console.log(event.data)
}

function handleProcessReceipt(event: ServerEventContext<ProcessReceipt>) {
  if (ENABLE_LOGGING)
    console.log(event.data)
}

export default function handleMarketplaceEvent(event: ServerEventContext<MarketplaceEventData>) {
  if (!event.data.wasPurchased) return;

  switch (event.name) {
    case "marketplaceBundlePurchaseFinished":
      return handleBundlePurchase(event as ServerEventContext<BundlePurchase>);
    case "marketplaceGamePassPurchaseFinished":
      return handleGamePassPurchase(event as ServerEventContext<GamePassPurchase>);
    case "marketplacePromptPurchaseFinished":
      return handlePromptPurchase(event as ServerEventContext<PromptPurchase>);
    case "marketplaceProcessReceipt":
      return handleProcessReceipt(event as ServerEventContext<ProcessReceipt>);
  }
}
