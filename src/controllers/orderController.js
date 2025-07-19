const Order = require('../models/Order');
const Artwork = require('../models/Artwork');
const { sendSuccess, sendError, sendPaginatedResponse } = require('../utils/responseHandler');

// Create new order
const createOrder = async (req, res) => {
  try {
    const { items, customer, shipping, payment } = req.body;

    // Validate artworks availability
    const artworkIds = items.map(item => item.artwork);
    const artworks = await Artwork.find({ _id: { $in: artworkIds } });
    
    // Check all artworks are available
    for (const artwork of artworks) {
      if (!artwork.status.isAvailable || artwork.status.isSold) {
        return sendError(res, { 
          message: `La obra "${artwork.title}" no está disponible` 
        }, 400);
      }
    }

    // Calculate totals
    let subtotal = 0;
    let discountTotal = 0;
    const orderItems = [];

    for (const item of items) {
      const artwork = artworks.find(a => a._id.toString() === item.artwork);
      const itemTotal = artwork.pricing.finalPrice;
      const discount = artwork.pricing.hasDiscount ? artwork.pricing.discount : 0;
      
      subtotal += artwork.pricing.basePrice;
      discountTotal += artwork.pricing.basePrice - artwork.pricing.finalPrice;
      
      orderItems.push({
        artwork: artwork._id,
        title: artwork.title,
        artist: artwork.artist,
        price: artwork.pricing.basePrice,
        discount: discount,
        finalPrice: itemTotal
      });
    }

    const total = subtotal - discountTotal + (shipping.cost || 0);

    // Create order
    const order = new Order({
      customer: {
        ...customer,
        user: req.userId || undefined
      },
      items: orderItems,
      subtotal,
      discountTotal,
      shipping,
      total,
      payment,
      statusHistory: [{
        status: 'pending',
        date: new Date()
      }]
    });

    await order.save();

    // Mark artworks as reserved
    await Artwork.updateMany(
      { _id: { $in: artworkIds } },
      { 
        $set: { 
          'status.isReserved': true,
          'status.reservedBy': order.customer.user,
          'status.reservedUntil': new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        }
      }
    );

    sendSuccess(res, order, 'Orden creada exitosamente', 201);
  } catch (error) {
    sendError(res, error, 500);
  }
};

// Get all orders (admin)
const getOrders = async (req, res) => {
  try {
    const { status, limit = 20, offset = 0 } = req.query;
    
    let query = {};
    if (status) {
      query.status = status;
    }

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('items.artwork', 'title images.main.url')
        .populate('customer.user', 'name email')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(offset)),
      Order.countDocuments(query)
    ]);

    const pagination = {
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      pages: Math.ceil(total / limit),
      currentPage: Math.floor(offset / limit) + 1
    };

    sendPaginatedResponse(res, orders, pagination);
  } catch (error) {
    sendError(res, error, 500);
  }
};

// Get single order
const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.artwork')
      .populate('customer.user', 'name email phone address');

    if (!order) {
      return sendError(res, { message: 'Orden no encontrada' }, 404);
    }

    // Check if user can view this order
    if (req.user.role !== 'admin' && order.customer.user?.toString() !== req.userId) {
      return sendError(res, { message: 'No autorizado' }, 403);
    }

    sendSuccess(res, order);
  } catch (error) {
    sendError(res, error, 500);
  }
};

// Update order status (admin)
const updateOrderStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return sendError(res, { message: 'Orden no encontrada' }, 404);
    }

    // Update status
    order.status = status;
    order.statusHistory.push({
      status,
      date: new Date(),
      notes,
      updatedBy: req.userId
    });

    // If order is confirmed and paid, mark artworks as sold
    if (status === 'paid') {
      const artworkIds = order.items.map(item => item.artwork);
      await Artwork.updateMany(
        { _id: { $in: artworkIds } },
        { 
          $set: { 
            'status.isSold': true,
            'status.isAvailable': false,
            'status.isReserved': false,
            'status.soldDate': new Date(),
            'status.soldTo': order.customer.user
          }
        }
      );
    }

    // If order is cancelled, release artworks
    if (status === 'cancelled') {
      const artworkIds = order.items.map(item => item.artwork);
      await Artwork.updateMany(
        { _id: { $in: artworkIds } },
        { 
          $set: { 
            'status.isReserved': false,
            'status.reservedBy': null,
            'status.reservedUntil': null
          }
        }
      );
    }

    await order.save();
    
    sendSuccess(res, order, 'Estado de orden actualizado exitosamente');
  } catch (error) {
    sendError(res, error, 500);
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrder,
  updateOrderStatus
};