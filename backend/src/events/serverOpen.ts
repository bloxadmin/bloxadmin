import { serverOpen, updateServer } from "../services/servers.ts";
import { EventChannel, ServerEventContext } from "../services/events.ts";

export interface ServerOpenEventData {
  placeVersion: number;
  privateServerId: string;
  privateServerOwnerId: number;
  scriptVersion: number;
}

export default async function handleServerOpenEvent({ gameId, serverId, time, data }: ServerEventContext<ServerOpenEventData>) {
  await updateServer(gameId, serverId, {
    startedAt: time,
    placeVersion: data.placeVersion,
    privateServerId: data.privateServerId,
    scriptVersion: data.scriptVersion,
  });
  await serverOpen(gameId, serverId, {
    startedAt: time,
    placeVersion: data.placeVersion,
    privateServerId: data.privateServerId,
    // privateServerOwnerId: data.privateServerOwnerId,
    scriptVersion: data.scriptVersion,
  });

  /*
  const channel = EventChannel.for(gameId, "servers");

  channel.sendEvent({
    type: "serverOpen",
    serverId,
    time,
  });*/
}
