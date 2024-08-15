import { crypto } from "https://deno.land/std@0.184.0/crypto/crypto.ts";
import { ScriptErrorEventData } from "../events/scriptError.ts";

// * Util
import postgres from "../util/postgres.ts";

interface Dates {
  created: Date,
  updated: Date
}

interface ScriptError extends Dates {
  id: string,
  gameId: number,
  script?: string,
  message: string,
  stack: string,
  environment: "client" | "server",
  occurrences: number,
  placeVersion: number,
  assigneeId?: number,
  resolved: boolean
}

interface DatabaseScirptError extends Dates {
  id: string;
  game_id: number;
  script: string | null;
  message: string;
  stack: string;
  environment: "client" | "server";
  occurrences: number;
  place_version: number;
  assignee_id: number | null;
  resolved: boolean;
}

// * Move hashing into roblox -> (https://create.roblox.com/docs/reference/engine/libraries/bit32)
async function genHash(input: string) {
  const encoded = new TextEncoder().encode(input);
  const buffer = await crypto.subtle.digest("SHA-256", encoded);
  const array = Array.from(new Uint8Array(buffer));
  const hash = array.map((byte) => byte.toString(16).padStart(2, "0")).join("");

  return hash;
}

export async function recordScriptError(gameId: string | number, { error, occurrence }: ScriptErrorEventData, time: Date) {
  const id = await genHash(error.message + error.stack);

  const { environment, placeVersion } = {
    environment: occurrence.playerId ? "client" : "server",
    placeVersion: occurrence.placeVersion
  };

  await postgres`
    INSERT INTO game_errors
      (game_id, id, script, message, stack, environment, place_version)
    VALUES
      (${gameId}, ${id}, ${error.script || null}, ${error.message || ""}, ${error.stack || ""}, ${environment}, ${placeVersion || 0})
    ON CONFLICT
      (game_id, id)
    DO UPDATE SET
      occurrences = game_errors.occurrences + 1,
      resolved = false,
      place_version = ${placeVersion},
      updated = ${time}
  `;
}

export async function getScriptErrors(gameId: string | number, limit: number, skip: number, resolved?: boolean): Promise<ScriptError[]> {
  const errors = await postgres<DatabaseScirptError>`
    SELECT * FROM game_errors WHERE game_id = ${gameId} AND resolved = ${resolved || false} 
    ORDER BY place_version DESC, occurrences DESC 
    LIMIT ${limit} OFFSET ${skip}
  `;

  return errors.map((error) => ({
    id: error.id,
    gameId: error.game_id,
    script: error.script || undefined,
    message: error.message,
    stack: error.stack,
    environment: error.environment,
    occurrences: error.occurrences,
    placeVersion: error.place_version,
    assigneeId: error.assignee_id || undefined,
    resolved: error.resolved,
    created: error.created,
    updated: error.updated
  }));
}

export async function getTotalGameScriptErrors(game: string | number, resolved?: boolean) {
  const [{ count }] = await postgres<{ count: number }>`
    SELECT COUNT(*)::int FROM game_errors WHERE game_id = ${game} AND resolved = ${resolved}
  `;

  return count;
}

export async function updateScriptError(gameId: string | number, id: string, values: { assigneeId?: number, resolved?: boolean }) {
  const resolved = typeof values.resolved === "boolean" ? values.resolved : postgres("resolved");
  const [updated] = await postgres<{ hash: string }>`
    UPDATE game_errors SET assignee_id = ${values.assigneeId || postgres("assignee_id")}, resolved = ${resolved} WHERE game_id = ${gameId} AND id = ${id} RETURNING id
  `;

  return updated;
}

export async function deleteScriptError(gameId: string | number, id: string) {
  const [deleted] = await postgres<{ hash: string }>`
    DELETE FROM game_errors WHERE game_id = ${gameId} AND id = ${id} RETURNING id
  `;

  return deleted;
}
