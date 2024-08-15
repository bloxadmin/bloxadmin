import { Game } from "../services/games.ts";
import { RobloxOAuth, getValidRobloxOAuth, publishInMessageingService } from "../services/roblox.ts";
import postgres from "../util/postgres.ts";

export async function getGameApiKeys(gameId: string | number): Promise<string[]> {
  const apiKeys = await postgres<{ key: string }>`
    SELECT key FROM roblox_cloud_keys
    WHERE game_id = ${gameId}
  `;

  return apiKeys.map((k) => k.key);
}

export async function removeGameApiKey(gameId: string | number, key: string) {
  await postgres`
    DELETE FROM roblox_cloud_keys
    WHERE game_id = ${gameId} AND key = ${key}
  `;
}

export async function getGameOAuth(gameId: string | number): Promise<RobloxOAuth[]> {
  const apiKeys = await postgres<{
    access_token: string;
    refresh_token: string;
    identity_token: string;
    access_expires_at: Date;
    scope_openid: boolean;
    scope_profile: boolean;
    scope_messaging_service_publish: boolean;
  }>`
    SELECT
      oa.access_token,
      oa.refresh_token,
      oa.identity_token,
      oa.access_expires_at,
      oa.scope_openid,
      oa.scope_profile,
      oa.scope_messaging_service_publish
    FROM roblox_oauth oa
    LEFT JOIN roblox_oauth_games oag ON oag.oauth_id = oa.id
    WHERE oag.game_id = ${gameId}
  `;

  return apiKeys.map((k) => ({
    accessToken: k.access_token,
    refreshToken: k.refresh_token,
    tokenType: "Bearer",
    expires: k.access_expires_at,
    idToken: k.identity_token,
    scope: [
      k.scope_openid ? "openid" : undefined,
      k.scope_profile ? "profile" : undefined,
      k.scope_messaging_service_publish ? "universe-messaging-service:publish" : undefined
    ].filter((s) => !!s) as string[]
  }));
}

async function publishWithKey(gameId: string | number, message: string, topic = "bloxadmin"): Promise<boolean> {
  const keys = await getGameApiKeys(gameId);

  for (const key of keys) {
    const sent = await publishInMessageingService(gameId, key, topic, message);

    if (sent) return true;

    await removeGameApiKey(gameId, key);
  }

  return false;
}

async function publishWithOAuth(gameId: string | number, message: string, topic = "bloxadmin"): Promise<boolean> {
  const oauths = await getGameOAuth(gameId);

  for (const oauth of oauths) {
    try {
      const { auth, updated } = await getValidRobloxOAuth(oauth);

      if (updated) {
        await postgres`
          UPDATE roblox_oauth
          SET
            access_token = ${auth.accessToken},
            refresh_token = ${auth.refreshToken},
            identity_token = ${auth.idToken},
            access_expires_at = ${auth.expires},
            scope_openid = ${auth.scope.includes("openid")},
            scope_profile = ${auth.scope.includes("profile")},
            scope_messaging_service_publish = ${auth.scope.includes("universe-messaging-service:publish")}
          WHERE
            access_token = ${oauth.accessToken}
        `;
      }

      const sent = await publishInMessageingService(gameId, `${auth.tokenType} ${auth.accessToken}`, topic, message);

      if (sent) return true;
    } catch (_e) {
      if (oauth.id)
        await postgres`
          DELETE FROM roblox_oauth_games WHERE oauth_id = ${oauth.id} AND game_id = ${gameId}
        `;
      continue;
    }
  }

  return false;
}

const ENVIRONMENT = Deno.env.get("ENVIRONMENT") || "development";

export default async function publish(gameId: string | number, message: string, topic = "bloxadmin"): Promise<boolean> {
  if (ENVIRONMENT === "development") {
    console.log("Publishing message to", gameId, topic, message);
  }

  const sent = await publishWithKey(gameId, message, topic);

  if (sent) return true;

  return publishWithOAuth(gameId, message, topic);
}
