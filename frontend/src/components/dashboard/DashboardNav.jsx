import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { decodeJwtPayload, displayNameFromEmail, initialsFromName } from '../../utils/jwtDecode.js';

const brand = '#5d45fd';

function navLinkBaseClass() {
  return 'text-decoration-none px-2 py-1 small fw-medium';
}

export default function DashboardNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const token = localStorage.getItem('token');
  const payload = decodeJwtPayload(token);

  let email = '';
  if (payload && typeof payload.email === 'string') {
    email = payload.email;
  }

  const displayName = displayNameFromEmail(email);
  const initials = initialsFromName(displayName);

  function logout() {
    localStorage.removeItem('token');
    navigate('/login', { replace: true });
  }

  function dashboardLinkClass(isActive) {
    return `${navLinkBaseClass()} ${isActive ? 'dashboard-nav__link--active' : 'text-secondary'}`;
  }

  function projectsLinkClass(isActive) {
    const isProjectsRoute = isActive || location.pathname.startsWith('/projects/');
    return `${navLinkBaseClass()} ${isProjectsRoute ? 'dashboard-nav__link--active' : 'text-secondary'}`;
  }

  return (
    <header className="dashboard-nav border-bottom bg-white sticky-top">
      <div className="container-fluid px-3 px-lg-4">
        <div className="d-flex align-items-center justify-content-between py-3 gap-3">
          <div className="d-flex align-items-center gap-4 min-w-0">
            <Link to="/dashboard" className="d-flex align-items-center gap-2 text-decoration-none text-nowrap">
              <span
                className="d-inline-flex align-items-center justify-content-center rounded-2 text-white fw-bold flex-shrink-0"
                style={{ width: 36, height: 36, background: brand, fontSize: '0.85rem' }}
              >
                C
              </span>
              <span className="fw-semibold d-none d-sm-inline" style={{ color: brand, fontSize: '1.05rem' }}>
                Campus Sprint Hub
              </span>
            </Link>
            <nav className="d-flex align-items-center gap-1 min-w-0">
              <NavLink to="/dashboard" end className={({ isActive }) => dashboardLinkClass(isActive)}>
                Dashboard
              </NavLink>
              <NavLink to="/projects" className={({ isActive }) => projectsLinkClass(isActive)}>
                Projects
              </NavLink>
            </nav>
          </div>

          <div className="d-flex align-items-center gap-3 flex-shrink-0">
            <button
              type="button"
              className="btn btn-link p-1 text-secondary d-none d-md-inline-block"
              aria-label="Notifications"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7M13.73 21a2 2 0 01-3.46 0" />
              </svg>
            </button>
            <div className="d-none d-sm-flex align-items-center gap-2 text-end">
              <div className="small lh-sm">
                <div className="fw-semibold text-dark" style={{ maxWidth: 140 }} title={email}>
                  {displayName}
                </div>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                  Student
                </div>
              </div>
              <span
                className="rounded-circle text-white d-inline-flex align-items-center justify-content-center fw-semibold flex-shrink-0"
                style={{
                  width: 40,
                  height: 40,
                  background: `${brand}33`,
                  color: brand,
                  fontSize: '0.9rem',
                }}
              >
                {initials.slice(0, 2)}
              </span>
            </div>
            <button
              type="button"
              className="btn btn-link p-1 text-secondary"
              aria-label="Log out"
              onClick={logout}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
