import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardNav from '../components/dashboard/DashboardNav.jsx';
import AppFooter from '../components/layout/AppFooter.jsx';
import { createProjectRequest, getAllProjectsRequest, joinProjectRequest } from '../api/index.js';
import { decodeJwtPayload } from '../utils/jwtDecode.js';
import './DashboardPage.css';

export default function ProjectsListPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState(null);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joining, setJoining] = useState(false);
  const token = localStorage.getItem('token');
  const payload = decodeJwtPayload(token);
  const currentUserId = payload && payload.id != null ? Number(payload.id) : null;

  async function loadProjects() {
    setError('');
    const response = await getAllProjectsRequest();

    if (response.status === 401) {
      localStorage.removeItem('token');
      navigate('/login', { replace: true });
      return;
    }

    const data = await response.json().catch(function () {
      return null;
    });

    if (!response.ok) {
      let message = 'Could not load projects.';
      if (data && typeof data.message === 'string') {
        message = data.message;
      }
      setError(message);
      setProjects([]);
      return;
    }

    if (!Array.isArray(data)) {
      setProjects([]);
      return;
    }

    setProjects(data);
  }

  useEffect(
    function () {
      loadProjects();
    },
    [navigate]
  );

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
      setShowCreateModal(false);
      setNewName('');
      setNewDescription('');
      await loadProjects();
      if (body.project && body.project.id != null) {
        navigate('/projects/' + body.project.id, { replace: true });
      }
    } catch {
      setCreateError('Network error.');
    } finally {
      setCreating(false);
    }
  }

  async function handleJoinProject(e) {
    e.preventDefault();
    setJoinError('');
    const code = joinCode.trim().toUpperCase();
    if (!code) {
      setJoinError('Join code is required.');
      return;
    }
    setJoining(true);
    try {
      const res = await joinProjectRequest({ joinCode: code });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setJoinError(body.message || 'Could not join project.');
        return;
      }
      setShowJoinModal(false);
      setJoinCode('');
      await loadProjects();
    } catch {
      setJoinError('Network error.');
    } finally {
      setJoining(false);
    }
  }

  return (
    <div className="dashboard-page d-flex flex-column min-vh-100">
      <DashboardNav />
      <main className="container-fluid px-3 px-lg-4 py-4 flex-grow-1">
        <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 mb-2">
          <h1 className="h3 fw-bold mb-0" style={{ color: '#0f172a' }}>
            Projects
          </h1>
          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setShowJoinModal(true)}
            >
              Join project
            </button>
            <button
              type="button"
              className="btn btn-dashboard-primary"
              onClick={() => setShowCreateModal(true)}
            >
              + New project
            </button>
          </div>
        </div>
        <p className="text-secondary small mb-4">
          Open a project to work on the board, plan sprints, and manage your backlog.
        </p>

        {error ? (
          <div className="alert alert-warning py-2 small mb-3" role="alert">
            {error}
          </div>
        ) : null}

        {projects === null ? (
          <p className="text-secondary">Loading…</p>
        ) : projects.length === 0 ? (
          <p className="text-secondary small">
            No projects yet. Use <strong>+ New project</strong> above, or join an existing one with a code.
          </p>
        ) : (
          <div className="row g-3">
            {projects.map(function (project) {
              const joined = Array.isArray(project.members) && project.members.length > 0;
              const myRole = joined ? project.members[0].role : null;
              return (
                <div key={project.id} className="col-md-6 col-xl-4">
                  <div className="text-decoration-none text-reset d-block dashboard-card p-4 h-100">
                    <div className="d-flex align-items-start gap-3">
                      <span
                        className="rounded-2 flex-shrink-0 d-inline-flex align-items-center justify-content-center fw-bold text-white"
                        style={{ width: 48, height: 48, background: '#5d45fd', fontSize: '1.15rem' }}
                      >
                        {project.name.charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                          <h2 className="h6 fw-bold mb-0" style={{ color: '#0f172a' }}>
                            {project.name}
                          </h2>
                          {joined ? (
                            <span className="badge bg-success-subtle text-success-emphasis border border-success-subtle small">
                              Joined
                            </span>
                          ) : (
                            <span className="badge bg-light text-secondary border small">Not joined</span>
                          )}
                          {joined && myRole ? (
                            <span className="badge bg-light text-secondary border small">{myRole}</span>
                          ) : null}
                        </div>
                        {project.description ? (
                          <p
                            className="small text-secondary mb-2 text-truncate-3"
                            style={{
                              WebkitLineClamp: 2,
                              display: '-webkit-box',
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {project.description}
                          </p>
                        ) : null}
                        {joined ? (
                          <div className="small text-muted mb-2">
                            Join code: <span className="fw-semibold text-dark">{project.joinCode}</span>
                          </div>
                        ) : null}
                        <div className="d-flex gap-2 mt-2">
                          {joined ? (
                            <Link to={'/projects/' + project.id} className="btn btn-sm btn-outline-secondary">
                              Open
                            </Link>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-sm btn-dashboard-primary"
                              onClick={() => {
                                setShowJoinModal(true);
                              }}
                            >
                              Join with code
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <AppFooter />

      {showCreateModal ? (
        <div className="modal d-block" style={{ background: 'rgb(15 23 42 / 0.45)' }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-3 shadow">
              <div className="modal-header border-0 pb-0">
                <h2 className="modal-title h5 fw-bold">New project</h2>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={() => {
                    setShowCreateModal(false);
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
                      setShowCreateModal(false);
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

      {showJoinModal ? (
        <div className="modal d-block" style={{ background: 'rgb(15 23 42 / 0.45)' }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-3 shadow">
              <div className="modal-header border-0 pb-0">
                <h2 className="modal-title h5 fw-bold">Join project</h2>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={() => {
                    setShowJoinModal(false);
                    setJoinError('');
                  }}
                />
              </div>
              <form onSubmit={handleJoinProject}>
                <div className="modal-body pt-2">
                  {joinError ? (
                    <div className="alert alert-danger py-2 small" role="alert">
                      {joinError}
                    </div>
                  ) : null}
                  <div className="mb-0">
                    <label htmlFor="proj-join-code" className="form-label small fw-medium text-secondary">
                      Join code
                    </label>
                    <input
                      id="proj-join-code"
                      className="form-control text-uppercase"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value)}
                      placeholder="ABC123"
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer border-0 pt-0">
                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={() => {
                      setShowJoinModal(false);
                      setJoinError('');
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-dashboard-primary" disabled={joining}>
                    {joining ? 'Joining…' : 'Join project'}
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
