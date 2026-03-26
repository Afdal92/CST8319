import { TASK_PRIORITY, TASK_PRIORITY_LIST } from '../api/schemaReference.js';

const STORAGE_KEY = 'csh_project_ui_v1';

function readRoot() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        sprints: {},
        priorities: {},
        removedTasks: {},
        removedSprints: {},
        taskOverrides: {},
      };
    }
    const p = JSON.parse(raw);
    return {
      sprints: typeof p.sprints === 'object' && p.sprints ? p.sprints : {},
      priorities: typeof p.priorities === 'object' && p.priorities ? p.priorities : {},
      removedTasks: typeof p.removedTasks === 'object' && p.removedTasks ? p.removedTasks : {},
      removedSprints: typeof p.removedSprints === 'object' && p.removedSprints ? p.removedSprints : {},
      taskOverrides:
        typeof p.taskOverrides === 'object' && p.taskOverrides ? p.taskOverrides : {},
    };
  } catch {
    return {
      sprints: {},
      priorities: {},
      removedTasks: {},
      removedSprints: {},
      taskOverrides: {},
    };
  }
}

function writeRoot(root) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(root));
}

/**
 * Cache for Sprint rows created in this app (backend has no GET /sprints).
 * Maps Sprint.id → { name, startDate, endDate, projectId } aligned with prisma `Sprint`.
 */
export function getSprintRecord(sprintId) {
  if (sprintId == null) return null;
  const root = readRoot();
  return root.sprints[String(sprintId)] ?? null;
}

export function saveSprintRecord(sprintId, { name, startDate, endDate, projectId }) {
  const root = readRoot();
  root.sprints[String(sprintId)] = {
    name,
    startDate,
    endDate,
    projectId,
  };
  writeRoot(root);
}

export function getTaskPriority(projectId, taskId) {
  const v = readRoot().priorities[String(projectId)]?.[String(taskId)];
  if (TASK_PRIORITY_LIST.includes(v)) return v;
  return TASK_PRIORITY.MEDIUM;
}

export function saveTaskPriority(projectId, taskId, priority) {
  if (!TASK_PRIORITY_LIST.includes(priority)) return;
  const root = readRoot();
  if (!root.priorities[String(projectId)]) root.priorities[String(projectId)] = {};
  root.priorities[String(projectId)][String(taskId)] = priority;
  writeRoot(root);
}

/**
 * Merge server task row with per-device edits (title / description / sprintId).
 * Backend has no PATCH for these fields; overrides match how priority is stored.
 */
export function mergeTaskWithUi(projectId, task) {
  const o = readRoot().taskOverrides[String(projectId)]?.[String(task.id)] ?? {};
  return {
    ...task,
    ...(typeof o.title === 'string' ? { title: o.title } : {}),
    ...(o.description !== undefined ? { description: o.description } : {}),
    ...(o.sprintId !== undefined ? { sprintId: o.sprintId } : {}),
  };
}

function normDescription(d) {
  if (d == null || d === '') return null;
  return String(d);
}

/**
 * Persist title, description, sprintId overrides vs server task. Omits keys that match server.
 */
export function persistTaskEdit(projectId, serverTask, { title, description, sprintId }) {
  const pk = String(projectId);
  const tk = String(serverTask.id);
  const root = readRoot();
  if (!root.taskOverrides[pk]) root.taskOverrides[pk] = {};

  const next = { ...(root.taskOverrides[pk][tk] || {}) };
  const trimmedTitle = title.trim();
  if (trimmedTitle === serverTask.title) delete next.title;
  else next.title = trimmedTitle;

  const sd = normDescription(serverTask.description);
  const fd = normDescription(description);
  if (fd === sd) delete next.description;
  else next.description = fd;

  const ss = serverTask.sprintId == null ? null : Number(serverTask.sprintId);
  const fs = sprintId == null || !Number.isFinite(Number(sprintId)) ? null : Number(sprintId);
  if (fs === ss) delete next.sprintId;
  else next.sprintId = fs;

  if (Object.keys(next).length === 0) {
    delete root.taskOverrides[pk][tk];
    if (Object.keys(root.taskOverrides[pk]).length === 0) delete root.taskOverrides[pk];
  } else {
    root.taskOverrides[pk][tk] = next;
  }
  writeRoot(root);
}

export function clearTaskUiOverrides(projectId, taskId) {
  const root = readRoot();
  const pk = String(projectId);
  const tk = String(taskId);
  if (root.taskOverrides[pk]?.[tk]) {
    delete root.taskOverrides[pk][tk];
    if (Object.keys(root.taskOverrides[pk]).length === 0) delete root.taskOverrides[pk];
    writeRoot(root);
  }
}

export function formatSprintDateRange(startDate, endDate) {
  if (!startDate || !endDate) return '';
  try {
    const a = new Date(startDate);
    const b = new Date(endDate);
    const o = { month: 'short', day: 'numeric', year: 'numeric' };
    return `${a.toLocaleDateString(undefined, o)} – ${b.toLocaleDateString(undefined, o)}`;
  } catch {
    return '';
  }
}

/**
 * Sprints the user can assign a new task to (Sprint.id), for this Project.id.
 * Union of: Sprint ids already on tasks, cached sprints for this project, and any extra ids (e.g. focused sprint).
 */
export function isTaskRemovedLocally(projectId, taskId) {
  const list = readRoot().removedTasks[String(projectId)] ?? [];
  return list.includes(String(taskId));
}

export function isSprintRemovedLocally(projectId, sprintId) {
  const list = readRoot().removedSprints[String(projectId)] ?? [];
  return list.includes(String(sprintId));
}

/**
 * Hide a task in this browser only (no DELETE /api/tasks). Strips cached priority for that task.
 */
export function removeTaskLocally(projectId, taskId) {
  const root = readRoot();
  const pk = String(projectId);
  const tk = String(taskId);
  if (!root.removedTasks[pk]) root.removedTasks[pk] = [];
  if (!root.removedTasks[pk].includes(tk)) root.removedTasks[pk].push(tk);
  if (root.priorities[pk]) delete root.priorities[pk][tk];
  if (root.taskOverrides[pk]) delete root.taskOverrides[pk][tk];
  writeRoot(root);
}

/**
 * Hide a sprint and all given task ids in this browser only (no DELETE API).
 * Drops cached sprint metadata so it disappears from pickers.
 */
export function removeSprintLocally(projectId, sprintId, taskIdsInSprint = []) {
  const root = readRoot();
  const pk = String(projectId);
  const sk = String(sprintId);
  if (!root.removedSprints[pk]) root.removedSprints[pk] = [];
  if (!root.removedSprints[pk].includes(sk)) root.removedSprints[pk].push(sk);
  delete root.sprints[sk];
  if (!root.removedTasks[pk]) root.removedTasks[pk] = [];
  const rt = root.removedTasks[pk];
  for (const tid of taskIdsInSprint) {
    const tk = String(tid);
    if (!rt.includes(tk)) rt.push(tk);
    if (root.priorities[pk]) delete root.priorities[pk][tk];
    if (root.taskOverrides[pk]) delete root.taskOverrides[pk][tk];
  }
  writeRoot(root);
}

export function listSprintsForAssignment(projectId, sprintIdsFromTasks = [], extraSprintIds = []) {
  const root = readRoot();
  const removedS = new Set(root.removedSprints[String(projectId)] ?? []);
  const ids = new Set(
    [...sprintIdsFromTasks, ...extraSprintIds]
      .filter((x) => x != null && Number.isFinite(Number(x)) && !removedS.has(String(x)))
      .map(Number)
  );
  for (const [sid, meta] of Object.entries(root.sprints || {})) {
    if (removedS.has(String(sid))) continue;
    if (Number(meta?.projectId) === Number(projectId)) {
      ids.add(Number(sid));
    }
  }
  return [...ids]
    .sort((a, b) => a - b)
    .map((id) => {
      const meta = getSprintRecord(id);
      return { id, name: meta?.name ?? null };
    });
}
