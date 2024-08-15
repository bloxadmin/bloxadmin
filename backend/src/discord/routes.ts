import auth from "../middleware/auth.ts";
import { signOAuthStateToken, verifyOAuthStateToken } from "../services/auth.ts";
import { getRobloxPlayer, hasRobloxPremium } from "../services/roblox.ts";
import { getUser, getUserIdFromUrn } from "../services/users.ts";
import postgres from "../util/postgres.ts";
import router, { Context } from "../util/router.ts";
import interactionRouter from "./interactionRouter.ts";
import { discordAuth, discordOAuth2GrantToken, discordOAuth2RefreshToken, getDiscordAuthUrl, getDiscordGuilds, getDiscordInviteUrl, getDiscordUser, getDiscordVerifyUrl, updateDiscordRoleConnection, verifyDiscordInteractions } from "./service.ts";
import { Interaction } from "./types.ts";

router.get("/discord/", (context) => {
  return context.json({
    invite: "/discord/invite",
    link: "/discord/link",
  })
});

function getOrigin(context: Context) {
  const url = new URL(context.req.headers.get("referer") || context.req.url)
  const origin = url.hostname.endsWith("bloxadmin.com") ? "https://bloxadmin.com" : 'http://localhost:5173'

  return origin;
}

router.get("/discord/invite", auth(), async (context) => {
  const userId = context.get("userId")!;

  const state = await signOAuthStateToken(`urn:bloxadmin:player:${userId}`, {});

  return context.newResponse("", 302, {
    "Location": getDiscordInviteUrl(state),
  });
});


router.get("/discord/link", auth(), async (context) => {
  const userId = context.get("userId")!;

  const state = await signOAuthStateToken(`urn:bloxadmin:player:${userId}`, {
    "urn:bloxadmin:redirect": `${getOrigin(context)}/`,
  });

  return context.newResponse("", 302, {
    "Location": getDiscordVerifyUrl(state),
  });
});

router.get("/discord/verify", auth(), async (context) => {
  const userId = context.get("userId")!;

  const state = await signOAuthStateToken(`urn:bloxadmin:player:${userId}`, {
    "urn:bloxadmin:redirect": `${getOrigin(context)}/discord-verify`,
  });

  return context.newResponse("", 302, {
    "Location": getDiscordAuthUrl(state),
  });
});

router.get("/discord/auth", auth(), async (context) => {
  const code = context.req.query("code");
  const state = context.req.query("state");

  if (!code || !state) {
    return context.text("Invalid request", 400);
  }

  try {
    const payload = await verifyOAuthStateToken(state);

    if (!payload.sub) {
      return context.text("Unauthorized: Invalid oauth state token", 401);
    }

    const id = getUserIdFromUrn(payload.sub);

    if (!id) {
      return context.text("Unauthorized: Invalid token", 401);
    }

    const userId = context.get("userId")!;

    if (id.toString() !== userId.toString()) {
      return context.text("Unauthorized: Token is not for this user", 401);
    }

    const grant = await discordOAuth2GrantToken(code);

    if (!grant)
      return context.text("Unauthorized: Invalid oauth state token", 401);

    const authInfo = await getDiscordUser(grant.accessToken);
    console.log(payload, grant, authInfo);


    await postgres`
      DELETE FROM discord_oauth WHERE player_id = ${id}
    `;
    await postgres`
      INSERT INTO discord_oauth (player_id, user_id, user_data, refresh_token, access_token, access_expires_at, scopes)
      VALUES (
        ${id},
        ${authInfo.user.id},
        ${JSON.stringify(authInfo.user)},
        ${grant.refreshToken},
        ${grant.accessToken},
        ${grant.expires},
        ${authInfo.scopes}
      )
    `;

    if (authInfo.scopes.includes("role_connections.write")) {
      const player = (await getRobloxPlayer(userId))!;
      const hasPremium = await hasRobloxPremium(userId);

      const metadata = {
        is_vip: player.hasVerifiedBadge,
        has_premium: hasPremium,
        roblox_created: new Date(player.created).toISOString(),
      };

      await updateDiscordRoleConnection(grant.accessToken, player.name, metadata);
    }

    return context.newResponse("Redirecting to dashboard...", 302, {
      "Location": (payload["urn:bloxadmin:redirect"] as string) || "https://bloxadmin.com",
    });
  } catch (_error) {
    return context.text("Unauthorized: Invalid oauth state token", 401);
  }
});


router.get("/discord/update", auth(), async (context) => {
  const userId = context.get("userId")!;
  const player = await getRobloxPlayer(userId);
  const hasPremium = await hasRobloxPremium(userId);

  if (!player) {
    return context.text("Player not found on Roblox", 404);
  }

  const [oauth] = await postgres<{
    player_id: number;
    user_id: number;
    user_data: string;
    refresh_token: string;
    access_token: string;
    access_expires_at: Date;
    scopes: string[];
  }>`
    SELECT player_id, user_id, user_data, refresh_token, access_token, access_expires_at, scopes
    FROM discord_oauth WHERE player_id = ${userId} ORDER BY access_expires_at DESC LIMIT 1
  `;

  if (!oauth) {
    return context.text("Discord not linked", 400);
  }

  const metadata = {
    is_vip: player.hasVerifiedBadge,
    has_premium: hasPremium,
    roblox_created: new Date(player.created).toISOString(),
  };

  let access = oauth.access_token;

  if (!oauth.access_expires_at || oauth.access_expires_at < new Date()) {
    const refresh = await discordOAuth2RefreshToken(oauth.refresh_token);

    if (!refresh) {
      return context.text("false", 200);
    }

    await postgres`
      UPDATE discord_oauth
      SET access_token = ${refresh.accessToken},
          refresh_token = ${refresh.refreshToken},
          access_expires_at = ${refresh.expires}
      WHERE player_id = ${userId}
    `;
    access = refresh.accessToken;
  }

  await updateDiscordRoleConnection(access, player.name, metadata);

  return context.text("true", 200);
});

// router.get("/discord/guilds", auth(), async (context) => {
//   const all = context.req.query("all");

//   const [oauth] = await postgres<{
//     access_token: string;
//   }>`
//     SELECT access_token
//     FROM discord_oauth WHERE player_id = ${context.get("userId")} ORDER BY access_expires_at DESC LIMIT 1
//   `;

//   if (!oauth) {
//     return context.text("Discord not linked", 400);
//   }

//   const guilds = await getDiscordGuilds(await discordAuth(user.integrations.discord));

//   if (all)
//     return context.json(guilds);

//   const manage = 8 | 32;

//   return context.json(guilds.filter((guild) => Number(guild.permissions) & manage));

// });

router.post('/discord/interactions', async (context) => {
  const signature = context.req.header("X-Signature-Ed25519");
  const timestamp = context.req.header("X-Signature-Timestamp");
  const body = await context.req.text();

  const isVerified = await verifyDiscordInteractions(signature, timestamp, body);

  if (!isVerified)
    return context.text("invalid request signature", 401);

  const interaction = JSON.parse(body) as Interaction;
  const result = await interactionRouter.handle(interaction);

  // const callbackResult = await fetch(`https://discord.com/api/v10/interactions/${interaction.id}/${interaction.token}/callback`, {
  //   method: "POST",
  //   headers: {
  //     "Content-Type": "application/json",
  //   },
  //   body: JSON.stringify(result),
  // });


  // console.log(JSON.stringify(result));
  // console.log(await callbackResult.text());

  return context.json(result);
})
