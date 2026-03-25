const API_BASE = import.meta.env.VITE_API_URL || '';

const AUTH_HEADER = 'Authorization';

function getStoredToken() {
  return localStorage.getItem('token');
}

/**
 * @param {string} path - e.g. `/api/projects/my` (leading slash, no base — base is prepended)
 * @param {RequestInit & { json?: unknown; auth?: boolean }} [options]
 */
export async function apiFetch(path, options = {}) {
  const { json: body, auth = false, headers: initHeaders, ...rest } = options;

  const headers = new Headers(initHeaders || {});
  if (body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }
  if (auth) {
    const token = getStoredToken();
    if (token) {
      headers.set(AUTH_HEADER, `Bearer ${token}`);
    }
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers,
    body: body !== undefined ? JSON.stringify(body) : rest.body,
  });

  return res;
}

export { API_BASE };
