import { getAllGamesForUser } from "../../services/games.ts";
import { AvatarHeadshotSize, getRobloxPlayer, userHeadshots } from "../../services/roblox.ts";
import { userHasPermissionsForGame } from "../../services/security.ts";
import { embed, errorMessage, message } from "../helpers.ts";
import interactionRouter from "../interactionRouter.ts";
import { ButtonStyle, ComponentType, Message } from "../types.ts";

const PLAYER_AVATAR_SIZE: AvatarHeadshotSize = 352;

interactionRouter.on<{
  player: string;
}>({
  name: "player",
  async handle(context) {
    const playerId = Number(context.options.player);

    if (!playerId)
      return errorMessage("Invalid Player", "You must provide a player to lookup.");

    const robloxPlayer = await getRobloxPlayer(playerId);
    const avatar = await userHeadshots.getThumbnail(playerId, { size: PLAYER_AVATAR_SIZE })

    if (!robloxPlayer)
      return errorMessage("Invalid Player", "The player you provided does not exist.");

    const avatarUrl = avatar?.[0];

    const msg: Partial<Message> = {
      embeds: [
        embed({
          thumbnail: avatarUrl ? {
            url: avatarUrl,
            height: PLAYER_AVATAR_SIZE,
            width: PLAYER_AVATAR_SIZE,
          } : undefined,
          title: robloxPlayer.name,
          description: robloxPlayer.description,
          fields: [
            {
              name: "Roblox ID",
              value: robloxPlayer.id.toString(),
              inline: true,
            },
            {
              name: "Name",
              value: robloxPlayer.name,
              inline: true,
            },
          ],
        }),
      ],
      components: [{
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.Button,
            style: ButtonStyle.Link,
            label: "View on Roblox",
            url: `https://www.roblox.com/users/${playerId}/profile`,
          }
        ]
      }],
    };

    // const user = context.user;

    // if (user) {
    //   // const player = getPlayer(playerId);
    //   const games = user.admin ? [] : await getAllGamesForUser(user.id);
    //   const canBan = user.admin || games.some((game) => userHasPermissionsForGame(user, game, [GamePermission.ModerationPermanentBan, GamePermission.ModerationTemporaryBan], true));

    //   if (canBan)
    //     msg.components?.[0]?.components.unshift({
    //       type: ComponentType.Button,
    //       style: ButtonStyle.Danger,
    //       label: "Ban on Roblox",
    //       custom_id: `ban:${playerId}`,
    //     })
    // }

    return message(msg)
  }
});
