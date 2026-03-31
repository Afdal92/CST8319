import { TASK_PRIORITY, TASK_PRIORITY_LIST } from '../api/schemaReference.js';

// all of this is saved in the browser only (localStorage). It fills gaps where the API
// does not save sprints, priorities, or task text the way the UI needs

const STORAGE_KEY = 'csh_project_ui_v1';

function defaultRoot() {
  return {
    sprints: {},
    priorities: {},
    removedTasks: {},
    removedSprints: {},
    taskOverrides: {},
  };
}

function readRoot() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultRoot();
    }

    const parsed = JSON.parse(raw);
    const root = defaultRoot();

    if (typeof parsed.sprints === 'object' && parsed.sprints !== null) {
      root.sprints = parsed.sprints;
    }
    if (typeof parsed.priorities === 'object' && parsed.priorities !== null) {
      root.priorities = parsed.priorities;
    }
    if (typeof parsed.removedTasks === 'object' && parsed.removedTasks !== null) {
      root.removedTasks = parsed.removedTasks;
    }
    if (typeof parsed.removedSprints === 'object' && parsed.removedSprints !== null) {
      root.removedSprints = parsed.removedSprints;
    }
    if (typeof parsed.taskOverrides === 'object' && parsed.taskOverrides !== null) {
      root.taskOverrides = parsed.taskOverrides;
    }

    return root;
  } catch {
    return defaultRoot();
  }
}

function writeRoot(root) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(root));
}

// --- Sprints we created here (no GET /sprints on the server) ---

export function getSprintRecord(sprintId) {
  if (sprintId == null) {
    return null;
  }
  const root = readRoot();
  const key = String(sprintId);
  if (root.sprints[key] === undefined) {
    return null;
  }
  return root.sprints[key];
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

// --- Task priority (stored per device) ---

export function getTaskPriority(projectId, taskId) {
  const root = readRoot();
  const projectKey = String(projectId);
  const taskKey = String(taskId);

  const stored = root.priorities[projectKey];
  if (!stored || stored[taskKey] === undefined) {
    return TASK_PRIORITY.MEDIUM;
  }

  const value = stored[taskKey];
  if (TASK_PRIORITY_LIST.includes(value)) {
    return value;
  }
  return TASK_PRIORITY.MEDIUM;
}

export function saveTaskPriority(projectId, taskId, priority) {
  if (!TASK_PRIORITY_LIST.includes(priority)) {
    return;
  }

  const root = readRoot();
  const projectKey = String(projectId);
  const taskKey = String(taskId);

  if (!root.priorities[projectKey]) {
    root.priorities[projectKey] = {};
  }
  root.priorities[projectKey][taskKey] = priority;
  writeRoot(root);
}

// --- Edits to title / description / sprint when the server does not PATCH them ---

export function mergeTaskWithUi(projectId, task) {
  const root = readRoot();
  const projectKey = String(projectId);
  const taskKey = String(task.id);

  let overrides = {};
  if (root.taskOverrides[projectKey] && root.taskOverrides[projectKey][taskKey]) {
    overrides = root.taskOverrides[projectKey][taskKey];
  }

  const merged = { ...task };

  if (typeof overrides.title === 'string') {
    merged.title = overrides.title;
  }
  if (overrides.description !== undefined) {
    merged.description = overrides.description;
  }
  if (overrides.sprintId !== undefined) {
    merged.sprintId = overrides.sprintId;
  }

  return merged;
}

function normalizeDescription(value) {
  if (value == null || value === '') {
    return null;
  }
  return String(value);
}

export function persistTaskEdit(projectId, serverTask, { title, description, sprintId }) {
  const projectKey = String(projectId);
  const taskKey = String(serverTask.id);
  const root = readRoot();

  if (!root.taskOverrides[projectKey]) {
    root.taskOverrides[projectKey] = {};
  }

  const before = root.taskOverrides[projectKey][taskKey] || {};
  const next = { ...before };

  const trimmedTitle = title.trim();
  if (trimmedTitle === serverTask.title) {
    delete next.title;
  } else {
    next.title = trimmedTitle;
  }

  const serverDesc = normalizeDescription(serverTask.description);
  const formDesc = normalizeDescription(description);
  if (formDesc === serverDesc) {
    delete next.description;
  } else {
    next.description = formDesc;
  }

  let serverSprint = serverTask.sprintId == null ? null : Number(serverTask.sprintId);
  let formSprint =
    sprintId == null || !Number.isFinite(Number(sprintId)) ? null : Number(sprintId);

  if (formSprint === serverSprint) {
    delete next.sprintId;
  } else {
    next.sprintId = formSprint;
  }

  const keysLeft = Object.keys(next);
  if (keysLeft.length === 0) {
    delete root.taskOverrides[projectKey][taskKey];
    const projectOverrides = root.taskOverrides[projectKey];
    if (Object.keys(projectOverrides).length === 0) {
      delete root.taskOverrides[projectKey];
    }
  } else {
    root.taskOverrides[projectKey][taskKey] = next;
  }

  writeRoot(root);
}

export function clearTaskUiOverrides(projectId, taskId) {
  const root = readRoot();
  const projectKey = String(projectId);
  const taskKey = String(taskId);

  if (!root.taskOverrides[projectKey] || !root.taskOverrides[projectKey][taskKey]) {
    return;
  }

  delete root.taskOverrides[projectKey][taskKey];
  if (Object.keys(root.taskOverrides[projectKey]).length === 0) {
    delete root.taskOverrides[projectKey];
  }
  writeRoot(root);
}

export function formatSprintDateRange(startDate, endDate) {
  if (!startDate || !endDate) {
    return '';
  }
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    const a = start.toLocaleDateString(undefined, options);
    const b = end.toLocaleDateString(undefined, options);
    return a + ' – ' + b;
  } catch {
    return '';
  }
}

// --- Hide tasks/sprints only in this browser ---

export function isTaskRemovedLocally(projectId, taskId) {
  const root = readRoot();
  const projectKey = String(projectId);
  const list = root.removedTasks[projectKey];
  if (!list) {
    return false;
  }
  return list.includes(String(taskId));
}

export function isSprintRemovedLocally(projectId, sprintId) {
  const root = readRoot();
  const projectKey = String(projectId);
  const list = root.removedSprints[projectKey];
  if (!list) {
    return false;
  }
  return list.includes(String(sprintId));
}

export function removeTaskLocally(projectId, taskId) {
  const root = readRoot();
  const projectKey = String(projectId);
  const taskKey = String(taskId);

  if (!root.removedTasks[projectKey]) {
    root.removedTasks[projectKey] = [];
  }
  if (!root.removedTasks[projectKey].includes(taskKey)) {
    root.removedTasks[projectKey].push(taskKey);
  }

  if (root.priorities[projectKey]) {
    delete root.priorities[projectKey][taskKey];
  }
  if (root.taskOverrides[projectKey]) {
    delete root.taskOverrides[projectKey][taskKey];
  }

  writeRoot(root);
}

export function removeSprintLocally(projectId, sprintId, taskIdsInSprint = []) {
  const root = readRoot();
  const projectKey = String(projectId);
  const sprintKey = String(sprintId);

  if (!root.removedSprints[projectKey]) {
    root.removedSprints[projectKey] = [];
  }
  if (!root.removedSprints[projectKey].includes(sprintKey)) {
    root.removedSprints[projectKey].push(sprintKey);
  }

  delete root.sprints[sprintKey];

  if (!root.removedTasks[projectKey]) {
    root.removedTasks[projectKey] = [];
  }
  const removedTaskIds = root.removedTasks[projectKey];

  for (let i = 0; i < taskIdsInSprint.length; i++) {
    const tid = String(taskIdsInSprint[i]);
    if (!removedTaskIds.includes(tid)) {
      removedTaskIds.push(tid);
    }
    if (root.priorities[projectKey]) {
      delete root.priorities[projectKey][tid];
    }
    if (root.taskOverrides[projectKey]) {
      delete root.taskOverrides[projectKey][tid];
    }
  }

  writeRoot(root);
}

// true = this id is a real number and not in the "removed locally" list
function shouldIncludeSprintId(id, removedStrings) {
  if (id == null || !Number.isFinite(Number(id))) {
    return false;
  }
  const asString = String(id);
  for (let i = 0; i < removedStrings.length; i++) {
    if (removedStrings[i] === asString) {
      return false;
    }
  }
  return true;
}

export function listSprintsForAssignment(projectId, sprintIdsFromTasks = [], extraSprintIds = []) {
  const root = readRoot();
  const projectKey = String(projectId);
  const removedList = root.removedSprints[projectKey] || [];

  const idNumbers = [];

  function addNumber(n) {
    if (!shouldIncludeSprintId(n, removedList)) {
      return;
    }
    const num = Number(n);
    if (!idNumbers.includes(num)) {
      idNumbers.push(num);
    }
  }

  for (let i = 0; i < sprintIdsFromTasks.length; i++) {
    addNumber(sprintIdsFromTasks[i]);
  }
  for (let j = 0; j < extraSprintIds.length; j++) {
    addNumber(extraSprintIds[j]);
  }

  const sprintEntries = Object.entries(root.sprints || {});
  for (let k = 0; k < sprintEntries.length; k++) {
    const sid = sprintEntries[k][0];
    const meta = sprintEntries[k][1];
    if (removedList.includes(String(sid))) {
      continue;
    }
    if (Number(meta && meta.projectId) === Number(projectId)) {
      addNumber(sid);
    }
  }

  idNumbers.sort(function (a, b) {
    return a - b;
  });

  const result = [];
  for (let m = 0; m < idNumbers.length; m++) {
    const id = idNumbers[m];
    const meta = getSprintRecord(id);
    result.push({
      id,
      name: meta && meta.name != null ? meta.name : null,
    });
  }

  return result;
}
