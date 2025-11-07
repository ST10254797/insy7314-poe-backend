const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '1h'
  });
};

const createRefreshToken = () => {
  // use uuid for refresh token (random); can also sign with jwt but store raw token in DB
  return uuidv4();
};

module.exports = {generateToken,createRefreshToken};
