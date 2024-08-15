import { getScriptErrors, getTotalGameScriptErrors, updateScriptError, deleteScriptError } from "../services/scriptError.ts";
import { Permissions, security } from "../services/security.ts";

// * Util
import router from "../util/router.ts";
import { ajv } from "../util/ajv.ts";

// * Middleware
import auth from "../middleware/auth.ts";

router.get("/games/:gameId/errors", auth(), security([Permissions.Errors.Errors.List]), async (context) => {
  const gameId = context.req.param("gameId");

  const limit = Math.min(100, Number(context.req.query("limit")) || 25);
  const skip = Number(context.req.query("skip")) || 0;
  const resolved = context.req.query("resolved") === "true";

  const total = await getTotalGameScriptErrors(gameId, resolved);
  const data = await getScriptErrors(gameId, limit, skip, resolved);

  return context.json({
    total,
    limit,
    skip,
    data,
  });
});

router.patch("/games/:gameId/errors/:errorId", auth(), security([Permissions.Errors.Errors.Update]), async (context) => {
  const gameId = context.req.param("gameId");
  const errorId = context.req.param("errorId");

  const schema = {
    type: "object",
    oneOf: [
      {
        type: "object",
        properties: {
          assignee: {
            type: "number"
          },
        }
      },
      {
        type: "object",
        properties: {
          resolved: {
            type: "boolean"
          }
        }
      }
    ]
  }

  const data = await context.req.json<{ assignee?: number, resolved?: boolean }>();
  const valid = ajv.validate(schema, data);

  const { hash } = await updateScriptError(gameId, errorId, data)

  if (!valid)
    return context.json({ success: false, errors: ajv.errors }, 400)

  if (!hash)
    return context.text("Script error not found", 404)

  return context.status(200);
});

router.delete("/games/:gameId/errors/:errorId", auth(), security([Permissions.Errors.Errors.Delete]), async (context) => {
  const gameId = context.req.param("gameId");
  const errorId = context.req.param("errorId");

  const { hash } = await deleteScriptError(gameId, errorId);

  if (!hash)
    return context.text("Script error not found", 404);

  return context.text("Script error deleted", 200)
});
