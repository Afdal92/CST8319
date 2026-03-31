import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardNav from '../components/dashboard/DashboardNav.jsx';
import DonutProgress from '../components/dashboard/DonutProgress.jsx';
import WeekActivityChart from '../components/dashboard/WeekActivityChart.jsx';
import {
  TASK_STATUS,
  getMyProjectsRequest,
  getProjectTasksRequest,
  createProjectRequest,
} from '../api/index.js';
import './DashboardPage.css';

// helpers for dates and task lists (used only on this page)

function startOfWeekMonday(dateInput) {
  const date = new Date(dateInput);
  const dayOfWeek = date.getDay();
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  date.setDate(date.getDate() + daysToMonday);
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfWeekFriday(dateInput) {
  const weekStart = startOfWeekMonday(dateInput);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 4);
  weekEnd.setHours(23, 59, 59, 999);
  return weekEnd;
}

function weekdayDoneCounts(tasks) {
  const counts = [0, 0, 0, 0, 0];
  const now = new Date();
  const weekStart = startOfWeekMonday(now);
  const weekEnd = endOfWeekFriday(now);

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    if (task.status !== TASK_STATUS.DONE) {
      continue;
    }
    const updated = new Date(task.updatedAt);
    if (updated < weekStart || updated > weekEnd) {
      continue;
    }
    const weekday = updated.getDay();
    if (weekday < 1 || weekday > 5) {
      continue;
    }
    counts[weekday - 1] = counts[weekday - 1] + 1;
  }
  return counts;
}

function uniqueSprintCount(tasks) {
  const seen = new Set();
  for (let i = 0; i < tasks.length; i++) {
    const sprintId = tasks[i].sprintId;
    if (sprintId != null) {
      seen.add(sprintId);
    }
  }
  return seen.size;
}

function nearestOpenDueDays(tasks) {
  const open = tasks.filter((t) => t.status !== TASK_STATUS.DONE && t.dueDate);
  if (open.length === 0) {
    return null;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let smallestDiffDays = null;

  for (let i = 0; i < open.length; i++) {
    const due = new Date(open[i].dueDate);
    due.setHours(0, 0, 0, 0);
    const diffMs = due - today;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (smallestDiffDays === null || diffDays < smallestDiffDays) {
      smallestDiffDays = diffDays;
    }
  }
  return smallestDiffDays;
}

function nearestDueDateForProject(tasks) {
  const open = tasks.filter((t) => t.status !== TASK_STATUS.DONE && t.dueDate);
  if (open.length === 0) {
    return null;
  }
  let earliestDue = null;
  let earliestTimeMs = null;
  for (let i = 0; i < open.length; i++) {
    const dueString = open[i].dueDate;
    const timeMs = new Date(dueString).getTime();
    if (earliestTimeMs === null || timeMs < earliestTimeMs) {
      earliestTimeMs = timeMs;
      earliestDue = dueString;
    }
  }
  return earliestDue;
}

function StatCard({ icon, badge, value, label, iconBg }) {
  return (
    <div className="dashboard-stat-card">
      <div className="d-flex justify-content-between align-items-start mb-2">
        <span
          className="d-inline-flex align-items-center justify-content-center rounded-2"
          style={{ width: 40, height: 40, background: iconBg }}
        >
          {icon}
        </span>
        <span className="dashboard-stat-card__label">{badge}</span>
      </div>
      <div className="dashboard-stat-card__value">{value}</div>
      <div className="dashboard-stat-card__sub">{label}</div>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState(null);
  const [tasksByProject, setTasksByProject] = useState({});
  const [loadError, setLoadError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);

  const loadData = useCallback(async () => {
    setLoadError('');
    const res = await getMyProjectsRequest();
    if (res.status === 401) {
      localStorage.removeItem('token');
      navigate('/login', { replace: true });
      return;
    }
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      let message = 'Could not load dashboard.';
      if (data && typeof data.message === 'string') {
        message = data.message;
      }
      setLoadError(message);
      setProjects([]);
      setTasksByProject({});
      return;
    }
    const list = Array.isArray(data) ? data : [];
    const active = list.filter((p) => !p.archived);
    setProjects(active);

    const entries = await Promise.all(
      active.map(async (p) => {
        const tr = await getProjectTasksRequest(p.id);
        if (!tr.ok) return [p.id, []];
        const td = await tr.json().catch(() => []);
        return [p.id, Array.isArray(td) ? td : []];
      })
    );
    const map = {};
    for (const [id, tasks] of entries) {
      map[id] = tasks;
    }
    setTasksByProject(map);
  }, [navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const allTasks = useMemo(() => Object.values(tasksByProject).flat(), [tasksByProject]);

  const stats = useMemo(() => {
    const total = allTasks.length;
    const done = allTasks.filter((t) => t.status === TASK_STATUS.DONE).length;
    const remaining = total - done;
    const pct = total === 0 ? 0 : (done / total) * 100;
    const sprints = uniqueSprintCount(allTasks);
    const daysLeft = nearestOpenDueDays(allTasks);
    return { total, done, remaining, pct, sprints, daysLeft };
  }, [allTasks]);

  const weekCounts = useMemo(() => weekdayDoneCounts(allTasks), [allTasks]);

  async function handleCreateProject(e) {
    e.preventDefault();
    setCreateError('');
    if (!newName.trim()) {
      setCreateError('Project name is required.');
      return;
    }
    setCreating(true);
    try {
      const res = await createProjectRequest({
        name: newName.trim(),
        description: newDescription.trim() || null,
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCreateError(body.message || 'Could not create project.');
        return;
      }
      setShowModal(false);
      setNewName('');
      setNewDescription('');
      await loadData();
      if (body.project && body.project.id != null) {
        navigate('/projects/' + body.project.id, { replace: true });
      }
    } catch {
      setCreateError('Network error.');
    } finally {
      setCreating(false);
    }
  }

  const sortedProjects = useMemo(() => {
    if (!projects) return [];
    return [...projects].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [projects]);

  return (
    <div className="dashboard-page">
      <DashboardNav />

      <main className="container-fluid px-3 px-lg-4 py-4">
        <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 mb-4">
          <div>
            <h1 className="h3 fw-bold mb-1" style={{ color: '#0f172a' }}>
              Project Dashboard
            </h1>
            <p className="text-secondary mb-0 small">
              Welcome back! Here&apos;s what&apos;s happening across your projects.
            </p>
          </div>
          <button type="button" className="btn btn-dashboard-primary" onClick={() => setShowModal(true)}>
            + New Project
          </button>
        </div>

        {loadError ? (
          <div className="alert alert-warning py-2 small mb-4" role="alert">
            {loadError}
          </div>
        ) : null}

        {projects === null ? (
          <p className="text-secondary">Loading…</p>
        ) : (
          <>
            <div className="row g-3 mb-4">
              <div className="col-6 col-lg-3">
                <StatCard
                  badge="Current"
                  value={stats.total}
                  label="Total Tasks"
                  iconBg="#dbeafe"
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 7v5l3 3" />
                    </svg>
                  }
                />
              </div>
              <div className="col-6 col-lg-3">
                <StatCard
                  badge="Current"
                  value={stats.done}
                  label="Completed"
                  iconBg="#dcfce7"
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                      <path d="M12 19V5M5 12l7-7 7 7" />
                    </svg>
                  }
                />
              </div>
              <div className="col-6 col-lg-3">
                <StatCard
                  badge="Current"
                  value={stats.sprints > 0 ? String(stats.sprints) : '—'}
                  label="Active sprints"
                  iconBg="#ede9fe"
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5d45fd" strokeWidth="2">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 7v5l3 3" />
                    </svg>
                  }
                />
              </div>
              <div className="col-6 col-lg-3">
                <StatCard
                  badge="Current"
                  value={stats.daysLeft !== null ? stats.daysLeft : '—'}
                  label="Days to nearest due"
                  iconBg="#ffedd5"
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2">
                      <rect x="4" y="5" width="16" height="16" rx="2" />
                      <path d="M8 3v4M16 3v4M4 11h16" />
                    </svg>
                  }
                />
              </div>
            </div>

            <div className="row g-4">
              <div className="col-lg-8">
                <section id="active-projects" className="dashboard-card p-4 mb-4 scroll-margin-top">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h2 className="h6 fw-bold mb-0" style={{ color: '#0f172a' }}>
                      Active Projects
                    </h2>
                    <Link to="/projects" className="small text-decoration-none fw-medium" style={{ color: '#5d45fd' }}>
                      View All
                    </Link>
                  </div>
                  {sortedProjects.length === 0 ? (
                    <p className="text-secondary small mb-0">
                      No active projects yet. Use <strong>New Project</strong> above to get started.
                    </p>
                  ) : (
                    <ul className="list-unstyled mb-0 d-flex flex-column gap-4">
                      {sortedProjects.map((p) => {
                        const tasks = tasksByProject[p.id] ?? [];
                        const done = tasks.filter((t) => t.status === TASK_STATUS.DONE).length;
                        const total = tasks.length;
                        const pct = total === 0 ? 0 : Math.round((done / total) * 100);
                        const nextDue = nearestDueDateForProject(tasks);
                        const letter = p.name.charAt(0).toUpperCase();
                        return (
                          <li key={p.id}>
                            <Link to={`/projects/${p.id}`} className="text-decoration-none text-reset d-block">
                            <div className="d-flex gap-3">
                              <span
                                className="rounded-2 flex-shrink-0 d-inline-flex align-items-center justify-content-center fw-bold text-white"
                                style={{
                                  width: 44,
                                  height: 44,
                                  background: '#5d45fd',
                                  fontSize: '1.1rem',
                                }}
                              >
                                {letter}
                              </span>
                              <div className="flex-grow-1 min-w-0">
                                <div className="fw-semibold" style={{ color: '#0f172a' }}>
                                  {p.name}
                                </div>
                                <div className="small text-secondary">
                                  {total} tasks
                                  {nextDue ? (
                                    <>
                                      {' '}
                                      · Next deadline: {new Date(nextDue).toLocaleDateString()}
                                    </>
                                  ) : null}
                                  <span className="d-none d-md-inline text-muted">
                                    {' '}
                                    · Invite code {p.joinCode}
                                  </span>
                                </div>
                                <div className="dashboard-project-row__progress mt-2">
                                  <div className="dashboard-project-row__progress-fill" style={{ width: `${pct}%` }} />
                                </div>
                                <div className="d-flex justify-content-between small mt-1">
                                  <span className="text-secondary">
                                    {done} / {total} tasks completed
                                  </span>
                                  <span className="fw-semibold" style={{ color: '#5d45fd' }}>
                                    {pct}%
                                  </span>
                                </div>
                              </div>
                            </div>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>

                <section className="dashboard-card p-4">
                  <h2 className="h6 fw-bold mb-3" style={{ color: '#0f172a' }}>
                    Recent Task Activity
                  </h2>
                  <p className="text-muted small mb-3">
                    Tasks marked <strong>Done</strong> this week (Monday–Friday), based on when they were last updated.
                  </p>
                  <WeekActivityChart counts={weekCounts} />
                </section>
              </div>

              <div className="col-lg-4">
                <section className="dashboard-card p-4 mb-4">
                  <h2 className="h6 fw-bold mb-3" style={{ color: '#0f172a' }}>
                    Total Progress
                  </h2>
                  <DonutProgress
                    percent={stats.pct}
                    completed={stats.done}
                    remaining={stats.remaining}
                  />
                </section>

                <div className="dashboard-pro-tip">
                  <div className="d-flex align-items-start gap-2">
                    <span className="opacity-90" aria-hidden="true">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                        <path d="M3 3v18h18M7 16l4-8 4 5 4-9" />
                      </svg>
                    </span>
                    <div>
                      <div className="fw-bold mb-2">Pro Tip</div>
                      <p className="small mb-0 opacity-95 lh-base">
                        Groups that review their board every day finish faster. Move cards across <strong>To do</strong>,{' '}
                        <strong>In progress</strong>, and <strong>Done</strong> as work moves forward.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {showModal ? (
        <div className="modal d-block" style={{ background: 'rgb(15 23 42 / 0.45)' }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-3 shadow">
              <div className="modal-header border-0 pb-0">
                <h2 className="modal-title h5 fw-bold">New Project</h2>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={() => {
                    setShowModal(false);
                    setCreateError('');
                  }}
                />
              </div>
              <form onSubmit={handleCreateProject}>
                <div className="modal-body pt-2">
                  {createError ? (
                    <div className="alert alert-danger py-2 small" role="alert">
                      {createError}
                    </div>
                  ) : null}
                  <div className="mb-3">
                    <label htmlFor="proj-name" className="form-label small fw-medium text-secondary">
                      Name <span className="text-danger">*</span>
                    </label>
                    <input
                      id="proj-name"
                      className="form-control"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="CS301 Final Project"
                      required
                    />
                  </div>
                  <div className="mb-0">
                    <label htmlFor="proj-desc" className="form-label small fw-medium text-secondary">
                      Description
                    </label>
                    <textarea
                      id="proj-desc"
                      className="form-control"
                      rows={3}
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder="Optional short summary for your team"
                    />
                  </div>
                </div>
                <div className="modal-footer border-0 pt-0">
                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={() => {
                      setShowModal(false);
                      setCreateError('');
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-dashboard-primary" disabled={creating}>
                    {creating ? 'Creating…' : 'Create project'}
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
