const { admin } = require('../config/firebase');
const logger = require('../utils/logger');

/**
 * Socket.IO middleware: verifies Firebase ID token on connection.
 * Attaches decoded user info to socket.data.
 */
const socketAuthMiddleware = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      logger.warn('Auth', 'Connection attempt without token', { id: socket.id });
      return next(new Error('AUTH_NO_TOKEN'));
    }

    const decoded = await admin.auth().verifyIdToken(token);
    socket.data.uid = decoded.uid;
    socket.data.email = decoded.email || null;
    socket.data.name = decoded.name || null;

    logger.info('Auth', 'Socket authenticated', {
      socketId: socket.id,
      uid: decoded.uid,
      email: decoded.email,
    });

    next();
  } catch (err) {
    logger.error('Auth', 'Token verification failed', {
      socketId: socket.id,
      error: err.message,
    });
    next(new Error('AUTH_INVALID_TOKEN'));
  }
};

module.exports = { socketAuthMiddleware };
