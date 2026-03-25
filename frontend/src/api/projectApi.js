import { apiFetch } from './http.js';

/**
 * Project: name, description (optional). Server sets joinCode, ownerUserId, members row (OWNER).
 * @param {{ name: string; description?: string | null }} payload
 */
export async function createProjectRequest(payload) {
  return apiFetch('/api/projects', {
    method: 'POST',
    auth: true,
    json: {
      name: payload.name,
      description: payload.description ?? undefined,
    },
  });
}

/**
 * Join via Project.joinCode.
 * @param {{ joinCode: string }} payload
 */
export async function joinProjectRequest(payload) {
  return apiFetch('/api/projects/join', {
    method: 'POST',
    auth: true,
    json: { joinCode: payload.joinCode },
  });
}

/** @returns {Promise<Response>} JSON array of Project (user's memberships → project only). */
export async function getMyProjectsRequest() {
  return apiFetch('/api/projects/my', { method: 'GET', auth: true });
}
