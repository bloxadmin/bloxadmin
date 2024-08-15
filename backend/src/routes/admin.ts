import { validator } from "https://deno.land/x/hono@v2.7.0/middleware.ts";
import auth, { mustBeAdmin } from "../middleware/auth.ts";
import { GameFeature, getAllGames, getGame, getScriptConfig, isGameApiKeySet, updateGame, updateGameFromRoblox } from "../services/games.ts";
import { getGameServerStats, getServerCount } from "../services/servers.ts";
import postgres from "../util/postgres.ts";
import router from "../util/router.ts";


router.get("/admin/games", auth(), mustBeAdmin(), async (context) => {
  const limit = Math.min(100, Number(context.req.query("limit")) || 25);
  const skip = Number(context.req.query("skip")) || 0;
  const { features } = context.req.query();

  const gameFeatures = features?.split(",") as GameFeature[] || [];

  const games = await getAllGames(limit, skip, gameFeatures);
  const [{ count }] = await postgres<{ count: string }>`
    SELECT COUNT(*) FROM games
  `

  const onlinePlayerCounts: Record<number, number> = {};
  const totalServers: Record<number, number> = {};

  await Promise.all(games.map(async (game) => {
    onlinePlayerCounts[game.id] = (await getGameServerStats(game.id)).onlinePlayerCount;
    totalServers[game.id] = await getServerCount(game.id);
  }));

  const data = games.map((game) => {
    return {
      ...game,
      onlinePlayerCount: onlinePlayerCounts[game.id],
      serverCount: totalServers[game.id],
    }
  });

  return context.json({
    total: Number(count),
    limit,
    skip,
    data,
  });
});

const allFeatures = Object.values(GameFeature);


router.get("/admin/games/:gameId", auth(), mustBeAdmin(), async (context) => {
  const gameId = context.req.param("gameId");
  const game = await getGame(gameId, true, true);

  if (!game) {
    return context.text("Game not found", 404);
  }
  const serverStats = await getGameServerStats(gameId);
  const apiKeySet = await isGameApiKeySet(gameId);
  const serverCount = await getServerCount(gameId);
  const { ingestKey } = await getScriptConfig(gameId);

  return context.json({
    id: game.id,
    rootPlaceId: game.rootPlaceId,
    name: game.name,
    ownerGroup: game.ownerGroup,
    ownerPlayer: game.ownerPlayer,
    features: game.features,
    apiKeySet,
    isSetup: game.isSetup,
    active: game.active,
    serverCount,
    ingestKey,
    ...serverStats,
  });
});

router.patch("/admin/games/:gameId", auth(), mustBeAdmin(), validator((v) => ({
  features: v.json("features").asArray().isIn(allFeatures).isOptional(),
  active: v.json("active").asBoolean().isOptional(),
})), async (context) => {
  const gameId = context.req.param("gameId");
  const body = await context.req.valid();

  if (Object.entries(body).length === 0)
    return context.json({ success: true });

  updateGame(gameId, {
    features: body.features as GameFeature[],
    active: body.active as boolean,
  });

  return context.json({
    success: true
  });
});

router.post("/admin/games/:gameId/update", auth(), mustBeAdmin(), async (context) => {
  const gameId = context.req.param("gameId");

  await updateGameFromRoblox(gameId);

  return context.json({
    success: true
  });
});

router.get("/admin/users", auth(), mustBeAdmin(), async (context) => {
  const limit = Math.min(100, Number(context.req.query("limit")) || 25);
  const skip = Number(context.req.query("skip")) || 0;

  const users = await postgres<{ id: string; name: string; }>`
    SELECT users.id, name FROM users
    LEFT JOIN players ON players.id = users.id
    LIMIT ${limit} OFFSET ${skip};
  `;

  const [{ count }] = await postgres<{ count: string }>`
    SELECT COUNT(*) FROM users
  `;

  return context.json({
    total: count,
    skip,
    limit,
    data: users.map((user) => ({
      id: user.id,
      name: user.name,
    }))
  });
});
