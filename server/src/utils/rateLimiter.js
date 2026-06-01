const logger = require('./logger');

/**
 * In-memory sliding-window Rate Limiter for Socket.IO events.
 * Keeps track of requests per socket to prevent flooding abuse.
 *
 * Can easily be swapped to a Redis-based rate limiter using MULTI/INCR with TTL in production.
 */
class SocketRateLimiter {
  /**
   * @param {number} limitWindowMs - Time window in milliseconds
   * @param {number} maxRequests - Max requests allowed in the window
   */
  constructor(limitWindowMs = 10000, maxRequests = 5) {
    this.limitWindowMs = limitWindowMs;
    this.maxRequests = maxRequests;
    this.requests = new Map(); // socketId -> Array of timestamps

    // Clean up expired entries periodically
    this._cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Check if a socket has exceeded the rate limit.
   * Returns true if allowed, false if rate-limited.
   *
   * @param {string} socketId
   */
  consume(socketId) {
    const now = Date.now();
    if (!this.requests.has(socketId)) {
      this.requests.set(socketId, [now]);
      return true;
    }

    const timestamps = this.requests.get(socketId);
    // Filter timestamps inside the current window
    const activeTimestamps = timestamps.filter(t => now - t < this.limitWindowMs);
    activeTimestamps.push(now);
    this.requests.set(socketId, activeTimestamps);

    if (activeTimestamps.length > this.maxRequests) {
      logger.warn('RateLimiter', 'Rate limit exceeded for socket', {
        socketId,
        count: activeTimestamps.length,
        max: this.maxRequests,
      });
      return false;
    }

    return true;
  }

  /**
   * Clean up completely for disconnected sockets.
   * @param {string} socketId
   */
  clear(socketId) {
    this.requests.delete(socketId);
  }

  /**
   * Purge expired timestamps.
   */
  cleanup() {
    const now = Date.now();
    for (const [id, timestamps] of this.requests.entries()) {
      const active = timestamps.filter(t => now - t < this.limitWindowMs);
      if (active.length === 0) {
        this.requests.delete(id);
      } else {
        this.requests.set(id, active);
      }
    }
  }

  destroy() {
    clearInterval(this._cleanupInterval);
  }
}

module.exports = SocketRateLimiter;
