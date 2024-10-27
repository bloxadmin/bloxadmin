import "https://deno.land/x/dotenv@v3.2.0/load.ts";
import { Md5 } from "https://deno.land/std@0.160.0/hash/md5.ts";
import { ENABLE_LOGGING } from "../consts.ts";
import postgres from "../util/postgres.ts";
import { proxyFetch } from "./zyte.ts";

export interface RobloxGame {
  id: number;
  rootPlaceId: number;
  name: string;
  description: string;
  sourceName: string;
  sourceDescription: string;
  creator: {
    id: number;
    name: string;
    type: "User" | "Group";
    isRNVAccount: boolean;
    hasVerifiedBadge: boolean;
  };
  price: number | null;
  allowedGearGenres: string[];
  isGenreEnforced: boolean;
  copyingAllowed: boolean;
  playing: number;
  visits: number;
  maxPlayers: number;
  created: Date;
  updated: Date;
  studioAccessToApisAllowed: boolean;
  createVipServerAllowed: boolean;
  universeAvatarType: string;
  genre: string;
  isAllGenre: boolean;
  isFavoritedByUser?: boolean;
  favoritedCount: number;
}

export interface RobloxGroup {
  id: number;
  name: string;
  description: string;
  owner: {
    hasVerifiedBadge: boolean;
    userId: number;
    username: string;
    displayName: string;
  };
  memberCount: number;
  isBuildersClubOnly: boolean;
  publicEntryAllowed: boolean;
  hasVerifiedBadge: boolean;
}

export interface RobloxGroupRole {
  id: number;
  name: string;
  description: string;
  rank: number;
  memberCount: number;
}

export interface RobloxGroupMember {
  hasVerifiedBadge: boolean;
  userId: number;
  username: string;
  displayName: string;
}

export interface RobloxPlayer {
  description: string;
  created: Date;
  isBanned: boolean;
  externalAppDisplayName: string | null;
  hasVerifiedBadge: boolean;
  id: number;
  name: string;
  displayName: string;
}

const CLIENT_ID = Deno.env.get("ROBLOX_CLIENT_ID")!;
const CLIENT_SECRET = Deno.env.get("ROBLOX_CLIENT_SECRET")!;
const API_URL = Deno.env.get("API_URL") || "https://api.bloxadmin.com";
const REDIRECT_URI = Deno.env.get("ROBLOX_REDIRECT_URL") || `${API_URL}/roblox/auth`;
const SCOPES = [
  "profile",
  "openid",
];
const GAME_SCOPES = [
  "profile",
  "openid",
  "universe-messaging-service:publish",
]
const AUTH_URL = `https://apis.roblox.com/oauth/v1/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${SCOPES.join("%20")}`;
const GAME_LINK_URL = `https://apis.roblox.com/oauth/v1/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${GAME_SCOPES.join("%20")}`;
const USER_AGENT = "BloxdminApi/1.0";

if (!CLIENT_ID || !CLIENT_SECRET) {
  throw new Error("ROBLOX_CLIENT_ID and ROBLOX_CLIENT_SECRET must be set in the environment");
}

function getOfflinePlayer(id: number | string): RobloxPlayer {
  const name = "Offline Player " + Math.abs(Number(id));

  return {
    description: "This player is not a real player. They are a placeholder for a player that does not exist or is being ran in Roblox Studio",
    created: new Date(),
    isBanned: false,
    externalAppDisplayName: null,
    hasVerifiedBadge: false,
    id: Number(id),
    name,
    displayName: name,
  };
}

export async function getRobloxGame(id: string | number): Promise<RobloxGame | null> {
  const response = await fetch(`https://games.roblox.com/v1/games?universeIds=${Number(id)}`);
  const data = await response.json() as {
    data?: RobloxGame[];
  };


  if (!data.data) {
    return null;
  }

  const game = data.data.find((game: RobloxGame) => game.id === Number(id));

  if (!game) {
    return null;
  }

  game.created = new Date(game.created);
  game.updated = new Date(game.updated);

  return game;
}

export async function getRobloxGroup(id: string | number): Promise<RobloxGroup | null> {
  const response = await fetch(`https://groups.roblox.com/v1/groups/${Number(id)}`);
  const data = await response.json() as RobloxGroup & {
    errors: undefined;
  } | {
    errors: true;
  };

  if (data.errors) {
    return null;
  }

  return data;
}

export async function getRobloxGroupRoles(id: string | number): Promise<RobloxGroupRole[] | null> {
  const response = await proxyFetch(`https://groups.roblox.com/v1/groups/${Number(id)}/roles`);
  const data = await response.json() as {
    roles?: RobloxGroupRole[];
  };

  if (!data.roles) {
    return null;
  }

  return data.roles;
}

export async function getRobloxGroupMembers(id: string | number, cursor?: string): Promise<{ user: RobloxGroupMember, group: RobloxGroupRole }[] | null> {
  const url = new URL(`https://groups.roblox.com/v1/groups/${Number(id)}/users`);
  if (cursor) {
    url.searchParams.set("cursor", cursor);
  }
  const response = await proxyFetch(url);
  const data = await response.json() as {
    data?: { user: RobloxGroupMember, group: RobloxGroupRole }[];
  };

  if (!data.data) {
    return null;
  }

  return data.data;
}

export async function getRobloxGroupRoleMembers(id: string | number, role: string | number, cursor?: string): Promise<{ nextPageCursor?: string; data: RobloxGroupMember[]; wait?: 1000 } | null | undefined> {
  const url = new URL(`https://groups.roblox.com/v1/groups/${Number(id)}/roles/${Number(role)}/users?limit=100`);
  if (cursor) {
    url.searchParams.set("cursor", cursor);
  }
  const response = await proxyFetch(url);

  if (response.status === 429)
    return { nextPageCursor: cursor, data: [], wait: 1000 };

  const data = await response.json() as { nextPageCursor?: string; data: RobloxGroupMember[]; }

  if (data.data === undefined) {
    return null;
  }

  return data;
}


export async function getRobloxPlayer(id: string | number): Promise<RobloxPlayer | null> {
  if (Number(id) <= 0) {
    return getOfflinePlayer(id);
  }

  const response = await fetch(`https://users.roblox.com/v1/users/${Number(id)}`);
  const data = await response.json() as RobloxPlayer & {
    errors: undefined;
  } | {
    errors: true;
  };

  if (data.errors) {
    return null;
  }

  data.created = new Date(data.created);

  return data;
}

export async function hasRobloxPremium(id: string | number): Promise<boolean> {
  const response = await fetch(`https://premiumfeatures.roblox.com/v1/users/${Number(id)}/validate-membership`);
  const data = await response.json() as boolean & {
    errors: undefined;
  } | {
    errors: true;
  }

  if (data.errors) {
    return false;
  }

  return data;
}

async function _getRobloxPlayers(ids: (string | number)[]): Promise<{
  hasVerifiedBadge: boolean,
  id: number,
  name: string,
  displayName: string
}[]> {
  const response = await fetch(`https://users.roblox.com/v1/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userIds: ids.map(id => Number(id)).filter(id => id > 0),
      excludeBannedUsers: false
    }),
  });
  const data = await response.json() as {
    errors?: {
      code: number;
    }[];
    data: {
      hasVerifiedBadge: boolean,
      id: number,
      name: string,
      displayName: string
    }[];
  }

  if (data.errors) {
    if (data.errors.find(({ code }: { code: number }) => code === 4)) {
      // wait 5 seconds and try again
      if (ENABLE_LOGGING)
        console.log("Retrying fetch " + (ids[0]) + " in 1 min");
      await new Promise(resolve => setTimeout(resolve, 60_000));
      return _getRobloxPlayers(ids);
    } else {
      console.error("Error fetching players");
      console.error(response.headers);
      console.error(data.errors);
    }
    return [];
  }

  const offlinePlayers = ids.map(id => Number(id)).filter(id => id <= 0).map(id => getOfflinePlayer(id));

  if (offlinePlayers.length > 0) {
    return [...data.data, ...offlinePlayers];
  }

  return data.data;
}

export async function getRobloxPlayers(ids: (string | number)[]): Promise<{
  hasVerifiedBadge: boolean,
  id: number,
  name: string,
  displayName: string
}[]> {
  // Roblox's API only allows 100 users to be fetched at a time
  const chunks: (string | number)[][] = [];
  const chunkSize = 100;

  for (let i = 0; i < ids.length; i += chunkSize) {
    chunks.push(ids.slice(i, i + chunkSize));
  }

  const players: {
    hasVerifiedBadge: boolean,
    id: number,
    name: string,
    displayName: string
  }[] = [];

  for (const chunk of chunks) {
    const chunkPlayers = await _getRobloxPlayers(chunk);
    players.push(...chunkPlayers);
  }

  return players;
}

export enum ThumbnailErrorCode {
  TooManyIds = 1,
  InvalidFormat = 2,
  InvalidSize = 3,
  InvalidIds = 4,
  InvalidPolicy = 8,
  AutoGeneratedNotAuthorized = 9,
  CircularNotAllowed = 10,
}
export type ThumbnailFormat = "Png" | "Jpeg";

export type AssetThumbnailSize = "30x30" | "42x42" | "50x50" | "60x62" | "75x75" | "110x110" | "140x140" | "150x150" | "160x100" | "160x600" | "250x250" | "256x144" | "300x250" | "304x166" | "384x216" | "396x216" | "420x420" | "480x270" | "512x512" | "576x324" | "700x700" | "728x90" | "768x432" | "1200x80";
export const VALID_ASSET_THUMBNAIL_SIZES: AssetThumbnailSize[] = ['30x30', '42x42', '50x50', '60x62', '75x75', '110x110', '140x140', '150x150', '160x100', '160x600', '250x250', '256x144', '300x250', '304x166', '384x216', '396x216', '420x420', '480x270', '512x512', '576x324', '700x700', '728x90', '768x432', '1200x80'];

export type AvatarHeadshotSize = 48 | 50 | 60 | 75 | 100 | 110 | 150 | 180 | 352 | 420 | 720;
export const VALID_AVATAR_HEADSHOT_SIZES: AvatarHeadshotSize[] = [48, 50, 60, 75, 100, 110, 150, 180, 352, 420, 720];

export type GameIconSize = 50 | 128 | 150 | 256 | 512;
export const VALID_GAME_ICON_SIZES: GameIconSize[] = [50, 128, 150, 256, 512];

export type GroupIconSize = 150 | 420;
export const VALID_GROUP_ICON_SIZES: GroupIconSize[] = [150, 420];

export interface ThumbnailOptions<Size extends number | string> {
  size?: Size;
  format?: ThumbnailFormat;
  isCircular?: boolean;
}

export type Thumbnails<Ids extends string | number = number> = Record<Ids, [string, boolean] | null>;

async function thumbnails<Ids extends string | number>(ids: Ids[], response: Response): Promise<Thumbnails<Ids>> {
  const data = await response.json() as {
    data?: {
      targetId: number;
      state: "Completed" | "Pending" | "Error";
      imageUrl: string;
    }[];
    errors?: {
      code: ThumbnailErrorCode;
      message: string;
      userFacingMessage: string;
    }[];
  };

  if (data.errors) {
    console.error(response, data.errors);
    throw new Error(`Failed to fetch thumbnails: ${data.errors[0].message}`);
  }
  if (!data.data)
    throw new Error(`Failed to fetch thumbnails: no data`);

  const headshots = data.data;

  const result = {} as Thumbnails<Ids>;

  for (const id of ids) {
    const headshot = headshots.find(h => h.targetId === Number(id));

    if (!headshot) {
      result[id] = null;
      continue;
    }

    if (headshot.state === "Error") {
      result[id] = null;
      continue;
    }

    result[id] = [headshot.imageUrl, headshot.state === "Completed"];
  }

  return result;

}

class ThumbnailDebouncer<Size extends number | string> {
  private readonly queue: (string | number)[] = [];
  private readonly resolvers: { [id: string]: ((value: [string, boolean] | null) => void)[] } = {};
  private readonly timeout: number;
  private timer: number | undefined;

  constructor(private provider: ThumbnailProvider<Size>, timeout: number, private size: Size, private format: ThumbnailFormat, private isCircular: boolean) {
    this.timeout = timeout;
  }

  private async run() {
    this.timer = undefined;

    // max 100
    const ids = this.queue.splice(0, 100);

    const thumbs = await this.provider.getThumbnails(ids, {
      size: this.size,
      format: this.format,
      isCircular: this.isCircular,
    });

    for (const id of ids) {
      const response = thumbs[id];

      this.resolvers[id].forEach((resolve) => resolve(response));
    }
  }

  get(id: string | number): Promise<[string, boolean] | null> {
    if (!this.resolvers[id]) {
      this.resolvers[id] = [];
    }

    this.queue.push(id);

    return new Promise((resolve) => {
      this.resolvers[id].push(resolve);

      if (!this.timer) {
        this.timer = setTimeout(() => this.run(), this.timeout);
      }
    });
  }
}

class ThumbnailProvider<Size extends number | string> {
  private thumbnailDebouncers: { [format: string]: ThumbnailDebouncer<Size> } = {};

  constructor(private readonly url: string, private readonly idsParam: string, private readonly defaultSize: Size) { }

  async getThumbnails<Ids extends string | number>(
    ids: Ids[],
    { size, format, isCircular }: ThumbnailOptions<Size>
  ): Promise<Thumbnails<Ids>> {
    if (ids.length === 0)
      return {} as Thumbnails<Ids>;

    const sizeParam = size || this.defaultSize;

    const url = new URL(this.url);

    url.searchParams.append(this.idsParam, ids.join(','));
    url.searchParams.append("size", typeof sizeParam == 'number' ? `${sizeParam}x${sizeParam}` : sizeParam);
    url.searchParams.append("format", format || "Png");
    url.searchParams.append("isCircular", isCircular ? "true" : "false");

    const response = await fetch(url);

    return await thumbnails(ids, response);
  }

  getThumbnail<Id extends string | number>(
    id: Id,
    { size, format, isCircular }: ThumbnailOptions<Size>
  ): Promise<[string, boolean] | null> {
    if (id === 0 || id === '0')
      return new Promise((resolve) => resolve(getSystemPlayerThumbnail(Number(id), { size, format })));
    if (typeof id === 'number' && id < 0)
      return new Promise((resolve) => resolve(getOfflinePlayerThumbnail(id, { size, format })));

    const formatKey = `${size || this.defaultSize}-${format || "Png"}-${isCircular || false}`;

    if (!this.thumbnailDebouncers[formatKey]) {
      this.thumbnailDebouncers[formatKey] = new ThumbnailDebouncer(this, 250, size || this.defaultSize, format || "Png", isCircular || false);
    }

    return Promise.any([this.thumbnailDebouncers[formatKey].get(id), new Promise<[string, boolean] | null>((resolve) => setTimeout(() => resolve(null), 5000))]);
  }
}

export const groupIcons = new ThumbnailProvider<GroupIconSize>("https://thumbnails.roblox.com/v1/groups/icons", "groupIds", 150);
export const gameIcons = new ThumbnailProvider<GameIconSize>("https://thumbnails.roblox.com/v1/games/icons", "universeIds", 256);
export const assetThumbnails = new ThumbnailProvider<AssetThumbnailSize>("https://thumbnails.roblox.com/v1/assets", "assetIds", "768x432");
export const userHeadshots = new ThumbnailProvider<AvatarHeadshotSize>("https://thumbnails.roblox.com/v1/users/avatar-headshot", "userIds", 150);

function getOfflinePlayerThumbnail<Id extends number>(id: Id, { size, format }: { size?: number | string; format?: ThumbnailFormat; }): [string, boolean] {
  const uri = `https://robohash.org/${id}.${format?.toLowerCase() || "png"}?set=set5&size=${size || 150}x${size || 150}`

  return [uri, true];
}

function getSystemPlayerThumbnail<Id extends number>(id: Id, { size, format }: { size?: number | string; format?: ThumbnailFormat; }): [string, boolean] {
  const uri = `https://bloxadmin.com/logo.svg`;

  return [uri, true];
}

export async function searchPlayers(query: string, max = 25): Promise<{
  id: number;
  name: string;
  displayName: string;
}[]> {
  if (query.length < 3)
    return [];

  const url = `https://www.roblox.com/search/users/results?keyword=${query}&maxRows=${max}&startIndex=0`;

  const response = await fetch(url);

  const data = await response.json() as {
    UserSearchResults?: {
      UserId: number;
      Name: string;
      DisplayName: string;
    }[];
  };

  if (!data.UserSearchResults)
    return [];

  return data.UserSearchResults.map((d) => ({
    id: d.UserId,
    name: d.Name,
    displayName: d.DisplayName,
  }));
}

/*
 * DataStore API
 */

export interface CloudContext {
  gameId: number | string;
  apiKey: string;
}

export interface DataStoreContext extends CloudContext {
  datastore: string;
  scope?: string;
}

export interface CloudDataStore {
  name: string;
  addedAt?: Date;
}

export interface CloudDataStoreResult {
  datastores: CloudDataStore[];
  nextPageCursor?: string;
}

export interface CloudDataStoreEntry {
  key: string;
  addedAt: Date;
  updatedAt?: Date;
  version: string;
  attributes: Record<string, unknown>;
  playerIds: number[];
  players: {
    id: number;
    name: string;
  }[];
  verified: boolean;
  deleted?: boolean;
  detectedSchemaType?: "ProfileService" | "DataStore2";
  data: unknown | undefined;
}
export interface CloudDataStoreEntryVersion {
  version: string;
  deleted: boolean;
  contentLength: number;
  addedAt: Date;
  dataStoreAddedAt: Date;
}

export async function listDataStores(
  { gameId, apiKey }: CloudContext,
  { cursor, limit, prefix }: { cursor?: string; limit?: number, prefix?: string } = {}
): Promise<CloudDataStoreResult> {
  const params = new URLSearchParams();

  if (cursor) params.append("cursor", cursor);
  if (limit) params.append("limit", limit.toString());
  if (prefix) params.append("prefix", prefix);

  const response = await fetch(`https://apis.roblox.com/datastores/v1/universes/${gameId}/standard-datastores?${params.toString()}`, {
    headers: {
      'User-Agent': USER_AGENT,
      'x-api-key': apiKey,
      'Accept': 'application/json',
    }
  });

  const body = await response.json() as {
    nextPageCursor?: string;
    datastores: {
      name: string;
      createdTime?: string;
    }[];
  }

  return {
    datastores: body.datastores.map(({ name, createdTime }: { name: string, createdTime?: string }) => ({
      name,
      addedAt: createdTime ? new Date(createdTime) : undefined,
    })),
    nextPageCursor: body.nextPageCursor,
  }
}

export async function listDataStoreEntries(
  { gameId, apiKey, datastore, scope }: DataStoreContext,
  { allScopes, prefix, cursor, limit }: {
    allScopes?: boolean;
    prefix?: string;
    cursor?: string;
    limit?: number;
  } = {}
): Promise<{
  keys: string[];
  nextPageCursor?: string;
} | null> {
  const url = new URL(`https://apis.roblox.com/datastores/v1/universes/${gameId}/standard-datastores/datastore/entries`);

  url.searchParams.append("datastoreName", datastore);
  if (scope) url.searchParams.append("scope", scope);
  if (prefix) url.searchParams.append("prefix", prefix);
  else if (allScopes) url.searchParams.append("allScopes", allScopes.toString());
  if (cursor) url.searchParams.append("cursor", cursor);
  if (limit) url.searchParams.append("limit", limit.toString());

  const response = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      'x-api-key': apiKey,
      'Accept': 'application/json',
    },
  });

  const data = await response.json() as {
    error?: string;
    keys: {
      key: string;
    }[];
    nextPageCursor?: string;
  };

  return {
    keys: data.keys ? data.keys.map((k) => k.key) : [],
    nextPageCursor: data.nextPageCursor,
  };
}

export async function getDataStoreEntry<T = unknown>(
  { gameId, apiKey, datastore, scope }: DataStoreContext,
  key: string
): Promise<CloudDataStoreEntry> {
  const url = new URL(`https://apis.roblox.com/datastores/v1/universes/${gameId}/standard-datastores/datastore/entries/entry`);

  url.searchParams.append("datastoreName", datastore);
  if (scope) url.searchParams.append("scope", scope);
  url.searchParams.append("entryKey", key);

  const response = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      'x-api-key': apiKey,
      'Accept': 'application/json',
    },
  });

  let data: T | undefined = undefined;
  let verified = false;

  if (response.status === 200) {
    const body = await response.text();
    data = JSON.parse(body) as T;

    const dataHash = await new Md5().update(body).toString('base64');
    const base64Checksum = response.headers.get('content-md5')!;
    verified = dataHash === base64Checksum;
  }


  const attrsHeader = response.headers.get('roblox-entry-attributes');
  const playerIdsHeader = response.headers.get('roblox-entry-userids');
  const lastModifiedHeader = response.headers.get('roblox-entry-version-created-time');

  let detectedSchemaType: CloudDataStoreEntry['detectedSchemaType'] = undefined;

  if (data) {
    // deno-lint-ignore no-explicit-any
    if ((data as any).MetaData?.ProfileCreateTime) {
      detectedSchemaType = "ProfileService";
    }
  }

  const playerIds = playerIdsHeader ? JSON.parse(playerIdsHeader) : [];
  const players = await getRobloxPlayers(playerIds);

  return {
    key,
    addedAt: new Date(response.headers.get('roblox-entry-created-time')!),
    updatedAt: lastModifiedHeader ? new Date(lastModifiedHeader) : undefined,
    version: response.headers.get('roblox-entry-version')!,
    attributes: attrsHeader ? JSON.parse(attrsHeader) : {},
    playerIds,
    players: players.map((player) => ({
      id: player.id,
      name: player.name,
    })),
    verified,
    deleted: response.status === 204 ? true : undefined,
    detectedSchemaType,
    data,
  };
}


export async function setDataStoreEntry(
  { gameId, apiKey, datastore, scope }: DataStoreContext,
  key: string,
  value: string,
  { exclusiveCreate, attributes, playerIds, matchVersion }: {
    exclusiveCreate?: boolean;
    attributes?: Record<string, unknown>;
    playerIds?: number[];
    matchVersion?: string;
  } = {}
): Promise<CloudDataStoreEntryVersion> {
  const url = new URL(`https://apis.roblox.com/datastores/v1/universes/${gameId}/standard-datastores/datastore/entries/entry`);

  url.searchParams.append("datastoreName", datastore);
  if (scope) url.searchParams.append("scope", scope);
  url.searchParams.append("entryKey", key);
  if (matchVersion) url.searchParams.append("matchVersion", matchVersion);
  if (exclusiveCreate) url.searchParams.append("exclusiveCreate", exclusiveCreate.toString());

  const hash = await new Md5().update(value).toString('base64');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'User-Agent': USER_AGENT,
      'x-api-key': apiKey,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'roblox-entry-attributes': JSON.stringify(attributes || {}),
      'roblox-entry-userids': JSON.stringify(playerIds || []),
      'content-md5': hash,
    },
    body: value
  });

  const data = await response.json() as {
    version: string;
    deleted: boolean;
    contentLength: number;
    createdTime: string;
    objectCreatedTime: string;
  }

  return {
    version: data.version,
    deleted: data.deleted,
    contentLength: data.contentLength,
    addedAt: new Date(data.createdTime),
    dataStoreAddedAt: new Date(data.objectCreatedTime),
  }
}

export async function deleteDataStoreEntry(
  { gameId, apiKey, datastore, scope }: DataStoreContext,
  key: string
): Promise<boolean> {
  const url = new URL(`https://apis.roblox.com/datastores/v1/universes/${gameId}/standard-datastores/datastore/entries/entry`);

  url.searchParams.append("datastoreName", datastore);
  if (scope) url.searchParams.append("scope", scope);
  url.searchParams.append("entryKey", key);

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'User-Agent': USER_AGENT,
      'x-api-key': apiKey,
      'Accept': 'application/json',
    },
  });

  return response.ok;
}

export interface RobloxOAuth {
  id?: number;
  accessToken: string;
  idToken?: string;
  refreshToken: string;
  expires: Date;
  scope: string[];
  tokenType: string;
}

export interface RobloxOAuthUser {
  sub: string;
  name?: string;
  nickname?: string;
  preferredUsername?: string;
  createdAt?: Date;
  profile?: string;
}

export async function robloxOAuthAuthorize(code: string): Promise<RobloxOAuth> {
  const result = await fetch('https://apis.roblox.com/oauth/v1/token', {
    method: 'POST',
    headers: {
      'User-Agent': USER_AGENT,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
    }).toString(),
  });

  if (!result.ok) {
    throw new Error(`Failed to authorize: ${result.status} ${result.statusText}`);
  }

  const data = await result.json() as {
    access_token: string;
    id_token?: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
    scope: string;
  };

  return {
    accessToken: data.access_token,
    idToken: data.id_token,
    refreshToken: data.refresh_token,
    expires: new Date(Date.now() + data.expires_in * 1000),
    scope: data.scope.split(' '),
    tokenType: data.token_type,
  };
}

export async function robloxOAuthRefresh(oauth: RobloxOAuth): Promise<RobloxOAuth> {
  const result = await fetch('https://apis.roblox.com/oauth/v1/token', {
    method: 'POST',
    headers: {
      'User-Agent': USER_AGENT,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: oauth.refreshToken,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }).toString(),
  });

  if (!result.ok) {
    console.error(await result.text());
    throw new Error(`Failed to refresh: ${result.status} ${result.statusText}`);
  }

  const data = await result.json() as {
    access_token: string;
    id_token?: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
    scope: string;
  };

  return {
    accessToken: data.access_token,
    idToken: data.id_token,
    refreshToken: data.refresh_token,
    expires: new Date(Date.now() + (data.expires_in * 1000)),
    scope: data.scope.split(' '),
    tokenType: data.token_type,
  };
}

export async function robloxOAuthUserInfo(accessToken: string): Promise<RobloxOAuthUser> {
  const result = await fetch('https://apis.roblox.com/oauth/v1/userinfo', {
    headers: {
      'User-Agent': USER_AGENT,
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    },
  });

  if (!result.ok) {
    throw new Error(`Failed to get user info: ${result.status} ${result.statusText}`);
  }

  const data = await result.json() as {
    sub: string;
    name?: string;
    nickname?: string;
    preferred_username?: string;
    created_at?: number;
    profile?: string;
  };

  return {
    sub: data.sub,
    name: data.name,
    nickname: data.nickname,
    preferredUsername: data.preferred_username,
    createdAt: data.created_at ? new Date(data.created_at * 1000) : undefined,
    profile: data.profile,
  };
}

export async function getValidRobloxOAuth(oauth: RobloxOAuth): Promise<{ auth: RobloxOAuth, updated: boolean }> {
  if (oauth.expires.getTime() > Date.now()) {
    return { auth: oauth, updated: false };
  }

  const updated = await robloxOAuthRefresh(oauth);

  return { auth: updated, updated: true };
}

export async function publishInMessageingService(gameId: string | number, apiKey: string, topic: string, message: string) {
  const url = new URL(`https://apis.roblox.com/messaging-service/v1/universes/${gameId}/topics/${encodeURIComponent(topic)}`);

  const headers = new Headers({
    'User-Agent': USER_AGENT,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  });

  if (apiKey.startsWith('Bearer ')) {
    headers.set('Authorization', apiKey);
  } else {
    headers.set('x-api-key', apiKey);
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      message,
    }),
  });

  return response.ok;
}

export async function robloxOAuthResources(oauthInfo: RobloxOAuth) {
  const resourcesResponse = await fetch('https://apis.roblox.com/oauth/v1/token/resources', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${oauthInfo.accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: new URLSearchParams({
      token: oauthInfo.accessToken,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  });

  const resources: {
    resource_infos: {
      owner: {
        id: string;
        type: "User" | "Group";
      };
      resources: {
        universe?: {
          ids: string[];
        }
      }
    }[]
  } = await resourcesResponse.json();

  return resources;
}

export async function robloxOAuth(clientId: string, code: string): Promise<{
  oauthInfo: RobloxOAuth;
  userInfo: RobloxOAuthUser;
  universeIds: string[];
}> {
  const oauthInfo = await robloxOAuthAuthorize(code);
  const userInfo = await robloxOAuthUserInfo(oauthInfo.accessToken);

  const [{ id }] = await postgres<{ id: number }>`
    INSERT INTO roblox_oauth 
      (
        player_id, refresh_token, identity_token, identity_expires_at, access_token, access_expires_at, client_id, scope_openid, scope_profile, scope_messaging_service_publish)
    VALUES ${postgres([[
    userInfo.sub,
    oauthInfo.refreshToken,
    oauthInfo.idToken,
    oauthInfo.idToken ? new Date(Date.now() + 3600 * 1000) : undefined,
    oauthInfo.accessToken,
    oauthInfo.expires,
    clientId,
    oauthInfo.scope.includes('openid'),
    oauthInfo.scope.includes('profile'),
    oauthInfo.scope.includes('universe-messaging-service:publish'),
  ]])}
    RETURNING id
  `;

  oauthInfo.id = id;

  const resources = await robloxOAuthResources(oauthInfo);

  const universeIds = resources.resource_infos
    .filter((resource) => resource.resources.universe)
    .map((resource) => resource.resources.universe!.ids)
    .flat();

  if (universeIds.length)
    await postgres`
    INSERT INTO roblox_oauth_games
      (oauth_id, game_id)
    VALUES ${postgres(universeIds.map((universeId) => [id, universeId]))}
    ON CONFLICT DO NOTHING
  `;

  return {
    oauthInfo: oauthInfo,
    userInfo: userInfo,
    universeIds: universeIds,
  };
}
