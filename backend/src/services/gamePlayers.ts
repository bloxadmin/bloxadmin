import postgres from "../util/postgres.ts";
import { getRobloxPlayer, getRobloxPlayers } from "./roblox.ts";

export interface GamePlayer {
  id: number;
  name: string;
  playtime: number,
  moderation: {
    banned: boolean;
    banUntil?: Date;
    banReason?: string;
    muted: boolean;
    muteUntil?: Date;
    muteReason?: string;
  },
  lastJoin?: {
    time: Date;
    serverId: string;
  };
  country?: string;
}

interface DatabaseGamePlayer {
  id: string;
  name: string;
  playtime: number;
  banned: boolean;
  ban_until: Date | null;
  ban_reason: string | null;
  muted: boolean;
  mute_until: Date | null;
  mute_reason: string | null;
  first_join_at: Date | null;
  last_join_at: Date | null;
  last_server_id: string | null;
  country_code: string | null;
}

function dbPlayerToGamePlayer(player: DatabaseGamePlayer): GamePlayer {
  return {
    id: Number(player.id),
    name: player.name,
    playtime: player.playtime,
    moderation: {
      banned: player.banned && (!player.ban_until || player.ban_until.getTime() > Date.now()),
      banUntil: player.ban_until || undefined,
      banReason: player.ban_reason || undefined,
      muted: player.muted && (!player.mute_until || player.mute_until.getTime() > Date.now()),
      muteUntil: player.mute_until || undefined,
      muteReason: player.mute_reason || undefined,
    },
    lastJoin: player.last_server_id && player.last_join_at ? {
      time: player.last_join_at,
      serverId: player.last_server_id,
    } : undefined,
    country: player.country_code || undefined,
  };
}

export async function getGamePlayer(gameId: string | number, robloxId: string | number, { noCreate = false }: { noCreate?: boolean } = {}): Promise<GamePlayer | null> {
  if (robloxId === 0 || robloxId === '0') {
    return {
      id: 0,
      name: 'System',
      moderation: {
        banned: false,
        muted: false,
      },
      playtime: 0,
    };
  }

  const [player] = await postgres<DatabaseGamePlayer>`
    SELECT
      plr.id,
      plr.name,
      playtime,
      ban.id IS NOT NULL as banned,
      ban.expires  as ban_until,
      ban.reason   as ban_reason,
      mute.id IS NOT NULL as muted,
      mute.expires as mute_until,
      mute.reason  as mute_reason,
      first_join_at,
      last_join_at,
      last_server_id,
      country_code
    FROM game_players gp
        LEFT JOIN players plr ON plr.id = gp.player_id
        LEFT JOIN moderation_actions ban ON ban.id = gp.ban_id
        LEFT JOIN moderation_actions mute ON mute.id = gp.mute_id
    WHERE gp.game_id = ${gameId}
    AND gp.player_id = ${robloxId}
    ORDER BY ban.expires DESC, mute.expires DESC
  `;

  if (player)
    return dbPlayerToGamePlayer(player);

  if (noCreate)
    return null;

  const robloxPlayer = await getRobloxPlayer(robloxId);

  if (!robloxPlayer)
    return null;

  await postgres`
    INSERT INTO players (id, name)
    VALUES (${robloxId}, ${robloxPlayer.name})
    ON CONFLICT (id) DO UPDATE SET name = ${robloxPlayer.name}
  `;
  await postgres`
    INSERT INTO game_players (game_id, player_id)
    VALUES (${gameId}, ${robloxId})
    ON CONFLICT (game_id, player_id) DO NOTHING
  `;

  return {
    id: Number(robloxId),
    name: robloxPlayer.name,
    moderation: {
      banned: false,
      muted: false,
    },
    playtime: 0,
  };
}

export async function getGamePlayers(gameId: string | number, ids: number[]): Promise<GamePlayer[]> {
  const records = await postgres<DatabaseGamePlayer>`
    SELECT
      plr.id,
      plr.name,
      playtime,
      ban.id IS NOT NULL as banned,
      ban.expires  as ban_until,
      ban.reason   as ban_reason,
      mute.id IS NOT NULL as muted,
      mute.expires as mute_until,
      mute.reason  as mute_reason,
      first_join_at,
      last_join_at,
      last_server_id,
      country_code
    FROM game_players gp
        LEFT JOIN players plr ON plr.id = gp.player_id
        LEFT JOIN moderation_actions ban ON ban.id = gp.ban_id
        LEFT JOIN moderation_actions mute ON mute.id = gp.mute_id
    WHERE gp.game_id = ${gameId}
    AND gp.player_id = ANY(${ids})
    ORDER BY ban.expires DESC, mute.expires DESC
  `;


  const foundIds = records.map(rec => Number(rec.id));
  const missingIds = ids.filter(id => !foundIds.includes(id));

  const players = records.map(dbPlayerToGamePlayer);

  if (missingIds.length === 0)
    return players;

  const robloxPlayers = await getRobloxPlayers(missingIds);

  await Promise.all(robloxPlayers.map(async (robloxPlayer) => {
    const gamePlayer: GamePlayer = {
      id: robloxPlayer.id,
      name: robloxPlayer.name,
      moderation: {
        banned: false,
        muted: false,
      },
      playtime: 0,
    };

    await postgres`
      INSERT INTO players (id, name)
      VALUES (${robloxPlayer.id}, ${robloxPlayer.name})
      ON CONFLICT (id) DO UPDATE SET name = ${robloxPlayer.name}
    `;
    await postgres`
      INSERT INTO game_players (game_id, player_id)
      VALUES (${gameId}, ${robloxPlayer.id})
      ON CONFLICT (game_id, player_id) DO NOTHING
    `;

    players.push(gamePlayer);
  }));

  return players;
}

export async function listGamePlayers(gameId: string | number, limit: number, skip: number): Promise<GamePlayer[]> {
  const records = await postgres<DatabaseGamePlayer>`
    SELECT
      plr.id,
      plr.name,
      playtime,
      ban.id IS NOT NULL as banned,
      ban.expires  as ban_until,
      ban.reason   as ban_reason,
      mute.id IS NOT NULL as muted,
      mute.expires as mute_until,
      mute.reason  as mute_reason,
      first_join_at,
      last_join_at,
      last_server_id,
      country_code
    FROM game_players gp
        LEFT JOIN players plr ON plr.id = gp.player_id
        LEFT JOIN moderation_actions ban ON ban.id = gp.ban_id
        LEFT JOIN moderation_actions mute ON mute.id = gp.mute_id
    WHERE gp.game_id = ${gameId}
    ORDER BY gp.playtime DESC, ban.expires DESC, mute.expires DESC
    LIMIT ${limit} OFFSET ${skip}
  `;

  return records.map(dbPlayerToGamePlayer);
}

export async function searchGamePlayers(gameId: string | number, query: string, limit: number, skip: number): Promise<GamePlayer[]> {
  const records = await postgres<DatabaseGamePlayer>`
    SELECT
      plr.id,
      plr.name,
      playtime,
      ban.id IS NOT NULL as banned,
      ban.expires  as ban_until,
      ban.reason   as ban_reason,
      mute.id IS NOT NULL as muted,
      mute.expires as mute_until,
      mute.reason  as mute_reason,
      first_join_at,
      last_join_at,
      last_server_id,
      country_code
    FROM game_players gp
        LEFT JOIN players plr ON plr.id = gp.player_id
        LEFT JOIN moderation_actions ban ON ban.id = gp.ban_id
        LEFT JOIN moderation_actions mute ON mute.id = gp.mute_id
    WHERE gp.game_id = ${gameId}
    AND plr.name ILIKE ${`${query}%`}
    ORDER BY  gp.playtime DESC, ban.expires DESC, mute.expires DESC
    LIMIT ${limit} OFFSET ${skip}
  `;

  return records.map(dbPlayerToGamePlayer);
}

export async function gamePlayerJoinedGame(gameId: string | number, robloxId: string | number, serverId: string, time: Date, countryCode: string, name?: string): Promise<{
  firstJoin: boolean;
  firstJoinAt?: Date;
}> {
  await postgres`
    INSERT INTO players (id, name)
    VALUES (${robloxId}, ${name})
    ON CONFLICT(id) DO UPDATE SET name = ${name}
    WHERE players.* IS DISTINCT FROM EXCLUDED.*
  `;
  const [{ first_join_at }] = await postgres<{ first_join_at: Date }>`
    INSERT INTO game_players(game_id, player_id, last_join_at, last_server_id, country_code, first_join_at)
    VALUES (${gameId}, ${robloxId}, ${time}, ${serverId}, ${countryCode}, ${time})
    ON CONFLICT(game_id, player_id) DO UPDATE SET
      last_join_at = ${time}, last_server_id = ${serverId}, country_code = ${countryCode}
    RETURNING first_join_at
  `;

  if (!first_join_at || !time)
    return {
      firstJoin: false,
    };

  return {
    firstJoin: first_join_at.getTime() === time.getTime(),
    firstJoinAt: first_join_at && new Date(first_join_at),
  };
}

export async function gamePlayerLeftGame(robloxId: string | number, gameId: string | number, _serverId: string, _time: Date, playtime: number) {
  // TODO: Make updating playtime isomorphic
  await postgres`
    UPDATE game_players
    SET playtime = playtime + ${playtime}
    WHERE game_id = ${gameId} AND player_id = ${robloxId}
  `;
}

export async function getTotalGamePlayers(gameId: string | number): Promise<number> {
  const [{ count }] = await postgres<{ count: string }>`
    SELECT COUNT(*) as count FROM game_players
    WHERE game_id = ${gameId}
  `;

  return Number(count);
}


export async function updatePlayerFromRoblox(robloxId: string | number) {
  const robloxPlayer = await getRobloxPlayer(robloxId);

  if (!robloxPlayer) {
    return null;
  }

  await postgres`
    INSERT INTO players (id, name)
    VALUES (${robloxId}, ${robloxPlayer.name})
    ON CONFLICT (id) DO UPDATE SET name = ${robloxPlayer.name}
  `;
}
