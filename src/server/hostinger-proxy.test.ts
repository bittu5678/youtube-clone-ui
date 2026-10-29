import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  HOSTINGER_API_ORIGIN,
  stripApiPrefix,
  buildHostingerProxyTargetUrl,
  isRemotePhpApiEnabled,
  proxyHostingerApiRequest,
} from "./hostinger-proxy.ts";

describe("Phase 1C: Hostinger API Reverse Proxy Tests", () => {
  describe("1. Path prefix stripping (stripApiPrefix)", () => {
    it("strips single leading /api prefix from endpoint paths", () => {
      assert.equal(stripApiPrefix("/api/auth/me.php"), "/auth/me.php");
      assert.equal(stripApiPrefix("/api/videos/list.php"), "/videos/list.php");
      assert.equal(stripApiPrefix("/api/payments/create-order.php"), "/payments/create-order.php");
      assert.equal(stripApiPrefix("/api/kyc/personal.php"), "/kyc/personal.php");
    });

    it("handles root /api and /api/ cleanly", () => {
      assert.equal(stripApiPrefix("/api"), "/");
      assert.equal(stripApiPrefix("/api/"), "/");
    });

    it("strips exactly ONE leading /api prefix and preserves downstream /api in path", () => {
      assert.equal(stripApiPrefix("/api/nested/api/test.php"), "/nested/api/test.php");
    });

    it("leaves non-/api paths unchanged", () => {
      assert.equal(stripApiPrefix("/auth/me.php"), "/auth/me.php");
      assert.equal(stripApiPrefix("/uploads/video.mp4"), "/uploads/video.mp4");
    });
  });

  describe("2. Destination URL Construction (buildHostingerProxyTargetUrl)", () => {
    it("targets fixed Hostinger API origin with stripped path", () => {
      const url = buildHostingerProxyTargetUrl("http://localhost:3000/api/auth/me.php");
      assert.equal(url, `${HOSTINGER_API_ORIGIN}/auth/me.php`);
    });

    it("preserves query strings exactly", () => {
      const url = buildHostingerProxyTargetUrl(
        "http://localhost:3000/api/videos/list.php?page=1&limit=10&category=Coding",
      );
      assert.equal(url, `${HOSTINGER_API_ORIGIN}/videos/list.php?page=1&limit=10&category=Coding`);
    });

    it("works with WHATWG URL instance input", () => {
      const parsed = new URL("https://ais-dev-preview.run.app/api/auth/login.php?source=header");
      const url = buildHostingerProxyTargetUrl(parsed);
      assert.equal(url, `${HOSTINGER_API_ORIGIN}/auth/login.php?source=header`);
    });

    it("strictly locks destination origin to https://api.facetube.online", () => {
      const target = buildHostingerProxyTargetUrl("http://attacker.example.com/api/test.php");
      assert.equal(new URL(target).origin, HOSTINGER_API_ORIGIN);
    });
  });

  describe("3. Explicit Enablement Requirement (isRemotePhpApiEnabled)", () => {
    it("remains disabled by default when flag is not set", () => {
      const prev = process.env["USE_REMOTE_PHP_API"];
      try {
        delete process.env["USE_REMOTE_PHP_API"];
        assert.equal(isRemotePhpApiEnabled(), false);
        assert.equal(isRemotePhpApiEnabled({}), false);
        assert.equal(isRemotePhpApiEnabled({ USE_REMOTE_PHP_API: "false" }), false);
        assert.equal(isRemotePhpApiEnabled({ USE_REMOTE_PHP_API: "" }), false);
      } finally {
        if (prev !== undefined) process.env["USE_REMOTE_PHP_API"] = prev;
      }
    });

    it("enables ONLY when USE_REMOTE_PHP_API is explicitly 'true'", () => {
      assert.equal(isRemotePhpApiEnabled({ USE_REMOTE_PHP_API: "true" }), true);
      const prev = process.env["USE_REMOTE_PHP_API"];
      try {
        process.env["USE_REMOTE_PHP_API"] = "true";
        assert.equal(isRemotePhpApiEnabled(), true);
      } finally {
        if (prev !== undefined) process.env["USE_REMOTE_PHP_API"] = prev;
        else delete process.env["USE_REMOTE_PHP_API"];
      }
    });
  });

  describe("4. Proxy Execution with Mocked Upstream (proxyHostingerApiRequest)", () => {
    it("forwards GET request method, query, and headers, omitting hop-by-hop headers", async () => {
      let capturedUrl = "";
      let capturedInit: RequestInit | undefined;

      const mockFetch: typeof fetch = async (url, init) => {
        capturedUrl = String(url);
        capturedInit = init;
        return new Response(JSON.stringify({ success: true, authenticated: false }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      };

      const req = new Request("http://localhost:3000/api/auth/me.php?verify=1", {
        method: "GET",
        headers: {
          Host: "localhost:3000",
          Authorization: "Bearer mock_test_token_12345",
          Accept: "application/json",
          Connection: "keep-alive",
          "X-Custom-Client": "FaceTubeApp",
        },
      });

      const response = await proxyHostingerApiRequest(req, mockFetch);

      assert.equal(capturedUrl, "https://api.facetube.online/auth/me.php?verify=1");
      assert.equal(capturedInit?.method, "GET");

      const fHeaders = capturedInit?.headers as Headers;
      assert.equal(fHeaders.get("authorization"), "Bearer mock_test_token_12345");
      assert.equal(fHeaders.get("x-custom-client"), "FaceTubeApp");
      // Hop-by-hop headers must NOT be forwarded
      assert.equal(fHeaders.get("host"), null);
      assert.equal(fHeaders.get("connection"), null);

      assert.equal(response.status, 200);
      const data = (await response.json()) as { success: boolean; authenticated: boolean };
      assert.equal(data.success, true);
      assert.equal(data.authenticated, false);
    });

    it("preserves POST method, request body, and headers without logging secrets", async () => {
      let capturedUrl = "";
      let capturedInit: RequestInit | undefined;

      const mockFetch: typeof fetch = async (url, init) => {
        capturedUrl = String(url);
        capturedInit = init;
        return new Response(JSON.stringify({ success: true, message: "Mock login response" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      };

      const requestPayload = JSON.stringify({ identifier: "FT483921", password: "mockPassword" });
      const req = new Request("http://localhost:3000/api/auth/login.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: requestPayload,
      });

      const response = await proxyHostingerApiRequest(req, mockFetch);

      assert.equal(capturedUrl, "https://api.facetube.online/auth/login.php");
      assert.equal(capturedInit?.method, "POST");

      const bodyBuffer = capturedInit?.body as ArrayBuffer;
      const forwardedBody = Buffer.from(bodyBuffer).toString("utf-8");
      assert.equal(forwardedBody, requestPayload);

      assert.equal(response.status, 200);
      const resData = (await response.json()) as { success: boolean; message: string };
      assert.equal(resData.success, true);
    });

    it("safely returns 502 Bad Gateway when upstream fetch fails without silent local fallback", async () => {
      const mockFailingFetch: typeof fetch = async () => {
        throw new Error("getaddrinfo ENOTFOUND api.facetube.online");
      };

      const req = new Request("http://localhost:3000/api/videos/list.php", {
        method: "GET",
      });

      const response = await proxyHostingerApiRequest(req, mockFailingFetch);

      assert.equal(response.status, 502);
      const errData = (await response.json()) as {
        success: boolean;
        error: string;
        details: string;
      };
      assert.equal(errData.success, false);
      assert.match(errData.error, /Upstream Hostinger API connection failed/i);
      assert.match(errData.details, /ENOTFOUND/i);
    });

    it("preserves upstream error statuses (e.g. 401, 404, 500) from Hostinger", async () => {
      const mock401Fetch: typeof fetch = async () => {
        return new Response(JSON.stringify({ success: false, error: "Authentication required" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      };

      const req = new Request("http://localhost:3000/api/admin/stats.php", {
        method: "GET",
      });

      const response = await proxyHostingerApiRequest(req, mock401Fetch);
      assert.equal(response.status, 401);
      const data = (await response.json()) as { success: boolean; error: string };
      assert.equal(data.success, false);
      assert.equal(data.error, "Authentication required");
    });
  });
});
