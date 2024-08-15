import * as jose from 'https://deno.land/x/jose@v4.11.2/index.ts'
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

export type URN = `urn:bloxadmin:${string}`;

const VALID_EMOJIS = '🚗 🚓 🚕 🛺 🚙 🛻 🚌 🚐 🚎 🚑 🚒 🚚 🚛 🚜 🚘 🚔 🚖 🚍 🦽 🦼 🛹 🛼 🚲 🛴 🛵 🏍️ 🏎️ 🚄 🚅 🚈 🚝 🚞 🚃 🚋 🚆 🚉 🚊 🚇 🚟 🚠 🚡 🚂 🛩️ 🪂 ✈️ 🛫 🛬 💺 🚁 🚀 🛸 🛰️ ⛵ 🚤 🛥️ ⛴️ 🛳️ 🚢 ⚓ 🚏 ⛽ 🚨 🚥 🚦 🚧 🌌 🪐 🌍 🌎 🌏 🗺️ 🧭 🏔️ ⛰️ 🌋 🗻 🛤️ 🏕️ 🏞️ 🛣️ 🏖️ 🏜️ 🏝️ 🏟️ 🏛️ 🏗️ 🏘️ 🏙️ 🏚️ 🏠 🏡 ⛪ 🕋 🕌 🛕 🕍 ⛩️ 🏢 🏣 🏤 🏥 🏦 🏨 🏩 🏪 🏫 🏬 🏭'.split(' ');
const secret = new TextEncoder().encode(
  Deno.env.get('JWT_SECRET') || 'xJegEp75HTAjc9Ky',
);
const alg = 'HS256';

export function generateSalt(): string {
  return bcrypt.genSaltSync(10);
}

function getSaltedSecret(salt: string) {
  const saltBin = new TextEncoder().encode(salt);

  // concat the salt with the secret
  const saltedSecret = new Uint8Array(saltBin.length + secret.length);
  saltedSecret.set(saltBin);
  saltedSecret.set(secret, saltBin.length);

  return saltedSecret;
}

export function getTokenPayload(token: string): jose.JWTPayload {
  return JSON.parse(new TextDecoder().decode(jose.base64url.decode(token.split('.')[1])));
}

export async function verifyToken(token: string): Promise<jose.JWTPayload> {
  const { payload } = await jose.jwtVerify(token, secret, {
    issuer: 'urn:bloxadmin:api',
    audience: 'urn:bloxadmin:api',
  });

  return payload;
}

export async function verifyOAuthStateToken(token: string): Promise<jose.JWTPayload> {
  const { payload } = await jose.jwtVerify(token, secret, {
    issuer: 'urn:bloxadmin:api',
    audience: 'urn:bloxadmin:external_oauth',
  });

  return payload;
}

export async function verifyResetToken(salt: string, token: string): Promise<jose.JWTPayload | undefined> {
  try {
    const { payload } = await jose.jwtVerify(token, getSaltedSecret(salt), {
      issuer: 'urn:bloxadmin:api',
      audience: 'urn:bloxadmin:reset',
    });

    return payload;
  } catch (_e) {
    return undefined;
  }
}

export async function verifyRegisterToken(token: string, checkText: string): Promise<boolean> {
  const { payload } = await jose.jwtVerify(token, secret, {
    issuer: 'urn:bloxadmin:api',
    audience: 'urn:bloxadmin:register',
  });

  const code = payload["urn:bloxadmin:register_code"] as string | undefined;

  if (!code || !checkText.includes(code)) {
    return false;
  }

  return true;
}

export async function signToken(subject: URN, payload: Record<URN, unknown>) {
  return await new jose.SignJWT(payload)
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setIssuer('urn:bloxadmin:api')
    .setAudience('urn:bloxadmin:api')
    .setSubject(subject)
    .setExpirationTime('1y')
    .sign(secret)
}

export async function signOAuthStateToken(subject: URN, payload: Record<URN, unknown>) {
  return await new jose.SignJWT(payload)
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setIssuer('urn:bloxadmin:api')
    .setAudience('urn:bloxadmin:external_oauth')
    .setSubject(subject)
    .setExpirationTime('24h')
    .sign(secret)
}

export async function signResetToken(salt: string, subject: URN, payload: Record<URN, unknown>) {
  return await new jose.SignJWT(payload)
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setIssuer('urn:bloxadmin:api')
    .setAudience('urn:bloxadmin:reset')
    .setSubject(subject)
    .setExpirationTime('1h')
    .sign(getSaltedSecret(salt));
}

export async function generateRegisterToken(subject: URN, payload: Record<URN, unknown>) {
  const code = Array(8).fill(0).map(() => VALID_EMOJIS[Math.floor(Math.random() * VALID_EMOJIS.length)]).join('');
  payload = {
    ...payload,
    "urn:bloxadmin:register_code": code,
  };
  const token = await new jose.SignJWT(payload)
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setIssuer('urn:bloxadmin:api')
    .setAudience('urn:bloxadmin:register')
    .setSubject(subject)
    .setExpirationTime('10m')
    .sign(secret);

  return {
    code,
    token,
  }
}

export async function verifyUserPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  try {
    // deno-lint-ignore no-explicit-any
    if ((globalThis as any).Worker === undefined)
      return bcrypt.compareSync(password, hash);

    return await bcrypt.compare(password, hash);
  } catch (_error) {
    console.error(_error)
    return false;
  }
}

export async function hashUserPassword(password: string): Promise<string> {
  // deno-lint-ignore no-explicit-any
  const salt = (globalThis as any).Worker === undefined
    ? bcrypt.genSaltSync(10)
    : await bcrypt.genSalt(10);

  // deno-lint-ignore no-explicit-any
  if ((globalThis as any).Worker === undefined)
    return bcrypt.hashSync(password, salt);

  return await bcrypt.hash(password, salt);
}

export async function generateServerIngestToken(gameId: number | string, serverId: string, payload: Record<URN, unknown> = {}) {
  return await new jose.SignJWT(payload)
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setIssuer('urn:bloxadmin:api')
    .setAudience('urn:bloxadmin:ingest')
    .setSubject(`urn:bloxadmin:server:${gameId}:${serverId}`)
    .setExpirationTime('1y')
    .sign(secret);
}

export async function verifyServerIngestToken(token: string, gameId: number | string, serverId: string) {
  try {
    await jose.jwtVerify(token, secret, {
      issuer: 'urn:bloxadmin:api',
      audience: 'urn:bloxadmin:ingest',
      subject: `urn:bloxadmin:server:${gameId}:${serverId}`,
    });
  } catch (_e) {
    return false;
  }

  return true;
}
