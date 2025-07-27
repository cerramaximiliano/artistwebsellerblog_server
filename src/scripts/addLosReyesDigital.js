const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const mongoose = require('mongoose');
const DigitalArt = require('../models/DigitalArt');

const losReyesDigital = {
  title: 'Los Reyes - Versión Digital',
  originalArtworkId: '687cc12a14b35ed5f26563f2',
  originalTitle: 'Los Reyes',
  artist: 'Mirta Susana Aguilar',
  version: '01',
  description: 'Reinterpretación digital de la obra original "Los Reyes". Esta versión contemporánea mantiene la esencia y el poder visual del cuadro original, adaptado para un público joven que busca arte accesible y moderno para decorar sus espacios.',
  digitalTechnique: 'Reinterpretación digital con técnicas mixtas',
  imageUrl: 'https://res.cloudinary.com/dqyoeolib/image/upload/v1753545958/Los_Reyes_digital_01_vqbrmz.png',
  thumbnailUrl: 'https://res.cloudinary.com/dqyoeolib/image/upload/c_thumb,w_400/v1753545958/Los_Reyes_digital_01_vqbrmz.png',
  mockupUrl: null,
  productType: 'lamina',
  sizes: [
    {
      size: 'A4',
      dimensions: '21 x 29.7 cm',
      price: 15000,
      currency: 'ARS',
      available: true
    },
    {
      size: 'A3',
      dimensions: '29.7 x 42 cm',
      price: 25000,
      currency: 'ARS',
      available: true
    },
    {
      size: 'A2',
      dimensions: '42 x 59.4 cm',
      price: 35000,
      currency: 'ARS',
      available: true
    }
  ],
  features: {
    paperType: 'Papel fotográfico premium 250g',
    printing: 'Impresión giclée de alta calidad',
    edition: 'Edición abierta',
    signedAvailable: true
  },
  category: 'digital',
  tags: ['reinterpretación', 'moderno', 'decorativo', 'juvenil'],
  available: true,
  featured: true
};

async function addLosReyesDigital() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Check if it already exists
    const existing = await DigitalArt.findOne({ 
      title: losReyesDigital.title,
      version: losReyesDigital.version 
    });

    if (existing) {
      console.log('⚠️  "Los Reyes - Versión Digital" already exists in the database');
      console.log('   ID:', existing._id);
      console.log('   Created:', existing.createdAt);
      
      // Ask if should update
      console.log('\n❓ Do you want to update it with the new data? (Run with --update flag)');
      
      if (process.argv.includes('--update')) {
        Object.assign(existing, losReyesDigital);
        await existing.save();
        console.log('✓ Updated successfully');
      }
    } else {
      // Create new digital artwork
      const digitalArt = new DigitalArt(losReyesDigital);
      await digitalArt.save();
      
      console.log('✓ Created "Los Reyes - Versión Digital" successfully');
      console.log('\nDetails:');
      console.log('- ID:', digitalArt._id);
      console.log('- Title:', digitalArt.title);
      console.log('- Original Artwork ID:', digitalArt.originalArtworkId);
      console.log('- Sizes available:', digitalArt.sizes.length);
      console.log('- Tags:', digitalArt.tags.join(', '));
      console.log('- Featured:', digitalArt.featured);
      console.log('- Available:', digitalArt.available);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.name === 'ValidationError') {
      console.error('Validation errors:');
      Object.keys(error.errors).forEach(field => {
        console.error(`- ${field}: ${error.errors[field].message}`);
      });
    }
  } finally {
    await mongoose.disconnect();
    console.log('✓ Disconnected from MongoDB');
  }
}

// Run the script
addLosReyesDigital();