// deno-lint-ignore-file
import postgresClient from "https://deno.land/x/postgresjs@v3.3.5/mod.js"

const environment = Deno.env.get("ENVIRONMENT") || "development";

if (environment === "development")
  Deno.env.set("TZ", "UTC");

const sql = postgresClient({
  hostname: Deno.env.get("POSTGRES_HOST") || "localhost",
  port: parseInt(Deno.env.get("POSTGRES_PORT") || "5432"),
  user: Deno.env.get("POSTGRES_USER") || "postgres",
  password: Deno.env.get("POSTGRES_PASSWORD") || "",
  database: Deno.env.get("POSTGRES_DB") || "bloxadmin",
  max: 10,
});

window.onunload = async () => {
  await sql.end();
}

export default (<T extends (object | undefined)>(
  ...args: Parameters<typeof sql> | unknown[]
) => {
  return sql<T[]>(...args as Parameters<typeof sql>);
});
