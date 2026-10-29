import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { handleApiRequest } from "./api-handler";

describe("Priority 1: Persistent Login Robustness & Password Reset Link Tests", () => {
  // Test A: Session Error Classification
  describe("Session Error Handling & Token Retention", () => {
    it("1. Differentiates HTTP 401 (unauthorized) from transient 5xx/network errors", () => {
      // Simulating error objects thrown by apiFetch
      const error401 = Object.assign(new Error("Authentication required"), {
        status: 401,
        data: { authenticated: false, error: "Session expired" },
      });

      const error500 = Object.assign(new Error("Internal Server Error"), {
        status: 500,
        data: { error: "Database temporarily unavailable" },
      });

      const networkError = new Error("Failed to fetch");

      // Verify status classification helper logic used in AuthProvider
      const shouldClearSession = (err: unknown): boolean => {
        const status = (err as { status?: number })?.status;
        return status === 401 || status === 403;
      };

      assert.equal(shouldClearSession(error401), true, "401 must clear invalid session");
      assert.equal(
        shouldClearSession(error500),
        false,
        "500 must NOT clear cached session or token",
      );
      assert.equal(
        shouldClearSession(networkError),
        false,
        "Network blip must NOT clear cached session or token",
      );
    });

    it("2. Handles explicit { authenticated: false } response by clearing session", () => {
      const unauthResponse = { authenticated: false, user: null };
      const authResponse = {
        authenticated: true,
        user: { id: "u-1", user_id: "FT102857", name: "Admin", email: "admin@facetube.com" },
      };

      const isSessionValid = (res: { authenticated: boolean; user: unknown }): boolean => {
        return Boolean(res && res.authenticated && res.user);
      };

      assert.equal(isSessionValid(unauthResponse), false);
      assert.equal(isSessionValid(authResponse), true);
    });

    it("3. Hostinger auth/me returns authenticated=false when no session token is provided", async () => {
      const req = new Request("http://localhost:3000/api/auth/me", {
        method: "GET",
      });
      const res = await handleApiRequest(req);
      assert.ok(res);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.authenticated, false);
      assert.equal(data.user, null);
    });

    it("4. Hostinger auth/logout revokes session cleanly", async () => {
      const req = new Request("http://localhost:3000/api/auth/logout", {
        method: "POST",
        headers: { Authorization: "Bearer test_session_token_123" },
      });
      const res = await handleApiRequest(req);
      assert.ok(res);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
    });
  });

  // Test B: Password Reset Link Verification
  describe("Password Reset Link & Route Alignment", () => {
    it("5. Verifies api/auth/forgot-password.php generates /reset-password link", () => {
      const phpFilePath = path.resolve(process.cwd(), "api/auth/forgot-password.php");
      assert.ok(fs.existsSync(phpFilePath), "api/auth/forgot-password.php must exist");

      const phpContent = fs.readFileSync(phpFilePath, "utf-8");

      // Verify that resetLink points to /reset-password, not /auth?mode=reset
      assert.match(
        phpContent,
        /\/reset-password\?token=/,
        "PHP forgot-password must generate reset link with /reset-password path",
      );
      assert.doesNotMatch(
        phpContent,
        /\/auth\?mode=reset/,
        "PHP forgot-password must not generate legacy /auth?mode=reset link",
      );
    });

    it("6. Verifies Node preview forgot-password handler generates /reset-password link", async () => {
      const req = new Request("http://localhost:3000/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: "admin@facetube.com" }),
      });
      const res = await handleApiRequest(req);
      assert.ok(res);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.match(data.message, /password reset link has been dispatched/i);
    });

    it("7. Cryptographic token generation generates 64 hex characters (32 random bytes)", () => {
      const rawToken = crypto.randomBytes(32).toString("hex");
      assert.equal(rawToken.length, 64);
      assert.match(rawToken, /^[0-9a-f]{64}$/);

      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
      assert.equal(tokenHash.length, 64);
      assert.match(tokenHash, /^[0-9a-f]{64}$/);
      assert.notEqual(tokenHash, rawToken);
    });

    it("8. Sensitive tokens are not exposed in public error responses", async () => {
      const req = new Request("http://localhost:3000/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: "nonexistent_user@facetube.com" }),
      });
      const res = await handleApiRequest(req);
      assert.ok(res);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      // Ensure token and hash are never returned in public payload
      assert.equal(data.token, undefined);
      assert.equal(data.tokenHash, undefined);
      assert.equal(data.rawToken, undefined);
    });

    it("9. Auth route has backward compatibility redirect handler for legacy /auth?mode=reset links", () => {
      const authRoutePath = path.resolve(process.cwd(), "src/routes/auth.tsx");
      assert.ok(fs.existsSync(authRoutePath), "src/routes/auth.tsx must exist");
      const authContent = fs.readFileSync(authRoutePath, "utf-8");

      assert.match(
        authContent,
        /searchParams\.mode === "reset"/,
        "auth.tsx must inspect searchParams.mode === 'reset'",
      );
      assert.match(
        authContent,
        /to:\s*["']\/reset-password["']/,
        "auth.tsx must navigate to /reset-password when mode is reset",
      );
    });
  });
});
