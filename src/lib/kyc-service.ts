import { api } from "./api";
import type { PersonalKyc, PersonalKycFormData, BankKyc, BankKycFormData } from "@/types/kyc";

const LOCAL_STORAGE_PERSONAL_KYC_PREFIX = "facetube_kyc_personal_";
const LOCAL_STORAGE_BANK_KYC_PREFIX = "facetube_kyc_bank_";

// Mock/Default seed data for pre-populating KYC for existing demo accounts
const DEFAULT_PERSONAL_KYC: Record<string, Partial<PersonalKyc>> = {
  FT102857: {
    fullName: "FaceTube Administrator",
    mobile: "+1 555-019-2834",
    dob: "1990-05-12",
    address: "742 Evergreen Terrace, Tech Park",
    city: "San Jose",
    state: "California",
    pincode: "95110",
    nomineeName: "Sarah Administrator",
    nomineeRelation: "Spouse",
    nomineeMobile: "+1 555-019-8821",
    status: "Verified",
  },
  FT483921: {
    fullName: "Alex Rivera",
    mobile: "+1 555-014-8392",
    dob: "1994-08-15",
    address: "402 Skyline Boulevard, Suite 120",
    city: "San Francisco",
    state: "California",
    pincode: "94107",
    nomineeName: "Elena Rivera",
    nomineeRelation: "Spouse",
    nomineeMobile: "+1 555-014-9921",
    status: "Verified",
  },
  FT900431: {
    fullName: "Maya Lin",
    mobile: "+1 555-019-0043",
    dob: "1996-11-20",
    address: "18 Orchard St, Creator Row",
    city: "New York",
    state: "New York",
    pincode: "10002",
    nomineeName: "David Lin",
    nomineeRelation: "Father",
    nomineeMobile: "+1 555-019-4411",
    status: "Submitted",
  },
};

const DEFAULT_BANK_KYC: Record<string, Partial<BankKyc>> = {
  FT102857: {
    accountHolderName: "FaceTube Administrator",
    bankName: "Silicon Valley Bank (First Citizens)",
    accountNumber: "918239019201",
    ifscCode: "SVBL0001048",
    branchName: "Santa Clara Tech Hub",
    accountType: "Current",
    upiId: "facetube.admin@okaxis",
    status: "Verified",
  },
  FT483921: {
    accountHolderName: "Alex Rivera",
    bankName: "Chase Bank (JPMorgan Chase)",
    accountNumber: "849201948201",
    ifscCode: "CHAS0002914",
    branchName: "Market St Financial Center",
    accountType: "Saving",
    upiId: "alexrivera@okhdfcbank",
    status: "Verified",
  },
  FT900431: {
    accountHolderName: "Maya Lin",
    bankName: "Bank of America",
    accountNumber: "482019482910",
    ifscCode: "BOFA0008412",
    branchName: "Midtown Manhattan",
    accountType: "Saving",
    upiId: "mayalin@okicici",
    status: "Submitted",
  },
};

/**
 * Load Personal KYC for a specific user ID
 */
export async function getPersonalKyc(
  userId: string,
  userDefaults?: { fullName?: string; mobile?: string },
): Promise<PersonalKyc> {
  const normId = userId.trim().toUpperCase();

  // 1. Fetch from PHP MySQL API
  try {
    const res = await api.kyc.getPersonal(normId);
    if (res && res.kyc) {
      const data = res.kyc;
      const kyc: PersonalKyc = {
        id: data.id,
        userId: data.user_id || data.userId,
        fullName: data.full_name || data.fullName,
        mobile: data.mobile,
        dob: data.dob || "",
        address: data.address || "",
        city: data.city || "",
        state: data.state || "",
        pincode: data.pincode || "",
        nomineeName: data.nominee_name || data.nomineeName || "",
        nomineeRelation: data.nominee_relation || data.nomineeRelation || "",
        nomineeMobile: data.nominee_mobile || data.nomineeMobile || "",
        status: data.status || "Submitted",
        updatedAt: data.updated_at || data.updatedAt,
      };
      saveLocalPersonalKyc(kyc);
      return kyc;
    }
  } catch (e) {
    // fallback to local storage
  }

  // 2. Read from LocalStorage
  const cached = getLocalPersonalKyc(normId);
  if (cached) {
    return cached;
  }

  // 3. Fallback to default seed or empty template
  const seed = DEFAULT_PERSONAL_KYC[normId] || {};
  const initial: PersonalKyc = {
    userId: normId,
    fullName: seed.fullName || userDefaults?.fullName || "",
    mobile: seed.mobile || userDefaults?.mobile || "",
    dob: seed.dob || "",
    address: seed.address || "",
    city: seed.city || "",
    state: seed.state || "",
    pincode: seed.pincode || "",
    nomineeName: seed.nomineeName || "",
    nomineeRelation: seed.nomineeRelation || "",
    nomineeMobile: seed.nomineeMobile || "",
    status: seed.status || "Pending",
    updatedAt: new Date().toISOString(),
  };

  saveLocalPersonalKyc(initial);
  return initial;
}

/**
 * Save Personal KYC to database & local storage
 */
export async function savePersonalKyc(
  userId: string,
  formData: PersonalKycFormData,
): Promise<{ success: boolean; data: PersonalKyc; error?: string }> {
  const normId = userId.trim().toUpperCase();
  const now = new Date().toISOString();

  const record: PersonalKyc = {
    userId: normId,
    ...formData,
    status: "Verified",
    updatedAt: now,
  };

  // 1. Persist to PHP MySQL API
  try {
    await api.kyc.savePersonal({
      user_id: normId,
      full_name: record.fullName,
      mobile: record.mobile,
      dob: record.dob,
      address: record.address,
      city: record.city,
      state: record.state,
      pincode: record.pincode,
      nominee_name: record.nomineeName,
      nominee_relation: record.nomineeRelation,
      nominee_mobile: record.nomineeMobile,
      status: record.status,
    });
  } catch (e) {
    console.warn("API savePersonal fallback:", e);
  }

  // 2. Always persist locally
  saveLocalPersonalKyc(record);

  return { success: true, data: record };
}

/**
 * Load Bank KYC for a specific user ID
 */
export async function getBankKyc(
  userId: string,
  userDefaults?: { fullName?: string },
): Promise<BankKyc> {
  const normId = userId.trim().toUpperCase();

  // 1. Fetch from PHP MySQL API
  try {
    const res = await api.kyc.getBank(normId);
    if (res && res.kyc) {
      const data = res.kyc;
      const kyc: BankKyc = {
        ...(data.id ? { id: data.id } : {}),
        userId: data.user_id || data.userId,
        accountHolderName: data.account_holder_name || data.accountHolderName,
        bankName: data.bank_name || data.bankName,
        accountNumber: data.account_number || data.accountNumber,
        ifscCode: data.ifsc_code || data.ifscCode,
        branchName: data.branch_name || data.branchName || "",
        accountType: (data.account_type || data.accountType) === "Current" ? "Current" : "Saving",
        upiId: data.upi_id || data.upiId || "",
        ...(data.upi_qr_code || data.upiQrCodeUrl
          ? { upiQrCodeUrl: data.upi_qr_code || data.upiQrCodeUrl }
          : {}),
        status: data.status || "Submitted",
        ...(data.updated_at || data.updatedAt
          ? { updatedAt: data.updated_at || data.updatedAt }
          : {}),
      };
      saveLocalBankKyc(kyc);
      return kyc;
    }
  } catch (e) {
    // fallback to local storage
  }

  // 2. Read from LocalStorage
  const cached = getLocalBankKyc(normId);
  if (cached) {
    return cached;
  }

  // 3. Fallback to default seed or empty template
  const seed = DEFAULT_BANK_KYC[normId] || {};
  const initial: BankKyc = {
    userId: normId,
    accountHolderName: seed.accountHolderName || userDefaults?.fullName || "",
    bankName: seed.bankName || "",
    accountNumber: seed.accountNumber || "",
    ifscCode: seed.ifscCode || "",
    branchName: seed.branchName || "",
    accountType: (seed.accountType as "Saving" | "Current") || "Saving",
    upiId: seed.upiId || "",
    ...(seed.upiQrCodeUrl ? { upiQrCodeUrl: seed.upiQrCodeUrl } : {}),
    status: seed.status || "Pending",
    updatedAt: new Date().toISOString(),
  };

  saveLocalBankKyc(initial);
  return initial;
}

/**
 * Save Bank KYC to database & local storage
 */
export async function saveBankKyc(
  userId: string,
  formData: BankKycFormData,
): Promise<{ success: boolean; data: BankKyc; error?: string }> {
  const normId = userId.trim().toUpperCase();
  const now = new Date().toISOString();

  const record: BankKyc = {
    userId: normId,
    ...formData,
    status: "Verified",
    updatedAt: now,
  };

  // 1. Persist to PHP MySQL API
  try {
    await api.kyc.saveBank({
      user_id: normId,
      account_holder_name: record.accountHolderName,
      bank_name: record.bankName,
      account_number: record.accountNumber,
      ifsc_code: record.ifscCode.toUpperCase(),
      branch_name: record.branchName,
      account_type: record.accountType,
      upi_id: record.upiId,
      upi_qr_code: record.upiQrCodeUrl || null,
      status: record.status,
    });
  } catch (e) {
    console.warn("API saveBank fallback:", e);
  }

  // 2. Always persist locally
  saveLocalBankKyc(record);

  return { success: true, data: record };
}

// Helpers for LocalStorage caching
function getLocalPersonalKyc(userId: string): PersonalKyc | null {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_PERSONAL_KYC_PREFIX}${userId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveLocalPersonalKyc(kyc: PersonalKyc): void {
  try {
    localStorage.setItem(`${LOCAL_STORAGE_PERSONAL_KYC_PREFIX}${kyc.userId}`, JSON.stringify(kyc));
  } catch {
    // quota error
  }
}

function getLocalBankKyc(userId: string): BankKyc | null {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_BANK_KYC_PREFIX}${userId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveLocalBankKyc(kyc: BankKyc): void {
  try {
    localStorage.setItem(`${LOCAL_STORAGE_BANK_KYC_PREFIX}${kyc.userId}`, JSON.stringify(kyc));
  } catch {
    // quota error
  }
}
