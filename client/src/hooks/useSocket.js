import { useEffect, useRef, useCallback } from 'react';
import { getSocket, disconnectSocket, getExistingSocket } from '../lib/socket';
import useChatStore from '../store/chatStore';

/**
 * useSocket — Manages Socket.IO lifecycle tied to auth state.
 *
 * Responsibilities:
 * - Creates/connects socket with auth token
 * - Handles reconnection events
 * - Tracks connection status in store
 * - Cleans up on unmount or auth change
 *
 * @param {Function} getToken - async fn returning Firebase ID token
 * @param {boolean} isAuthenticated - whether user is logged in
 */
export function useSocket(getToken, isAuthenticated) {
  const socketRef = useRef(null);
  const { setSocketConnected } = useChatStore();

  const connect = useCallback(async () => {
    if (!isAuthenticated || !getToken) return;

    const token = await getToken();
    if (!token) return;

    const socket = getSocket(token);
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
      setSocketConnected(true);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      setSocketConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
      setSocketConnected(false);
    });

    socket.on('auth_ok', ({ uid }) => {
      console.log('[Socket] Authenticated as:', uid);
    });

    socket.on('auth_error', ({ message }) => {
      console.error('[Socket] Auth error:', message);
      setSocketConnected(false);
    });

    if (!socket.connected) {
      socket.connect();
    }
  }, [isAuthenticated, getToken, setSocketConnected]);

  // Connect when authenticated
  useEffect(() => {
    connect();

    return () => {
      // Don't disconnect on every re-render; only on actual unmount
    };
  }, [connect]);

  // Cleanup on full unmount (leaving app)
  useEffect(() => {
    return () => {
      disconnectSocket();
      setSocketConnected(false);
    };
  }, [setSocketConnected]);

  return {
    socket: socketRef,
    getSocket: () => getExistingSocket(),
  };
}
