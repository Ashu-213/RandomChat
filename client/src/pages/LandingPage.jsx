import GoogleLoginButton from '../components/auth/GoogleLoginButton';

export default function LandingPage({ onLogin, loading, error }) {
  return (
    <div className="landing">
      <div className="bg-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <div className="landing-card">
        {/* Logo */}
        <div className="landing-logo-wrap">
          <div className="landing-logo-ring">
            <img src="/logo.jpeg" alt="RandomChat" />
          </div>
          <div>
            <h1 className="landing-title">
              <span className="gradient-text">RandomChat</span>
            </h1>
          </div>
          <p className="landing-subtitle">
            Connect instantly with people around the world through live video chat.
          </p>
        </div>

        {/* Pills */}
        <div className="landing-pills">
          <div className="pill pill-cyan">
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            100% Free
          </div>
          <div className="pill pill-purple">
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
            Instant Match
          </div>
          <div className="pill pill-orange">
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3" />
            </svg>
            Global
          </div>
        </div>

        {/* Login */}
        <div className="landing-login">
          <GoogleLoginButton onClick={onLogin} loading={loading} />
          {error && <div className="error-msg">{error}</div>}
        </div>

        <p className="landing-footer">
          By signing in, you agree to be respectful to others.
        </p>
      </div>
    </div>
  );
}
