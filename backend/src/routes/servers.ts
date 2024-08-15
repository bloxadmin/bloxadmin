import { validator } from 'https://deno.land/x/hono@v2.7.0/middleware.ts';
import auth from "../middleware/auth.ts";
import { getChatMessages, getTotalChatMessages } from "../services/chat.ts";
import { getGamePlayers } from '../services/gamePlayers.ts';
import { getServerSessions, getTotalServerSessions } from '../services/joinLeaves.ts';
import { Permissions, security } from '../services/security.ts';
import { EventType, buildServerEvent } from "../services/serverEvents.ts";
import { ONLINE_THRESHOLD, getServer, getServerCount, getServers } from "../services/servers.ts";
import publish from '../services/publish.ts';
import router from "../util/router.ts";

router.get("/games/:gameId/servers", auth(), security([Permissions.Servers.Servers.List]), async (context) => {
  const gameId = Number(context.req.param("gameId"));

  const limit = Math.min(100, Number(context.req.query("limit")) || 25);
  const total = await getServerCount(gameId, {
    online: true,
  });
  const skip = Number(context.req.query("skip")) || 0;

  const servers = skip >= total ? [] : await getServers(gameId, {
    online: true,
    limit,
    skip,
  });

  return context.json({
    total,
    limit,
    skip,
    data: servers,
  });
});

router.get("/games/:gameId/servers/:server", auth(), security([Permissions.Servers.Servers.List]), async (context) => {
  const gameId = context.req.param("gameId");
  const serverId = context.req.param("server");

  const server = await getServer(gameId, serverId);

  if (!server)
    return context.text("Server not found", 404);

  const ids = server.onlinePlayers.map((plr) => typeof plr === "number" ? plr : plr.id);
  const players = await getGamePlayers(gameId, ids);

  server.onlinePlayers.forEach((onlinePlayer) => {
    const player = players.find((player) => player.id === onlinePlayer.id);
    onlinePlayer.name = player?.name || "Unknown";
  });

  if (server.lastHeartbeatAt && server.lastHeartbeatAt.getTime() < Date.now() - ONLINE_THRESHOLD)
    server.closedAt = server.lastHeartbeatAt;

  if (server.closedAt)
    server.onlinePlayers = [];

  return context.json(server);
});


router.get("/games/:gameId/servers/:server/chat", auth(), security([Permissions.Servers.Chat.Read]), async (context) => {
  const gameId = Number(context.req.param("gameId"));
  const limit = Math.min(1000, Number(context.req.query("limit")) || 100);
  const skip = Number(context.req.query("skip")) || 0;
  const serverId = context.req.param("server");

  const total = await getTotalChatMessages(gameId, serverId);
  const messages = await getChatMessages(gameId, serverId, limit, skip);

  const playerIds = messages.map((message) => message.playerId);
  const players = await getGamePlayers(gameId, playerIds);

  const playersMap = new Map<number, { id: number; name: string; avatar?: string; }>();
  players.forEach((player) => playersMap.set(player.id, {
    id: player.id,
    name: player.name,
  }));

  return context.json({
    total,
    limit,
    skip,
    data: messages.map((message) => ({
      time: message.time,
      playerId: message.playerId,
      message: message.message,
      id: message.id,
      player: playersMap.get(message.playerId) || {
        id: message.playerId,
        name: `Player ${message.playerId}`,
      },
    })),
  });
});

router.post("/games/:gameId/servers/:server/shutdown", auth(), security([Permissions.Servers.Actions.Shutdown]), validator((v) => ({
  reason: v.json("reason").isOptional(),
})), async (context) => {
  const gameId = context.req.param("gameId");
  const serverId = context.req.param("server");

  const server = await getServer(gameId, serverId);

  if (!server)
    return context.text("Server not found", 404);

  const body = await context.req.json<{ reason?: string }>();

  if (body.reason && body.reason.length >= 100) {
    return context.text("Reason must be at most 100 characters", 400);
  }

  const message = JSON.stringify(buildServerEvent(serverId, EventType.Shutdown, [body.reason || null, null]));

  await publish(gameId, message);

  return context.json({
    message: "Server shutdown request sent",
  }, 200);
});

router.get("/games/:gameId/servers/:server/sessions", auth(), security([Permissions.Servers.Sessions.List]), async (context) => {
  const gameId = context.req.param("gameId");
  const serverId = context.req.param("server");

  const server = await getServer(gameId, serverId);

  if (!server)
    return context.text("Server not found", 404);

  if (server.lastHeartbeatAt && server.lastHeartbeatAt.getTime() < Date.now() - ONLINE_THRESHOLD)
    server.closedAt = server.lastHeartbeatAt;

  const limit = Math.min(100, Number(context.req.query("limit")) || 25);
  const skip = Number(context.req.query("skip")) || 0;
  // const reversed = !!context.req.query("reversed");

  const totalSessions = await getTotalServerSessions(gameId, serverId);
  const sessions = await getServerSessions(gameId, serverId, limit, skip);

  return context.json({
    total: totalSessions,
    limit: limit,
    skip,
    data: sessions,
  });
});
