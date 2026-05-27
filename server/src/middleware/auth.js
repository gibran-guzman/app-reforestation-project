const supabase = require('../config/supabase');
const db = require('../config/db');
const { AppError } = require('../errors/AppError');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Encabezado de autorización faltante o inválido', 401);
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw new AppError('Token inválido o expirado', 401);
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
        throw new AppError('Perfil de usuario no encontrado', 403);
      }

      const profile = result.rows[0];

      if (!allowedRoles.includes(profile.role)) {
        throw new AppError('Permisos insuficientes. Se requiere rol: ' + allowedRoles.join(' o '), 403);
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
