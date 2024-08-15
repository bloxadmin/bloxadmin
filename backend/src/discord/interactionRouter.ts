import { Game } from "../services/games.ts";
import { searchPlayers } from "../services/roblox.ts";
import { User } from "../services/users.ts";
import { getGameFromInteraction, getUserFromInteraction } from "./helpers.ts";
import {
  ApplicationCommandInteraction,
  ApplicationCommandOptionType,
  ApplicationInteractionResponse,
  ApplicationMessageComponentInteraction,
  AutocompleteChoice,
  ButtonStyle,
  ComponentType,
  Embed,
  Interaction,
  InteractionCallbackType,
  InteractionType,
  Message,
  MessageFlag,
  ModalSubmitInteraction,
  PingInteraction,
  TextInputComponent,
} from "./types.ts";

export type RoutedInteraction = Exclude<Interaction, PingInteraction>;

export class DiscordInteractionContext<Options extends Record<string, unknown> = Record<string, unknown>, I extends RoutedInteraction = RoutedInteraction> {
  constructor(
    public readonly interaction: I,
    public readonly params: string[],
    public readonly user: User | null,
    public readonly games: Game[] = [],
  ) {
  }

  get options(): Options {
    if (this.interaction.type !== InteractionType.ApplicationCommand)
      throw new Error("Cannot get options from non-application command interaction");

    return this.interaction.data.options?.reduce((options, option) => {
      options[option.name as keyof Options] = option.value as Options[keyof Options];
      return options;
    }, {} as Options) ?? {} as Options;
  }

  option<T extends keyof Options>(name: T): Options[T] {
    return this.options[name];
  }

  modalComponent(name: string): TextInputComponent | undefined {
    if (this.interaction.type !== InteractionType.ModalSubmit)
      throw new Error("Cannot get modal component from non-modal submit interaction");

    return this.interaction.data.components[0].components
      .find((component) => (
        component.type === ComponentType.TextInput && component.custom_id === name
      )) as TextInputComponent | undefined;
  }

  byType(handlers: {
    [InteractionType.ApplicationCommandAutocomplete]?: InteractionHandlerFunction<Options, ApplicationCommandInteraction>;
    [InteractionType.ApplicationCommand]?: InteractionHandlerFunction<Options, ApplicationCommandInteraction>;
    [InteractionType.MessageComponent]?: InteractionHandlerFunction<Options, ApplicationMessageComponentInteraction>;
    [InteractionType.ModalSubmit]?: InteractionHandlerFunction<Options, ModalSubmitInteraction>;
  }): Promise<ApplicationInteractionResponse> | ApplicationInteractionResponse {
    const handler = handlers[this.interaction.type];

    // deno-lint-ignore no-explicit-any
    return (handler || (() => this.error("Invalid Interaction", "This interaction is not supported.")))(this as any);
  }

  message(data: Partial<Message>): ApplicationInteractionResponse {
    return {
      type: InteractionCallbackType.ChannelMessageWithSource,
      data,
    }
  }

  embed(embed: Embed): Embed {
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

  error(title: string, description: string): ApplicationInteractionResponse {
    return this.message({
      flags: MessageFlag.Ephemeral,
      embeds: [
        this.embed({
          title,
          description,
          color: 0xFF0000,
        })
      ]
    });
  }

  modal(title: string, id: string, components: TextInputComponent[]): ApplicationInteractionResponse {
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
}

export type InteractionHandlerFunction<Options extends Record<string, unknown>, I extends RoutedInteraction> = (context: DiscordInteractionContext<Options, I>) => Promise<ApplicationInteractionResponse> | ApplicationInteractionResponse;

export type InteractionHandler<Options extends Record<string, unknown>, I extends RoutedInteraction> = {
  name: string;
  handle: InteractionHandlerFunction<Options, I>;
  requireGame?: boolean;
  requireUser?: boolean;
};

export const Responses: Record<string, ApplicationInteractionResponse> = {
  CommandNotImplemented: {
    type: InteractionCallbackType.ChannelMessageWithSource,
    data: {
      flags: MessageFlag.Ephemeral,
      embeds: [
        {
          title: "Internal Error",
          description: "Command not implemented",
          color: 0xFF0000,
        }
      ]
    }
  },
  InternalError: {
    type: InteractionCallbackType.ChannelMessageWithSource,
    data: {
      flags: MessageFlag.Ephemeral,
      embeds: [
        {
          title: "Internal Error",
          description: "Something went wrong. Please try again later.",
          color: 0xFF0000,
        }
      ]
    }
  },
  ButtonNotImplemented: {
    type: InteractionCallbackType.ChannelMessageWithSource,
    data: {
      flags: MessageFlag.Ephemeral,
      embeds: [
        {
          title: "Internal Error",
          description: "Button not implemented",
          color: 0xFF0000,
        }
      ]
    }
  },
  UserNotLinked: {
    type: InteractionCallbackType.ChannelMessageWithSource,
    data: {
      flags: MessageFlag.Ephemeral,
      embeds: [
        {
          title: "User not linked",
          description: "You must link your **bloxadmin** account to use this command",
          color: 0xFF0000,
        }
      ],
      components: [
        {
          type: ComponentType.ActionRow,
          components: [
            {
              type: ComponentType.Button,
              label: "Link Account",
              style: ButtonStyle.Link,
              url: "https://bloxadmin.com/discord-verify",
            },
          ],
        }
      ]
    },
  },
  GameNotLinked: {
    type: InteractionCallbackType.ChannelMessageWithSource,
    data: {
      flags: MessageFlag.Ephemeral,
      embeds: [
        {
          title: "Game not linked",
          description: "You must link this server to a game to use this command",
          color: 0xFF0000,
        },
      ],
      components: [
        {
          type: ComponentType.ActionRow,
          components: [
            {
              type: ComponentType.Button,
              label: "Link Game",
              style: ButtonStyle.Link,
              url: "https://bloxadmin.com/sign-in",
            },
          ],
        }
      ]
    }
  }
}

export class InteractionRouter {
  // deno-lint-ignore no-explicit-any
  private handlers: Map<string, InteractionHandler<any, RoutedInteraction>> = new Map();

  public on<Options extends Record<string, unknown> = Record<string, unknown>>(handler: InteractionHandler<Options, RoutedInteraction>) {
    this.handlers.set(handler.name, handler);
  }

  public handle(interaction: Interaction): Promise<ApplicationInteractionResponse> | ApplicationInteractionResponse {
    switch (interaction.type) {
      case InteractionType.ApplicationCommand:
        return this.handleCommand(interaction);
      case InteractionType.ApplicationCommandAutocomplete:
        return this.handleAutocomplete(interaction);
      case InteractionType.MessageComponent:
        return this.handleMessageComponent(interaction);
      case InteractionType.ModalSubmit:
        return this.handleModalSubmit(interaction);
      case InteractionType.Ping:
        return {
          type: InteractionCallbackType.Pong,
        }
    }
  }

  private async handleCommand(interaction: ApplicationCommandInteraction) {
    const handler = this.handlers.get(interaction.data.name);

    if (!handler) {
      return Responses.CommandNotImplemented;
    }

    const user = await getUserFromInteraction(interaction);

    if (handler.requireUser && !user) {
      return Responses.UserNotLinked;
    }

    const games = await getGameFromInteraction(interaction, user);

    if (handler.requireGame && !games?.length) {
      return Responses.GameNotLinked;
    }

    const context = new DiscordInteractionContext(interaction, [], user, games);

    try {
      return await handler.handle(context);
    } catch (e) {
      console.error(e);
      return Responses.InternalError;
    }
  }

  private async handleMessageComponent(interaction: ApplicationMessageComponentInteraction) {
    const [name, ...params] = interaction.data.custom_id.split(":");
    const handler = this.handlers.get(name);

    if (!handler) {
      return Responses.ButtonNotImplemented;
    }

    const user = await getUserFromInteraction(interaction);

    if (handler.requireUser && !user) {
      return Responses.UserNotLinked;
    }

    const games = await getGameFromInteraction(interaction, user);

    if (handler.requireGame && !games?.length) {
      return Responses.GameNotLinked;
    }

    const context = new DiscordInteractionContext(interaction, params, user, games);

    return handler.handle(context);
  }

  private async handleModalSubmit(interaction: ModalSubmitInteraction) {
    const [name, ...params] = interaction.data.custom_id.split(":");
    const handler = this.handlers.get(name);

    if (!handler) {
      return Responses.ButtonNotImplemented;
    }

    const user = await getUserFromInteraction(interaction);

    if (handler.requireUser && !user) {
      return Responses.UserNotLinked;
    }

    const games = await getGameFromInteraction(interaction, user);

    if (handler.requireGame && !games?.length) {
      return Responses.GameNotLinked;
    }

    const context = new DiscordInteractionContext(interaction, params, user, games);

    return handler.handle(context);
  }

  private async handleAutocomplete(interaction: ApplicationCommandInteraction): Promise<ApplicationInteractionResponse> {
    const choices: AutocompleteChoice[] = [];


    const playerOption = interaction.data.options?.find((option) => option.name === "player");
    if (playerOption && playerOption.value) {
      // const user = await getUserFromInteraction(interaction);

      // if (user && interaction.data.name === "kick") {
      //   const admin = userHasPermission(user.permissions, [GlobalPermission.Administrator]);
      //   const games = admin ? [] : await getAllGamesForUser(user.robloxId);
      //   const serverPlayers = await searchOnlinePlayers(playerOption.value as string, admin ? undefined : games.map((game) => game.robloxId));

      //   serverPlayers.forEach(({ player }) => {
      //     choices.push({
      //       name: `${player.name} (${player.id}) - Online`,
      //       value: playerOption.type === ApplicationCommandOptionType.String ? player.id.toString() : player.id,
      //     });
      //   });
      // } else {
      const players = await searchPlayers(playerOption.value as string);

      players.forEach((player) => {
        choices.push({
          name: `${player.name} (${player.id})`,
          value: playerOption.type === ApplicationCommandOptionType.String ? player.id.toString() : player.id,
        });
      });
      // }
    }


    return {
      type: InteractionCallbackType.ApplicationCommandAutocompleteResult,
      data: { choices }
    }
  }
}

const interactionRouter = new InteractionRouter();

export default interactionRouter;
