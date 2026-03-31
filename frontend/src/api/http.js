const API_BASE = import.meta.env.VITE_API_URL || '';

const AUTH_HEADER = 'Authorization';

function getStoredToken() {
  return localStorage.getItem('token');
}

// basic wrapper around fetch for our API
// - `path` should start with `/api/...`
// - `options.json` is sent as a JSON body
// - `options.auth` adds the token header from localStorage
export async function apiFetch(path, options) {
  const safeOptions = options || {};

  const bodyJson = safeOptions.json;
  const needsAuth = safeOptions.auth === true;

  const headers = new Headers(safeOptions.headers || {});

  if (bodyJson !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  if (needsAuth) {
    const token = getStoredToken();
    if (token) {
      headers.set(AUTH_HEADER, 'Bearer ' + token);
    }
  }

  const requestInit = {
    method: safeOptions.method || 'GET',
    headers: headers,
  };

  if (bodyJson !== undefined) {
    requestInit.body = JSON.stringify(bodyJson);
  }

  // if caller passed a raw body, allow it (used rarely)
  if (bodyJson === undefined && safeOptions.body !== undefined) {
    requestInit.body = safeOptions.body;
  }

  const response = await fetch(API_BASE + path, requestInit);
  return response;
}

export { API_BASE };
