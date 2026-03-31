import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardNav from '../components/dashboard/DashboardNav.jsx';
import AppFooter from '../components/layout/AppFooter.jsx';
import { getMyProjectsRequest } from '../api/index.js';
import './DashboardPage.css';

export default function ProjectsListPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState(null);
  const [error, setError] = useState('');

  useEffect(
    function () {
      async function loadProjects() {
        setError('');
        const response = await getMyProjectsRequest();

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

        const notArchived = data.filter(function (project) {
          return !project.archived;
        });
        setProjects(notArchived);
      }

      loadProjects();
    },
    [navigate]
  );

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
            {projects.map(function (project) {
              return (
                <div key={project.id} className="col-md-6 col-xl-4">
                  <Link
                    to={'/projects/' + project.id}
                    className="text-decoration-none text-reset d-block dashboard-card p-4 h-100"
                  >
                    <div className="d-flex align-items-start gap-3">
                      <span
                        className="rounded-2 flex-shrink-0 d-inline-flex align-items-center justify-content-center fw-bold text-white"
                        style={{ width: 48, height: 48, background: '#5d45fd', fontSize: '1.15rem' }}
                      >
                        {project.name.charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <h2 className="h6 fw-bold mb-1" style={{ color: '#0f172a' }}>
                          {project.name}
                        </h2>
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
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <AppFooter />
    </div>
  );
}
