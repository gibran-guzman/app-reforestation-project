const express = require('express');
const router = express.Router({ mergeParams: true });
const photoController = require('../controllers/photoController');
const upload = require('../middleware/upload');
const { authenticate, authorize } = require('../middleware/auth');

router.post(
  '/',
  authenticate,
  authorize('admin', 'technician'),
  upload.single('photo'),
  photoController.upload,
);

module.exports = router;
