import { memo } from 'react';
import useChatStore from '../../store/chatStore';

const ControlBar = memo(function ControlBar({
  onSkip,
  onLeave,
  onStart,
  onFlipCamera,
  canFlipCamera,
  isFlippingCamera,
}) {
  const chatState   = useChatStore((s) => s.chatState);
  const isMuted     = useChatStore((s) => s.isMuted);
  const isCamOff    = useChatStore((s) => s.isCamOff);
  const toggleMute  = useChatStore((s) => s.toggleMute);
  const toggleCamera = useChatStore((s) => s.toggleCamera);

  const isInSession = chatState === 'searching' || chatState === 'connecting' || chatState === 'connected';
  const canSkip     = chatState === 'connected';
  const isIdle      = chatState === 'idle' || chatState === 'permission_denied';

  return (
    <div className="control-bar">
      {isIdle && (
        <button id="start-chat-btn" className="ctrl-btn-start" onClick={onStart}>
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
          </svg>
          Start Video Chat
        </button>
      )}

      {isInSession && (
        <>
          {canFlipCamera && (
            <button
              id="flip-camera-btn"
              className="ctrl-btn"
              onClick={onFlipCamera}
              disabled={isFlippingCamera}
              title="Flip camera"
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h11a3 3 0 013 3v1M20 17H9a3 3 0 01-3-3v-1" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 4l3 3-3 3M9 20l-3-3 3-3" />
              </svg>
            </button>
          )}

          {/* Mute */}
          <button
            id="mute-btn"
            className={`ctrl-btn${isMuted ? ' active' : ''}`}
            onClick={toggleMute}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 19L5 5m14 0v4a2 2 0 01-2 2H7m0 0v2a5 5 0 0010 0v-2M7 11V7a5 5 0 0110 0" />
              </svg>
            ) : (
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
              </svg>
            )}
          </button>

          {/* Camera */}
          <button
            id="camera-btn"
            className={`ctrl-btn${isCamOff ? ' active' : ''}`}
            onClick={toggleCamera}
            title={isCamOff ? 'Turn camera on' : 'Turn camera off'}
          >
            {isCamOff ? (
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M12 18.75H4.5a2.25 2.25 0 01-2.25-2.25V7.5A2.25 2.25 0 014.5 5.25h7.5" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
              </svg>
            ) : (
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
              </svg>
            )}
          </button>

          <div className="ctrl-divider" />

          {/* Skip */}
          <button
            id="skip-btn"
            className="ctrl-btn-skip"
            onClick={onSkip}
            disabled={!canSkip && chatState !== 'searching'}
          >
            {chatState === 'searching' ? (
              'Searching…'
            ) : (
              <>
                Next
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </>
            )}
          </button>

          {/* Leave */}
          <button id="leave-btn" className="ctrl-btn-leave" onClick={onLeave} title="Leave chat">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
});

export default ControlBar;
