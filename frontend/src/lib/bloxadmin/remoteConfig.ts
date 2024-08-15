import { encodePath, request } from "./api";

export type RemoteConfig = {
  [key: string]: string | null;
};

export const getRemoteConfig = async (gameIdentifier: string) => {
  return await request<RemoteConfig>(encodePath`games/${gameIdentifier}/config`);
};

export const updateRemoteConfig = async (gameIdentifier: string, remoteConfig: RemoteConfig) => {
  return await request<RemoteConfig>(encodePath`games/${gameIdentifier}/config`, {
    method: "PUT",
    body: remoteConfig
  });
};
