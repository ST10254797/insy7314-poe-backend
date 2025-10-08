const express = require("express");
const Transaction = require("../Models/Transaction");
const protect = require("../Middleware/authMiddleware");

const router = express.Router();

// Validation function (you can reuse yours)
function validatePaymentInput(data) {
  const accountRegex = /^[0-9]{10,18}$/;
  const swiftRegex = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
  const currencyRegex = /^[A-Z]{3}$/;
  const amountRegex = /^[0-9]+(\.[0-9]{1,2})?$/;

  return (
    accountRegex.test(data.recipientAccount) &&
    swiftRegex.test(data.swiftCode) &&
    currencyRegex.test(data.currency) &&
    amountRegex.test(data.amount)
  );
}

// POST /api/payments
router.post("/", protect, async (req, res) => {
  const { amount, currency, provider, recipientAccount, swiftCode } = req.body;

  if (!validatePaymentInput({ amount, currency, provider, recipientAccount, swiftCode })) {
    return res.status(400).json({ message: "Invalid input detected" });
  }

  try {
    const transaction = new Transaction({
      sender: req.user._id, // link transaction to logged-in user
      amount,
      currency,
      provider,
      recipientAccount,
      swiftCode,
    });

    await transaction.save();
    res.status(201).json({ message: "Transaction recorded", transaction });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
