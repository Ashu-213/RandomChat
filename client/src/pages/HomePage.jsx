import { useNavigate } from 'react-router-dom';

/**
 * HomePage — Post-login home screen.
 * Shows user info, quick start button, and online status.
 */
export default function HomePage({ user, onLogout }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg-primary)] relative overflow-hidden">
      {/* Background drift orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="orb orb-blue" />
        <div className="orb orb-purple" />
        <div className="orb orb-orange" />
      </div>

      {/* Top Nav (Frosted Glass Header) */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4
                         glass-panel border-b border-[var(--color-border)] shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white p-0.5 flex items-center justify-center shadow-xs border border-slate-100">
            <img src="/logo.jpeg" alt="Logo" className="w-full h-full object-cover rounded-lg" />
          </div>
          <span className="text-xl font-black text-brand-gradient bg-clip-text text-transparent tracking-tight">RandomChat</span>
        </div>

        <div className="flex items-center gap-4">
          {/* User profile widget */}
          <div className="flex items-center gap-2.5 bg-white/60 backdrop-blur-xs py-1.5 px-3 rounded-full border border-slate-200/50 shadow-xs">
            {user?.photoURL && (
              <img
                src={user.photoURL}
                alt="avatar"
                className="w-6.5 h-6.5 rounded-full border border-slate-200"
                referrerPolicy="no-referrer"
              />
            )}
            <span className="text-xs font-semibold text-slate-700 hidden sm:inline">{user?.displayName?.split(' ')[0] || 'User'}</span>
          </div>
          <button
            id="logout-btn"
            onClick={onLogout}
            className="text-xs font-bold text-slate-400 hover:text-red-500
                       transition-colors cursor-pointer px-3 py-1.5 rounded-lg hover:bg-red-50/50"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div className="flex flex-col items-center gap-8 max-w-md w-full glass-panel p-8 md:p-10 rounded-3xl shadow-xl animate-fade-in border border-white/60">
          
          {/* Welcome Text */}
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight mb-2.5">
              Welcome, <span className="text-brand-gradient bg-clip-text text-transparent">{user?.displayName?.split(' ')[0] || 'there'}</span>!
            </h2>
            <p className="text-[var(--color-text-secondary)] text-sm font-medium leading-relaxed max-w-xs mx-auto">
              Ready to meet someone new? Start an instant live video chat and expand your world.
            </p>
          </div>

          {/* Centerpiece: Multi-layered Pulsing Portal Orb */}
          <div className="relative flex items-center justify-center my-3">
            {/* Pulsing rings */}
            <div className="absolute w-52 h-52 rounded-full bg-brand-gradient opacity-10 animate-ping pointer-events-none" style={{ animationDuration: '3s' }} />
            <div className="absolute w-44 h-44 rounded-full bg-indigo-500 opacity-8 animate-pulse pointer-events-none" />
            <div className="absolute w-38 h-38 rounded-full bg-white/45 border border-white/65 backdrop-blur-xs pointer-events-none shadow-inner" />
            
            {/* Main Gradient Trigger Orb */}
            <button
              id="go-to-chat-btn"
              onClick={() => navigate('/chat')}
              className="group relative w-30 h-30 rounded-full bg-brand-gradient
                         flex flex-col items-center justify-center gap-1 shadow-xl
                         hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-350 cursor-pointer
                         animate-pulse-glow z-10 border border-white/30"
            >
              <svg className="w-10 h-10 text-white group-hover:scale-110 transition-transform animate-float" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
              </svg>
              <span className="text-white font-extrabold text-[10px] tracking-wider uppercase">Start Chat</span>
            </button>
          </div>

          {/* Info cards (Value Pillars) */}
          <div className="grid grid-cols-3 gap-3 w-full mt-2">
            <div className="flex flex-col items-center gap-2 p-3.5 rounded-2xl glass-card border border-white/65 shadow-sm hover:scale-[1.03] transition-all duration-200">
              <div className="w-10 h-10 rounded-full bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 shadow-xs">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.25}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              </div>
              <span className="text-[11px] font-bold text-slate-600">Instant</span>
            </div>
            
            <div className="flex flex-col items-center gap-2 p-3.5 rounded-2xl glass-card border border-white/65 shadow-sm hover:scale-[1.03] transition-all duration-200">
              <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-xs">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.25}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
              <span className="text-[11px] font-bold text-slate-600">Secure</span>
            </div>

            <div className="flex flex-col items-center gap-2 p-3.5 rounded-2xl glass-card border border-white/65 shadow-sm hover:scale-[1.03] transition-all duration-200">
              <div className="w-10 h-10 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 shadow-xs">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.25}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582" />
                </svg>
              </div>
              <span className="text-[11px] font-bold text-slate-600">Global</span>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
