import "https://deno.land/std@0.195.0/dotenv/load.ts";
import { syncGroupRoleMembersJob } from "./jobs/syncMembers.ts";
import { syncGroupRolesJob } from "./jobs/syncRoles.ts";

await syncGroupRolesJob();
await syncGroupRoleMembersJob();

Deno.exit(0);
