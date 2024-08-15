import { getGamePlayer } from "../../services/gamePlayers.ts";
import { ModerationEventData, addModerationEvent } from "../../services/moderation.ts";
import { AvatarHeadshotSize } from "../../services/roblox.ts";
import { EventType, buildServerEvent } from "../../services/serverEvents.ts";
import { getOnlinePlayerServer } from "../../services/servers.ts";
import publish from "../../services/publish.ts";
import interactionRouter from "../interactionRouter.ts";
import { MessageFlag } from "../types.ts";
import { Permissions, userHasPermissionsForGame } from "../../services/security.ts";
import postgres from "../../util/postgres.ts";

const PLAYER_AVATAR_SIZE: AvatarHeadshotSize = 352;

interactionRouter.on<{
  player: string,
  reason?: string,
}>({
  name: "kick",
  requireGame: true,
  requireUser: true,
  async handle(context) {
    const user = context.user!;
    const games = context.games;
    const playerId = Number(context.options.player);
    const reason = context.options.reason;

    if (!playerId)
      return context.error("Invalid Player", "You must provide a player to kick.");

    console.log("Checking if player", playerId, "is online");

    const server = await getOnlinePlayerServer(postgres`ANY(${(games.map((g) => g.id.toString()))})`, playerId);

    if (!server)
      return context.error("Invalid Player", "That player is not online");

    console.log(server);

    const game = games?.find((game) => game.id === server.gameId);

    if (!game)
      return context.error("Internal error", "Unable to check for permissions");
    console.log("Kicking player", playerId, "from game", game.id);

    const hasPermission = await userHasPermissionsForGame(game.id, user.id, [Permissions.Players.Moderation.Kick]);

    if (!hasPermission)
      return context.error("Invalid Permissions", "You do not have permission to kick players in this game");

    const event: ModerationEventData = {
      type: "kick",
      reason: reason,
      expiresAt: null,
      moderator: {
        name: user.name,
        robloxId: Number(user.id),
      },
    }

    const message = JSON.stringify(buildServerEvent(server.id, EventType.Moderation, [
      "Kick",
      playerId,
      null,
      reason || null,
      null,
    ]));

    await publish(game.id, message);

    const player = await getGamePlayer(game.id, playerId);

    await addModerationEvent(game.id, playerId, event);

    const playerName = player?.name || "*Unknown*";

    return context.message({
      flags: MessageFlag.Ephemeral,
      embeds: [context.embed({
        title: "Player Kicked",
        description: `Player **[${playerName}](https://bloxadmin.com/games/${game.id}/players/${playerId})** will be kicked from the server shortly.`,
        thumbnail: {
          url: `https://api.bloxadmin.com/roblox/avatar/${playerId}?size=${PLAYER_AVATAR_SIZE}`,
        },
        fields: [
          {
            name: "Reason",
            value: reason || "No reason provided",
          },
          {
            name: "Game",
            value: `[${game.name}](https://bloxadmin.com/games/${game.id})`,
          },
          {
            name: "Server",
            value: `[${server.id}](https://bloxadmin.com/games/${game.id}/servers/${server.id})`,
          }
        ]
      })]
    })
  }
});
