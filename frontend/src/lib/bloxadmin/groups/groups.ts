import { encodePath, Paginated, request } from "../api";

export interface Group {
  id: number;
  name: string;
}

export interface UserGroup extends Group {
  role: {
    id: number;
    name: string;
  }
}

export interface GroupUser {
  id: number;
  name: string;
  role: {
    id: number;
    name: string;
  }
}

export interface GroupRole {
  id: number;
  name: string;
  rank: number;
  canViewGroup: boolean;
}

export const getGroups = async () => {
  return await request<UserGroup[]>(encodePath`groups`);
};

export const getGroup = async (groupId: number | string) => {
  return await request<UserGroup>(encodePath`groups/${groupId}`);
}

export const getGroupRoles = async (groupId: number | string) => {
  return await request<GroupRole[]>(encodePath`groups/${groupId}/roles`);
}

export const getGroupUsers = async (groupId: number | string, limit: number, skip: number, roles?: number[]) => {
  return await request<Paginated<GroupUser>>(encodePath`groups/${groupId}/users`, {
    searchParameters: {
      limit,
      skip,
      roles: roles?.join(","),
    }
  });
}
