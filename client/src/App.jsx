import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useSocket } from './hooks/useSocket';
import LandingPage from './pages/LandingPage';
import HomePage from './pages/HomePage';
import ChatPage from './pages/ChatPage';
import Spinner from './components/common/Spinner';

/**
 * App — Root component.
 *
 * Auth flow:
 * 1. Firebase onAuthStateChanged fires on mount (handles persisted session)
 * 2. If not authenticated → LandingPage
 * 3. If authenticated → Socket connects → Home or Chat routes available
 *
 * Socket is initialized here (top level) so it persists across page navigation.
 */
export default function App() {
  const { user, loading, error, signInWithGoogle, getToken, logout, isAuthenticated } = useAuth();

  // Socket connection — only active when authenticated
  useSocket(getToken, isAuthenticated);

  // Show loading spinner during initial auth check
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)]">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" className="text-[var(--color-accent)]" />
          <p className="text-[var(--color-text-muted)] text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public route — Landing / Login */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/home" replace />
            ) : (
              <LandingPage
                onLogin={signInWithGoogle}
                loading={loading}
                error={error}
              />
            )
          }
        />

        {/* Protected routes */}
        <Route
          path="/home"
          element={
            isAuthenticated ? (
              <HomePage user={user} onLogout={logout} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/chat"
          element={
            isAuthenticated ? (
              <ChatPage />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
