import postgres from "../util/postgres.ts";
import { getGroup } from "./groups/groups.ts";
import { getRobloxGame, getRobloxGroup } from "./roblox.ts";
import { addGameUserToSecurityRole } from "./security.ts";

export enum GameFeature {
  FasterIngestion = "faster_ingestion",
  ExtendedChatLogs = "extended_chat_logs",
  ExtendedSessionLogs = "extended_session_logs",
  ErrorOccurrenceTracking = "error_occurrence_tracking",
  ShorterMetricsInterval = "shorter_metrics_interval",
  DatastoreViewer = "datastore_viewer",
  ExtendedRemoteConfig = "extended_remote_config",
  Block = "block",
  ExtendedPromoCodes = "extended_promo_codes",
  Actions = "actions",
}

export const THUMBNAIL_CACHE_TIME = 1000 * 60 * 60; // 1 hour

export interface Game {
  id: number;
  name: string;
  rootPlaceId: number;
  ownerPlayer: {
    id: number;
    name: string;
  };
  ownerGroup?: {
    id: number;
    name: string;
  };
  trackingGroup?: {
    id: number;
    name: string;
  };
  features: GameFeature[];
  isSetup: boolean;
  apiKeySet: boolean;
  active: boolean;
}

export interface ScriptConfig {
  events: {
    disableIntervals: boolean;
    disablePlayer: boolean;
    disableAuto: boolean;
    disableAutoPlayer: boolean;
    disableCustomPlayer: boolean;
    disableCustom: boolean;
    disablePlayerText: boolean;
    disableText: boolean;
    disablePlayerlocation: boolean;
    disableLocation: boolean;
    disableMarketplace: boolean;
    disallow: string[];
  };
  intervals: {
    ingest: number;
    ingestRetry: number;
    ingestNoopRetry: number,
    stats: number;
    heartbeat: number;
    playerPositions: number;
    playerCursors: number;
  };
  moderation: {
    kick: boolean;
    mute: boolean;
    ban: boolean;
  }
}

export const DEFAULT_SCRIPT_CONFIG: ScriptConfig = {
  events: {
    disableIntervals: false,
    disablePlayer: false,
    disableAuto: false,
    disableAutoPlayer: false,
    disableCustomPlayer: false,
    disableCustom: false,
    disablePlayerText: false,
    disableText: false,
    disablePlayerlocation: false,
    disableLocation: false,
    disableMarketplace: false,
    disallow: ["scriptError"],
  },
  intervals: {
    ingest: 15,
    ingestRetry: 10,
    ingestNoopRetry: 5,
    heartbeat: 60,
    playerCursors: 0,
    playerPositions: 0,
    stats: 0,
  },
  moderation: {
    kick: true,
    mute: true,
    ban: true
  }
};

export interface DatabaseGame {
  id: string;
  name: string;
  owner_player_id: string | null;
  owner_group_id: string | null;
  tracking_group_id: string | null;
  features: GameFeature[];
  root_place_id: string;
  player_name: string | null;
  group_name: string | null;
  tracking_group_name: string | null;
  is_setup: boolean;
  cloud_key_set: boolean;
  oauth_set: boolean;
  active: boolean;
  last_update: Date;
}

function databaseGameToGame(game: DatabaseGame): Game {
  return {
    id: Number(game.id),
    name: game.name,
    rootPlaceId: Number(game.root_place_id),
    ownerPlayer: {
      id: Number(game.owner_player_id),
      name: game.player_name || `Player ${game.owner_player_id}`,
    },
    ownerGroup: game.owner_group_id ? {
      id: Number(game.owner_group_id),
      name: game.group_name || `Group ${game.owner_group_id}`,
    } : undefined,
    trackingGroup: game.tracking_group_id ? {
      id: Number(game.tracking_group_id),
      name: game.tracking_group_name || `Group ${game.tracking_group_id}`,
    } : undefined,
    features: game.features,
    isSetup: game.is_setup,
    apiKeySet: game.cloud_key_set || game.oauth_set,
    active: game.active,
  };
}

export async function getAllGamesForUser(playerId: string | number): Promise<Game[]> {
  const games = await postgres<DatabaseGame>`
    SELECT
      games.id,
      games.name,
      games.owner_player_id,
      games.owner_group_id,
      games.tracking_group_id,
      games.features,
      games.root_place_id,
      games.last_update,
      player.name as player_name,
      owner_group.name as group_name,
      tracking_group.name as tracking_group_name,
      EXISTS(select * from game_servers WHERE game_id = games.id) as is_setup,
      EXISTS(SELECT * FROM roblox_cloud_keys WHERE game_id = games.id) as cloud_key_set,
      EXISTS(SELECT * FROM roblox_oauth_games WHERE game_id = games.id) as oauth_set
    FROM games
    LEFT JOIN security_role_game_users ON security_role_game_users.game_id = games.id
    LEFT JOIN players player ON player.id = games.owner_player_id
    LEFT JOIN groups owner_group ON owner_group.id = games.owner_group_id
    LEFT JOIN groups tracking_group ON tracking_group.id = games.tracking_group_id
    WHERE security_role_game_users.user_id = ${playerId} AND games.active = true
    GROUP BY games.id, player.name, owner_group.name, tracking_group.name
    ORDER BY games.id;
  `;

  await Promise.all(games
    .filter((game) => new Date(game.last_update) < new Date(Date.now() - 1000 * 60 * 60 * 24))
    .map(async (game) => {
      const result = await updateGameFromRoblox(game.id);
      if (result) {
        game.name = result.name;
        game.root_place_id = String(result.rootPlaceId);
      };
    })
  );

  return games.map(databaseGameToGame);
}

export async function getAllGames(limit: number, skip: number, features?: GameFeature[]): Promise<Game[]> {
  const games = await postgres<DatabaseGame>`
    SELECT
      games.id,
      games.name,
      games.owner_player_id,
      games.owner_group_id,
      games.tracking_group_id,
      games.features,
      games.root_place_id,
      player.name as player_name,
      owner_group.name as group_name,
      tracking_group.name as tracking_group_name,
      EXISTS(select * from game_servers WHERE game_id = games.id) as is_setup,
      EXISTS(SELECT * FROM roblox_cloud_keys WHERE game_id = games.id) as api_key_set,
      EXISTS(SELECT * FROM roblox_oauth_games WHERE game_id = games.id) as oauth_set
    FROM games
    LEFT JOIN players player ON player.id = games.owner_player_id
    LEFT JOIN groups owner_group ON owner_group.id = games.owner_group_id
    LEFT JOIN groups tracking_group ON tracking_group.id = games.tracking_group_id
    WHERE games.active = true ${features ? postgres` AND games.features @> ${features}` : postgres``}
    ORDER BY created DESC
    LIMIT ${limit}
    OFFSET ${skip}
  `;

  return games.map(databaseGameToGame);
}

export async function getGame(robloxId: string | number, noCreate = false, withActive = false): Promise<Game | null> {
  const [gameRecord] = await postgres<DatabaseGame>`
    SELECT
      games.id,
      games.name,
      games.owner_player_id,
      games.owner_group_id,
      games.tracking_group_id,
      games.features,
      games.root_place_id,
      games.active,
      games.last_update,
      player.name as player_name,
      owner_group.name as group_name,
      tracking_group.name as tracking_group_name,
      EXISTS(select * from game_servers WHERE game_id = games.id) as is_setup,
      EXISTS(SELECT * FROM roblox_cloud_keys WHERE game_id = games.id) as api_key_set,
      EXISTS(SELECT * FROM roblox_oauth_games WHERE game_id = games.id) as oauth_set
    FROM games
    LEFT JOIN players player ON player.id = games.owner_player_id
    LEFT JOIN groups owner_group ON owner_group.id = games.owner_group_id
    LEFT JOIN groups tracking_group ON tracking_group.id = games.tracking_group_id
    WHERE games.id = ${robloxId}
  `;


  if (gameRecord) {
    if (!withActive && !gameRecord.active)
      return null;

    if (new Date(gameRecord.last_update) < new Date(Date.now() - 1000 * 60 * 60 * 24)) {
      const result = await updateGameFromRoblox(gameRecord.id);
      if (result) {
        gameRecord.name = result.name;
        gameRecord.root_place_id = String(result.rootPlaceId);
      };
    }

    return databaseGameToGame(gameRecord);
  }

  if (noCreate)
    return null;

  // Create game from roblox if it doesn't exist in the database

  const robloxGame = await getRobloxGame(robloxId);

  if (!robloxGame) {
    return null;
  }

  const ownerGroup = robloxGame.creator.type === "Group" ? {
    id: robloxGame.creator.id,
    name: robloxGame.creator.name,
  } : undefined;
  const group = ownerGroup ? await getRobloxGroup(ownerGroup.id) : undefined;
  const ownerPlayer = robloxGame.creator.type === "User" ? {
    id: robloxGame.creator.id,
    name: robloxGame.creator.name,
  } : (group ? {
    id: group.owner.userId,
    name: group.owner.username,
  } : undefined);

  if (!ownerPlayer) {
    return null;
  }

  await postgres`
    INSERT INTO games (id, name, owner_player_id, owner_group_id, tracking_group_id, ingest_key, script_config, features, root_place_id)
    VALUES ${postgres([[
    robloxGame.id,
    robloxGame.name,
    ownerPlayer.id,
    ownerGroup ? ownerGroup.id : null,
    ownerGroup ? ownerGroup.id : null,
    null,
    JSON.stringify({}),
    [],
    robloxGame.rootPlaceId,
  ]])}
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      owner_player_id = EXCLUDED.owner_player_id,
      owner_group_id = EXCLUDED.owner_group_id,
      tracking_group_id = EXCLUDED.tracking_group_id,
      root_place_id = EXCLUDED.root_place_id
  `;

  try {
    await addGameUserToSecurityRole(robloxGame.id, ownerPlayer.id, 1);
  } catch (_e) {
    // Ignore
  }

  // Query group to make sure it's setup
  if (ownerGroup) {
    await getGroup(ownerGroup.id);
  }

  const [apiKeySet, cloudKeySet] = await postgres<{ apiKeySet: boolean }>`
    SELECT EXISTS(SELECT * FROM roblox_cloud_keys WHERE game_id = ${robloxId}) as api_key_set
    UNION
    SELECT EXISTS(SELECT * FROM roblox_oauth_games WHERE game_id = ${robloxId}) as api_key_set
  `;

  return {
    id: robloxGame.id,
    name: robloxGame.name,
    rootPlaceId: robloxGame.rootPlaceId,
    ownerPlayer,
    ownerGroup,
    trackingGroup: ownerGroup,
    features: [],
    isSetup: false,
    apiKeySet: Boolean(apiKeySet?.apiKeySet || cloudKeySet?.apiKeySet),
    active: true,
  };
}

export async function getGamePlayerOwnerId(id: string | number) {
  const [game] = await postgres<{ owner_player_id: string | null }>`
    SELECT owner_player_id FROM games
    WHERE id = ${id}
  `;

  if (!game)
    return null;

  return Number(game.owner_player_id);
}

export async function updateGame(id: string | number, game: Partial<Omit<Game, 'isSetup' | 'apiKeySet'>>) {
  const update: Partial<DatabaseGame> = {};

  if (game.name)
    update.name = game.name;
  if (game.ownerPlayer)
    update.owner_player_id = String(game.ownerPlayer.id);
  if (game.ownerGroup)
    update.owner_group_id = String(game.ownerGroup.id);
  if (game.trackingGroup)
    update.tracking_group_id = String(game.trackingGroup.id);
  if (game.rootPlaceId)
    update.root_place_id = String(game.rootPlaceId);
  if (game.features)
    update.features = game.features;
  if (game.active !== undefined)
    update.active = game.active;

  await postgres`
    UPDATE games
    SET ${postgres(update)}
    WHERE id = ${id}
  `;
}

export async function updateGameFromRoblox(id: string | number) {
  const robloxGame = await getRobloxGame(id);

  if (!robloxGame) {
    return null;
  }

  await postgres`
    UPDATE games
    SET name = ${robloxGame.name}, root_place_id = ${robloxGame.rootPlaceId}, last_update = now()
    WHERE id = ${id}
  `;

  return {
    id: robloxGame.id,
    name: robloxGame.name,
    rootPlaceId: robloxGame.rootPlaceId,
  };
}

export async function isGameApiKeySet(id: string | number): Promise<boolean> {
  const [{ count }] = await postgres<{ count: string }>`
    SELECT COUNT(*) as count
    FROM roblox_cloud_keys
    WHERE game_id = ${id}
  `;

  return Number(count) > 0;
}

export const CONFIG_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    events: {
      type: "object",
      properties: {
        disableIntervals: { type: "boolean" },
        disablePlayer: { type: "boolean" },
        disableAuto: { type: "boolean" },
        disableAutoPlayer: { type: "boolean" },
        disableCustomPlayer: { type: "boolean" },
        disableCustom: { type: "boolean" },
        disablePlayerText: { type: "boolean" },
        disableText: { type: "boolean" },
        disablePlayerlocation: { type: "boolean" },
        disableLocation: { type: "boolean" },
        disableMarketplace: { type: "boolean" },
        disallow: {
          type: "array",
          items: {
            type: "string"
          },
        },
      },
    },
    intervals: {
      type: "object",
      properties: {
        ingest: { type: "number" },
        ingestRetry: { type: "number" },
        ingestNoopRetry: { type: "number" },
        stats: { type: "number" },
        heartbeat: { type: "number" },
        playerPositions: { type: "number" },
        playerCursors: { type: "number" },
      },
    },
    moderation: {
      type: "object",
      properties: {
        kick: { type: "boolean" },
        mute: { type: "boolean" },
        ban: { type: "boolean" },
      },
    },
  },
};

export function mergeScriptConfigs(current?: Partial<ScriptConfig>, updated?: Partial<ScriptConfig>) {
  return {
    events: {
      ...DEFAULT_SCRIPT_CONFIG.events,
      ...(current?.events || {}),
      ...(updated?.events || {}),
    },
    intervals: {
      ...DEFAULT_SCRIPT_CONFIG.intervals,
      ...(current?.intervals || {}),
      ...(updated?.intervals || {}),
    },
    moderation: {
      ...DEFAULT_SCRIPT_CONFIG.moderation,
      ...(current?.moderation || {}),
      ...(updated?.moderation || {}),
    }
  };
}

export async function getScriptConfig(gameId: string | number): Promise<{
  ingestKey?: string;
  config: ScriptConfig;
}> {
  const [game] = await postgres<{ script_config: Partial<ScriptConfig>; ingest_key: string | null }>`
    SELECT script_config, ingest_key
    FROM games
    WHERE id = ${gameId}
  `;

  if (!game)
    return {
      config: DEFAULT_SCRIPT_CONFIG,
    };

  let ingestKey = game.ingest_key;

  if (!ingestKey) {
    const newKey = crypto.randomUUID().replace(/-/g, "");

    await postgres`
      UPDATE games
      SET ingest_key = ${newKey}
      WHERE id = ${gameId}
    `;

    ingestKey = newKey;
  }

  const dbConfig = typeof game.script_config === "string" ? JSON.parse(game.script_config) : game.script_config;
  const config = mergeScriptConfigs(dbConfig);

  return {
    ingestKey,
    config,
  };
}

export async function updateScriptConfig(gameId: string | number, config: ScriptConfig) {
  await postgres`
    UPDATE games
    SET script_config = ${JSON.stringify(config)}
    WHERE id = ${gameId}
  `;
}

export async function getGameRemoteConfig(id: string | number): Promise<Record<string, unknown>> {
  const config = await postgres<{ key: string, value: string }>`
    SELECT
      key,
      value
    FROM
      remote_config
    WHERE
      game_id = ${id}
    ORDER BY
      key ASC
  `;

  return config.reduce((previous, current) => ({ ...previous, [current.key]: JSON.parse(current.value) }), {});
}

export async function updateGameRemoteConfig(id: string | number, config: Record<string, unknown>) {
  const upsert: [string | number, string, string][] = [];
  const remove: string[] = [];

  for (const [key, value] of Object.entries(config)) {
    if (value === null || value === "") {
      remove.push(key);
    } else {
      upsert.push([id, key, JSON.stringify(value)]);
    }
  }

  if (upsert.length > 0) {
    await postgres`
      INSERT INTO remote_config (game_id, key, value)
      VALUES ${postgres(upsert)}
      ON CONFLICT (game_id, key) DO UPDATE SET value = EXCLUDED.value
    `;
  }
  if (remove.length > 0) {
    await postgres`
      DELETE FROM remote_config
      WHERE game_id = ${id} AND key IN (${remove})
    `;
  }
}

export async function addGameRobloxApiKey(id: string | number, key: string) {
  await postgres<{ id: number }>`
    INSERT INTO roblox_cloud_keys (game_id, key)
    VALUES (${id}, ${key})
    ON CONFLICT (game_id, key) DO NOTHING
  `;
}

export async function getGamesFromDiscordId(id: string | number): Promise<Game[]> {
  const games = await postgres<DatabaseGame>`
    SELECT
      games.id,
      games.name,
      games.owner_player_id,
      games.owner_group_id,
      games.tracking_group_id,
      games.features,
      games.root_place_id,
      player.name as player_name,
      owner_group.name as group_name,
      tracking_group.name as tracking_group_name
    FROM games
    LEFT JOIN players player ON player.id = games.owner_player_id
    LEFT JOIN groups owner_group ON owner_group.id = games.owner_group_id
    LEFT JOIN groups tracking_group ON tracking_group.id = games.tracking_group_id
    WHERE discord_guild_id = ${id} AND games.active = true
    ORDER BY games.id ASC
  `;

  return games.map(databaseGameToGame);
}

export async function clearGameDataPostgres(id: string | number): Promise<void> {
  await postgres`
    DELETE FROM game_servers WHERE game_id = ${id};
  `;
  await postgres`
    DELETE FROM game_players WHERE game_id = ${id};
  `;
  await postgres`
    DELETE FROM player_sessions WHERE game_id = ${id};
  `;
  await postgres`
    DELETE FROM games WHERE id = ${id};
  `;
}

export async function setGameActive(id: string | number, active: boolean) {
  await postgres`
    UPDATE games SET active = ${active} WHERE id = ${id};
  `;
}
