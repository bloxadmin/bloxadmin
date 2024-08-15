ALTER TYPE feature
add value 'actions';

create table public.game_actions
(
    id              uuid                     default gen_random_uuid() not null
        constraint game_actions_pk
            primary key,
    game_id         bigint                                             not null,
    name            text                                               not null,
    description     text                     default ''::text          not null,
    active          boolean                  default true              not null,
    parameters      jsonb                                              not null,
    created         timestamp with time zone default now()             not null,
    first_server_id uuid                                               not null
);

alter table public.game_actions
    owner to postgres;

create index game_actions_game_id_name_index
    on public.game_actions (game_id, name);

create table public.game_action_executions
(
    id         uuid                     default gen_random_uuid() not null
        constraint game_action_executions_pk
            primary key,
    game_id    bigint                                             not null,
    action_id  uuid                                               not null
        constraint game_action_executions_game_actions_id_fk
            references public.game_actions
            on delete cascade,
    status     text                     default 'pending'::text   not null,
    created    timestamp with time zone default now(),
    started    timestamp with time zone,
    finished   timestamp with time zone,
    parameters jsonb,
    server_id  uuid,
    output     text,
    error      text,
    action     text                                               not null
);

alter table public.game_action_executions
    owner to postgres;

create index game_action_executions_game_id_action_id_index
    on public.game_action_executions (game_id, action_id);

create index game_action_executions_game_id_action_index
    on public.game_action_executions (game_id, action);

create table public.game_action_servers
(
    game_id   bigint not null
        constraint game_action_servers_games_id_fk
            references public.games
            on delete cascade,
    action_id uuid   not null
        constraint game_action_servers_game_actions_id_fk
            references public.game_actions
            on delete cascade,
    server_id uuid   not null,
    constraint game_action_servers_pk
        unique (game_id, action_id, server_id)
);

alter table public.game_action_servers
    owner to postgres;

create index game_action_servers_game_id_action_id_index
    on public.game_action_servers (game_id, action_id);

create index game_action_servers_game_id_server_id_index
    on public.game_action_servers (game_id, server_id);
