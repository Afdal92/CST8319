import { apiFetch } from './http.js';

/**
 * Sprint table: name, startDate, endDate, projectId (ISO strings or dates accepted by `new Date()`).
 * @param {{ name: string; startDate: string; endDate: string; projectId: number }} payload
 */
export async function createSprintRequest(payload) {
  return apiFetch('/api/sprints', {
    method: 'POST',
    auth: true,
    json: {
      name: payload.name,
      startDate: payload.startDate,
      endDate: payload.endDate,
      projectId: payload.projectId,
    },
  });
}
