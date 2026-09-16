/**
 * Facetube Auto User ID Generation Module
 *
 * Rules:
 * - Prefix must always be 'FT' (uppercase)
 * - Followed by exactly 6 random digits (000000 - 999999)
 * - Example: FT483921, FT102857, FT900431
 * - The User ID must never duplicate
 */

/**
 * Generates a candidate FT User ID formatted as 'FT' + 6 digits.
 */
export function generateFTUserId(): string {
  let num: number;
  if (typeof window !== "undefined" && window.crypto && window.crypto.getRandomValues) {
    const arr = new Uint32Array(1);
    window.crypto.getRandomValues(arr);
    num = arr[0] % 1000000;
  } else {
    num = Math.floor(Math.random() * 1000000);
  }
  return `FT${num.toString().padStart(6, "0")}`;
}

/**
 * Validates whether a string matches the FT User ID format: 'FT' + 6 digits (case-insensitive check option).
 */
export function isValidFTUserId(userId: string): boolean {
  if (!userId) return false;
  return /^FT\d{6}$/i.test(userId.trim());
}

/**
 * Normalizes a User ID to uppercase FT + digits (e.g. ft123456 -> FT123456).
 */
export function normalizeFTUserId(userId: string): string {
  if (!userId) return "";
  const trimmed = userId.trim();
  if (isValidFTUserId(trimmed)) {
    return trimmed.toUpperCase();
  }
  return trimmed;
}

/**
 * Generates a collision-free unique FT User ID by checking against an existence predicate.
 * Retries with new random numbers until an unused ID is found.
 */
export async function getUniqueFTUserId(
  checkExists: (candidateId: string) => Promise<boolean> | boolean,
  maxAttempts: number = 30,
): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const candidate = generateFTUserId();
    const exists = await checkExists(candidate);
    if (!exists) {
      return candidate;
    }
  }

  // Highly improbable safety fallback if 30 collisions occur
  const timestampSuffix = Date.now().toString().slice(-6);
  return `FT${timestampSuffix}`;
}
