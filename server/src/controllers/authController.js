const authService = require('../services/authService');
const asyncHandler = require('../utils/asyncHandler');
const { respond } = require('../utils/response');
const { setSessionCookies, clearSessionCookies } = require('../config/cookie');

const signup = asyncHandler(async (req, res) => {
  const user = await authService.signup(req.body);
  respond(res, user, { status: 201, message: 'Usuario registrado correctamente' });
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  setSessionCookies(res, result.session);
  respond(res, result, { message: 'Inicio de sesión exitoso' });
});

const getMe = asyncHandler(async (req, res) => {
  const { id, email, role, full_name, created_at } = req.user;
  respond(res, { id, email, role, full_name, created_at, access_token: req.accessToken });
});

const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.body.refresh_token || req.cookies?.refresh_token;
  const result = await authService.refresh({ refresh_token: refreshToken });
  setSessionCookies(res, result.session);
  respond(res, result, { message: 'Sesión renovada correctamente' });
});

const logout = asyncHandler(async (req, res) => {
  clearSessionCookies(res);
  respond(res, null, { message: 'Sesión cerrada correctamente' });
});

module.exports = { signup, login, getMe, refresh, logout };
