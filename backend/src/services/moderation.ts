import postgres from "../util/postgres.ts";

export type ModerationType = "ban" | "mute" | "kick" | "warn" | "unban" | "unmute";

export interface ModerationEventData {
  type: ModerationType;
  reason?: string;
  expiresAt: Date | null;
  moderator: {
    robloxId: number;
    name?: string;
  };
}

export interface ModerationAction {
  id: string;
  player?: {
    id: number;
    name: string;
  };
  type: ModerationType;
  reason?: string;
  createdAt: Date;
  expiresAt?: Date;
  addedAt: Date;
  moderator: {
    id: number;
    name: string;
  }
}

interface DatabaseModerationAction {
  id: string;
  type: ModerationType;
  reason: string | null;
  created: Date;
  expires: Date | null;
  moderator_id: string;
  moderator_name: string;
  player_id?: string;
  player_name?: string;
}

export async function addModerationEvent(gameId: string | number, playerId: string | number, event: ModerationEventData): Promise<void> {
  const [{ id }] = await postgres<{ id: string | number }>`
    INSERT INTO moderation_actions (game_id, player_id, type, reason, expires, moderator_id)
    VALUES (${gameId}, ${playerId}, ${event.type}, ${event.reason || null}, ${event.expiresAt || null}, ${event.moderator.robloxId})
    RETURNING id
  `;

  if (event.type === "ban")
    await postgres`
      UPDATE game_players
      SET ban_id = ${id}
      WHERE game_id = ${gameId} AND player_id = ${playerId}
    `;
  else if (event.type === "mute")
    await postgres`
      UPDATE game_players
      SET mute_id = ${id}
      WHERE game_id = ${gameId} AND player_id = ${playerId}
    `;
  else if (event.type === "unban")
    await postgres`
      UPDATE game_players
      SET ban_id = NULL
      WHERE game_id = ${gameId} AND player_id = ${playerId}
    `;
  else if (event.type === "unmute")
    await postgres`
      UPDATE game_players
      SET mute_id = NULL
      WHERE game_id = ${gameId} AND player_id = ${playerId}
    `;
}

export async function getModerationHistory(gameId: string | number, playerId: string | number, limit: number, skip: number): Promise<ModerationAction[]> {
  const records = await postgres<DatabaseModerationAction>`
  SELECT
  moderation_actions.id,
    type,
    reason,
    created,
    expires,
    moderator_id,
    moderator.name as moderator_name
    FROM moderation_actions
    LEFT JOIN players moderator ON moderator.id = moderator_id
    WHERE game_id = ${gameId} AND player_id = ${playerId}
    ORDER BY created DESC
    LIMIT ${limit} OFFSET ${skip}
  `;

  return records.map((record) => ({
    id: record.id,
    type: record.type,
    reason: record.reason || undefined,
    createdAt: record.created || undefined,
    expiresAt: record.expires || undefined,
    addedAt: record.created,
    moderator: {
      id: Number(record.moderator_id),
      name: record.moderator_name,
    }
  }));
}

export async function getTotalModerationEvents(gameId: string | number, playerId: string | number) {
  const [{ count }] = await postgres<{ count: string }>`
    SELECT COUNT(*) as count FROM moderation_actions
    WHERE game_id = ${gameId} AND player_id = ${playerId}
  `;

  return Number(count);
}

export async function getGameModerationHistory(gameId: string | number, limit: number, skip: number): Promise<ModerationAction[]> {
  const records = await postgres<DatabaseModerationAction>`
    SELECT
      moderation_actions.id,
      type,
      reason,
      created,
      expires,
      moderator_id,
      moderator.name as moderator_name,
      player_id,
      player.name as player_name
    FROM moderation_actions
    LEFT JOIN players moderator ON moderator.id = moderator_id
    LEFT JOIN players player ON player.id = player_id
    WHERE game_id = ${gameId}
    ORDER BY created DESC
    LIMIT ${limit} OFFSET ${skip}
  `;

  return records.map((record) => ({
    id: record.id,
    type: record.type,
    reason: record.reason || undefined,
    createdAt: record.created || undefined,
    expiresAt: record.expires || undefined,
    addedAt: record.created,
    moderator: {
      id: Number(record.moderator_id),
      name: record.moderator_name,
    },
    player: {
      id: Number(record.player_id!),
      name: record.player_name!,
    }
  }));
}

export async function getTotalGameModerationEvents(gameId: string | number) {
  const [{ count }] = await postgres<{ count: string }>`
    SELECT COUNT(*) as count FROM moderation_actions
    WHERE game_id = ${gameId}
  `;

  return Number(count);
}
