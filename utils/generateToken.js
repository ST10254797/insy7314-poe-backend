const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const generateToken = ({ id, role }) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '1h'
  });
};

const createRefreshToken = () => {
  return uuidv4();
};

module.exports = { generateToken, createRefreshToken };
