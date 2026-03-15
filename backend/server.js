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

if (!MONGO_URI || MONGO_URI.includes('localhost')) {
    console.log('⚠️ Warning: MONGO_URI is not set or points to localhost.');
    console.log('⚠️ Phase 2 requires a MongoDB Atlas connection string for persistent cloud storage.');
}

mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ MongoDB connected successfully to Atlas'))
    .catch(err => {
        console.error('❌ MongoDB connection error:', err.message);
        console.log('💡 Tip: Ensure your IP is whitelisted in MongoDB Atlas and credentials are correct.');
    });

// Models
const User = require('./models/User');
const FoodListing = require('./models/FoodListing');

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
        createdAt: new Date()
    }
];
let memUsers = [];

// Routes
app.get('/', (req, res) => {
    res.send('Food Rescue Map API is running');
});

// Real MongoDB routes (removed in-memory fallbacks for production state)

// Create a new food listing
app.post('/api/add-food', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            const states = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
            console.log(`⚠️ Request failed: Database is ${states[mongoose.connection.readyState] || 'unknown'}`);
            return res.status(503).json({ 
                message: 'Database not ready', 
                detail: `State: ${states[mongoose.connection.readyState] || mongoose.connection.readyState}. URI Present: ${!!process.env.MONGO_URI}`,
                tip: 'Check Render Environment Variables for MONGO_URI'
            });
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
        if (mongoose.connection.readyState !== 1) {
            // Filter expired and claimed in memory
            const now = new Date();
            const active = memFoods.filter(f => !f.isClaimed);
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
        if (mongoose.connection.readyState !== 1) {
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

        if (mongoose.connection.readyState !== 1) {
            const food = memFoods.find(f => f._id === foodId);
            if (!food) return res.status(404).json({ message: 'Food not found' });
            food.isClaimed = true;
            food.claimedBy = userId;
            return res.status(200).json(food);
        }

        const food = await FoodListing.findById(foodId);
        if (!food) return res.status(404).json({ message: 'Food listing not found' });
        if (food.isClaimed) return res.status(400).json({ message: 'Already claimed' });

        food.isClaimed = true;
        food.claimedBy = userId;
        await food.save();

        res.status(200).json(food);
    } catch (error) {
        res.status(500).json({ message: 'Claim failed', error: error.message });
    }
});

// Get user's active claims
app.get('/api/foods/my-claims/:userId', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
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
        if (mongoose.connection.readyState !== 1) {
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
