const mongoose = require('mongoose');
const FoodListing = require('../models/FoodListing');
require('dotenv').config();

async function runTest() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/food-rescue');
        console.log('Test: MongoDB connected');

        // 1. Create a dummy food listing
        const testFood = new FoodListing({
            restaurantId: 'test-rest-id',
            restaurantName: 'Test Restaurant',
            foodName: 'Test Burger',
            quantity: '1',
            price: 0,
            latitude: 19.0,
            longitude: 72.0,
            pickupTime: '20:00',
            contactNumber: '1234567890'
        });
        const saved = await testFood.save();
        console.log('Test: Created dummy food', saved._id);

        // 2. Claim it
        saved.isClaimed = true;
        saved.claimedBy = 'test-user-id';
        await saved.save();
        console.log('Test: Claimed food');

        // 3. Verify
        const updated = await FoodListing.findById(saved._id);
        if (updated.isClaimed && updated.claimedBy === 'test-user-id') {
            console.log('✅ TEST PASSED: Food successfully claimed and database updated.');
        } else {
            console.log('❌ TEST FAILED: Verification failed.');
        }

        // Cleanup
        await FoodListing.findByIdAndDelete(saved._id);
        console.log('Test: Cleaned up dummy data');

        process.exit(0);
    } catch (err) {
        console.error('❌ TEST ERROR:', err);
        process.exit(1);
    }
}

runTest();
