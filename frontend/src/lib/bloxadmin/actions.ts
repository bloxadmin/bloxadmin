import { encodePath, request } from "./api";

export type ActionParameterType = 'string' | 'number' | 'boolean' | 'player' | 'place';

export interface ActionParameterBase<TypeName, Type> {
  name: string;
  type: TypeName;
  default?: Type;
  required?: boolean;
}

export type ActionParameter =
  | ActionParameterBase<'string', string>
  | ActionParameterBase<'number', number>
  | ActionParameterBase<'boolean', boolean>
  | ActionParameterBase<'player', number>
  | ActionParameterBase<'place', number>;

export interface CreateAction {
  name: string;
  description?: string;
  parameters: ActionParameter[];
  firstServerId: string;
}

export interface Action extends CreateAction {
  id: string;
  created: Date;
  active: boolean;
  active_server_count: number;
}

export enum ActionStatus {
  Pending = 'pending',
  Running = 'running',
  Completed = 'completed',
  Failed = 'failed',
}

export interface ActionExecution {
  id: string;
  status: ActionStatus;
  serverId?: string;
  parameters?: Record<string, unknown>;
  output?: unknown;
  error?: unknown;
  user?: {
    id: string;
    name: string;
  };
}

export const getActions = async (gameIdentifier: string) => {
  return await request<Action[]>(encodePath`games/${gameIdentifier}/actions`, {});
};

export const getAction = async (gameIdentifier: string, actionIdentifier: string) => {
  return await request<Action>(encodePath`games/${gameIdentifier}/actions/${actionIdentifier.trim()}`);
}

export const getActionHisotry = async (gameIdentifier: string, actionName: string) => {
  return await request<Action>(encodePath`games/${gameIdentifier}/actions/${actionName.trim()}/history`);
}

export const updateAction = async (gameIdentifier: string, actionIdentifier: string, action: { description: string }) => {
  return await request<Action>(encodePath`games/${gameIdentifier}/actions/${actionIdentifier.trim()}`, {
    method: "PATCH",
    body: action
  });
}


// export const getScheduledActions = async (gameIdentifier: string) => {
//   return await request<ScheduledActions[]>(encodePath`games/${gameIdentifier}/schedules`, {});
// }

// export const createScheduledActions = async (gameIdentifier: string, scheduledActions: CreateScheduledActions & Partial<ScheduledActions>) => {
//   return await request<ScheduledActions>(encodePath`games/${gameIdentifier}/schedules`, {
//     method: "POST",
//     body: scheduledActions
//   });
// }

// export const updateScheduledActions = async (gameIdentifier: string, id: string, scheduledActions: Partial<ScheduledActions>) => {
//   return await request<ScheduledActions>(encodePath`games/${gameIdentifier}/schedules/${id}`, {
//     method: "PUT",
//     body: scheduledActions
//   });
// }
