const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/signup', authenticate, authorize('admin'), authController.signup);
router.post('/login', authController.login);
router.get('/me', authenticate, authController.getMe);

module.exports = router;
