const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log('📨 Request:', req.method, req.path)
  next()
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'FixMyCity backend running ✅' });
});

// Routes
app.use('/api/issues', require('./routes/issues'));
app.use('/api/report', require('./routes/report'));
app.use('/api/whatsapp', require('./routes/whatsapp'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/neglect', require('./routes/neglect'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});

module.exports = app;