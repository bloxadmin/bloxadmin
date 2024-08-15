import { API_BASE, encodePath, request } from "./api";
import { Permission } from "./security";

export enum GameFeature {
  FasterIngestion = "faster_ingestion",
  ExtendedChatLogs = "extended_chat_logs",
  ExtendedSessionLogs = "extended_session_logs",
  ErrorOccurrenceTracking = "error_occurrence_tracking",
  ShorterMetricsInterval = "shorter_metrics_interval",
  DatastoreViewer = "datastore_viewer",
  Block = "block",
  ExtendedPromoCodes = "extended_promo_codes",
  Actions = "actions",
}

export interface Game {
  requestAt?: Date;
  id: number;
  name: string;
  rootPlaceId: number;
  onlinePlayerCount: number;
  permissions: Permission[];
  ownerGroup?: {
    id: number;
    name: string;
  };
  ownerPlayer: {
    id: number;
    name: string;
  };
  trackingGroup?: {
    id: number;
    name: string;
  };
  features: GameFeature[];
  apiKeySet: boolean;
  isSetup: boolean;
  active?: boolean;
};

export interface GameUser {
  id: number;
  name: string;
  sequence: number;
  roles: {
    id: number;
    name: string;
    permissions: Permission[];
  }[]
};

export interface ScriptConfig {
  ingestKey: string;
  config: {
    events: {
      disableIntervals: boolean;
      disablePlayer: boolean;
      disableAuto: boolean;
      disableAutoPlayer: boolean;
      disableCustomPlayer: boolean;
      disableCustom: boolean;
      disablePlayerText: boolean;
      disableText: boolean;
      disablePlayerlocation: boolean;
      disableLocation: boolean;
      disableMarketplace: boolean;
      disallow: Event[];
    };
    intervals: {
      ingest: number;
      ingestRetry: number;
      stats: number;
      heartbeat: number;
      playerPositions: number;
      playerCursors: number;
    };
  }
}

export const getGames = async () => {
  return await request<Game[]>("games");
};

export const getGame = async (gameIdentifier: string) => {
  return await request<Game>(encodePath`games/${gameIdentifier}`);
};

export const getGameUsers = async (gameIdentifier: string) => {
  return await request<GameUser[]>(encodePath`games/${gameIdentifier}/users`);
};

export const addGameUser = async (gameIdentifier: string, userIdentifier: string) => {
  return await request(encodePath`games/${gameIdentifier}/users/${userIdentifier}`, {
    method: "PUT",
    body: { permissions: ["*"] }
  });
}

export const removeGameUser = async (gameIdentifier: string, userIdentifier: number) => {
  return await request(encodePath`games/${gameIdentifier}/users/${userIdentifier}`, {
    method: "DELETE"
  });
}

export const updateGameUser = async (gameIdentifier: string, userIdentifier: number, permissions: string[]) => {
  return await request(encodePath`games/${gameIdentifier}/users/${userIdentifier}`, {
    method: "PUT",
    body: { permissions }
  });
}

export const addApiKey = async (gameIdentifier: string, game: Partial<{ apiKey: string }>) => {
  return await request(encodePath`games/${gameIdentifier}/robloxcloud`, {
    method: "POST",
    body: game
  });
}

export const getScriptConfig = async (gameIdentifier: string) => {
  return await request<ScriptConfig>(encodePath`games/${gameIdentifier}/scriptConfig`);
}

export const updateScriptConfig = async (gameIdentifier: string, scriptConfig: ScriptConfig) => {
  return await request<ScriptConfig>(encodePath`games/${gameIdentifier}/scriptConfig`, {
    method: "PUT",
    body: scriptConfig
  });
}

export const getGameEventSource = (gameIdentifier: string): EventSource => {
  return new EventSource(API_BASE + encodePath`/games/${gameIdentifier}/events`, {
    withCredentials: true
  });
};

export const getGameCredits = async (gameIdentifier: string) => {
  return await request<{ credits: number }>(encodePath`games/${gameIdentifier}/credits`);
}
