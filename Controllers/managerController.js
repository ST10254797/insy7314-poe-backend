// controllers/managerController.js
const Employee = require("../Models/employeeModel");
const bcrypt = require("bcryptjs");
const validator = require("validator"); // <-- make sure this is imported

// ✅ Create new employee (secure)
exports.addEmployee = async (req, res) => {
  try {
    let { name, employeeId, email, password, role } = req.body;

    // Basic validation
    if (!name || !employeeId || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Validate email format
    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Normalize email
    email = validator.normalizeEmail(email);

    // Check if employee already exists (safe query)
    const existingEmployee = await Employee.findOne({ email: { $eq: email } });
    if (existingEmployee) {
      return res.status(400).json({ message: "Employee already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create employee
    const newEmployee = new Employee({
      name,
      employeeId,
      email,
      password: hashedPassword,
      role, // can be "employee" or "manager"
    });

    await newEmployee.save();

    res.status(201).json({
      message: "Employee added successfully",
      employee: { name, employeeId, email, role },
    });
  } catch (error) {
    console.error("Error adding employee:", error);
    res.status(500).json({ message: "Error adding employee" });
  }
};

// ✅ Get all employees
exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find().select("-password");
    res.status(200).json(employees);
  } catch (error) {
    console.error("Error fetching employees:", error);
    res.status(500).json({ message: "Error fetching employees" });
  }
};
