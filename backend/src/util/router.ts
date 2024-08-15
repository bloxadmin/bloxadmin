import { Hono, Context as HonoContext, Next as HonoNext } from "https://deno.land/x/hono@v2.7.0/mod.ts";

import type { Bindings } from "https://deno.land/x/hono@v2.7.0/types.ts";
import type { JWTPayload } from 'https://deno.land/x/jose@v4.11.2/index.ts'
import type { User } from "../services/users.ts";
import type { AvatarHeadshotSize } from "../services/roblox.ts";
import { Permission } from "../services/security.ts";

export type Environment = {
  Bindings: Bindings;
  Variables: {
    auth?: JWTPayload;
    userId?: number;
    user?: User;
    admin: boolean;
    avatarSize?: AvatarHeadshotSize;
    permissions?: Permission[];
    ingestKey?: boolean;
  }
}

// deno-lint-ignore no-explicit-any
export type Schema = any;

export type Context = HonoContext<string, Environment, Schema>;
export type Next = HonoNext;

const router = new Hono<Environment, string, Schema>();

export default router;
