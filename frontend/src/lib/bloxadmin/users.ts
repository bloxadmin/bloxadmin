import { AvatarSize, request } from "./api";

export enum GlobalPermission {
  Administrator = "*", // All permissions
  CreateUsers = "create_users", // Create users
}

export interface User {
  id: number;
  name: string;
  email: string;
  admin?: boolean;
  discord?: {
    id: string;
    displayName: string;
    name: string;
    avatar: string;
  }
};

export const getUser = async () => {
  return await request<User>("auth/user");
};

export const signOut = async () => {
  return await request("auth/signout");
}

export const updateDiscordIntegration = async (): Promise<boolean> => {
  const result = await request<boolean>("discord/update", {});

  return result.ok ? !!result.body : false;
}
