import { request, AvatarSize, Paginated, encodePath } from "./api";

export interface Session {
  player?: {
    id: string;
    name: string;
  };
  sessionId: string;
  serverId: string;
  joinedAt: string;
  leftAt: string;
  playTime: number;
};

export interface Player {
  id: string;
  name: string;
  playtime: number;
  avatar: string;
  isBanned: boolean;
  isMuted: boolean;
  isOnline: boolean;
  mutedUntil?: string | -1;
  bannedUntil?: string | -1;
  firstJoinedAt: string;
  serverId?: string;
  joinedAt?: string;
};

export const getSessions = async (gameIdentifier: string, playerIdentifier: string, limit?: number, skip?: number) => {
  return await request<Paginated<Session>>(encodePath`games/${gameIdentifier}/players/${playerIdentifier}/sessions`, {
    searchParameters: { limit, skip }
  });
};

export const getPlayers = async (gameIdentifier: string, limit?: number, skip?: number, query?: string) => {
  return await request<Paginated<Player>>(encodePath`games/${gameIdentifier}/players`, {
    searchParameters: { query, limit, skip }
  });
};

export const getPlayer = async (gameIdentifier: string, playerIdentifier: string, avatarSize: AvatarSize = 48) => {
  return await request<Player>(encodePath`games/${gameIdentifier}/players/${playerIdentifier}`, {
    searchParameters: { size: avatarSize }
  });
};
