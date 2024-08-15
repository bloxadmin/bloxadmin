import { ServerEventContext } from "../services/events.ts";
import handleConsoleLogEvent from "./consoleLog.ts";
import handleHeartbeatEvent from "./heartbeat.ts";
import { handleMemoryStoreServiceQuotaUsageEvent } from "./internal.ts";
import handleMarketplaceEvent from "./marketplace.ts";
import handlePlayerChatEvent from "./playerChat.ts";
import handlePlayerJoinEvent from "./playerJoin.ts";
import handlePlayerLeaveEvent from "./playerLeave.ts";
import handlePlayerReadyEvent from "./playerReady.ts";
import handleScriptErrorEvent from "./scriptError.ts";
import handleServerCloseEvent from "./serverClose.ts";
import handleServerOpenEvent from "./serverOpen.ts";
import handleStatsEvent from "./stats.ts";

const events: {
  // deno-lint-ignore no-explicit-any
  [key: string]: (event: ServerEventContext<any>) => Promise<void> | void;
} = {
  heartbeat: handleHeartbeatEvent,
  serverOpen: handleServerOpenEvent,
  serverClose: handleServerCloseEvent,
  playerJoin: handlePlayerJoinEvent,
  playerLeave: handlePlayerLeaveEvent,
  playerChat: handlePlayerChatEvent,
  playerReady: handlePlayerReadyEvent,
  stats: handleStatsEvent,
  memoryStoreServiceQuotaUsage: handleMemoryStoreServiceQuotaUsageEvent,
  scriptError: handleScriptErrorEvent,
  marketplaceBundlePurchaseFinished: handleMarketplaceEvent,
  marketplaceGamePassPurchaseFinished: handleMarketplaceEvent,
  marketplacePromptPurchaseFinished: handleMarketplaceEvent,
  marketplaceProcessReceipt: handleMarketplaceEvent,
  consoleLog: handleConsoleLogEvent
};

export default async function handleEvent(event: ServerEventContext): Promise<boolean> {
  const handler = events[event.name];

  if (!handler) {
    if (Deno.env.get("ENABLE_LOGGING"))
      console.log(`Unhandled event type: ${event.name}`);
    return true;
  }

  try {
    await handler(event);
  } catch (e) {
    console.error(e);
    event.retry.push(event.raw);
    return false;
  }

  return true;
}
