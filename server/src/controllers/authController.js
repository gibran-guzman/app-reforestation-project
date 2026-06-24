const authService = require('../services/authService');
const asyncHandler = require('../utils/asyncHandler');
const { respond } = require('../utils/response');

const signup = asyncHandler(async (req, res) => {
  const user = await authService.signup(req.body);
  respond(res, user, { status: 201, message: 'Usuario registrado correctamente' });
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  respond(res, result, { message: 'Inicio de sesión exitoso' });
});

const getMe = asyncHandler(async (req, res) => {
  const { id, email, role, full_name, created_at } = req.user;
  respond(res, { id, email, role, full_name, created_at });
});

const refresh = asyncHandler(async (req, res) => {
  const result = await authService.refresh(req.body);
  respond(res, result, { message: 'Sesión renovada correctamente' });
});

module.exports = { signup, login, getMe, refresh };
