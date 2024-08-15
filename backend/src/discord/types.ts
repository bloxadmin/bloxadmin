export type DiscordLocale = string;

export enum ChannelType {
  GuildText = 0,
  DM = 1,
  GuildVoice = 2,
  GroupDM = 3,
  GuildCategory = 4,
  GuildAnnouncement = 5,
  AnnouncementThread = 10,
  PublicThread = 11,
  PrivateThread = 12,
  GuildStageVoice = 13,
  GuildDirectory = 14,
  GuildForum = 15,
}

export interface EmbedMediaSource {
  url: string;
  proxy_url?: string;
  height?: number;
  width?: number;
}

export interface Embed {
  title?: string;
  type?: "rich" | "image" | "video" | "gifv" | "article" | "link";
  description?: string;
  url?: string;
  timestamp?: string;
  color?: number;
  footer?: {
    text?: string;
    icon_url?: string;
    proxy_icon_url?: string;
  };
  image?: EmbedMediaSource;
  thumbnail?: EmbedMediaSource;
  video?: EmbedMediaSource;
  provider?: {
    name?: string;
    url?: string;
  }
  author?: {
    name?: string;
    url?: string;
    icon_url?: string;
    proxy_icon_url?: string;
  }
  fields?: {
    name: string;
    value: string;
    inline?: boolean;
  }[]
}

export interface AllowedMentions {
  parse?: ("roles" | "users" | "everyone")[];
  roles?: string[];
  users?: string[];
  replied_user?: boolean;
}

export interface Attachment {
  id: string;
  filename: string;
  content_type?: string;
  description?: string;
  size: number;
  url: string;
  proxy_url: string;
  height?: number;
  width?: number;
  ephemeral?: boolean;
}

export enum MessageType {
  Default = 0,
  RecipientAdd = 1,
  RecipientRemove = 2,
  Call = 3,
  ChannelNameChange = 4,
  ChannelIconChange = 5,
  ChannelPinnedMessage = 6,
  UserJoin = 7,
  GuildBoost = 8,
  GuildBoostTier1 = 9,
  GuildBoostTier2 = 10,
  GuildBoostTier3 = 11,
  ChannelFollowAdd = 12,
  GuildDiscoveryDisqualified = 14,
  GuildDiscoveryRequalified = 15,
  GuildDiscoveryGracePeriodInitialWarning = 16,
  GuildDiscoveryGracePeriodFinalWarning = 17,
  ThreadCreated = 18,
  Reply = 19,
  ChatInputCommand = 20,
  ThreadStarterMessage = 21,
  GuildInviteReminder = 22,
  ContextMenuCommand = 23,
  AutoModeratorAction = 24,
  RoleSubscriptionPurchase = 25,
  InteractionPremiumUpsell = 26,
  GuildApplicationPremiumSubscription = 32,
}

export enum MessageFlag {
  Crossposted = 1 << 0,
  IsCrosspost = 1 << 1,
  SuppressEmbeds = 1 << 2,
  SourceMessageDeleted = 1 << 3,
  Urgent = 1 << 4,
  HasThread = 1 << 5,
  Ephemeral = 1 << 6,
  Loading = 1 << 7,
  FailedToMentionSomeRoles = 1 << 8,
  SuppressNotifications = 1 << 12,
}

export interface Message {
  id: string;
  channel_id: string;
  author: unknown;
  content?: string;
  timestamp: string;
  edited_timestamp?: string;
  tts?: boolean;
  mention_everyone?: boolean;
  mentions?: unknown[];
  mention_roles?: unknown[];
  mention_channels?: unknown[];
  attachments?: Attachment[];
  embeds?: Embed[];
  reactions?: unknown[];
  nonce?: string | number;
  pinned?: boolean;
  webhook_id?: string;
  type: MessageType;
  activity?: unknown;
  application?: unknown;
  application_id?: string;
  message_reference?: unknown;
  flags?: number;
  referenced_message?: Message;
  interaction?: {
    id: string;
    type: InteractionType;
    name: string;
    user: User;
    member: Member;
  };
  thread?: unknown;
  components?: ActionRowComponent[];
  sticker_items?: unknown[];
  position?: number;
  role_subscription_date: unknown;
}

export interface User {
  id: string;
  username: string;
  discriminator: string;
  avatar?: string;
  bot?: boolean;
  email?: string;
}

export interface Member {
  user: User;
  nick?: string;
  avatar?: string;
}

export enum ComponentType {
  ActionRow = 1,
  Button = 2,
  StringSelect = 3,
  TextInput = 4,
  UserSelect = 5,
  RoleSelect = 6,
  MentionableSelect = 7,
  ChannelSelect = 8,
}

export enum ButtonStyle {
  Primary = 1,
  Secondary = 2,
  Success = 3,
  Danger = 4,
  Link = 5,
}

export enum TextInputStyle {
  Short = 1,
  Parahraph = 2,
}

export interface ActionRowComponent {
  type: ComponentType.ActionRow;
  components: ComponentNoActionRow[];
}

export interface ButtonComponentBase {
  label?: string;
  emoji?: {
    id: string;
    name: string;
    animated?: boolean;
  };
  disabled?: boolean;
}

export interface ButtonInteractionComponent extends ButtonComponentBase {
  type: ComponentType.Button;
  style: ButtonStyle.Primary | ButtonStyle.Secondary | ButtonStyle.Success | ButtonStyle.Danger;
  custom_id: string;
}

export interface ButtonLinkComponent extends ButtonComponentBase {
  type: ComponentType.Button;
  style: ButtonStyle.Link;
  url: string;
  label?: string;
  emoji?: {
    id: string;
    name: string;
    animated?: boolean;
  };
  disabled?: boolean;
}

export type ButtonComponent = ButtonInteractionComponent | ButtonLinkComponent;

export interface SelectMenuComponent {
  custom_id: string;
  placeholder?: string;
  min_values?: number;
  max_values?: number;
  disabled?: boolean;
}

export interface SelectOption {
  label: string;
  value: string;
  description?: string;
  emoji?: {
    id: string;
    name: string;
    animated?: boolean;
  };
  default?: boolean;
}

export interface StringSelectComponent extends SelectMenuComponent {
  type: ComponentType.StringSelect;
  options: SelectOption[];
}

export interface UserSelectComponent extends SelectMenuComponent {
  type: ComponentType.UserSelect;
  options?: SelectOption[];
}

export interface RoleSelectComponent extends SelectMenuComponent {
  type: ComponentType.RoleSelect;
  options?: SelectOption[];
}

export interface MentionableSelectComponent extends SelectMenuComponent {
  type: ComponentType.MentionableSelect;
  options?: SelectOption[];
}

export interface ChannelSelectComponent extends SelectMenuComponent {
  type: ComponentType.ChannelSelect;
  channel_types?: ChannelType[];
  options?: SelectOption[];
}

export interface TextInputComponent {
  type: ComponentType.TextInput;
  custom_id: string;
  style: TextInputStyle;
  label: string;
  min_length?: number;
  max_length?: number;
  required?: boolean;
  value?: string;
  placeholder?: string;
}

export type ComponentNoActionRow =
  | ButtonComponent
  | StringSelectComponent
  | TextInputComponent
  | UserSelectComponent
  | RoleSelectComponent
  | MentionableSelectComponent
  | ChannelSelectComponent;
export type Component = ActionRowComponent | ComponentNoActionRow;

export enum ApplicationCommandType {
  ChatInput = 1,
  User = 2,
  Message = 3,
}

export enum ApplicationCommandOptionType {
  SubCommand = 1,
  SubCommandGroup = 2,
  String = 3,
  Integer = 4,
  Boolean = 5,
  User = 6,
  Channel = 7,
  Role = 8,
  Mentionable = 9,
  Number = 10,
  Attachment = 11,
}

export interface ApplicationCommandOptionBase {
  name: string;
  value?: string | number | boolean;
  focused?: boolean;
}

export interface ApplicationCommandOptionGroup extends ApplicationCommandOptionBase {
  type: ApplicationCommandOptionType.SubCommandGroup;
  options?: ApplicationCommandOption[];
}

export interface ApplicationCommandOptionValue extends ApplicationCommandOptionBase {
  type:
  | ApplicationCommandOptionType.String
  | ApplicationCommandOptionType.Integer
  | ApplicationCommandOptionType.Boolean
  | ApplicationCommandOptionType.User
  | ApplicationCommandOptionType.Channel
  | ApplicationCommandOptionType.Role
  | ApplicationCommandOptionType.Mentionable
  | ApplicationCommandOptionType.Number
  | ApplicationCommandOptionType.Attachment;
}

export type ApplicationCommandOption = ApplicationCommandOptionGroup | ApplicationCommandOptionValue;

export enum InteractionType {
  Ping = 1,
  ApplicationCommand = 2,
  MessageComponent = 3,
  ApplicationCommandAutocomplete = 4,
  ModalSubmit = 5,
}

export interface InteractionBase {
  id: string;
  application_id: string;
  type: InteractionType;
  guild_id?: string;
  channel_id?: string;
  member?: Member;
  user?: User;
  token: string;
  version: number;
  message?: Message;
  app_permissions?: string;
  locale: DiscordLocale;
  guild_locale?: DiscordLocale;
}

export interface PingInteraction extends InteractionBase {
  type: InteractionType.Ping;
}

export interface ApplicationCommandInteraction extends InteractionBase {
  type: InteractionType.ApplicationCommand | InteractionType.ApplicationCommandAutocomplete;
  data: {
    id: string;
    name: string;
    type: ApplicationCommandType;
    options?: ApplicationCommandOption[];
  }
  guild_id?: string;
  target_id?: string;
}

export interface ApplicationMessageComponentInteraction extends InteractionBase {
  type: InteractionType.MessageComponent;
  data: {
    component_type: ComponentType;
    custom_id: string;
    values?: SelectOption[];
  }
  guild_id?: string;
  target_id?: string;
}

export interface ModalSubmitInteraction extends InteractionBase {
  type: InteractionType.ModalSubmit;
  data: {
    custom_id: string;
    components: [ActionRowComponent];
  }
}

export type Interaction =
  | PingInteraction
  | ApplicationCommandInteraction
  | ApplicationMessageComponentInteraction
  | ModalSubmitInteraction;

export enum InteractionCallbackType {
  /** ACK a Ping */
  Pong = 1,
  /** respond to an interaction with a message */
  ChannelMessageWithSource = 4,
  /** ACK an interaction and edit a response later, the user sees a loading state */
  DeferredChannelMessageWithSource = 5,
  /** 
   * for components, ACK an interaction and edit the original message later; the user does not see a loading state 
   * 
   * Only valid for [component-based](https://discord.com/developers/docs/interactions/message-components) interactions
   */
  DeferredUpdateMessage = 6,
  /** 
   * for components, edit the message the component was attached to 
   * 
   * Only valid for [component-based](https://discord.com/developers/docs/interactions/message-components) interactions
   */
  UpdateMessage = 7,
  /** respond to an autocomplete interaction with suggested choices */
  ApplicationCommandAutocompleteResult = 8,
  /** respond to an interaction with a popup modal */
  Modal = 9,
}

export interface ApplicationResponseNoData {
  type: InteractionCallbackType.Pong | InteractionCallbackType.DeferredChannelMessageWithSource;
}

export interface ApplicationResponseMessage {
  type: InteractionCallbackType.ChannelMessageWithSource | InteractionCallbackType.DeferredUpdateMessage | InteractionCallbackType.UpdateMessage;
  data: Partial<Message>;
}

export interface AutocompleteChoice {
  name: string;
  name_localizations?: Record<DiscordLocale, string>;
  value: string | number;
}

export interface ApplicationResponseAutocomplete {
  type: InteractionCallbackType.ApplicationCommandAutocompleteResult;
  data: {
    choices: AutocompleteChoice[];
  }
}

export interface ApplicationResponseModal {
  type: InteractionCallbackType.Modal;
  data: {
    custom_id: string;
    title: string;
    components: ActionRowComponent[];
  }
}

export type ApplicationInteractionResponse =
  | ApplicationResponseNoData
  | ApplicationResponseMessage
  | ApplicationResponseAutocomplete
  | ApplicationResponseModal;

export enum GuildFeature {
  AnimatedBanner = "ANIMATED_BANNER",
  AnimatedIcon = "ANIMATED_ICON",
  AutoModeration = "AUTO_MODERATION",
  AutomodTriggerKeywordFilter = "AUTOMOD_TRIGGER_KEYWORD_FILTER",
  AutomodTriggerMlSpamFilter = "AUTOMOD_TRIGGER_ML_SPAM_FILTER",
  AutomodTriggerSpamLinkFilter = "AUTOMOD_TRIGGER_SPAM_LINK_FILTER",
  AutomodTriggerUserProfile = "AUTOMOD_TRIGGER_USER_PROFILE",
  Banner = "BANNER",
  ChannelIconEmojisGenerated = "CHANNEL_ICON_EMOJIS_GENERATED",
  Community = "COMMUNITY",
  CommunityExpLargeGated = "COMMUNITY_EXP_LARGE_GATED",
  CommunityExpLargeUngated = "COMMUNITY_EXP_LARGE_UNGATED",
  CommunityExpMedium = "COMMUNITY_EXP_MEDIUM",
  CreatorAcceptedNewTerms = "CREATOR_ACCEPTED_NEW_TERMS",
  CreatorMonetizable = "CREATOR_MONETIZABLE",
  CreatorMonetizableProvisional = "CREATOR_MONETIZABLE_PROVISIONAL",
  CreatorStorePage = "CREATOR_STORE_PAGE",
  DeveloperSupportServer = "DEVELOPER_SUPPORT_SERVER",
  Discoverable = "DISCOVERABLE",
  DiscoverableDisabled = "DISCOVERABLE_DISABLED",
  EnabledDiscoverableBefore = "ENABLED_DISCOVERABLE_BEFORE",
  ExposedToActivitiesWtpExperiment = "EXPOSED_TO_ACTIVITIES_WTP_EXPERIMENT",
  Featurable = "FEATURABLE",
  GuestsEnabled = "GUESTS_ENABLED",
  GuildAutomodDefaultList = "GUILD_AUTOMOD_DEFAULT_LIST",
  GuildCommunicationDisabledGuilds = "GUILD_COMMUNICATION_DISABLED_GUILDS",
  GuildMemberVerificationExperiment = "GUILD_MEMBER_VERIFICATION_EXPERIMENT",
  GuildOnboarding = "GUILD_ONBOARDING",
  GuildOnboardingEverEnabled = "GUILD_ONBOARDING_EVER_ENABLED",
  GuildOnboardingHasPrompts = "GUILD_ONBOARDING_HAS_PROMPTS",
  GuildRoleSubscriptionPurchaseFeedbackLoop = "GUILD_ROLE_SUBSCRIPTION_PURCHASE_FEEDBACK_LOOP",
  GuildRoleSubscriptions = "GUILD_ROLE_SUBSCRIPTIONS",
  GuildRoleSubscriptionTrials = "GUILD_ROLE_SUBSCRIPTION_TRIALS",
  GuildServerGuide = "GUILD_SERVER_GUIDE",
  GuildWebPageVanityUrl = "GUILD_WEB_PAGE_VANITY_URL",
  HasDirectoryEntry = "HAS_DIRECTORY_ENTRY",
  InvitesDisabled = "INVITES_DISABLED",
  InviteSplash = "INVITE_SPLASH",
  LinkedToHub = "LINKED_TO_HUB",
  MemberProfiles = "MEMBER_PROFILES",
  MemberVerificationGateEnabled = "MEMBER_VERIFICATION_GATE_ENABLED",
  MobileWebRoleSubscriptionPurchasePage = "MOBILE_WEB_ROLE_SUBSCRIPTION_PURCHASE_PAGE",
  News = "NEWS",
  NewThreadPermissions = "NEW_THREAD_PERMISSIONS",
  Partnered = "PARTNERED",
  PreviewEnabled = "PREVIEW_ENABLED",
  PrivateThreads = "PRIVATE_THREADS",
  RoleIcons = "ROLE_ICONS",
  RoleSubscriptionsAvailableForPurchase = "ROLE_SUBSCRIPTIONS_AVAILABLE_FOR_PURCHASE",
  RoleSubscriptionsEnabled = "ROLE_SUBSCRIPTIONS_ENABLED",
  SevenDayThreadArchive = "SEVEN_DAY_THREAD_ARCHIVE",
  Soundboard = "SOUNDBOARD",
  TextInStageEnabled = "TEXT_IN_STAGE_ENABLED",
  TextInVoiceEnabled = "TEXT_IN_VOICE_ENABLED",
  ThreadsEnabled = "THREADS_ENABLED",
  ThreadsOnlyChannel = "THREADS_ONLY_CHANNEL",
  ThreeDayThreadArchive = "THREE_DAY_THREAD_ARCHIVE",
  VanityUrl = "VANITY_URL",
  Verified = "VERIFIED",
  VipRegions = "VIP_REGIONS",
  WelcomeScreenEnabled = "WELCOME_SCREEN_ENABLED",
}

export interface Guild {
  id: string;
  name: string;
  owner: boolean;
  permissions: `${number}`;
  icon: string | null;
  features: GuildFeature[];
}
