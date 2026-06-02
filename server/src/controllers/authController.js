const authService = require('../services/authService');

const signup = async (req, res, next) => {
  try {
    const user = await authService.signup(req.body);
    res.status(201).json({ message: 'Usuario registrado correctamente', data: user });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    res.json({ message: 'Inicio de sesión exitoso', data: result });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const { id, email, role, full_name, created_at } = req.user;
    res.json({ data: { id, email, role, full_name, created_at } });
  } catch (error) {
    next(error);
  }
};

module.exports = { signup, login, getMe };
