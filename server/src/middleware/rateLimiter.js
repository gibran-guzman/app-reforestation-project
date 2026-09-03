const rateLimit = require('express-rate-limit');
const { PostgresRateLimitStore } = require('./rateLimitStore');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Intenta de nuevo en 15 minutos.' },
  store: new PostgresRateLimitStore({ windowMs: 15 * 60 * 1000 }),
});

const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de registro. Intenta de nuevo en 1 hora.' },
  store: new PostgresRateLimitStore({ windowMs: 60 * 60 * 1000 }),
});

const photoLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas subidas de fotos. Intenta de nuevo en 15 minutos.' },
  store: new PostgresRateLimitStore({ windowMs: 15 * 60 * 1000 }),
});

const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  skip: (req) => req.method === 'GET' || req.method === 'HEAD',
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes de escritura. Intenta de nuevo en 15 minutos.' },
  store: new PostgresRateLimitStore({ windowMs: 15 * 60 * 1000 }),
});

module.exports = { authLimiter, signupLimiter, photoLimiter, writeLimiter };
