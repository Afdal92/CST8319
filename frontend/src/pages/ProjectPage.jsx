import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import DashboardNav from '../components/dashboard/DashboardNav.jsx';
import AppFooter from '../components/layout/AppFooter.jsx';
import {
  TASK_STATUS,
  TASK_PRIORITY,
  getMyProjectsRequest,
  getProjectTasksRequest,
  createTaskRequest,
  updateTaskStatusRequest,
  createSprintRequest,
} from '../api/index.js';
import {
  getSprintRecord,
  saveSprintRecord,
  getTaskPriority,
  saveTaskPriority,
  formatSprintDateRange,
  listSprintsForAssignment,
  isSprintRemovedLocally,
  isTaskRemovedLocally,
  removeTaskLocally,
  removeSprintLocally,
  mergeTaskWithUi,
  persistTaskEdit,
} from '../utils/projectUiStorage.js';
import './DashboardPage.css';
import './ProjectPage.css';

const PRI_ORDER = { HIGH: 0, MEDIUM: 1, LOW: 2 };

function statusLabel(status) {
  if (status === TASK_STATUS.DONE) return 'Done';
  if (status === TASK_STATUS.IN_PROGRESS) return 'In progress';
  return 'To do';
}

function sprintDisplayForTask(task) {
  if (task.sprintId == null) {
    return {
      badge: 'Backlog',
      line: 'Not assigned to a sprint yet — lives in the product backlog',
    };
  }
  const meta = getSprintRecord(task.sprintId);
  const range = meta ? formatSprintDateRange(meta.startDate, meta.endDate) : '';
  if (meta) {
    return {
      badge: meta.name,
      line: range ? `${range} · Sprint #${task.sprintId}` : `Sprint #${task.sprintId}`,
    };
  }
  return {
    badge: `Sprint #${task.sprintId}`,
    line: 'Create this sprint in the app to show its name and dates here',
  };
}

function sortBoardTasks(tasks, projectId) {
  return [...tasks].sort((a, b) => {
    const pa = PRI_ORDER[getTaskPriority(projectId, a.id)] ?? 1;
    const pb = PRI_ORDER[getTaskPriority(projectId, b.id)] ?? 1;
    if (pa !== pb) return pa - pb;
    const sa = a.sprintId == null ? 1e9 : Number(a.sprintId);
    const sb = b.sprintId == null ? 1e9 : Number(b.sprintId);
    if (sa !== sb) return sa - sb;
    return a.id - b.id;
  });
}

function priorityLabel(level) {
  if (level === TASK_PRIORITY.HIGH) return 'High';
  if (level === TASK_PRIORITY.LOW) return 'Low';
  return 'Medium';
}

function PriorityPill({ level }) {
  const cls =
    level === TASK_PRIORITY.HIGH
      ? 'priority-pill priority-pill--high'
      : level === TASK_PRIORITY.LOW
        ? 'priority-pill priority-pill--low'
        : 'priority-pill priority-pill--med';
  return <span className={cls}>{priorityLabel(level)}</span>;
}

function assigneeInitial(task) {
  if (task.assignedToId == null) return '?';
  const n = Number(task.assignedToId);
  return String.fromCharCode(65 + (Math.abs(n) % 26));
}

function TaskCardMenu({ task, onStatus, onPriority, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="position-relative">
      <button
        type="button"
        className="kanban-task-card__menu rounded"
        aria-label="Task actions"
        onClick={() => setOpen((o) => !o)}
      >
        ⋮
      </button>
      {open ? (
        <>
          <button type="button" className="position-fixed top-0 start-0 w-100 h-100 p-0 border-0" style={{ zIndex: 10, background: 'transparent', cursor: 'default' }} aria-label="Close menu" onClick={() => setOpen(false)} />
          <ul className="dropdown-menu show position-absolute end-0 mt-1 shadow-sm" style={{ zIndex: 20, minWidth: 180 }}>
            <li className="dropdown-header small text-muted px-3 py-1">Move on board</li>
            <li>
              <button type="button" className="dropdown-item small" onClick={() => { onStatus(TASK_STATUS.TODO); setOpen(false); }}>
                Move to To Do
              </button>
            </li>
            <li>
              <button type="button" className="dropdown-item small" onClick={() => { onStatus(TASK_STATUS.IN_PROGRESS); setOpen(false); }}>
                Move to In Progress
              </button>
            </li>
            <li>
              <button type="button" className="dropdown-item small" onClick={() => { onStatus(TASK_STATUS.DONE); setOpen(false); }}>
                Move to Done
              </button>
            </li>
            <li><hr className="dropdown-divider my-1" /></li>
            <li className="dropdown-header small text-muted px-3 py-1">Priority</li>
            <li>
              <button type="button" className="dropdown-item small" onClick={() => { onPriority(TASK_PRIORITY.HIGH); setOpen(false); }}>
                High
              </button>
            </li>
            <li>
              <button type="button" className="dropdown-item small" onClick={() => { onPriority(TASK_PRIORITY.MEDIUM); setOpen(false); }}>
                Medium
              </button>
            </li>
            <li>
              <button type="button" className="dropdown-item small" onClick={() => { onPriority(TASK_PRIORITY.LOW); setOpen(false); }}>
                Low
              </button>
            </li>
            {onEdit ? (
              <>
                <li><hr className="dropdown-divider my-1" /></li>
                <li>
                  <button
                    type="button"
                    className="dropdown-item small"
                    onClick={() => {
                      onEdit();
                      setOpen(false);
                    }}
                  >
                    Edit task…
                  </button>
                </li>
              </>
            ) : null}
            <li><hr className="dropdown-divider my-1" /></li>
            <li>
              <button
                type="button"
                className="dropdown-item small text-danger"
                onClick={() => {
                  onDelete();
                  setOpen(false);
                }}
              >
                Delete task…
              </button>
            </li>
          </ul>
        </>
      ) : null}
    </div>
  );
}

function KanbanColumn({
  title,
  count,
  tintClass,
  tasks,
  projectId,
  onAdd,
  onStatusChange,
  onPriorityChange,
  onEditTask,
  onDeleteTask,
}) {
  return (
    <div className={`kanban-col ${tintClass} flex-grow-1`} style={{ minWidth: 260, maxWidth: 400 }}>
      <div className="d-flex align-items-center justify-content-between mb-2 px-1">
        <span className="fw-semibold small" style={{ color: '#334155' }}>
          {title}{' '}
          <span className="text-muted fw-normal">({count})</span>
        </span>
        <button type="button" className="btn btn-sm btn-light border-0 rounded-circle" aria-label={`Add task to ${title}`} onClick={onAdd}>
          +
        </button>
      </div>
      <div className="d-flex flex-column gap-2">
        {tasks.map((t) => {
          const sprint = sprintDisplayForTask(t);
          const pri = getTaskPriority(projectId, t.id);
          return (
            <article key={t.id} className="kanban-task-card">
              <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <span className="small text-muted fw-medium text-uppercase" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>
                    Task #{t.id}
                  </span>
                  <PriorityPill level={pri} />
                </div>
                <TaskCardMenu
                  task={t}
                  onStatus={(s) => onStatusChange(t.id, s)}
                  onPriority={(p) => onPriorityChange(t.id, p)}
                  onEdit={() => onEditTask(t)}
                  onDelete={() => onDeleteTask(t.id)}
                />
              </div>
              <h3 className="small fw-bold mb-2" style={{ color: '#0f172a' }}>
                {t.title}
              </h3>
              <div className="rounded-2 px-2 py-1 mb-2" style={{ background: '#f8fafc', fontSize: '0.7rem', lineHeight: 1.35 }}>
                <div className="fw-semibold text-secondary text-uppercase" style={{ fontSize: '0.6rem', letterSpacing: '0.06em' }}>
                  Sprint
                </div>
                <div className="text-dark">{sprint.badge}</div>
                <div className="text-muted mt-1">{sprint.line}</div>
              </div>
              <div className="d-flex align-items-center justify-content-between">
                <span
                  className="rounded-circle d-inline-flex align-items-center justify-content-center small fw-semibold text-white"
                  style={{ width: 28, height: 28, background: '#94a3b8', fontSize: '0.7rem' }}
                  title={t.assignedToId != null ? 'Assigned' : 'Unassigned'}
                >
                  {assigneeInitial(t)}
                </span>
                <span className="text-muted" style={{ fontSize: '0.7rem' }}>
                  {t.sprintId == null ? 'Backlog' : `Sprint #${t.sprintId}`}
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

export default function ProjectPage() {
  const { projectId } = useParams();
  const pid = Number(projectId);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get('view') === 'backlog' ? 'backlog' : 'board';

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [notFound, setNotFound] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [addTitle, setAddTitle] = useState('');
  const [addDescription, setAddDescription] = useState('');
  const [addStatus, setAddStatus] = useState(TASK_STATUS.TODO);
  const [addSprintId, setAddSprintId] = useState(null);
  const [addError, setAddError] = useState('');
  const [addSaving, setAddSaving] = useState(false);
  /** When set, the task modal is editing this task id instead of creating. */
  const [editTaskId, setEditTaskId] = useState(null);

  const [sprintModal, setSprintModal] = useState(false);
  const [sprintName, setSprintName] = useState('Sprint');
  const [sprintStart, setSprintStart] = useState('');
  const [sprintEnd, setSprintEnd] = useState('');
  const [sprintError, setSprintError] = useState('');
  const [sprintSaving, setSprintSaving] = useState(false);

  const [focusSprintId, setFocusSprintId] = useState(null);
  /** Bumps when local-only UI prefs (priority, sprint labels) change so board re-sorts / re-renders. */
  const [uiRefresh, setUiRefresh] = useState(0);
  const [addPriority, setAddPriority] = useState(TASK_PRIORITY.MEDIUM);

  const loadData = useCallback(async () => {
    if (!Number.isFinite(pid) || pid < 1) {
      setNotFound(true);
      return;
    }
    setLoadError('');
    setNotFound(false);
    const pr = await getMyProjectsRequest();
    if (pr.status === 401) {
      localStorage.removeItem('token');
      navigate('/login', { replace: true });
      return;
    }
    const plist = await pr.json().catch(() => []);
    if (!pr.ok) {
      setLoadError('Could not load project.');
      setProject(null);
      setTasks([]);
      return;
    }
    const list = Array.isArray(plist) ? plist : [];
    const p = list.find((x) => x.id === pid);
    if (!p) {
      setNotFound(true);
      setProject(null);
      setTasks([]);
      return;
    }
    setProject(p);

    const tr = await getProjectTasksRequest(pid);
    if (!tr.ok) {
      setLoadError('Could not load tasks.');
      setTasks([]);
      return;
    }
    const td = await tr.json().catch(() => []);
    setTasks(Array.isArray(td) ? td : []);
  }, [navigate, pid]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /** Server tasks minus locally hidden rows, merged with per-device title/description/sprint overrides. */
  const displayTasks = useMemo(
    () =>
      tasks
        .filter((t) => !isTaskRemovedLocally(pid, t.id))
        .map((t) => mergeTaskWithUi(pid, t)),
    [tasks, pid, uiRefresh]
  );

  const sprintIdsInTasks = useMemo(
    () => [...new Set(displayTasks.map((t) => t.sprintId).filter((x) => x != null))],
    [displayTasks]
  );

  const effectiveSprintId = useMemo(() => {
    if (focusSprintId != null && !isSprintRemovedLocally(pid, focusSprintId)) return focusSprintId;
    if (sprintIdsInTasks.length === 0) return null;
    return Math.max(...sprintIdsInTasks);
  }, [focusSprintId, sprintIdsInTasks, pid, uiRefresh]);

  const sprintOptions = useMemo(() => {
    const s = new Set(sprintIdsInTasks);
    if (focusSprintId != null && !isSprintRemovedLocally(pid, focusSprintId)) {
      s.add(focusSprintId);
    }
    return [...s]
      .filter((id) => !isSprintRemovedLocally(pid, id))
      .sort((a, b) => a - b);
  }, [sprintIdsInTasks, focusSprintId, pid, uiRefresh]);

  const assignableSprints = useMemo(
    () =>
      listSprintsForAssignment(
        pid,
        sprintIdsInTasks,
        focusSprintId != null ? [focusSprintId] : []
      ),
    [pid, sprintIdsInTasks, focusSprintId, uiRefresh]
  );

  /** Options in the new-task modal; includes pre-selected sprint id even if list was rebuilt. */
  const sprintChoicesForModal = useMemo(() => {
    const base = [...assignableSprints];
    const ids = new Set(base.map((s) => s.id));
    if (addSprintId != null && !ids.has(Number(addSprintId))) {
      const sid = Number(addSprintId);
      const meta = getSprintRecord(sid);
      base.push({ id: sid, name: meta?.name ?? null });
      base.sort((a, b) => a.id - b.id);
    }
    return base;
  }, [assignableSprints, addSprintId]);

  const sprintTasks = useMemo(
    () =>
      effectiveSprintId == null ? [] : displayTasks.filter((t) => t.sprintId === effectiveSprintId),
    [displayTasks, effectiveSprintId]
  );

  const backlogTasks = useMemo(() => displayTasks.filter((t) => t.sprintId == null), [displayTasks]);

  const boardByStatus = useMemo(() => {
    const todo = displayTasks.filter((t) => t.status === TASK_STATUS.TODO);
    const prog = displayTasks.filter((t) => t.status === TASK_STATUS.IN_PROGRESS);
    const done = displayTasks.filter((t) => t.status === TASK_STATUS.DONE);
    return { todo, prog, done };
  }, [displayTasks]);

  const boardSorted = useMemo(
    () => ({
      todo: sortBoardTasks(boardByStatus.todo, pid),
      prog: sortBoardTasks(boardByStatus.prog, pid),
      done: sortBoardTasks(boardByStatus.done, pid),
    }),
    [boardByStatus, pid, uiRefresh]
  );

  function handlePriorityChange(taskId, priority) {
    saveTaskPriority(pid, taskId, priority);
    setUiRefresh((x) => x + 1);
  }

  function handleDeleteTaskLocal(taskId) {
    if (
      !window.confirm(
        'Hide this task on this device only?\n\nIt will still exist for your team until permanently removed by an admin or future feature.'
      )
    ) {
      return;
    }
    removeTaskLocally(pid, taskId);
    setUiRefresh((x) => x + 1);
  }

  function handleDeleteSprintLocal() {
    if (effectiveSprintId == null) return;
    if (
      !window.confirm(
        `Hide sprint #${effectiveSprintId} and its tasks on this device only?\n\nYour team can still see them; this does not remove them from the project.`
      )
    ) {
      return;
    }
    const taskIds = tasks.filter((t) => t.sprintId === effectiveSprintId).map((t) => t.id);
    removeSprintLocally(pid, effectiveSprintId, taskIds);
    setFocusSprintId(null);
    setUiRefresh((x) => x + 1);
  }

  function setView(next) {
    const nextParams = new URLSearchParams(searchParams);
    if (next === 'backlog') nextParams.set('view', 'backlog');
    else nextParams.delete('view');
    setSearchParams(nextParams, { replace: true });
  }

  async function patchStatus(taskId, status) {
    try {
      const res = await updateTaskStatusRequest(taskId, status);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        alert(body.message || "Could not update this task's status.");
        return;
      }
      await loadData();
    } catch (e) {
      alert(e.message || 'Request failed');
    }
  }

  /** @param {{ status?: string; sprintId?: number | null }} opts */
  function openAddTask(opts = {}) {
    const { status, sprintId } = opts;
    setAddStatus(status ?? TASK_STATUS.TODO);
    if (sprintId === undefined) {
      setAddSprintId(null);
    } else if (sprintId == null) {
      setAddSprintId(null);
    } else {
      setAddSprintId(Number(sprintId));
    }
    setAddPriority(TASK_PRIORITY.MEDIUM);
    setAddTitle('');
    setAddDescription('');
    setAddError('');
    setAddOpen(true);
  }

  async function submitAddTask(e) {
    e.preventDefault();
    setAddError('');
    if (!addTitle.trim()) {
      setAddError('Title is required.');
      return;
    }
    if (addSprintId != null) {
      const allowed = new Set(sprintChoicesForModal.map((s) => s.id));
      if (!allowed.has(Number(addSprintId))) {
        setAddError('Choose Backlog or a sprint from the list.');
        return;
      }
    }
    setAddSaving(true);
    try {
      const sprintIdClean =
        addSprintId != null && Number.isFinite(Number(addSprintId)) ? Number(addSprintId) : null;
      const res = await createTaskRequest({
        title: addTitle.trim(),
        description: addDescription.trim() || null,
        projectId: pid,
        sprintId: sprintIdClean,
        assignedToId: null,
        dueDate: null,
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAddError(body.message || 'Could not create task.');
        return;
      }
      const newId = body.task?.id;
      if (newId != null && addStatus !== TASK_STATUS.TODO) {
        const r2 = await updateTaskStatusRequest(newId, addStatus);
        if (!r2.ok) {
          const b2 = await r2.json().catch(() => ({}));
          setAddError(b2.message || 'Task created but status update failed.');
          return;
        }
      }
      if (newId != null) {
        saveTaskPriority(pid, newId, addPriority);
        setUiRefresh((x) => x + 1);
      }
      setAddOpen(false);
      await loadData();
    } catch {
      setAddError('Network error.');
    } finally {
      setAddSaving(false);
    }
  }

  async function submitSprint(e) {
    e.preventDefault();
    setSprintError('');
    if (!sprintName.trim() || !sprintStart || !sprintEnd) {
      setSprintError('Name, start time, and end time are required.');
      return;
    }
    setSprintSaving(true);
    try {
      const res = await createSprintRequest({
        name: sprintName.trim(),
        startDate: sprintStart,
        endDate: sprintEnd,
        projectId: pid,
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSprintError(body.message || 'Could not create sprint.');
        return;
      }
      if (body.sprint?.id != null) {
        saveSprintRecord(body.sprint.id, {
          name: sprintName.trim(),
          startDate: sprintStart,
          endDate: sprintEnd,
          projectId: pid,
        });
        setFocusSprintId(body.sprint.id);
        setUiRefresh((x) => x + 1);
      }
      setSprintModal(false);
    } catch {
      setSprintError('Network error.');
    } finally {
      setSprintSaving(false);
    }
  }

  const sprintDone = sprintTasks.filter((t) => t.status === TASK_STATUS.DONE).length;
  const sprintTotal = sprintTasks.length;

  const focusedSprintMeta = effectiveSprintId != null ? getSprintRecord(effectiveSprintId) : null;

  if (notFound) {
    return (
      <div className="project-page">
        <DashboardNav />
        <main className="project-page__main container py-5">
          <p className="text-secondary">Project not found or you are not a member.</p>
          <Link to="/projects">Back to projects</Link>
        </main>
        <AppFooter />
      </div>
    );
  }

  return (
    <div className="project-page">
      <DashboardNav />

      <main className="project-page__main container-fluid px-3 px-lg-4 py-3">
        {loadError ? (
          <div className="alert alert-warning py-2 small mb-3" role="alert">
            {loadError}
          </div>
        ) : null}

        {project ? (
          <>
            <div className="alert alert-light border small py-2 mb-3" role="region" aria-label="How tasks, sprints, and priorities work">
              When you <strong>create a task</strong>, put it in the <strong>backlog</strong> or a specific <strong>sprint</strong>.
              Sprint names and dates you enter here are remembered on <strong>this device</strong> so labels stay readable.
              <strong> Priority</strong> is saved on this device only for now. <strong>Delete task</strong> and{' '}
              <strong>Delete sprint</strong> only hide items in <strong>this browser</strong> — they do not remove shared project
              data for everyone.
            </div>
            <nav className="mb-2 small">
              <Link to="/dashboard" className="text-decoration-none text-secondary">
                ← Dashboard
              </Link>
              <span className="text-muted mx-1">/</span>
              <span className="text-dark fw-medium">{project.name}</span>
            </nav>

            <div className="d-flex flex-column flex-lg-row align-items-start justify-content-between gap-3 mb-4">
              <div className="flex-grow-1 min-w-0">
                <h1 className="h3 fw-bold mb-2" style={{ color: '#0f172a' }}>
                  {project.name}
                </h1>
                <p className="text-secondary mb-0 small" style={{ maxWidth: 720 }}>
                  {project.description || 'No description yet.'}
                </p>
              </div>
              <div className="project-view-toggle btn-group" role="group" aria-label="View mode">
                <input
                  type="radio"
                  className="btn-check"
                  name="viewmode"
                  id="view-board"
                  checked={view === 'board'}
                  onChange={() => setView('board')}
                  autoComplete="off"
                />
                <label className="btn btn-outline-secondary" htmlFor="view-board">
                  Board
                </label>
                <input
                  type="radio"
                  className="btn-check"
                  name="viewmode"
                  id="view-backlog"
                  checked={view === 'backlog'}
                  onChange={() => setView('backlog')}
                  autoComplete="off"
                />
                <label className="btn btn-outline-secondary" htmlFor="view-backlog">
                  Backlog
                </label>
              </div>
            </div>

            {view === 'board' ? (
              <div className="d-flex flex-column flex-xl-row gap-3 pb-4 overflow-auto">
                <KanbanColumn
                  title="To Do"
                  count={boardSorted.todo.length}
                  tintClass="kanban-col--todo"
                  tasks={boardSorted.todo}
                  projectId={pid}
                  onAdd={() => openAddTask({ status: TASK_STATUS.TODO })}
                  onStatusChange={patchStatus}
                  onPriorityChange={handlePriorityChange}
                  onDeleteTask={handleDeleteTaskLocal}
                />
                <KanbanColumn
                  title="In Progress"
                  count={boardSorted.prog.length}
                  tintClass="kanban-col--progress"
                  tasks={boardSorted.prog}
                  projectId={pid}
                  onAdd={() => openAddTask({ status: TASK_STATUS.IN_PROGRESS })}
                  onStatusChange={patchStatus}
                  onPriorityChange={handlePriorityChange}
                  onDeleteTask={handleDeleteTaskLocal}
                />
                <KanbanColumn
                  title="Done"
                  count={boardSorted.done.length}
                  tintClass="kanban-col--done"
                  tasks={boardSorted.done}
                  projectId={pid}
                  onAdd={() => openAddTask({ status: TASK_STATUS.DONE })}
                  onStatusChange={patchStatus}
                  onPriorityChange={handlePriorityChange}
                  onDeleteTask={handleDeleteTaskLocal}
                />
              </div>
            ) : (
              <div className="pb-4">
                <section className="backlog-sprint-card mb-4">
                  <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 p-3 border-bottom">
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <span className="text-primary">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                          <circle cx="12" cy="12" r="9" />
                          <path d="M12 7v5l3 3" />
                        </svg>
                      </span>
                      {effectiveSprintId != null ? (
                        <>
                          <span className="fw-bold" style={{ color: '#0f172a' }}>
                            {focusedSprintMeta?.name ?? `Sprint #${effectiveSprintId}`}
                          </span>
                          <span className="badge bg-light text-secondary border">Sprint #{effectiveSprintId}</span>
                          {focusedSprintMeta ? (
                            <span className="small text-secondary">
                              {formatSprintDateRange(focusedSprintMeta.startDate, focusedSprintMeta.endDate)}
                            </span>
                          ) : null}
                          <span className="badge bg-light text-secondary border">Current</span>
                        </>
                      ) : (
                        <span className="fw-bold text-secondary">No sprint on tasks yet</span>
                      )}
                    </div>
                    <div className="d-flex flex-wrap align-items-center gap-2">
                      {effectiveSprintId != null ? (
                        <span className="small text-secondary">
                          {sprintDone} of {sprintTotal} tasks done
                        </span>
                      ) : null}
                      <button type="button" className="btn btn-link btn-sm text-decoration-none" style={{ color: '#5d45fd' }} onClick={() => setSprintModal(true)}>
                        + New sprint
                      </button>
                      {effectiveSprintId != null ? (
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={handleDeleteSprintLocal}
                          title="Hides sprint and its tasks in this browser only"
                        >
                          Delete sprint
                        </button>
                      ) : null}
                      <button type="button" className="btn btn-project-primary btn-sm" disabled title="Coming soon">
                        Complete Sprint
                      </button>
                    </div>
                  </div>

                  {!effectiveSprintId ? (
                    <div className="p-4 text-center text-secondary small">
                      <p className="mb-2">Create a sprint, then add tasks and assign them to that sprint when you create them.</p>
                      <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => setSprintModal(true)}>
                        + New sprint
                      </button>
                    </div>
                  ) : (
                    <>
                      {sprintOptions.length > 1 ? (
                        <div className="px-3 pt-2 pb-0">
                          <label className="small text-secondary me-2">Switch sprint</label>
                          <select
                            className="form-select form-select-sm d-inline-block w-auto"
                            value={effectiveSprintId ?? ''}
                            onChange={(e) => setFocusSprintId(Number(e.target.value))}
                          >
                            {sprintOptions.map((sid) => {
                              const m = getSprintRecord(sid);
                              return (
                                <option key={sid} value={sid}>
                                  {m?.name ? `${m.name} (#${sid})` : `Sprint #${sid}`}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      ) : null}
                      <div>
                        {sprintTasks.length === 0 ? (
                          <p className="p-4 mb-0 small text-secondary">No tasks in this sprint yet.</p>
                        ) : (
                          sprintTasks.map((t) => (
                            <div
                              key={t.id}
                              className={`backlog-row d-flex align-items-center gap-3 ${t.status === TASK_STATUS.DONE ? 'backlog-row--done' : ''}`}
                            >
                              <button
                                type="button"
                                className={`btn btn-sm border-0 p-0 rounded-circle d-inline-flex align-items-center justify-content-center flex-shrink-0 ${t.status === TASK_STATUS.DONE ? 'text-success' : 'text-muted'}`}
                                style={{ width: 28, height: 28 }}
                                aria-label={t.status === TASK_STATUS.DONE ? 'Mark not done' : 'Mark done'}
                                onClick={() =>
                                  patchStatus(t.id, t.status === TASK_STATUS.DONE ? TASK_STATUS.TODO : TASK_STATUS.DONE)
                                }
                              >
                                {t.status === TASK_STATUS.DONE ? '✓' : '○'}
                              </button>
                              <div className="flex-grow-1 min-w-0">
                                <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                                  <PriorityPill level={getTaskPriority(pid, t.id)} />
                                  <span className="badge rounded-pill bg-light text-secondary border small">
                                    {t.sprintId == null ? 'Backlog' : `Sprint #${t.sprintId}`}
                                  </span>
                                </div>
                                <div className="backlog-row__title fw-semibold small">{t.title}</div>
                                <div className="small text-muted">
                                  {t.assignedToId != null ? 'Assigned' : 'Unassigned'} · {statusLabel(t.status)}
                                </div>
                              </div>
                              <TaskCardMenu
                                task={t}
                                onStatus={(s) => patchStatus(t.id, s)}
                                onPriority={(p) => handlePriorityChange(t.id, p)}
                                onDelete={() => handleDeleteTaskLocal(t.id)}
                              />
                            </div>
                          ))
                        )}
                      </div>
                      <div className="p-3 border-top text-center">
                        <button
                          type="button"
                          className="btn btn-link text-decoration-none fw-semibold"
                          style={{ color: '#5d45fd' }}
                          onClick={() => openAddTask({ sprintId: effectiveSprintId, status: TASK_STATUS.TODO })}
                        >
                          + Add New Task
                        </button>
                      </div>
                    </>
                  )}
                </section>

                {effectiveSprintId != null ? (
                  <div className="text-center mb-3">
                    <a href="#backlog-pile" className="btn btn-sm btn-outline-secondary rounded-pill px-4">
                      View full backlog
                    </a>
                  </div>
                ) : null}

                <section id="backlog-pile" className="backlog-sprint-card p-4 scroll-margin-top">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h2 className="h6 fw-bold mb-0" style={{ color: '#0f172a' }}>
                      Backlog (ready for next sprint)
                    </h2>
                    <span className="small text-secondary">{backlogTasks.length} items not in a sprint</span>
                  </div>
                  {backlogTasks.length === 0 ? (
                    <div className="border border-2 border-dashed rounded-3 p-4 text-center text-secondary small">
                      <p className="mb-2">Tasks that are not assigned to a sprint yet appear here.</p>
                      <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => openAddTask({ sprintId: null })}>
                        Add backlog task
                      </button>
                    </div>
                  ) : (
                    <ul className="list-unstyled mb-0">
                      {backlogTasks.map((t) => (
                        <li key={t.id} className="backlog-row d-flex align-items-center gap-3">
                          <PriorityPill level={getTaskPriority(pid, t.id)} />
                          <span className="small fw-semibold flex-grow-1 min-w-0">{t.title}</span>
                          <span className="small text-muted text-nowrap">Backlog · {statusLabel(t.status)}</span>
                          <TaskCardMenu
                            task={t}
                            onStatus={(s) => patchStatus(t.id, s)}
                            onPriority={(p) => handlePriorityChange(t.id, p)}
                            onDelete={() => handleDeleteTaskLocal(t.id)}
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>
            )}
          </>
        ) : (
          <p className="text-secondary">Loading…</p>
        )}
      </main>

      <AppFooter />

      {addOpen ? (
        <div className="modal d-block" style={{ background: 'rgb(15 23 42 / 0.45)' }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-3">
              <div className="modal-header border-0">
                <h2 className="modal-title h5 fw-bold">New task</h2>
                <button type="button" className="btn-close" aria-label="Close" onClick={() => setAddOpen(false)} />
              </div>
              <form onSubmit={submitAddTask}>
                <div className="modal-body pt-0">
                  {addError ? (
                    <div className="alert alert-danger py-2 small" role="alert">
                      {addError}
                    </div>
                  ) : null}
                  <p className="small text-muted mb-3">
                    Choose whether this task lives in the <strong>backlog</strong> or a <strong>sprint</strong>. The board column
                    you used only sets the starting column; you can change it anytime. Priority is saved on this device only.
                  </p>
                  <div className="mb-3">
                    <label className="form-label small fw-medium">
                      Sprint assignment <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      value={addSprintId == null ? 'backlog' : String(addSprintId)}
                      onChange={(e) => {
                        const v = e.target.value;
                        setAddSprintId(v === 'backlog' ? null : Number(v));
                      }}
                      required
                    >
                      <option value="backlog">Backlog — not in a sprint yet</option>
                      {sprintChoicesForModal.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name ? `${s.name} (#${s.id})` : `Sprint #${s.id}`}
                        </option>
                      ))}
                    </select>
                    {sprintChoicesForModal.length === 0 ? (
                      <div className="form-text">Create a sprint under the Backlog tab to assign work to it.</div>
                    ) : null}
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-medium">Title</label>
                    <input className="form-control" value={addTitle} onChange={(e) => setAddTitle(e.target.value)} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-medium">Description</label>
                    <textarea className="form-control" rows={2} value={addDescription} onChange={(e) => setAddDescription(e.target.value)} />
                  </div>
                  <div className="row g-2">
                    <div className="col-md-6">
                      <label className="form-label small fw-medium">Priority (this device)</label>
                      <select className="form-select" value={addPriority} onChange={(e) => setAddPriority(e.target.value)}>
                        <option value={TASK_PRIORITY.HIGH}>High</option>
                        <option value={TASK_PRIORITY.MEDIUM}>Medium</option>
                        <option value={TASK_PRIORITY.LOW}>Low</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-medium">Initial status</label>
                      <select className="form-select" value={addStatus} onChange={(e) => setAddStatus(e.target.value)}>
                        <option value={TASK_STATUS.TODO}>To do</option>
                        <option value={TASK_STATUS.IN_PROGRESS}>In progress</option>
                        <option value={TASK_STATUS.DONE}>Done</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0">
                  <button type="button" className="btn btn-light" onClick={() => setAddOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-project-primary" disabled={addSaving}>
                    {addSaving ? 'Saving…' : 'Create task'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}

      {sprintModal ? (
        <div className="modal d-block" style={{ background: 'rgb(15 23 42 / 0.45)' }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-3">
              <div className="modal-header border-0">
                <h2 className="modal-title h5 fw-bold">New sprint</h2>
                <button type="button" className="btn-close" aria-label="Close" onClick={() => setSprintModal(false)} />
              </div>
              <form onSubmit={submitSprint}>
                <div className="modal-body pt-0">
                  {sprintError ? (
                    <div className="alert alert-danger py-2 small" role="alert">
                      {sprintError}
                    </div>
                  ) : null}
                  <div className="mb-3">
                    <label className="form-label small">Name</label>
                    <input className="form-control" value={sprintName} onChange={(e) => setSprintName(e.target.value)} required />
                  </div>
                  <div className="row g-2">
                    <div className="col-6">
                      <label className="form-label small">Start</label>
                      <input className="form-control" type="datetime-local" value={sprintStart} onChange={(e) => setSprintStart(e.target.value)} required />
                    </div>
                    <div className="col-6">
                      <label className="form-label small">End</label>
                      <input className="form-control" type="datetime-local" value={sprintEnd} onChange={(e) => setSprintEnd(e.target.value)} required />
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0">
                  <button type="button" className="btn btn-light" onClick={() => setSprintModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-project-primary" disabled={sprintSaving}>
                    {sprintSaving ? 'Creating…' : 'Create sprint'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
