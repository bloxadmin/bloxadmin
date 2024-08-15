const ENVIRONMENT = Deno.env.get("ENVIRONMENT") || "development";
const RUN_CRON = Deno.env.get("RUN_CRON");

export default function cron(name: string, cronString: string, callback: () => void) {
  if (ENVIRONMENT !== "development")
    return Deno.cron(name, cronString, callback);

  return Deno.cron(name, cronString, () => {
    console.log(`[CRON] ${name} ${cronString} ${RUN_CRON ? "RUNNING" : "SKIPPED"}`);
    if (RUN_CRON)
      return callback();
  });
}
