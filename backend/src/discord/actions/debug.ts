import { embed, message } from "../helpers.ts";
import interactionRouter, { DiscordInteractionContext } from "../interactionRouter.ts";
import { ApplicationInteractionResponse, InteractionType, MessageFlag } from "../types.ts";

function handleDebugWhoamiInteraction(context: DiscordInteractionContext): ApplicationInteractionResponse {
  return message({
    flags: MessageFlag.Ephemeral,
    embeds: [embed({
      title: "Who Am I?",
      description: '```json\n' + JSON.stringify(context.user, null, 2) + '\n```',
    })]
  })
}
function handleDebugGamesInteraction(context: DiscordInteractionContext): ApplicationInteractionResponse {
  const games = context.games;

  if (!games)
    return context.error("No games", "This user/guild has no associated games.");

  return message({
    flags: MessageFlag.Ephemeral,
    embeds: [embed({
      title: "Games",
      description: '```json\n' + JSON.stringify(games, null, 2) + '\n```',
    })]
  })
}

interactionRouter.on({
  name: "debug",
  requireUser: true,
  async handle(context) {
    if (context.interaction.type !== InteractionType.ApplicationCommand)
      return context.error("Invalid Interaction", "This command can only be used as a slash command.");

    const subcommand = context.interaction.data.options?.[0].name;

    if (!subcommand)
      return context.error("Invalid Subcommand", "You must provide a subcommand.");

    if (subcommand === "whoami")
      return await handleDebugWhoamiInteraction(context);
    if (subcommand === "games")
      return await handleDebugGamesInteraction(context);


    return context.error("Invalid Subcommand", "You must provide a valid subcommand.");
  }
})
