const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI;

// Bug 1 Fix: Only attempt connection if MONGO_URI is a valid non-empty string.
// Previously, mongoose.connect(undefined) would crash the process immediately.
if (MONGO_URI && !MONGO_URI.includes('localhost')) {
    mongoose.connect(MONGO_URI)
        .then(() => console.log('✅ MongoDB connected successfully to Atlas'))
        .catch(err => {
            console.error('❌ MongoDB connection error:', err.message);
            console.log('💡 Tip: Ensure your IP is whitelisted in MongoDB Atlas and credentials are correct.');
            console.log('⚠️ Server will continue in in-memory demo mode.');
        });
} else {
    console.log('⚠️ MONGO_URI is not set or points to localhost.');
    console.log('⚠️ Running in in-memory demo mode. Data will not persist across restarts.');
}

// Models
const User = require('./models/User');
const FoodListing = require('./models/FoodListing');

// Helper: Check if the database is connected and ready
function isDbReady() {
    return mongoose.connection.readyState === 1;
}

// Demo In-memory store
let memFoods = [
    {
        _id: 'demo-1',
        restaurantId: 'demo-rest',
        restaurantName: 'The Marble Cafe',
        foodName: 'Artisan Pastries',
        quantity: '4 boxes',
        price: 0,
        description: 'Freshly baked croissants and muffins. perfectly delicious!',
        latitude: 19.0760,
        longitude: 72.8777,
        pickupTime: '21:00',
        contactNumber: '9876543210',
        isClaimed: false,
        expiryDate: new Date(+new Date() + 24 * 60 * 60 * 1000),
        createdAt: new Date()
    }
];
let memUsers = [];

// Bug 2 Fix: Input validation helper for food listings.
// Previously, req.body was passed directly to Mongoose, causing confusing
// validation errors or allowing arbitrary fields.
const REQUIRED_FOOD_FIELDS = [
    'foodName', 'quantity', 'price', 'latitude', 'longitude',
    'pickupTime', 'contactNumber', 'restaurantId', 'restaurantName'
];

function validateFoodPayload(body) {
    const missing = REQUIRED_FOOD_FIELDS.filter(field => {
        const val = body[field];
        return val === undefined || val === null || val === '';
    });

    if (missing.length > 0) {
        return { valid: false, missing };
    }

    // Type checks
    if (typeof body.price !== 'number' && isNaN(Number(body.price))) {
        return { valid: false, error: 'price must be a valid number' };
    }
    if (isNaN(Number(body.latitude)) || isNaN(Number(body.longitude))) {
        return { valid: false, error: 'latitude and longitude must be valid numbers' };
    }

    return { valid: true };
}

// Routes
app.get('/', (req, res) => {
    res.send('Food Rescue Map API is running');
});

// Create a new food listing
app.post('/api/add-food', async (req, res) => {
    try {
        // Bug 2 Fix: Validate required fields before creating the document
        const validation = validateFoodPayload(req.body);
        if (!validation.valid) {
            const message = validation.missing
                ? `Missing required fields: ${validation.missing.join(', ')}`
                : validation.error;
            return res.status(400).json({ message });
        }

        // Bug 5 Fix: Add in-memory fallback for writes (consistent with reads)
        if (!isDbReady()) {
            console.log('⚠️ Database not ready, saving to in-memory store');
            const newFood = {
                _id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                ...req.body,
                price: Number(req.body.price),
                latitude: Number(req.body.latitude),
                longitude: Number(req.body.longitude),
                isClaimed: false,
                claimedBy: null,
                expiryDate: new Date(+new Date() + 24 * 60 * 60 * 1000),
                createdAt: new Date(),
                updatedAt: new Date()
            };
            memFoods.push(newFood);
            return res.status(201).json(newFood);
        }

        const newFood = new FoodListing(req.body);
        const savedFood = await newFood.save();
        res.status(201).json(savedFood);
    } catch (error) {
        console.error('Error adding food:', error);
        res.status(500).json({ message: 'Failed to add food listing', error: error.message });
    }
});

// Get all active food listings (not claimed and not expired)
app.get('/api/foods', async (req, res) => {
    try {
        if (!isDbReady()) {
            // Bug 4 Fix: Filter expired items in-memory (previously only filtered isClaimed)
            const now = new Date();
            const active = memFoods.filter(f =>
                !f.isClaimed && (!f.expiryDate || f.expiryDate > now)
            );
            return res.status(200).json(active);
        }
        const foods = await FoodListing.find({
            isClaimed: false,
            expiryDate: { $gt: new Date() }
        });
        res.status(200).json(foods);
    } catch (error) {
        console.error('Error fetching foods:', error);
        res.status(500).json({ message: 'Failed to fetch food listings', error: error.message });
    }
});

// Sync user from Firebase (optional but good for tracking roles)
app.post('/api/users', async (req, res) => {
    try {
        if (!isDbReady()) {
            console.log('⚠️ Database not ready for user sync');
            return res.status(503).json({
                message: 'Database not ready',
                detail: 'Please check MongoDB Atlas connection and IP whitelist.'
            });
        }
        const { id, name, email, phone, role } = req.body;

        // Check if user already exists
        let user = await User.findOne({ id });
        if (!user) {
            user = new User({ id, name, email, phone, role });
            await user.save();
        }

        res.status(200).json(user);
    } catch (error) {
        console.error('Error syncing user:', error);
        res.status(500).json({ message: 'Failed to sync user', error: error.message });
    }
});

// Claim a food listing
app.patch('/api/foods/:id/claim', async (req, res) => {
    try {
        const { userId } = req.body;
        const foodId = req.params.id;

        if (!userId) {
            return res.status(400).json({ message: 'userId is required to claim food' });
        }

        if (!isDbReady()) {
            const food = memFoods.find(f => f._id === foodId);
            if (!food) return res.status(404).json({ message: 'Food not found' });
            if (food.isClaimed) return res.status(400).json({ message: 'Already claimed' });
            food.isClaimed = true;
            food.claimedBy = userId;
            return res.status(200).json(food);
        }

        // Bug 3 Fix: Use atomic findOneAndUpdate to prevent race condition.
        // Previously used findById → check → save, which allowed two simultaneous
        // requests to both read isClaimed: false and both succeed.
        const food = await FoodListing.findOneAndUpdate(
            { _id: foodId, isClaimed: false },
            { $set: { isClaimed: true, claimedBy: userId } },
            { new: true }
        );

        if (!food) {
            // Either the food doesn't exist or it was already claimed
            const exists = await FoodListing.findById(foodId);
            if (!exists) {
                return res.status(404).json({ message: 'Food listing not found' });
            }
            return res.status(400).json({ message: 'Already claimed' });
        }

        res.status(200).json(food);
    } catch (error) {
        res.status(500).json({ message: 'Claim failed', error: error.message });
    }
});

// Get user's active claims
app.get('/api/foods/my-claims/:userId', async (req, res) => {
    try {
        if (!isDbReady()) {
            const foods = memFoods.filter(f => f.claimedBy === req.params.userId);
            return res.status(200).json(foods);
        }
        const foods = await FoodListing.find({ claimedBy: req.params.userId });
        res.status(200).json(foods);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch claims', error: error.message });
    }
});

// Get restaurant's postings
app.get('/api/foods/my-postings/:restaurantId', async (req, res) => {
    try {
        if (!isDbReady()) {
            const foods = memFoods.filter(f => f.restaurantId === req.params.restaurantId);
            return res.status(200).json(foods);
        }
        const foods = await FoodListing.find({ restaurantId: req.params.restaurantId });
        res.status(200).json(foods);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch postings', error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
