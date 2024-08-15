import postgres from "../util/postgres.ts";
import cron from "./cron.ts";

export async function staleSessionCheck() {
  // Close servers that have not sent a heartbeat in 3 minutes
  await postgres`
  UPDATE game_servers
  SET closed_at = last_heartbeat
  WHERE closed_at IS NULL
    AND last_heartbeat < NOW() - INTERVAL '3 minutes';
  `;

  // Close sessions that are in a closed server
  await postgres`
  UPDATE player_sessions
  SET leave_time = closed_at
  FROM game_servers
  WHERE game_servers.id = player_sessions.server_id
    AND closed_at IS NOT NULL AND leave_time IS NULL;
  `;

}

cron("Stale Check", "*/10 * * * *", staleSessionCheck);
