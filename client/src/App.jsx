import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useSocket } from './hooks/useSocket';
import LandingPage from './pages/LandingPage';
import HomePage from './pages/HomePage';
import ChatPage from './pages/ChatPage';

export default function App() {
  const { user, loading, error, signInWithGoogle, getToken, logout, isAuthenticated } = useAuth();
  useSocket(getToken, isAuthenticated);

  if (loading) {
    return (
      <div className="app-loading">
        <span className="spinner spinner-lg" />
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            isAuthenticated
              ? <Navigate to="/home" replace />
              : <LandingPage onLogin={signInWithGoogle} loading={loading} error={error} />
          }
        />
        <Route
          path="/home"
          element={isAuthenticated ? <HomePage user={user} onLogout={logout} /> : <Navigate to="/" replace />}
        />
        <Route
          path="/chat"
          element={isAuthenticated ? <ChatPage /> : <Navigate to="/" replace />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
