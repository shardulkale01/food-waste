const mongoose = require('mongoose');

const foodListingSchema = new mongoose.Schema({
    restaurantId: {
        type: String,
        required: true
    },
    restaurantName: {
        type: String,
        required: true
    },
    foodName: {
        type: String,
        required: true
    },
    quantity: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    description: String,
    latitude: {
        type: Number,
        required: true
    },
    longitude: {
        type: Number,
        required: true
    },
    pickupTime: {
        type: String,
        required: true
    },
    contactNumber: {
        type: String,
        required: true
    },
    isClaimed: {
        type: Boolean,
        default: false
    },
    claimedBy: {
        type: String, // Firebase UID of the user who claimed it
        default: null
    },
    expiryDate: {
        type: Date,
        default: () => new Date(+new Date() + 24 * 60 * 60 * 1000) // Default 24h from creation
    }
}, { timestamps: true });

module.exports = mongoose.model('FoodListing', foodListingSchema);
