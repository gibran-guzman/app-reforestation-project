const supabase = require('../config/supabase');
const db = require('../config/db');
const { AppError } = require('../errors/AppError');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Missing or invalid authorization header', 401);
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw new AppError('Invalid or expired token', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

const authorize = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      const result = await db.query(
        'SELECT role, full_name FROM profiles WHERE id = $1',
        [req.user.id]
      );

      if (result.rows.length === 0) {
        throw new AppError('User profile not found', 403);
      }

      const profile = result.rows[0];

      if (!allowedRoles.includes(profile.role)) {
        throw new AppError('Insufficient permissions. Required role: ' + allowedRoles.join(' or '), 403);
      }

      req.user.role = profile.role;
      req.user.full_name = profile.full_name;
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = { authenticate, authorize };
