import { validator } from 'https://deno.land/x/hono@v2.7.0/middleware.ts';
import auth from '../middleware/auth.ts';
import { GamePlayer, getGamePlayer, getTotalGamePlayers, listGamePlayers, searchGamePlayers, updatePlayerFromRoblox } from '../services/gamePlayers.ts';
import { getPlayerSessions, getTotalPlayerSessions } from '../services/joinLeaves.ts';
import { ModerationEventData, addModerationEvent, getModerationHistory, getTotalModerationEvents } from '../services/moderation.ts';
import { Permission, Permissions, security } from '../services/security.ts';
import { CONVERT_MODERATION_EVENT_TYPE, EventType, buildServerEvent } from '../services/serverEvents.ts';
import { getOnlinePlayerServer } from '../services/servers.ts';
import { banKickMessage } from '../util/moderation.ts';
import publish from '../services/publish.ts';
import router from "../util/router.ts";

// router.get("/players", auth(), async (context) => {
//   const ids = context.req.query("ids")?.split(",").map(Number) || [];

//   for (const id of ids) {
//     if (isNaN(id) || !id)
//       return context.text("Invalid id: " + id, 400);
//   }

//   const players = await getGamePlayers(ids, {
//     projection: {
//       _id: 0,
//       robloxId: 1,
//       name: 1,
//       avatar: 1,
//     }
//   });

//   return context.json(players.map((player) => ({
//     id: player.robloxId,
//     name: player.name,
//   })));
// })

export interface ResponsePlayer {
  id: number;
  name: string;
  playtime: number;
  avatar?: string;
  isBanned: boolean;
  bannedUntil?: Date | -1;
  banReason?: string;
  isMuted: boolean;
  mutedUntil?: Date | -1;
  muteReason?: string;
}

function getPlayerDetails(player: GamePlayer): ResponsePlayer {
  const moderation = player.moderation;

  return {
    id: player.id,
    name: player.name || "[Missing Name]",
    playtime: player.playtime || 0,
    isBanned: moderation.banned,
    bannedUntil: moderation.banUntil,
    banReason: moderation.banReason,
    isMuted: moderation.muted,
    mutedUntil: moderation.muteUntil,
    muteReason: moderation.muteReason,
  };
}

router.get("/games/:gameId/players", auth(), security([Permissions.Players.Details.List]), async (context) => {
  const gameId = context.req.param("gameId");

  const limit = Math.min(100, Number(context.req.query("limit")) || 25);
  const skip = Number(context.req.query("skip")) || 0;
  const query = context.req.query("query");

  const players = query
    ? await searchGamePlayers(gameId, query, limit, skip)
    : await listGamePlayers(gameId, limit, skip);

  const data = players.map((player) => getPlayerDetails(player));
  const total = await getTotalGamePlayers(gameId);

  return context.json({
    total: query ? data.length : total,
    limit,
    skip,
    data,
  });
})


router.get("/games/:gameId/players/:player", auth(), security([Permissions.Players.Details.Read]), async (context) => {
  const gameId = context.req.param("gameId");
  const player = await getGamePlayer(gameId, Number(context.req.param("player")));

  if (!player) {
    return context.text("Player not found", 404);
  }

  if (!player.name) {
    await updatePlayerFromRoblox(player.id);
  }

  const details = getPlayerDetails(player);

  // TODO: Redo checking if player is online
  const server = await getOnlinePlayerServer(gameId, player.id);
  let onlineData: {
    isOnline: boolean;
    playingSince?: Date;
    serverId?: string;
  } = {
    isOnline: false,
  };

  if (server && player.lastJoin) {
    onlineData = {
      isOnline: true,
      playingSince: player.lastJoin.time,
      serverId: server.id,
    };
  }

  return context.json({
    ...details,
    ...onlineData,
  });
});

router.get("/games/:gameId/players/:player/moderation", auth(), security([Permissions.Players.Moderation.List]), async (context) => {
  const gameId = Number(context.req.param("gameId"));
  const playerId = Number(context.req.param("player"));

  const limit = Math.min(100, Number(context.req.query("limit")) || 25);
  const skip = Number(context.req.query("skip")) || 0;

  const data = await getModerationHistory(gameId, playerId, limit, skip);
  const total = await getTotalModerationEvents(gameId, playerId);

  return context.json({
    total,
    limit,
    skip,
    data,
  });
});

function expiresAt(now: Date, durationSeconds?: number, expiresAt?: string | number) {
  if (expiresAt)
    return new Date(expiresAt);
  if (durationSeconds)
    return new Date(now.getTime() + (durationSeconds * 1000));
  return null;
}

router.get(
  "/games/:gameId/players/:player/moderation/download",
  auth(),
  security([Permissions.Players.Moderation.List]),
  async (context) => {
    const gameId = Number(context.req.param("gameId"));
    const playerId = Number(context.req.param("player"));

    const limit = Number.MAX_SAFE_INTEGER; // Set to a large number
    const skip = Number(context.req.query("skip")) || 0;

    const data = await getModerationHistory(gameId, playerId, limit, skip);
    const total = await getTotalModerationEvents(gameId, playerId);

    return context.json({
      total,
      limit,
      skip,
      data,
    });
  }
);

router.post("/games/:gameId/players/:player/moderation",
  auth(),
  security([]),
  validator((v) => ({
    type: v.json('type').isRequired().isIn(["ban", "mute", "kick", "unmute", "unban", "warn"]),
    duration: v.json('duration').asNumber().isGte(0).isOptional(),
    expiresAt: v.json('expiresAt').isOptional(),
    reason: v.json('reason').isOptional().isLength({ min: 1, max: 1000 }),
    moderator: v.json('moderator').asNumber().isOptional(),
  })),
  async (context) => {
    const gameId = Number(context.req.param("gameId"));
    const playerId = Number(context.req.param("player"));
    const player = await getGamePlayer(gameId, playerId);

    if (!player) {
      return context.text("Player not found", 404);
    }

    const now = new Date();

    const data = await context.req.valid();

    if (context.get("ingestKey")) {
      if (data.moderator && typeof data.moderator !== "number")
        return context.text("Invalid moderator", 400);
    } else {
      if (data.moderator) {
        return context.text("Cannot specify moderator", 400);
      }
    }

    const moderator = context.get("ingestKey") && !data.moderator
      ? {
        id: 0,
        name: "System",
      }
      : await getGamePlayer(gameId, data.moderator || context.get("userId")!)
    const moderation = player.moderation;

    console.log(moderator, data.moderator, context.get("userId"), context.get("ingestKey"));
    if (!moderator)
      return context.text("Moderator not found", 404);

    // Validate schema
    if (!data.type)
      return context.text("Missing type", 400);
    if (!["ban", "mute", "kick", "unmute", "unban", "warn"].includes(data.type))
      return context.text("Invalid type", 400);
    if (data.duration && data.expiresAt)
      return context.text("Cannot specify both duration and expiresAt", 400);
    if (data.duration && data.duration < 0)
      return context.text("Duration must be positive", 400);
    if (data.expiresAt && new Date(data.expiresAt) < now)
      return context.text("Expiration must be in the future", 400);
    if (data.type === "unmute" && !moderation.muted)
      return context.text("Player is not muted", 400);
    if (data.type === "unban" && !moderation.banned)
      return context.text("Player is not banned", 400);

    const isPermanent = !data.duration && !data.expiresAt;
    let permission: Permission;
    if (data.type === "ban") {
      permission = isPermanent ? Permissions.Players.Moderation.PermanentBan : Permissions.Players.Moderation.TemporaryBan;
    } else if (data.type === "mute") {
      permission = isPermanent ? Permissions.Players.Moderation.PermanentMute : Permissions.Players.Moderation.TemporaryMute;
    } else if (data.type === "kick") {
      permission = Permissions.Players.Moderation.Kick;
    } else if (data.type === "unmute") {
      permission = Permissions.Players.Moderation.Unmute;
    } else if (data.type === "unban") {
      permission = Permissions.Players.Moderation.Unban;
    } else if (data.type === "warn") {
      permission = Permissions.Players.Moderation.Warn;
    } else {
      return context.text(`Invalid type: "${data.type}"`, 400);
    }

    const permissions = context.get("permissions")!;
    if (!permissions.includes(permission))
      return context.text(`You do not have permission to ${["ban", "mute"].includes(data.type) ? (isPermanent ? "permanently " : "temporarily ") : ""}${data.type} players.`, 403);

    const server = await getOnlinePlayerServer(gameId, playerId)

    const event: ModerationEventData = {
      type: data.type as ModerationEventData["type"],
      reason: data.reason,
      expiresAt: expiresAt(now, data.duration, data.expiresAt),
      moderator: {
        name: moderator.name,
        robloxId: Number(moderator.id),
      },
    }

    if (!context.get("ingestKey")) {
      if (server) {
        const message = JSON.stringify(buildServerEvent(server.id, EventType.Moderation, [
          CONVERT_MODERATION_EVENT_TYPE[event.type.toLowerCase()],
          playerId,
          event.expiresAt ? Math.floor(event.expiresAt.getTime() / 1000) : null,
          event.reason || null,
          data.duration || (event.expiresAt ? Math.floor((event.expiresAt.getTime() - now.getTime()) / 1000) : null)
        ]));

        const sent = await publish(gameId, message);

        if (!sent) {
          return context.text("Failed to send moderation event to server", 400);
        }
      } else if (event.type === "kick") {
        return context.text("Player is not online", 400);
      }
    }

    await addModerationEvent(context.req.param("gameId"), context.req.param("player"), event);

    return context.json({
      type: event.type,
      expiresAt: event.expiresAt || null,
      reason: event.reason,
      moderator: {
        id: event.moderator.robloxId,
        name: event.moderator.name,
        avatar: null,
      }
    });
  });

router.get("/games/:gameId/players/:player/sessions", auth(), security([Permissions.Players.Sessions.List]), async (context) => {
  const gameId = context.req.param("gameId");

  const player = await getGamePlayer(gameId, Number(context.req.param("player")), { noCreate: true });

  if (!player) {
    return context.text("Player not found", 404);
  }

  const limit = Math.min(100, Number(context.req.query("limit")) || 25);
  const skip = Number(context.req.query("skip")) || 0;

  const totalJoins = await getTotalPlayerSessions(gameId, player.id);
  const sessions = await getPlayerSessions(gameId, player.id, limit, skip);

  return context.json({
    total: totalJoins,
    limit,
    skip,
    data: sessions,
  });
});
