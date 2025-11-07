const express = require('express');
const cookieParser = require('cookie-parser');

const authController = require('../Controllers/authController'); // ✅ Add this line
const protect = require('../Middleware/authMiddleware');
const { registerUser, loginUser } = require('../Controllers/authController');
const validateInput = require('../Middleware/validateInput');
const rateLimiter = require('../Middleware/rateLimiter');

const router = express.Router();

router.use(cookieParser());

router.post('/register', validateInput, registerUser);
router.post('/login', rateLimiter, loginUser);

router.post('/mfa/initiate', protect, authController.initiateEnableMFA);
router.post('/mfa/verify', protect, authController.verifyEnableMFA);

router.post('/refresh', authController.refreshToken); // refresh uses cookie
router.post('/logout', authController.logout);

module.exports = router;