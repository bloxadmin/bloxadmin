import { request, encodePath } from "./api";

export interface DataStore {
  name: string;
  addedAt?: Date;
};

export interface DataStoreResult {
  datastores: DataStore[];
  nextPageCursor?: string;
};

export interface DataStoreEntriesResult {
  keys: string[];
  nextPageCursor?: string;
};

export interface DataStoreEntry<Type> {
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
  key: string;
  detectedSchemaType?: "ProfileService" | "DataStore2";
  data: Type | undefined;
};

export interface DataStoreEntryVersion {
  version: string;
  deleted: boolean;
  contentLength: number;
  addedAt: Date;
  dataStoreAddedAt: Date;
};

export const getDataStores = async (gameIdentifier: string, prefix?: string, cursor?: string) => {
  return await request<DataStoreResult>(encodePath`games/${gameIdentifier}/datastores`, {
    searchParameters: { cursor, prefix, limit: 100 }
  });
};

export const getDataStoreEntries = async (gameIdentifier: string, dataStoreName: string, prefix?: string, scope?: string, cursor?: string) => {
  return await request<DataStoreEntriesResult>(encodePath`games/${gameIdentifier}/datastores/${dataStoreName}/entries`, {
    searchParameters: { cursor, prefix, scope, limit: 100 }
  });
};

export const getDataStoreEntry = async <Type = unknown>(gameIdentifier: string, dataStoreName: string, key: string, scope?: string) => {
  return await request<DataStoreEntry<Type>>(encodePath`games/${gameIdentifier}/datastores/${dataStoreName}/entries/${key}`, {
    searchParameters: { scope }
  });
};
