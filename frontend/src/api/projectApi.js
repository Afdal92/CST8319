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

// get all projects (used for browsing and joining)
export async function getAllProjectsRequest() {
  return apiFetch('/api/projects', { method: 'GET', auth: true });
}

// list members for one project (includes user name and email)
export async function getProjectMembersRequest(projectId) {
  return apiFetch('/api/projects/' + projectId + '/members', {
    method: 'GET',
    auth: true,
  });
}

// update project name or description (owner only on server)
export async function updateProjectRequest(projectId, payload) {
  return apiFetch('/api/projects/' + projectId, {
    method: 'PATCH',
    auth: true,
    json: {
      name: payload.name,
      description: payload.description,
    },
  });
}

// add a user to the project by numeric user id (owner only on server)
export async function addProjectMemberRequest(projectId, userId) {
  return apiFetch('/api/projects/' + projectId + '/members', {
    method: 'POST',
    auth: true,
    json: { userId: Number(userId) },
  });
}

// delete the whole project (owner only on server)
export async function deleteProjectRequest(projectId) {
  return apiFetch('/api/projects/' + projectId, {
    method: 'DELETE',
    auth: true,
  });
}
