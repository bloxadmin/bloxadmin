// * Util
import router from "../util/router.ts";

// * Built-in Middleware
import { cors, logger } from "https://deno.land/x/hono@v2.7.0/middleware.ts";

// * Middleware

router.use("*",
  cors({
    origin: ["https://api.bloxadmin.com", "https://dev-api.bloxadmin.com", "https://bloxadmin.com", "https://www.bloxadmin.com", "http://localhost:8000", "http://localhost:5173", "https://development.bloxadmin.pages.dev"],
    credentials: true
  })
);

if (Deno.env.get("ENABLE_LOGGING")) {
  router.use("*",
    logger()
  );
}
