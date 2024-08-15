export const API_BASE = import.meta.env.VITE_LOCAL
  ? "http://localhost:8000"
  : (
    window.location.hostname === "development.bloxadmin.pages.dev"
      ? "https://dev-api.bloxadmin.com"
      : "https://api.bloxadmin.com"
  );

export type ThumbnailSize =
  "30x30" |
  "42x42" |
  "50x50" |
  "60x62" |
  "75x75" |
  "110x110" |
  "140x140" |
  "150x150" |
  "160x100" |
  "160x600" |
  "250x250" |
  "256x144" |
  "300x250" |
  "304x166" |
  "384x216" |
  "396x216" |
  "420x420" |
  "480x270" |
  "512x512" |
  "576x324" |
  "700x700" |
  "728x90" |
  "768x432" |
  "1200x80";

export type AvatarSize =
  48 |
  50 |
  60 |
  75 |
  100 |
  110 |
  150 |
  180 |
  352 |
  420 |
  720;

export type IconSize =
  50 |
  128 |
  150 |
  256 |
  512;

export interface Paginated<Type> {
  total: number;
  limit: number;
  skip: number;
  data: Type[];
};

interface NormalizedResponseBase {
  status: number;
  raw: string;
};

interface NormalizedOkResponse<Type> extends NormalizedResponseBase {
  ok: true;
  body: Type;
}

interface NormalizedErrorResponse extends NormalizedResponseBase {
  ok: false;
  body: undefined;
}

type NormalizedResponse<Type> = NormalizedOkResponse<Type> | NormalizedErrorResponse;


const normalizeResponse = async <Type>(response: Response): Promise<NormalizedResponse<Type>> => {
  const { ok, status } = response;

  const raw = await response.text();

  let body: Type;

  try {
    body = JSON.parse(raw);
  } catch (error) {
    return { ok: false, status, raw, body: undefined };
  }

  return { ok: true, status, body, raw };
};

type SearchParameters = {
  [key: string]: string | number | undefined
};

const defaultRequestOptions: RequestOptions = {
  includeCredentials: true,
  method: "GET"
};

export const encodePath = (strings: TemplateStringsArray, ...values: any[]) => {
  return strings.reduce((previousString, currentString, index) => {
    return previousString += index === 0 ? currentString : encodeURIComponent(values[index - 1]) + currentString
  });
};

const buildURL = (path: string, searchParameters?: SearchParameters) => {
  const url = new URL(path, API_BASE);

  for (const key in searchParameters) {
    const value = searchParameters[key]?.toString();

    if (!value) continue;

    url.searchParams.set(key, value);
  }

  return url.toString();
};

export interface RequestOptions {
  includeCredentials?: boolean;
  searchParameters?: SearchParameters;
  method?: string;
  body?: any;
};

export const request = async <Type>(path: string, requestOptions?: RequestOptions) => {
  const options = requestOptions ? { ...defaultRequestOptions, ...requestOptions } : defaultRequestOptions;

  const url = buildURL(path, options.searchParameters);

  const response = await fetch(url, {
    method: options.method,
    credentials: options.includeCredentials ? "include" : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  return normalizeResponse<Type>(response);
};
