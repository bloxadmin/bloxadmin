import { ServerEventContext } from "../services/events.ts";
import { Point } from "../util/influxdb.ts";

export interface MemoryStoreServiceQuotaUsageData {
  usage: number;
}

// deno-lint-ignore require-await
export async function handleMemoryStoreServiceQuotaUsageEvent({
  gameId, serverId, time, influxWriteApi, data
}: ServerEventContext<MemoryStoreServiceQuotaUsageData>) {
  influxWriteApi.writePoint(new Point("memoryStoreServiceQuotaUsage")
    .tag("gameId", gameId.toString())
    .tag("serverId", serverId)
    .intField("usage", data.usage)
    .timestamp(time)
  );
}
