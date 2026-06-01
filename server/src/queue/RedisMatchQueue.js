const logger = require('../utils/logger');

/**
 * Redis-backed Matchmaking Queue.
 *
 * For scaling to multiple servers, we:
 * 1. Store queue state in Redis (Shared state).
 * 2. Store active pairs in Redis (Shared state).
 * 3. Use Socket.IO Redis Adapter to route matches across server instances.
 */
class RedisMatchQueue {
  /**
   * @param {import('ioredis').Redis} redis
   * @param {string} serverId - Unique identifier for this server instance
   */
  constructor(redis, serverId) {
    this.redis = redis;
    this.serverId = serverId;

    // Keys
    this.QUEUE_KEY = 'chat:queue'; // Sorted Set: value=socketId:serverId:uid, score=timestamp
    this.PAIRS_KEY = 'chat:pairs'; // Hash: socketId -> partnerSocketId
    this.UID_MAP_KEY = 'chat:uid_map'; // Hash: uid -> socketId:serverId
  }

  /**
   * Add user to queue.
   */
  async enqueue(socketId, uid) {
    try {
      const isMatched = await this.redis.hexists(this.PAIRS_KEY, socketId);
      if (isMatched) return false;

      // Dedup UID: check if already in queue
      const existing = await this.redis.hget(this.UID_MAP_KEY, uid);
      if (existing) {
        const [oldSocketId] = existing.split(':');
        await this.dequeue(oldSocketId, uid);
      }

      const queueValue = `${socketId}:${this.serverId}:${uid}`;
      const now = Date.now();

      await this.redis.multi()
        .zadd(this.QUEUE_KEY, now, queueValue)
        .hset(this.UID_MAP_KEY, uid, `${socketId}:${this.serverId}`)
        .exec();

      logger.info('RedisQueue', 'User enqueued in Redis', { socketId, uid });
      return true;
    } catch (err) {
      logger.error('RedisQueue', 'Failed to enqueue', { error: err.message });
      return false;
    }
  }

  /**
   * Remove user from queue.
   */
  async dequeue(socketId, uid) {
    try {
      // Find the queue value for this socketId
      const members = await this.redis.zrange(this.QUEUE_KEY, 0, -1);
      const targetMember = members.find(m => m.startsWith(`${socketId}:`));

      const pipeline = this.redis.multi();
      if (targetMember) {
        pipeline.zrem(this.QUEUE_KEY, targetMember);
      }
      if (uid) {
        pipeline.hdel(this.UID_MAP_KEY, uid);
      }
      await pipeline.exec();
    } catch (err) {
      logger.error('RedisQueue', 'Failed to dequeue', { error: err.message });
    }
  }

  /**
   * Attempt to match two users.
   * Uses a Redis Transaction to guarantee atomicity and prevent race conditions (double matches).
   */
  async tryMatch() {
    try {
      // Get the two oldest waiting users
      const members = await this.redis.zrange(this.QUEUE_KEY, 0, 1);
      if (members.length < 2) return null;

      const [aMember, bMember] = members;
      const [aSocketId, aServerId, aUid] = aMember.split(':');
      const [bSocketId, bServerId, bUid] = bMember.split(':');

      if (aUid === bUid) {
        // Defensive: prevent self-match
        await this.redis.zrem(this.QUEUE_KEY, bMember);
        return null;
      }

      // Atomically remove from queue and set pairing
      const results = await this.redis.multi()
        .zrem(this.QUEUE_KEY, aMember)
        .zrem(this.QUEUE_KEY, bMember)
        .hdel(this.UID_MAP_KEY, aUid)
        .hdel(this.UID_MAP_KEY, bUid)
        .hset(this.PAIRS_KEY, aSocketId, bSocketId)
        .hset(this.PAIRS_KEY, bSocketId, aSocketId)
        .exec();

      // Verify that both items were successfully removed (concurrency safety)
      const aRemoved = results[0][1];
      const bRemoved = results[1][1];

      if (aRemoved === 0 || bRemoved === 0) {
        // Concurrency conflict: someone else popped them first. rollback pairings
        await this.redis.multi()
          .hdel(this.PAIRS_KEY, aSocketId)
          .hdel(this.PAIRS_KEY, bSocketId)
          .exec();
        return null;
      }

      logger.info('RedisQueue', 'Users matched in Redis', { a: aSocketId, b: bSocketId });

      return {
        a: { socketId: aSocketId, serverId: aServerId, uid: aUid },
        b: { socketId: bSocketId, serverId: bServerId, uid: bUid },
      };
    } catch (err) {
      logger.error('RedisQueue', 'tryMatch failed', { error: err.message });
      return null;
    }
  }

  /**
   * Get partner socket ID.
   */
  async getPartner(socketId) {
    try {
      return await this.redis.hget(this.PAIRS_KEY, socketId);
    } catch (err) {
      logger.error('RedisQueue', 'getPartner failed', { error: err.message });
      return null;
    }
  }

  /**
   * Unpair a socket. Returns partner socket ID.
   */
  async unpair(socketId) {
    try {
      const partner = await this.redis.hget(this.PAIRS_KEY, socketId);
      if (partner) {
        await this.redis.multi()
          .hdel(this.PAIRS_KEY, socketId)
          .hdel(this.PAIRS_KEY, partner)
          .exec();
      }
      return partner;
    } catch (err) {
      logger.error('RedisQueue', 'unpair failed', { error: err.message });
      return null;
    }
  }

  /**
   * Clean up socket.
   */
  async removeSocket(socketId, uid) {
    await this.dequeue(socketId, uid);
    return await this.unpair(socketId);
  }
}

module.exports = RedisMatchQueue;
