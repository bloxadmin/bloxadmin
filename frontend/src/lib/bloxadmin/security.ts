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
  GamePerms: {
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

export interface PermissionGroup {
  name: string;
  category: string;
  description?: string;
  permissions: Permission[];
  dangerous?: boolean;
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  // Players
  {
    name: "View Players",
    category: "Players",
    permissions: [
      Permissions.Players.Details.List,
      Permissions.Players.Details.Read,
    ],
  },
  {
    name: "View Player Sessions",
    category: "Players",
    permissions: [
      Permissions.Players.Sessions.List,
    ]
  },

  // Moderation
  {
    name: "View Player Moderation",
    category: "Moderation",
    permissions: [
      Permissions.Players.Moderation.List,
      Permissions.Players.Moderation.Read,
      Permissions.Moderation.Actions.List,
    ]
  },
  {
    name: "Manage Player Moderation",
    category: "Moderation",
    permissions: [
      Permissions.Players.Moderation.Update,
    ]
  },
  {
    name: "Kick Players",
    category: "Moderation",
    permissions: [
      Permissions.Players.Moderation.Kick,
    ]
  },
  {
    name: "Warn Players",
    category: "Moderation",
    permissions: [
      Permissions.Players.Moderation.Warn,
    ]
  },
  {
    name: "Termporary Mute Players",
    category: "Moderation",
    permissions: [
      Permissions.Players.Moderation.TemporaryMute,
    ]
  },
  {
    name: "Permanent Mute Players",
    category: "Moderation",
    permissions: [
      Permissions.Players.Moderation.PermanentMute,
    ]
  },
  {
    name: "Unmute Players",
    category: "Moderation",
    permissions: [
      Permissions.Players.Moderation.Unmute,
    ]
  },
  {
    name: "Temporary Ban Players",
    category: "Moderation",
    permissions: [
      Permissions.Players.Moderation.TemporaryBan,
    ]
  },
  {
    name: "Permanent Ban Players",
    category: "Moderation",
    permissions: [
      Permissions.Players.Moderation.PermanentBan,
    ]
  },
  {
    name: "Unban Players",
    category: "Moderation",
    permissions: [
      Permissions.Players.Moderation.Unban,
    ]
  },

  // Servers
  {
    name: "View Servers",
    category: "Servers",
    permissions: [
      Permissions.Servers.Servers.List,
    ]
  },
  {
    name: "View Server Chat",
    category: "Servers",
    permissions: [
      Permissions.Servers.Chat.Read,
    ]
  },
  {
    name: "View Server Metrics",
    category: "Servers",
    permissions: [
      Permissions.Servers.Metrics.Read,
    ]
  },
  {
    name: "View Server Sessions",
    category: "Servers",
    permissions: [
      Permissions.Servers.Sessions.List,
    ]
  },
  {
    name: "Shutdown Servers",
    category: "Servers",
    dangerous: true,
    permissions: [
      Permissions.Servers.Actions.Shutdown,
    ]
  },

  // Remote Config
  {
    name: "View Remote Config Entries",
    category: "Remote Config",
    permissions: [
      Permissions.RemoteConfig.Entries.List,
      Permissions.RemoteConfig.Entries.Read,
    ]
  },
  {
    name: "Manage Remote Config Entries",
    category: "Remote Config",
    permissions: [
      Permissions.RemoteConfig.Entries.Create,
      Permissions.RemoteConfig.Entries.Update,
    ]
  },
  {
    name: "Delete Remote Config Entries",
    category: "Remote Config",
    dangerous: true,
    permissions: [
      Permissions.RemoteConfig.Entries.Delete,
    ]
  },

  // Promo Codes
  {
    name: "View Promo Codes",
    category: "Promo Codes",
    permissions: [
      Permissions.PromoCodes.PromoCodes.List,
      Permissions.PromoCodes.PromoCodes.Read,
    ]
  },
  {
    name: "Manage Promo Codes",
    category: "Promo Codes",
    permissions: [
      Permissions.PromoCodes.PromoCodes.Create,
      Permissions.PromoCodes.PromoCodes.Update,
    ]
  },
  {
    name: "Delete Promo Codes",
    category: "Promo Codes",
    dangerous: true,
    permissions: [
      Permissions.PromoCodes.PromoCodes.Delete,
    ]
  },

  // Datastores
  {
    name: "View Datastores",
    category: "Datastores",
    permissions: [
      Permissions.Datastores.Datastores.List,
      Permissions.Datastores.Datastores.Read,
    ]
  },
  {
    name: "Manage Datastores",
    category: "Datastores",
    dangerous: true,
    permissions: [
      Permissions.Datastores.Datastores.Create,
      Permissions.Datastores.Datastores.Delete,
    ]
  },
  {
    name: "Manage Datastore Entries",
    category: "Datastores",
    dangerous: true,
    permissions: [
      Permissions.Datastores.Entries.Create,
      Permissions.Datastores.Entries.Read,
      Permissions.Datastores.Entries.Update,
      Permissions.Datastores.Entries.Delete,
    ]
  },

  // Settings
  {
    name: "Ingest Config",
    category: "Settings",
    description: "Allow access to the game's ingest configuration. This includes the game's API key and other sensitive information.",
    dangerous: true,
    permissions: [
      Permissions.GamePerms.IngestConfig.Read,
      Permissions.GamePerms.IngestConfig.Update,
    ]
  },
  {
    name: "Manage API Keys",
    category: "Settings",
    dangerous: true,
    permissions: [
      Permissions.Api.Keys.List,
      Permissions.Api.Keys.Create,
      Permissions.Api.Keys.Delete,
    ]
  },

  // Security
  {
    name: "View Users",
    category: "Security",
    permissions: [
      Permissions.Security.Users.List,
      Permissions.Security.Users.Read,
    ]
  },
  {
    name: "Manage Users",
    category: "Security",
    dangerous: true,
    permissions: [
      Permissions.Security.Users.Create,
      Permissions.Security.Users.Update,
      Permissions.Security.Users.Delete,
    ]
  },
  {
    name: "View Roles",
    category: "Security",
    permissions: [
      Permissions.Security.Roles.List,
    ]
  },
  {
    name: "View Permissions",
    category: "Security",
    permissions: [
      Permissions.Security.Permissions.List,
    ]
  },
];
