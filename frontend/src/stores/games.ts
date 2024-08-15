import { defineStore } from "pinia";
import { ref } from "vue";
import { Game, getGame, getGames } from "../lib/bloxadmin";

function isExpired(date: Date | undefined): boolean {
  return !date || (new Date().getTime() - date.getTime()) > 1000 * 60;
}

const useGamesStore = defineStore("games", () => {
  const gamesList = ref<Game[]>([]);
  const loaded = ref<number>(0);
  const game = ref<Game | null>(null);

  const refreshGames = async (): Promise<void> => {
    const { ok, body } = await getGames();

    if (!ok || !body)
      return;

    const now = new Date();

    body.forEach(g => {
      g.requestAt = now;

      if (g.id === game.value?.id && JSON.stringify(g) !== JSON.stringify(game.value))
        game.value = g;
    })

    gamesList.value = body;
    loaded.value = now.getTime();
  }

  const refreshGame = async (gameIdentifier: string): Promise<Game | null> => {
    const { ok, body } = await getGame(gameIdentifier);

    if (!ok || !body)
      return null;

    const now = new Date();

    body.requestAt = now;

    const gameIndex = gamesList.value.findIndex(game => game.id === body.id);

    if (gameIndex === -1)
      gamesList.value.push(body);
    else
      gamesList.value[gameIndex] = body;

    if (game.value?.id === body.id)
      game.value = body;

    return body;
  }

  const Games = async (): Promise<Game[]> => {
    if (!loaded.value || isExpired(new Date(loaded.value)))
      await refreshGames();

    return gamesList.value;
  }

  const Game = async (gameIdentifier: string | number): Promise<Game | null> => {
    if (!loaded.value)
      await refreshGames();

    const game = gamesList.value.find(game => game.id === Number(gameIdentifier));

    if (!game || isExpired(game.requestAt)) {
      return await refreshGame(String(gameIdentifier));
    }

    return game;
  }

  return { gamesList, Games, loaded, Game, refreshGames, refreshGame, game };
});

export default useGamesStore;
