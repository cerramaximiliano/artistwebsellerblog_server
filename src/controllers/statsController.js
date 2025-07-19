const Order = require('../models/Order');
const Artwork = require('../models/Artwork');
const User = require('../models/User');
const Contact = require('../models/Contact');
const { sendSuccess, sendError } = require('../utils/responseHandler');

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    const [
      totalArtworks,
      availableArtworks,
      soldArtworks,
      totalOrders,
      pendingOrders,
      completedOrders,
      totalUsers,
      totalRevenue
    ] = await Promise.all([
      Artwork.countDocuments(),
      Artwork.countDocuments({ 'status.isAvailable': true, 'status.isSold': false }),
      Artwork.countDocuments({ 'status.isSold': true }),
      Order.countDocuments(),
      Order.countDocuments({ status: 'pending' }),
      Order.countDocuments({ status: { $in: ['paid', 'delivered'] } }),
      User.countDocuments({ role: 'customer' }),
      Order.aggregate([
        { $match: { status: { $in: ['paid', 'delivered'] } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ])
    ]);

    const stats = {
      artworks: {
        total: totalArtworks,
        available: availableArtworks,
        sold: soldArtworks
      },
      orders: {
        total: totalOrders,
        pending: pendingOrders,
        completed: completedOrders
      },
      users: {
        total: totalUsers
      },
      revenue: {
        total: totalRevenue[0]?.total || 0
      }
    };

    sendSuccess(res, stats);
  } catch (error) {
    sendError(res, error, 500);
  }
};

// Get sales statistics
const getSalesStats = async (req, res) => {
  try {
    const { period = '30days' } = req.query;
    
    let dateFilter = {};
    const now = new Date();
    
    switch (period) {
      case '7days':
        dateFilter = { $gte: new Date(now.setDate(now.getDate() - 7)) };
        break;
      case '30days':
        dateFilter = { $gte: new Date(now.setDate(now.getDate() - 30)) };
        break;
      case '90days':
        dateFilter = { $gte: new Date(now.setDate(now.getDate() - 90)) };
        break;
      case 'year':
        dateFilter = { $gte: new Date(now.setFullYear(now.getFullYear() - 1)) };
        break;
    }

    // Sales by day
    const salesByDay = await Order.aggregate([
      { 
        $match: { 
          status: { $in: ['paid', 'delivered'] },
          createdAt: dateFilter 
        } 
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          revenue: { $sum: '$total' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Top selling categories
    const topCategories = await Order.aggregate([
      { 
        $match: { 
          status: { $in: ['paid', 'delivered'] },
          createdAt: dateFilter 
        } 
      },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'artworks',
          localField: 'items.artwork',
          foreignField: '_id',
          as: 'artwork'
        }
      },
      { $unwind: '$artwork' },
      {
        $group: {
          _id: '$artwork.category',
          count: { $sum: 1 },
          revenue: { $sum: '$items.finalPrice' }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 }
    ]);

    sendSuccess(res, {
      salesByDay,
      topCategories
    });
  } catch (error) {
    sendError(res, error, 500);
  }
};

// Get artwork statistics
const getArtworkStats = async (req, res) => {
  try {
    // Most viewed artworks
    const mostViewed = await Artwork.find()
      .sort({ views: -1 })
      .limit(10)
      .select('title views images.main.url');

    // Most liked artworks
    const mostLiked = await Artwork.aggregate([
      {
        $project: {
          title: 1,
          'images.main.url': 1,
          likesCount: { $size: '$likes' }
        }
      },
      { $sort: { likesCount: -1 } },
      { $limit: 10 }
    ]);

    // Category distribution
    const categoryDistribution = await Artwork.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    sendSuccess(res, {
      mostViewed,
      mostLiked,
      categoryDistribution
    });
  } catch (error) {
    sendError(res, error, 500);
  }
};

module.exports = {
  getDashboardStats,
  getSalesStats,
  getArtworkStats
};