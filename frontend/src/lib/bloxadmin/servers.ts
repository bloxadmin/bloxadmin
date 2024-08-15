import { request, API_BASE, Paginated, encodePath } from "./api";
import { Player, Session } from "./players";

export interface Message {
  player: Player;
  message: string;
  time: string;
};

export interface Server {
  id: string;
  startedAt: string;
  lastHeartbeatAt: string;
  onlinePlayers: Player[];
  isPrivate: boolean;
  privateServerId?: string;
  placeVersion: number;
  scriptVersion: number;
  closedAt?: string;
};

export const getServer = async (gameIdentifier: string, serverIdentifier: string) => {
  return await request<Server>(encodePath`games/${gameIdentifier}/servers/${serverIdentifier}`);
};

export const shutdownServer = async (gameIdentifier: string, serverIdentifier: string) => {
  return await request<never>(encodePath`games/${gameIdentifier}/servers/${serverIdentifier}/shutdown`, {
    method: "POST",
    body: "{}"
  });
};

export const getChat = async (gameIdentifier: string, serverIdentifier: string) => {
  return await request<Paginated<Message>>(encodePath`games/${gameIdentifier}/servers/${serverIdentifier}/chat`);
};

export const getServerEventSource = (gameIdentifier: string, serverIdentifier: string): EventSource => {
  return new EventSource(API_BASE + encodePath`/games/${gameIdentifier}/servers/${serverIdentifier}/events`, {
    withCredentials: true
  });
};

export const getServers = async (gameIdentifier: string, limit: number, skip: number) => {
  return await request<Paginated<Server>>(encodePath`games/${gameIdentifier}/servers`, {
    searchParameters: { limit, skip }
  });
};

export const getServerSessions = async (gameIdentifier: string, serverIdentifier: string, limit?: number, skip?: number) => {
  return await request<Paginated<Session>>(encodePath`games/${gameIdentifier}/servers/${serverIdentifier}/sessions`, {
    searchParameters: { limit, skip }
  });
};
