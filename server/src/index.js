require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const { initFirebase } = require('./config/firebase');
const { socketAuthMiddleware } = require('./handlers/authHandler');
const { registerMatchHandlers } = require('./handlers/matchHandler');
const { registerSignalingHandlers } = require('./handlers/signalingHandler');
const { initRedis, getRedisClient } = require('./config/redis');
const MatchQueue = require('./queue/MatchQueue');
const RedisMatchQueue = require('./queue/RedisMatchQueue');
const { createAdapter } = require('@socket.io/redis-adapter');
const logger = require('./utils/logger');
const crypto = require('crypto');

// Generate a unique server identifier for multi-instance clustering
const SERVER_ID = process.env.SERVER_ID || Math.random().toString(36).substring(2, 15);

// ─── Initialize Firebase Admin ───────────────────────────────────────────
initFirebase();

// ─── Initialize Redis if configured ──────────────────────────────────────
const useRedis = process.env.USE_REDIS === 'true';
let redisClient = null;
let matchQueue = null;

if (useRedis) {
  redisClient = initRedis();
  if (redisClient) {
    matchQueue = new RedisMatchQueue(redisClient, SERVER_ID);
    logger.info('Server', 'Using RedisMatchQueue for distributed matchmaking');
  } else {
    logger.warn('Server', 'Redis initialization failed. Falling back to In-Memory Queue.');
    matchQueue = new MatchQueue();
  }
} else {
  matchQueue = new MatchQueue();
  logger.info('Server', 'Using In-Memory MatchQueue (Single-Instance mode)');
}

// ─── Express App ─────────────────────────────────────────────────────────
const app = express();
const server = http.createServer(app);

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    serverId: SERVER_ID,
    usingRedis: useRedis && !!redisClient,
    queueSize: !useRedis ? matchQueue.size : 'dynamic',
  });
});

// ─── Socket.IO Server ───────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ['GET', 'POST'],
  },
  // Performance: prefer websocket, fallback to polling
  transports: ['websocket', 'polling'],
  // Ping configuration for stale socket detection
  pingInterval: 25000,
  pingTimeout: 20000,
});

// ─── Scalable Socket.IO Redis Adapter ────────────────────────────────────
if (useRedis && redisClient) {
  const pubClient = redisClient;
  const subClient = pubClient.duplicate();
  io.adapter(createAdapter(pubClient, subClient));
  logger.info('Server', 'Socket.IO Redis Adapter initialized successfully');
}

// ─── Socket.IO Middleware ───────────────────────────────────────────────
io.use(socketAuthMiddleware);

// ─── Socket.IO Connection Handler ───────────────────────────────────────
io.on('connection', (socket) => {
  logger.info('Socket', 'Client connected', {
    socketId: socket.id,
    uid: socket.data.uid,
    email: socket.data.email,
  });

  // Confirm auth to client
  socket.emit('auth_ok', { uid: socket.data.uid });

  // Register event handlers
  registerMatchHandlers(io, socket, matchQueue);
  registerSignalingHandlers(io, socket, matchQueue);

  // Heartbeat (client can emit to keep alive, server just acknowledges)
  socket.on('heartbeat', () => {
    socket.emit('heartbeat_ack');
  });
});

// ─── Start Server ───────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  logger.info('Server', `RandomChat server running on port ${PORT} [Instance: ${SERVER_ID}]`);
  logger.info('Server', `CORS origin: ${CLIENT_ORIGIN}`);
});

// ─── Graceful Shutdown ──────────────────────────────────────────────────
const shutdown = () => {
  logger.info('Server', 'Shutting down...');
  if (typeof matchQueue.destroy === 'function') {
    matchQueue.destroy();
  }
  io.close();
  server.close(() => {
    logger.info('Server', 'Server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
