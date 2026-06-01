const logger = require('../utils/logger');
const SocketRateLimiter = require('../utils/rateLimiter');

// Instantiate a rate limiter: max 3 queue actions per 5 seconds
const queueLimiter = new SocketRateLimiter(5000, 3);

/**
 * Registers matchmaking socket events.
 * Handles: join_queue, leave_queue, skip, disconnect.
 *
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 * @param {import('../queue/MatchQueue')} queue
 */
const registerMatchHandlers = (io, socket, queue) => {
  /**
   * User enters the matchmaking queue.
   * After enqueue, immediately try to find a match.
   */
  socket.on('join_queue', async () => {
    const uid = socket.data.uid;
    if (!uid) {
      socket.emit('error_event', { message: 'Not authenticated' });
      return;
    }

    // Apply Rate Limiting
    if (!queueLimiter.consume(socket.id)) {
      socket.emit('error_event', { message: 'You are joining the queue too fast. Please wait a moment.' });
      return;
    }

    const added = await queue.enqueue(socket.id, uid);
    if (added) {
      socket.emit('queued');
      await attemptMatch(io, queue);
    } else {
      logger.warn('Match', 'Enqueue failed (already queued/paired)', { socketId: socket.id });
    }
  });

  /**
   * User leaves the queue voluntarily (e.g. pressed "Stop Searching").
   */
  socket.on('leave_queue', async () => {
    await queue.dequeue(socket.id, socket.data.uid);
    logger.info('Match', 'User left queue', { socketId: socket.id });
  });

  /**
   * User skips current partner.
   * Steps:
   * 1. Unpair both users
   * 2. Notify the partner they were skipped
   * 3. Re-queue the skipper
   * 4. Try to find a new match immediately
   */
  socket.on('skip', async () => {
    // Apply Rate Limiting
    if (!queueLimiter.consume(socket.id)) {
      socket.emit('error_event', { message: 'You are skipping too fast. Please wait a moment.' });
      return;
    }

    const partner = await queue.unpair(socket.id);

    if (partner) {
      // Notify partner they were left
      io.to(partner).emit('partner_left');
      logger.info('Match', 'User skipped partner', {
        skipper: socket.id,
        skipped: partner,
      });
    }

    // Re-queue the skipper immediately
    const uid = socket.data.uid;
    if (uid) {
      await queue.enqueue(socket.id, uid);
      socket.emit('queued');
      await attemptMatch(io, queue);
    }
  });

  /**
   * Socket disconnected — clean up queue and pairs.
   */
  socket.on('disconnect', async (reason) => {
    logger.info('Match', 'Socket disconnected', { socketId: socket.id, reason });

    // Clean rate limit tracking
    queueLimiter.clear(socket.id);

    const partner = await queue.removeSocket(socket.id, socket.data.uid);
    if (partner) {
      io.to(partner).emit('partner_left');
    }
  });
};

/**
 * Continuously attempt to match users from the queue.
 * Runs until no more pairs can be formed.
 */
async function attemptMatch(io, queue) {
  let match;
  while ((match = await queue.tryMatch()) !== null) {
    const { a, b } = match;

    // a is the initiator (sends the WebRTC offer)
    io.to(a.socketId).emit('matched', {
      peerId: b.socketId,
      initiator: true,
    });

    io.to(b.socketId).emit('matched', {
      peerId: a.socketId,
      initiator: false,
    });

    logger.info('Match', 'Match emitted', {
      initiator: a.socketId,
      responder: b.socketId,
    });
  }
}

module.exports = { registerMatchHandlers };
