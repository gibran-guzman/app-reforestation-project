const { supabase } = require('../config/supabase');
const authRepository = require('../repositories/authRepository');
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

    const profile = await authRepository.findProfileById(user.id);
    if (!profile) {
      throw new AppError('Perfil de usuario no encontrado. Contacta al administrador.', 403);
    }

    req.user = { ...user, role: profile.role, full_name: profile.full_name, created_at: profile.created_at };
    next();
  } catch (error) {
    next(error);
  }
};

const authorize = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user.role) {
        throw new AppError('Perfil de usuario sin rol asignado. Contacta al administrador.', 403);
      }

      if (!allowedRoles.includes(req.user.role)) {
        throw new AppError('No tienes permisos para esta acción', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = { authenticate, authorize };
