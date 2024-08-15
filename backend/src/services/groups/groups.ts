import postgres from "../../util/postgres.ts";
import { RobloxGroupRole, getRobloxGroup, getRobloxGroupRoleMembers, getRobloxGroupRoles } from "../roblox.ts";
import { addGroupUserToSecurityRole } from "../security.ts";

interface DatabaseGroup {
  id: number;
  name: string;
}

interface DatabaseGroupUser {
  id: number;
  group_id: number;
  role_id: number;
}

interface DatabaseRole {
  id: number;
  name: string;
  group_id: number;
  rank: number;
  can_view_group: boolean;
  syncing_users: boolean;
  sync_users: boolean;
  member_count: number;
}

export interface Group {
  id: number;
  name: string;
}

export interface UserGroup extends Group {
  role: {
    id: number;
    name: string;
  }
}

export async function getUserGroups(userId: number): Promise<UserGroup[]> {
  const result = await postgres<DatabaseGroup & { role_id: number; role_name: string; }>`SELECT 
      groups.id, groups.name, group_users.role_id, roles.name AS role_name
    FROM groups 
    INNER JOIN 
      group_users ON groups.id = group_users.group_id 
    LEFT JOIN
      roles ON group_users.role_id = roles.id
    WHERE group_users.id = ${userId}
  `;

  return result.map(row => ({
    id: row.id,
    name: row.name,
    role: {
      id: row.role_id,
      name: row.role_name,
    }
  }));
}

export async function getGroup(groupId: number, noCreate = false): Promise<Group | null> {
  const [group] = await postgres<Group>`SELECT id, name FROM groups WHERE id = ${groupId}`;

  if (group)
    return group;

  if (noCreate)
    return null;

  const robloxGroup = await getRobloxGroup(groupId);

  if (!robloxGroup)
    return null;

  await postgres<DatabaseGroup>`
    INSERT INTO groups (id, name) VALUES (${robloxGroup.id}, ${robloxGroup.name})
    ON CONFLICT (id) DO UPDATE SET name = ${robloxGroup.name}
  `;

  try {
    await addGroupUserToSecurityRole(groupId, robloxGroup.owner.userId, 1);
  } catch (_e) {
    // Ignore
  }

  const roles = await syncGroupRoles(groupId);

  const ownerRole = roles?.find(role => role.rank === 255);

  if (ownerRole) {
    await syncGroupRoleMembers(groupId, ownerRole.id);
  }

  return {
    id: robloxGroup.id,
    name: robloxGroup.name,
  }
}

export interface GroupUser {
  id: number;
  name: string;
  role: {
    id: number;
    name: string;
  };
}

export async function getTotalGroupUsers(groupId: number, roles: number[] = []): Promise<number> {
  const result = roles.length ? await postgres<{ count: string }>`
    SELECT COUNT(*)
    FROM group_users
    INNER JOIN
      roles ON group_users.role_id = roles.id
    WHERE 
      group_users.group_id = ${groupId} AND group_users.role_id = ANY(${roles})
  ` : await postgres<{ count: string }>`
    SELECT COUNT(*)
    FROM group_users
    WHERE group_users.group_id = ${groupId}
  `;

  return parseInt(result[0].count);
}

export async function getGroupUsers(groupId: number, limit: number, skip: number, roles: number[] = []): Promise<GroupUser[]> {
  const result = await postgres<DatabaseGroupUser & { name: string; role_name: string; }>`SELECT
      group_users.id, group_users.role_id, roles.name as role_name, players.name
    FROM group_users
    INNER JOIN
      roles ON group_users.role_id = roles.id
    INNER JOIN
    players ON group_users.id = players.id
    WHERE group_users.group_id = ${groupId} AND (${roles} = ARRAY[]::int[] OR group_users.role_id = ANY(${roles}))
    ORDER BY roles.rank DESC, roles.id DESC, group_users.id ASC
    LIMIT ${limit}
    OFFSET ${skip}
  `;

  return result.map(row => ({
    id: row.id,
    name: row.name,
    role: {
      id: row.role_id,
      name: row.role_name,
    }
  }));
}

export interface GroupRole {
  id: number;
  name: string;
  rank: number;
  canViewGroup: boolean;
  syncingUsers: boolean;
  syncUsers: boolean;
  memberCount: number;
}

export async function getGroupRoles(groupId: number | string): Promise<GroupRole[]> {
  const result = await postgres<DatabaseRole>`
    SELECT 
      id, name, rank, can_view_group, syncing_users, sync_users, member_count
    FROM roles 
    WHERE 
      group_id = ${groupId} AND rank != 0 
    ORDER BY id, rank DESC
  `;

  return result.map(row => ({
    id: row.id,
    name: row.name,
    rank: row.rank,
    canViewGroup: row.can_view_group,
    syncingUsers: row.syncing_users,
    syncUsers: row.sync_users,
    memberCount: row.member_count,
  }));
}

export async function syncGroup(groupId: number) {
  const robloxGroup = await getRobloxGroup(groupId);

  if (!robloxGroup)
    return;

  const databaseGroup = await getGroup(groupId);

  if (!databaseGroup) {
    await postgres`INSERT INTO groups (id, name) VALUES (${robloxGroup.id}, ${robloxGroup.name})`;
  }

  await syncGroupRoles(groupId);
}

export async function syncGroupRoles(groupId: number | string): Promise<RobloxGroupRole[] | undefined> {
  const robloxRoles = await getRobloxGroupRoles(groupId);

  if (!robloxRoles)
    return;

  const databaseRoles = await getGroupRoles(groupId);

  const rolesToRemove = databaseRoles.filter(databaseRole => !robloxRoles.find(robloxRole => robloxRole.id === databaseRole.id));

  for (const role of rolesToRemove) {
    await postgres`DELETE FROM roles WHERE id = ${role.id}`;
  }

  const rolesToUpsert = robloxRoles.filter(role => role.rank).map(role => [
    role.id,
    role.name,
    role.rank,
    groupId,
    role.memberCount || 0,
  ])

  await postgres`
    INSERT INTO roles 
      (id, name, rank, group_id, member_count)
    VALUES ${postgres(rolesToUpsert)}
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, rank = EXCLUDED.rank, member_count = EXCLUDED.member_count
  `;

  await postgres`
    UPDATE groups
    SET last_sync_roles = NOW()
    WHERE id = ${groupId}
  `;

  return robloxRoles;
}

async function _syncGroupRoleMembers(syncTime: Date, refresh: boolean, groupId: number | string, roleId: number | string, cursor?: string) {
  if (!roleId) return;
  const users = await getRobloxGroupRoleMembers(groupId, roleId, cursor);

  if (!users)
    throw new Error("Failed to get role members");

  const ids = users.data.reduce((acc, user) => {
    acc[user.userId] = true;
    return acc;
  }, {} as Record<string, boolean>);

  const currentGroupUsers = (refresh ? [] : await postgres`
    SELECT id, role_id
    FROM group_users
    WHERE id = ANY(${Object.keys(ids)}) AND group_id = ${groupId}
  `) as { id: number; role_id: number; }[];

  const userRoles = refresh ? {} : currentGroupUsers.reduce((acc, row) => {
    acc[row.id.toString()] = row.role_id;
    return acc;
  }, {} as Record<string, number>);

  const insertPlayers: [number, string][] = [];
  const insertUsers: [number | string, number | string, number | string, Date][] = [];
  const changeRole: number[] = [];
  const removeUsers: number[] = [];
  const changeLogs: [number | string, -1 | 0 | 1, number | string | null, number | string | null][] = [];

  for (const user of users.data) {
    const currentRole = userRoles[user.userId];

    if (!user.userId)
      continue;

    if (refresh || currentRole === undefined) {
      insertPlayers.push([user.userId, user.username]);
      insertUsers.push([user.userId, groupId, roleId, syncTime]);
      changeLogs.push([user.userId, 1, null, roleId]);
      // console.log("insert", user.userId, roleId)
    } else if (currentRole !== roleId) {
      changeRole.push(user.userId);
      changeLogs.push([user.userId, 0, currentRole, roleId]);
      // console.log("change", user.userId, currentRole, roleId)
    }
  }

  if (!refresh && currentGroupUsers.length !== users.data.length)
    for (const user of currentGroupUsers) {
      if (!ids[user.id]) {
        if (!user.id)
          continue;

        removeUsers.push(user.id);
        changeLogs.push([user.id, -1, user.role_id, null]);
        // console.log("remove", user.id, user.role_id)
      }
    }

  try {
    if (insertUsers.length > 0) {
      await postgres`
      INSERT INTO players (id, name) VALUES ${postgres(insertPlayers)}
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
    `;
      await postgres`
      INSERT INTO group_users (id, group_id, role_id, synced_at) VALUES ${postgres(insertUsers)}
      ON CONFLICT (group_id, id) DO UPDATE SET role_id = EXCLUDED.role_id, synced_at = EXCLUDED.synced_at
    `;
    }

    if (changeRole.length > 0) {
      await postgres`
      UPDATE group_users
      SET role_id = ${roleId}, synced_at = ${syncTime}
      WHERE group_id = ${groupId} AND id = ANY(${changeRole})
    `;
    }

    if (removeUsers.length > 0) {
      await postgres`
      DELETE FROM group_users
      WHERE group_id = ${groupId} AND id = ANY(${removeUsers})
    `;
    }

    if (!refresh && changeLogs.length > 0) {
      await postgres`
      INSERT INTO group_users_log (user_id, type, old_role_id, new_role_id) VALUES ${postgres(changeLogs)}
    `;
    }
  } catch (e) {
    console.error(insertPlayers);
    console.error(insertUsers);
    console.error(changeRole);
    console.error(removeUsers);
    console.error(changeLogs);
    throw e;
  }

  if (users.nextPageCursor) {
    if (users.wait) {
      await new Promise(resolve => setTimeout(resolve, users.wait));
    }

    await _syncGroupRoleMembers(syncTime, refresh, groupId, roleId, users.nextPageCursor);
  }
}

export async function syncGroupRoleMembers(groupId: number | string, roleId: number | string) {
  const lastSync = (await postgres<{ last_sync_users: Date }>`SELECT last_sync_users FROM roles WHERE id = ${roleId}`)?.[0].last_sync_users;
  const syncTime = new Date();

  await _syncGroupRoleMembers(syncTime, !lastSync, groupId, roleId);

  await postgres`
    UPDATE roles
    SET last_sync_users = NOW()
    WHERE id = ${roleId}
  `;
}
