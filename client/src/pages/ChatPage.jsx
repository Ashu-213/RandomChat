import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import VideoPanel from '../components/chat/VideoPanel';
import ControlBar from '../components/chat/ControlBar';
import StatusOverlay from '../components/chat/StatusOverlay';
import { useMediaStream } from '../hooks/useMediaStream';
import { useWebRTC } from '../hooks/useWebRTC';
import useChatStore from '../store/chatStore';
import { getExistingSocket } from '../lib/socket';

/**
 * ChatPage — Full video chat experience.
 *
 * Orchestrates:
 * - Media acquisition
 * - Queue join/leave
 * - WebRTC connection lifecycle
 * - Skip/Next flow
 * - Clean exit
 */
export default function ChatPage() {
  const navigate = useNavigate();
  const { acquireMedia, releaseMedia } = useMediaStream();

  const chatState = useChatStore((s) => s.chatState);
  const setChatState = useChatStore((s) => s.setChatState);
  const isSocketConnected = useChatStore((s) => s.isSocketConnected);
  const reset = useChatStore((s) => s.reset);

  const getSocket = useCallback(() => getExistingSocket(), []);

  const { startConnection, destroy } = useWebRTC(getSocket);

  // ── Listen for match and partner_left events ──
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onMatched = ({ peerId, initiator }) => {
      console.log('[Chat] Matched with:', peerId, 'initiator:', initiator);
      startConnection(peerId, initiator);
    };

    const onPartnerLeft = () => {
      console.log('[Chat] Partner left');
      destroy();
      // Auto re-queue
      setChatState('searching');
      socket.emit('join_queue');
    };

    const onQueued = () => {
      console.log('[Chat] In queue');
      setChatState('searching');
    };

    socket.on('matched', onMatched);
    socket.on('partner_left', onPartnerLeft);
    socket.on('queued', onQueued);

    return () => {
      socket.off('matched', onMatched);
      socket.off('partner_left', onPartnerLeft);
      socket.off('queued', onQueued);
    };
  }, [getSocket, startConnection, destroy, setChatState]);

  // ── Start chat: acquire media, then join queue ──
  const handleStart = useCallback(async () => {
    const stream = await acquireMedia();
    if (!stream) return; // permission denied — state is already set

    const socket = getSocket();
    if (socket && socket.connected) {
      setChatState('searching');
      socket.emit('join_queue');
    }
  }, [acquireMedia, getSocket, setChatState]);

  // ── Skip current partner: destroy connection, emit skip (server re-queues us) ──
  const handleSkip = useCallback(() => {
    destroy();
    const socket = getSocket();
    if (socket && socket.connected) {
      socket.emit('skip');
      setChatState('searching');
    }
  }, [destroy, getSocket, setChatState]);

  // ── Leave chat entirely: full cleanup ──
  const handleLeave = useCallback(() => {
    destroy();
    const socket = getSocket();
    if (socket && socket.connected) {
      socket.emit('leave_queue');
    }
    releaseMedia();
    reset();
    navigate('/home');
  }, [destroy, getSocket, releaseMedia, reset, navigate]);

  // ── Cleanup on unmount (e.g. browser back button) ──
  useEffect(() => {
    return () => {
      destroy();
      const socket = getSocket();
      if (socket && socket.connected) {
        socket.emit('leave_queue');
      }
    };
  }, [destroy, getSocket]);

  return (
    <div className="h-screen flex flex-col bg-slate-950 overflow-hidden relative">
      {/* Top Status Bar (Frosted Light Glass Header) */}
      <header className="relative z-20 flex items-center justify-between border-b border-[var(--color-border)]
                         glass-panel px-5 py-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-white p-0.5 flex items-center justify-center border border-slate-200">
            <img src="/logo.jpeg" alt="Logo" className="w-full h-full object-cover rounded-md" />
          </div>
          <span className="text-base font-extrabold text-brand-gradient bg-clip-text text-transparent tracking-tight">RandomChat</span>
        </div>
        <StatusOverlay />
      </header>

      {/* Cinematic Video Grid Stage */}
      <main className="flex-1 relative w-full h-full bg-slate-950 overflow-hidden flex flex-col pb-24">
        <VideoPanel />
      </main>

      {/* Floating FaceTime-style Control Bar Overlay */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-full max-w-lg px-6 pointer-events-none">
        <div className="pointer-events-auto">
          <ControlBar
            onStart={handleStart}
            onSkip={handleSkip}
            onLeave={handleLeave}
          />
        </div>
      </div>
    </div>
  );
}
