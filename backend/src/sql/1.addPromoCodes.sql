create table promo_codes
(
    game_id    bigint                                             not null
        constraint promo_codes_games_id_fk
            references games,
    code       text                                               not null,
    attributes jsonb                    default '{}'::jsonb       not null,
    uses       integer,
    used       bigint                   default 0                 not null,
    active     boolean                  default true              not null,
    created    timestamp with time zone default CURRENT_TIMESTAMP not null,
    starts     timestamp with time zone,
    expires    timestamp with time zone,
    constraint promo_codes_pk
        primary key (game_id, code)
);

create table promo_code_uses
(
    game_id   bigint                                             not null
        constraint promo_codes_use_games_id_fk
            references games,
    code      text                                               not null,
    player_id integer                                            not null,
    server_id uuid                                               not null,
    used      timestamp with time zone default CURRENT_TIMESTAMP not null,
    constraint promo_code_uses_pk
        primary key (game_id, code, player_id)
            on delete cascade,
    constraint promo_codes_use_promo_codes_game_id_code_fk
        foreign key (game_id, code) references promo_codes
            on delete cascade
);
