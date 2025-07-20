const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const mongoose = require('mongoose');
const Artwork = require('../models/Artwork');

async function fixDuplicateSlugs() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Find all artworks with slugs
    const artworks = await Artwork.find({ 'seo.slug': { $exists: true } }).sort({ createdAt: 1 });
    console.log(`Found ${artworks.length} artworks with slugs`);

    // Track slugs to find duplicates
    const slugMap = new Map();
    const duplicates = [];

    // Find duplicates
    for (const artwork of artworks) {
      const slug = artwork.seo.slug;
      if (slugMap.has(slug)) {
        duplicates.push(artwork);
      } else {
        slugMap.set(slug, artwork._id);
      }
    }

    console.log(`Found ${duplicates.length} duplicate slugs`);

    // Fix duplicates
    for (const artwork of duplicates) {
      const baseSlug = artwork.seo.slug;
      let newSlug = baseSlug;
      let counter = 1;

      // Generate unique slug
      while (true) {
        const exists = await Artwork.findOne({
          'seo.slug': newSlug,
          _id: { $ne: artwork._id }
        });

        if (!exists) {
          break;
        }

        counter++;
        newSlug = `${baseSlug}-${counter}`;
      }

      // Update the artwork with new slug
      artwork.seo.slug = newSlug;
      await artwork.save();
      console.log(`Updated artwork "${artwork.title}" slug: ${baseSlug} → ${newSlug}`);
    }

    console.log('✓ All duplicate slugs have been fixed');

    // Verify no duplicates remain
    const verification = await Artwork.aggregate([
      { $match: { 'seo.slug': { $exists: true } } },
      { $group: { _id: '$seo.slug', count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ]);

    if (verification.length > 0) {
      console.error('⚠️  WARNING: Some duplicates still exist:', verification);
    } else {
      console.log('✓ Verification passed: No duplicate slugs found');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✓ Disconnected from MongoDB');
  }
}

// Run the script
fixDuplicateSlugs();