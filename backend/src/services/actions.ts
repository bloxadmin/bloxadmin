import { jsonParse, jsonStringify } from "../consts.ts";
import postgres from "../util/postgres.ts";

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
  Stalled = 'stalled',
}

export interface ActionExecution {
  id: string;
  status: ActionStatus;
  created: Date;
  serverId?: string;
  parameters?: Record<string, unknown>;
  output?: unknown;
  error?: unknown;
  user?: {
    id: string;
    name: string;
  };
}

interface DatabaseAction {
  id: string;
  game_id: string;
  name: string;
  description: string;
  active: boolean;
  parameters: JsonString<ActionParameter[]>;
  created: Date;
  first_server_id: string;
  active_server_count: string | null;
}

interface DatabaseActionExecution {
  id: string;
  game_id: string;
  action_id: string;
  action: string;
  status: ActionStatus;
  created: Date;
  started: Date | null;
  finished: Date | null;
  parameters?: JsonString<Record<string, unknown>>;
  server_id: string | null;
  output: JsonString<unknown>;
  error: JsonString<unknown>;
  user_id: string | null;
  user_name: string | null;
}

function databaseToAction(record: DatabaseAction): Action {
  return {
    id: record.id,
    name: record.name,
    description: record.description,
    active: record.active,
    parameters: jsonParse(record.parameters),
    created: record.created,
    firstServerId: record.first_server_id,
    active_server_count: record.active_server_count ? parseInt(record.active_server_count) : 0,
  };
}

function databaseToActionExecution(record: DatabaseActionExecution): ActionExecution {
  const stalled = record.status === 'pending' && record.created < new Date(Date.now() - 1000 * 60 * 60);
  return {
    id: record.id,
    status: stalled ? ActionStatus.Stalled : record.status,
    parameters: record.parameters ? jsonParse(record.parameters) : undefined,
    serverId: record.server_id || undefined,
    created: record.created,
    output: record.output !== '' && typeof record.output === 'string'
      ? jsonParse(record.output) : undefined,
    error: record.error !== '' && typeof record.error === 'string'
      ? jsonParse(record.error) : undefined,
    user: record.user_id && record.user_name ? { id: record.user_id, name: record.user_name } : undefined,
  };
}

export async function getActions(gameId: RobloxID): Promise<Action[]> {
  const records = await postgres<DatabaseAction>`
    SELECT
      game_actions.id,
      game_actions.name,
      game_actions.description,
      game_actions.parameters,
      game_actions.created,
      game_actions.first_server_id,
      c.active_server_count
    FROM game_actions
    LEFT JOIN (SELECT action_id, COUNT(*) as active_server_count
               FROM game_action_servers
                        LEFT JOIN game_servers ON game_action_servers.server_id = game_servers.id
               WHERE game_servers.game_id = ${gameId}
                 AND game_servers.closed_at IS NULL
                 AND game_servers.last_heartbeat > NOW() - INTERVAL '3 minutes'
               GROUP BY action_id) c ON game_actions.id = c.action_id
    WHERE game_id = ${gameId} AND active = true
    ORDER BY created
  `;

  return records.map(databaseToAction);
}

export async function getAction(gameId: RobloxID, actionId: string): Promise<Action | null> {
  const [record] = await postgres<DatabaseAction>`
    SELECT
      game_actions.id,
      game_actions.name,
      game_actions.description,
      game_actions.parameters,
      game_actions.created,
      game_actions.first_server_id,
      c.active_server_count
    FROM game_actions
    LEFT JOIN (SELECT action_id, COUNT(*) as active_server_count
               FROM game_action_servers
                        LEFT JOIN game_servers ON game_action_servers.server_id = game_servers.id
               WHERE game_servers.closed_at IS NULL
                 AND game_servers.last_heartbeat > NOW() - INTERVAL '3 minutes'
               GROUP BY action_id) c ON game_actions.id = c.action_id
    WHERE game_actions.game_id = ${gameId} AND game_actions.id = ${actionId}
  `;

  if (!record)
    return null;

  return databaseToAction(record)
}

export async function getActionsByName(gameId: RobloxID, name: string): Promise<Action[]> {
  const records = await postgres<DatabaseAction>`
    SELECT
      id,
      name,
      description,
      parameters,
      created,
      first_server_id
    FROM game_actions
    WHERE game_id = ${gameId} AND name = ${name} AND active = true
    ORDER BY created
  `;

  return records.map(databaseToAction);
}

export async function createAction(gameId: RobloxID, action: CreateAction): Promise<string> {
  const records = await postgres<DatabaseAction>`
    INSERT INTO game_actions (game_id, name, description, parameters, first_server_id)
    VALUES (${gameId}, ${action.name}, ${action.description || ''}, ${jsonStringify(action.parameters)}, ${action.firstServerId})
    RETURNING id
  `;

  return records[0].id;
}

export async function updateActionDescription(gameId: RobloxID, actionId: string, description: string) {
  await postgres`
    UPDATE game_actions
    SET description = ${description}
    WHERE game_id = ${gameId} AND id = ${actionId}
  `;
}

export async function updateActionActive(gameId: RobloxID, actionId: string, active: boolean) {
  await postgres`
    UPDATE game_actions
    SET active = ${active}
    WHERE game_id = ${gameId} AND id = ${actionId}
  `;
}

export async function attachServerToAction(gameId: RobloxID, actionId: string, serverId: string) {
  console.log('attachServerToAction', gameId, actionId, serverId)
  await postgres`
    INSERT INTO game_action_servers (game_id, action_id, server_id)
    VALUES (${gameId}, ${actionId}, ${serverId})
    ON CONFLICT DO NOTHING
  `;
}

export async function detachServerFromActions(gameId: RobloxID, serverId: string) {
  await postgres`
    DELETE FROM game_action_servers
    WHERE game_id = ${gameId} AND server_id = ${serverId}
  `;
}

export async function getServerActions(serverId: string): Promise<Action[]> {
  const records = await postgres<DatabaseAction>`
    SELECT
      ga.id,
      ga.name,
      ga.description,
      ga.parameters,
      ga.created,
      ga.first_server_id
    FROM game_actions ga
    JOIN game_action_servers gas ON ga.id = gas.action_id
    WHERE gas.server_id = ${serverId}
    ORDER BY ga.created
  `;

  return records.map(databaseToAction);
}

export async function getActionExecutions(gameId: RobloxID, actionName: string): Promise<ActionExecution[]> {
  const records = await postgres<DatabaseActionExecution>`
    SELECT
      execution.id,
      execution.status,
      execution.server_id,
      execution.parameters,
      execution.output,
      execution.error,
      execution.created,
      user_id,
      player.name as user_name
    FROM game_action_executions execution
    LEFT JOIN players player ON player.id = execution.user_id
    LEFT JOIN game_actions action ON action.id = execution.action_id
    WHERE execution.game_id = ${gameId} AND action.name = ${actionName}
    ORDER BY execution.created DESC
  `;

  return records.map(databaseToActionExecution);
}

export async function getActionExecution(gameId: RobloxID, actionName: string, executionId: string): Promise<ActionExecution | null> {
  const [record] = await postgres<DatabaseActionExecution>`
    SELECT
      execution.id,
      execution.status,
      execution.server_id,
      execution.parameters,
      execution.output,
      execution.error,
      execution.created,
      user_id,
      player.name as user_name
    FROM game_action_executions execution
    LEFT JOIN players player ON player.id = execution.user_id
    LEFT JOIN game_actions action ON action.id = execution.action_id
    WHERE execution.game_id = ${gameId} AND action.name = ${actionName} AND execution.id = ${executionId}
  `;

  if (!record)
    return null;

  return databaseToActionExecution(record);
}

export async function createActionExecution(gameId: RobloxID, actionId: string, action: string, serverId: string, parameters: Record<string, unknown>): Promise<string> {
  const records = await postgres<DatabaseActionExecution>`
    INSERT INTO game_action_executions (game_id, action_id, action, status, parameters, server_id)
    VALUES (${gameId}, ${actionId}, ${action}, ${ActionStatus.Pending}, ${jsonStringify(parameters)}, ${serverId})
    RETURNING id
  `;

  return records[0].id;
}

export async function updateActionExecutionStatus(gameId: RobloxID, executionId: string, status: ActionStatus, output: unknown, error: unknown) {
  await postgres`
    UPDATE game_action_executions
    SET status = ${status}, output = ${JSON.stringify(output ?? null)}, error = ${JSON.stringify(error ?? null)}
    WHERE game_id = ${gameId} AND id = ${executionId}
  `;
}
