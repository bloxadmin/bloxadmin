import { PlayerJoinEventData } from "../events/playerJoin.ts";
import { PlayerLeaveEventData } from "../events/playerLeave.ts";
import { PlayerReadyData } from "../events/playerReady.ts";
import postgres from "../util/postgres.ts";

export interface HistoryEvent {
  gameId: string | number;
  playerId: number;
  serverId: string;
  playerSessionId: string;
  addedAt: Date
}

export type PlayerJoinEvent = HistoryEvent & PlayerJoinEventData & { data?: PlayerReadyData; };
export type PlayerLeaveEvent = HistoryEvent & PlayerLeaveEventData;

export async function recordPlayerJoin(
  event: Omit<HistoryEvent, "updatedAt">,
  data: PlayerJoinEventData,
) {
  await postgres`
    INSERT INTO player_sessions (id, player_id, game_id, server_id, join_time, country_code)
    VALUES (${event.playerSessionId}, ${event.playerId}, ${event.gameId}, ${event.serverId}, ${event.addedAt}, ${data.countryCode})
    ON CONFLICT (id) DO NOTHING
  `;
}

export async function recordPlayerLeave(
  event: Omit<HistoryEvent, "updatedAt">,
  data: PlayerLeaveEventData,
) {
  await postgres`
    UPDATE player_sessions
    SET leave_time = ${event.addedAt}, playtime = ${data.playTime}
    WHERE id = ${event.playerSessionId}
  `;
}

export async function updateSessionData(playerSessionId: string, data: PlayerReadyData) {
  // TODO: Record player session data
}

export async function getPlayerSessions(gameId: string | number, playerId: number, limit: number, offset: number): Promise<{
  sessionId: string;
  serverId: string;
  joinedAt: Date;
  leftAt?: Date;
  playTime: number;
}[]> {
  const sessions = await postgres<{
    id: string;
    server_id: string;
    join_time: Date;
    leave_time: Date | null;
    playtime: number;
  }>`
    SELECT id, server_id, join_time, leave_time, playtime
    FROM player_sessions
    WHERE game_id = ${gameId} AND player_id = ${playerId}
    AND join_time > NOW() - INTERVAL '30 DAYS'
    ORDER BY join_time DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  return sessions.map((session) => ({
    sessionId: session.id,
    serverId: session.server_id,
    joinedAt: session.join_time,
    leftAt: session.leave_time || undefined,
    playTime: session.playtime,
  }));
}

export async function getPlayerSessionsBetween(gameId: string | number, playerId: number | string, start: Date, end: Date): Promise<{
  sessionId: string;
  serverId: string;
  joinedAt: Date;
  leftAt?: Date;
  playTime: number;
}[]> {
  const sessions = await postgres<{
    id: string;
    server_id: string;
    join_time: Date;
    leave_time: Date | null;
    playtime: number;
  }>`
    SELECT id, server_id, join_time, leave_time, playtime
    FROM player_sessions
    WHERE game_id = ${gameId} AND player_id = ${playerId} AND join_time >= ${start} AND join_time < ${end}
    AND join_time > NOW() - INTERVAL '30 DAYS'
    ORDER BY join_time DESC
  `;

  return sessions.map((session) => ({
    sessionId: session.id,
    serverId: session.server_id,
    joinedAt: session.join_time,
    leftAt: session.leave_time || undefined,
    playTime: session.playtime,
  }));
}

export async function getTotalPlayerSessions(gameId: string | number, playerId: number): Promise<number> {
  const [{ count }] = await postgres<{ count: string }>`
    SELECT COUNT(*) FROM player_sessions
    WHERE game_id = ${gameId} AND player_id = ${playerId}
    AND join_time > NOW() - INTERVAL '30 DAYS'
  `;

  return parseInt(count);
}

export async function getServerSessions(gameId: string | number, serverId: string, limit: number, offset: number): Promise<{
  player: {
    id: number;
    name: string;
  };
  sessionId: string;
  serverId: string;
  joinedAt: Date;
  leftAt?: Date;
  playTime: number;
}[]> {
  const sessions = await postgres<{
    player_id: number;
    name: string;
    id: string;
    join_time: Date;
    leave_time: Date | null;
    playtime: number | null;
  }>`
    SELECT player_id, players.name, player_sessions.id, join_time, leave_time, playtime
    FROM player_sessions
    LEFT JOIN players ON player_sessions.player_id = players.id
    WHERE game_id = ${gameId} AND server_id = ${serverId}
    AND join_time > NOW() - INTERVAL '30 DAYS'
    ORDER BY join_time DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  return sessions.map((session) => ({
    player: {
      id: session.player_id,
      name: session.name,
    },
    sessionId: session.id,
    serverId: serverId,
    joinedAt: session.join_time,
    leftAt: session.leave_time || undefined,
    playTime: session.playtime || (session.leave_time ? Math.floor((session.leave_time.getTime() - session.join_time.getTime()) / 1000) : Math.floor((new Date().getTime() - session.join_time.getTime()) / 1000)),
  }));
}

export async function getTotalServerSessions(gameId: string | number, serverId: string): Promise<number> {
  const [{ count }] = await postgres<{ count: string }>`
    SELECT COUNT(*) FROM player_sessions
    WHERE game_id = ${gameId} AND server_id = ${serverId}
    AND join_time > NOW() - INTERVAL '30 DAYS'
  `;

  return parseInt(count);
}
