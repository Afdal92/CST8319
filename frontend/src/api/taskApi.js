import { apiFetch } from './http.js';
import { TASK_STATUS_LIST } from './schemaReference.js';

/**
 * Task table fields accepted on create (see `taskController.createTask`).
 * @param {{
 *   title: string;
 *   description?: string | null;
 *   projectId: number;
 *   sprintId?: number | null;
 *   assignedToId?: number | null;
 *   dueDate?: string | null;
 * }} payload
 */
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

/**
 * Updates Task.status only. Must be one of TASK_STATUS_* (schemaReference / backend allow-list).
 * @param {number} taskId - Task.id
 * @param {string} status - TASK_STATUS.TODO | TASK_STATUS.IN_PROGRESS | TASK_STATUS.DONE
 */
export async function updateTaskStatusRequest(taskId, status) {
  if (!TASK_STATUS_LIST.includes(status)) {
    throw new Error(`Invalid task status: ${status}`);
  }
  return apiFetch(`/api/tasks/${taskId}/status`, {
    method: 'PATCH',
    auth: true,
    json: { status },
  });
}

/** @param {number} projectId - Project.id */
export async function getProjectTasksRequest(projectId) {
  return apiFetch(`/api/tasks/project/${projectId}`, {
    method: 'GET',
    auth: true,
  });
}
