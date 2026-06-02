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
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    const user = await authService.getMe(token);
    res.json({ data: user });
  } catch (error) {
    next(error);
  }
};

module.exports = { signup, login, getMe };
