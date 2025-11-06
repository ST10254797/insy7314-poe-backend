const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Employee = require("../Models/employeeModel");
const Transaction = require("../Models/Transaction");

// Employee login
exports.employeeLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const employee = await Employee.findOne({ email });
    if (!employee) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, employee.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: employee._id, role: employee.role },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.status(200).json({ token, role: employee.role });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all pending transactions
exports.getPendingTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ status: "Pending" });
    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ message: "Error fetching transactions", error: error.message });
  }
};

// Verify a transaction
exports.verifyTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await Transaction.findById(id);
    if (!transaction) return res.status(404).json({ message: "Transaction not found" });

    transaction.status = "Verified";
    await transaction.save();

    res.status(200).json({ message: "Transaction verified successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error verifying transaction", error: error.message });
  }
};

// Submit to SWIFT
exports.submitToSwift = async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await Transaction.findById(id);
    if (!transaction) return res.status(404).json({ message: "Transaction not found" });

    transaction.status = "Submitted to SWIFT";
    await transaction.save();

    res.status(200).json({ message: "Transaction submitted to SWIFT" });
  } catch (error) {
    res.status(500).json({ message: "Error submitting transaction", error: error.message });
  }
};
