const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { validateSignup, validateLogin } = require('../validators/authValidator');

router.get('/public-key', authController.getPublicKey);
router.post('/signup', authenticate, authorize('admin'), validate(validateSignup), authController.signup);
router.post('/login', validate(validateLogin), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.getMe);

module.exports = router;
