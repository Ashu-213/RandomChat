import { useNavigate } from 'react-router-dom';

export default function HomePage({ user, onLogout }) {
  const navigate = useNavigate();

  return (
    <div className="home-layout">
      <div className="bg-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      {/* Nav */}
      <header className="home-nav">
        <div className="nav-brand">
          <img src="/logo.jpeg" alt="Logo" className="nav-logo" />
          <span className="nav-title gradient-text">RandomChat</span>
        </div>
        <div className="nav-right">
          <div className="user-chip">
            {user?.photoURL && (
              <img src={user.photoURL} alt="avatar" referrerPolicy="no-referrer" />
            )}
            <span>{user?.displayName?.split(' ')[0] || 'User'}</span>
          </div>
          <button className="btn-signout" onClick={onLogout}>
            Sign out
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="home-main">
        <div className="home-hero">
          <h2>
            Welcome back,{' '}
            <span className="gradient-text">
              {user?.displayName?.split(' ')[0] || 'there'}
            </span>
          </h2>
          <p>
            Ready to meet someone new? Start a live video chat and connect with
            people from all over the world.
          </p>
        </div>

        <div className="home-cta-wrap">
          <button
            id="go-to-chat-btn"
            className="btn-start-main"
            onClick={() => navigate('/chat')}
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
            </svg>
            Start Video Chat
          </button>
          <span className="home-cta-hint">Instantly matched · No waiting</span>
        </div>

        <div className="home-stats">
          <div className="stat-card">
            <div className="stat-icon stat-icon-cyan">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            <span className="stat-label">Instant</span>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-icon-purple">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <span className="stat-label">Private</span>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-icon-orange">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3" />
              </svg>
            </div>
            <span className="stat-label">Global</span>
          </div>
        </div>
      </main>
    </div>
  );
}
