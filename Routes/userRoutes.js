// Routes/userRoutes.js
const express = require("express");
const { getUserTransactions } = require("../Controllers/userController"); // Make sure folder name matches
const { protect } = require("../Middleware/authMiddleware");

const router = express.Router();

// ✅ Get all transactions for logged-in user
router.get("/transactions", protect, getUserTransactions);

module.exports = router;
