import { serverClose, updateServer } from "../services/servers.ts";
import { EventChannel, ServerEventContext } from "../services/events.ts";
import { Point } from "../util/influxdb.ts";
import { detachServerFromActions } from "../services/actions.ts";

export default async function handleServerCloseEvent({ gameId, serverId, time, influxWriteApi }: ServerEventContext) {
  await updateServer(gameId, serverId, {
    closedAt: time,
  });
  await serverClose(gameId, serverId, {
    closedAt: time,
  });
  await detachServerFromActions(gameId, serverId);

  influxWriteApi.writePoint(new Point("onlinePlayers")
    .tag("gameId", gameId.toString())
    .tag("serverId", serverId)
    .intField("onlinePlayers", 0)
  );

  influxWriteApi.writePoint(new Point("activeServers")
    .tag("gameId", gameId.toString())
    .tag("serverId", serverId)
    .intField("activeServers", 0)
  );

  const playersChannel = EventChannel.for(serverId, "players");
  //const serversChannel = EventChannel.for(gameId, "servers");

  playersChannel.sendEvent({
    type: "serverClose",
    time,
  });

  /*
  serversChannel.sendEvent({
    type: "serverClose",
    serverId,
    time,
  });*/
}
