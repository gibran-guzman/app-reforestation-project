const supabase = require('../config/supabase');
const db = require('../config/db');
const { AppError } = require('../errors/AppError');
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
    await db.query(
      'INSERT INTO profiles (id, full_name, role) VALUES ($1, $2, $3)',
      [authData.user.id, full_name, role],
    );
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

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (isInvalidCredentialsError(error)) {
      throw new AppError('Correo o contraseña incorrectos', 401);
    }
    logger.error({ err: error }, 'Error inesperado al iniciar sesión en Supabase');
    throw new AppError('Error al iniciar sesión. Intenta de nuevo.', 500);
  }

  const { rows } = await db.query(
    'SELECT role, full_name FROM profiles WHERE id = $1',
    [data.user.id],
  );
  const profile = rows[0] || {};

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

module.exports = { signup, login };
