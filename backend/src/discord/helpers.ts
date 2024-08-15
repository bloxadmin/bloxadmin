import { Game, getAllGamesForUser, getGamesFromDiscordId } from "../services/games.ts";
import { User, getUserFromDiscordId } from "../services/users.ts";
import { ApplicationInteractionResponse, ComponentType, Embed, Interaction, InteractionCallbackType, Message, MessageFlag, TextInputComponent } from "./types.ts";

export function message(data: Partial<Message>): ApplicationInteractionResponse {
  return {
    type: InteractionCallbackType.ChannelMessageWithSource,
    data,
  }
}

export function embed(embed: Embed): Embed {
  return {
    author: {
      name: "bloxadmin",
      icon_url: "https://cdn.discordapp.com/avatars/875146449267081256/cdff7432cee474892ed53e2b18c334a8.webp?size=96",
      url: "https://bloxadmin.com"
    },
    color: 0xef4444,
    ...embed
  }
}

export function errorMessage(title: string, description: string): ApplicationInteractionResponse {
  return message({
    flags: MessageFlag.Ephemeral,
    embeds: [
      embed({
        title,
        description,
        color: 0xFF0000,
      })
    ]
  });
}

export function modal(title: string, id: string, components: TextInputComponent[]): ApplicationInteractionResponse {
  return {
    type: InteractionCallbackType.Modal,
    data: {
      custom_id: id,
      title,
      components: components.map((component) => ({
        type: ComponentType.ActionRow,
        components: [component]
      })),
    }
  }
}

export function getUserFromInteraction(interaction: Interaction): Promise<User | null> {
  const discordUserId = interaction.member?.user.id || interaction.user?.id;

  if (!discordUserId) {
    return Promise.resolve(null);
  }

  return getUserFromDiscordId(discordUserId);
}

export async function getGameFromInteraction(interaction: Interaction, user: User | null): Promise<Game[]> {
  if (!interaction.guild_id) {
    if (!user) {
      return [];
    }

    return await getAllGamesForUser(user?.id);
  }

  return await getGamesFromDiscordId(interaction.guild_id);
}
