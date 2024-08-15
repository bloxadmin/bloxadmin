import { EventChannel, ServerEventContext } from "../services/events.ts";
import { gamePlayerJoinedGame, getGamePlayer } from "../services/gamePlayers.ts";
import { Game } from "../services/games.ts";
import { getPlayerSessionsBetween, recordPlayerJoin } from "../services/joinLeaves.ts";
import { EventType, buildServerEvent } from "../services/serverEvents.ts";
import { Point } from "../util/influxdb.ts";
import { banKickMessage } from "../util/moderation.ts";
import publish from "../services/publish.ts";

export interface PlayerJoinEventData {
  name?: string;
  sourceGameId: number;
  sourcePlaceId: number;
  // partyMembers: number[];
  // teleportData: unknown;
  countryCode: string;
  // policy: Record<string, unknown>;
}


async function checkModeration(playerId: number, game: Game, serverId: string) {
  const player = await getGamePlayer(game.id, playerId, { noCreate: true });

  if (!player) return;

  const mod = player.moderation;

  if (mod.banned) {
    const message = JSON.stringify(buildServerEvent(serverId, EventType.Moderation, [
      "Kick",
      playerId,
      mod.banUntil ? Math.floor(mod.banUntil.getTime() / 1000) : null,
      banKickMessage(mod.banUntil, mod.banReason),
      null,
    ]));

    await publish(game.id, message);
  }

  if (mod.muted) {
    const message = JSON.stringify(buildServerEvent(serverId, EventType.Moderation, [
      "Mute",
      playerId,
      mod.muteUntil ? Math.floor(mod.muteUntil.getTime() / 1000) : null,
      mod.muteReason || null,
      null,
    ]));

    await publish(game.id, message);
  }

}

export default async function handlePlayerJoinEvent({ game, gameId, serverId, segments, time, data, influxGlobalWriteApi }: ServerEventContext<PlayerJoinEventData>) {
  await gamePlayerJoinedGame(gameId, segments.player, serverId, time, data.countryCode, data.name).then(async ({ firstJoin, firstJoinAt }) => {
    influxGlobalWriteApi.writePoint(new Point("playerRetention")
      .tag("gameId", gameId.toString())
      .intField(firstJoin ? "new" : "returning", 1)
    );

    // Check for D1 retention
    async function dNRetention(day: number) {
      if (firstJoin || !firstJoinAt)
        return;
      const d1Start = new Date(firstJoinAt.getTime() + 24 * 60 * 60 * 1000 * day);
      const d1End = new Date(d1Start.getTime() + 24 * 60 * 60 * 1000);

      if (time >= d1Start && time < d1End) {
        const sessions = await getPlayerSessionsBetween(gameId, segments.player, d1Start, d1End);

        if (sessions.length === 0)
          influxGlobalWriteApi.writePoint(new Point("playerRetention")
            .tag("gameId", gameId.toString())
            .intField(`d${day}`, 1)
          );
      }
    }

    await dNRetention(1);
    await dNRetention(7);
    await dNRetention(30);
  });
  await checkModeration(Number(segments.player), game, serverId);
  await recordPlayerJoin({
    gameId,
    serverId,
    playerId: Number(segments.player),
    playerSessionId: segments.session,
    addedAt: time,
  }, {
    sourceGameId: data.sourceGameId,
    sourcePlaceId: data.sourcePlaceId,
    // partyMembers: data.partyMembers,
    // teleportData: data.teleportData,
    countryCode: data.countryCode,
    // policy: data.policy,
  });

  const channel = EventChannel.for(serverId, "players");

  channel.sendEvent({
    type: "playerJoin",
    time,
    data: {
      playerId: Number(segments.player),
      // partyMembers: data.partyMembers,
      sourceGameId: data.sourceGameId,
      sourcePlaceId: data.sourcePlaceId,
      countryCode: data.countryCode,
      // policy: data.policy,
    }
  });
}
