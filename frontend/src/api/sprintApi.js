import { apiFetch } from './http.js';

// create a sprint (time box) for a project
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
