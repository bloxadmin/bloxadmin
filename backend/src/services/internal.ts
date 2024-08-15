import { Message } from "../discord/types.ts";

const WEBHOOK_URL = Deno.env.get("INTERNAL_DISCORD_WEBHOOK_URL");

export async function internalDiscordAlert(data: Partial<Message>) {
  if (!WEBHOOK_URL) return;

  await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}
