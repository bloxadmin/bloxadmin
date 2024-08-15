import { ActionParameter } from "./actions.ts";
import { ScriptConfig } from "./games.ts";

export enum EventType {
  ConsoleLog = 0,
  Analytics = 1,
  RemoteConfig = 2,
  Actions = 3,
  Moderation = 4,
  Shutdown = 5,
  Chat = 6,
  Metrics = 7,
  ScriptConfig = 8,
}

export enum ActionEventType {
  Call = 0,
  Running = 1,
  Result = 2,
  Save = 3,
  Log = 4,
}

export enum MetricsEventType {
  Set = 0,
  Merge = 1,
  Add = 2,
  Time = 3,
  Score = 4,
}

export type ModerationEventType = "Kick" | "Mute" | "Unmute" | "Ban" | "Unban";

export const CONVERT_MODERATION_EVENT_TYPE: Record<string, ModerationEventType> = {
  ban: "Ban",
  unban: "Unban",
  kick: "Kick",
  mute: "Mute",
  unmute: "Unmute",
}

export type EventActionsCall = [{
  id: string;
  name: string;
  parameters: Record<string, string | number | boolean | undefined>;
  context: Record<string, string | number | boolean | undefined>;
}];
export type EventActionsRunning = [string];
export type EventActionsResult = [string, boolean, unknown];
export type EventActionsSave = [string, ActionParameter[]];
export type EventActionsLog = [string, string, string];

export interface EventData {
  [EventType.ConsoleLog]: [];
  [EventType.Analytics]: [string, number, Record<string, string>, Record<string, unknown>];
  [EventType.RemoteConfig]: [Record<string, unknown>];
  [EventType.Actions]:
  | [ActionEventType.Call, ...EventActionsCall]
  | [ActionEventType.Running, ...EventActionsRunning]
  | [ActionEventType.Result, ...EventActionsResult]
  | [ActionEventType.Save, ...EventActionsSave]
  | [ActionEventType.Log, ...EventActionsLog];
  [EventType.Moderation]: [ModerationEventType, number, number | null, string | null, number | null];
  [EventType.Shutdown]: [string | null, number | null];
  [EventType.Chat]: [];
  [EventType.Metrics]:
  /* event: [Event Type, Time, Metric Name, Player ID, ...args] */
  // args:  [value]
  | [(
    | MetricsEventType.Set
    | MetricsEventType.Score
    | MetricsEventType.Add
    | MetricsEventType.Time), number, string, number, number]
  // args: [min, max, sum, count]
  | [MetricsEventType.Merge, number, string, number, number, number, number, number];
  [EventType.ScriptConfig]: [ScriptConfig];
}

export type SingleEventData<K extends keyof EventData> = [K, ...EventData[K]];

export type EventDatas =
  | SingleEventData<EventType.ConsoleLog>
  | SingleEventData<EventType.Analytics>
  | SingleEventData<EventType.RemoteConfig>
  | SingleEventData<EventType.Actions>
  | SingleEventData<EventType.Moderation>
  | SingleEventData<EventType.Shutdown>
  | SingleEventData<EventType.Chat>
  | SingleEventData<EventType.Metrics>;

export interface ApiEvent<T extends EventType> {
  gameId: number;
  serverId: string;
  type: T;
  data: EventData[T][];
  sent: boolean;
}

export function buildServerEvent<T extends EventType>(serverId: string, type: T, data: EventData[T]) {
  return [serverId, [[type, ...data]]];
}
