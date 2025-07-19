const mongoose = require('mongoose');

const newsletterSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  name: String,
  status: {
    type: String,
    enum: ['active', 'unsubscribed', 'bounced'],
    default: 'active',
    index: true
  },
  subscribedAt: {
    type: Date,
    default: Date.now
  },
  unsubscribedAt: Date,
  source: {
    type: String,
    enum: ['website', 'admin', 'import'],
    default: 'website'
  },
  tags: [String],
  preferences: {
    newArtworks: {
      type: Boolean,
      default: true
    },
    exhibitions: {
      type: Boolean,
      default: true
    },
    promotions: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

const Newsletter = mongoose.model('Newsletter', newsletterSchema);

module.exports = Newsletter;