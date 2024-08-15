create type resource_table as enum ('groups');

alter type resource_table owner to postgres;

create type feature as enum (
  'faster_ingestion', 
  'extended_chat_logs', 
  'extended_session_logs', 
  'error_occurrence_tracking', 
  'shorter_metrics_interval', 
  'datastore_viewer',
  'block'
);

alter type feature owner to postgres;

create type moderation as enum (
    'ban', 
    'kick', 
    'mute', 
    'warn', 
    'unban', 
    'unmute'
);

create table groups
(
    id              integer,
    name            text,
    last_sync_roles timestamp with time zone,
    syncing_roles   boolean default false not null
);

alter table groups
    owner to postgres;

create unique index groups_id_uindex
    on groups (id);

create table roles
(
    id              serial
        constraint roles_id_uindex
            primary key,
    group_id        integer               not null
        constraint roles_groups_id_fk
            references groups (id)
            on delete cascade,
    name            text                  not null,
    rank            integer,
    can_view_group  boolean default false not null,
    last_sync_users timestamp with time zone,
    syncing_users   boolean default false not null,
    sync_users      boolean default true  not null
);

alter table roles
    owner to postgres;

create index roles_group_id_index
    on roles (group_id);

create table players
(
    id               bigint not null
        constraint players_pk
            primary key,
    name             text   not null,
    joined_roblox_at timestamp with time zone
);

alter table players
    owner to postgres;

create table notes
(
    id             serial
        constraint notes_pk
            primary key,
    resource_table resource_table                         not null,
    resource_id    bigint                                 not null,
    user_id        bigint                                 not null
        constraint notes_players_null_fk
            references players,
    note           text                                   not null,
    type           text,
    created_at     timestamp with time zone default now() not null,
    recipient      text,
    namespace      text                                   not null
);

alter table notes
    owner to postgres;

create index notes_namespace_resource_table_resource_id_index
    on notes (namespace, resource_table, resource_id);

create table group_users
(
    id        bigint  not null
        constraint group_users_players_id_fk
            references players,
    group_id  integer not null
        constraint group_users_groups_id_fk
            references groups (id)
            on delete cascade,
    role_id   integer not null
        constraint group_users_roles_null_fk
            references roles,
    synced_at timestamp with time zone,
    constraint group_users_pk
        primary key (group_id, id)
);

alter table group_users
    owner to postgres;

create table game_players
(
    game_id        bigint            not null,
    player_id      bigint            not null
        constraint game_players_players_null_fk
            references players,
    last_join_at   timestamp with time zone,
    last_server_id uuid,
    country_code   char(4),
    playtime       integer default 0 not null,
    first_join_at  timestamp with time zone,
    ban_id         integer,
    mute_id        integer,
    constraint game_players_pk
        primary key (game_id, player_id)
);

alter table game_players
    owner to postgres;

create index game_players_game_id_playtime_index
    on game_players (game_id asc, playtime desc);

create table player_sessions
(
    id           uuid                     not null
        constraint player_sessions_pk
            primary key,
    game_id      bigint                   not null,
    player_id    bigint                   not null,
    server_id    uuid                     not null,
    join_time    timestamp with time zone not null,
    leave_time   timestamp with time zone,
    playtime     integer,
    country_code char(4)
);

alter table player_sessions
    owner to postgres;

create index player_sessions_game_id_player_id_index
    on player_sessions (game_id, player_id);

create index player_sessions_server_id_index
    on player_sessions (server_id);

create table game_servers
(
    id                uuid                      not null
        constraint game_servers_pk
            primary key,
    game_id           bigint                    not null,
    place_version     integer,
    script_version    integer,
    started_at        timestamp with time zone,
    closed_at         timestamp with time zone,
    last_heartbeat    timestamp with time zone,
    online_players    jsonb default '[]'::jsonb not null,
    private_server_id uuid
);

alter table game_servers
    owner to postgres;

create index game_servers_game_id_index
    on game_servers (game_id);

create table games
(
    id                     bigint                                       not null
        constraint games_pk
            primary key,
    name                   text                                         not null,
    owner_player_id        bigint                                       not null,
    owner_group_id         bigint,
    tracking_group_id      bigint,
    ingest_key             text,
    script_config          jsonb                    default '{}'::jsonb not null,
    features               feature[],
    discord_guild_id       bigint,
    root_place_id          bigint,
    created                timestamp with time zone default now()       not null
);

alter table games
    owner to postgres;

create table player_metrics_hot
(
    id          integer generated by default as identity
        constraint player_metrics_hot_pk
            primary key,
    game_id     bigint            not null,
    player_id   bigint            not null,
    metric      text              not null,
    year        smallint          not null,
    month       smallint          not null,
    week        smallint          not null,
    day         smallint          not null,
    day_of_year smallint          not null,
    day_of_week smallint          not null,
    hour        smallint          not null,
    value_count bigint  default 0 not null,
    value_sum   numeric default 0 not null,
    value_min   numeric default 0 not null,
    value_max   numeric default 0 not null
);

alter table player_metrics_hot
    owner to postgres;

create table group_users_log
(
    id          integer generated always as identity,
    user_id     bigint   not null,
    type        smallint not null,
    at          timestamp with time zone default now(),
    old_role_id bigint,
    new_role_id bigint
);

comment on column group_users_log.type is '0 = change role, 1 = joined, -1 = left ';

alter table group_users_log
    owner to postgres;

create table permissions
(
    sequence    integer               not null,
    scope       text                  not null,
    resource    text                  not null,
    action      text                  not null,
    name        text                  not null,
    description text                  not null,
    internal    boolean default false not null,
    constraint permissions_pk
        primary key (scope, resource, action)
);

alter table permissions
    owner to postgres;

create index permissions_sequence_index
    on permissions (sequence);

create table security_roles
(
    id          integer generated always as identity
        constraint security_roles_pk
            primary key,
    name        text                  not null,
    group_id    bigint                not null,
    permissions text[]                not null,
    internal    boolean default false not null,
    sequence    integer
);

alter table security_roles
    owner to postgres;

create table security_role_game_users
(
    user_id          bigint  not null,
    game_id          bigint  not null,
    security_role_id integer not null
        constraint security_role_game_users_security_roles_null_fk
            references security_roles,
    constraint security_role_game_users_pk
        primary key (game_id, user_id, security_role_id)
);

alter table security_role_game_users
    owner to postgres;

create index security_roles_group_id_index
    on security_roles (group_id);

create table security_role_group_users
(
    user_id          bigint  not null,
    group_id         bigint  not null,
    security_role_id integer not null
        constraint security_role_group_users_security_roles_null_fk
            references security_roles,
    constraint security_role_group_users_pk
        primary key (group_id, user_id, security_role_id)
);

alter table security_role_group_users
    owner to postgres;

create index security_role_group_users_group_id_user_id_index
    on security_role_group_users (group_id, user_id);

create table global_graph_annotations
(
    id          integer generated always as identity,
    start       timestamp with time zone        not null,
    stop        timestamp with time zone,
    title       text    default ''::text        not null,
    description text    default ''::text        not null,
    type        text    default 'unknown'::text not null,
    link        text,
    ongoing     boolean,
    display     boolean default true
);

alter table global_graph_annotations
    owner to postgres;

create table player_chat
(
    id           bigint generated always as identity
        constraint player_chat_pk
            primary key,
    game_id      bigint                   not null,
    server_id    uuid                     not null,
    player_id    bigint                   not null,
    time         timestamp with time zone not null,
    message      text                     not null,
    recipient_id bigint
);

alter table player_chat
    owner to postgres;

create index player_chat_game_id_player_id_time_index
    on player_chat (game_id asc, player_id asc, time desc);

create index player_chat_game_id_time_index
    on player_chat (game_id asc, time desc);

create index player_chat_game_id_server_id_time_index
    on player_chat (game_id asc, server_id asc, time desc);

create table moderation_actions
(
    id           integer generated always as identity
        constraint moderation_actions_pk
            primary key,
    game_id      bigint                                 not null
        constraint moderation_actions_games_null_fk
            references games,
    player_id    bigint                                 not null,
    type         moderation,
    reason       text,
    created      timestamp with time zone default now() not null,
    expires      timestamp with time zone,
    moderator_id bigint                                 not null
);

alter table moderation_actions
    owner to postgres;

create index moderation_actions_game_id_created_index
    on moderation_actions (game_id asc, created desc);

create index moderation_actions_game_id_player_id_created_index
    on moderation_actions (game_id asc, player_id asc, created desc);

create table roblox_oauth
(
    id                              integer generated always as identity
        constraint roblox_oauth_pk
            primary key,
    player_id                       bigint                   not null,
    refresh_token                   text                     not null,
    identity_token                  text                     not null,
    identity_expires_at             timestamp with time zone not null,
    access_token                    text                     not null,
    access_expires_at               timestamp with time zone not null,
    client_id                       text                     not null,
    scope_openid                    boolean default false    not null,
    scope_profile                   boolean default false    not null,
    scope_email                     boolean default false    not null,
    scope_verification              boolean default false    not null,
    scope_credentials               boolean default false    not null,
    scope_age                       boolean default false    not null,
    scope_premium                   boolean default false    not null,
    scope_roles                     boolean default false    not null,
    scope_messaging_service_publish boolean default false    not null
);

alter table roblox_oauth
    owner to postgres;

create table roblox_oauth_games
(
    oauth_id integer not null
        constraint roblox_oauth_games_roblox_oauth_null_fk
            references roblox_oauth
            on delete cascade,
    game_id  bigint  not null
);

alter table roblox_oauth_games
    owner to postgres;

create index roblox_oauth_games_game_id_index
    on roblox_oauth_games (game_id);

create index roblox_oauth_games_oauth_id_index
    on roblox_oauth_games (oauth_id);

create table remote_config
(
    game_id bigint not null
        constraint remote_config_games_null_fk
            references games
            on delete cascade,
    key     text   not null,
    value   jsonb  not null,
    constraint remote_config_pk
        primary key (game_id, key)
);

alter table remote_config
    owner to postgres;

create table roblox_cloud_keys
(
    game_id bigint not null
        constraint roblox_cloud_keys_games_null_fk
            references games,
    key     text   not null,
    constraint roblox_cloud_keys_pk
        primary key (game_id, key)
);

alter table roblox_cloud_keys
    owner to postgres;

create index roblox_cloud_keys_game_id_index
    on roblox_cloud_keys (game_id);

create table users
(
    id                bigint                not null
        constraint users_pk
            primary key,
    admin             boolean default false not null,
    credit            integer default 0     not null
);

alter table users
    owner to postgres;

create table script_errors
(
    hash               varchar(64)              not null,
    game_id            bigint                   not null,
    message            text                     not null,
    stack              text                     not null,
    script             text,
    last_occurrence    timestamp with time zone not null,
    client_occurrences integer                  not null,
    server_occurrences integer                  not null,
    resolved           boolean default false    not null,
    constraint script_errors_pk
        primary key (game_id, hash)
);

alter table script_errors
    owner to postgres;

create table game_errors
(
    id            varchar(64)                            not null,
    game_id       bigint                                 not null,
    script        text,
    message       text                                   not null,
    stack         text                                   not null,
    environment   text                                   not null,
    occurrences   integer                  default 1     not null,
    place_version integer                                not null,
    assignee_id   bigint,
    resolved      boolean                  default false not null,
    created       timestamp with time zone default now() not null,
    updated       timestamp with time zone default now() not null,
    constraint game_errors_pk
        primary key (game_id, id)
);

alter table game_errors
    owner to postgres;

create view broken_servers
            (id, game_id, place_version, script_version, started_at, closed_at, last_heartbeat, online_players,
             private_server_id) as
SELECT game_servers.id,
       game_servers.game_id,
       game_servers.place_version,
       game_servers.script_version,
       game_servers.started_at,
       game_servers.closed_at,
       game_servers.last_heartbeat,
       game_servers.online_players,
       game_servers.private_server_id
FROM game_servers
WHERE game_servers.closed_at IS NULL
  AND game_servers.last_heartbeat < (now() - '00:03:00'::interval)
ORDER BY game_servers.game_id;

alter table broken_servers
    owner to postgres;

create view broken_sessions
            (id, game_id, player_id, server_id, join_time, leave_time, playtime, country_code, last_heartbeat,
             closed_at) as
SELECT ps.id,
       ps.game_id,
       ps.player_id,
       ps.server_id,
       ps.join_time,
       ps.leave_time,
       ps.playtime,
       ps.country_code,
       gs.last_heartbeat,
       gs.closed_at
FROM player_sessions ps
         LEFT JOIN game_servers gs ON ps.server_id = gs.id
WHERE ps.leave_time IS NULL
  AND gs.closed_at IS NOT NULL;

alter table broken_sessions
    owner to postgres;

create function array_merge(a1 anyarray, a2 anyarray) returns anyarray
    strict
    language sql
as
$$
	SELECT ARRAY_AGG(x ORDER BY x)
	FROM (
		SELECT DISTINCT UNNEST($1 || $2) AS x
	) s;
$$;

alter function array_merge(anyarray, anyarray) owner to postgres;

create function array_merge(a1 anyarray) returns anyarray
    strict
    language sql
as
$$
	select distinct unnest($1)
$$;

alter function array_merge(anyarray) owner to postgres;

INSERT INTO public.security_roles (name, group_id, permissions, internal, sequence) VALUES ('Owner', 0, '{players:details:list,players:details:read,players:moderation:list,players:moderation:read,players:moderation:update,players:moderation:warn,players:moderation:kick,players:moderation:permanent_ban,players:moderation:temporary_ban,players:moderation:unban,players:moderation:permanent_mute,players:moderation:temporary_mute,players:moderation:unmute,players:reports:list,players:reports:create,players:reports:read,players:reports:update,players:reports:delete,moderation:actions:list,servers:servers:list,servers:chat:read,servers:actions:shutdown,servers:metrics:read,errors:errors:list,errors:errors:read,errors:errors:resolve,game:ingest_config:read,game:ingest_config:update,remote_config:entries:list,remote_config:entries:create,remote_config:entries:read,remote_config:entries:update,remote_config:entries:delete,datastores:datastores:list,datastores:datastores:read,datastores:datastores:create,datastores:datastores:delete,datastores:entries:create,datastores:entries:read,datastores:entries:update,datastores:entries:delete,datastores:entries:list,api:keys:list,api:keys:create,api:keys:delete,security:users:list,security:users:create,security:users:read,security:users:update,security:users:delete,security:roles:list,security:permissions:list,players:sessions:list,servers:sessions:list,errors:errors:update,errors:errors:delete}', true, 2500);
INSERT INTO public.security_roles (name, group_id, permissions, internal, sequence) VALUES ('Administrator', 0, '{players:details:list,players:details:read,players:moderation:list,players:moderation:read,players:moderation:update,players:moderation:warn,players:moderation:kick,players:moderation:permanent_ban,players:moderation:temporary_ban,players:moderation:unban,players:moderation:permanent_mute,players:moderation:temporary_mute,players:moderation:unmute,players:reports:list,players:reports:create,players:reports:read,players:reports:update,players:reports:delete,moderation:actions:list,servers:servers:list,servers:chat:read,servers:actions:shutdown,servers:metrics:read,errors:errors:list,errors:errors:read,errors:errors:resolve,game:ingest_config:read,game:ingest_config:update,remote_config:entries:list,remote_config:entries:create,remote_config:entries:read,remote_config:entries:update,remote_config:entries:delete,datastores:datastores:list,datastores:datastores:read,datastores:datastores:create,datastores:datastores:delete,datastores:entries:create,datastores:entries:read,datastores:entries:update,datastores:entries:delete,datastores:entries:list,api:keys:list,api:keys:create,api:keys:delete,security:users:list,security:users:create,security:users:read,security:users:update,security:users:delete,security:roles:list,security:permissions:list,players:sessions:list,servers:sessions:list,errors:errors:update,errors:errors:delete}', false, 2400);
INSERT INTO public.security_roles (name, group_id, permissions, internal, sequence) VALUES ('Reserved', 0, array[]::text[], true, 2200);
INSERT INTO public.security_roles (name, group_id, permissions, internal, sequence) VALUES ('Reserved', 0, array[]::text[], true, 2300);
INSERT INTO public.security_roles (name, group_id, permissions, internal, sequence) VALUES ('Reserved', 0, array[]::text[], true, 2000);
INSERT INTO public.security_roles (name, group_id, permissions, internal, sequence) VALUES ('Reserved', 0, array[]::text[], true, 1900);
INSERT INTO public.security_roles (name, group_id, permissions, internal, sequence) VALUES ('Reserved', 0, array[]::text[], true, 1800);
INSERT INTO public.security_roles (name, group_id, permissions, internal, sequence) VALUES ('Reserved', 0, array[]::text[], true, 1700);
INSERT INTO public.security_roles (name, group_id, permissions, internal, sequence) VALUES ('Developer', 0, array[]::text[], false, 1600);
INSERT INTO public.security_roles (name, group_id, permissions, internal, sequence) VALUES ('Reserved', 0, array[]::text[], true, 1500);
INSERT INTO public.security_roles (name, group_id, permissions, internal, sequence) VALUES ('Reserved', 0, array[]::text[], true, 1400);
INSERT INTO public.security_roles (name, group_id, permissions, internal, sequence) VALUES ('Reserved', 0, array[]::text[], true, 1300);
INSERT INTO public.security_roles (name, group_id, permissions, internal, sequence) VALUES ('Reserved', 0, array[]::text[], true, 1200);
INSERT INTO public.security_roles (name, group_id, permissions, internal, sequence) VALUES ('Moderator', 0, array[]::text[], false, 1100);
INSERT INTO public.security_roles (name, group_id, permissions, internal, sequence) VALUES ('Reserved', 0, array[]::text[], true, 1000);
INSERT INTO public.security_roles (name, group_id, permissions, internal, sequence) VALUES ('Reserved', 0, array[]::text[], true, 900);
INSERT INTO public.security_roles (name, group_id, permissions, internal, sequence) VALUES ('Reserved', 0, array[]::text[], true, 800);
INSERT INTO public.security_roles (name, group_id, permissions, internal, sequence) VALUES ('Reserved', 0, array[]::text[], true, 700);
INSERT INTO public.security_roles (name, group_id, permissions, internal, sequence) VALUES ('Support', 0, array[]::text[], false, 600);
INSERT INTO public.security_roles (name, group_id, permissions, internal, sequence) VALUES ('Reserved', 0, array[]::text[], true, 500);
INSERT INTO public.security_roles (name, group_id, permissions, internal, sequence) VALUES ('Reserved', 0, array[]::text[], true, 400);
INSERT INTO public.security_roles (name, group_id, permissions, internal, sequence) VALUES ('Reserved', 0, array[]::text[], true, 300);
INSERT INTO public.security_roles (name, group_id, permissions, internal, sequence) VALUES ('Reserved', 0, array[]::text[], true, 200);
INSERT INTO public.security_roles (name, group_id, permissions, internal, sequence) VALUES ('View', 0, array[]::text[], true, 100);
