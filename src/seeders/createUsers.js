const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const mongoose = require('mongoose');
const User = require('../models/User');

const createUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Define users to create
    const users = [
      {
        email: 'mirtasusana16@hotmail.com',
        password: 'Mila2018',
        name: 'Mirta Susana',
        role: 'admin',
        isActive: true
      },
      {
        email: 'cerramaximiliano@gmail.com',
        password: '988703za',
        name: 'Maximiliano Cerra',
        role: 'admin',
        isActive: true
      }
    ];

    // Create or update users
    for (const userData of users) {
      const existingUser = await User.findOne({ email: userData.email });
      
      if (existingUser) {
        // Update password if user exists
        existingUser.password = userData.password;
        existingUser.name = userData.name;
        existingUser.role = userData.role;
        existingUser.isActive = userData.isActive;
        await existingUser.save();
        console.log(`Usuario actualizado: ${userData.email}`);
      } else {
        // Create new user
        const newUser = new User(userData);
        await newUser.save();
        console.log(`Usuario creado: ${userData.email}`);
      }
    }

    console.log('\n✅ Usuarios creados/actualizados exitosamente');
    console.log('\nCredenciales:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email: mirtasusana16@hotmail.com');
    console.log('Password: Mila2018');
    console.log('Rol: admin');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email: cerramaximiliano@gmail.com');
    console.log('Password: 988703za');
    console.log('Rol: admin');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

createUsers();