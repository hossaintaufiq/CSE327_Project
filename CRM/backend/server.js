require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

// Connect DB
connectDB();

// Middleware
app.use(cors({
	origin: process.env.CLIENT_ORIGIN || '*'
}));
app.use(express.json());

// Health endpoint
app.get('/', (req, res) => res.send('CRM backend running'));

// Basic error handler
app.use((err, req, res, next) => {
	console.error('Unhandled error:', err);
	res.status(500).json({ message: 'Something went wrong' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
