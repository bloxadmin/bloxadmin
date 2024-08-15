import { encodePath, Paginated, request } from "./api";
import { Game, GameFeature } from "./games";

export interface AdminGame {
  id: number;
  rootPlaceId: number;
  name: string;
  ownerGroup?: {
    id: number;
    name: string;
  };
  ownerPlayer: {
    id: number;
    name: string;
  };
  features: GameFeature[];
  ingestKey: string;
  apiKeySet?: boolean;
  isSetup?: boolean;
  serverCount?: number;
  activeServerCount?: number;
  onlinePlayerCount?: number;
  active?: boolean;
}

export interface AdminUser {
  id: number;
  name: string;
}

export const getGamesAdmin = async (skip: number, limit: number, features?: GameFeature[]) => {
  return await request<Paginated<AdminGame>>("admin/games", {
    searchParameters: { skip, limit, features: features && features.join(',') }
  });
};

export const getGameAdmin = async (gameIdentifier: string) => {
  return await request<AdminGame>(encodePath`admin/games/${gameIdentifier}`);
}

export const updateGameAdmin = async (gameIdentifier: string, body: Partial<Game>) => {
  return await request<{ success: true }>(encodePath`admin/games/${gameIdentifier}`, {
    method: "PATCH",
    body,
  });
}

export const updateGameFromRobloxAdmin = async (gameIdentifier: string) => {
  return await request<{ success: true }>(encodePath`admin/games/${gameIdentifier}/update`, {
    method: "POST",
  });
}

export const getUsersAdmin = async (skip: number, limit: number) => {
  return await request<Paginated<AdminUser>>("admin/users", {
    searchParameters: { skip, limit }
  });
}
