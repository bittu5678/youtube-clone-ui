/**
 * FaceTube - Safe Hostinger Reverse Proxy Handler
 *
 * When USE_REMOTE_PHP_API=true is explicitly configured, forwards server-side
 * requests targeting /api/* to the authoritative Hostinger PHP backend at
 * https://api.facetube.online/*, stripping exactly one leading /api prefix.
 */

export const HOSTINGER_API_ORIGIN = "https://api.facetube.online";

const HOP_BY_HOP_HEADERS = new Set([
  "host",
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "content-length",
]);

/**
 * Strips exactly one leading '/api' prefix from a pathname.
 * Examples:
 *   /api/auth/me.php -> /auth/me.php
 *   /api/videos/list.php -> /videos/list.php
 *   /api -> /
 *   /api/ -> /
 *   /api/nested/api/test.php -> /nested/api/test.php
 */
export function stripApiPrefix(pathname: string): string {
  if (pathname === "/api" || pathname === "/api/") {
    return "/";
  }
  if (pathname.startsWith("/api/")) {
    return pathname.slice(4); // removes "/api", leaving "/..."
  }
  return pathname;
}

/**
 * Builds the destination URL on the fixed Hostinger API origin.
 * Strictly prevents arbitrary host redirection.
 */
export function buildHostingerProxyTargetUrl(originalUrl: string | URL): string {
  const parsed =
    typeof originalUrl === "string" ? new URL(originalUrl, "http://127.0.0.1:3000") : originalUrl;

  const strippedPath = stripApiPrefix(parsed.pathname);
  const target = new URL(HOSTINGER_API_ORIGIN);
  target.pathname = strippedPath;
  target.search = parsed.search;
  return target.toString();
}

/**
 * Checks whether remote Hostinger PHP API mode is explicitly enabled.
 * Defaults to false unless USE_REMOTE_PHP_API === 'true'.
 */
export function isRemotePhpApiEnabled(env?: Record<string, string | undefined>): boolean {
  if (env && typeof env === "object" && env["USE_REMOTE_PHP_API"] === "true") {
    return true;
  }
  return process.env["USE_REMOTE_PHP_API"] === "true";
}

/**
 * Proxies an incoming Request to Hostinger PHP backend.
 * Preserves HTTP method, headers, query strings, and body.
 * Does not log sensitive headers (Authorization, Cookies, etc.).
 * Fails closed with 502 Bad Gateway if upstream connection throws,
 * preventing silent fallback to local in-memory or JSON storage.
 */
export async function proxyHostingerApiRequest(
  request: Request,
  fetchFn: typeof fetch = fetch,
): Promise<Response> {
  const targetUrl = buildHostingerProxyTargetUrl(request.url);

  const forwardHeaders = new Headers();
  for (const [key, value] of request.headers.entries()) {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      forwardHeaders.set(key, value);
    }
  }

  if (!forwardHeaders.has("accept")) {
    forwardHeaders.set("accept", "application/json");
  }

  const reqInit: RequestInit = {
    method: request.method,
    headers: forwardHeaders,
    redirect: "follow",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    const bodyBuffer = await request.arrayBuffer();
    if (bodyBuffer.byteLength > 0) {
      reqInit.body = bodyBuffer;
    }
  }

  try {
    const upstreamRes = await fetchFn(targetUrl, reqInit);
    return upstreamRes;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Upstream Hostinger API connection failed",
        details: errorMsg,
      }),
      {
        status: 502,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      },
    );
  }
}
