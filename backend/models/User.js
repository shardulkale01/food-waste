const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true // Firebase UID
    },
    name: String,
    email: String,
    phone: String,
    role: {
        type: String,
        enum: ['restaurant', 'user'],
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
