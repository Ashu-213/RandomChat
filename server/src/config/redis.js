const Redis = require('ioredis');
const logger = require('../utils/logger');

let redisClient = null;

const initRedis = () => {
  if (!process.env.REDIS_URL) {
    logger.warn('Redis', 'REDIS_URL not configured. Redis will not be used.');
    return null;
  }

  try {
    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      reconnectOnError: (err) => {
        logger.error('Redis', 'Reconnecting due to error', { error: err.message });
        return true;
      },
    });

    redisClient.on('connect', () => {
      logger.info('Redis', 'Connecting to Redis server...');
    });

    redisClient.on('ready', () => {
      logger.info('Redis', 'Redis connection ready');
    });

    redisClient.on('error', (err) => {
      logger.error('Redis', 'Redis client error', { error: err.message });
    });

    return redisClient;
  } catch (err) {
    logger.error('Redis', 'Failed to initialize Redis client', { error: err.message });
    return null;
  }
};

const getRedisClient = () => redisClient;

module.exports = { initRedis, getRedisClient };
