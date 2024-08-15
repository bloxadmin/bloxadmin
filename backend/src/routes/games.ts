import { validator } from "https://deno.land/x/hono@v2.7.0/middleware.ts";
import auth from "../middleware/auth.ts";
import { CONFIG_SCHEMA, GameFeature, ScriptConfig, addGameRobloxApiKey, getAllGamesForUser, getGame, getGamePlayerOwnerId, getGameRemoteConfig, getScriptConfig, mergeScriptConfigs, updateGameRemoteConfig, updateScriptConfig } from "../services/games.ts";
import { getGameModerationHistory, getTotalGameModerationEvents } from "../services/moderation.ts";
import publish from "../services/publish.ts";
import { publishInMessageingService } from "../services/roblox.ts";
import { Permission, Permissions, VALID_PERMISSIONS, addGameUserToSecurityRole, getSecurityGameUsers, getUserGamePermissions, removeGameUserFromSecurityRole, security } from "../services/security.ts";
import { EventType, buildServerEvent } from "../services/serverEvents.ts";
import { getGameServerStats, getServers } from "../services/servers.ts";
import { ajv } from "../util/ajv.ts";
import router from "../util/router.ts";
import { getGameSecurityRoles } from "../services/security.ts";

router.get("/games", auth(), async (context) => {
  const userId = context.get("userId")!;

  const games = await getAllGamesForUser(userId);

  const onlinePlayerCounts: Record<number, number> = {};
  const perms: Record<number, Permission[]> = {};

  await Promise.all(games.map(async (game) => {
    onlinePlayerCounts[game.id] = (await getGameServerStats(game.id)).onlinePlayerCount;
    perms[game.id] = await getUserGamePermissions(game.id, userId);
  }));
  // games.sort((a, b) => onlinePlayerCounts[b.robloxId] - onlinePlayerCounts[a.robloxId]);

  return context.json(games.map((game) => {
    const permissions = filterPermissions(context.get("admin"), game.features, perms[game.id], true);

    return {
      id: game.id,
      name: game.name,
      rootPlaceId: game.rootPlaceId,
      onlinePlayerCount: onlinePlayerCounts[game.id],
      permissions,
      ownerGroup: game.ownerGroup,
      ownerPlayer: game.ownerPlayer,
      features: game.features,
      isSetup: game.isSetup,
      apiKeySet: game.apiKeySet,
    }
  }));
});

const PERMISSIONS_DATASTORE_WRITE: Permission[] = [
  Permissions.Datastores.Datastores.Create,
  Permissions.Datastores.Datastores.Delete,
  Permissions.Datastores.Entries.Create,
  Permissions.Datastores.Entries.Delete,
  Permissions.Datastores.Entries.Update,
]

const PERMISSIONS_DATASTORE: Permission[] = [
  Permissions.Datastores.Datastores.List,
  Permissions.Datastores.Datastores.Read,
  Permissions.Datastores.Entries.List,
  Permissions.Datastores.Entries.Read,

  ...PERMISSIONS_DATASTORE_WRITE,
]

const PERMISSIONS_REQUIRE_API_ACCESS: Permission[] = [
  Permissions.Players.Moderation.Kick,
  Permissions.Players.Moderation.List,
  Permissions.Players.Moderation.List,
  Permissions.Players.Moderation.PermanentBan,
  Permissions.Players.Moderation.PermanentMute,
  Permissions.Players.Moderation.Read,
  Permissions.Players.Moderation.Read,
  Permissions.Players.Moderation.TemporaryBan,
  Permissions.Players.Moderation.TemporaryMute,
  Permissions.Players.Moderation.Unban,
  Permissions.Players.Moderation.Unmute,

  ...PERMISSIONS_DATASTORE,

  Permissions.Servers.Actions.Shutdown,

  Permissions.RemoteConfig.Entries.Update,
];

function filterPermissions(admin: boolean, features: GameFeature[], permissions: Permission[], apiKeySet: boolean) {
  if (admin) {
    permissions = VALID_PERMISSIONS;
  }

  if (!apiKeySet) {
    permissions = permissions.filter((p) => !PERMISSIONS_REQUIRE_API_ACCESS.includes(p));
  }

  if (!features.includes(GameFeature.DatastoreViewer)) {
    permissions = permissions.filter((p) => !PERMISSIONS_DATASTORE.includes(p));
  } else {
    // TODO: Remove this once we have a better way to manage permissions
    permissions = permissions.filter((p) => !PERMISSIONS_DATASTORE_WRITE.includes(p));
  }

  return permissions;
}

router.get("/games/:gameId", auth(), security([]), async (context) => {
  const game = await getGame(context.req.param("gameId"));

  if (!game) {
    return context.text("Game not found", 404);
  }

  const serverStats = await getGameServerStats(game.id);

  const permissions = filterPermissions(context.get("admin"), game.features, context.get("permissions")!, true);

  return context.json({
    id: game.id,
    name: game.name,
    rootPlaceId: game.rootPlaceId,
    permissions,
    ownerGroup: game.ownerGroup,
    ownerPlayer: game.ownerPlayer,
    features: game.features,
    ...serverStats,
    isSetup: game.isSetup,
    apiKeySet: game.apiKeySet,
  });
});

router.post("/games/:gameId/robloxcloud", auth(), security([Permissions.Api.Keys.Create]), validator((v) => ({
  apiKey: v.json("apiKey").isRequired(),
})), async (context) => {
  const gameId = context.req.param("gameId");
  const body = await context.req.valid();

  const valid = await publishInMessageingService(gameId, body.apiKey, "bloxadmintest", "test");

  if (!valid) {
    return context.text("Invalid API key", 400);
  }

  await addGameRobloxApiKey(gameId, body.apiKey);

  return context.json({
    message: "Updated",
  });
});

router.get('/games/:gameId/validate', auth(), security([Permissions.Api.Keys.List]), async (context) => {
  const gameId = context.req.param("gameId");

  let type;
  try {
    type = await publish(gameId, "test", "bloxadmintest");
  } catch (e) {
    return context.text(e.message, 400);
  }

  return context.json({
    message: "Valid",
    type,
  });
});

router.get("/games/:gameId/roles", auth(), security([Permissions.Security.Roles.List]), async (context) => {
  const gameId = context.req.param("gameId");

  const roles = await getGameSecurityRoles(gameId);

  return context.json(roles);
});


router.get("/games/:gameId/users", auth(), security([Permissions.Security.Users.List]), async (context) => {
  const gameId = context.req.param("gameId");
  const users = await getSecurityGameUsers(gameId);

  return context.json(users);
});

router.put("/games/:gameId/users/:userId", auth(), security([Permissions.Security.Users.Create]), async (context) => {
  const gameId = context.req.param("gameId");
  const userId = context.req.param("userId");

  try {
    await addGameUserToSecurityRole(gameId, userId, 2);
  } catch (_e) {
    return context.text("User already in game", 400);
  }

  return context.json({
    message: "Added",
  });
});

router.delete("/games/:gameId/users/:userId", auth(), security([Permissions.Security.Users.Delete]), async (context) => {
  const gameId = context.req.param("gameId");
  const userId = context.req.param("userId");

  const ownerId = await getGamePlayerOwnerId(gameId);

  if (ownerId === Number(userId)) {
    return context.text("Cannot remove owner", 400);
  }

  await removeGameUserFromSecurityRole(gameId, userId, 2);

  return context.json({
    message: "Removed",
  });
});

router.get("/games/:gameId/scriptConfig", auth(), security([]), async (context) => {
  const gameId = context.req.param("gameId");
  const { ingestKey, config } = await getScriptConfig(gameId);

  return context.json({ ingestKey, config });
});

router.put("/games/:gameId/scriptConfig", auth(), security([]), async (context) => {
  const gameId = context.req.param("gameId");

  const data = await context.req.json<ScriptConfig>();
  const valid = ajv.validate(CONFIG_SCHEMA, data);

  if (!valid)
    return context.text(ajv.errorsText(ajv.errors), 400);

  const config = await mergeScriptConfigs(data);

  await updateScriptConfig(gameId, config);


  getServers(Number(gameId), { online: true }).then(async (servers) => {
    for (const server of servers) {
      const message = JSON.stringify(buildServerEvent(server.id, EventType.RemoteConfig, [config]));

      await publish(gameId, message);
    }
  });

  return context.json(config);
});


router.get("/games/:gameId/config", auth(), security([Permissions.RemoteConfig.Entries.List]), async (context) => {
  const gameId = context.req.param("gameId");

  const config = await getGameRemoteConfig(gameId);

  return context.json(config);
});

router.put("/games/:gameId/config", auth(), security([Permissions.RemoteConfig.Entries.Update]), async (context) => {
  const gameId = context.req.param("gameId");
  const config: Record<string, unknown> = {};

  const enteredConfig = await context.req.json<Record<string, unknown>>();

  for (const key of Object.keys(enteredConfig)) {
    if (key.match(/^[!$]/)) {
      return context.text(`Invalid property "config.${key}" cannot start with ! or $`, 400);
    }
    if (typeof enteredConfig[key] !== "string" && typeof enteredConfig[key] !== "number" && typeof enteredConfig[key] !== "boolean" && enteredConfig[key] !== null) {
      return context.text(`Invalid property "config.${key}" must be of type string, number, boolean, or null`, 400);
    }
  }

  await updateGameRemoteConfig(gameId, enteredConfig);

  const newConfig = {
    ...config,
    ...enteredConfig,
  };

  Object.keys(newConfig).forEach((key) => {
    if (newConfig[key] === null) {
      delete newConfig[key];
    }
  });

  getServers(Number(context.req.param("gameId")), { online: true }).then(async (servers) => {
    for (const server of servers) {
      const message = JSON.stringify(buildServerEvent(server.id, EventType.RemoteConfig, [newConfig]));

      await publish(gameId, message);
    }
  });

  return context.json(newConfig);
});


router.get("/games/:gameId/moderation", auth(), security([Permissions.Moderation.Actions.List]), async (context) => {
  const gameId = Number(context.req.param("gameId"));

  const limit = Math.min(100, Number(context.req.query("limit")) || 25);
  const skip = Number(context.req.query("skip")) || 0;

  const data = await getGameModerationHistory(gameId, limit, skip);
  const total = await getTotalGameModerationEvents(gameId);

  return context.json({
    total,
    limit,
    skip,
    data,
  });
});

router.get(
  "/games/:gameId/moderation/download",
  auth(),
  security([Permissions.Moderation.Actions.List]),
  async (context) => {
    const gameId = Number(context.req.param("gameId"));

    const limit = Number.MAX_SAFE_INTEGER; // Set to a large number
    const skip = Number(context.req.query("skip")) || 0;

    const data = await getGameModerationHistory(gameId, limit, skip);
    const total = await getTotalGameModerationEvents(gameId);

    return context.json({
      total,
      limit,
      skip,
      data,
    });
  }
);
