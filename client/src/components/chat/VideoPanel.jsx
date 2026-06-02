import { useRef, useEffect, memo, useMemo, useState } from 'react';
import useChatStore from '../../store/chatStore';

const VideoPanel = memo(function VideoPanel() {
  const mainVideoRef = useRef(null);
  const pipVideoRef = useRef(null);

  const localStream  = useChatStore((s) => s.localStream);
  const remoteStream = useChatStore((s) => s.remoteStream);
  const chatState    = useChatStore((s) => s.chatState);
  const isCamOff     = useChatStore((s) => s.isCamOff);
  const [showSelfMain, setShowSelfMain] = useState(false);

  useEffect(() => {
    if (chatState !== 'connected') {
      setShowSelfMain(false);
    }
  }, [chatState]);

  const canSwapFeeds = Boolean(chatState === 'connected' && localStream && remoteStream);

  const mainStream = useMemo(() => {
    if (chatState !== 'connected') return null;
    return showSelfMain ? localStream : remoteStream;
  }, [chatState, showSelfMain, localStream, remoteStream]);

  const pipStream = useMemo(() => {
    if (showSelfMain) return remoteStream;
    return localStream;
  }, [showSelfMain, localStream, remoteStream]);

  useEffect(() => {
    if (mainVideoRef.current) {
      mainVideoRef.current.srcObject = mainStream ?? null;
    }
  }, [mainStream]);

  useEffect(() => {
    if (pipVideoRef.current) {
      pipVideoRef.current.srcObject = pipStream ?? null;
    }
  }, [pipStream]);

  const showConnectedMain = Boolean(chatState === 'connected' && mainStream);

  const handleSwapFeeds = () => {
    if (!canSwapFeeds) return;
    setShowSelfMain((prev) => !prev);
  };

  return (
    <div className="video-panel">
      {/* Remote / main view */}
      <div className="video-remote">
        {showConnectedMain ? (
          <video
            ref={mainVideoRef}
            autoPlay
            playsInline
            muted={showSelfMain}
            id="remote-video"
            className={showSelfMain ? 'video-main-self' : ''}
          />
        ) : (
          <div className="video-state">
            {chatState === 'searching'        && <SearchingIndicator />}
            {chatState === 'connecting'       && <ConnectingIndicator />}
            {chatState === 'permission_denied' && <PermissionDenied />}
            {(chatState === 'idle' || !chatState) && <IdleState />}
          </div>
        )}
      </div>

      {/* Local PiP */}
      {pipStream && (
        <button
          type="button"
          className={`video-local-pip${canSwapFeeds ? ' swappable' : ''}`}
          onClick={handleSwapFeeds}
          title={canSwapFeeds ? 'Swap main video' : 'Local preview'}
        >
          {!showSelfMain && isCamOff ? (
            <div className="cam-off-pip">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M12 18.75H4.5a2.25 2.25 0 01-2.25-2.25V7.5A2.25 2.25 0 014.5 5.25h7.5" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
              </svg>
              <span>Camera off</span>
            </div>
          ) : (
            <video
              ref={pipVideoRef}
              autoPlay
              playsInline
              muted={!showSelfMain}
              id="local-video"
              className={showSelfMain ? '' : 'video-mirror'}
            />
          )}
          {canSwapFeeds && <span className="pip-hint">Tap to swap</span>}
        </button>
      )}
    </div>
  );
});

function IdleState() {
  return (
    <>
      <div className="idle-icon">
        <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
        </svg>
      </div>
      <p className="idle-title">Ready to Connect</p>
      <p className="idle-hint">Press Start Video Chat to find someone new.</p>
    </>
  );
}

function SearchingIndicator() {
  return (
    <div className="searching-wrap">
      <div className="searching-rings">
        <div className="ring ring-1" />
        <div className="ring ring-2" />
        <div className="ring ring-3" />
        <div className="ring-core">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </div>
      </div>
      <p className="searching-title">Finding a Match</p>
      <p className="searching-sub">Scanning active connections globally…</p>
    </div>
  );
}

function ConnectingIndicator() {
  return (
    <div className="connecting-wrap">
      <div className="connecting-spinner" />
      <p className="connecting-label">Establishing Link</p>
    </div>
  );
}

function PermissionDenied() {
  return (
    <>
      <div className="perm-icon">
        <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>
      <p className="perm-title">Camera Access Blocked</p>
      <p className="perm-sub">Enable camera and microphone permissions in your browser settings to continue.</p>
    </>
  );
}

export default VideoPanel;
