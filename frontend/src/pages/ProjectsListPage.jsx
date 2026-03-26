import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardNav from '../components/dashboard/DashboardNav.jsx';
import AppFooter from '../components/layout/AppFooter.jsx';
import { getMyProjectsRequest } from '../api/index.js';
import './DashboardPage.css';

export default function ProjectsListPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    const res = await getMyProjectsRequest();
    if (res.status === 401) {
      localStorage.removeItem('token');
      navigate('/login', { replace: true });
      return;
    }
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(typeof data?.message === 'string' ? data.message : 'Could not load projects.');
      setProjects([]);
      return;
    }
    setProjects(Array.isArray(data) ? data.filter((p) => !p.archived) : []);
  }, [navigate]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="dashboard-page d-flex flex-column min-vh-100">
      <DashboardNav />
      <main className="container-fluid px-3 px-lg-4 py-4 flex-grow-1">
        <h1 className="h3 fw-bold mb-1" style={{ color: '#0f172a' }}>
          Projects
        </h1>
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
            No projects yet.{' '}
            <Link to="/dashboard" className="fw-semibold" style={{ color: '#5d45fd' }}>
              Create one on the dashboard
            </Link>
            .
          </p>
        ) : (
          <div className="row g-3">
            {projects.map((p) => (
              <div key={p.id} className="col-md-6 col-xl-4">
                <Link
                  to={`/projects/${p.id}`}
                  className="text-decoration-none text-reset d-block dashboard-card p-4 h-100"
                >
                  <div className="d-flex align-items-start gap-3">
                    <span
                      className="rounded-2 flex-shrink-0 d-inline-flex align-items-center justify-content-center fw-bold text-white"
                      style={{ width: 48, height: 48, background: '#5d45fd', fontSize: '1.15rem' }}
                    >
                      {p.name.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <h2 className="h6 fw-bold mb-1" style={{ color: '#0f172a' }}>
                        {p.name}
                      </h2>
                      {p.description ? (
                        <p className="small text-secondary mb-2 text-truncate-3" style={{ WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {p.description}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
      <AppFooter />
    </div>
  );
}
