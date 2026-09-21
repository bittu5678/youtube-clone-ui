export interface PersonalKyc {
  id?: string;
  userId: string;
  fullName: string;
  mobile: string;
  dob: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  nomineeName: string;
  nomineeRelation: string;
  nomineeMobile: string;
  status: "Verified" | "Submitted" | "Pending";
  updatedAt?: string;
}

export type PersonalKycFormData = Omit<PersonalKyc, "id" | "userId" | "status" | "updatedAt">;

export interface BankKyc {
  id?: string;
  userId: string;
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branchName: string;
  accountType: "Saving" | "Current";
  upiId: string;
  upiQrCodeUrl?: string; // Base64 data URL or image link
  status: "Verified" | "Submitted" | "Pending";
  updatedAt?: string;
}

export type BankKycFormData = Omit<BankKyc, "id" | "userId" | "status" | "updatedAt">;
