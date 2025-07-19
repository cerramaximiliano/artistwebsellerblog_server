const Contact = require('../models/Contact');
const Newsletter = require('../models/Newsletter');
const nodemailer = require('nodemailer');
const { sendSuccess, sendError, sendPaginatedResponse } = require('../utils/responseHandler');

// Configure email transporter
let transporter = null;

// Only configure transporter if email credentials are properly set
// For now, disable email sending to avoid errors
const isEmailConfigured = process.env.EMAIL_USER && 
                         process.env.EMAIL_PASS && 
                         process.env.EMAIL_USER !== 'your_email_here' &&
                         process.env.EMAIL_PASS !== 'your_app_password_here';

if (isEmailConfigured) {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  console.log('Email transporter configured successfully');
} else {
  console.log('Email service disabled - credentials not configured');
}

// Send contact message
const sendContactMessage = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    
    // Save to database
    const contact = new Contact({
      name,
      email,
      phone,
      subject,
      message,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
    
    await contact.save();
    
    // Send email notification to admin if transporter is configured
    if (transporter) {
      try {
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: process.env.EMAIL_USER, // Send to admin
          subject: `Nuevo mensaje de contacto: ${subject}`,
          html: `
            <h3>Nuevo mensaje de contacto</h3>
            <p><strong>Nombre:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Teléfono:</strong> ${phone || 'No proporcionado'}</p>
            <p><strong>Asunto:</strong> ${subject}</p>
            <p><strong>Mensaje:</strong></p>
            <p>${message}</p>
          `
        };
        
        await transporter.sendMail(mailOptions);
      } catch (emailError) {
        console.log('Email notification skipped - email service not configured');
        // Continue execution - email is optional
      }
    }
    
    sendSuccess(res, null, 'Mensaje enviado exitosamente');
  } catch (error) {
    sendError(res, error, 500);
  }
};

// Subscribe to newsletter
const subscribeNewsletter = async (req, res) => {
  try {
    const { email, name } = req.body;
    
    // Validate email exists
    if (!email) {
      return sendError(res, { message: 'Email es requerido' }, 400);
    }
    
    // Check if already subscribed
    const existing = await Newsletter.findOne({ email });
    
    if (existing) {
      if (existing.status === 'active') {
        // Already active - return success without error
        return sendSuccess(res, { 
          email: existing.email,
          status: 'already_subscribed'
        }, 'Ya estás suscrito a nuestro newsletter');
      } else {
        // Reactivate subscription
        existing.status = 'active';
        existing.subscribedAt = new Date();
        existing.unsubscribedAt = null;
        await existing.save();
        return sendSuccess(res, { 
          email: existing.email,
          status: 'reactivated'
        }, 'Tu suscripción ha sido reactivada exitosamente');
      }
    }
    
    // Create new subscription
    const newsletter = new Newsletter({
      email,
      name,
      source: 'website'
    });
    
    await newsletter.save();
    
    // Send welcome email if transporter is configured
    if (transporter) {
      try {
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'Bienvenido a nuestro newsletter',
          html: `
            <h2>¡Gracias por suscribirte!</h2>
            <p>Hola ${name || 'Suscriptor'},</p>
            <p>Te mantendremos informado sobre nuevas obras, exposiciones y promociones exclusivas.</p>
            <p>Si deseas cancelar tu suscripción, puedes hacerlo en cualquier momento.</p>
            <br>
            <p>Saludos,<br>Mirta Susana Aguilar</p>
          `
        };
        
        await transporter.sendMail(mailOptions);
      } catch (emailError) {
        console.log('Welcome email skipped - email service not configured');
        // Continue execution - email is optional
      }
    }
    
    sendSuccess(res, { 
      email: newsletter.email,
      status: 'subscribed'
    }, 'Suscripción exitosa');
  } catch (error) {
    console.error('Error in subscribeNewsletter:', error);
    // Ensure we always send a response
    if (!res.headersSent) {
      sendError(res, error, 500);
    }
  }
};

// Unsubscribe from newsletter
const unsubscribeNewsletter = async (req, res) => {
  try {
    const { email } = req.params;
    
    const subscriber = await Newsletter.findOne({ email });
    
    if (!subscriber) {
      return sendError(res, { message: 'Email no encontrado' }, 404);
    }
    
    subscriber.status = 'unsubscribed';
    subscriber.unsubscribedAt = new Date();
    await subscriber.save();
    
    sendSuccess(res, null, 'Desuscripción exitosa');
  } catch (error) {
    sendError(res, error, 500);
  }
};

// Get newsletter subscribers (admin)
const getSubscribers = async (req, res) => {
  try {
    const { status = 'active', limit = 50, offset = 0 } = req.query;
    
    let query = {};
    if (status) {
      query.status = status;
    }
    
    const [subscribers, total] = await Promise.all([
      Newsletter.find(query)
        .sort({ subscribedAt: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(offset)),
      Newsletter.countDocuments(query)
    ]);
    
    const pagination = {
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      pages: Math.ceil(total / limit),
      currentPage: Math.floor(offset / limit) + 1
    };
    
    sendPaginatedResponse(res, subscribers, pagination);
  } catch (error) {
    sendError(res, error, 500);
  }
};

// Get all contact messages (admin)
const getContactMessages = async (req, res) => {
  try {
    const { status, limit = 20, offset = 0 } = req.query;
    
    let query = {};
    if (status) {
      query.status = status;
    }
    
    const [messages, total] = await Promise.all([
      Contact.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(offset)),
      Contact.countDocuments(query)
    ]);
    
    const pagination = {
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      pages: Math.ceil(total / limit),
      currentPage: Math.floor(offset / limit) + 1
    };
    
    sendPaginatedResponse(res, messages, pagination);
  } catch (error) {
    sendError(res, error, 500);
  }
};

// Get single contact message (admin)
const getContactMessage = async (req, res) => {
  try {
    const message = await Contact.findById(req.params.id);
    
    if (!message) {
      return sendError(res, { message: 'Mensaje no encontrado' }, 404);
    }
    
    // Mark as read if it's new
    if (message.status === 'new') {
      message.status = 'read';
      await message.save();
    }
    
    sendSuccess(res, message);
  } catch (error) {
    sendError(res, error, 500);
  }
};

// Update contact message status (admin)
const updateContactStatus = async (req, res) => {
  try {
    const { status, notes, repliedBy } = req.body;
    
    const message = await Contact.findById(req.params.id);
    
    if (!message) {
      return sendError(res, { message: 'Mensaje no encontrado' }, 404);
    }
    
    message.status = status;
    if (notes) message.notes = notes;
    
    if (status === 'replied') {
      message.repliedAt = new Date();
      message.repliedBy = req.userId;
    }
    
    await message.save();
    
    sendSuccess(res, message, 'Estado actualizado exitosamente');
  } catch (error) {
    sendError(res, error, 500);
  }
};

// Delete contact message (admin)
const deleteContactMessage = async (req, res) => {
  try {
    const message = await Contact.findByIdAndDelete(req.params.id);
    
    if (!message) {
      return sendError(res, { message: 'Mensaje no encontrado' }, 404);
    }
    
    sendSuccess(res, null, 'Mensaje eliminado exitosamente');
  } catch (error) {
    sendError(res, error, 500);
  }
};

module.exports = {
  sendContactMessage,
  getContactMessages,
  getContactMessage,
  updateContactStatus,
  deleteContactMessage,
  subscribeNewsletter,
  unsubscribeNewsletter,
  getSubscribers
};