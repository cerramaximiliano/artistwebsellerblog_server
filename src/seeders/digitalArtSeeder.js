const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const mongoose = require('mongoose');
const DigitalArt = require('../models/DigitalArt');
const Artwork = require('../models/Artwork');

const digitalArtSamples = [
  {
    title: "Los Reyes - Versión Digital",
    originalTitle: "Los Reyes",
    artist: "Mirta Aguilar",
    version: "01",
    description: "Reinterpretación digital de la obra original 'Los Reyes'. Esta versión contemporánea mantiene la esencia y el poder visual del cuadro original, adaptado para un público joven que busca arte accesible y moderno para decorar sus espacios.",
    digitalTechnique: "Reinterpretación digital con técnicas mixtas",
    imageUrl: "https://res.cloudinary.com/dqyoeolib/image/upload/v1753545958/Los_Reyes_digital_01_vqbrmz.png",
    thumbnailUrl: "https://res.cloudinary.com/dqyoeolib/image/upload/c_thumb,w_400/v1753545958/Los_Reyes_digital_01_vqbrmz.png",
    mockupUrl: "https://res.cloudinary.com/dqyoeolib/image/upload/v1753545958/Los_Reyes_digital_mockup.png",
    productType: "lamina",
    sizes: [
      {
        size: "A4",
        dimensions: "21 x 29.7 cm",
        price: 15000,
        currency: "ARS",
        available: true
      },
      {
        size: "A3",
        dimensions: "29.7 x 42 cm",
        price: 25000,
        currency: "ARS",
        available: true
      },
      {
        size: "A2",
        dimensions: "42 x 59.4 cm",
        price: 35000,
        currency: "ARS",
        available: true
      }
    ],
    features: {
      paperType: "Papel fotográfico premium 250g",
      printing: "Impresión giclée de alta calidad",
      edition: "Edición abierta",
      signedAvailable: true
    },
    category: "digital",
    tags: ["reinterpretación", "moderno", "decorativo", "juvenil", "abstracto"],
    available: true,
    featured: true
  },
  {
    title: "Composición Abstracta - Edición Digital",
    originalTitle: "Composición Abstracta",
    artist: "Mirta Aguilar",
    version: "01",
    description: "Versión digital vibrante de la obra original. Los colores han sido intensificados digitalmente para crear una pieza impactante ideal para espacios modernos.",
    digitalTechnique: "Edición digital con realce de colores",
    imageUrl: "https://res.cloudinary.com/dqyoeolib/image/upload/v1753545958/Composicion_Abstracta_digital_01.png",
    thumbnailUrl: "https://res.cloudinary.com/dqyoeolib/image/upload/c_thumb,w_400/v1753545958/Composicion_Abstracta_digital_01.png",
    productType: "lamina",
    sizes: [
      {
        size: "A4",
        dimensions: "21 x 29.7 cm",
        price: 12000,
        currency: "ARS",
        available: true
      },
      {
        size: "A3",
        dimensions: "29.7 x 42 cm",
        price: 20000,
        currency: "ARS",
        available: true
      }
    ],
    features: {
      paperType: "Papel fotográfico premium 250g",
      printing: "Impresión giclée de alta calidad",
      edition: "Edición abierta",
      signedAvailable: true
    },
    category: "digital",
    tags: ["abstracto", "colorido", "moderno", "decorativo"],
    available: true,
    featured: false
  },
  {
    title: "Mujer con Sombrero - Remix Digital",
    originalTitle: "Mujer con Sombrero",
    artist: "Mirta Aguilar",
    version: "02",
    description: "Interpretación contemporánea de la clásica 'Mujer con Sombrero'. Esta versión digital juega con nuevas texturas y patrones mientras mantiene la elegancia del original.",
    digitalTechnique: "Collage digital y técnicas mixtas",
    imageUrl: "https://res.cloudinary.com/dqyoeolib/image/upload/v1753545958/Mujer_Sombrero_digital_02.png",
    thumbnailUrl: "https://res.cloudinary.com/dqyoeolib/image/upload/c_thumb,w_400/v1753545958/Mujer_Sombrero_digital_02.png",
    productType: "poster",
    sizes: [
      {
        size: "30x40cm",
        dimensions: "30 x 40 cm",
        price: 18000,
        currency: "ARS",
        available: true
      },
      {
        size: "50x70cm",
        dimensions: "50 x 70 cm",
        price: 28000,
        currency: "ARS",
        available: true
      }
    ],
    features: {
      paperType: "Papel mate premium 200g",
      printing: "Impresión digital de alta definición",
      edition: "Edición limitada - 100 copias",
      signedAvailable: false
    },
    category: "digital",
    tags: ["retrato", "femenino", "elegante", "remix", "contemporáneo"],
    available: true,
    featured: true
  }
];

async function seedDigitalArt() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Clear existing digital art
    await DigitalArt.deleteMany({});
    console.log('✓ Cleared existing digital art');

    // Get some original artworks to link
    const artworks = await Artwork.find().limit(3);
    
    if (artworks.length === 0) {
      console.error('⚠️  No artworks found. Please run artwork seeder first.');
      process.exit(1);
    }

    // Create digital art with links to original artworks
    const digitalArtToCreate = digitalArtSamples.map((sample, index) => {
      const artwork = artworks[index % artworks.length];
      return {
        ...sample,
        originalArtworkId: artwork._id,
        originalTitle: artwork.title || sample.originalTitle
      };
    });

    // Insert digital art
    const createdDigitalArt = await DigitalArt.insertMany(digitalArtToCreate);
    console.log(`✓ Created ${createdDigitalArt.length} digital artworks`);

    // Display created items
    console.log('\nCreated Digital Artworks:');
    createdDigitalArt.forEach(art => {
      console.log(`- ${art.title} (${art.productType}) - ${art.sizes.length} sizes available`);
    });

  } catch (error) {
    console.error('Error seeding digital art:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✓ Disconnected from MongoDB');
  }
}

// Run the seeder
seedDigitalArt();