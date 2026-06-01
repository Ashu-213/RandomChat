import { memo } from 'react';
import useChatStore from '../../store/chatStore';

/**
 * ControlBar — Chat action buttons.
 * Mute, Camera toggle, Skip/Next, Leave.
 *
 * memo() prevents re-renders from parent state changes.
 * Each button subscribes only to its relevant slice of state.
 */
const ControlBar = memo(function ControlBar({ onSkip, onLeave, onStart }) {
  const chatState = useChatStore((s) => s.chatState);
  const isMuted = useChatStore((s) => s.isMuted);
  const isCamOff = useChatStore((s) => s.isCamOff);
  const toggleMute = useChatStore((s) => s.toggleMute);
  const toggleCamera = useChatStore((s) => s.toggleCamera);

  const isInSession = chatState === 'searching' || chatState === 'connecting' || chatState === 'connected';
  const canSkip = chatState === 'connected';
  const isIdle = chatState === 'idle' || chatState === 'permission_denied';

  return (
    <div className="flex items-center justify-center gap-4 p-4.5 bg-white/70 backdrop-blur-xl
                    border border-white/50 shadow-2xl rounded-3xl w-full">

      {/* Start Chat Button — shown when idle */}
      {isIdle && (
        <button
          id="start-chat-btn"
          onClick={onStart}
          className="flex items-center gap-2 px-8 py-3 bg-brand-gradient text-white
                     font-bold rounded-xl hover:scale-[1.02] active:scale-[0.98]
                     transition-all duration-300 shadow-md hover:shadow-lg animate-pulse-glow cursor-pointer text-sm tracking-wide"
        >
          <svg className="w-5 h-5 animate-float" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
          </svg>
          Start Video Chat
        </button>
      )}

      {/* In-session controls */}
      {isInSession && (
        <>
          {/* Mute Toggle */}
          <button
            id="mute-btn"
            onClick={toggleMute}
            className={`p-3.5 rounded-full transition-all duration-300 shadow-xs cursor-pointer hover:scale-105 active:scale-95 ${
              isMuted
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200/50'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 19L5 5m14 0v4a2 2 0 01-2 2H7m0 0v2a5 5 0 0010 0v-2M7 11V7a5 5 0 0110 0" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
              </svg>
            )}
          </button>

          {/* Camera Toggle */}
          <button
            id="camera-btn"
            onClick={toggleCamera}
            className={`p-3.5 rounded-full transition-all duration-300 shadow-xs cursor-pointer hover:scale-105 active:scale-95 ${
              isCamOff
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200/50'
            }`}
            title={isCamOff ? 'Turn camera on' : 'Turn camera off'}
          >
            {isCamOff ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M12 18.75H4.5a2.25 2.25 0 01-2.25-2.25V7.5A2.25 2.25 0 014.5 5.25h7.5" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
              </svg>
            )}
          </button>

          {/* Skip / Next Button (Premium Brand Gradient trigger) */}
          <button
            id="skip-btn"
            onClick={onSkip}
            disabled={!canSkip && chatState !== 'searching'}
            className="flex items-center justify-center gap-2 px-7 py-3 bg-blue-purple text-white
                       font-extrabold rounded-full transition-all duration-300 shadow-md hover:shadow-lg
                       disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer hover:scale-105 active:scale-95 text-sm tracking-wide"
          >
            <span className="flex items-center gap-1.5">
              {chatState === 'searching' ? 'Searching...' : 'Next Connection'}
              {chatState !== 'searching' && (
                <svg className="w-4 h-4 translate-x-0 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              )}
            </span>
          </button>

          {/* Leave / Exit Button */}
          <button
            id="leave-btn"
            onClick={onLeave}
            className="p-3.5 rounded-full bg-red-100 hover:bg-red-200 text-red-600 border border-red-200/50
                       transition-all duration-300 cursor-pointer shadow-xs hover:scale-105 active:scale-95"
            title="Leave chat"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
});

export default ControlBar;
