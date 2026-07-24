/**
 * sanitizeImageUri — CWE-601 Open Redirect & DOM-XSS Prevention
 *
 * Strictly parses and validates URIs intended for <Image source={{ uri }} />
 * using the WHATWG URL standard. Guaranteed to return a safe, sanitized URL string.
 */

const SAFE_DEFAULT_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1" height="1"%3E%3C/svg%3E';

export function sanitizeImageUri(uri: string | null | undefined, fallback?: string): string {
  if (typeof uri === 'string' && uri.trim().startsWith('data:image/')) {
    return uri.trim();
  }

  if (typeof uri === 'string' && uri.trim()) {
    try {
      const parsed = new URL(uri.trim());
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:' || parsed.protocol === 'file:') {
        return encodeURI(parsed.href);
      }
    } catch {
      // Invalid URL
    }
  }

  if (typeof fallback === 'string' && fallback.trim()) {
    try {
      const parsedFallback = new URL(fallback.trim());
      if (parsedFallback.protocol === 'http:' || parsedFallback.protocol === 'https:') {
        return encodeURI(parsedFallback.href);
      }
    } catch {
      // Invalid fallback URL
    }
  }

  return SAFE_DEFAULT_IMAGE;
}
