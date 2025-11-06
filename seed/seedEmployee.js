// seed/seedEmployees.js
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Employee = require("../Models/employeeModel");

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

const seedEmployee = async () => {
  try {
    // Remove existing employees
    await Employee.deleteMany();

    // Predefined employees
    const employee = [
      {
        name: "John Doe",
        employeeId: "EMP001",
        email: "john@bank.com",
        password: "Password123", // Will be hashed automatically by pre-save hook
        role: "employee",
      },
      {
        name: "Jane Smith",
        employeeId: "EMP002",
        email: "jane@bank.com",
        password: "Secure456",
        role: "manager",
      },
      {
        name: "Michael Brown",
        employeeId: "EMP003",
        email: "michael@bank.com",
        password: "Bank789",
        role: "employee",
      },
    ];

    // Save each employee
    for (let emp of employee) {
      const newEmp = new Employee(emp);
      await newEmp.save();
    }

    console.log("✅ Employee data seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding employees:", error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the seeder
seedEmployee();
