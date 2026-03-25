import { apiFetch } from './http.js';

/**
 * User table fields sent to API: email, password (plain — server hashes to passwordHash).
 * @param {{ email: string; password: string }} payload
 */
export async function loginRequest(payload) {
  return apiFetch('/api/auth/login', {
    method: 'POST',
    json: {
      email: payload.email,
      password: payload.password,
    },
  });
}

/**
 * User table: name, email, password (plain). Server creates passwordHash.
 * @param {{ name: string; email: string; password: string }} payload
 */
export async function registerRequest(payload) {
  return apiFetch('/api/auth/register', {
    method: 'POST',
    json: {
      name: payload.name,
      email: payload.email,
      password: payload.password,
    },
  });
}
