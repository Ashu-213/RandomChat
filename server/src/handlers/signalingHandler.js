const logger = require('../utils/logger');

/**
 * Registers WebRTC signaling socket events.
 * The server is a RELAY ONLY — it never inspects or modifies SDP/ICE data.
 *
 * Events: offer, answer, ice_candidate
 *
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 * @param {import('../queue/MatchQueue')} queue
 */
const registerSignalingHandlers = (io, socket, queue) => {
  /**
   * Relay WebRTC offer from initiator to responder.
   */
  socket.on('offer', async ({ to, sdp }) => {
    if (!to || !sdp) {
      logger.warn('Signaling', 'Invalid offer payload', { from: socket.id });
      return;
    }

    // Verify they are actually paired
    const partner = await queue.getPartner(socket.id);
    if (partner !== to) {
      logger.warn('Signaling', 'Offer to non-partner rejected', {
        from: socket.id,
        to,
        actualPartner: partner,
      });
      return;
    }

    io.to(to).emit('offer', { from: socket.id, sdp });
    logger.debug('Signaling', 'Offer relayed', { from: socket.id, to });
  });

  /**
   * Relay WebRTC answer from responder to initiator.
   */
  socket.on('answer', async ({ to, sdp }) => {
    if (!to || !sdp) {
      logger.warn('Signaling', 'Invalid answer payload', { from: socket.id });
      return;
    }

    const partner = await queue.getPartner(socket.id);
    if (partner !== to) {
      logger.warn('Signaling', 'Answer to non-partner rejected', {
        from: socket.id,
        to,
        actualPartner: partner,
      });
      return;
    }

    io.to(to).emit('answer', { from: socket.id, sdp });
    logger.debug('Signaling', 'Answer relayed', { from: socket.id, to });
  });

  /**
   * Relay ICE candidate between peers.
   */
  socket.on('ice_candidate', async ({ to, candidate }) => {
    if (!to || !candidate) return;

    const partner = await queue.getPartner(socket.id);
    if (partner !== to) return;

    io.to(to).emit('ice_candidate', { from: socket.id, candidate });
    logger.debug('Signaling', 'ICE candidate relayed', { from: socket.id, to });
  });
};

module.exports = { registerSignalingHandlers };
