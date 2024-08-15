import auth from "../middleware/auth.ts";
import { CreatePromoCode, createPromoCode, deletePromoCode, getPlayerPromoCodeUses, getPromoCode, getPromoCodeUses, getPromoCodes, getTotalPlayerPromoCodeUses, getTotalPromoCodeUses, hasUsedPromoCode, unusePromoCode, updatePromoCode, usePromoCode } from "../services/promoCodes.ts";
import { Permissions, security } from "../services/security.ts";
import router from "../util/router.ts";
import { ajv } from "../util/ajv.ts";

router.get("/games/:gameId/codes", auth(), security([Permissions.PromoCodes.PromoCodes.List]), async (context) => {
  const gameId = context.req.param("gameId");

  const codes = await getPromoCodes(gameId);

  return context.json(codes);
});

router.put("/games/:gameId/codes/:code", auth(), security([Permissions.PromoCodes.PromoCodes.Create]), async (context) => {
  const gameId = context.req.param("gameId");
  const code = context.req.param("code").toUpperCase();

  const exists = await getPromoCode(gameId, code);

  // validate code, only allow alphanumeric and underscore and max length of 32
  if (!/^[a-zA-Z0-9_]{1,32}$/.test(code)) {
    return context.text("Invalid code", 400);
  }

  if (exists) {
    return context.text("Promo code already exists", 409);
  }

  const schema = {
    type: "object",
    properties: {
      attributes: {
        type: "object",
        additionalProperties: true
      },
      uses: {
        type: "number"
      },
      active: {
        type: "boolean"
      },
      starts: {
        type: "string"
      },
      expires: {
        type: "string"
      }
    },
    required: ["attributes", "active"],
  }

  const data = await context.req.json<CreatePromoCode>();

  const valid = ajv.validate(schema, data);

  if (!valid)
    return context.text(ajv.errorsText(ajv.errors), 400);

  await createPromoCode(gameId, code, data);
  const promoCode = await getPromoCode(gameId, code);

  return context.json(promoCode);
});

router.get("/games/:gameId/codes/:code", auth(), security([Permissions.PromoCodes.PromoCodes.Read]), async (context) => {
  const gameId = context.req.param("gameId");

  const promoCode = await getPromoCode(gameId, context.req.param("code"));

  return context.json(promoCode);
});

router.delete("/games/:gameId/codes/:code", auth(), security([Permissions.PromoCodes.PromoCodes.Delete]), async (context) => {
  const gameId = context.req.param("gameId");
  const code = context.req.param("code");

  const promoCode = await getPromoCode(gameId, code);

  if (!promoCode) {
    return context.text("Promo code not found", 404);
  }

  await deletePromoCode(gameId, code);

  return context.json({
    message: "Deleted",
  })
});


router.patch("/games/:gameId/codes/:code", auth(), security([Permissions.PromoCodes.PromoCodes.Update]), async (context) => {
  const gameId = context.req.param("gameId");
  const code = context.req.param("code");

  const promoCode = await getPromoCode(gameId, code);

  if (!promoCode) {
    return context.text("Promo code not found", 404);
  }

  const schema = {
    type: "object",
    properties: {
      attributes: {
        type: "object",
        additionalProperties: true
      },
      uses: {
        type: "number"
      },
      active: {
        type: "boolean"
      },
      startsAt: {
        type: "string"
      },
      expiresAt: {
        type: "string"
      }
    },
  }

  const data = await context.req.json<CreatePromoCode>();

  const valid = ajv.validate(schema, data);

  if (!valid)
    return context.text(ajv.errorsText(ajv.errors), 400);

  await updatePromoCode(gameId, code, data);
  const updatedPromoCode = await getPromoCode(gameId, code);

  return context.json(updatedPromoCode);
});

router.get("/games/:gameId/codes/:code/uses", auth(), security([Permissions.PromoCodes.PromoCodes.Read]), async (context) => {
  const gameId = context.req.param("gameId");
  const code = context.req.param("code");

  const limit = Math.min(100, Number(context.req.query("limit")) || 25);
  const skip = Number(context.req.query("skip")) || 0;

  const promoCode = await getPromoCode(gameId, code);

  if (!promoCode) {
    return context.text("Promo code not found", 404);
  }

  const total = await getTotalPromoCodeUses(gameId, code);
  const data = await getPromoCodeUses(gameId, code, limit, skip);

  return context.json({
    total,
    limit,
    skip,
    data
  });
});

router.put("/games/:gameId/codes/:code/uses/:player", auth(), security([Permissions.PromoCodes.PromoCodes.Create]), async (context) => {
  const gameId = context.req.param("gameId");
  const code = context.req.param("code");
  const playerId = context.req.param("player");

  const body = await context.req.json() as { serverId?: string };

  if (!body || !body.serverId) {
    return context.text("invalid", 400);
  }

  const promoCode = await getPromoCode(gameId, code);

  if (!promoCode) {
    return context.text("not_found", 404);
  }

  if (promoCode.uses !== undefined && promoCode.uses !== 0 && promoCode.uses <= promoCode.used) {
    return context.text("limit_reached", 400);
  }

  if (promoCode.expires && new Date(promoCode.expires) < new Date()) {
    return context.text("expired", 400);
  }

  if (promoCode.starts && new Date(promoCode.starts) > new Date()) {
    return context.text("not_started", 400);
  }

  const used = await hasUsedPromoCode(gameId, code, playerId);

  if (used) {
    return context.text("already_used", 400);
  }

  await usePromoCode(gameId, code, playerId, body.serverId);

  return context.json(promoCode);
});

router.delete("/games/:gameId/codes/:code/uses/:player", auth(), security([Permissions.Players.PromoCodes.Delete]), async (context) => {
  const gameId = context.req.param("gameId");
  const code = context.req.param("code");
  const playerId = context.req.param("player");

  const promoCode = await getPromoCode(gameId, code);

  if (!promoCode) {
    return context.text("not_found", 404);
  }

  const used = await hasUsedPromoCode(gameId, code, playerId);

  if (!used) {
    return context.text("not_used", 400);
  }

  await unusePromoCode(gameId, code, playerId);

  return context.json({ ...promoCode, used: promoCode.used - 1 });
});

router.get("/games/:gameId/players/:playerId/codes", auth(), security([Permissions.Players.PromoCodes.List]), async (context) => {
  const gameId = context.req.param("gameId");
  const playerId = context.req.param("playerId");

  const limit = Math.min(100, Number(context.req.query("limit")) || 25);
  const skip = Number(context.req.query("skip")) || 0;

  const total = await getTotalPlayerPromoCodeUses(gameId, playerId);
  const data = await getPlayerPromoCodeUses(gameId, playerId, limit, skip);

  return context.json({
    total,
    limit,
    skip,
    data
  });
});
