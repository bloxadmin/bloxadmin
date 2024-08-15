import { Paginated, encodePath, request } from "./api";

export type ModeratorActionType = "ban" | "mute" | "kick" | "unban" | "unmute";

export interface ModeratorAction {
  id: string;
  type: ModeratorActionType;
  reason: string;
  createdAt: string;
  expiresAt: string;
  moderator: {
    id: string;
    name: string;
    avatar: string;
  };
  player?: {
    id: string;
    name: string;
  }
};

export const ban = async (gameIdentifier: string, playerIdentifier: string, reason?: string, duration?: number) => {
  return await request<never>(encodePath`games/${gameIdentifier}/players/${playerIdentifier}/moderation`, {
    method: "POST",
    body: { type: "ban", reason, duration }
  });
};

export const mute = async (gameIdentifier: string, playerIdentifier: string, reason?: string, duration?: number) => {
  return await request<never>(encodePath`games/${gameIdentifier}/players/${playerIdentifier}/moderation`, {
    method: "POST",
    body: { type: "mute", reason, duration }
  });
};

export const kick = async (gameIdentifier: string, playerIdentifier: string, reason?: string) => {
  return await request<never>(encodePath`games/${gameIdentifier}/players/${playerIdentifier}/moderation`, {
    method: "POST",
    body: { type: "kick", reason }
  });
};

export const unban = async (gameIdentifier: string, playerIdentifier: string, reason?: string) => {
  return await request<never>(encodePath`/games/${gameIdentifier}/players/${playerIdentifier}/moderation`, {
    method: "POST",
    body: { type: "unban", reason }
  });
};

export const unmute = async (gameIdentifier: string, playerIdentifier: string, reason?: string) => {
  return await request<never>(encodePath`/games/${gameIdentifier}/players/${playerIdentifier}/moderation`, {
    method: "POST",
    body: { type: "unmute", reason }
  });
};

export const getGameModeratorActions = async (gameIdentifier: string, limit?: number, skip?: number) => {
  return await request<Paginated<ModeratorAction>>(encodePath`/games/${gameIdentifier}/moderation`, {
    searchParameters: { limit, skip }
  });
};

export const downloadGameModeratorActions = async (gameIdentifier: string, limit?: number, skip?: number) => {
  return await request<Paginated<ModeratorAction>>(encodePath`/games/${gameIdentifier}/moderation/download`, {
    searchParameters: { limit, skip }
  });
};

export const getModeratorActions = async (gameIdentifier: string, playerIdentifier: string, limit?: number, skip?: number) => {
  return await request<Paginated<ModeratorAction>>(encodePath`/games/${gameIdentifier}/players/${playerIdentifier}/moderation`, {
    searchParameters: { limit, skip }
  });
};

export const downloadModeratorActions = async (gameIdentifier: string, playerIdentifier: string, limit?: number, skip?: number) => {
  return await request<Paginated<ModeratorAction>>(encodePath`/games/${gameIdentifier}/players/${playerIdentifier}/moderation/download`, {
    searchParameters: { limit, skip }
  });
};
