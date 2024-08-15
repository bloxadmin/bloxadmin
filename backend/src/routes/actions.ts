import auth from "../middleware/auth.ts";
import { Action, ActionStatus, createAction, createActionExecution, getAction, getActionExecution, getActionExecutions, getActions, getActionsByName, updateActionActive, updateActionDescription, updateActionExecutionStatus } from "../services/actions.ts";
import { EventChannel } from "../services/events.ts";
import router from "../util/router.ts";
import { Permissions, security } from "../services/security.ts";
import { ajv } from "../util/ajv.ts";
import { getOnlinePlayerServer, getActionServer } from "../services/servers.ts";
import publish from "../services/publish.ts";
import { buildServerEvent } from "../services/serverEvents.ts";
import { EventType } from "../services/serverEvents.ts";
import { ActionEventType } from "../services/serverEvents.ts";

router.get("/games/:gameId/actions", auth(), security([Permissions.Actions.Actions.List]), async (context) => {
  const gameId = Number(context.req.param("gameId"));

  if (context.req.header("accept") === "text/event-stream") {
    const permissions = context.get("permissions")!;
    if (!permissions.includes(Permissions.Actions.Executions.List))
      return context.text(`You do not have permission to listen to action executions`, 403);

    const channel = EventChannel.for(gameId, "actions");

    const stream = new ReadableStream({
      start(controller) {
        channel.onEvent((event) => {
          controller.enqueue(`data: ${JSON.stringify(event)}\n\n`);
        });
      },
      cancel() {
        channel.close();
      }
    });

    return new Response(stream.pipeThrough(new TextEncoderStream()), {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": context.req.header("origin") || "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Credentials": "true",
        ...context.req.headers,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  }

  const actions = await getActions(gameId);

  return context.json(actions);
});

router.patch("/games/:gameId/actions/:actionId", auth(), security([Permissions.Actions.Actions.Update]), async (context) => {
  const gameId = Number(context.req.param("gameId"));
  const actionId = context.req.param("actionId");

  const action = await getAction(gameId, actionId);

  if (!action)
    return context.text("Action not found", 404);

  const schema = {
    type: "object",
    properties: {
      description: {
        type: "string",
      },
      active: {
        type: "boolean",
      },
    },
    additionalProperties: false,
    required: [],
  };

  const data = await context.req.json<{
    description?: string;
    active?: boolean;
  }>();

  const valid = ajv.validate(schema, data);

  if (!valid)
    return context.text(ajv.errorsText(ajv.errors), 400);

  if (typeof data.description === "string")
    await updateActionDescription(gameId, actionId, data.description);
  if (typeof data.active === "boolean")
    await updateActionActive(gameId, actionId, data.active);

  return context.json({
    ...action,
    ...data,
  });
});

router.get("/games/:gameId/actions/:actionId", auth(), security([Permissions.Actions.Actions.Read]), async (context) => {
  const gameId = Number(context.req.param("gameId"));
  const actionId = context.req.param("actionId");

  const action = await getAction(gameId, actionId);

  if (!action)
    return context.text("Action not found", 404);

  return context.json(action);
});

router.get("/games/:gameId/actions/:actionName/history", auth(), security([Permissions.Actions.Actions.Read]), async (context) => {
  const gameId = Number(context.req.param("gameId"));
  const actionName = context.req.param("actionName");

  const actions = await getActionsByName(gameId, actionName);

  if (!actions || !actions.length)
    return context.text("Action not found", 404);

  return context.json(actions);
});

router.post("/games/:gameId/actions/:actionId/executions", auth(), security([Permissions.Actions.Executions.Create]), async (context) => {
  const gameId = Number(context.req.param("gameId"));
  const actionId = context.req.param("actionId");

  const action = await getAction(gameId, actionId);

  if (!action)
    return context.text("Action not found", 404);

  const properties = action.parameters.reduce((acc, param) => {
    const type = param.type === "player" || param.type === 'place' ? "string" : param.type;
    acc[param.name] = {
      type,
    };
    return acc;
  }, {} as Record<string, { type: string }>);
  const required = action.parameters.filter(param => param.required).map(param => param.name);

  const schema = {
    type: "object",
    properties: {
      parameters: {
        type: "object",
        properties,
        additionalProperties: false,
        required,
      },
    },
    additionalProperties: false,
    required: ['parameters'],
  };

  const data = await context.req.json<{
    parameters: Record<string, string | number | boolean | undefined>;
  }>();

  const valid = ajv.validate(schema, data);

  if (!valid)
    return context.text(ajv.errorsText(ajv.errors), 400);

  let serverId: string | undefined = undefined;

  const playerParam = action.parameters.find(param => param.type === "player");

  if (playerParam) {
    const playerId = data.parameters[playerParam.name] as string;

    if (playerId) {
      serverId = (await getOnlinePlayerServer(gameId, playerId))?.id;
    }
  }

  if (!serverId) {
    serverId = await getActionServer(gameId, actionId);
  }

  if (!serverId)
    return context.text("No server available to execute action", 409);

  console.log('createActionExecution', gameId, action.id, action.name, data.parameters)
  const executionId = await createActionExecution(gameId, action.id, action.name, serverId, data.parameters);

  const message = JSON.stringify(await buildServerEvent(serverId, EventType.Actions, [ActionEventType.Call, {
    id: executionId,
    name: action.name,
    context: {},
    parameters: data.parameters,
  }]));

  const published = await publish(gameId, message);

  if (!published) {
    await updateActionExecutionStatus(gameId, executionId, ActionStatus.Failed, null, "Failed to send action execution request");
  }

  const execution = await getActionExecution(gameId, action.id, executionId);

  return context.json(execution);
});

router.get("/games/:gameId/actions/:actionId/executions", auth(), security([Permissions.Actions.Executions.List]), async (context) => {
  const gameId = Number(context.req.param("gameId"));
  const actionName = context.req.param("actionId");

  const executions = await getActionExecutions(gameId, actionName);

  return context.json(executions);
});

router.get("/games/:gameId/actions/:actionId/executions/:executionId", auth(), security([Permissions.Actions.Executions.Read]), async (context) => {
  const gameId = Number(context.req.param("gameId"));
  const actionId = context.req.param("actionId");
  const executionId = context.req.param("executionId");

  const action = await getAction(gameId, actionId);

  if (!action)
    return context.text("Action not found", 404);

  const execution = await getActionExecution(gameId, actionId, executionId);

  if (!execution)
    return context.text("Execution not found", 404);

  return context.json(execution);
});
