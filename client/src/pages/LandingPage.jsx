import GoogleLoginButton from '../components/auth/GoogleLoginButton';

/**
 * LandingPage — Unauthenticated entry point.
 * Shows app branding and Google sign-in button.
 */
export default function LandingPage({ onLogin, loading, error }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-bg-primary)] px-4 relative overflow-hidden">
      {/* Background gradient effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="orb orb-blue" />
        <div className="orb orb-purple" />
        <div className="orb orb-orange" />
      </div>

      {/* Main Glass Panel */}
      <div className="relative z-10 flex flex-col items-center gap-8 max-w-md w-full glass-panel p-8 md:p-10 rounded-3xl shadow-xl animate-fade-in border border-white/60">
        
        {/* Logo / Brand */}
        <div className="flex flex-col items-center gap-4">
          
          {/* Stylized Logo with Brand Gradient Glow */}
          <div className="relative group animate-float mb-2">
            <div className="absolute -inset-1.5 bg-gradient-to-r from-[#00d2ff] via-[#7c3aed] to-[#f97316] rounded-3xl blur opacity-70 group-hover:opacity-100 transition duration-500" />
            <div className="relative w-20 h-20 bg-white rounded-3xl p-1 flex items-center justify-center shadow-lg border border-white/80">
              <img
                src="/logo.jpeg"
                alt="RandomChat Logo"
                className="w-full h-full object-cover rounded-2xl"
              />
            </div>
          </div>

          <h1 className="text-4xl font-extrabold text-brand-gradient bg-clip-text text-transparent tracking-tight text-center">
            RandomChat
          </h1>
          
          <p className="text-[var(--color-text-secondary)] text-center text-sm leading-relaxed max-w-xs mt-1">
            Connect instantly with random people around the world through live video chat.
          </p>
        </div>

        {/* Features Capsule List */}
        <div className="flex flex-wrap justify-center gap-2.5 w-full my-1">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-600 text-xs font-semibold shadow-xs">
            <svg className="w-3.5 h-3.5 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            100% Free
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-50 border border-violet-200 text-violet-600 text-xs font-semibold shadow-xs">
            <svg className="w-3.5 h-3.5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
            Instant Match
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-orange-600 text-xs font-semibold shadow-xs">
            <svg className="w-3.5 h-3.5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            Anonymous
          </div>
        </div>

        {/* Login Area */}
        <div className="flex flex-col items-center gap-3 w-full mt-2">
          <GoogleLoginButton onClick={onLogin} loading={loading} />

          {error && (
            <p className="text-[var(--color-danger)] text-xs text-center max-w-xs animate-fade-in font-medium">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <p className="text-[var(--color-text-muted)] text-xs text-center border-t border-[var(--color-border)] pt-4 w-full mt-2 font-medium">
          By signing in, you agree to be respectful to others.
        </p>
      </div>
    </div>
  );
}
