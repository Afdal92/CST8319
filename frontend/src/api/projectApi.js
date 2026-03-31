import { apiFetch } from './http.js';

// create a new project
// only `name` is required; `description` is optional
export async function createProjectRequest(payload) {
  const descriptionToSend =
    payload.description === null || payload.description === undefined
      ? undefined
      : payload.description;

  return apiFetch('/api/projects', {
    method: 'POST',
    auth: true,
    json: {
      name: payload.name,
      description: descriptionToSend,
    },
  });
}

// join an existing project using a join code
export async function joinProjectRequest(payload) {
  return apiFetch('/api/projects/join', {
    method: 'POST',
    auth: true,
    json: { joinCode: payload.joinCode },
  });
}

// get all projects the current user belongs to
export async function getMyProjectsRequest() {
  return apiFetch('/api/projects/my', { method: 'GET', auth: true });
}
