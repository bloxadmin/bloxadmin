import { recordScriptError } from "../services/scriptError.ts";
import { ServerEventContext } from "../services/events.ts";

export interface ScriptErrorEventData {
  error: {
    message: string;
    stack: string;
    script?: string;
  }
  occurrence: {
    serverId: string;
    placeId: number;
    placeVersion: number;
    playerId: number;
  }
}

const DISABLED = true;

export default async function handleScriptErrorEvent({ game, serverId, data, scriptVersion, time }: ServerEventContext<ScriptErrorEventData>) {
  if (DISABLED) return;
  if (scriptVersion < 119) return;

  // deno-lint-ignore no-explicit-any
  if ((data as any).occurence) {
    // deno-lint-ignore no-explicit-any
    data.occurrence = (data as any).occurence;
    // deno-lint-ignore no-explicit-any
    delete (data as any).occurence;
  }

  data.occurrence.serverId = serverId;

  await recordScriptError(game.id, data, time);
}
