const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
	name: { type: String, trim: true },
	email: { type: String, unique: true, lowercase: true, trim: true },
	role: { type: String, enum: ['vendor', 'customer', 'admin'], default: 'customer' }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
