import { syncGroupRoles } from "../services/groups/groups.ts";
import postgres from "../util/postgres.ts";
import cron from "./cron.ts";

export async function syncGroupRolesJob() {
  const reuslt = await postgres<{ id: string }>`
  SELECT id
  FROM groups
  WHERE (last_sync_roles < NOW() - INTERVAL '1 day' OR last_sync_roles IS NULL)
    AND syncing_roles = false
  ORDER BY last_sync_roles
  LIMIT 100;
  `;

  for (const row of reuslt) {
    await postgres`UPDATE groups SET syncing_roles = true WHERE id = ${row.id}`;

    try {
      await syncGroupRoles(row.id);
    } catch (e) {
      console.error(e);
    } finally {
      await postgres`UPDATE groups SET syncing_roles = false WHERE id = ${row.id}`;
    }
  }
}

cron("Sync Group Roles", "* * * * *", syncGroupRolesJob);
