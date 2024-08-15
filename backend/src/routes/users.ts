import auth from "../middleware/auth.ts";
import { getAllGamesForUser } from "../services/games.ts";
import { getUser } from "../services/users.ts";
import postgres from "../util/postgres.ts";
import router, { Context, Next } from "../util/router.ts";

router.get("/auth/user", auth(), async (context) => {
  const userId = context.get("userId")!;
  const user = await getUser(userId);

  return context.json(user);
});

function ingestAuth(gameId: number) {
  return async (context: Context, next: Next) => {
    const [{ ingest_key }] = await postgres<{ ingest_key: string }>`
      SELECT ingest_key FROM games WHERE id = ${gameId}
    `;

    const authHeader = context.req.headers.get("authorization");
    const auth = authHeader && authHeader.startsWith("Bearer ") && authHeader.slice(7);

    if (!ingest_key || auth !== ingest_key) {
      return context.text("Unauthorized", 401);
    }

    return next();
  }
}

router.get("/users/:userId", ingestAuth(4923060301), async (context) => {
  const userId = context.req.param("userId");

  const user = await getUser(userId);
  const games = await getAllGamesForUser(userId);

  return context.json({ user, games });
});
