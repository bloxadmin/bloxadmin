
const ZYTE_KEY = Deno.env.get('ZYTE_API_KEY') || '';
const ZYTE_AUTH = btoa(`${ZYTE_KEY}:`);

export function proxyFetch(input: RequestInfo | URL, init?: RequestInit<RequestInitCfProperties> | undefined): Promise<Response> {
  const url = typeof input === 'string' || input instanceof URL ? input : input.url;
  return fetch("https://api.zyte.com/v1/extract", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Basic ${ZYTE_AUTH}`
    },
    body: JSON.stringify({
      url,
      httpResponseBody: true,
      httpResponseHeaders: true,
      httpRequestMethod: init?.method || "GET",
      httpRequestText: init?.body?.toString(),
      customHttpRequestHeaders: Object.entries(init?.headers || {}).map(([name, value]) => ({ name, value }))
    }),
  }).then(async (r) => {
    const proxyResponse = await r.json() as {
      httpResponseBody: string,
      httpResponseHeaders: { name: string, value: string }[],
      statusCode: number,
      url: string,
    }
    const encodedBody = proxyResponse.httpResponseBody;
    const body = atob(encodedBody);

    return new Response(body, {
      status: proxyResponse.statusCode,
      headers: new Headers(proxyResponse.httpResponseHeaders.reduce((acc, { name, value }) => ({ ...acc, [name]: value }), {})),
    });
  })
}
