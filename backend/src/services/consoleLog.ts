import { ConsoleLogEventData } from "../events/consoleLog.ts";

// * Util
import postgres from "../util/postgres.ts";

interface ScriptError {
  serverId: string,
  message: string,
  messageType: string
}

interface DatabaseScirptError {
  id: string,
  message: string,
  message_type: string
}

export async function recordConsoleLog(serverId: string | number, { message, messageType }: ConsoleLogEventData) {
  await postgres`
    INSERT INTO game_console_logs
      (id, message, message_type)
    VALUES
      (${serverId}, ${message}, ${messageType})
  `;
}

export async function getConsoleLogs(serverId: string | number, limit: number, skip: number): Promise<ScriptError[]> {
  const logs = await postgres<DatabaseScirptError>`
    SELECT * FROM game_console_logs WHERE id = ${serverId} LIMIT ${limit} OFFSET ${skip}
  `;

  return logs.map((log) => ({
    serverId: log.id,
    message: log.message,
    messageType: log.message_type
  }));
}

export async function deleteConsoleLogs(serverId: string | number) {
  const [deleted] = await postgres`
    DELETE FROM game_console_logs WHERE id = ${serverId}
  `;

  return deleted;
}
