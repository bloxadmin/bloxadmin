export const ENABLE_LOGGING = Deno.env.get("ENABLE_LOGGING");

let debugNum = 0;

export function debug() {
  return debugNum++;
}

export function jsonStringify<T>(data: T, indent = false): JsonString<T> {
  return JSON.stringify(data, null, indent ? 2 : undefined) as JsonString<T>;
}

export function jsonParse<T extends JsonString<unknown>>(data: T): InferJsonString<T> {
  return JSON.parse(data);
}
