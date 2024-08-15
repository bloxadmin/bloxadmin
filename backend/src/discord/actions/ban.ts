// import { getRobloxPlayer } from "../../services/roblox.ts";
import interactionRouter from "../interactionRouter.ts";
// import { ComponentType, InteractionType, MessageFlag, TextInputStyle } from "../types.ts";

interactionRouter.on({
  name: "ban",
  requireUser: true,
  requireGame: true,
  handle(context) {
    // const user = context.user!;
    // const games = context.games;
    const [playerId] = context.params;

    if (!playerId)
      return context.error("Invalid Player", "You must provide a player to ban.");

    // if (!games.some((game) => userHasPermissionForGame(user, game, [
    //   GamePermission.ModerationPermanentBan, GamePermission.ModerationTemporaryBan
    // ], true)))
      return context.error("Invalid Permissions", "You do not have permission to ban players in this game");

    // return context.byType({
    //   async [InteractionType.MessageComponent]() {
    //     const player = await getRobloxPlayer(playerId);

    //     if (!player)
    //       return context.error("Invalid Player", "That player does not exist.");

    //     return context.modal(`Ban ${player.name}`, `ban:${playerId}`, [
    //       {
    //         type: ComponentType.TextInput,
    //         custom_id: "reason",
    //         placeholder: "Reason",
    //         label: "Reason",
    //         style: TextInputStyle.Parahraph,
    //         required: false,
    //       },
    //       {
    //         type: ComponentType.TextInput,
    //         custom_id: "length",
    //         placeholder: "1d, 1w, 1mo, 1y, 3h, 5m",
    //         label: "Length - Leave blank for permanent",
    //         style: TextInputStyle.Short,
    //         required: false,
    //       },
    //     ])
    //   },

    //   [InteractionType.ModalSubmit]() {
    //     const reason = context.modalComponent("reason")?.value;
    //     const length = context.modalComponent("length")?.value;

    //     return context.message({
    //       content: reason ? `Banned ${playerId} for ${reason}` : `Banned ${playerId}`,
    //       flags: MessageFlag.Ephemeral,
    //     });
    //   }
    // })
  }
})
