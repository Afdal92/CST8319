/**
 * Read JWT payload for display only (not verified). Backend signs `{ id, email }` in `authController.login`.
 * @param {string | null} token
 * @returns {{ id?: number; email?: string; exp?: number } | null}
 */
export function decodeJwtPayload(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const pad = (4 - (b64.length % 4)) % 4;
    const padded = b64 + '='.repeat(pad);
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function displayNameFromEmail(email) {
  if (!email || typeof email !== 'string') return 'User';
  const local = email.split('@')[0] || email;
  return local
    .replace(/[._-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export function initialsFromName(name) {
  if (!name || typeof name !== 'string') return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
