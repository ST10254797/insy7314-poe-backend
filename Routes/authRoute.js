const express = require('express');
const cookieParser = require('cookie-parser');

const {
  registerUser,
  loginUser,
  initiateEnableMFA,
  verifyEnableMFA,
  refreshToken,
  logout
} = require('../Controllers/authController');

const { protect, authorize } = require('../Middleware/authMiddleware');
const validateInput = require('../Middleware/validateInput');
const rateLimiter = require('../Middleware/rateLimiter');

const router = express.Router();

router.use(cookieParser());

console.log('initiateEnableMFA type:', typeof initiateEnableMFA);
console.log('protect type:', typeof protect);

router.post('/register', validateInput, registerUser);
router.post('/login', rateLimiter, loginUser);

router.post('/enable-mfa/initiate', protect, initiateEnableMFA);
router.post('/enable-mfa/verify', protect, verifyEnableMFA);
router.post('/refresh', refreshToken);
router.post('/logout', logout);

module.exports = router;