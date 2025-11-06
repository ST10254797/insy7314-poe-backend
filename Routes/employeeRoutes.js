const express = require("express");
const {
  employeeLogin,
  getPendingTransactions,
  verifyTransaction,
  submitToSwift,
} = require("../Controllers/employeeController");
const authMiddleware = require("../Middleware/authMiddleware");

const router = express.Router();

router.post("/login", employeeLogin);
router.get("/transactions", authMiddleware, getPendingTransactions);
router.put("/verify/:id", authMiddleware, verifyTransaction);
router.put("/submit/:id", authMiddleware, submitToSwift);

module.exports = router;
