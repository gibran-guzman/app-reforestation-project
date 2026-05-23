const supabase = require('../config/supabase');
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
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', req.user.id)
        .single();

      if (error || !profile) {
        throw new AppError('User profile not found', 403);
      }

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
