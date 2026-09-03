const pino = require('pino');

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  redact: {
    paths: [
      'password',
      'encrypted_password',
      'refresh_token',
      'access_token',
      'req.headers.cookie',
      'req.headers.authorization',
      '*.password',
      '*.refresh_token',
      '*.access_token',
    ],
    censor: '[REDACTED]',
  },
  transport: process.env.NODE_ENV !== 'production'
    ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } }
    : undefined,
});

module.exports = logger;
