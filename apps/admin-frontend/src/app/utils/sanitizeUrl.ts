/**
 * Security URL & DOM Sanitizer for CWE-79 (DOM XSS) and CWE-601 (Open Redirect)
 */

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:', 'file:']);

export function sanitizeImgSrc(url: string | null | undefined, fallback: string = ''): string {
  if (!url || typeof url !== 'string') return fallback;
  const trimmed = url.trim();
  if (!trimmed) return fallback;

  if (trimmed.startsWith('data:image/') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    if (ALLOWED_PROTOCOLS.has(parsed.protocol)) {
      return encodeURI(parsed.href);
    }
  } catch {
    if (trimmed.startsWith('/')) {
      return encodeURI(trimmed);
    }
  }
  return fallback;
}

export function sanitizeTelLink(phone: string | null | undefined): string {
  if (!phone || typeof phone !== 'string') return '#';
  const cleanPhone = phone.replace(/[^\d+]/g, '');
  if (!cleanPhone) return '#';
  try {
    return encodeURI(`tel:${cleanPhone}`);
  } catch {
    return '#';
  }
}

export function sanitizeWhatsappLink(phone: string | null | undefined): string {
  if (!phone || typeof phone !== 'string') return '#';
  const cleanPhone = phone.replace(/\D/g, '');
  if (!cleanPhone) return '#';
  try {
    return encodeURI(`https://wa.me/${encodeURIComponent(cleanPhone)}`);
  } catch {
    return '#';
  }
}

