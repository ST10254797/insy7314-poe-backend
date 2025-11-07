// routes/managerRoutes.js
const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../Middleware/authMiddleware");
const { addEmployee, getAllEmployees } = require("../Controllers/managerController");

// Only managers can use these routes
router.post("/add-employee", protect, authorize("manager"), addEmployee);
router.get("/all-employees", protect, authorize("manager"), getAllEmployees);

module.exports = router;
