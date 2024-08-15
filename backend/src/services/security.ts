import postgres from "../util/postgres.ts";
import { Context, Next } from "../util/router.ts";

export const Permissions = {
  Players: {
    Details: {
      List: 'players:details:list',
      Read: 'players:details:read',
    },
    Moderation: {
      List: 'players:moderation:list',
      Read: 'players:moderation:read',
      Update: 'players:moderation:update',
      Warn: 'players:moderation:warn',
      Kick: 'players:moderation:kick',
      PermanentBan: 'players:moderation:permanent_ban',
      TemporaryBan: 'players:moderation:temporary_ban',
      Unban: 'players:moderation:unban',
      PermanentMute: 'players:moderation:permanent_mute',
      TemporaryMute: 'players:moderation:temporary_mute',
      Unmute: 'players:moderation:unmute',
    },
    Reports: {
      List: 'players:reports:list',
      Create: 'players:reports:create',
      Read: 'players:reports:read',
      Update: 'players:reports:update',
      Delete: 'players:reports:delete',
    },
    Sessions: {
      List: 'players:sessions:list',
    },
    PromoCodes: {
      List: 'players:promo_codes:list',
      Create: 'players:promo_codes:create',
      Read: 'players:promo_codes:read',
      Update: 'players:promo_codes:update',
      Delete: 'players:promo_codes:delete',
    },
  },
  Moderation: {
    Actions: {
      List: 'moderation:actions:list',
    },
  },
  Servers: {
    Servers: {
      List: 'servers:servers:list',
    },
    Chat: {
      Read: 'servers:chat:read',
    },
    Actions: {
      Shutdown: 'servers:actions:shutdown',
    },
    Metrics: {
      Read: 'servers:metrics:read',
    },
    Sessions: {
      List: 'servers:sessions:list',
    },
  },
  Errors: {
    Errors: {
      List: 'errors:errors:list',
      Read: 'errors:errors:read',
      Update: 'errors:errors:update',
      Delete: 'errors:errors:delete'
    },
  },
  Game: {
    IngestConfig: {
      Read: 'game:ingest_config:read',
      Update: 'game:ingest_config:update',
    },
  },
  RemoteConfig: {
    Entries: {
      List: 'remote_config:entries:list',
      Create: 'remote_config:entries:create',
      Read: 'remote_config:entries:read',
      Update: 'remote_config:entries:update',
      Delete: 'remote_config:entries:delete',
    },
  },
  Datastores: {
    Datastores: {
      List: 'datastores:datastores:list',
      Read: 'datastores:datastores:read',
      Create: 'datastores:datastores:create',
      Delete: 'datastores:datastores:delete',
    },
    Entries: {
      Create: 'datastores:entries:create',
      Read: 'datastores:entries:read',
      Update: 'datastores:entries:update',
      Delete: 'datastores:entries:delete',
      List: 'datastores:entries:list',
    },
  },
  PromoCodes: {
    PromoCodes: {
      List: 'promo_codes:promo_codes:list',
      Create: 'promo_codes:promo_codes:create',
      Read: 'promo_codes:promo_codes:read',
      Update: 'promo_codes:promo_codes:update',
      Delete: 'promo_codes:promo_codes:delete',
    },
  },
  Api: {
    Keys: {
      List: 'api:keys:list',
      Create: 'api:keys:create',
      Delete: 'api:keys:delete',
    },
  },
  Security: {
    Users: {
      List: 'security:users:list',
      Create: 'security:users:create',
      Read: 'security:users:read',
      Update: 'security:users:update',
      Delete: 'security:users:delete',
    },
    Roles: {
      List: 'security:roles:list',
    },
    Permissions: {
      List: 'security:permissions:list',
    },
  },
  Actions: {
    Actions: {
      List: 'actions:actions:list',
      Read: 'actions:actions:read',
      Update: 'actions:actions:update',
    },
    Executions: {
      List: 'actions:executions:list',
      Create: 'actions:executions:create',
      Read: 'actions:executions:read',
    },
  },
} as const;

export const VALID_PERMISSIONS = Object
  .values(Permissions)
  .flat()
  .map((rs) => Object.values(rs))
  .flat()
  .map((as) => Object.values(as))
  .flat() as Permission[];

export type NestedValues<T> =
  | T extends string ? T
  : T extends object ? NestedValues<T[keyof T]>
  : never;

export type Permission = NestedValues<typeof Permissions>;


export interface PermissionItem {
  id: string;
  scope: string;
  resource: string;
  action: string;
  name: string;
  description: string;
}

export interface SecurityRole {
  id: number;
  name: string;
  managed: boolean;
  permissions: Permission[];
  permissionGroups: string[];
}

export interface SecurityUser {
  id: number;
  name: string;
  sequence: number;
  roles: {
    id: number;
    name: string;
    permissions: Permission[];
  }[];
}

interface DatabasePermission {
  sequence: number;
  scope: string;
  resource: string;
  action: string;
  name: string;
  description: string;
  internal: boolean;
}

interface DatabaseSecurityRole {
  id: number;
  name: string;
  group_id: number;
}

export async function getPermissionList(): Promise<PermissionItem[]> {
  const permissions = await postgres<DatabasePermission>`
    SELECT * FROM permissions WHERE internal = false ORDER BY sequence ASC
  `;

  return permissions.map((permission) => ({
    id: `${permission.scope}:${permission.resource}:${permission.action}`,
    scope: permission.scope,
    resource: permission.resource,
    action: permission.action,
    name: permission.name,
    description: permission.description,
  }));
}

export async function getSecurityRoles(groupId: number | string): Promise<SecurityRole[]> {
  const roles = await postgres<{
    id: number;
    name: string;
    group_id: number;
    permissions: Permission[];
    groups: string[];
  }>`
    SELECT
      id, name, group_id, permissions, groups
    FROM security_roles
    WHERE internal = false
      AND (group_id = 0 OR group_id = ${groupId});
  `;

  return roles.map((role) => ({
    id: role.id,
    name: role.name,
    managed: role.group_id == 0,
    permissions: role.permissions,
    permissionGroups: role.groups,
  }));
}

export async function getGameSecurityRoles(gameId: number | string): Promise<SecurityRole[]> {
  const roles = await postgres<{
    id: number;
    name: string;
    group_id: number;
    permissions: Permission[];
    groups: string[];
  }>`
    SELECT
      id, name, group_id, permissions, groups
    FROM security_roles
    WHERE internal = false
      AND (group_id = 0 OR group_id = (SELECT tracking_group_id FROM games WHERE id = ${gameId}));
  `;

  return roles.map((role) => ({
    id: role.id,
    name: role.name,
    managed: role.group_id == 0,
    permissions: role.permissions,
    permissionGroups: role.groups,
  }));
}

export async function getSecurityGameUsers(gameId: number | string): Promise<SecurityUser[]> {
  const rows = await postgres<{
    user_id: number;
    user_name: string;
    name: string;
    security_role_id: number;
    permissions: Permission[];
    internal: boolean;
    sequence: number;
  }>`
    SELECT players.name as user_name, u.user_id, u.name, u.security_role_id, u.permissions, u.internal, u.sequence FROM (
      SELECT user_id, name, security_role_id, permissions, internal, sequence FROM security_role_game_users
      LEFT JOIN security_roles ON security_roles.id = security_role_game_users.security_role_id
      WHERE game_id = ${gameId}
      UNION DISTINCT
      SELECT user_id, name, security_role_id, permissions, internal, sequence FROM security_role_group_users
      LEFT JOIN security_roles ON security_roles.id = security_role_group_users.security_role_id
      WHERE security_role_group_users.group_id = (SELECT tracking_group_id FROM games WHERE id = ${gameId})
    ) AS u
    LEFT JOIN players ON players.id = u.user_id
  `;

  const usersMap: Record<number, SecurityUser> = {};
  const users: SecurityUser[] = [];

  for (const row of rows) {
    if (!usersMap[row.user_id]) {
      const user: SecurityUser = {
        id: row.user_id,
        name: row.user_name,
        sequence: 0,
        roles: [],
      };
      usersMap[row.user_id] = user;
      users.push(user);
    }

    usersMap[row.user_id].sequence = Math.max(usersMap[row.user_id].sequence, row.sequence);

    if (row.internal)
      continue;

    usersMap[row.user_id].roles.push({
      id: row.security_role_id,
      name: row.name,
      permissions: row.permissions,
    });
  }

  return users;
}

export async function getSecurityGameUser(gameId: number | string, userId: number | string): Promise<SecurityUser> {
  const rows = await postgres<{
    user_id: number;
    user_name: string;
    name: string;
    security_role_id: number;
    permissions: Permission[];
    internal: boolean;
    sequence: number;
  }>`
    SELECT players.name as user_name, u.user_id, u.name, u.security_role_id, u.permissions, u.internal, u.sequence FROM (
      SELECT user_id, name, security_role_id, permissions, internal, sequence FROM security_role_game_users
      LEFT JOIN security_roles ON security_roles.id = security_role_game_users.security_role_id
      WHERE game_id = ${gameId} AND user_id = ${userId}
      UNION DISTINCT
      SELECT user_id, name, security_role_id, permissions, internal, sequence FROM security_role_group_users
      LEFT JOIN security_roles ON security_roles.id = security_role_group_users.security_role_id
      WHERE security_role_group_users.group_id = (SELECT tracking_group_id FROM games WHERE id = ${gameId}) AND user_id = ${userId}
    ) AS u
    LEFT JOIN players ON players.id = u.user_id
  `;

  const user: SecurityUser = {
    id: Number(userId),
    name: rows[0].user_name,
    sequence: 0,
    roles: [],
  };

  for (const row of rows) {
    user.sequence = Math.max(user.sequence, row.sequence);

    if (row.internal)
      continue;

    user.roles.push({
      id: row.security_role_id,
      name: row.name,
      permissions: row.permissions,
    });
  }

  return user;
}

export async function getUserGamePermissions(gameId: string | number, userId: string | number): Promise<Permission[]> {
  const rows = await postgres<{
    permission: Permission;
  }>`
    SELECT unnest(permissions) as permission FROM security_role_game_users
    LEFT JOIN security_roles ON security_roles.id = security_role_game_users.security_role_id
    WHERE game_id = ${gameId} AND user_id = ${userId}
    UNION DISTINCT
    SELECT unnest(permissions) as permission FROM security_role_group_users
    LEFT JOIN security_roles ON security_roles.id = security_role_group_users.security_role_id
    WHERE security_role_group_users.group_id = (SELECT tracking_group_id FROM games WHERE id = ${gameId}) AND user_id = ${userId}
  `;

  const permissions = rows.map((row) => row.permission);

  return [...new Set(permissions)];
}

export async function createSecurityRole(groupId: string | number, name: string, permissions: Permission[], permissionGroups: string[] = []): Promise<SecurityRole> {
  const [role] = await postgres<{
    id: number;
  }>`
    INSERT INTO security_roles (group_id, name, permissions, groups)
    VALUES (${groupId}, ${name}, ${permissions}, groups)
    RETURNING id
  `;

  return {
    id: role.id,
    name,
    managed: groupId == 0,
    permissions,
    permissionGroups: permissionGroups,
  };
}

export async function updateSecurityRole(roleId: string | number, update: { name?: string, permissions?: Permission[], permissionGroups?: string[] }): Promise<SecurityRole> {
  if (Object.keys(update).length == 0)
    throw new Error('No update parameters provided');

  const [role] = await postgres<{
    name: string;
    permissions: Permission[];
    groups: string[];
  }>`
    UPDATE security_roles SET ${postgres(update)}
    WHERE id = ${roleId}
    RETURNING name, permissions, groups
  `;

  return {
    id: Number(roleId),
    name: role.name,
    managed: roleId == 0,
    permissions: role.permissions,
    permissionGroups: role.groups,
  };
}

export async function addGroupUserToSecurityRole(groupId: string | number, userId: string | number, roleId: number): Promise<void> {
  await postgres`
    INSERT INTO security_role_group_users (group_id, user_id, security_role_id)
    VALUES (${groupId}, ${userId}, ${roleId})
  `;
}

export async function removeGroupUserFromSecurityRole(groupId: string | number, userId: string | number, roleId: number): Promise<void> {
  await postgres`
    DELETE FROM security_role_group_users
    WHERE group_id = ${groupId} AND user_id = ${userId} AND security_role_id = ${roleId}
  `;
}

export async function addGameUserToSecurityRole(gameId: string | number, userId: string | number, roleId: number): Promise<void> {
  await postgres`
    INSERT INTO security_role_game_users (game_id, user_id, security_role_id)
    VALUES (${gameId}, ${userId}, ${roleId})
  `;
}

export async function removeGameUserFromSecurityRole(gameId: string | number, userId: string | number, roleId: number): Promise<void> {
  await postgres`
    DELETE FROM security_role_game_users
    WHERE game_id = ${gameId} AND user_id = ${userId} AND security_role_id = ${roleId}
  `;
}

export async function userHasPermissionsForGame(gameId: string | number, userId: string | number, required: Permission[], all = true): Promise<null | {
  has: Permission[];
  missing: Permission[];
  allow: boolean;
}> {
  const permissions = await getUserGamePermissions(gameId, userId);

  if (permissions.length === 0)
    return null;

  if (required.length === 0)
    return {
      has: permissions,
      missing: [],
      allow: true,
    };

  const missing = required.filter((permission) => !permissions.includes(permission));

  return {
    has: permissions,
    missing,
    allow: missing.length === 0 || (!all && missing.length < required.length),
  };

}

export function security(
  required: Permission[],
  all = true,
  gameIdParam = "gameId") {
  return async (context: Context, next: Next) => {
    const userId = context.get("userId");

    if (!userId) {
      return context.text("Unauthorized", 401);
    }

    // Admin and ingest key bypass
    if (context.get("admin") || context.get("ingestKey")) {
      context.set("permissions", VALID_PERMISSIONS);
      return next();
    }

    const gameId = Number(context.req.param(gameIdParam));

    const perms = await userHasPermissionsForGame(gameId, userId, required, all);

    if (perms === null) {
      return context.text("Game not found", 404);
    }

    context.set("permissions", perms.has);

    if (!perms.allow) {
      return context.text(`You do not have the required permissions to perform that action (${all ? '' : 'one of: '}${perms.missing.join(", ")})`, 403);
    }

    return next();
  }
}
