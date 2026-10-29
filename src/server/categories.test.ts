import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { handleApiRequest } from "./api-handler";

describe("Priority 3: Admin Category Management & Verification Tests", () => {
  let adminToken = "";
  let userToken = "";

  before(async () => {
    // 1. Authenticate as Admin (FT102857 / admin@facetube.com)
    const adminLoginReq = new Request("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: "admin@facetube.com", password: "password" }),
    });
    const adminLoginRes = await handleApiRequest(adminLoginReq);
    assert.ok(adminLoginRes, "Admin login request must return a response");
    const adminData = await adminLoginRes.json();
    assert.ok(adminData.token, "Admin login must return a session token");
    adminToken = adminData.token;

    // 2. Authenticate as Standard User (FT483921 / alex@facetube.com)
    const userLoginReq = new Request("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: "alex@facetube.com", password: "password" }),
    });
    const userLoginRes = await handleApiRequest(userLoginReq);
    assert.ok(userLoginRes, "User login request must return a response");
    const userData = await userLoginRes.json();
    assert.ok(userData.token, "User login must return a session token");
    userToken = userData.token;
  });

  // Test Suite 1: Category Listing
  describe("1. Category Listing Endpoint (/api/categories/list)", () => {
    it("returns 200 with categories list and source indicator", async () => {
      const req = new Request("http://localhost:3000/api/categories/list", {
        method: "GET",
      });
      const res = await handleApiRequest(req);
      assert.ok(res);
      assert.equal(res.status, 200);

      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(Array.isArray(data.categories), "categories must be an array");
      assert.ok(data.categories.length >= 13, "baseline categories must contain at least 13 items");

      const names = data.categories.map((c: any) => c.name);
      assert.ok(names.includes("Comedy"), "Must include baseline category Comedy");
      assert.ok(names.includes("Coding"), "Must include baseline category Coding");
    });
  });

  // Test Suite 2: Authentication & RBAC Authorization
  describe("2. Authentication and Authorization on Admin Category Creation", () => {
    it("rejects unauthenticated requests with HTTP 401", async () => {
      const req = new Request("http://localhost:3000/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Robotics" }),
      });
      const res = await handleApiRequest(req);
      assert.ok(res);
      assert.equal(res.status, 401);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.error, /authentication required/i);
    });

    it("rejects non-admin authenticated users with HTTP 403 Forbidden", async () => {
      const req = new Request("http://localhost:3000/api/admin/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ name: "Robotics" }),
      });
      const res = await handleApiRequest(req);
      assert.ok(res);
      assert.equal(res.status, 403);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.error, /admin authorization required/i);
    });
  });

  // Test Suite 3: Input Validation
  describe("3. Input Validation on Category Creation", () => {
    it("rejects empty category name with HTTP 400", async () => {
      const req = new Request("http://localhost:3000/api/admin/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ name: "   " }),
      });
      const res = await handleApiRequest(req);
      assert.ok(res);
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.error, /category name is required/i);
    });

    it("rejects category names shorter than 2 characters with HTTP 400", async () => {
      const req = new Request("http://localhost:3000/api/admin/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ name: "A" }),
      });
      const res = await handleApiRequest(req);
      assert.ok(res);
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.error, /at least 2 characters/i);
    });

    it("rejects category names longer than 100 characters with HTTP 400", async () => {
      const longName = "X".repeat(101);
      const req = new Request("http://localhost:3000/api/admin/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ name: longName }),
      });
      const res = await handleApiRequest(req);
      assert.ok(res);
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.error, /must not exceed 100 characters/i);
    });
  });

  // Test Suite 4: Category Creation & Duplicate Prevention
  describe("4. Category Creation & Case-Insensitive Duplicate Handling", () => {
    const uniqueCategoryName = `Web Dev ${Date.now()}`;

    it("allows verified administrator to create a new category with HTTP 201", async () => {
      const req = new Request("http://localhost:3000/api/admin/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ name: uniqueCategoryName }),
      });
      const res = await handleApiRequest(req);
      assert.ok(res);
      assert.equal(res.status, 201);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.category);
      assert.equal(data.category.name, uniqueCategoryName);
      assert.ok(data.category.slug);
    });

    it("rejects exact duplicate category name with HTTP 409 Conflict", async () => {
      const req = new Request("http://localhost:3000/api/admin/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ name: uniqueCategoryName }),
      });
      const res = await handleApiRequest(req);
      assert.ok(res);
      assert.equal(res.status, 409);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.error, /already exists/i);
    });

    it("rejects case-insensitive duplicate category name (lowercase) with HTTP 409", async () => {
      const req = new Request("http://localhost:3000/api/admin/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ name: uniqueCategoryName.toLowerCase() }),
      });
      const res = await handleApiRequest(req);
      assert.ok(res);
      assert.equal(res.status, 409);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.error, /already exists/i);
    });

    it("rejects duplicate matching a baseline category case-insensitively (e.g. 'coding')", async () => {
      const req = new Request("http://localhost:3000/api/admin/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ name: "coding" }),
      });
      const res = await handleApiRequest(req);
      assert.ok(res);
      assert.equal(res.status, 409);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.error, /already exists/i);
    });
  });

  // Test Suite 5: PHP Codebase & Migration Artifact Verification
  describe("5. Hostinger PHP Codebase & Migration File Verification", () => {
    it("verifies database/migrations/20261030_create_categories_table.sql exists and is idempotent", () => {
      const migrationPath = path.resolve(
        process.cwd(),
        "database/migrations/20261030_create_categories_table.sql",
      );
      assert.ok(fs.existsSync(migrationPath), "Migration SQL file must exist");
      const sql = fs.readFileSync(migrationPath, "utf-8");

      assert.match(sql, /CREATE TABLE IF NOT EXISTS `categories`/i);
      assert.match(sql, /UNIQUE KEY `uniq_categories_name`/i);
      assert.match(sql, /UNIQUE KEY `uniq_categories_slug`/i);
      assert.match(sql, /INSERT IGNORE INTO `categories`/i);
      assert.match(sql, /DO NOT EXECUTE ON PRODUCTION WITHOUT SIGN-OFF/i);
    });

    it("verifies api/categories/list.php exists and implements graceful migration-pending fallback", () => {
      const listPhpPath = path.resolve(process.cwd(), "api/categories/list.php");
      assert.ok(fs.existsSync(listPhpPath), "api/categories/list.php must exist");
      const php = fs.readFileSync(listPhpPath, "utf-8");

      assert.match(php, /REQUEST_METHOD.+GET/);
      assert.match(php, /SELECT id, name, slug, created_by, created_at FROM categories/);
      assert.match(php, /baseline_fallback/);
    });

    it("verifies api/admin/categories.php exists with Bearer auth, admin RBAC, and duplicate check", () => {
      const adminPhpPath = path.resolve(process.cwd(), "api/admin/categories.php");
      assert.ok(fs.existsSync(adminPhpPath), "api/admin/categories.php must exist");
      const php = fs.readFileSync(adminPhpPath, "utf-8");

      assert.match(php, /REQUEST_METHOD.+POST/);
      assert.match(php, /getAuthUser\(\$pdo\)/);
      assert.match(php, /'admin'/);
      assert.match(php, /LOWER\(TRIM\(name\)\) = LOWER\(\?\)/);
      assert.match(php, /INSERT INTO categories/);
    });
  });
});
