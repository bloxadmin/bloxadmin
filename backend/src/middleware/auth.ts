import { verifyToken } from "../services/auth.ts";
import { getScriptConfig } from "../services/games.ts";
import { getUserIdFromUrn, userIsAdmin } from "../services/users.ts";
import router, { Context, Next } from "../util/router.ts";

router.all("*", (context, next) => {
  context.set("admin", false);

  return next();
})

export default function auth() {
  return async (context: Context, next: Next) => {
    let token;
    const authorization = context.req.headers.get("Authorization")?.split(" ");

    if (!authorization) {
      // No authorization header, check for cookie
      const cookie = context.req.cookie(Deno.env.get("COOKIE_NAME") || "token");

      if (!cookie) {
        // No cookie, return 401
        context.res.headers.set('WWW-Authenticate', `Bearer realm="${context.req.url}",error="invalid_request",error_description="No authorization included in request"`);
        return context.text("Unauthorized: No authorization included in request", 401);
      }

      token = cookie;
    } else {
      // Authorization header is present, check if it's a bearer token
      if (authorization[0] !== 'Bearer') {
        // Authorization header is not a bearer token, return 401
        context.res.headers.set('WWW-Authenticate', `Bearer realm="${context.req.url}",error="invalid_request",error_description="Authorization header is not a bearer token"`);
        return context.text("Unauthorized: Authorization header is not a bearer token", 401);
      }

      token = authorization[1];
    }

    // Verify the token
    if (token.includes(".")) {
      // Token is a JWT
      try {
        const payload = await verifyToken(token);

        if (!payload.sub) {
          context.res.headers.set('WWW-Authenticate', `Bearer realm="${context.req.url}",error="invalid_token",error_description="Invalid token"`);
          return context.text("Unauthorized: Invalid token", 401);
        }

        const id = getUserIdFromUrn(payload.sub);

        if (!id || isNaN(id)) {
          context.res.headers.set('WWW-Authenticate', `Bearer realm="${context.req.url}",error="invalid_token",error_description="Invalid token"`);
          return context.text("Unauthorized: Invalid token", 401);
        }

        const isAdmin = await userIsAdmin(id);

        context.set("userId", id);
        context.set("auth", payload);
        context.set("admin", isAdmin);
      } catch (_error) {
        context.res.headers.set('WWW-Authenticate', `Bearer realm="${context.req.url}",error="invalid_token",error_description="Invalid token"`);
        return context.text("Unauthorized: Invalid token", 401);
      }
    } else {
      // Token is likely an ingest key
      const gameId = context.req.param("gameId");

      if (!gameId) {
        // Route must be associated with a game
        context.res.headers.set('WWW-Authenticate', `Bearer realm="${context.req.url}",error="invalid_token",error_description="Invalid token"`);
        return context.text("Unauthorized: Invalid token", 401);
      }

      const { ingestKey } = await getScriptConfig(gameId);

      if (!ingestKey) {
        return context.text('Unauthorized', 401);
      }

      if (token !== ingestKey) {
        return context.text('Forbidden', 403);
      }

      context.set("userId", 1);
      context.set("auth", {});
      context.set("admin", false);
      context.set("ingestKey", true);
    }

    return next();
  }
}

export function mustBeAdmin() {
  return (context: Context, next: Next) => {
    if (!context.get("admin") || context.get("ingestKey")) {
      return context.text("Unauthorized", 401);
    }

    return next();
  }
}
