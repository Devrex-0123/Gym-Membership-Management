// seed.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Staff = require('./models/Staff');
const Settings = require('./models/Settings');

dotenv.config();
mongoose.connect(process.env.MONGO_URI);

const seedData = async () => {
    try {
        // 1. Create Default Admin (Password: admin123)
        const adminExists = await Staff.findOne({ username: 'admin' });
        if (!adminExists) {
            await Staff.create({
                username: 'admin',
                password: 'admin123',
                full_name: 'Gym Owner',
                role: 'admin'
            });
            console.log('✅ Admin created');
        }

        // 2. Create Default Settings (Pricing)
        const settingsExists = await Settings.findOne();
        if (!settingsExists) {
            await Settings.create({
                gym_name: 'My Local Gym',
                walk_in_rates: [
                    { category_name: 'Morning Promo', price: 50 },
                    { category_name: 'Afternoon Student', price: 80 },
                    { category_name: 'Afternoon Regular', price: 100 }
                ],
                membership_rates: [
                    { package_name: 'Monthly', duration_days: 30, price: 1500 },
                    { package_name: '3-Months', duration_days: 90, price: 4000 },
                    { package_name: 'Yearly', duration_days: 365, price: 15000 }
                ]
            });
            console.log('✅ Settings created');
        }

        console.log('🎉 Data Seeded!');
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

seedData();