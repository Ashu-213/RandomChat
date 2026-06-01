import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import VideoPanel from '../components/chat/VideoPanel';
import ControlBar from '../components/chat/ControlBar';
import StatusOverlay from '../components/chat/StatusOverlay';
import { useMediaStream } from '../hooks/useMediaStream';
import { useWebRTC } from '../hooks/useWebRTC';
import useChatStore from '../store/chatStore';
import { getExistingSocket } from '../lib/socket';

export default function ChatPage() {
  const navigate = useNavigate();
  const { acquireMedia, releaseMedia } = useMediaStream();

  const chatState    = useChatStore((s) => s.chatState);
  const setChatState = useChatStore((s) => s.setChatState);
  const reset        = useChatStore((s) => s.reset);

  const getSocket = useCallback(() => getExistingSocket(), []);
  const { startConnection, destroy } = useWebRTC(getSocket);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onMatched     = ({ peerId, initiator }) => startConnection(peerId, initiator);
    const onPartnerLeft = () => { destroy(); setChatState('searching'); socket.emit('join_queue'); };
    const onQueued      = () => setChatState('searching');

    socket.on('matched',      onMatched);
    socket.on('partner_left', onPartnerLeft);
    socket.on('queued',       onQueued);

    return () => {
      socket.off('matched',      onMatched);
      socket.off('partner_left', onPartnerLeft);
      socket.off('queued',       onQueued);
    };
  }, [getSocket, startConnection, destroy, setChatState]);

  const handleStart = useCallback(async () => {
    const stream = await acquireMedia();
    if (!stream) return;
    const socket = getSocket();
    if (socket?.connected) { setChatState('searching'); socket.emit('join_queue'); }
  }, [acquireMedia, getSocket, setChatState]);

  const handleSkip = useCallback(() => {
    destroy();
    const socket = getSocket();
    if (socket?.connected) { socket.emit('skip'); setChatState('searching'); }
  }, [destroy, getSocket, setChatState]);

  const handleLeave = useCallback(() => {
    destroy();
    const socket = getSocket();
    if (socket?.connected) socket.emit('leave_queue');
    releaseMedia();
    reset();
    navigate('/home');
  }, [destroy, getSocket, releaseMedia, reset, navigate]);

  useEffect(() => {
    return () => {
      destroy();
      const socket = getSocket();
      if (socket?.connected) socket.emit('leave_queue');
    };
  }, [destroy, getSocket]);

  return (
    <div className="chat-layout">
      <header className="chat-nav">
        <div className="chat-nav-brand">
          <img src="/logo.jpeg" alt="Logo" className="chat-nav-logo" />
          <span className="chat-nav-title gradient-text">RandomChat</span>
        </div>
        <StatusOverlay />
      </header>

      <div className="chat-stage">
        <VideoPanel />
        <ControlBar onStart={handleStart} onSkip={handleSkip} onLeave={handleLeave} />
      </div>
    </div>
  );
}
