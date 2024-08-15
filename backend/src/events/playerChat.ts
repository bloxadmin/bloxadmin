import { addPlayerMessage } from "../services/chat.ts";
import { EventChannel, ServerEventContext } from "../services/events.ts";

export interface PlayerChatEventData {
  message: string;
  recipientId?: number;
  source?: "game" | "dashboard" | "discord" | "actions";
}

export default async function handlePlayerChatEvent({ gameId, serverId, time, data, segments }: ServerEventContext<PlayerChatEventData>) {
  await addPlayerMessage(gameId, serverId, time, Number(segments.player), data.message, data.recipientId);

  const channel = EventChannel.for(serverId, "players");

  channel.sendEvent({
    type: "playerChat",
    time,
    data: {
      playerId: Number(segments.player),
      message: data.message,
      recipientId: data.recipientId,
    }
  });
}
