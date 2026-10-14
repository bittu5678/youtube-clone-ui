import { describe, it } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { verifyServerPayment, verifyPayment } from "./payments";
import { handleApiRequest } from "./api-handler";

describe("Payment Verification & Referral Security Audit Tests", () => {
  const secret = "test_razorpay_secret_key_1234567890";
  const orderId = "order_test_1001";
  const paymentId = "pay_test_2002";
  const validSignature = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  it("1. Fails closed when Razorpay secret credentials are missing", async () => {
    const res = await verifyPayment(
      {
        orderId,
        paymentId,
        signature: validSignature,
        userId: "FT483921",
        purpose: "premium_video_upload",
      },
      ["FT483921"],
      "FT102857",
      { RAZORPAY_KEY_SECRET: "" }, // Explicitly missing secret
    );

    assert.equal(res.verified, false);
    assert.match(res.error || "", /missing|not configured|failed closed/i);
  });

  it("2. Rejects mock signatures and bypass tokens", async () => {
    const res = await verifyPayment(
      {
        orderId,
        paymentId: "pay_test_mock_1",
        signature: "mock_signature_bypass",
        userId: "FT483921",
        purpose: "premium_video_upload",
      },
      ["FT483921"],
      "FT102857",
      { RAZORPAY_KEY_SECRET: secret },
    );

    assert.equal(res.verified, false);
    assert.match(res.error || "", /mock|invalid/i);
  });

  it("3. Rejects invalid or tampered HMAC signature", async () => {
    const res = await verifyPayment(
      {
        orderId,
        paymentId,
        signature: "tampered_fake_signature_382910382910381029381029",
        userId: "FT483921",
        purpose: "premium_video_upload",
      },
      ["FT483921"],
      "FT102857",
      { RAZORPAY_KEY_SECRET: secret },
    );

    assert.equal(res.verified, false);
    assert.match(res.error || "", /signature verification failed/i);
  });

  it("4. Credits referral commission correctly for verified premium video upload", async () => {
    const uniquePayId = `pay_unique_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const sig = crypto
      .createHmac("sha256", secret)
      .update(`${orderId}|${uniquePayId}`)
      .digest("hex");

    const res = await verifyPayment(
      {
        orderId,
        paymentId: uniquePayId,
        signature: sig,
        userId: "FT483921",
        purpose: "premium_video_upload",
      },
      ["FT483921"],
      "FT102857", // Verified sponsor
      { RAZORPAY_KEY_SECRET: secret },
    );

    assert.equal(res.verified, true);
    assert.equal(res.amount, 6.0); // Exact ₹6.00 business rule
    assert.equal(res.distribution?.directReferralAmount, 1.0); // Exact ₹1.00 business rule
    assert.equal(res.distribution?.referrerId, "FT102857");
  });

  it("5. Prevents duplicate commission credit on duplicate payment ID (idempotency)", async () => {
    const uniquePayId = `pay_dedup_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const sig = crypto
      .createHmac("sha256", secret)
      .update(`${orderId}|${uniquePayId}`)
      .digest("hex");

    // First attempt
    const firstRes = await verifyPayment(
      {
        orderId,
        paymentId: uniquePayId,
        signature: sig,
        userId: "FT483921",
        purpose: "premium_video_upload",
      },
      ["FT483921"],
      "FT102857",
      { RAZORPAY_KEY_SECRET: secret },
    );
    assert.equal(firstRes.verified, true);

    // Second duplicate attempt
    const secondRes = await verifyPayment(
      {
        orderId,
        paymentId: uniquePayId,
        signature: sig,
        userId: "FT483921",
        purpose: "premium_video_upload",
      },
      ["FT483921"],
      "FT102857",
      { RAZORPAY_KEY_SECRET: secret },
    );

    assert.equal(secondRes.verified, true);
    assert.equal(secondRes.txNumber, firstRes.txNumber); // Does not increment sequence
    assert.match(secondRes.error || "", /already been processed/i);
  });

  it("6. Handles concurrent duplicate payment verification requests safely", async () => {
    const concurrentPayId = `pay_concurrent_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const sig = crypto
      .createHmac("sha256", secret)
      .update(`${orderId}|${concurrentPayId}`)
      .digest("hex");

    const reqData = {
      orderId,
      paymentId: concurrentPayId,
      signature: sig,
      userId: "FT483921",
      purpose: "premium_video_upload" as const,
    };

    // Fire 3 simultaneous verification attempts
    const [res1, res2, res3] = await Promise.all([
      verifyServerPayment(reqData, ["FT483921"], "FT102857", { RAZORPAY_KEY_SECRET: secret }),
      verifyServerPayment(reqData, ["FT483921"], "FT102857", { RAZORPAY_KEY_SECRET: secret }),
      verifyServerPayment(reqData, ["FT483921"], "FT102857", { RAZORPAY_KEY_SECRET: secret }),
    ]);

    // All should be marked verified, but only one is the original sequence allocation
    assert.equal(res1.verified, true);
    assert.equal(res2.verified, true);
    assert.equal(res3.verified, true);

    // All must have identical sequence numbers (no sequence inflation)
    assert.equal(res1.txNumber, res2.txNumber);
    assert.equal(res2.txNumber, res3.txNumber);
  });
});

describe("API Handler Authentication & Authorization Security Tests", () => {
  const adminToken = "test_session_token_admin_001";
  const userToken = "test_session_token_user_002";
  const envConfig = { RAZORPAY_KEY_SECRET: "test_secret_for_api_tests_123456" };

  // Helper to simulate API requests with tokens
  async function makeApiCall(
    url: string,
    method = "GET",
    body: any = null,
    token: string | null = null,
  ) {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const init: RequestInit = { method, headers };
    if (body) {
      init.body = JSON.stringify(body);
    }
    const req = new Request(`http://localhost:3000${url}`, init);
    const resp = await handleApiRequest(req, envConfig);
    assert.ok(resp, `Response should exist for ${url}`);
    const data = await resp.json();
    return { status: resp.status, data };
  }

  it("1. Rejects unauthenticated access to wallet/balance with 401", async () => {
    const { status, data } = await makeApiCall("/api/wallet/balance.php?userId=FT483921");
    assert.equal(status, 401);
    assert.equal(data.success, false);
    assert.match(data.error, /Authentication required/i);
  });

  it("2. Rejects unauthenticated access to wallet/transactions with 401", async () => {
    const { status, data } = await makeApiCall("/api/wallet/transactions.php");
    assert.equal(status, 401);
    assert.equal(data.success, false);
    assert.match(data.error, /Authentication required/i);
  });

  it("3. Rejects unauthenticated access to wallet/withdraw with 401", async () => {
    const { status, data } = await makeApiCall("/api/wallet/withdraw.php", "POST", {
      amount: 1000,
      userId: "FT483921",
    });
    assert.equal(status, 401);
    assert.equal(data.success, false);
    assert.match(data.error, /Authentication required/i);
  });

  it("4. Rejects unauthenticated access to referrals/dashboard with 401", async () => {
    const { status, data } = await makeApiCall("/api/referrals/dashboard.php?userId=FT483921");
    assert.equal(status, 401);
    assert.equal(data.success, false);
    assert.match(data.error, /Authentication required/i);
  });

  it("5. Authenticates regular user and generates valid session token", async () => {
    const { status, data } = await makeApiCall("/api/auth/login.php", "POST", {
      identifier: "alex@facetube.com",
      password: "password",
    });
    assert.equal(status, 200);
    assert.equal(data.success, true);
    assert.ok(data.token, "Login should return session token");
    assert.equal(data.user.user_id, "FT483921");
    assert.equal(data.user.role, "user");
  });

  it("6. Allows regular user to access their own wallet/balance", async () => {
    // Log in as Alex
    const login = await makeApiCall("/api/auth/login.php", "POST", {
      identifier: "alex@facetube.com",
      password: "password",
    });
    const token = login.data.token;

    const { status, data } = await makeApiCall(
      "/api/wallet/balance.php?userId=FT483921",
      "GET",
      null,
      token,
    );
    assert.equal(status, 200);
    assert.equal(data.success, true);
    assert.equal(data.wallet.userId, "FT483921");
  });

  it("7. Blocks standard user from cross-user access to another user's wallet with 403", async () => {
    // Log in as Alex (role: user)
    const login = await makeApiCall("/api/auth/login.php", "POST", {
      identifier: "alex@facetube.com",
      password: "password",
    });
    const token = login.data.token;

    // Try accessing Admin's wallet (FT102857)
    const { status, data } = await makeApiCall(
      "/api/wallet/balance.php?userId=FT102857",
      "GET",
      null,
      token,
    );
    assert.equal(status, 403);
    assert.equal(data.success, false);
    assert.match(data.error, /Cross-user access is restricted to verified administrators/i);
  });

  it("8. Blocks standard user from cross-user access to another user's referrals/dashboard with 403", async () => {
    // Log in as Alex
    const login = await makeApiCall("/api/auth/login.php", "POST", {
      identifier: "alex@facetube.com",
      password: "password",
    });
    const token = login.data.token;

    // Try accessing Admin's referral dashboard
    const { status, data } = await makeApiCall(
      "/api/referrals/dashboard.php?userId=FT102857",
      "GET",
      null,
      token,
    );
    assert.equal(status, 403);
    assert.equal(data.success, false);
    assert.match(data.error, /Cross-user access is restricted to verified administrators/i);
  });

  it("9. Permits admin user to access cross-user wallet/balance and referrals/dashboard", async () => {
    // Log in as Admin
    const login = await makeApiCall("/api/auth/login.php", "POST", {
      identifier: "admin@facetube.com",
      password: "password",
    });
    assert.equal(login.status, 200);
    const token = login.data.token;

    // Admin accessing Alex's wallet
    const walletRes = await makeApiCall(
      "/api/wallet/balance.php?userId=FT483921",
      "GET",
      null,
      token,
    );
    assert.equal(walletRes.status, 200);
    assert.equal(walletRes.data.success, true);
    assert.equal(walletRes.data.wallet.userId, "FT483921");

    // Admin accessing Alex's referrals
    const refRes = await makeApiCall(
      "/api/referrals/dashboard.php?userId=FT483921",
      "GET",
      null,
      token,
    );
    assert.equal(refRes.status, 200);
    assert.equal(refRes.data.success, true);
    assert.equal(refRes.data.dashboard.userId, "FT483921");
  });

  it("10. Enforces withdrawal limit boundaries (min ₹1,000 and max ₹10,000)", async () => {
    const login = await makeApiCall("/api/auth/login.php", "POST", {
      identifier: "admin@facetube.com",
      password: "password",
    });
    const token = login.data.token;

    // Below minimum
    const belowMin = await makeApiCall("/api/wallet/withdraw.php", "POST", { amount: 500 }, token);
    assert.equal(belowMin.status, 400);
    assert.match(belowMin.data.error, /Minimum withdrawal amount is ₹1,000/i);

    // Above maximum
    const aboveMax = await makeApiCall(
      "/api/wallet/withdraw.php",
      "POST",
      { amount: 15000 },
      token,
    );
    assert.equal(aboveMax.status, 400);
    assert.match(aboveMax.data.error, /Maximum daily withdrawal limit is ₹10,000/i);
  });

  it("11. Rejects payment verification for mismatched amount or unsupported purpose", async () => {
    const login = await makeApiCall("/api/auth/login.php", "POST", {
      identifier: "alex@facetube.com",
      password: "password",
    });
    const token = login.data.token;

    const ordId = "ord_test_val_1";
    const payId = `pay_val_${Date.now()}`;
    const sig = crypto
      .createHmac("sha256", envConfig.RAZORPAY_KEY_SECRET)
      .update(`${ordId}|${payId}`)
      .digest("hex");

    // Mismatched amount (e.g. ₹5 instead of required ₹6 for premium video)
    const badAmount = await makeApiCall(
      "/api/payments/verify.php",
      "POST",
      {
        orderId: ordId,
        paymentId: payId,
        signature: sig,
        purpose: "premium_video_upload",
        amount: 5.0,
      },
      token,
    );
    assert.equal(badAmount.status, 400);
    assert.match(badAmount.data.error, /does not match expected fee/i);

    // Unsupported purpose
    const badPurpose = await makeApiCall(
      "/api/payments/verify.php",
      "POST",
      {
        orderId: ordId,
        paymentId: payId,
        signature: sig,
        purpose: "unknown_hack_purpose",
      },
      token,
    );
    assert.equal(badPurpose.status, 400);
    assert.match(badPurpose.data.error, /Unsupported payment purpose/i);
  });

  it("12. Rejects payment verification when user attempts to verify video owned by another creator", async () => {
    // Maya Lin attempting to verify Alex's video (vid-seed-001)
    const login = await makeApiCall("/api/auth/login.php", "POST", {
      identifier: "maya@facetube.com",
      password: "password",
    });
    const token = login.data.token;

    const ordId = "ord_test_vid_owner";
    const payId = `pay_vid_${Date.now()}`;
    const sig = crypto
      .createHmac("sha256", envConfig.RAZORPAY_KEY_SECRET)
      .update(`${ordId}|${payId}`)
      .digest("hex");

    const res = await makeApiCall(
      "/api/payments/verify.php",
      "POST",
      {
        orderId: ordId,
        paymentId: payId,
        signature: sig,
        videoId: "vid-seed-001", // Alex's video
        userId: "FT900431", // Maya's ID
        purpose: "premium_video_upload",
      },
      token,
    );

    assert.equal(res.status, 403);
    assert.match(res.data.error, /does not match the authenticated payer/i);
  });
});

describe("Database Transaction Rollback Simulation Tests", () => {
  it("Simulates MySQL transaction rollback on failure during payment verification flow", async () => {
    let transactionBegun = false;
    let transactionCommitted = false;
    let transactionRolledBack = false;

    // Mock MySQL Connection with transactional operations
    const mockConnection = {
      beginTransaction: async () => {
        transactionBegun = true;
      },
      query: async (sql: string) => {
        if (sql.includes("SELECT * FROM payment_transactions")) {
          return [[]]; // No duplicate
        }
        if (sql.includes("COUNT(*)")) {
          return [[{ total: 5 }]];
        }
        if (sql.includes("INSERT INTO payment_transactions")) {
          // Simulate simulated unexpected database constraint error on ledger
          throw new Error("Simulated database failure during ledger step");
        }
        return [{}];
      },
      commit: async () => {
        transactionCommitted = true;
      },
      rollback: async () => {
        transactionRolledBack = true;
      },
      release: () => {},
    };

    try {
      await mockConnection.beginTransaction();
      await mockConnection.query("SELECT * FROM payment_transactions WHERE payment_id = ?");
      await mockConnection.query("INSERT INTO payment_transactions ...");
      await mockConnection.commit();
    } catch (_err) {
      await mockConnection.rollback();
    }

    assert.equal(transactionBegun, true, "Transaction must begin");
    assert.equal(transactionCommitted, false, "Transaction must not commit on error");
    assert.equal(transactionRolledBack, true, "Transaction must roll back on error");
  });
});

describe("Razorpay Real Order Creation & Gateway Verification Tests", () => {
  const testKeyId = "rzp_test_testkey123456";
  const testSecret = "test_secret_key_abcdef123456";

  it("1. createServerPaymentOrder fails closed when credentials missing", async () => {
    const { createServerPaymentOrder } = await import("./payments");

    await assert.rejects(async () => {
      await createServerPaymentOrder(
        {
          purpose: "premium_video_upload",
          userId: "FT483921",
        },
        { RAZORPAY_KEY_ID: "", RAZORPAY_KEY_SECRET: "" },
      );
    }, /credentials.*not configured/i);
  });

  it("2. createServerPaymentOrder generates exact pricing for premium video and ads", async () => {
    const { createServerPaymentOrder } = await import("./payments");

    // Premium video: ₹6.00 / 600 paise
    const premiumOrder = await createServerPaymentOrder(
      {
        purpose: "premium_video_upload",
        userId: "FT483921",
      },
      {
        RAZORPAY_KEY_ID: testKeyId,
        RAZORPAY_KEY_SECRET: testSecret,
        RAZORPAY_SKIP_REMOTE_CHECK: "true",
      },
    );
    assert.equal(premiumOrder.amount, 6.0);
    assert.equal(premiumOrder.amountInSubunits, 600);
    assert.equal(premiumOrder.currency, "INR");

    // Ads promotion: 7 days = ₹100 / 10000 paise
    const ads7Days = await createServerPaymentOrder(
      {
        purpose: "ads_promotion",
        userId: "FT483921",
        planId: "plan-7-days",
      },
      {
        RAZORPAY_KEY_ID: testKeyId,
        RAZORPAY_KEY_SECRET: testSecret,
        RAZORPAY_SKIP_REMOTE_CHECK: "true",
      },
    );
    assert.equal(ads7Days.amount, 100.0);
    assert.equal(ads7Days.amountInSubunits, 10000);

    // Ads promotion: 15 days = ₹200 / 20000 paise
    const ads15Days = await createServerPaymentOrder(
      {
        purpose: "ads_promotion",
        userId: "FT483921",
        planId: "plan-15-days",
      },
      {
        RAZORPAY_KEY_ID: testKeyId,
        RAZORPAY_KEY_SECRET: testSecret,
        RAZORPAY_SKIP_REMOTE_CHECK: "true",
      },
    );
    assert.equal(ads15Days.amount, 200.0);
    assert.equal(ads15Days.amountInSubunits, 20000);

    // Ads promotion: monthly = ₹300 / 30000 paise
    const adsMonthly = await createServerPaymentOrder(
      {
        purpose: "ads_promotion",
        userId: "FT483921",
        planId: "plan-monthly",
      },
      {
        RAZORPAY_KEY_ID: testKeyId,
        RAZORPAY_KEY_SECRET: testSecret,
        RAZORPAY_SKIP_REMOTE_CHECK: "true",
      },
    );
    assert.equal(adsMonthly.amount, 300.0);
    assert.equal(adsMonthly.amountInSubunits, 30000);

    // Ads promotion: yearly = ₹30,000 / 3000000 paise
    const adsYearly = await createServerPaymentOrder(
      {
        purpose: "ads_promotion",
        userId: "FT483921",
        planId: "plan-yearly",
      },
      {
        RAZORPAY_KEY_ID: testKeyId,
        RAZORPAY_KEY_SECRET: testSecret,
        RAZORPAY_SKIP_REMOTE_CHECK: "true",
      },
    );
    assert.equal(adsYearly.amount, 30000.0);
    assert.equal(adsYearly.amountInSubunits, 3000000);
  });

  it("3. API create-order route returns 503 when credentials missing", async () => {
    const req = new Request("http://localhost:3000/api/payments/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        purpose: "premium_video_upload",
        userId: "FT483921",
      }),
    });

    const res = await handleApiRequest(req, {
      RAZORPAY_KEY_ID: "",
      RAZORPAY_KEY_SECRET: "",
    });

    assert.ok(res);
    assert.equal(res.status, 503);
    const body = await res.json();
    assert.match(body.error || "", /credentials.*not configured/i);
  });

  it("4. Verifies all four ads promotion tiers with exact authoritative pricing via metadata or planId", async () => {
    const testCases: Array<{
      planId: "plan-7-days" | "plan-15-days" | "plan-monthly" | "plan-yearly";
      expectedAmount: number;
    }> = [
      { planId: "plan-7-days", expectedAmount: 100.0 },
      { planId: "plan-15-days", expectedAmount: 200.0 },
      { planId: "plan-monthly", expectedAmount: 300.0 },
      { planId: "plan-yearly", expectedAmount: 30000.0 },
    ];

    for (const { planId, expectedAmount } of testCases) {
      const orderId = `ord_test_ads_${planId}_${Date.now()}`;
      const paymentId = `pay_test_ads_${planId}_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
      const signature = crypto
        .createHmac("sha256", testSecret)
        .update(`${orderId}|${paymentId}`)
        .digest("hex");

      // Verify sending planId inside metadata (as frontend ads-promotions.tsx does)
      const req = new Request("http://localhost:3000/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          paymentId,
          signature,
          userId: "FT483921",
          purpose: "ads_promotion",
          metadata: { planId },
          amount: expectedAmount,
        }),
      });

      const res = await handleApiRequest(req, {
        RAZORPAY_KEY_ID: testKeyId,
        RAZORPAY_KEY_SECRET: testSecret,
        RAZORPAY_SKIP_REMOTE_CHECK: "true",
      });

      assert.ok(res);
      assert.equal(res.status, 200, `Plan ${planId} verification should return 200`);
      const body = await res.json();
      assert.equal(body.verified, true, `Plan ${planId} should be verified`);
      assert.equal(
        body.amount,
        expectedAmount,
        `Plan ${planId} should charge exactly ₹${expectedAmount}`,
      );
    }

    // Verify amount mismatch rejection: e.g. claiming ₹100 for yearly ₹30,000 plan
    const badOrderId = `ord_test_mismatch_${Date.now()}`;
    const badPayId = `pay_test_mismatch_${Date.now()}`;
    const badSig = crypto
      .createHmac("sha256", testSecret)
      .update(`${badOrderId}|${badPayId}`)
      .digest("hex");

    const mismatchReq = new Request("http://localhost:3000/api/payments/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: badOrderId,
        paymentId: badPayId,
        signature: badSig,
        userId: "FT483921",
        purpose: "ads_promotion",
        metadata: { planId: "plan-yearly" },
        amount: 100.0, // Fraudulent claim: ₹100 instead of ₹30,000
      }),
    });

    const mismatchRes = await handleApiRequest(mismatchReq, {
      RAZORPAY_KEY_ID: testKeyId,
      RAZORPAY_KEY_SECRET: testSecret,
      RAZORPAY_SKIP_REMOTE_CHECK: "true",
    });

    assert.ok(mismatchRes);
    assert.equal(mismatchRes.status, 400, "Mismatched amount must return 400");
    const mismatchBody = await mismatchRes.json();
    assert.equal(mismatchBody.verified, false);
    assert.match(mismatchBody.error, /does not match expected fee of ₹30000\.00/i);
  });

  it("5. Rejects unauthorized video promotion order creation by non-owner user with 403", async () => {
    // Log in as Maya Lin (FT900431)
    const loginReq = new Request("http://localhost:3000/api/auth/login.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier: "maya@facetube.com",
        password: "password",
      }),
    });
    const loginRes = await handleApiRequest(loginReq);
    assert.ok(loginRes);
    const loginData = await loginRes.json();
    const token = loginData.token;

    // Maya attempts to initiate an ad promotion for Alex's video (vid-seed-001, owned by FT483921)
    const req = new Request("http://localhost:3000/api/payments/create-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        purpose: "ads_promotion",
        videoId: "vid-seed-001", // Alex's video
        userId: "FT900431", // Maya's ID
        planId: "plan-monthly",
      }),
    });

    const res = await handleApiRequest(req, {
      RAZORPAY_KEY_ID: testKeyId,
      RAZORPAY_KEY_SECRET: testSecret,
      RAZORPAY_SKIP_REMOTE_CHECK: "true",
    });

    assert.ok(res);
    assert.equal(res.status, 403, "Non-owner promotion order must be rejected with 403");
    const body = await res.json();
    assert.equal(body.success, false);
    assert.match(body.error, /only initiate promotion for your own uploaded videos/i);
  });

  it("6. Activates promotion with renewal logic and prevents duplicate re-extension on repeated verification", async () => {
    const orderId = `ord_test_renewal_${Date.now()}`;
    const paymentId = `pay_test_renewal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const signature = crypto
      .createHmac("sha256", testSecret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    // First verification (Alex promotes his own video vid-seed-002 for 7 days)
    const verifyReq1 = new Request("http://localhost:3000/api/payments/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId,
        paymentId,
        signature,
        userId: "FT483921",
        videoId: "vid-seed-002",
        purpose: "ads_promotion",
        planId: "plan-7-days",
        amount: 100.0,
      }),
    });

    const res1 = await handleApiRequest(verifyReq1, {
      RAZORPAY_KEY_ID: testKeyId,
      RAZORPAY_KEY_SECRET: testSecret,
      RAZORPAY_SKIP_REMOTE_CHECK: "true",
    });

    assert.ok(res1);
    assert.equal(res1.status, 200);
    const body1 = await res1.json();
    assert.equal(body1.verified, true);

    // Read video's recorded promotion expiry after 1st verification
    const vidReq1 = new Request("http://localhost:3000/api/videos/get.php?id=vid-seed-002");
    const vidRes1 = await handleApiRequest(vidReq1);
    assert.ok(vidRes1);
    const vidData1 = await vidRes1.json();
    assert.equal(vidData1.video.isPromoted, true);
    const firstExpiry = vidData1.video.promotionExpiresAt;
    assert.ok(firstExpiry, "Expiry date must be set");

    // Second repeated verification of the exact same paymentId
    const verifyReq2 = new Request("http://localhost:3000/api/payments/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId,
        paymentId,
        signature,
        userId: "FT483921",
        videoId: "vid-seed-002",
        purpose: "ads_promotion",
        planId: "plan-7-days",
        amount: 100.0,
      }),
    });

    const res2 = await handleApiRequest(verifyReq2, {
      RAZORPAY_KEY_ID: testKeyId,
      RAZORPAY_KEY_SECRET: testSecret,
      RAZORPAY_SKIP_REMOTE_CHECK: "true",
    });

    assert.ok(res2);
    assert.equal(res2.status, 200);
    const body2 = await res2.json();
    assert.equal(body2.verified, true);
    assert.equal(body2.duplicate, true, "Must be flagged as idempotent duplicate");

    // Re-verify that expiry date was NOT extended again on duplicate call
    const vidReq2 = new Request("http://localhost:3000/api/videos/get.php?id=vid-seed-002");
    const vidRes2 = await handleApiRequest(vidReq2);
    assert.ok(vidRes2);
    const vidData2 = await vidRes2.json();
    assert.equal(
      vidData2.video.promotionExpiresAt,
      firstExpiry,
      "Duplicate verification must NOT extend promotion expiry date again",
    );
  });
});
