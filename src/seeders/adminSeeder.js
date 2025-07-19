const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const mongoose = require('mongoose');
const User = require('../models/User');

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const adminExists = await User.findOne({ role: 'admin' });
    
    if (!adminExists) {
      const admin = new User({
        email: 'admin@mirtaaguilar.art',
        password: 'admin123456', // Change this!
        name: 'Administrador',
        role: 'admin',
        isActive: true
      });
      
      await admin.save();
      console.log('Admin user created successfully');
      console.log('Email: admin@mirtaaguilar.art');
      console.log('Password: admin123456 (Please change this!)');
    } else {
      console.log('Admin user already exists');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();