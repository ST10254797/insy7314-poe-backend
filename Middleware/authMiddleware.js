const jwt = require("jsonwebtoken");
const User = require("../Models/userModel");
const Employee = require("../Models/employeeModel");

const protect = async (req, res, next) => {
  console.log("Authorization header:", req.headers.authorization);
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Decoded token:", decoded);

      let currentUser;

      if (decoded.role === "employee") {
        currentUser = await Employee.findById(decoded.id).select("-password");
        if (!currentUser) return res.status(401).json({ message: "Employee not found" });
      } else {
        currentUser = await User.findById(decoded.id).select("-password");
        if (!currentUser) return res.status(401).json({ message: "User not found" });
      }

      req.user = currentUser;
      next();
    } catch (error) {
      console.error("JWT verification error:", error.message);
      return res.status(401).json({ message: "Not authorized" });
    }
  } else {
    return res.status(401).json({ message: "No token provided" });
  }
};

module.exports = protect;
