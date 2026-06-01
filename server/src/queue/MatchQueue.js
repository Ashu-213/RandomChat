const logger = require('../utils/logger');

/**
 * In-memory matchmaking queue.
 * Interface is designed to be a drop-in swap for a Redis-backed queue later.
 *
 * Key invariants:
 * - A socket can only be in the queue OR paired, never both.
 * - A user (uid) can only appear once in the queue (prevents duplicate joins on reconnect).
 * - Stale entries are pruned periodically.
 */
class MatchQueue {
  constructor() {
    /** @type {Map<string, { uid: string, joinedAt: number }>} socketId → metadata */
    this.queue = new Map();

    /** @type {Map<string, string>} socketId → partnerSocketId (bidirectional) */
    this.pairs = new Map();

    /** @type {Map<string, string>} uid → socketId (reverse lookup for dedup) */
    this.uidMap = new Map();

    // Prune stale queue entries every 30 seconds
    this._pruneInterval = setInterval(() => this.pruneStale(), 30_000);
  }

  /**
   * Add a user to the matchmaking queue.
   * Returns false if already queued or paired.
   */
  enqueue(socketId, uid) {
    // Already in queue or matched — reject
    if (this.queue.has(socketId) || this.pairs.has(socketId)) {
      logger.warn('MatchQueue', 'Duplicate enqueue rejected', { socketId, uid });
      return false;
    }

    // Same uid already waiting (e.g. reconnect) — remove old entry
    const existingSocket = this.uidMap.get(uid);
    if (existingSocket && this.queue.has(existingSocket)) {
      logger.info('MatchQueue', 'Removing stale socket for same uid', { uid, oldSocket: existingSocket });
      this.queue.delete(existingSocket);
    }

    this.queue.set(socketId, { uid, joinedAt: Date.now() });
    this.uidMap.set(uid, socketId);
    logger.info('MatchQueue', 'User enqueued', { socketId, uid, queueSize: this.queue.size });
    return true;
  }

  /**
   * Remove a user from the queue.
   */
  dequeue(socketId) {
    const entry = this.queue.get(socketId);
    if (entry) {
      this.uidMap.delete(entry.uid);
    }
    this.queue.delete(socketId);
  }

  /**
   * Try to match two users from the queue.
   * Returns { a, b } if a match is found, null otherwise.
   * The first user (a) is the initiator (sends the WebRTC offer).
   */
  tryMatch() {
    if (this.queue.size < 2) return null;

    const entries = [...this.queue.entries()];
    const [aEntry, bEntry] = entries;

    const [aSocketId, aData] = aEntry;
    const [bSocketId, bData] = bEntry;

    // Prevent self-match (shouldn't happen, but defensive)
    if (aData.uid === bData.uid) {
      logger.warn('MatchQueue', 'Self-match prevented', { uid: aData.uid });
      this.queue.delete(bSocketId);
      return null;
    }

    // Remove both from queue
    this.queue.delete(aSocketId);
    this.queue.delete(bSocketId);
    this.uidMap.delete(aData.uid);
    this.uidMap.delete(bData.uid);

    // Create bidirectional pair
    this.pairs.set(aSocketId, bSocketId);
    this.pairs.set(bSocketId, aSocketId);

    logger.info('MatchQueue', 'Users matched', {
      a: aSocketId,
      b: bSocketId,
      queueSize: this.queue.size,
    });

    return {
      a: { socketId: aSocketId, ...aData },
      b: { socketId: bSocketId, ...bData },
    };
  }

  /**
   * Get the partner socket ID for a given socket.
   */
  getPartner(socketId) {
    return this.pairs.get(socketId) || null;
  }

  /**
   * Unpair a socket from its partner. Returns the partner's socketId.
   */
  unpair(socketId) {
    const partner = this.pairs.get(socketId);
    this.pairs.delete(socketId);
    if (partner) {
      this.pairs.delete(partner);
    }
    return partner || null;
  }

  /**
   * Full cleanup when a socket disconnects.
   */
  removeSocket(socketId) {
    this.dequeue(socketId);
    return this.unpair(socketId);
  }

  /**
   * Prune queue entries older than maxAgeMs (default: 2 minutes).
   * Protects against zombie sockets that didn't fire disconnect.
   */
  pruneStale(maxAgeMs = 120_000) {
    const now = Date.now();
    let pruned = 0;
    for (const [socketId, data] of this.queue) {
      if (now - data.joinedAt > maxAgeMs) {
        this.queue.delete(socketId);
        this.uidMap.delete(data.uid);
        pruned++;
      }
    }
    if (pruned > 0) {
      logger.info('MatchQueue', 'Pruned stale entries', { pruned, remaining: this.queue.size });
    }
  }

  /** Current queue size. */
  get size() {
    return this.queue.size;
  }

  /** Number of active pairs. */
  get pairCount() {
    return this.pairs.size / 2;
  }

  /** Cleanup interval on shutdown. */
  destroy() {
    clearInterval(this._pruneInterval);
  }
}

module.exports = MatchQueue;
