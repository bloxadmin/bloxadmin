import postgres from "../util/postgres.ts";

export interface PlayerChat {
  id: string;
  gameId?: number;
  serverId?: string;
  time: Date;
  playerId: number;
  message: string;
  recipientId?: number;
}

export async function addPlayerMessage(gameId: number, serverId: string, time: Date, playerId: number, message: string, recipientId?: number) {
  await postgres`
    INSERT INTO player_chat (game_id, server_id, time, player_id, message, recipient_id)
    VALUES (${gameId}, ${serverId}, ${time}, ${playerId}, ${message || ""}, ${recipientId || null})
  `;
}

export async function getTotalChatMessages(gameId: number, serverId: string): Promise<number> {
  const [{ count }] = await postgres<{ count: string }>`
    SELECT COUNT(*) as count FROM player_chat
    WHERE game_id = ${gameId} AND server_id = ${serverId}
    AND time > NOW() - INTERVAL '30 DAYS'
  `;

  return Number(count);
}

export async function getChatMessages(gameId: number, serverId: string, limit: number, skip: number): Promise<PlayerChat[]> {
  const messages = await postgres<{
    id: string;
    player_id: number | string;
    message: string;
    time: Date;
    recipient_id: number | null;
  }>`
    SELECT id, player_id, message, time, recipient_id FROM player_chat
    WHERE game_id = ${gameId} AND server_id = ${serverId}
    AND time > NOW() - INTERVAL '30 DAYS'
    ORDER BY time DESC
    LIMIT ${limit} OFFSET ${skip}
  `

  return messages.map((message) => ({
    id: message.id,
    playerId: Number(message.player_id),
    message: message.message,
    time: message.time,
    recipientId: message.recipient_id || undefined,
  }));
}
