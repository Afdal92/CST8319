import { apiFetch } from './http.js';
import { TASK_STATUS_LIST } from './schemaReference.js';

// create a new task in a project
export async function createTaskRequest(payload) {
  return apiFetch('/api/tasks', {
    method: 'POST',
    auth: true,
    json: {
      title: payload.title,
      description: payload.description,
      projectId: payload.projectId,
      sprintId: payload.sprintId,
      assignedToId: payload.assignedToId,
      dueDate: payload.dueDate,
    },
  });
}

// update task fields like title, description, sprint, assignee, due date, or status
export async function updateTaskRequest(taskId, payload) {
  return apiFetch('/api/tasks/' + taskId, {
    method: 'PATCH',
    auth: true,
    json: {
      title: payload.title,
      description: payload.description,
      sprintId: payload.sprintId,
      assignedToId: payload.assignedToId,
      dueDate: payload.dueDate,
      status: payload.status,
    },
  });
}

// change only the status of a task (TODO / IN_PROGRESS / DONE)
export async function updateTaskStatusRequest(taskId, status) {
  if (!TASK_STATUS_LIST.includes(status)) {
    throw new Error('Invalid task status: ' + status);
  }

  return apiFetch('/api/tasks/' + taskId + '/status', {
    method: 'PATCH',
    auth: true,
    json: { status: status },
  });
}

// get all tasks for a single project
export async function getProjectTasksRequest(projectId) {
  return apiFetch('/api/tasks/project/' + projectId, {
    method: 'GET',
    auth: true,
  });
}

// delete one task
export async function deleteTaskRequest(taskId) {
  return apiFetch('/api/tasks/' + taskId, {
    method: 'DELETE',
    auth: true,
  });
}
