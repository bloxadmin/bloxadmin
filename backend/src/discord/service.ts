import "https://deno.land/x/dotenv@v3.2.0/load.ts";
import { decodeHexString } from "https://deno.land/x/web_bson@v0.2.5/utils.ts";
import { sign_detached_verify } from "https://raw.githubusercontent.com/intob/tweetnacl-deno/master/src/sign.ts";
import { Guild, User } from "./types.ts";

export type Digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";

export interface DiscordAuth {
  accessToken: string;
  refreshToken: string;
  expires: Date;
}

export interface DiscordIntegration extends DiscordAuth {
  id: string;
  username: string;
  avatar: string;
  avatar_decoration?: string | null;
  public_flags: number;
  global_name: string;
  discriminator: "0" | Exclude<`${Digit}${Digit}${Digit}${Digit}`, "0000">;
  scopes: string[];
}

export interface DiscordAuthInfo {
  application: User;
  expires: Date;
  scopes: string[];
  user: DiscordIntegration;
}

const BASE = 'https://discord.com/api/v10';
const OAUTH_BASE = 'https://discord.com/api/oauth2';

const BOT_PERMISSIONS = 536870912;
const SCOPES = ["identify", "guilds", "email", "guilds", "role_connections.write"];
const BOT_SCOPES = [...SCOPES, "bot", "applications.commands", "applications.commands.permissions.update"];

const API_URL = Deno.env.get("API_URL") || "https://api.bloxadmin.com";
const CLIENT_ID = Deno.env.get("DISCORD_CLIENT_ID")!;
const PUBLIC_KEY = Deno.env.get("DISCORD_PUBLIC_KEY")!;
const CLIENT_SECRET = Deno.env.get("DISCORD_CLIENT_SECRET")!;
const REDIRECT_URI = Deno.env.get("DISCORD_REDIRECT_URL") || `${API_URL}/discord/auth`;

const INVITE_BASE = `${OAUTH_BASE}/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code`

export function getDiscordInviteUrl(state: string) {
  return `${INVITE_BASE}&scope=${BOT_SCOPES.join("%20")}&state=${encodeURIComponent(state)}&permissions=${BOT_PERMISSIONS}`;
}

export function getDiscordAuthUrl(state: string) {
  return `${INVITE_BASE}&scope=${SCOPES.join("%20")}&state=${encodeURIComponent(state)}`;
}

export function getDiscordVerifyUrl(state: string) {
  return `${INVITE_BASE}&scope=${SCOPES.join("%20")}&state=${encodeURIComponent(state)}`;
}

export async function verifyDiscordInteractions(signature: string, timestamp: string, body: string): Promise<boolean> {
  return await sign_detached_verify(
    new TextEncoder().encode(timestamp + body),
    decodeHexString(signature),
    decodeHexString(PUBLIC_KEY),
  );
}

export async function discordOAuth2RefreshToken(refreshToken: string): Promise<DiscordAuth | undefined> {
  const refreshResult = await fetch(`${OAUTH_BASE}/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET!,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (refreshResult.status !== 200) {
    return;
  }

  const refreshJson = await refreshResult.json() as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }

  return {
    accessToken: refreshJson.access_token,
    refreshToken: refreshJson.refresh_token,
    expires: new Date(Date.now() + (refreshJson.expires_in * 1000)),
  }

}

export async function discordOAuth2GrantToken(code: string): Promise<DiscordAuth | undefined> {
  const res = await fetch(`${OAUTH_BASE}/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET!,
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
    }),
  });

  const json = await res.json() as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }

  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expires: new Date(Date.now() + (json.expires_in * 1000)),
  }
}

export async function discordAuth(auth: DiscordAuth): Promise<string> {
  if (!auth.expires || auth.expires < new Date()) {
    const newAuth = await discordOAuth2RefreshToken(auth.refreshToken);

    if (!newAuth) {
      throw new Error("Failed to refresh token");
    }

    auth = newAuth;
  }

  return auth.accessToken;
}

export async function getDiscordUser(accessToken: string) {
  const authInfoRes = await fetch(`${OAUTH_BASE}/@me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const authInfo = await authInfoRes.json() as DiscordAuthInfo;
  authInfo.expires = new Date(authInfo.expires);

  return authInfo;
}

export async function getDiscordGuilds(accessToken: string): Promise<Guild[]> {
  const guildsRes = await fetch(`${BASE}/users/@me/guilds`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const guilds = await guildsRes.json() as Guild[];

  return guilds;
}

export async function updateDiscordRoleConnection(accessToken: string, username: string, metadata: Record<string, number | string | boolean>) {
  await fetch(`${BASE}/users/@me/applications/${CLIENT_ID}/role-connection`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      platform_name: "Roblox",
      platform_username: username,
      metadata
    }),
  });
}
