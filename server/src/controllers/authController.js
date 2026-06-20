const authService = require('../services/authService');
const asyncHandler = require('../utils/asyncHandler');

const signup = asyncHandler(async (req, res) => {
  const user = await authService.signup(req.body);
  res.status(201).json({ message: 'Usuario registrado correctamente', data: user });
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  res.json({ message: 'Inicio de sesión exitoso', data: result });
});

const getMe = asyncHandler(async (req, res) => {
  const { id, email, role, full_name, created_at } = req.user;
  res.json({ data: { id, email, role, full_name, created_at } });
});

module.exports = { signup, login, getMe };
