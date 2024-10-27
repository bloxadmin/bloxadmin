import postgres from "../util/postgres.ts";
import { getRobloxPlayer } from "./roblox.ts";

export interface User {
  id: number;
  name: string;
  discord?: {
    id: string;
    global_name: string;
    username: string;
  };
  credit: number;
  admin?: boolean;
}

export async function userIsAdmin(userId: string | number): Promise<boolean> {
  const [user] = await postgres<{ admin: boolean }>`
    SELECT admin
    FROM users
    WHERE id = ${userId}
  `;

  return user?.admin ?? false;
}

export async function getUser(userId: string | number): Promise<User> {
  const [user] = await postgres<{
    id: number;
    name: string;
    admin: boolean | null;
    discord_data: string;
  }>`
    SELECT
      players.id,
      players.name,
      users.admin,
      null AS discord_data
    FROM players
    LEFT JOIN users ON users.id = players.id
    WHERE players.id = ${userId}
  `;

  if (!user) {
    const player = await getRobloxPlayer(userId);

    if (!player)
      throw new Error("User not found");

    await postgres`
      INSERT INTO players
        (id, name)
      VALUES
        (${userId}, ${player.name})
    `;

    return {
      id: player.id,
      name: player.name,
      credit: 0,
      admin: false
    }
  }

  return {
    id: user.id,
    name: user.name,
    credit: 0,
    admin: !!user.admin,
    discord: user.discord_data ? JSON.parse(user.discord_data) : undefined,
  };
}

export async function getUserFromDiscordId(discordId: string | number): Promise<User | null> {
  const [user] = await postgres<{
    id: number;
    name: string;
    credit: number;
    admin: boolean | null;
    discord_data: string;
  }>`
    SELECT
      players.id,
      players.name,
      users.admin,
      users.credit,
      discord_oauth.user_data AS discord_data
    FROM discord_oauth
    LEFT JOIN users ON discord_oauth.player_id = users.id
    LEFT JOIN players ON discord_oauth.player_id = players.id
    WHERE discord_oauth.user_id = ${discordId}
  `;

  if (!user)
    return null;

  return {
    id: user.id,
    name: user.name,
    credit: user.credit,
    admin: !!user.admin,
    discord: user.discord_data ? JSON.parse(user.discord_data) : undefined,
  };
}

export function getUserIdFromUrn(urn: string | undefined | null): number | undefined {
  if (!urn || !urn.startsWith("urn:bloxadmin:player:")) return undefined;

  const split = urn.split(":");

  if (split.length !== 4) return undefined;

  const id = urn.split(":")[3];

  return Number(id);
}
