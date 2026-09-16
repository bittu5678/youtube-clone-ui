/**
 * Password Security Utility for Facetube
 * Hashes passwords using standard SHA-256 digest for database storage.
 */

export async function hashPassword(password: string): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  // Fallback hashing if Web Crypto is unavailable
  let hash = 5381;
  for (let i = 0; i < password.length; i++) {
    hash = (hash * 33) ^ password.charCodeAt(i);
  }
  return "h_" + (hash >>> 0).toString(16) + "_" + password.length;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (!password || !storedHash) return false;

  // If user has plain text password in legacy seed data
  if (password === storedHash) {
    return true;
  }

  const computedHash = await hashPassword(password);
  return computedHash.toLowerCase() === storedHash.toLowerCase();
}
