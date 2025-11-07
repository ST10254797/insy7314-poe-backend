const jwt = require("jsonwebtoken");
const User = require("../Models/userModel");
const Employee = require("../Models/employeeModel");

/**
 * Middleware: Verify JWT and attach user to request.
 */
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      let currentUser;

      if (decoded.role === "employee" || decoded.role === "manager") {
        currentUser = await Employee.findById(decoded.id).select("-password");
        if (!currentUser)
          return res.status(401).json({ message: "Employee not found" });
      } else {
        // user has no role
        currentUser = await User.findById(decoded.id).select("-password");
        if (!currentUser)
          return res.status(401).json({ message: "User not found" });

        // Assign a pseudo-role for frontend if needed
        currentUser.role = "user"; 
      }

      req.user = currentUser;
      next();
    } catch (error) {
      console.error("JWT verification error:", error.message);
      return res.status(401).json({ message: "Not authorized, token invalid" });
    }
  } else {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};


/**
 * Middleware: Restrict access to specific roles.
 * Usage example:
 *   router.post("/add-employee", protect, authorize("manager"), addEmployee);
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Access denied: insufficient permissions" });
    }
    next();
  };
};

module.exports = { protect, authorize };
