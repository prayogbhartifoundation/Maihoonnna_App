/**
 * sanitizeImageUri — CWE-601 Open Redirect Prevention
 *
 * Validates that a URI intended for use in a React Native <Image source={{ uri }} />
 * is a safe https:// or http:// URL (or a local file:// / data: URI).
 * Rejects anything that doesn't match, returning a safe placeholder instead.
 */

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:', 'file:']);

export function sanitizeImageUri(uri: string | null | undefined, fallback = ''): string {
  if (!uri || typeof uri !== 'string') return fallback;
  const trimmed = uri.trim();
  if (!trimmed) return fallback;

  if (trimmed.startsWith('data:image/')) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    if (ALLOWED_PROTOCOLS.has(parsed.protocol)) {
      return encodeURI(parsed.href);
    }
  } catch {
    // If not a valid absolute URL, return safe fallback
  }
  return fallback;
}

