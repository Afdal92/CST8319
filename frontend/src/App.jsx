import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ProjectsListPage from './pages/ProjectsListPage.jsx';
import ProjectPage from './pages/ProjectPage.jsx';

function RequireAuth({ children }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <DashboardPage />
          </RequireAuth>
        }
      />
      <Route
        path="/projects"
        element={
          <RequireAuth>
            <ProjectsListPage />
          </RequireAuth>
        }
      />
      <Route
        path="/projects/:projectId"
        element={
          <RequireAuth>
            <ProjectPage />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
