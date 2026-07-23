/**
 * sanitizeImageUri — CWE-601 Open Redirect Prevention
 *
 * Validates that a URI intended for use in a React Native <Image source={{ uri }} />
 * is a safe https:// or http:// URL (or a local file:// / data: URI).
 * Rejects anything that doesn't match, returning a safe placeholder instead.
 */

const ALLOWED_SCHEMES = /^(https?:\/\/|file:\/\/|data:image\/)/i;

export function sanitizeImageUri(uri: string | null | undefined, fallback = ''): string {
  if (!uri || typeof uri !== 'string') return fallback;
  const trimmed = uri.trim();
  if (!ALLOWED_SCHEMES.test(trimmed)) return fallback;
  try {
    return encodeURI(trimmed);
  } catch {
    return fallback;
  }
}
