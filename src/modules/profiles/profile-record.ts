export const PROFILE_NAME_MIN = 2;
export const PROFILE_NAME_MAX = 255;
export const PROFILE_PHONE_MIN = 6;
export const PROFILE_PHONE_MAX = 32;
export const PROFILE_ADDRESS_MAX = 500;

export const DEFAULT_PROFILE_STATUS = "EN_EVALUATION";
export const DEFAULT_PROFILE_CURRENCY = "USD";

export type ProfileErrorCode =
  | "NAME_REQUIRED"
  | "PHONE_REQUIRED"
  | "PHONE_INVALID"
  | "NOT_FOUND"
  | "NOT_AUTHORIZED";

export class ProfileError extends Error {
  code: ProfileErrorCode;
  constructor(code: ProfileErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export type ProfileSummary = {
  id: string;
  name: string;
  phone: string;
  status: string;
  limitAmount: number;
  limitCurrency: string;
};

export type PreparedProfile = {
  name: string;
  phone: string;
  address: string | null;
};

export function normalizePhone(value: unknown): string {
  return String(value ?? "")
    .replace(/[\s.\-()]/g, "")
    .trim();
}

export function prepareCounterProfile(input: {
  name: unknown;
  phone: unknown;
  address?: unknown;
}): PreparedProfile {
  const name = String(input.name ?? "").trim();
  if (name.length < PROFILE_NAME_MIN) {
    throw new ProfileError(
      "NAME_REQUIRED",
      "Le nom du client est obligatoire.",
    );
  }
  const phone = normalizePhone(input.phone);
  if (phone.length < PROFILE_PHONE_MIN) {
    throw new ProfileError(
      "PHONE_REQUIRED",
      "Le numéro de téléphone est obligatoire : c'est lui qui retrouve le client.",
    );
  }
  const address = String(input.address ?? "").trim();
  return {
    name: name.slice(0, PROFILE_NAME_MAX),
    phone: phone.slice(0, PROFILE_PHONE_MAX),
    address: address === "" ? null : address.slice(0, PROFILE_ADDRESS_MAX),
  };
}
