import "https://deno.land/std@0.195.0/dotenv/load.ts";

// * Util
import router from "./util/router.ts";

// * Middleware
import "./middleware/global.ts";

// * Routes
import "./routes/admin.ts";
import "./routes/datastores.ts";
import "./routes/events.ts";
import "./routes/games.ts";
import "./routes/graphs.ts";
import "./routes/players.ts";
import "./routes/roblox.ts";
import "./routes/scriptError.ts";
import "./routes/servers.ts";
import "./routes/users.ts";
import "./routes/notes.ts";
import "./routes/promoCodes.ts";
import "./routes/groups/groups.ts";
import "./routes/actions.ts";
// import "./discord/index.ts";

// * Jobs
import "./jobs/stale.ts";
import "./jobs/syncRoles.ts";
import "./jobs/syncMembers.ts";

onerror = (event) => {
  console.error(event.error);

  Deno.exit(1);
}

Deno.serve({
  handler: router.fetch
});
