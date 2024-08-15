import { EventChannel, ServerEventContext } from "../services/events.ts";
import { gamePlayerLeftGame } from "../services/gamePlayers.ts";
import { recordPlayerLeave } from "../services/joinLeaves.ts";
import { Point } from "../util/influxdb.ts";

export interface PlayerLeaveEventData {
  followPlayerId: number;
  playTime: number;
}

export default async function handlePlayerLeaveEvent({ gameId, serverId, segments, time, data, influxGlobalWriteApi }: ServerEventContext<PlayerLeaveEventData>) {
  await Promise.all([
    recordPlayerLeave({
      gameId,
      serverId,
      playerId: Number(segments.player),
      playerSessionId: segments.session,
      addedAt: time,
    }, {
      ...data,
    }),
    gamePlayerLeftGame(segments.player, gameId, serverId, time, data.playTime),
    // addMetricEntry(gameId, Number(segments.player), "playtime", data.playTime, time),
  ]);

  const channel = EventChannel.for(serverId, "players");

  channel.sendEvent({
    type: "playerLeave",
    time,
    data: {
      playerId: Number(segments.player),
      followPlayerId: data.followPlayerId,
      playTime: data.playTime,
    }
  });

  influxGlobalWriteApi.writePoint(new Point("sessionLength")
    .timestamp(time)
    .tag("gameId", gameId.toString())
    .floatField("sessionLength", data.playTime));
}
