import { useRef, useEffect, memo } from 'react';
import useChatStore from '../../store/chatStore';

/**
 * VideoPanel — Renders local and remote video tiles.
 *
 * Engineering decisions:
 * - Uses refs for video.srcObject (not a React-controlled prop)
 * - memo() prevents unnecessary re-renders when parent state changes
 * - Local video is always muted (prevents echo)
 * - playsInline required for iOS Safari
 * - Remote video auto-plays when stream is attached
 */
const VideoPanel = memo(function VideoPanel() {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const localStream = useChatStore((s) => s.localStream);
  const remoteStream = useChatStore((s) => s.remoteStream);
  const chatState = useChatStore((s) => s.chatState);
  const isCamOff = useChatStore((s) => s.isCamOff);

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Attach remote stream to video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
    // Clean up when remote stream is cleared
    if (remoteVideoRef.current && !remoteStream) {
      remoteVideoRef.current.srcObject = null;
    }
  }, [remoteStream]);

  const showRemote = chatState === 'connected' && remoteStream;

  return (
    <div className="relative flex-1 flex items-center justify-center w-full h-full gap-4 p-4 md:p-6 bg-slate-950">
      
      {/* Remote Video / Primary Screen */}
      <div className="relative flex-1 h-full rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl flex items-center justify-center">
        {showRemote ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover rounded-3xl"
            id="remote-video"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-4 z-10 px-4">
            {chatState === 'searching' && <SearchingIndicator />}
            {chatState === 'connecting' && <ConnectingIndicator />}
            {chatState === 'idle' && (
              <div className="text-center animate-fade-in max-w-xs">
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 mx-auto mb-4 border border-slate-700">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
                <h3 className="text-white font-extrabold text-base tracking-tight mb-1">Ready to Connect</h3>
                <p className="text-slate-500 text-xs font-semibold">
                  Click "Start Video Chat" below to find someone new.
                </p>
              </div>
            )}
            {chatState === 'permission_denied' && (
              <div className="text-center px-6 animate-fade-in max-w-xs">
                <div className="w-16 h-16 rounded-full bg-red-950/50 flex items-center justify-center text-red-500 mx-auto mb-4 border border-red-900/50">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                </div>
                <h3 className="text-red-500 font-extrabold text-base tracking-tight mb-1">Camera Access Blocked</h3>
                <p className="text-slate-400 text-xs font-semibold leading-relaxed">
                  Please enable camera and microphone access in your browser settings to continue.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Local Video — Picture-in-Picture Float */}
      {localStream && (
        <div className="absolute bottom-6 right-6 w-32 h-24 sm:w-44 sm:h-32 md:w-52 md:h-38 rounded-2xl overflow-hidden
                        border-2 border-white/10 shadow-2xl z-10
                        bg-slate-900 transition-all duration-350 hover:scale-102">
          {isCamOff ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 gap-1 px-2 text-center">
              <div className="w-8 h-8 rounded-full bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M12 18.75H4.5a2.25 2.25 0 01-2.25-2.25V7.5A2.25 2.25 0 014.5 5.25h7.5" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
                </svg>
              </div>
              <span className="text-[9px] text-slate-500 font-extrabold tracking-wider uppercase hidden sm:inline">Camera Off</span>
            </div>
          ) : (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover mirror"
              style={{ transform: 'scaleX(-1)' }}
              id="local-video"
            />
          )}
        </div>
      )}
    </div>
  );
});

function SearchingIndicator() {
  return (
    <div className="flex flex-col items-center gap-6 animate-fade-in">
      {/* Concentric rings in spectrum brand colors */}
      <div className="relative w-24 h-24 flex items-center justify-center">
        {/* Orange outer ring */}
        <div className="absolute inset-0 rounded-full bg-[#f97316]/10 border border-[#f97316]/20"
             style={{ animation: 'searching-pulse 2.2s ease-out infinite' }} />
        {/* Pink middle ring */}
        <div className="absolute inset-3 rounded-full bg-[#ec4899]/15 border border-[#ec4899]/30"
             style={{ animation: 'searching-pulse 2.2s ease-out infinite 0.5s' }} />
        {/* Purple inner ring */}
        <div className="absolute inset-6 rounded-full bg-[#7c3aed]/20 border border-[#7c3aed]/40"
             style={{ animation: 'searching-pulse 2.2s ease-out infinite 1s' }} />
        {/* Tech-blue core */}
        <div className="absolute inset-9 rounded-full bg-gradient-to-br from-[#00d2ff] to-[#7c3aed] shadow-lg flex items-center justify-center z-10 border border-white/20">
          <svg className="w-5 h-5 text-white animate-float" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </div>
      </div>
      
      <div className="text-center">
        <h3 className="text-white font-extrabold text-lg tracking-tight mb-1">Finding a Match</h3>
        <p className="text-slate-400 text-xs font-semibold tracking-wide">
          Connecting with active video chats globally...
        </p>
      </div>
    </div>
  );
}

function ConnectingIndicator() {
  return (
    <div className="flex flex-col items-center gap-5 animate-fade-in">
      <div className="relative w-14 h-14 flex items-center justify-center">
        {/* Double-action color spinner */}
        <div className="absolute inset-0 border-3 border-transparent border-t-[#00d2ff] border-b-[#7c3aed] rounded-full animate-spin" style={{ animationDuration: '1.2s' }} />
        <div className="absolute inset-1.5 border-3 border-transparent border-l-[#ec4899] border-r-[#f97316] rounded-full animate-spin" style={{ animationDuration: '0.8s', animationDirection: 'reverse' }} />
      </div>
      <p className="text-indigo-200 text-xs font-extrabold tracking-widest uppercase animate-pulse">
        Establishing Link...
      </p>
    </div>
  );
}

export default VideoPanel;
