// routes/userRoutes.js
const express = require("express");
const { getUserTransactions } = require("../Controllers/userController");
const protect = require("../Middleware/authMiddleware"); // your middleware

const router = express.Router();

router.get("/transactions", protect, getUserTransactions);

module.exports = router;
