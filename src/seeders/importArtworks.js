const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const mongoose = require('mongoose');
const fs = require('fs');
const Artwork = require('../models/Artwork');

const importArtworks = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Read artworks data
    const artworksPath = path.join(__dirname, '..', 'data', 'artworks.json');
    const artworksData = JSON.parse(fs.readFileSync(artworksPath, 'utf8'));
    console.log(`Found ${artworksData.length} artworks to import`);

    let imported = 0;
    let updated = 0;
    let errors = 0;

    // Process each artwork
    for (const artwork of artworksData) {
      try {
        // Transform the data to match our Artwork model
        const artworkDocument = {
          title: artwork.title,
          artist: artwork.artist,
          description: artwork.description,
          year: artwork.year,
          technique: artwork.technique,
          dimensions: artwork.dimensions,
          category: artwork.category,
          
          // Images
          images: {
            main: {
              url: artwork.imageUrl,
              publicId: extractCloudinaryPublicId(artwork.imageUrl)
            },
            thumbnail: {
              url: artwork.thumbnailUrl,
              publicId: extractCloudinaryPublicId(artwork.thumbnailUrl)
            },
            gallery: []
          },
          
          // Pricing
          pricing: {
            basePrice: artwork.price,
            currency: 'ARS',
            hasDiscount: false,
            discount: 0,
            discountType: 'percentage',
            finalPrice: artwork.price
          },
          
          // Status
          status: {
            isAvailable: artwork.available,
            isSold: false,
            isReserved: false
          },
          
          // Additional fields
          tags: [],
          featured: false,
          views: 0,
          likes: [],
          
          // SEO
          seo: {
            metaTitle: artwork.title,
            metaDescription: artwork.description,
            slug: generateSlug(artwork.title)
          }
        };

        // Check if artwork with same title exists
        const existingArtwork = await Artwork.findOne({ title: artwork.title });
        
        if (existingArtwork) {
          // Update existing artwork
          await Artwork.findByIdAndUpdate(existingArtwork._id, artworkDocument);
          updated++;
          console.log(`✓ Updated: ${artwork.title}`);
        } else {
          // Create new artwork
          const newArtwork = new Artwork(artworkDocument);
          await newArtwork.save();
          imported++;
          console.log(`✓ Imported: ${artwork.title}`);
        }
        
      } catch (error) {
        errors++;
        console.error(`✗ Error with "${artwork.title}":`, error.message);
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Import Summary:');
    console.log(`✅ Imported: ${imported} new artworks`);
    console.log(`🔄 Updated: ${updated} existing artworks`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📊 Total processed: ${artworksData.length}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
};

// Helper function to extract Cloudinary public ID from URL
function extractCloudinaryPublicId(url) {
  if (!url) return null;
  
  // Extract the public ID from Cloudinary URL
  const matches = url.match(/\/v\d+\/(.+)\./);
  return matches ? matches[1] : null;
}

// Helper function to generate URL-friendly slug
function generateSlug(title) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .substring(0, 50); // Limit length
}

importArtworks();