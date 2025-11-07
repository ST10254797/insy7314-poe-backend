const express = require("express");
const Transaction = require("../Models/Transaction");
const { protect } = require("../Middleware/authMiddleware"); // destructure correctly


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
  console.log("Incoming payment request body:", req.body);

  const { amount, currency, provider, recipientAccount, swiftCode } = req.body;

  // Validate input
  const isValid = validatePaymentInput({ amount, currency, provider, recipientAccount, swiftCode });
  console.log("Validation result:", isValid);

  if (!isValid) {
    console.log("Invalid payment input detected:", { amount, currency, provider, recipientAccount, swiftCode });
    return res.status(400).json({ message: "Invalid input detected" });
  }

  try {
    // Ensure req.user exists
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Unauthorized: User not found" });
    }

    // Create transaction
    const transaction = new Transaction({
      sender: req.user._id,          // <-- must be the ObjectId of the user
      amount: Number(amount),        // <-- convert string to number
      currency,
      provider,
      recipientAccount,
      swiftCode,
    });

    await transaction.save();
    console.log("Transaction saved:", transaction._id);
    res.status(201).json({ message: "Transaction recorded", transaction });
  } catch (err) {
    console.error("Server error while saving transaction:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});



module.exports = router;
