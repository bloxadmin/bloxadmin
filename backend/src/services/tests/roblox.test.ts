import { assert } from "https://deno.land/std@0.167.0/testing/asserts.ts";
import { getRobloxGame } from "../roblox.ts";

Deno.test("Gets a roblox game", async () => {
  const game = await getRobloxGame(1618310390);

  assert(game && game.id === 1618310390);
});
