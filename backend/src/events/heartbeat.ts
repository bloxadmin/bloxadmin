import { updateHeartbeat } from "../services/servers.ts";
import { ServerEventContext } from "../services/events.ts";
import { Point } from "../util/influxdb.ts";

export interface HeartbeatEventData {
  onlineCount: number;
  players: {
    id: number;
    name: string;
    joinedAt: number;
  }[];
}

export default async function handleHeartbeatEvent({ gameId, serverId, time, influxWriteApi, data }: ServerEventContext<HeartbeatEventData>) {
  await updateHeartbeat(gameId, serverId, time, {
    onlinePlayers: data.players
  });

  influxWriteApi.writePoint(new Point("onlinePlayers")
    .tag("gameId", gameId.toString())
    .tag("serverId", serverId)
    .intField("onlinePlayers", data.players.length)
  );

  influxWriteApi.writePoint(new Point("activeServers")
    .tag("gameId", gameId.toString())
    .tag("serverId", serverId)
    .intField("activeServers", 1)
  );
}
