import { TASK_PRIORITY, TASK_PRIORITY_LIST } from '../api/schemaReference.js';

const STORAGE_KEY = 'csh_project_ui_v1';

function readRoot() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { sprints: {}, priorities: {}, removedTasks: {}, removedSprints: {} };
    }
    const p = JSON.parse(raw);
    return {
      sprints: typeof p.sprints === 'object' && p.sprints ? p.sprints : {},
      priorities: typeof p.priorities === 'object' && p.priorities ? p.priorities : {},
      removedTasks: typeof p.removedTasks === 'object' && p.removedTasks ? p.removedTasks : {},
      removedSprints: typeof p.removedSprints === 'object' && p.removedSprints ? p.removedSprints : {},
    };
  } catch {
    return { sprints: {}, priorities: {}, removedTasks: {}, removedSprints: {} };
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
