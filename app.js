const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./Routes/authRoute');
const paymentRoutes = require('./Routes/paymentRoutes'); 

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests, try again later."
});
app.use(limiter);

app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentRoutes);

app.get('/', (req, res) => res.send('PulseVote API running!'));

module.exports = app;