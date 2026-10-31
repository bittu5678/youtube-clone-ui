import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { api } from "../lib/api.ts";
import {
  getUserWallet,
  getUserLedger,
  processWithdrawal,
  saveStoredWallets,
  saveStoredLedger,
  getStoredWallets,
  getStoredLedger,
  WITHDRAWAL_RULES,
  WITHDRAWAL_CHARGES,
  type UserWallet,
  type LedgerTransaction,
} from "../lib/ledger-service.ts";
import { fetchUploadedVideos, saveStoredVideos, type UploadedVideo } from "../lib/video-service.ts";
import { getReferralDashboardData } from "../lib/referral-service.ts";

// Setup polyfill for browser storage environment in Node.js test runner
const memoryStore = new Map<string, string>();
const mockLocalStorage = {
  getItem: (key: string) => memoryStore.get(key) ?? null,
  setItem: (key: string, value: string) => memoryStore.set(key, String(value)),
  removeItem: (key: string) => memoryStore.delete(key),
  clear: () => memoryStore.clear(),
};

// Assign window and localStorage to global scope for testing client service fallbacks
const originalWindow = (globalThis as any).window;
const originalLocalStorage = (globalThis as any).localStorage;

describe("Regression Tests: Stale Data Fallback & Withdrawal Error Resilience", () => {
  beforeEach(() => {
    (globalThis as any).window = {
      ...globalThis,
      location: { hostname: "localhost" },
    };
    (globalThis as any).localStorage = mockLocalStorage;
    memoryStore.clear();
  });

  afterEach(() => {
    (globalThis as any).window = originalWindow;
    (globalThis as any).localStorage = originalLocalStorage;
    memoryStore.clear();
  });

  // --------------------------------------------------------------------------
  // Suite 1: Stale Ledger Data Fallbacks (Wallet & Transactions)
  // --------------------------------------------------------------------------
  describe("1. Stale Ledger Data Fallback (Wallet & Transactions)", () => {
    it("returns live wallet with isStale: false when backend API succeeds", async () => {
      const originalGetBalance = api.wallet.getBalance;
      try {
        api.wallet.getBalance = async () => ({
          success: true,
          wallet: {
            user_id: "FT483921",
            balance: 1500.5,
            total_earned: 3000,
            total_withdrawn: 1499.5,
            referral_income: 1000,
            global_income: 500,
            adsense_income: 0,
            affiliate_income: 0,
            updated_at: "2026-10-29T10:00:00.000Z",
          },
        });

        const wallet = await getUserWallet("FT483921");
        assert.equal(wallet.userId, "FT483921");
        assert.equal(wallet.balance, 1500.5);
        assert.equal(wallet.isStale, false, "Live wallet must be marked isStale: false");

        // Verify it synced into local storage
        const stored = getStoredWallets();
        assert.ok(stored["FT483921"]);
        assert.equal(stored["FT483921"]?.balance, 1500.5);
      } finally {
        api.wallet.getBalance = originalGetBalance;
      }
    });

    it("falls back to cached wallet with isStale: true when backend API fails", async () => {
      const cachedWallet: UserWallet = {
        userId: "FT483921",
        balance: 750,
        totalEarned: 1500,
        totalWithdrawn: 750,
        referralIncome: 500,
        globalIncome: 250,
        adsenseIncome: 0,
        affiliateIncome: 0,
        updatedAt: "2026-10-28T12:00:00.000Z",
        isStale: false,
      };
      saveStoredWallets({ FT483921: cachedWallet });

      const originalGetBalance = api.wallet.getBalance;
      try {
        api.wallet.getBalance = async () => {
          throw new Error("Failed to fetch: Server unreachable");
        };

        const wallet = await getUserWallet("FT483921");
        assert.equal(wallet.userId, "FT483921");
        assert.equal(wallet.balance, 750);
        assert.equal(
          wallet.isStale,
          true,
          "Cached fallback wallet must be flagged as isStale: true",
        );
      } finally {
        api.wallet.getBalance = originalGetBalance;
      }
    });

    it("returns safe unconfirmed default with isStale: true when cache is empty and API fails", async () => {
      const originalGetBalance = api.wallet.getBalance;
      try {
        api.wallet.getBalance = async () => {
          throw new Error("Network timeout");
        };

        const wallet = await getUserWallet("FT999999");
        assert.equal(wallet.userId, "FT999999");
        assert.equal(wallet.balance, 0);
        assert.equal(
          wallet.isStale,
          true,
          "Empty fallback wallet must be flagged as isStale: true",
        );
      } finally {
        api.wallet.getBalance = originalGetBalance;
      }
    });

    it("returns transactions with isStale: true from local storage when getTransactions fails", async () => {
      const cachedTx: LedgerTransaction = {
        id: "tx-cache-001",
        transactionId: "TX_TEST_001",
        userId: "FT483921",
        incomeType: "referral_income",
        amount: 50,
        status: "settled",
        description: "Cached referral income",
        createdAt: "2026-10-28T09:00:00.000Z",
      };
      saveStoredLedger([cachedTx]);

      const originalGetTransactions = api.wallet.getTransactions;
      try {
        api.wallet.getTransactions = async () => {
          throw new Error("503 Service Unavailable");
        };

        const txs = await getUserLedger("FT483921");
        assert.equal(txs.length, 1);
        assert.equal(txs[0]?.transactionId, "TX_TEST_001");
        assert.equal(txs[0]?.isStale, true, "Fallback transactions must be tagged isStale: true");
      } finally {
        api.wallet.getTransactions = originalGetTransactions;
      }
    });
  });

  // --------------------------------------------------------------------------
  // Suite 2: Stale Video Fallback
  // --------------------------------------------------------------------------
  describe("2. Stale Video Fallback", () => {
    it("returns live videos with isStale: false when api.videos.list succeeds", async () => {
      const originalList = api.videos.list;
      try {
        api.videos.list = async () => ({
          success: true,
          videos: [
            {
              id: "vid-live-101",
              user_id: "FT483921",
              creator_name: "Alex Rivera",
              title: "Live Video 101",
              video_type: "premium",
              content_type: "long",
              category: "Coding",
              payment_status: "paid",
            },
          ],
          total: 1,
        });

        const videos = await fetchUploadedVideos();
        assert.equal(videos.length, 1);
        assert.equal(videos[0]?.id, "vid-live-101");
        assert.equal(videos[0]?.isStale, false, "Live videos must be marked isStale: false");
      } finally {
        api.videos.list = originalList;
      }
    });

    it("falls back to stored videos with isStale: true when api.videos.list throws", async () => {
      const mockVideo: UploadedVideo = {
        id: "vid-stored-202",
        userId: "FT483921",
        creatorName: "Alex Rivera",
        title: "Stored Offline Video",
        description: "Test description",
        videoUrl: "/uploads/videos/sample.mp4",
        thumbnailUrl: "/uploads/images/sample.jpg",
        videoType: "free",
        contentType: "short",
        category: "Comedy",
        duration: "0:45",
        views: 120,
        likes: 15,
        paymentStatus: "not_required",
        paymentAmount: 0,
        isPromoted: false,
        createdAt: "2026-10-27T00:00:00.000Z",
        updatedAt: "2026-10-27T00:00:00.000Z",
        isStale: false,
      };
      saveStoredVideos([mockVideo]);

      const originalList = api.videos.list;
      try {
        api.videos.list = async () => {
          throw new Error("Network offline");
        };

        const videos = await fetchUploadedVideos();
        const found = videos.find((v) => v.id === "vid-stored-202");
        assert.ok(found, "Stored video should be returned on API failure");
        assert.equal(found?.isStale, true, "Fallback videos must be tagged isStale: true");

        // Verify category filtering still operates on stale fallback
        const comedyOnly = await fetchUploadedVideos({ category: "Comedy" });
        assert.ok(comedyOnly.some((v) => v.id === "vid-stored-202"));
        assert.ok(comedyOnly.every((v) => v.category.toLowerCase() === "comedy"));

        // Verify contentType filtering operates on stale fallback
        const shortsOnly = await fetchUploadedVideos({ contentType: "short" });
        assert.ok(shortsOnly.some((v) => v.id === "vid-stored-202"));
        assert.ok(shortsOnly.every((v) => v.contentType === "short"));
      } finally {
        api.videos.list = originalList;
      }
    });
  });

  // --------------------------------------------------------------------------
  // Suite 3: Stale Referral Fallback
  // --------------------------------------------------------------------------
  describe("3. Stale Referral Fallback", () => {
    it("returns live referral dashboard data with isStale: false on API success", async () => {
      const originalDashboard = api.referrals.getDashboard;
      try {
        api.referrals.getDashboard = async () => ({
          success: true,
          dashboard: {
            directReferralsCount: 5,
            teamMembersCount: 22,
            referralIncome: 350,
            referralCode: "FTVIP",
            referralNumber: "9876543210",
            referralLink: "https://facetube.online/register?ref=FTVIP",
            members: [],
          },
        });

        const data = await getReferralDashboardData("FT102857");
        assert.equal(data.directReferralsCount, 5);
        assert.equal(data.teamMembersCount, 22);
        assert.equal(data.referralIncome, 350);
        assert.equal(data.isStale, false, "Live dashboard data must be marked isStale: false");
      } finally {
        api.referrals.getDashboard = originalDashboard;
      }
    });

    it("falls back to local referral calculation with isStale: true on API failure", async () => {
      const originalDashboard = api.referrals.getDashboard;
      try {
        api.referrals.getDashboard = async () => {
          throw new Error("Connection timed out");
        };

        const data = await getReferralDashboardData("FT102857");
        assert.ok(data.directReferralsCount >= 0);
        assert.ok(data.teamMembersCount >= 0);
        assert.equal(
          data.isStale,
          true,
          "Fallback referral dashboard must be flagged as isStale: true",
        );
      } finally {
        api.referrals.getDashboard = originalDashboard;
      }
    });
  });

  // --------------------------------------------------------------------------
  // Suite 4: Withdrawal Timeout & AbortError Handling
  // --------------------------------------------------------------------------
  describe("4. Withdrawal Timeout, AbortError, and Network Error Resilience", () => {
    beforeEach(() => {
      // Seed an eligible wallet with balance of ₹5,000 for FT483921
      saveStoredWallets({
        FT483921: {
          userId: "FT483921",
          balance: 5000,
          totalEarned: 10000,
          totalWithdrawn: 5000,
          referralIncome: 4000,
          globalIncome: 1000,
          adsenseIncome: 0,
          affiliateIncome: 0,
          updatedAt: new Date().toISOString(),
          isStale: false,
        },
      });
      // Clear ledger
      saveStoredLedger([]);
    });

    it("enforces minimum withdrawal amount of ₹100", async () => {
      const res = await processWithdrawal("FT483921", 50);
      assert.equal(res.success, false);
      assert.ok(res.error?.includes("Minimum withdrawal amount is ₹100"));
      const wallet = getStoredWallets()["FT483921"];
      assert.equal(wallet?.balance, 5000, "Balance must not be modified");
    });

    it("enforces maximum daily limit of ₹10,000", async () => {
      const res = await processWithdrawal("FT483921", 10001);
      assert.equal(res.success, false);
      assert.ok(
        res.error?.includes("Daily limit exceeded") ||
          res.error?.includes("Daily withdrawal limit"),
      );
      const wallet = getStoredWallets()["FT483921"];
      assert.equal(wallet?.balance, 5000, "Balance must not be modified");
    });

    it("handles AbortError / timeout without deducting wallet or appending ledger transaction", async () => {
      const originalWithdraw = api.wallet.withdraw;
      const originalGetBalance = api.wallet.getBalance;
      try {
        api.wallet.getBalance = async () => ({
          success: true,
          wallet: {
            user_id: "FT483921",
            balance: 5000,
            total_earned: 10000,
            total_withdrawn: 5000,
            referral_income: 4000,
            global_income: 1000,
            adsense_income: 0,
            affiliate_income: 0,
            updated_at: new Date().toISOString(),
          },
        });

        // Simulate AbortError during fetch
        api.wallet.withdraw = async () => {
          const abortErr = new Error("The operation was aborted.");
          abortErr.name = "AbortError";
          throw abortErr;
        };

        const initialWallet = await getUserWallet("FT483921");
        assert.equal(initialWallet.balance, 5000);

        const res = await processWithdrawal("FT483921", 500, {
          upiId: "alex@upi",
          accountHolder: "Alex Rivera",
        });

        assert.equal(res.success, false, "Withdrawal must report failure when aborted");
        assert.ok(
          res.error?.includes("timed out or was aborted before confirmation"),
          `Expected unambiguous timeout/abort message, got: ${res.error}`,
        );
        assert.ok(
          res.error?.includes("check your transaction history before trying again"),
          `Expected instruction to check server transaction history, got: ${res.error}`,
        );
        assert.equal(
          res.error?.includes("No funds were deducted"),
          false,
          "Must NOT falsely claim no funds were deducted when response was lost",
        );

        // Verify balance is not locally deducted
        const wallets = getStoredWallets();
        assert.equal(
          wallets["FT483921"]?.balance,
          5000,
          "Wallet balance must not be locally deducted on ambiguous response",
        );

        // Verify no local settled ledger transaction was recorded
        const ledger = getStoredLedger();
        assert.equal(
          ledger.length,
          0,
          "No withdrawal ledger transaction should be settled locally",
        );
      } finally {
        api.wallet.withdraw = originalWithdraw;
        api.wallet.getBalance = originalGetBalance;
      }
    });

    it("handles network connection error without falsely claiming no funds were deducted", async () => {
      const originalWithdraw = api.wallet.withdraw;
      const originalGetBalance = api.wallet.getBalance;
      try {
        api.wallet.getBalance = async () => ({
          success: true,
          wallet: {
            user_id: "FT483921",
            balance: 5000,
            total_earned: 10000,
            total_withdrawn: 5000,
            referral_income: 4000,
            global_income: 1000,
            adsense_income: 0,
            affiliate_income: 0,
            updated_at: new Date().toISOString(),
          },
        });

        // Simulate TypeError / network failure
        api.wallet.withdraw = async () => {
          const netErr = new TypeError("Failed to fetch: Connection refused");
          throw netErr;
        };

        const res = await processWithdrawal("FT483921", 300, {
          upiId: "alex@upi",
        });

        assert.equal(res.success, false);
        assert.ok(
          res.error?.includes("network connection failure"),
          `Expected clear network failure message, got: ${res.error}`,
        );
        assert.ok(
          res.error?.includes("check your transaction history before trying again"),
          `Expected instruction to check server transaction history, got: ${res.error}`,
        );
        assert.equal(
          res.error?.includes("No funds were deducted"),
          false,
          "Must NOT falsely claim no funds were deducted when response was lost",
        );

        // Wallet balance untouched
        const wallets = getStoredWallets();
        assert.equal(wallets["FT483921"]?.balance, 5000);
        assert.equal(getStoredLedger().length, 0);
      } finally {
        api.wallet.withdraw = originalWithdraw;
        api.wallet.getBalance = originalGetBalance;
      }
    });

    it("handles explicit server decline response without deducting funds", async () => {
      const originalWithdraw = api.wallet.withdraw;
      const originalGetBalance = api.wallet.getBalance;
      try {
        api.wallet.getBalance = async () => ({
          success: true,
          wallet: {
            user_id: "FT483921",
            balance: 5000,
            total_earned: 10000,
            total_withdrawn: 5000,
            referral_income: 4000,
            global_income: 1000,
            adsense_income: 0,
            affiliate_income: 0,
            updated_at: new Date().toISOString(),
          },
        });

        api.wallet.withdraw = async () => ({
          success: false,
          error: "KYC bank verification required before payout.",
        });

        const res = await processWithdrawal("FT483921", 1000);
        assert.equal(res.success, false);
        assert.equal(res.error, "KYC bank verification required before payout.");

        const wallets = getStoredWallets();
        assert.equal(wallets["FT483921"]?.balance, 5000);
        assert.equal(getStoredLedger().length, 0);
      } finally {
        api.wallet.withdraw = originalWithdraw;
        api.wallet.getBalance = originalGetBalance;
      }
    });

    it("correctly executes confirmed withdrawal with exact fee deductions (₹12 total fee)", async () => {
      const originalWithdraw = api.wallet.withdraw;
      const originalGetBalance = api.wallet.getBalance;
      try {
        api.wallet.getBalance = async () => ({
          success: true,
          wallet: {
            user_id: "FT483921",
            balance: 5000,
            total_earned: 10000,
            total_withdrawn: 5000,
            referral_income: 4000,
            global_income: 1000,
            adsense_income: 0,
            affiliate_income: 0,
            updated_at: new Date().toISOString(),
          },
        });

        api.wallet.withdraw = async (data) => ({
          success: true,
          message: "Withdrawal request submitted successfully",
          transaction: {
            id: "tx-wd-confirmed-999",
            transaction_id: "TX_WD_CONFIRMED_999",
            amount: data.amount,
          },
          updatedWallet: {
            userId: "FT483921",
            balance: 5000 - data.amount,
            totalWithdrawn: 5000 + data.amount,
            totalEarned: 10000,
            referralIncome: 4000,
            globalIncome: 1000,
            adsenseIncome: 0,
            affiliateIncome: 0,
          },
        });

        // Request ₹500 withdrawal: fee is ₹100 (20% total deduction: 18% GST + 2% PG), net payable is ₹400
        const res = await processWithdrawal("FT483921", 500, {
          upiId: "alex@upi",
          accountHolder: "Alex Rivera",
        });

        assert.equal(res.success, true);
        assert.ok(res.transaction);
        assert.equal(res.transaction.amount, -500);
        assert.equal(res.transaction.fee, 100, "Fee must be ₹100");
        assert.equal(res.transaction.netAmount, 400, "Net payable must be ₹400 (500 - 100)");

        // Verify updated wallet balance
        assert.ok(res.updatedWallet);
        assert.equal(res.updatedWallet.balance, 4500);
        assert.equal(res.updatedWallet.totalWithdrawn, 5500);

        // Verify stored in ledger
        const ledger = getStoredLedger();
        assert.equal(ledger.length, 1);
        assert.equal(ledger[0]?.transactionId, "TX_WD_CONFIRMED_999");
        assert.equal(ledger[0]?.fee, 100);
        assert.equal(ledger[0]?.netAmount, 400);
      } finally {
        api.wallet.withdraw = originalWithdraw;
        api.wallet.getBalance = originalGetBalance;
      }
    });
  });
});
