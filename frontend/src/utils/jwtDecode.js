// helpers for showing who is logged in. JWT is only decoded for display — the server still checks it

// read the middle part of a JWT (payload). does not verify the signature
export function decodeJwtPayload(token) {
  if (!token || typeof token !== 'string') {
    return null;
  }

  const pieces = token.split('.');
  if (pieces.length < 2) {
    return null;
  }

  try {
    // jwt uses base64url; browser atob() wants normal base64
    let base64 = pieces[1].replace(/-/g, '+').replace(/_/g, '/');
    const paddingNeeded = (4 - (base64.length % 4)) % 4;
    base64 = base64 + '='.repeat(paddingNeeded);

    const jsonText = atob(base64);
    return JSON.parse(jsonText);
  } catch {
    return null;
  }
}

// turn "john.doe@mail.com" into "John Doe" for a friendly label
export function displayNameFromEmail(email) {
  if (!email || typeof email !== 'string') {
    return 'User';
  }

  const localPart = email.split('@')[0];
  if (!localPart) {
    return 'User';
  }

  const withSpaces = localPart.replace(/[._-]+/g, ' ');
  const words = withSpaces.split(' ').filter(function (w) {
    return w.length > 0;
  });

  const prettyWords = [];
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const first = w.charAt(0).toUpperCase();
    const rest = w.slice(1).toLowerCase();
    prettyWords.push(first + rest);
  }

  return prettyWords.join(' ');
}

// two letters for an avatar, e.g. "John Doe" -> "JD"
export function initialsFromName(name) {
  if (!name || typeof name !== 'string') {
    return '?';
  }

  const trimmed = name.trim();
  const parts = trimmed.split(/\s+/);

  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  const first = parts[0].charAt(0).toUpperCase();
  const last = parts[parts.length - 1].charAt(0).toUpperCase();
  return first + last;
}
