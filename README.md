# TAWAAF APP

A modern, comprehensive Islamic application built with Node.js and Express.js, designed to support Hajj and Umrah pilgrims with essential digital services.

## Overview

Tawaaf App provides:

- Accurate prayer times based on user location
- Real-time weather updates for Saudi Arabia
- Digital identity and QR code profiles
- Health and visa status tracking
- Emergency contact and local amenities info
- Multi-language support (Arabic & English)

## Features

### Prayer Times

- Location-based, precise prayer calculations (Umm Al-Qura method)
- Automatic timezone detection
- 12-hour formatted times
- Qibla direction

### Weather Information

- Real-time weather via Tomorrow.io API
- Current conditions, daily/hourly forecasts
- Temperature, wind, humidity, and icons
- Smart caching for performance

### User Management

- JWT authentication & secure registration
- Email verification and password reset
- QR code digital profiles
- Photo upload & profile management
- Health and visa info tracking
- Emergency contacts & tourism company details

### Security

- Password hashing (bcrypt)
- JWT with expiration
- Rate limiting (500 req/5min/IP)
- Secure file upload & input validation
- Helmet.js, CORS, trust proxy

### Additional

- Automated email notifications
- Cloudinary image storage
- MongoDB (Mongoose ODM)
- RESTful API
- Error handling & logging
- Cron jobs for visa expiration
- Emergency services by city
- Location-based amenities (restaurants, hotels, etc.)

## Project Structure

```
├── Controllers/     # Business logic
├── Model/           # Mongoose schemas
├── Routes/          # API endpoints
├── Middleware/      # Custom middleware
├── Utils/           # Helpers & validators
├── Templates/       # Email/profile templates
├── app.js           # App entry point
├── vercel.json      # Deployment config
└── package.json     # Dependencies
```

## Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Mongoose)
- **Auth:** JWT, bcrypt
- **File Storage:** Cloudinary
- **APIs:** Tomorrow.io, Adhan.js
- **Security:** Helmet.js, CORS, Rate Limiting
- **Docs:** Postman

## Getting Started

### Prerequisites

- Node.js v14+
- npm
- MongoDB
- Cloudinary account
- Tomorrow.io API key
- Gmail (for email notifications)

### Installation

1. Clone the repo:

   ```bash
   git clone https://github.com/ADIMYY/Tawaf.git
   cd Tawaf
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure environment variables in `config.env`:

   ```env
   PORT=3000
   NODE_ENV=development
   DATA_BASE=your_mongodb_connection_string
   DB_PASSWORD=your_mongodb_password
   JWT_SECRET_KEY=your_jwt_secret
   JWT_EXPIRE_TIME=90d
   CLOUD_NAME=your_cloudinary_cloud_name
   API_KEY=your_cloudinary_api_key
   API_SECRET=your_cloudinary_api_secret
   WEATHER_API_KEY=your_tomorrow_io_api_key
   ```

4. Start the server:

   ```bash
   # Development
   npm run start:dev

   # Production
   npm start
   ```

## API Documentation

Full API docs: [Postman Collection](https://documenter.getpostman.com/view/30662537/2sAYBYgVyB)

### Main Endpoints

- **Auth:** `/api/v1/auth` (signup, login, password reset)
- **Users:** `/api/v1/users` (profile, update, delete)
- **Weather:** `/api/v1/weather/:lat/:lon`
- **Prayer Times:** `/api/v1/prayTimes/:lat/:lon`
- **Data Access:** `/api/v1/get-data` (QR code, passport lookup)
- **Emergency:** `/api/v1/emergency` (city filter, contacts)
- **Cron Jobs:** `/api/v1/cronJob/deleteExpiredVisaUsers`

## Error Handling & Rate Limiting

- Comprehensive error responses (validation, auth, not found, server)
- 500 requests/5min/IP (X-RateLimit headers)

## Development

- Run tests: `npm test`
- Code style: Airbnb JavaScript Style Guide

## Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/YourFeature`)
3. Commit (`git commit -m 'Add YourFeature'`)
4. Push (`git push origin feature/YourFeature`)
5. Open a Pull Request

## Support

- Email: support@tawaafapp.com
- Or open a GitHub issue

## Acknowledgments

- Tomorrow.io (weather)
- Adhan.js (prayer times)
- Cloudinary (image hosting)
- MongoDB Atlas (database)
