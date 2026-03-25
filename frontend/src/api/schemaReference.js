
/** @typedef {{ id: number; name: string; email: string; createdAt?: string }} UserPublic */

/** @typedef {{ id: number; name: string; description: string | null; joinCode: string; archived: boolean; createdAt: string; ownerUserId: number }} Project */

/** @typedef {{ id: number; role: string; joinedAt: string; userId: number; projectId: number }} ProjectMember */

/** @typedef {{ id: number; name: string; startDate: string; endDate: string; createdAt: string; projectId: number }} Sprint */

/** @typedef {{ id: number; title: string; description: string | null; status: string; dueDate: string | null; createdAt: string; updatedAt: string; projectId: number; sprintId: number | null; assignedToId: number | null; createdById: number }} Task */

/** Matches `taskController` allowedStatuses — maps to Task.status in the DB. */
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

/** UI-only until `Task` has a priority column in prisma/schema.prisma. */
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

/** Matches roles written in `projectController` (ProjectMember.role). */
export const PROJECT_MEMBER_ROLE = {
  OWNER: 'OWNER',
  MEMBER: 'MEMBER',
};
