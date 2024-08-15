import postgres from "../util/postgres.ts";

export interface CreatePromoCode {
  attributes: Record<string, unknown>;
  uses?: number;
  active: boolean;
  starts?: Date;
  expires?: Date;
}

export interface PromoCode extends CreatePromoCode {
  code: string;
  used: number;
  created: Date;
}

export interface PromoCodeUse {
  code: string;
  player?: {
    id: number;
    name: string;
  };
  serverId: string;
  used: Date;
}

interface DatabasePromoCode {
  game_id: string;
  code: string;
  attributes: string;
  uses: string | null;
  used: string;
  active: boolean;
  created: Date;
  starts: Date | null;
  expires: Date | null;
}

interface DatabasePromoCodeUse {
  game_id: number;
  code: string;
  player_id: number;
  player_name: string;
  server_id: string;
  used: Date;
}

export async function getPromoCodes(gameId: number | string): Promise<PromoCode[]> {
  const records = await postgres<DatabasePromoCode>`
  SELECT
    game_id,
    code,
    attributes,
    uses,
    used,
    active,
    created,
    starts,
    expires
  FROM promo_codes
  WHERE game_id = ${gameId}
  ORDER BY created
  `;

  return records.map((record) => ({
    code: record.code,
    attributes: JSON.parse(record.attributes),
    uses: record.uses === null ? undefined : Number(record.uses),
    used: Number(record.used),
    active: record.active,
    created: record.created,
    starts: record.starts || undefined,
    expires: record.expires || undefined,
  }));
}

export async function createPromoCode(gameId: number | string, code: string, options: CreatePromoCode) {
  await postgres`
  INSERT INTO promo_codes (game_id, code, attributes, uses, active, starts, expires)
  VALUES (
    ${gameId},
    ${code.toUpperCase()},
    ${JSON.stringify(options.attributes)},
    ${options.uses || null},
    ${options.active},
    ${options.starts || null}, 
    ${options.expires || null})
  `;
}

export async function deletePromoCode(gameId: number | string, code: string) {
  await postgres`
    DELETE FROM promo_codes
    WHERE game_id = ${gameId} AND code = ${code.toUpperCase()}
  `;
}

export async function getPromoCode(gameId: number | string, code: string): Promise<PromoCode | null> {
  const records = await postgres<DatabasePromoCode>`
  SELECT
    game_id,
    code,
    attributes,
    uses,
    used,
    active,
    created,
    starts,
    expires
  FROM promo_codes
  WHERE game_id = ${gameId} AND code = ${code.toUpperCase()}
  LIMIT 1
  `;

  return records.length ? {
    code: records[0].code,
    attributes: JSON.parse(records[0].attributes),
    uses: records[0].uses === null ? undefined : Number(records[0].uses),
    used: Number(records[0].used),
    active: records[0].active,
    created: records[0].created,
    starts: records[0].starts || undefined,
    expires: records[0].expires || undefined,
  } : null;
}

export async function updatePromoCode(gameId: number | string, code: string, options: Partial<CreatePromoCode>) {
  const update: Partial<DatabasePromoCode> = {};

  if (options.attributes)
    update.attributes = JSON.stringify(options.attributes);

  if (options.active !== undefined)
    update.active = options.active;

  update.uses = options.uses === undefined ? null : options.uses.toString();
  update.starts = options.starts || null;
  update.expires = options.expires || null;

  await postgres`
    UPDATE promo_codes
    SET ${postgres(update)}
    WHERE game_id = ${gameId} AND code = ${code.toUpperCase()}
  `;
}

export async function hasUsedPromoCode(gameId: number | string, code: string, playerId: number | string): Promise<boolean> {
  const records = await postgres`
    SELECT 1
    FROM promo_code_uses
    WHERE game_id = ${gameId} AND code = ${code.toUpperCase()} AND player_id = ${playerId}
    LIMIT 1
  `;

  return records.length > 0;
}

export async function usePromoCode(gameId: number | string, code: string, playerId: number | string, serverId: string) {
  await postgres`
    INSERT INTO promo_code_uses (game_id, code, player_id, server_id)
    VALUES (${gameId}, ${code.toUpperCase()}, ${playerId}, ${serverId})
  `;
  await postgres`
    UPDATE promo_codes
    SET used = used + 1
    WHERE game_id = ${gameId} AND code = ${code.toUpperCase()}
  `;
}

export async function unusePromoCode(gameId: number | string, code: string, playerId: number | string) {
  await postgres`
    DELETE FROM promo_code_uses
    WHERE game_id = ${gameId} AND code = ${code.toUpperCase()} AND player_id = ${playerId}
  `;
  await postgres`
    UPDATE promo_codes
    SET used = used - 1
    WHERE game_id = ${gameId} AND code = ${code.toUpperCase()}
  `;
}

export async function getPromoCodeUses(gameId: number | string, code: string, limit: number, skip: number): Promise<PromoCodeUse[]> {
  const records = await postgres<DatabasePromoCodeUse>`
    SELECT
      game_id,
      code,
      player_id,
      player_name,
      server_id,
      used
    FROM promo_code_uses
    WHERE game_id = ${gameId} AND code = ${code.toUpperCase()}
    ORDER BY used
    LIMIT ${limit} OFFSET ${skip}
  `;

  return records.map((record) => ({
    code: record.code,
    player: {
      id: record.player_id,
      name: record.player_name,
    },
    serverId: record.server_id,
    used: record.used,
  }));
}

export async function getTotalPromoCodeUses(gameId: number | string, code: string): Promise<number> {
  const [{ count }] = await postgres<{ count: number }>`
    SELECT COUNT(*) AS count
    FROM promo_code_uses
    WHERE game_id = ${gameId} AND code = ${code.toUpperCase()}
  `;

  return Number(count);
}

export async function getPlayerPromoCodeUses(gameId: number | string, playerId: number | string, limit: number, skip: number): Promise<PromoCodeUse[]> {
  const records = await postgres<DatabasePromoCodeUse>`
    SELECT
      game_id,
      code,
      server_id,
      used
    FROM promo_code_uses
    WHERE game_id = ${gameId} AND player_id = ${playerId}
    ORDER BY used
    LIMIT ${limit} OFFSET ${skip}
  `;

  return records.map((record) => ({
    code: record.code,
    serverId: record.server_id,
    used: record.used,
  }));
}

export async function getTotalPlayerPromoCodeUses(gameId: number | string, playerId: number | string): Promise<number> {
  const [{ count }] = await postgres<{ count: number }>`
    SELECT COUNT(*) AS count
    FROM promo_code_uses
    WHERE game_id = ${gameId} AND player_id = ${playerId}
  `;

  return Number(count);
}
