import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginRequest } from '../api/index.js';
import './LoginPage.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      const res = await loginRequest({ email: email.trim(), password });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message || 'Login failed. Try again.');
        return;
      }
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      navigate('/dashboard', { replace: true });
    } catch {
      setError('Cannot connect right now. Check your connection or try again in a moment.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <aside className="login-banner" aria-hidden="true">
          <div className="login-banner__overlay" />
          <div className="login-banner__content">
            <div className="login-banner__brand">
              <span className="login-banner__logo" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="36" height="36" fill="currentColor" aria-hidden="true">
                  <path d="M12 3 2 8l10 5 10-5-10-5Zm0 7L4.5 7.5 12 11l7.5-3.5L12 10Zm-8 3.2v4.3c0 3.4 4.5 6.5 8 7.5 3.5-1 8-4.1 8-7.5v-4.3l-8 4-8-4Z" />
                </svg>
              </span>
              <span className="login-banner__title">Campus Sprint Hub</span>
            </div>
            <p className="login-banner__tagline">
              Manage your group projects with ease using simplified Agile sprints.
            </p>
            <ul className="login-banner__features">
              <li>Scrum Boards</li>
              <li>Sprint Planning</li>
              <li>Team Progress</li>
            </ul>
          </div>
        </aside>

        <section className="login-form-section">
          <h1 className="login-form-section__heading">Welcome Back</h1>
          <p className="login-form-section__sub">Login to continue your project sprints</p>

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            {error ? (
              <div className="login-form__alert" role="alert">
                {error}
              </div>
            ) : null}

            <label className="login-field-label" htmlFor="login-email">
              Email Address
            </label>
            <div className="login-input-wrap">
              <span className="login-input-wrap__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path d="M4 6h16v12H4V6z" />
                  <path d="M4 7l8 6 8-6" />
                </svg>
              </span>
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                className="login-input"
                placeholder="student@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <label className="login-field-label" htmlFor="login-password">
              Password
            </label>
            <div className="login-input-wrap">
              <span className="login-input-wrap__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <rect x="5" y="11" width="14" height="10" rx="2" />
                  <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                </svg>
              </span>
              <input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                className="login-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button type="submit" className="login-submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Login'}
              {!loading ? (
                <span className="login-submit__arrow" aria-hidden="true">
                  →
                </span>
              ) : null}
            </button>
          </form>

          <p className="login-footer">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="login-footer__link">
              Register here
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
