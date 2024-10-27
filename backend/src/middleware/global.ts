// * Util
import router from "../util/router.ts";

// * Built-in Middleware
import { cors, logger } from "https://deno.land/x/hono@v2.7.0/middleware.ts";

// * Middleware
const API_URL = Deno.env.get("API_URL") || "https://api.bloxadmin.com";
const FRONTEND_URL = Deno.env.get("FRONTEND_URL") || "https://bloxadmin.com";

router.use("*",
  cors({
    origin: [API_URL, FRONTEND_URL],
    credentials: true
  })
);

if (Deno.env.get("ENABLE_LOGGING")) {
  router.use("*",
    logger()
  );
}
