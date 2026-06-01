/**
 * Lightweight structured logger.
 * Wraps console with log levels and timestamps.
 * Can be swapped for Winston/Pino in production.
 */
const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const CURRENT_LEVEL = LOG_LEVELS[process.env.LOG_LEVEL || 'info'];

const timestamp = () => new Date().toISOString();

const log = (level, tag, message, data = null) => {
  if (LOG_LEVELS[level] < CURRENT_LEVEL) return;
  const entry = { time: timestamp(), level, tag, message };
  if (data) entry.data = data;
  console[level === 'debug' ? 'log' : level](JSON.stringify(entry));
};

module.exports = {
  debug: (tag, msg, data) => log('debug', tag, msg, data),
  info: (tag, msg, data) => log('info', tag, msg, data),
  warn: (tag, msg, data) => log('warn', tag, msg, data),
  error: (tag, msg, data) => log('error', tag, msg, data),
};
