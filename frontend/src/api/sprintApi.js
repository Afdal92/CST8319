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

// get all sprints for one project
export async function getProjectSprintsRequest(projectId) {
  return apiFetch('/api/sprints/project/' + projectId, {
    method: 'GET',
    auth: true,
  });
}

// update sprint fields
export async function updateSprintRequest(sprintId, payload) {
  return apiFetch('/api/sprints/' + sprintId, {
    method: 'PATCH',
    auth: true,
    json: {
      name: payload.name,
      startDate: payload.startDate,
      endDate: payload.endDate,
    },
  });
}

// delete a sprint
export async function deleteSprintRequest(sprintId) {
  return apiFetch('/api/sprints/' + sprintId, {
    method: 'DELETE',
    auth: true,
  });
}
