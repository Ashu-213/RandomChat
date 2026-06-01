import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

/**
 * Socket.IO client singleton.
 * Created ONCE outside of React — prevents multiple connections on re-render.
 *
 * autoConnect is disabled so we can attach the auth token before connecting.
 * The connection is established manually in useSocket hook after auth is ready.
 */
let socket = null;

export const getSocket = (token) => {
  if (socket && socket.connected) return socket;

  // Disconnect any existing stale socket
  if (socket) {
    socket.disconnect();
  }

  socket = io(SOCKET_URL, {
    autoConnect: false,
    transports: ['websocket', 'polling'],
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getExistingSocket = () => socket;
