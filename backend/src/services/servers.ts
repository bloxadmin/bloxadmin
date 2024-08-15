import { nextTick } from "https://deno.land/std@0.132.0/node/_next_tick.ts";
import postgres from "../util/postgres.ts";
import { DEFAULT_SCRIPT_CONFIG, ScriptConfig } from "./games.ts";

export interface ServerPlayer {
  id: number;
  name: string;
  joinedAt: Date;
}

export interface GameServer {
  id: string;
  gameId?: number;
  placeVersion: number;
  scriptVersion: number;
  startedAt: Date;
  closedAt?: Date;
  lastHeartbeatAt?: Date;
  onlinePlayers: ServerPlayer[];
  privateServerId?: string;
}

export const ONLINE_THRESHOLD = 1000 * 60 * 3;

export interface DatabaseGameServer {
  id: string;
  game_id: string;
  place_version: number | null;
  script_version: number | null;
  started_at: Date | null;
  closed_at: Date | null;
  last_heartbeat: Date | null;
  online_players: string;
  private_server_id: string | null;
}

function gameServerFromDatabase(server: DatabaseGameServer): GameServer {
  return {
    id: server.id,
    gameId: server.game_id ? parseInt(server.game_id) : undefined,
    placeVersion: server.place_version || 0,
    scriptVersion: server.script_version || 0,
    startedAt: server.started_at || new Date(0),
    closedAt: server.closed_at || undefined,
    lastHeartbeatAt: server.last_heartbeat || undefined,
    onlinePlayers: typeof server.online_players === 'string' ? JSON.parse(server.online_players || '[]').map((plr: {
      id: number;
      name: string;
      joinedAt: number;
    }) => ({
      id: plr.id,
      name: plr.name,
      joinedAt: new Date(plr.joinedAt * 1000),
    })) : server.online_players,
    privateServerId: server.private_server_id || undefined,
  }
}

export async function getServer(gameId: string | number, serverId: string): Promise<GameServer | null> {
  const [server] = await postgres<DatabaseGameServer>`
    SELECT 
      id,
      place_version,
      script_version,
      started_at,
      closed_at,
      last_heartbeat,
      online_players,
      private_server_id
    FROM game_servers
    WHERE id = ${serverId}
    AND game_id = ${gameId}
  `;

  if (!server)
    return null;

  return gameServerFromDatabase(server);
}

export async function getServers(gameId: string | number, {
  limit,
  skip,
  online,
}: {
  limit?: number;
  skip?: number;
  online?: boolean;
} = {}): Promise<GameServer[]> {
  const records = (online ? await postgres<DatabaseGameServer>`
    SELECT id, place_version, script_version, started_at, closed_at, last_heartbeat, online_players, private_server_id
    FROM game_servers
    WHERE game_id = ${gameId}
    AND closed_at IS NULL
    AND last_heartbeat > NOW() - INTERVAL '3 minutes'
    ORDER BY started_at DESC
    LIMIT ${limit || 100}
    OFFSET ${skip || 0}
  ` : await postgres`
    SELECT id, place_version, script_version, started_at, closed_at, last_heartbeat, online_players, private_server_id
    FROM game_servers
    WHERE game_id = ${gameId}
    ORDER BY started_at DESC
    LIMIT ${limit || 100}
    OFFSET ${skip || 0}
  `) as DatabaseGameServer[];

  return records.filter((s) => s !== undefined).map(gameServerFromDatabase);
}

export async function updateHeartbeat(gameId: string | number, serverId: string, at: Date, data: {
  onlinePlayers: {
    id: number;
    name: string;
    joinedAt: number;
  }[];
}): Promise<void> {
  await postgres`
    INSERT INTO game_servers (id, game_id, last_heartbeat, online_players)
    VALUES (${serverId}, ${gameId}, ${at}, ${JSON.stringify(data.onlinePlayers)}::jsonb)
    ON CONFLICT (id) DO UPDATE SET last_heartbeat = ${at}, online_players = ${JSON.stringify(data.onlinePlayers)}::jsonb
  `;

  nextTick(async () => {
    const openSessions = await postgres<{ id: string, player_id: string }>`
      SELECT id, player_id
      FROM player_sessions
      WHERE server_id = ${serverId} AND game_id = ${gameId} AND leave_time IS NULL
    `;

    const shouldClose = openSessions.filter((session) => !data.onlinePlayers.find((plr) => plr.id === parseInt(session.player_id)));

    if (shouldClose.length > 0) {
      await postgres`
        UPDATE player_sessions
        SET leave_time = ${at}
        WHERE id = ANY(${shouldClose.map((s) => s.id)})
      `;
    }
  });
}

export async function initServer(gameId: string | number, serverId: string, host: string, modes: string[]): Promise<void> {
  if (modes.includes("studio"))
    return;

  // TODO:Store host
}

export async function updateStats(gameId: string | number, serverId: string, stats: Record<string, number>) {
  // TODO: Update hot stats
}

export async function serverOpen(gameId: string | number, serverId: string, data: {
  startedAt: Date;
  placeVersion: number;
  privateServerId: string;
  scriptVersion: number;
}): Promise<void> {
  await postgres`
    INSERT INTO game_servers (id, game_id, started_at, place_version, private_server_id, script_version)
    VALUES (${serverId}, ${gameId}, ${data.startedAt}, ${data.placeVersion}, ${data.privateServerId || null}, ${data.scriptVersion})
    ON CONFLICT (id) DO UPDATE SET started_at = ${data.startedAt}, place_version = ${data.placeVersion}, private_server_id = ${data.privateServerId || null}, script_version = ${data.scriptVersion}
  `;
}

export async function serverClose(gameId: string | number, serverId: string, data: {
  closedAt: Date;
}): Promise<void> {
  await postgres`
    UPDATE game_servers
    SET closed_at = ${data.closedAt}
    WHERE id = ${serverId} AND game_id = ${gameId}
  `;
  await postgres`
    UPDATE player_sessions
    SET leave_time = ${data.closedAt}
    WHERE server_id = ${serverId} AND game_id = ${gameId} AND leave_time IS NULL
  `;
}

export async function updateServer(gameId: string | number, serverId: string, data: Partial<GameServer>): Promise<void> {
  const update: Partial<Omit<DatabaseGameServer, 'online_players'> & {
    online_players: string;
  }> = {};

  if (data.closedAt)
    update.closed_at = data.closedAt;
  if (data.lastHeartbeatAt)
    update.last_heartbeat = data.lastHeartbeatAt;
  if (data.onlinePlayers)
    update.online_players = JSON.stringify(data.onlinePlayers);
  if (data.placeVersion)
    update.place_version = data.placeVersion;
  if (data.scriptVersion)
    update.script_version = data.scriptVersion;
  if (data.startedAt)
    update.started_at = data.startedAt;
  if (data.privateServerId)
    update.private_server_id = data.privateServerId;

  await postgres`
    UPDATE game_servers
    SET ${postgres(update)}
    WHERE id = ${serverId} AND game_id = ${gameId}
  `;
}


export async function getOnlinePlayerServer(gameId: string | number | unknown, playerId: RobloxID): Promise<GameServer | undefined> {
  const [server] = await postgres<DatabaseGameServer>`
    SELECT
      game_servers.id,
      game_servers.game_id,
      game_servers.place_version,
      game_servers.script_version,
      game_servers.started_at,
      game_servers.closed_at,
      game_servers.last_heartbeat,
      game_servers.online_players,
      game_servers.private_server_id
    FROM player_sessions
    LEFT JOIN game_servers ON player_sessions.server_id = game_servers.id
    WHERE 
      player_sessions.player_id = ${playerId} 
      AND player_sessions.game_id = ${gameId} 
      AND game_servers.closed_at IS NULL 
      AND last_heartbeat > NOW() - INTERVAL '3 minutes'
    ORDER BY started_at DESC
    LIMIT 1
  `;

  if (!server)
    return undefined;

  return gameServerFromDatabase(server);
}

export async function getServerCount(gameId: string | number, { online }: { online?: boolean } = {}): Promise<number> {
  const [{ count }] = (online ? await postgres<{ count: string }>`
    SELECT COUNT(*) AS count
    FROM game_servers
    WHERE game_id = ${gameId}
    AND closed_at IS NULL
    AND last_heartbeat > NOW() - INTERVAL '3 minutes'
  ` : await postgres<{ count: string }>`
    SELECT COUNT(*) AS count
    FROM game_servers
    WHERE game_id = ${gameId}
  `);

  return parseInt(count);
}


export async function getGameServerStats(gameId: string | number): Promise<{
  activeServerCount: number;
  onlinePlayerCount: number;
}> {
  // TODO: Do this better, will be bad for large games
  const servers = await postgres<DatabaseGameServer>`
    SELECT online_players
    FROM game_servers
    WHERE game_id = ${gameId}
    AND closed_at IS NULL
    AND last_heartbeat > NOW() - INTERVAL '3 minutes'
    ORDER BY started_at DESC
  `

  const activeServerCount = servers.length;
  const onlinePlayerCount = servers.reduce((acc, server) => acc + JSON.parse(server.online_players).length, 0);

  return {
    activeServerCount,
    onlinePlayerCount,
  }
}

export interface SerchPlayer {
  gameId: string | number;
  serverId: string;
  player: ServerPlayer;
}

export async function getActionServerIds(gameId: RobloxID, actionId: string): Promise<string[]> {
  const records = await postgres<{ server_id: string }>`
    SELECT server_id
    FROM game_action_servers
    WHERE game_id = ${gameId} AND action_id = ${actionId}
  `;

  return records.map((r) => r.server_id);
}

export async function getActionServers(gameId: RobloxID, actionId: string): Promise<GameServer[]> {
  const records = await postgres<DatabaseGameServer>`
    SELECT 
      s.id, 
      s.game_id, 
      s.place_version, 
      s.script_version, 
      s.started_at, 
      s.closed_at, 
      s.last_heartbeat, 
      s.online_players, 
      s.private_server_id
    FROM game_servers s
    LEFT JOIN game_action_servers r ON r.server_id = game_servers.id
    WHERE r.game_id = ${gameId} 
      AND r.action_id = ${actionId}
      AND s.closed_at IS NULL 
      AND s.last_heartbeat > NOW() - INTERVAL '3 minutes'
  `;

  return records.map(gameServerFromDatabase);
}

export async function getActionServer(gameId: string | number, actionId: string): Promise<string | undefined> {
  const [server] = await postgres<{ id: string }>`
    SELECT s.id
    FROM game_servers s
    LEFT JOIN game_action_servers r ON r.server_id = s.id
    WHERE s.game_id = ${gameId}
    AND r.action_id = ${actionId}
    AND s.closed_at IS NULL 
    AND s.last_heartbeat > NOW() - INTERVAL '3 minutes'
    ORDER BY last_heartbeat DESC
    LIMIT 1
  `;

  if (!server)
    return undefined;

  return server.id;
}
