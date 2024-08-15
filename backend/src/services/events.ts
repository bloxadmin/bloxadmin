import { ENABLE_LOGGING } from "../consts.ts";
import { ConsoleLogEventData } from "../events/consoleLog.ts";
import { PlayerChatEventData } from "../events/playerChat.ts";
import { PlayerJoinEventData } from "../events/playerJoin.ts";
import { PlayerLeaveEventData } from "../events/playerLeave.ts";
import { PlayerReadyData } from "../events/playerReady.ts";
import { WriteApi } from "../util/influxdb.ts";
import { Context } from "../util/router.ts";
import { Game } from "./games.ts";
import { EventDatas } from "./serverEvents.ts";

/*influxGlobalWriteApi
influxWriteApi
scriptVersion
context
gameId
game
serverId
retry
messages*/

export interface EventContext {
  context: Context;
  influxGlobalWriteApi: WriteApi;
  influxWriteApi: WriteApi;
  retry: EventDatas[];
  messages: EventDatas[];

  scriptVersion: number;

  gameId: number;
  placeId: number;
  placeVersion: number;
  serverId: string;

  game: Game;
}

export interface ServerEventContext<D = unknown> extends EventContext {
  raw: EventDatas;
  name: string;
  time: Date;
  segments: Record<string, string>;
  data: D;
}

export interface PlayerServerEvent<N extends string, D = unknown> {
  type: N;
  time: Date;
  data: D & {
    playerId: number;
  };
}

export type ServerPlayerJoinEvent = PlayerServerEvent<"playerJoin", Omit<PlayerJoinEventData, "teleportData">>;
export type ServerPlayerLeaveEvent = PlayerServerEvent<"playerLeave", PlayerLeaveEventData>;
export type ServerPlayerChatEvent = PlayerServerEvent<"playerChat", PlayerChatEventData>;
export type ServerPlayerReadyEvent = PlayerServerEvent<"playerReady", PlayerReadyData>;
export type ServerOpenEvent = {
  type: "serverOpen";
  serverId: string;
  time: Date;
};

export type ServerCloseEvent = {
  type: "serverClose";
  serverId?: string;
  time: Date;
};

export type ConsoleLogEvent = {
  type: "consoleLog",
  time: Date,
  data: ConsoleLogEventData
}

// export type ActionRunningEvent = {
//   type: "actionRunning";
//   call: RunAction;
// }
// export type ActionReturnedEvent = {
//   type: "actionReturned";
//   call: RunAction;
// }

export type ServerEvent =
  | ServerPlayerJoinEvent
  | ServerPlayerLeaveEvent
  | ServerPlayerChatEvent
  | ServerPlayerReadyEvent
  | ServerOpenEvent
  | ServerCloseEvent
  | ConsoleLogEvent
  // | ActionRunningEvent
  // | ActionReturnedEvent;

export class EventChannel {
  static cache = new Map<string, EventChannel>();
  channel: BroadcastChannel;
  readonly key: string;

  constructor(readonly name: string, readonly event: "players" | "servers" | "actions" | "consoleLog") {
    this.key = `${name},${event}`;
    this.channel = new BroadcastChannel(this.key);
  }

  static for(name: string | number, event: "players" | "servers" | "actions" | "consoleLog") {
    const key = `${name},${event}`;
    if (!this.cache.has(key)) {
      this.cache.set(key, new EventChannel(name.toString(), event));
    }
    return this.cache.get(key)!;
  }

  onEvent(handler: (event: ServerEvent) => void) {
    const listener = (messageEvent: MessageEvent) => {
      if (ENABLE_LOGGING)
        console.log(`[${this.name}] Received event ${messageEvent.data.type}`);
      try {
        handler(messageEvent.data);
      } catch (e) {
        console.error(e);
      }
    };
    this.channel.addEventListener("message", listener);
    return {
      unsubscribe: () => {
        this.channel.removeEventListener("message", listener);
      },
    };
  }
  close() {
    this.channel.close();
  }

  sendEvent(event: ServerEvent) {
    if (ENABLE_LOGGING)
      console.log(`[${this.name}] Sending event ${event.type}`);
    this.channel.postMessage(event);
  }
}
