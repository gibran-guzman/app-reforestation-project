const { supabase, supabaseAnon } = require('../config/supabase');
const authRepository = require('../repositories/authRepository');
const { AppError, NotFoundError } = require('../errors/AppError');
const logger = require('../utils/logger');

const isDuplicateEmailError = (error) => {
  return (
    error?.message?.toLowerCase().includes('already registered') ||
    error?.message?.toLowerCase().includes('duplicate') ||
    error?.code === '23505' ||
    error?.code === 'user_already_exists'
  );
};

const isInvalidCredentialsError = (error) => {
  return (
    error?.message?.toLowerCase().includes('invalid login credentials') ||
    error?.message?.toLowerCase().includes('invalid credentials') ||
    error?.code === 'invalid_credentials'
  );
};

const signup = async (body) => {
  const { email, password, full_name, role } = body;

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    if (isDuplicateEmailError(authError)) {
      throw new AppError('Ya existe un usuario con este correo electrónico', 409);
    }
    logger.error({ err: authError }, 'Error inesperado al crear usuario en Supabase');
    throw new AppError('Error al registrar el usuario. Intenta de nuevo.', 500);
  }

  try {
    await authRepository.createProfile(authData.user.id, full_name, role);
  } catch (profileError) {
    try {
      await supabase.auth.admin.deleteUser(authData.user.id);
    } catch (cleanupError) {
      logger.fatal({ err: cleanupError, userId: authData.user.id }, 'USUARIO HUÉRFANO CREADO EN SUPABASE — se requiere limpieza manual');
    }
    throw profileError;
  }

  logger.info({ user_id: authData.user.id, role }, 'User registered');

  return { id: authData.user.id, email, full_name, role };
};

const login = async (body) => {
  const { email, password } = body;

  const { data, error } = await supabaseAnon.auth.signInWithPassword({ email, password });

  if (error) {
    if (isInvalidCredentialsError(error)) {
      throw new AppError('Correo o contraseña incorrectos', 401);
    }
    logger.error({ err: error }, 'Error inesperado al iniciar sesión en Supabase');
    throw new AppError('Error al iniciar sesión. Intenta de nuevo.', 500);
  }

  const profile = await authRepository.findProfileById(data.user.id);
  if (!profile) {
    throw new NotFoundError('Perfil de usuario no encontrado. Contacta al administrador.');
  }

  logger.info({ user_id: data.user.id }, 'User logged in');

  return {
    session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
    },
    user: {
      id: data.user.id,
      email: data.user.email,
      full_name: profile.full_name,
      role: profile.role,
    },
  };
};

const refresh = async (body) => {
  const { refresh_token } = body;
  if (!refresh_token) {
    throw new AppError('refresh_token es requerido', 400);
  }

  const { data, error } = await supabaseAnon.auth.refreshSession({ refresh_token });

  if (error) {
    logger.warn({ err: error }, 'Error al refrescar sesión');
    throw new AppError('Sesión expirada. Inicia sesión nuevamente.', 401);
  }

  const profile = await authRepository.findProfileById(data.user.id);
  if (!profile) {
    throw new NotFoundError('Perfil de usuario no encontrado');
  }

  logger.info({ user_id: data.user.id }, 'Token refreshed');

  return {
    session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
    },
    user: {
      id: data.user.id,
      email: data.user.email,
      full_name: profile.full_name,
      role: profile.role,
    },
  };
};

const logout = async (refreshToken) => {
  if (refreshToken) {
    try {
      const { error } = await supabase.auth.admin.signOut(refreshToken);
      if (error) {
        logger.warn({ err: error }, 'Error al revocar la sesión en Supabase durante logout');
      }
    } catch (err) {
      logger.warn({ err }, 'Error inesperado al revocar la sesión en Supabase durante logout');
    }
  }
  logger.info({ has_refresh_token: Boolean(refreshToken) }, 'User logged out');
};

module.exports = { signup, login, refresh, logout };
