import { equal } from "https://deno.land/x/equal@v1.5.0/mod.ts";
import { ActionStatus, attachServerToAction, createAction, getActionsByName, updateActionExecutionStatus } from "../services/actions.ts";
import { EventContext } from "../services/events.ts";
import { ActionEventType, EventActionsResult, EventActionsSave, EventData, EventType } from "../services/serverEvents.ts";
import { updateActionActive } from "../services/actions.ts";

async function handleActionsSave({ gameId, serverId }: EventContext, [name, parameters]: EventActionsSave): Promise<boolean> {

  const actions = await getActionsByName(gameId, name);

  const existing = actions.find(action => equal(action.parameters, parameters));


  if (existing) {
    await attachServerToAction(gameId, existing.id, serverId);
  } else {
    // Deactivate all other active actions with the same name (should only be one, but just in case)
    await Promise.all(actions.map(action => updateActionActive(gameId, action.id, false)));

    const id = await createAction(gameId, {
      name,
      parameters,
      firstServerId: serverId,
    });

    await attachServerToAction(gameId, id, serverId);
  }

  return true;
}

async function handleActionResult(eventContext: EventContext, [id, success, result]: EventActionsResult): Promise<boolean> {
  const error = success ? null : result;
  const output = success ? result : null;

  await updateActionExecutionStatus(eventContext.gameId, id, success ? ActionStatus.Completed : ActionStatus.Failed, output, error);

  return true;
}

export default function handleActionsMessage(eventContext: EventContext, message: EventData[EventType.Actions]): Promise<boolean> {
  const [eventType, ...args] = message;

  if (eventType === ActionEventType.Save) {
    return handleActionsSave(eventContext, args as EventActionsSave);
  } else if (eventType === ActionEventType.Result) {
    return handleActionResult(eventContext, args as EventActionsResult);
  } 

  return Promise.resolve(false);
}
