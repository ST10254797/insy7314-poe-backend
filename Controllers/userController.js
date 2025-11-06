// controllers/userController.js
const Transaction = require("../Models/Transaction");

// Get all transactions for the logged-in user
exports.getUserTransactions = async (req, res) => {
  try {
    const userId = req.user.id; // Comes from your auth middleware
    const transactions = await Transaction.find({ sender: userId })
      .populate("sender", "fullName userName")
      .lean();

    res.status(200).json(transactions);
  } catch (error) {
    console.error("Error fetching user transactions:", error.message);
    res.status(500).json({ message: "Error fetching transactions", error: error.message });
  }
};
