// Middleware/employeeAuth.js
const jwt = require('jsonwebtoken');
const Employee = require('../Models/employeeModel');

module.exports = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ message: 'No token provided' });
    const token = auth.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || decoded.role !== 'employee') return res.status(403).json({ message: 'Forbidden' });

    const employee = await Employee.findById(decoded.id).select('-password');
    if (!employee) return res.status(401).json({ message: 'Employee not found' });

    req.employee = employee;
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: 'Not authorized' });
  }
};
