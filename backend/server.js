// backend/server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('🏋️ Gym Management API is running...');
});

// ==========================================
// THESE ROUTES MUST BE HERE
// ==========================================
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/members', require('./routes/memberRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
// ==========================================

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});