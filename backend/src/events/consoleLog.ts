// import { recordConsoleLog } from "../services/consoleLog.ts";
import { EventChannel, ServerEventContext } from "../services/events.ts";

export interface ConsoleLogEventData {
  message: string,
  messageType: string
}

// TODO: eventually rename these to align more with LogService stuff
export default function handleConsoleLogEvent({ data, serverId, time }: ServerEventContext<ConsoleLogEventData>) {
  // TODO: Integrate with pro -> delete after
  // await recordConsoleLog(serverId, data);

  /*
  const channel = EventChannel.for(serverId, "consoleLog");

  channel.sendEvent({
    type: "consoleLog",
    time: time,
    data: data
  });
  */
}
