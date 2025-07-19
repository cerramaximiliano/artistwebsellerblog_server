# Artist Web Seller Blog - Backend

Backend server for Artist Web Seller Blog built with Express.js and MongoDB.

## Features

- 🔐 JWT Authentication
- 🎨 Artwork management with image upload
- 🛒 Order processing system
- 💳 Payment integration (Stripe & MercadoPago ready)
- 📧 Contact form and newsletter
- 📊 Admin statistics dashboard
- 🖼️ Cloudinary integration for images
- 📱 RESTful API

## Tech Stack

- Node.js & Express.js
- MongoDB with Mongoose
- JWT for authentication
- Cloudinary for image storage
- Nodemailer for emails
- Stripe & MercadoPago for payments

## Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/artistwebsellerblog_server.git
cd artistwebsellerblog_server
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Seed initial data
```bash
npm run seed:all
```

5. Start the server
```bash
npm run dev
```

## Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run seed:users` - Create initial users
- `npm run seed:artworks` - Import artworks data
- `npm run seed:siteinfo` - Create site information
- `npm run seed:all` - Run all seeders

## API Documentation

### Authentication
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/refresh`
- `GET /api/auth/me`

### Artworks
- `GET /api/artworks`
- `GET /api/artworks/:id`
- `POST /api/artworks` (admin)
- `PUT /api/artworks/:id` (admin)
- `DELETE /api/artworks/:id` (admin)

### Orders
- `POST /api/orders`
- `GET /api/orders` (admin)
- `GET /api/orders/:id`
- `PATCH /api/orders/:id/status` (admin)

### Contact & Newsletter
- `POST /api/contact`
- `POST /api/newsletter/subscribe`
- `DELETE /api/newsletter/unsubscribe/:email`

## Environment Variables

See `.env.example` for required environment variables.

## License

ISC

## Author

Created with 💖 by [Your Name]