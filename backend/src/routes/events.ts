import { ENABLE_LOGGING } from "../consts.ts";
import handleActionsMessage from "../events/actions.ts";
import handleEvent from "../events/index.ts";
import auth from "../middleware/auth.ts";
// import { consumeActionsToRun, markActionCallReturned, markActionCallRunning, ParameterValue, RunAction } from "../services/actions.ts";
import { generateServerIngestToken, verifyServerIngestToken } from "../services/auth.ts";
import { EventChannel, EventContext } from "../services/events.ts";
import { getGamePlayer } from "../services/gamePlayers.ts";
import { Game, GameFeature, getGame, getGameRemoteConfig, getScriptConfig } from "../services/games.ts";
import { ActionEventType, EventData, EventDatas, EventType } from "../services/serverEvents.ts";
import { initServer } from "../services/servers.ts";
import Cache, { MemoryCacheLayer } from "../util/Cache.ts";
import influxdb, { influxOrg } from "../util/influxdb.ts";
import router, { Context } from "../util/router.ts";

const gameCache = new Cache<Game>(
  new MemoryCacheLayer(60 * 1000),
);

router.get('/games/:gameId/servers/:server/messaging', async (context) => {
  const scriptVersion = Number(context.req.headers.get("x-bloxadmin-version") || "-1");
  const gameId = context.req.param("gameId");
  const serverId = context.req.param('server');

  const game = await gameCache.getElseSet(gameId, async () => {
    return await getGame(gameId);
  })

  if (!game) {
    return context.text('Game not found', 404);
  }

  if (game.features.includes(GameFeature.Block)) {
    return context.text('Your game has been blocked from bloxadmin', 401);
  }

  const { config: scriptConfig, ingestKey } = await getScriptConfig(gameId);
  const host = context.req.headers.get("x-forwarded-for") || context.req.headers.get("x-real-ip") || context.env.remoteAddr.hostname;
  const modes = context.req.headers.get("x-roblox-mode")?.split(",") || [];

  await initServer(Number(gameId), serverId, host, modes);

  const reqUrl = new URL(context.req.url);

  if (scriptVersion < 121) {
    return context.text('Please update your bloxadmin script', 400);
  }

  const authHeader = context.req.headers.get("authorization");

  if (!authHeader || !scriptConfig || !ingestKey) {
    return context.text('Unauthorized', 401);
  }

  const [keyType, apiKey] = authHeader.split(" ");

  if (keyType !== "Bearer" || !apiKey || apiKey !== ingestKey) {
    console.warn(`[Ingest] Invalid auth header for game ${game.id}: ${authHeader}`);
    return context.text('Forbidden', 403);
  }

  const config = await getGameRemoteConfig(gameId);

  const key = await generateServerIngestToken(gameId, serverId);

  reqUrl.pathname = `/ingest/${gameId}/${serverId}`;
  reqUrl.searchParams.set('k', key);

  return context.json({
    url: reqUrl.toString(),
    config: scriptConfig,
    options: {
      config,
    },
  });
});

type RemoteMessage = EventDatas;
interface RemoteMessagingBody {
  messages: RemoteMessage[];
}

// function transformRunAction(call: any): RunAction {
//   const data = {
//     id: call._id ? String(call._id) : undefined,
//     ...call,
//     scheduledAction: call.scheduledAction ? String(call.scheduledAction) : undefined,
//   };

//   delete data._id;

//   return data;
// }

async function handleEvents(context: Context, game: Game, reqServerId: string, scriptVersion: number, data: RemoteMessagingBody) {
  if (game.features.includes(GameFeature.Block)) {
    return context.text('Your game has been blocked from bloxadmin', 401);
  }

  const promises: Promise<boolean>[] = [];
  const influxGlobalWriteApi = influxdb.getWriteApi(influxOrg, Deno.env.get("INFLUX_GAME_BUCKET") || "game-aggregation", "ms");
  const influxWriteApi = influxdb.getWriteApi(influxOrg, Deno.env.get("INFLUX_SERVER_BUCKET") || "server-metrics", "ms");

  // console.log(JSON.stringify(body, null, 2))

  if (scriptVersion < 122)
    data.messages = data.messages.map((m) => (m as unknown as [string, RemoteMessage])[1]);

  const placeId = parseInt(context.req.header("x-place-id")!) || 0;
  const placeVersion = parseInt(context.req.header("x-place-version")!) || 0;

  const eventContext: EventContext = {
    influxGlobalWriteApi,
    influxWriteApi,
    scriptVersion,
    context,
    gameId: game.id,
    game,
    placeId,
    placeVersion,
    serverId: reqServerId,
    retry: [],
    messages: [],
  }

  for (const raw of data.messages) {
    const [messageType, ...args] = raw;
    switch (messageType) {
      case EventType.Analytics: {
        const [name, time, segments, data] = args as EventData[EventType.Analytics];
        const promise = handleEvent({
          ...eventContext,
          raw,
          name,
          time: new Date(time * 1000),
          segments,
          data,
        });
        promises.push(promise);
        break;
      }
      case EventType.Actions: {
        const promise = handleActionsMessage(eventContext, args as EventData[EventType.Actions]);
        promises.push(promise);
        break;
      }
    }
  }

  await Promise.allSettled(promises);
  await influxGlobalWriteApi.close();
  await influxWriteApi.close();

  return {
    retry: eventContext.retry.length ? eventContext.retry : undefined,
    messages: eventContext.messages.length ? eventContext.messages : undefined,
  }
}

router.post('/ingest/:gameId/:server', async (context) => {
  const body = await context.req.json<RemoteMessagingBody>();
  const scriptVersion = Number(context.req.headers.get("x-bloxadmin-version") || "-1");

  try {

    if (body.messages.length === 0) {
      if (ENABLE_LOGGING)
        console.log(`[ingest] no messages for ${context.req.param("gameId")}/${context.req.param('server')}`);

      if (scriptVersion < 122)
        return context.json([true, null])
      return context.json({});
    }

    const gameId = context.req.param("gameId");
    const serverId = context.req.param('server');

    const key = context.req.query('k')
    const verified = await verifyServerIngestToken(key, gameId, serverId);

    if (!verified) {
      if (ENABLE_LOGGING)
        console.log(`[ingest] invalid key ${key} for ${gameId}/${serverId}`);

      if (scriptVersion < 122)
        return context.json([false, null])
      return context.json({});
    }

    const game = await gameCache.getElseSet(gameId, async () => {
      return await getGame(gameId);
    })

    const result = await handleEvents(context as Context, game!, serverId, scriptVersion, body);

    if (scriptVersion < 122)
      return context.json([true, null])
    return context.json({
      ...result,
    });
  } catch (e) {
    context.error = e;
    if (ENABLE_LOGGING)
      console.log(`[ingest] error for ${context.req.param("gameId")}/${context.req.param('server')}`);

    console.error(e);

    if (scriptVersion < 122)
      return context.json([false, null])
    return context.json({
      retry: body.messages,
    });
  }
});

router.get("/games/:gameId/events", auth(), (context) => {
  const channel = new EventChannel(context.req.param("gameId"), "servers");
  const stream = new ReadableStream({
    start(controller) {
      channel.onEvent((event) => {
        if (ENABLE_LOGGING)
          console.log(`[Event] ${event.type} ${JSON.stringify(event)}`);
        try {
          controller.enqueue(`data: ${JSON.stringify(event)}\n\n`);
        } catch (e) {
          console.error(e);
        }
      });
    }
  });

  return new Response(stream.pipeThrough(new TextEncoderStream()), {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": context.res.headers.get("Access-Control-Allow-Origin") || undefined!,
      "Access-Control-Allow-Credentials": context.res.headers.get("Access-Control-Allow-Credentials") || undefined!,
      "Access-Control-Allow-Headers": context.res.headers.get("Access-Control-Allow-Headers") || undefined!,
      "Access-Control-Allow-Methods": context.res.headers.get("Access-Control-Allow-Methods") || undefined!,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    }
  });
});

router.get("/games/:gameId/servers/:serverId/events", auth(), (context) => {
  const channel = new EventChannel(context.req.param("serverId"), "players");

  const stream = new ReadableStream({
    start(controller) {
      channel.onEvent((event) => {
        try {
          if (event.type === "playerJoin") {
            getGamePlayer(event.data.sourceGameId, event.data.playerId, {
            }).then((player) => {
              if (!player) {
                controller.enqueue(`data: ${JSON.stringify(event)}\n\n`);
                return;
              }

              controller.enqueue(`data: ${JSON.stringify({
                ...event,
                data: {
                  ...event.data,
                  player: {
                    id: player.id,
                    name: player.name,
                  },
                }
              })}\n\n`);
            }).catch(() => {
              controller.enqueue(`data: ${JSON.stringify(event)}\n\n`);
            })
          } else {
            controller.enqueue(`data: ${JSON.stringify(event)}\n\n`);
          }
        } catch (e) {
          console.error(e);
        }
      });
    },
    cancel() {
      channel.close();
    }
  });

  return new Response(stream.pipeThrough(new TextEncoderStream()), {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": context.res.headers.get("Access-Control-Allow-Origin") || undefined!,
      "Access-Control-Allow-Credentials": context.res.headers.get("Access-Control-Allow-Credentials") || undefined!,
      "Access-Control-Allow-Headers": context.res.headers.get("Access-Control-Allow-Headers") || undefined!,
      "Access-Control-Allow-Methods": context.res.headers.get("Access-Control-Allow-Methods") || undefined!,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    }
  });
});

router.get("/games/:gameId/servers/:serverId/logs", auth(), (context) => {
  const channel = new EventChannel(context.req.param("serverId"), "consoleLog");
  const stream = new ReadableStream({
    start(controller) {
      channel.onEvent((event) => {
        if (ENABLE_LOGGING)
          console.log(`[Event] ${event.type} ${JSON.stringify(event)}`);
        try {
          console.log(controller)
          controller.enqueue(`data: ${JSON.stringify(event)}\n\n`);
        } catch (e) {
          console.error(e);
        }
      });
    }
  });

  return new Response(stream.pipeThrough(new TextEncoderStream()), {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": context.res.headers.get("Access-Control-Allow-Origin") || undefined!,
      "Access-Control-Allow-Credentials": context.res.headers.get("Access-Control-Allow-Credentials") || undefined!,
      "Access-Control-Allow-Headers": context.res.headers.get("Access-Control-Allow-Headers") || undefined!,
      "Access-Control-Allow-Methods": context.res.headers.get("Access-Control-Allow-Methods") || undefined!,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    }
  });
});
