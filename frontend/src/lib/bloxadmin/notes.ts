import { encodePath, Paginated, request } from "./api";

export type ResourceType = "groups";

export interface Note {
  user: {
    id: number,
    name: string,
  };
  note: string,
  createdAt: string,
  type?: string,
  recipient?: string,
}

const getNotes = async (namespace: string, resourceType: ResourceType, resourceId: number | string, type?: string) => {
  return await request<Paginated<Note>>(encodePath`notes/${namespace}/${resourceType}/${resourceId}`, {
    searchParameters: {
      type,
    }
  });
};

const postNote = async (namespace: string, resourceType: ResourceType, resourceId: number | string, note: string, type?: string, recipient?: string) => {
  return await request<Note>(encodePath`notes/${namespace}/${resourceType}/${resourceId}`, {
    method: "POST",
    body: {
      note,
      type,
      recipient,
    }
  });
}

export const getGroupNotes = async (groupId: number | string) => {
  return await getNotes(`group:${groupId}`, "groups", groupId);
};

export const postGroupNote = async (groupId: number | string, note: string) => {
  return await postNote(`group:${groupId}`, "groups", groupId, note);
}
