const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./Routes/authRoute');
const paymentRoutes = require('./Routes/paymentRoutes'); 
const employeeRoutes = require('./Routes/employeeRoutes');

const app = express();

app.use(helmet());

// ---- Secure CORS ----
const allowedOrigins = [
  'https://localhost:3000',       // dev frontend
  'https://localhost:5173', 
  'https://your-production.com'  // production frontend
];

app.use(cors({
  origin: function(origin, callback){
    if(!origin) return callback(null, true); // allow non-browser requests like Postman
    if(allowedOrigins.indexOf(origin) === -1){
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
}));

app.use(express.json());

// ---- Rate Limiter ----
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests, try again later."
});
app.use(limiter);

// ---- Routes ----
app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/employee', employeeRoutes);

app.get('/', (req, res) => res.send('PulseVote API running!'));

module.exports = app;
