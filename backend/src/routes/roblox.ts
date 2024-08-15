import auth from "../middleware/auth.ts";
import { signOAuthStateToken, signToken, verifyOAuthStateToken } from "../services/auth.ts";
import { getGame } from "../services/games.ts";
import { VALID_ASSET_THUMBNAIL_SIZES, VALID_AVATAR_HEADSHOT_SIZES, VALID_GAME_ICON_SIZES, VALID_GROUP_ICON_SIZES, assetThumbnails, gameIcons, getRobloxGame, groupIcons, robloxOAuth, userHeadshots } from "../services/roblox.ts";
import router, { Context } from "../util/router.ts";
import { validateSizeQuery } from "../util/validators.ts";

const CLIENT_ID = Deno.env.get("ROBLOX_CLIENT_ID")! || "3641758207638632061";
const REDIRECT_URI = Deno.env.get("ROBLOX_REDIRECT_URL") || "https://api.bloxadmin.com/roblox/auth";
const SCOPES = [
  "profile",
  "openid",
];
const GAME_SCOPES = [
  "profile",
  "openid",
  "universe-messaging-service:publish",
]
const AUTH_URL = `https://apis.roblox.com/oauth/v1/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${SCOPES.join("%20")}`;
const GAME_LINK_URL = `https://apis.roblox.com/oauth/v1/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${GAME_SCOPES.join("%20")}`;

router.get("/roblox/avatars/:player", auth(), async (context) => {
  const [id, _] = context.req.param("player").split(".");
  const playerId = Number(id);

  if (isNaN(playerId)) {
    return context.text("Invalid player ID", 400);
  }

  const size = validateSizeQuery(context.req.query("size"), VALID_AVATAR_HEADSHOT_SIZES);
  if (!size) {
    return context.text(`Invalid size. Valid sizes are ${VALID_AVATAR_HEADSHOT_SIZES.join(', ')}`, 400);
  }

  const player = await userHeadshots.getThumbnail(playerId, { size });

  if (!player) {
    return context.text("Player not found", 404);
  }

  const [url, perm] = player;

  if (!perm)
    return context.body(null, 302, {
      ...context.res.headers,
      Location: url,
      "Cache-Control": `public, max-age=30`,
      Expires: new Date(Date.now() + (30 * 1000)).toUTCString(),
      // deno-lint-ignore no-explicit-any
    } as any)


  return context.body(null, 301, {
    Location: url,
    "Cache-Control": `public, max-age=86400`,
    Expires: new Date(Date.now() + (3600 * 1000)).toUTCString(),
  })
})

router.get("/roblox/groupIcons/:group", auth(), async (context) => {
  const [id, _] = context.req.param("group").split(".");
  const groupId = Number(id);

  const size = validateSizeQuery(context.req.query("size"), VALID_GROUP_ICON_SIZES);
  if (!size) {
    return context.text(`Invalid size. Valid sizes are ${VALID_GROUP_ICON_SIZES.join(', ')}`, 400);
  }

  const group = await groupIcons.getThumbnail(groupId, { size });

  if (!group) {
    return context.text("Group not found", 404);
  }

  const [url, perm] = group;


  if (!perm)
    return context.body(null, 302, {
      ...context.res.headers,
      Location: url,
      "Cache-Control": `public, max-age=30`,
      Expires: new Date(Date.now() + (30 * 1000)).toUTCString(),
      // deno-lint-ignore no-explicit-any
    } as any)


  return context.body(null, 301, {
    Location: url,
    "Cache-Control": `public, max-age=86400`,
    Expires: new Date(Date.now() + (3600 * 1000)).toUTCString(),
  })
});

router.get("/roblox/gameIcons/:gameId", auth(), async (context) => {
  const [id, _] = context.req.param("gameId").split(".");
  const gameId = Number(id);

  const size = validateSizeQuery(context.req.query("size"), VALID_GAME_ICON_SIZES);
  if (!size) {
    return context.text(`Invalid size. Valid sizes are ${VALID_GAME_ICON_SIZES.join(', ')}`, 400);
  }

  const game = await gameIcons.getThumbnail(gameId, { size });

  if (!game) {
    return context.text("Game not found", 404);
  }

  const [url, perm] = game;


  if (!perm) {
    context.res.headers.set("Cache-Control", `public, max-age=30`)
    context.res.headers.set("Expires", new Date(Date.now() + (30 * 1000)).toUTCString())
    return context.redirect(url, 302)
  }

  context.res.headers.set("Cache-Control", `public, max-age=86400`)
  context.res.headers.set("Expires", new Date(Date.now() + (3600 * 1000)).toUTCString())
  return context.redirect(url, 301)
});

router.get("/roblox/assetThumbnails/:asset", auth(), async (context) => {
  const [id, _] = context.req.param("asset").split(".");
  const assetId = Number(id);

  const size = validateSizeQuery(context.req.query("size"), VALID_ASSET_THUMBNAIL_SIZES, "768x432");
  if (!size) {
    return context.text(`Invalid size. Valid sizes are ${VALID_ASSET_THUMBNAIL_SIZES.join(', ')}`, 400);
  }

  const assets = await assetThumbnails.getThumbnail(assetId, { size });

  if (!assets) {
    return context.text("Asset not found", 404);
  }

  const [url, perm] = assets;

  if (!perm) {
    context.res.headers.set("Cache-Control", `public, max-age=30`)
    context.res.headers.set("Expires", new Date(Date.now() + (30 * 1000)).toUTCString())
    return context.redirect(url, 302)
  }

  context.res.headers.set("Cache-Control", `public, max-age=86400`)
  context.res.headers.set("Expires", new Date(Date.now() + (3600 * 1000)).toUTCString())
  return context.redirect(url, 301)
});

function getRedirectOrigin() {
  return Deno.env.get("DASHBOARD_ORIGIN") || 'http://localhost:5173'
}

router.get("/roblox/link", async (context) => {
  const origin = getRedirectOrigin();

  const state = await signOAuthStateToken(`urn:bloxadmin:anonymous`, {
    'urn:bloxadmin:redirect': origin + (context.req.query("discord-verify") ? "/discord-verify" : "/"),
  });

  return context.newResponse("", 302, {
    "Location": `${AUTH_URL}&state=${encodeURIComponent(state)}`,
  });
});

router.get("/roblox/link/game", async (context) => {
  const origin = getRedirectOrigin();

  const state = await signOAuthStateToken(`urn:bloxadmin:anonymous`, {
    'urn:bloxadmin:redirect': origin + '/new',
  });

  return context.newResponse("", 302, {
    "Location": `${GAME_LINK_URL}&state=${encodeURIComponent(state)}`,
  });
});

router.get("/roblox/auth", async (context) => {
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

    const {
      userInfo,
      universeIds,
    } = await robloxOAuth(CLIENT_ID, code);

    const token = await signToken(`urn:bloxadmin:player:${userInfo.sub}`, {});

    const url = new URL(context.req.url)
    const expires = new Date();
    expires.setUTCFullYear(expires.getUTCFullYear() + 1);

    context.cookie(Deno.env.get("COOKIE_NAME") || "token", token, {
      domain: Deno.env.get("COOKIE_DOMAIN") || "bloxadmin.com",
      expires,
      path: "/",
      secure: url.protocol === "https:",
      sameSite: url.protocol === "https:" ? "None" : "Lax",
    })

    let redirect = (payload && payload["urn:bloxadmin:redirect"] as string) || Deno.env.get("DASHBOARD_ORIGIN") || "https://bloxadmin.com";

    if (universeIds.length) {
      const id = universeIds[0];
      const nextIds = universeIds.slice(1);

      for (const id of universeIds) {
        await getGame(id);
      }

      redirect += '/' + id;
      if (nextIds.length)
        redirect += "?next=" + nextIds.join(",");
    }

    return context.newResponse("Redirecting to dashboard...", 302, {
      "Location": redirect,
    });
  } catch (error) {
    console.log(context.req.url)
    console.error(error);
    context.error = error;
    return context.text("Unauthorized: Invalid oauth token", 401);
  }
});
