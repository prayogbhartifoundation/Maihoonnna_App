/**
 * Security URL & DOM Sanitizer for CWE-79 (DOM XSS) and CWE-601 (Open Redirect)
 */

const SAFE_IMAGE_SCHEMES = /^(https?:\/\/|data:image\/|blob:|\/)/i;

export function sanitizeImgSrc(url: string | null | undefined, fallback: string = ''): string {
  if (!url || typeof url !== 'string') return fallback;
  const trimmed = url.trim();
  if (!SAFE_IMAGE_SCHEMES.test(trimmed)) return fallback;
  try {
    return encodeURI(trimmed);
  } catch {
    return fallback;
  }
}

export function sanitizeTelLink(phone: string | null | undefined): string {
  if (!phone || typeof phone !== 'string') return '#';
  const cleanPhone = phone.replace(/[^\d+]/g, '');
  return cleanPhone ? `tel:${cleanPhone}` : '#';
}
