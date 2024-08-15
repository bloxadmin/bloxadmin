import { encodePath, Paginated, request } from "./api";

interface Dates {
  created: Date,
  updated: Date
}

export interface ScriptError extends Dates {
  id: string,
  gameId: number,
  script?: string,
  message: string,
  stack: string,
  environment: "client" | "server",
  occurrences: number,
  placeVersion: number,
  assigneeId?: number,
  resolved: boolean
}

export const getScriptErrors = async (gameIdentifier: string, limit: number, skip: number, resolved: boolean) => {
  return await request<Paginated<ScriptError>>(encodePath`games/${gameIdentifier}/errors`, {
    searchParameters: { limit, skip, resolved: resolved ? "true" : "false" }
  });
};

export const resolveScriptError = async (gameIdentifier: string, errorId: string, resolved: boolean) => {
  return await request<ScriptError>(encodePath`games/${gameIdentifier}/errors/${errorId}`, {
    method: "PATCH",
    body: { resolved }
  });
}

export const assignScriptError = async (gameIdentifier: string, errorId: string, assignee: number) => {
  return await request<ScriptError>(encodePath`games/${gameIdentifier}/errors/${errorId}`, {
    method: "PATCH",
    body: { assignee }
  });
}

export const deleteScriptError = async (gameIdentifier: string, errorId: string) => {
	return await request(encodePath`games/${gameIdentifier}/errors/${errorId}`, {
		method: "DELETE"
	});
};
