const express = require("express");
const {
  employeeLogin,
  getPendingTransactions,
  verifyTransaction,
  submitToSwift,
} = require("../Controllers/employeeController");
const { protect } = require("../Middleware/authMiddleware");

const router = express.Router();

router.post("/login", employeeLogin);
router.get("/transactions", protect, getPendingTransactions);
router.put("/verify/:id", protect, verifyTransaction);
router.put("/submit/:id", protect, submitToSwift);

module.exports = router;
