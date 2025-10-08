const express = require('express');

const { registerUser, loginUser } = require('../Controllers/authController');
const validateInput = require('../Middleware/validateInput');
const rateLimiter = require('../Middleware/rateLimiter');

const router = express.Router();

router.post('/register', validateInput, registerUser);
router.post('/login', rateLimiter, loginUser);

module.exports = router;