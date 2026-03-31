import { apiFetch } from './http.js';

// log a user in with email and password
// the server returns a token if it is successful
export async function loginRequest(payload) {
  return apiFetch('/api/auth/login', {
    method: 'POST',
    json: {
      email: payload.email,
      password: payload.password,
    },
  });
}

// create a new user account
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
