import { defineStore } from "pinia";
import { ref } from "vue";
import { Message, Player } from "../lib/bloxadmin";

const useChatStore = defineStore("chat", () => {
  const serverIdentifier = ref<string | null>(null);
  const gameIdentifier = ref<string | null>(null);

  const messages = ref<Message[]>([]);
  const players = ref<Player[]>([]);

  const closedAt = ref<string | null>(null);

  const eventSource = ref<EventSource | null>(null);

  const handleMessage = (event: MessageEvent): void => {
    const { type, time, data } = JSON.parse(event.data);
    
    if (type === "playerJoin") {
      players.value.push(data.player);
    }
  
    if (type === "playerLeave") {
      const index = players.value.findIndex(player => player.id === data.playerId);
      players.value.splice(index as number, 1);
    }
  
    if (type === "playerChat") {
      const { message, playerId } = data;
      const player = players.value.find(player => player.id === playerId) as Player;
      messages.value.push({ time, message, player });
    }

    if (type === "serverClose") {
      closedAt.value = time;
    }
  };

  const setServer = (_gameIdentifier: string, _serverIdentifier: string, _players: Player[], _messages: Message[], _eventSource: EventSource, _closedAt: string | null) => {
    eventSource.value?.close();

    eventSource.value = _eventSource;
    eventSource.value.addEventListener("message", handleMessage);

    gameIdentifier.value = _gameIdentifier;
    serverIdentifier.value = _serverIdentifier as string;

    messages.value = _messages;
    players.value = _players;

    closedAt.value = _closedAt;
  };

  const clear = (close?: boolean) => {
    serverIdentifier.value = null;
    gameIdentifier.value = null;

    messages.value = [];
    players.value = [];

    eventSource.value?.removeEventListener("message", handleMessage);
    if (close) eventSource.value?.close();
    eventSource.value = null;
  };

  return { messages, players, setServer, clear, serverIdentifier, gameIdentifier, eventSource, closedAt };
});

export default useChatStore;
