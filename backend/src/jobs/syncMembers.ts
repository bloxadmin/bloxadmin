import { syncGroupRoleMembers } from "../services/groups/groups.ts";
import postgres from "../util/postgres.ts";
import cron from "./cron.ts";

export async function syncGroupRoleMembersJob() {
  const reuslt = await postgres<{ id: string, group_id: string, member_count: number }>`
  SELECT id, member_count, group_id
  FROM roles
  WHERE (last_sync_users < NOW() - INTERVAL '1 day' OR last_sync_users IS NULL)
    AND member_count <= 50000
    AND syncing_users = FALSE
    AND rank > 0
    AND sync_users = TRUE
    AND group_id in (SELECT id FROM groups WHERE last_sync_roles > NOW() - INTERVAL '1 day')
  ORDER BY last_sync_users
  LIMIT 100;
  `;

  let counted = 0;

  for (const row of reuslt) {
    if ((counted + row.member_count) > 50000)
      continue;
    counted += row.member_count;

    await postgres`UPDATE roles SET syncing_users = true WHERE id = ${row.id}`;

    try {
      await syncGroupRoleMembers(row.group_id, row.id);
    } catch (e) {
      console.error(e);
    } finally {
      await postgres`UPDATE roles SET syncing_users = false WHERE id = ${row.id}`;
    }
  }
}

// cron("Sync Group Role Members", "* * * * *", syncGroupRoleMembersJob);
