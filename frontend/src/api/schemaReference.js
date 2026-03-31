// shared types and constants for the frontend and backend

// typedef UserPublic: { id, name, email, createdAt? }

// typedef Project: { id, name, description, joinCode, archived, createdAt, ownerUserId }

// typedef ProjectMember: { id, role, joinedAt, userId, projectId }

// typedef Sprint: { id, name, startDate, endDate, createdAt, projectId }

// typedef Task: { id, title, description, status, dueDate, createdAt, updatedAt, projectId, sprintId, assignedToId, createdById }

// possible values for task.status in the database
export const TASK_STATUS = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE',
};

export const TASK_STATUS_LIST = Object.freeze([
  TASK_STATUS.TODO,
  TASK_STATUS.IN_PROGRESS,
  TASK_STATUS.DONE,
]);

// task priority is ui-only for now (not stored in the DB)
export const TASK_PRIORITY = {
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
};

export const TASK_PRIORITY_LIST = Object.freeze([
  TASK_PRIORITY.HIGH,
  TASK_PRIORITY.MEDIUM,
  TASK_PRIORITY.LOW,
]);

// roles for project members
export const PROJECT_MEMBER_ROLE = {
  OWNER: 'OWNER',
  MEMBER: 'MEMBER',
};
