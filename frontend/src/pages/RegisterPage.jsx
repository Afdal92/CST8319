import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerRequest } from '../api/index.js';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail || !password) {
      setError('Name, email, and password are required.');
      return;
    }

    setLoading(true);
    try {
      const response = await registerRequest({
        name: trimmedName,
        email: trimmedEmail,
        password: password,
      });
      const data = await response.json().catch(function () {
        return {};
      });

      if (!response.ok) {
        setError(data.message || 'Registration failed.');
        return;
      }

      navigate('/login', { replace: true });
    } catch {
      setError('Cannot connect right now. Check your connection or try again in a moment.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="d-flex align-items-center justify-content-center"
      style={{ minHeight: '100%', padding: '2rem', background: '#f8f9fb' }}
    >
      <div
        className="bg-white rounded-3 shadow-sm p-4 p-md-5"
        style={{ width: '100%', maxWidth: 440 }}
      >
        <h1 className="h4 fw-bold mb-1" style={{ color: '#0f172a' }}>
          Create account
        </h1>
        <p className="text-secondary small mb-4">Sign up with your campus email</p>

        <form onSubmit={handleSubmit} noValidate>
          {error ? (
            <div className="alert alert-danger py-2 small mb-3" role="alert">
              {error}
            </div>
          ) : null}

          <div className="mb-3">
            <label htmlFor="reg-name" className="form-label small text-secondary fw-medium">
              Full name
            </label>
            <input
              id="reg-name"
              name="name"
              type="text"
              autoComplete="name"
              className="form-control"
              placeholder="Alex Student"
              value={name}
              onChange={function (e) {
                setName(e.target.value);
              }}
            />
          </div>

          <div className="mb-3">
            <label htmlFor="reg-email" className="form-label small text-secondary fw-medium">
              Email
            </label>
            <input
              id="reg-email"
              name="email"
              type="email"
              autoComplete="email"
              className="form-control"
              placeholder="student@university.edu"
              value={email}
              onChange={function (e) {
                setEmail(e.target.value);
              }}
            />
          </div>

          <div className="mb-4">
            <label htmlFor="reg-password" className="form-label small text-secondary fw-medium">
              Password
            </label>
            <input
              id="reg-password"
              name="password"
              type="password"
              autoComplete="new-password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={function (e) {
                setPassword(e.target.value);
              }}
            />
          </div>

          <button
            type="submit"
            className="btn w-100 fw-semibold text-white border-0 py-2"
            style={{ background: '#5d45fd' }}
            disabled={loading}
          >
            {loading ? 'Creating account…' : 'Register'}
          </button>
        </form>

        <p className="text-center text-secondary small mt-4 mb-0">
          Already have an account?{' '}
          <Link to="/login" className="fw-semibold" style={{ color: '#2563eb' }}>
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
