const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const logger = require('../utils/logger');
const { AppError, ValidationError } = require('../errors/AppError');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/signup', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { email, password, full_name, role } = req.body;

    if (!email || !password || !full_name) {
      throw new ValidationError([
        { field: 'email', message: !email ? 'El correo electrónico es requerido' : null },
        { field: 'password', message: !password ? 'La contraseña es requerida' : null },
        { field: 'full_name', message: !full_name ? 'El nombre completo es requerido' : null },
      ].filter(e => e.message));
    }

    if (password.length < 8) {
      throw new ValidationError([
        { field: 'password', message: 'La contraseña debe tener al menos 8 caracteres' },
      ]);
    }

    const allowedRoles = ['admin', 'technician'];
    const userRole = allowedRoles.includes(role) ? role : 'technician';

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

    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        full_name,
        role: userRole,
      });

    if (profileError) {
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw profileError;
    }

    logger.info({ user_id: authData.user.id, role: userRole }, 'User registered');

    res.status(201).json({
      message: 'Usuario registrado correctamente',
      data: { id: authData.user.id, email, full_name, role: userRole },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ValidationError([
        { field: 'email', message: !email ? 'El correo electrónico es requerido' : null },
        { field: 'password', message: !password ? 'La contraseña es requerida' : null },
      ].filter(e => e.message));
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        throw new AppError('Correo o contraseña incorrectos', 401);
      }
      throw error;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', data.user.id)
      .single();

    logger.info({ user_id: data.user.id }, 'User logged in');

    res.json({
      message: 'Inicio de sesión exitoso',
      data: {
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at,
        },
        user: {
          id: data.user.id,
          email: data.user.email,
          full_name: profile?.full_name,
          role: profile?.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/me', async (req, res, next) => {
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

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name, created_at')
      .eq('id', user.id)
      .single();

    res.json({
      data: {
        id: user.id,
        email: user.email,
        full_name: profile?.full_name,
        role: profile?.role,
        created_at: profile?.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
