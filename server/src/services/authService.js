const supabase = require('../config/supabase');
const db = require('../config/db');
const { AppError } = require('../errors/AppError');
const { validateSignup, validateLogin } = require('../validators/authValidator');
const logger = require('../utils/logger');

const signup = async (body) => {
  const { email, password, full_name, role } = validateSignup(body);

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    if (authError.message.includes('already registered')) {
      throw new AppError('Ya existe un usuario con este correo electrónico', 409);
    }
    throw authError;
  }

  try {
    await db.query(
      'INSERT INTO profiles (id, full_name, role) VALUES ($1, $2, $3)',
      [authData.user.id, full_name, role],
    );
  } catch (profileError) {
    await supabase.auth.admin.deleteUser(authData.user.id);
    throw profileError;
  }

  logger.info({ user_id: authData.user.id, role }, 'User registered');

  return { id: authData.user.id, email, full_name, role };
};

const login = async (body) => {
  const { email, password } = validateLogin(body);

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      throw new AppError('Correo o contraseña incorrectos', 401);
    }
    throw error;
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
